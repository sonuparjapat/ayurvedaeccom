/**
 * SMS Service — ENV-gated Fast2SMS integration.
 * Set FAST2SMS_API_KEY in .env to enable real SMS delivery.
 * Without the key, messages are logged to console (dev/test).
 */

const https = require('https')

const API_KEY = process.env.FAST2SMS_API_KEY || ''
const SENDER_ID = process.env.SMS_SENDER_ID || 'ORONIX'
const DLT_ENTITY = process.env.DLT_ENTITY_ID || ''
const OTP_TEMPLATE_ID = process.env.DLT_OTP_TEMPLATE_ID || ''

async function sendFast2SMS(phone, message, templateId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      route: 'dlt',
      sender_id: SENDER_ID,
      message,
      variables_values: '',
      flash: 0,
      numbers: String(phone).replace(/\D/g, '').slice(-10),
      ...(templateId ? { dlt_te_id: templateId } : {}),
      ...(DLT_ENTITY ? { dlt_entity_id: DLT_ENTITY } : {}),
    })

    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        authorization: API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({ return: true }) }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

/**
 * Send an OTP via SMS.
 * @param {string|number} phone - 10-digit Indian mobile number
 * @param {string|number} otp   - OTP to send
 */
async function sendOTP(phone, otp) {
  const message = `${otp} is your Oroganix verification OTP. Do not share it with anyone. Valid for 10 minutes.`
  if (!API_KEY) {
    console.log(`[SMS-OTP] To ${phone}: ${message}`)
    return { sent: false, reason: 'SMS_API_KEY not configured' }
  }
  try {
    const result = await sendFast2SMS(phone, message, OTP_TEMPLATE_ID)
    return { sent: true, result }
  } catch (err) {
    console.error('[SMS] OTP send failed:', err.message)
    return { sent: false, error: err.message }
  }
}

/**
 * Send order status SMS notification.
 * @param {string|number} phone
 * @param {string} orderNo
 * @param {string} status  - e.g. 'Shipped', 'Out for Delivery'
 */
async function sendOrderStatusSMS(phone, orderNo, status) {
  const message = `Your Oroganix order ${orderNo} status: ${status}. Track your order at oroganix.com/account`
  if (!API_KEY) {
    console.log(`[SMS-ORDER] To ${phone}: ${message}`)
    return { sent: false }
  }
  try {
    await sendFast2SMS(phone, message)
    return { sent: true }
  } catch (err) {
    console.error('[SMS] Order status send failed:', err.message)
    return { sent: false }
  }
}

/**
 * Send COD delivery OTP to customer.
 * @param {string|number} phone
 * @param {string|number} otp
 * @param {string} orderNo
 */
async function sendDeliveryOTP(phone, otp, orderNo) {
  const message = `${otp} is your Oroganix COD delivery OTP for order ${orderNo}. Share it with the delivery person only.`
  if (!API_KEY) {
    console.log(`[SMS-COD-OTP] To ${phone}: ${message}`)
    return { sent: false, reason: 'SMS_API_KEY not configured' }
  }
  try {
    const result = await sendFast2SMS(phone, message)
    return { sent: true, result }
  } catch (err) {
    console.error('[SMS] Delivery OTP send failed:', err.message)
    return { sent: false }
  }
}

module.exports = { sendOTP, sendOrderStatusSMS, sendDeliveryOTP }
