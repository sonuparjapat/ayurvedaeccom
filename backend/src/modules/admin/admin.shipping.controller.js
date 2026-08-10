const pool = require('../../config/db')
const { emitToUser, emitToAdmin } = require('../../socket')

/* ── carrier tracking URL generator ─────────────────────────────── */
function getCarrierTrackingUrl(courierName, trackingNumber) {
  if (!trackingNumber) return null
  const carrier = (courierName || '').toLowerCase().trim()
  const t = encodeURIComponent(trackingNumber)
  const map = {
    'delhivery':       `https://www.delhivery.com/track/package/${t}`,
    'bluedart':        `https://www.bluedart.com/tracking?trackFor=0&TrackID=${t}`,
    'blue dart':       `https://www.bluedart.com/tracking?trackFor=0&TrackID=${t}`,
    'dtdc':            `https://www.dtdc.in/tracking.asp?TrackNo=${t}`,
    'shadowfax':       `https://shipper.shadowfax.in/track/${t}`,
    'ecom express':    `https://ecomexpress.in/tracking/?awb_field=${t}`,
    'fedex':           `https://www.fedex.com/en-in/tracking.html?tracknumbers=${t}`,
    'xpressbees':      `https://www.xpressbees.com/shipment/tracking?awbNo=${t}`,
    'shiprocket':      `https://shiprocket.co/tracking/${t}`,
    'ekart':           `https://ekartlogistics.com/shipment/details?trackId=${t}`,
    'amazon logistics':`https://track.amazon.in/tracking/${t}`,
    'india post':      `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/TrackConsignment.aspx#${t}`,
    'gati':            `https://www.gati.com/drs?docketno=${t}`,
    'rivigo':          `https://rivigo.com/tracking/${t}`,
    'safexpress':      `https://www.safexpress.com/tracking.html?awbno=${t}`,
    'professional':    `https://www.proship.in/track?awb=${t}`,
    'smartr':          `https://www.smartr.in/track?awb=${t}`,
  }
  return map[carrier] || null
}

/* ── Shiprocket status → internal status mapping ─────────────────── */
const SHIPROCKET_STATUS_MAP = {
  0:  { code: 'ORDER_PLACED',    label: 'Order Placed',       order_status: null },
  1:  { code: 'PENDING',         label: 'Pending',            order_status: null },
  2:  { code: 'MANIFESTED',      label: 'Manifested',         order_status: 3 },
  3:  { code: 'SHIPPED',         label: 'Shipped',            order_status: 3 },
  4:  { code: 'IN_TRANSIT',      label: 'In Transit',         order_status: 3 },
  5:  { code: 'OUT_FOR_DELIVERY',label: 'Out for Delivery',   order_status: 3 },
  6:  { code: 'DELIVERY_ATTEMPTED',label:'Delivery Attempted',order_status: 3 },
  7:  { code: 'DELIVERED',       label: 'Delivered',          order_status: 5 },
  8:  { code: 'RTO',             label: 'RTO Initiated',      order_status: null },
  9:  { code: 'LOST',            label: 'Lost',               order_status: null },
  10: { code: 'CANCELLED',       label: 'Cancelled',          order_status: 6 },
  14: { code: 'RTO_DELIVERED',   label: 'RTO Delivered',      order_status: null },
}

/* ── helpers ─────────────────────────────────────────────────────── */
async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const tokensRes = await pool.query(
      `SELECT token FROM push_tokens WHERE user_id=$1`, [userId]
    )
    if (!tokensRes.rowCount) return
    const { Expo } = require('expo-server-sdk')
    const expo = new Expo()
    const messages = tokensRes.rows
      .filter(r => Expo.isExpoPushToken(r.token))
      .map(r => ({ to: r.token, sound: 'default', title, body, data, priority: 'high' }))
    if (messages.length) await expo.sendPushNotificationsAsync(messages)
  } catch (e) {
    console.warn('[push]', e.message)
  }
}

/* =====================================
   UPDATE SHIPMENT DETAILS (AWB + Courier + EDD)
===================================== */
exports.updateShipment = async (req, res) => {
  try {
    const { id } = req.params
    const { courier_name, tracking_number, expected_delivery_date, notes } = req.body

    if (!courier_name || !tracking_number) {
      return res.status(400).json({ success: false, message: 'Courier name and tracking number are required' })
    }

    const orderRes = await pool.query(
      `SELECT status, user_id, courier_name AS old_courier, tracking_number AS old_awb
       FROM orders WHERE id=$1`, [id]
    )
    if (!orderRes.rowCount) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    const order = orderRes.rows[0]
    if (![1, 2, 3].includes(Number(order.status))) {
      return res.status(400).json({ success: false, message: 'Shipment can only be updated for Processing or Shipped orders' })
    }

    const tracking_url = getCarrierTrackingUrl(courier_name, tracking_number)
    const isFirstShipment = !order.old_awb

    await pool.query(
      `UPDATE orders SET
         courier_name=$1, tracking_number=$2, tracking_url=$3,
         expected_delivery_date=$4, shipped_at=COALESCE(shipped_at, NOW()),
         status=GREATEST(status::int, 3)::smallint
       WHERE id=$5`,
      [courier_name, tracking_number, tracking_url, expected_delivery_date || null, id]
    )

    // Auto-add shipment event
    const eventLabel = isFirstShipment ? 'Shipment Created' : 'Tracking Updated'
    const eventDesc = isFirstShipment
      ? `Order dispatched via ${courier_name}. AWB: ${tracking_number}`
      : `Tracking details updated. Courier: ${courier_name}, AWB: ${tracking_number}`
    await pool.query(
      `INSERT INTO shipment_events (order_id, status_code, status_label, description, source)
       VALUES ($1,'SHIPPED',$2,$3,'system')`,
      [id, eventLabel, eventDesc]
    )

    // Socket + push notification
    emitToUser(order.user_id, 'tracking_updated', {
      order_id: Number(id), courier_name, tracking_number, tracking_url,
    })
    if (isFirstShipment) {
      await sendPushToUser(
        order.user_id,
        'Your Order Has Been Shipped! 🚚',
        `Order #${id} is on its way via ${courier_name}. Track: ${tracking_number}`,
        { type: 'ORDER_SHIPPED', order_id: Number(id) }
      )
    }

    res.json({ success: true, message: 'Shipment updated', tracking_url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update shipment' })
  }
}

/* =====================================
   ADD MANUAL TRACKING EVENT
===================================== */
exports.addTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { status_code, status_label, description, location, event_time } = req.body

    if (!status_label) {
      return res.status(400).json({ success: false, message: 'status_label is required' })
    }

    const orderRes = await pool.query(`SELECT user_id FROM orders WHERE id=$1`, [id])
    if (!orderRes.rowCount) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const evTime = event_time ? new Date(event_time) : new Date()
    const result = await pool.query(
      `INSERT INTO shipment_events
         (order_id, status_code, status_label, description, location, event_time, source)
       VALUES ($1,$2,$3,$4,$5,$6,'manual') RETURNING *`,
      [id, status_code || 'MANUAL', status_label, description || null, location || null, evTime]
    )

    // Handle special statuses that update order columns
    if (status_code === 'OUT_FOR_DELIVERY') {
      await pool.query(`UPDATE orders SET out_for_delivery_at=NOW() WHERE id=$1`, [id])
      await sendPushToUser(
        orderRes.rows[0].user_id,
        'Out for Delivery! 📦',
        `Order #${id} is out for delivery. Be available to receive it.`,
        { type: 'OUT_FOR_DELIVERY', order_id: Number(id) }
      )
    } else if (status_code === 'DELIVERY_ATTEMPTED') {
      await pool.query(`UPDATE orders SET delivery_attempts=COALESCE(delivery_attempts,0)+1 WHERE id=$1`, [id])
      await sendPushToUser(
        orderRes.rows[0].user_id,
        'Delivery Attempted',
        `Delivery of Order #${id} was attempted but unsuccessful. ${description || ''}`.trim(),
        { type: 'DELIVERY_ATTEMPTED', order_id: Number(id) }
      )
    } else if (status_code === 'RTO') {
      await pool.query(`UPDATE orders SET rto_initiated_at=NOW() WHERE id=$1`, [id])
    }

    emitToUser(orderRes.rows[0].user_id, 'shipment_event', {
      order_id: Number(id), event: result.rows[0],
    })

    res.json({ success: true, event: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to add event' })
  }
}

/* =====================================
   GET SHIPMENT EVENTS FOR AN ORDER
===================================== */
exports.getShipmentEvents = async (req, res) => {
  try {
    const { id } = req.params
    const eventsRes = await pool.query(
      `SELECT se.*, o.courier_name, o.tracking_number, o.tracking_url,
              o.expected_delivery_date, o.shipped_at, o.out_for_delivery_at,
              o.delivered_at, o.delivery_attempts, o.rto_initiated_at
       FROM shipment_events se
       JOIN orders o ON o.id=se.order_id
       WHERE se.order_id=$1
       ORDER BY se.event_time ASC, se.id ASC`,
      [id]
    )
    const orderRes = await pool.query(
      `SELECT courier_name, tracking_number, tracking_url, expected_delivery_date,
              shipped_at, out_for_delivery_at, delivered_at, delivery_attempts,
              rto_initiated_at, status
       FROM orders WHERE id=$1`, [id]
    )
    res.json({
      success: true,
      events: eventsRes.rows,
      shipment: orderRes.rows[0] || null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to get tracking events' })
  }
}

/* =====================================
   GET IN-TRANSIT ORDERS (tracking dashboard)
===================================== */
exports.getInTransitOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    const offset = (page - 1) * limit

    let where = `WHERE o.status=3 AND o.tracking_number IS NOT NULL`
    const vals = []
    let idx = 1
    if (search) {
      where += ` AND (o.id::TEXT ILIKE $${idx} OR o.tracking_number ILIKE $${idx} OR u.name ILIKE $${idx})`
      vals.push(`%${search}%`)
      idx++
    }

    const data = await pool.query(
      `SELECT o.id, o.tracking_number, o.courier_name, o.tracking_url,
              o.expected_delivery_date, o.shipped_at, o.delivery_attempts,
              o.out_for_delivery_at, o.rto_initiated_at,
              u.name AS customer_name, u.phone AS customer_phone,
              (SELECT status_label FROM shipment_events WHERE order_id=o.id ORDER BY event_time DESC LIMIT 1) AS latest_status
       FROM orders o
       JOIN users u ON u.id=o.user_id
       ${where}
       ORDER BY o.shipped_at DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...vals, limit, offset]
    )
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM orders o JOIN users u ON u.id=o.user_id ${where}`, vals
    )
    res.json({
      success: true,
      data: data.rows,
      meta: {
        total: Number(countRes.rows[0].count),
        page: Number(page),
        pages: Math.ceil(countRes.rows[0].count / limit),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

/* =====================================
   SHIPROCKET / GENERIC WEBHOOK RECEIVER
   POST /api/admin/tracking/webhook/:provider
   (no auth middleware — called by courier API)
===================================== */
exports.webhookReceiver = async (req, res) => {
  // Always respond 200 immediately — webhook retry logic needs fast ACK
  res.status(200).json({ received: true })

  try {
    const { provider } = req.params
    const payload = req.body

    let awb, statusId, statusLabel, location, eventTime, deliveredAt

    if (provider === 'shiprocket' || provider === 'delhivery') {
      awb         = payload.awb || payload.waybill
      statusId    = Number(payload.current_status_id ?? -1)
      statusLabel = payload.current_status || 'Update'
      location    = payload.location || ''
      eventTime   = payload.current_timestamp ? new Date(payload.current_timestamp) : new Date()
      deliveredAt = payload.delivered_date ? new Date(payload.delivered_date) : null
    } else {
      // generic: { awb, status, status_label, location, timestamp }
      awb         = payload.awb
      statusLabel = payload.status_label || payload.status || 'Update'
      location    = payload.location || ''
      eventTime   = payload.timestamp ? new Date(payload.timestamp) : new Date()
    }

    if (!awb) return

    const orderRes = await pool.query(
      `SELECT id, user_id, status FROM orders WHERE tracking_number=$1 LIMIT 1`, [awb]
    )
    if (!orderRes.rowCount) return

    const order  = orderRes.rows[0]
    const mapped = SHIPROCKET_STATUS_MAP[statusId] || { code: 'UPDATE', label: statusLabel, order_status: null }

    await pool.query(
      `INSERT INTO shipment_events
         (order_id, status_code, status_label, location, event_time, source, raw_payload)
       VALUES ($1,$2,$3,$4,$5,'webhook',$6)`,
      [order.id, mapped.code, mapped.label || statusLabel, location, eventTime, JSON.stringify(payload)]
    )

    // Update order fields based on status
    const updates = []
    if (mapped.code === 'OUT_FOR_DELIVERY') updates.push(`out_for_delivery_at=NOW()`)
    if (mapped.code === 'DELIVERY_ATTEMPTED') updates.push(`delivery_attempts=COALESCE(delivery_attempts,0)+1`)
    if (mapped.code === 'RTO') updates.push(`rto_initiated_at=NOW()`)
    if (mapped.code === 'DELIVERED') {
      updates.push(`delivered_at='${(deliveredAt || new Date()).toISOString()}'`)
      updates.push(`status=5`)
    }
    if (mapped.order_status && mapped.order_status !== Number(order.status)) {
      if (!updates.find(u => u.startsWith('status='))) {
        updates.push(`status=${mapped.order_status}`)
      }
    }
    if (updates.length) {
      await pool.query(`UPDATE orders SET ${updates.join(',')} WHERE id=$1`, [order.id])
    }

    // Push + socket
    emitToUser(order.user_id, 'shipment_event', {
      order_id: order.id, event: { status_label: mapped.label || statusLabel, location, event_time: eventTime }
    })
    const notifMap = {
      OUT_FOR_DELIVERY:    ['Your order is out for delivery! 🚚', `Order #${order.id} will arrive today.`],
      DELIVERED:           ['Order Delivered! 🎉', `Order #${order.id} has been delivered. Enjoy your Ayurvedic products!`],
      DELIVERY_ATTEMPTED:  ['Delivery Attempted', `Delivery of Order #${order.id} was attempted. We'll try again.`],
      RTO:                 ['Return Initiated', `Order #${order.id} could not be delivered and is being returned.`],
    }
    if (notifMap[mapped.code]) {
      await sendPushToUser(order.user_id, notifMap[mapped.code][0], notifMap[mapped.code][1], {
        type: mapped.code, order_id: order.id,
      })
    }

    emitToAdmin('shipment_webhook', { order_id: order.id, status: mapped.label || statusLabel, provider })

  } catch (e) {
    console.error('[webhook]', e.message)
  }
}

/* keep backward-compat alias */
exports.addTracking = exports.updateShipment
