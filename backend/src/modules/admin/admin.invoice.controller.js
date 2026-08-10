
const pool = require("../../config/db")
const chromium = require("@sparticuz/chromium")
const puppeteer = require("puppeteer-core")
const { uploadInvoiceToAWS } = require("../../utils/awsUpload");
const stream = require("stream")
const csv = require("csv-parser")

/* ─── helpers ─────────────────────────────────────────────────────── */

function fmt2(n) { return Number(Number(n || 0).toFixed(2)) }
function fmtINR(n) { return '₹' + fmt2(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }

function formatAddress(parts) {
  return parts.filter(Boolean).join(', ')
}

function toWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const n = Math.floor(amount)
  if (n === 0) return 'Zero'
  function convert(num) {
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '')
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '')
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '')
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '')
  }
  const paise = Math.round((amount - n) * 100)
  let result = convert(n) + ' Rupees'
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
  return result + ' Only'
}

function buildItemsTableHtml(itemsWithTax, isInterState) {
  const thStyle = 'padding:8px 10px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#5a5a5a;border-bottom:2px solid #0a0a0a;'
  const thR = thStyle.replace('text-align:left', 'text-align:right')
  const thC = thStyle.replace('text-align:left', 'text-align:center')

  const taxHeaders = isInterState
    ? `<th style="${thC}">IGST%</th><th style="${thR}">IGST Amt</th>`
    : `<th style="${thC}">CGST%</th><th style="${thR}">CGST</th><th style="${thC}">SGST%</th><th style="${thR}">SGST</th>`

  const header = `
    <thead>
      <tr>
        <th style="${thC}">Sr.</th>
        <th style="${thStyle}">Description</th>
        <th style="${thC}">HSN/SAC</th>
        <th style="${thC}">Unit</th>
        <th style="${thC}">Qty</th>
        <th style="${thR}">Rate (₹)</th>
        <th style="${thR}">Taxable Value</th>
        ${taxHeaders}
        <th style="${thR}">Total (₹)</th>
      </tr>
    </thead>`

  const tdBase = 'padding:10px;border-bottom:1px solid #e2ddd8;vertical-align:top;font-size:12px;'
  const tdC = tdBase + 'text-align:center;'
  const tdR = tdBase + 'text-align:right;font-family:monospace;'

  const rows = itemsWithTax.map((item, idx) => {
    const taxCols = isInterState
      ? `<td style="${tdC}">${fmt2(item.igstRate)}%</td><td style="${tdR}">${fmtINR(item.igstAmt)}</td>`
      : `<td style="${tdC}">${fmt2(item.cgstRate)}%</td><td style="${tdR}">${fmtINR(item.cgstAmt)}</td><td style="${tdC}">${fmt2(item.sgstRate)}%</td><td style="${tdR}">${fmtINR(item.sgstAmt)}</td>`

    return `
      <tr>
        <td style="${tdC}">${idx + 1}</td>
        <td style="${tdBase}">
          <div style="font-weight:500;color:#0a0a0a">${item.name}</div>
          ${item.hsn_code ? `<div style="font-size:10px;color:#9a9a9a;margin-top:2px">HSN: ${item.hsn_code}</div>` : ''}
        </td>
        <td style="${tdC}">${item.hsn_code || '—'}</td>
        <td style="${tdC}">${item.unit || 'Nos'}</td>
        <td style="${tdC}">${item.quantity}</td>
        <td style="${tdR}">${fmtINR(item.price)}</td>
        <td style="${tdR}">${fmtINR(item.taxableValue)}</td>
        ${taxCols}
        <td style="${tdR}"><strong>${fmtINR(item.lineTotal)}</strong></td>
      </tr>`
  }).join('')

  return `<table style="width:100%;border-collapse:collapse">${header}<tbody>${rows}</tbody></table>`
}

function buildInvoiceHtml({ company, isInterState, invoiceNo, orderId, invoiceDate, paymentMethod,
  buyerName, buyerEmail, buyerPhone, buyerAddress, buyerGstin, placeOfSupply,
  items_table, subtotal, totalCgst, totalSgst, totalIgst, discountAmount,
  delivery, platformFee, tax, total }) {

  const taxRows = isInterState
    ? `<div class="total-line"><span class="t-label">IGST</span><span class="t-val">${fmtINR(totalIgst)}</span></div>`
    : `<div class="total-line"><span class="t-label">CGST</span><span class="t-val">${fmtINR(totalCgst)}</span></div>
       <div class="total-line"><span class="t-label">SGST</span><span class="t-val">${fmtINR(totalSgst)}</span></div>`

  const discountRow = discountAmount > 0
    ? `<div class="total-line"><span class="t-label" style="color:#dc2626">Discount</span><span class="t-val" style="color:#dc2626">−${fmtINR(discountAmount)}</span></div>`
    : ''

  const companyAddress = formatAddress([company.address_line1, company.address_line2, company.city, company.state, company.pincode, company.country])

  const bankDetailsHtml = (company.bank_name && company.bank_account && company.bank_ifsc)
    ? `<div class="info-card green">
         <h5>🏦 Bank Details</h5>
         <p>
           <strong>Bank:</strong> ${company.bank_name}${company.bank_branch ? ', ' + company.bank_branch : ''}<br>
           <strong>Account:</strong> ${company.bank_account}<br>
           <strong>IFSC:</strong> ${company.bank_ifsc}
         </p>
       </div>`
    : ''

  const fssaiHtml = company.fssai_number
    ? `<div class="info-card">
         <h5>🌿 FSSAI Licence</h5>
         <p><strong>Licence No:</strong> ${company.fssai_number}</p>
       </div>`
    : ''

  const amountInWords = toWords(Math.round(total))

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Tax Invoice - ${invoiceNo}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #0a0a0a; --ink-muted: #5a5a5a; --ink-light: #9a9a9a;
  --gold: #c8a96e; --gold-pale: #f5ede0; --gold-deep: #a07840;
  --rule: #e2ddd8; --bg: #faf9f7; --white: #ffffff;
  --green: #2d6a4f; --green-bg: #d8f3dc; --amber: #92400e; --amber-bg: #fef3c7;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans',sans-serif; background:#e8e4df; padding:32px 16px; min-height:100vh; }
.paper { max-width:900px; margin:auto; background:var(--white); box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.08),0 20px 60px rgba(0,0,0,.10); }
.paper::before { content:''; display:block; height:4px; background:linear-gradient(90deg,var(--gold-deep) 0%,var(--gold) 50%,var(--gold-deep) 100%); }

/* header */
.header { padding:36px 48px 28px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--rule); position:relative; }
.header::after { content:'INVOICE'; position:absolute; right:48px; bottom:-16px; font-family:'Playfair Display',serif; font-size:80px; font-weight:700; color:var(--gold-pale); letter-spacing:-4px; line-height:1; user-select:none; pointer-events:none; z-index:0; }
.brand { position:relative; z-index:1; }
.brand h1 { font-family:'Playfair Display',serif; font-size:26px; font-weight:700; color:var(--ink); }
.brand .tagline { font-size:10px; color:var(--ink-light); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
.brand .seller-gstin { font-size:11px; color:var(--ink-muted); margin-top:4px; font-family:'DM Mono',monospace; }
.header-right { text-align:right; position:relative; z-index:1; }
.invoice-badge { display:inline-block; font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:var(--gold-deep); background:var(--gold-pale); padding:5px 12px; border-radius:2px; margin-bottom:6px; }
.invoice-number-display { font-family:'Playfair Display',serif; font-size:20px; color:var(--ink); font-weight:600; }
.invoice-sub { font-size:11px; color:var(--ink-muted); margin-top:3px; }

/* seller block */
.seller-block { padding:14px 48px; background:var(--bg); border-bottom:1px solid var(--rule); font-size:11px; color:var(--ink-muted); display:flex; gap:32px; flex-wrap:wrap; }
.seller-block span { white-space:nowrap; }
.seller-block strong { color:var(--ink); }

/* meta row */
.meta-row { display:grid; grid-template-columns:1fr 1fr 1fr; border-bottom:1px solid var(--rule); }
.meta-cell { padding:20px 24px; border-right:1px solid var(--rule); }
.meta-cell:last-child { border-right:none; }
.meta-label { font-size:9px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--ink-light); margin-bottom:6px; }
.meta-value { font-size:12px; color:var(--ink); line-height:1.6; }
.meta-value strong { font-size:13px; font-weight:600; display:block; }
.mono { font-family:'DM Mono',monospace; font-size:11px; color:var(--ink-muted); display:block; }

/* items section */
.items-section { padding:28px 48px; }
.section-title { font-size:9px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:var(--ink-light); margin-bottom:16px; display:flex; align-items:center; gap:10px; }
.section-title::after { content:''; flex:1; height:1px; background:var(--rule); }

/* footer split */
.invoice-footer { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid var(--rule); margin:0 48px; }
.notes-block { padding:24px 24px 24px 0; }
.totals-block { padding:24px 0 24px 24px; border-left:1px solid var(--rule); }
.total-line { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:9px; }
.t-label { font-size:12px; color:var(--ink-muted); }
.t-val { font-family:'DM Mono',monospace; font-size:12px; color:var(--ink-muted); }
.total-divider { height:1px; background:var(--rule); margin:12px 0; }
.grand-total { display:flex; justify-content:space-between; align-items:baseline; padding:14px 18px; background:var(--ink); border-radius:2px; margin-top:8px; }
.grand-total .t-label { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.7); }
.grand-total .t-val { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; color:var(--gold); }
.words-row { font-size:10px; color:var(--ink-muted); margin-top:8px; font-style:italic; text-align:right; }

/* info cards */
.info-card { background:var(--bg); border-radius:4px; padding:12px 14px; margin-bottom:8px; border-left:3px solid var(--gold); }
.info-card.green { border-left-color:var(--green); background:var(--green-bg); }
.info-card.amber { border-left-color:#d97706; background:var(--amber-bg); }
.info-card h5 { font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--gold-deep); margin-bottom:6px; }
.info-card.green h5 { color:var(--green); }
.info-card.amber h5 { color:var(--amber); }
.info-card p { font-size:11px; color:var(--ink-muted); line-height:1.6; }
.info-card p strong { color:var(--ink); font-weight:600; }

/* tax summary */
.tax-summary { margin:0 48px; padding:14px 0; border-top:1px solid var(--rule); font-size:11px; color:var(--ink-muted); display:flex; gap:24px; flex-wrap:wrap; }
.tax-summary strong { color:var(--ink); }

/* bottom bar */
.bottom-bar { background:var(--ink); padding:22px 48px; display:flex; justify-content:space-between; align-items:center; }
.bottom-bar p { font-size:10px; color:rgba(255,255,255,.45); }
.bottom-bar .contact { font-size:10px; color:rgba(255,255,255,.6); text-align:right; }
.bottom-bar .contact span { color:var(--gold); }

@media print { body { background:white; padding:0; } .paper { box-shadow:none; } }
</style>
</head>
<body>
<div class="paper">

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <h1>${company.company_name || 'Oroganix'}</h1>
      <div class="tagline">Premium Natural &amp; Ayurvedic Products</div>
      ${company.gst_number ? `<div class="seller-gstin">GSTIN: ${company.gst_number}</div>` : ''}
      ${company.pan_number ? `<div class="seller-gstin" style="margin-top:1px">PAN: ${company.pan_number}</div>` : ''}
    </div>
    <div class="header-right">
      <div class="invoice-badge">Tax Invoice</div>
      <div class="invoice-number-display">#${invoiceNo}</div>
      <div class="invoice-sub">Order #${orderId}</div>
      <div class="invoice-sub">${invoiceDate}</div>
    </div>
  </div>

  <!-- SELLER DETAILS -->
  <div class="seller-block">
    ${companyAddress ? `<span><strong>Address:</strong> ${companyAddress}</span>` : ''}
    ${company.phone ? `<span><strong>Phone:</strong> ${company.phone}</span>` : ''}
    ${company.support_email || company.email ? `<span><strong>Email:</strong> ${company.support_email || company.email}</span>` : ''}
    ${company.website ? `<span><strong>Web:</strong> ${company.website}</span>` : ''}
  </div>

  <!-- META ROW -->
  <div class="meta-row">
    <div class="meta-cell">
      <div class="meta-label">Invoice Details</div>
      <div class="meta-value">
        <span class="mono">#${invoiceNo}</span>
        <span class="mono">Order: #${orderId}</span>
        <span class="mono">${invoiceDate}</span>
        <span style="display:block;margin-top:4px;font-size:11px;color:#2d6a4f;font-weight:600">
          ${paymentMethod === 'cod' ? '💵 Cash on Delivery' : '✅ Paid Online'}
        </span>
      </div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Billed To / Ship To</div>
      <div class="meta-value">
        <strong>${buyerName}</strong>
        ${buyerEmail ? `<span class="mono">${buyerEmail}</span>` : ''}
        ${buyerPhone ? `<span class="mono">${buyerPhone}</span>` : ''}
        <span style="display:block;font-size:11px;color:var(--ink-muted);margin-top:3px">${buyerAddress}</span>
        ${buyerGstin ? `<span style="display:block;font-size:11px;font-family:'DM Mono',monospace;color:#2d5a3d;margin-top:4px;font-weight:600">GSTIN: ${buyerGstin}</span>` : ''}
      </div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Supply Details</div>
      <div class="meta-value">
        <span style="display:block;font-size:11px;color:var(--ink-muted)">Place of Supply</span>
        <strong style="font-size:13px">${placeOfSupply || '—'}</strong>
        <span style="display:block;margin-top:6px;font-size:11px;color:var(--ink-muted)">Supply Type</span>
        <strong style="font-size:12px">${isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</strong>
        <span style="display:block;margin-top:4px;font-size:10px;color:var(--ink-muted)">Reverse Charge: No</span>
      </div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <div class="items-section">
    <div class="section-title">Line Items</div>
    ${items_table}
  </div>

  <!-- TAX SUMMARY -->
  <div class="tax-summary">
    ${!isInterState ? `<span><strong>CGST:</strong> ${fmtINR(totalCgst)}</span><span><strong>SGST:</strong> ${fmtINR(totalSgst)}</span>` : `<span><strong>IGST:</strong> ${fmtINR(totalIgst)}</span>`}
    <span><strong>Taxable Value:</strong> ${fmtINR(subtotal)}</span>
    <span><strong>Total Tax:</strong> ${fmtINR(tax)}</span>
  </div>

  <!-- FOOTER: NOTES + TOTALS -->
  <div class="invoice-footer">
    <div class="notes-block">
      <div class="section-title">Notes</div>
      ${bankDetailsHtml}
      ${fssaiHtml}
      <div class="info-card amber">
        <h5>📋 Terms</h5>
        <p>
          This is a computer-generated invoice and does not require a physical signature.<br>
          Goods once sold will not be taken back or exchanged unless defective.<br>
          ${company.support_email || company.email ? `For queries: <strong>${company.support_email || company.email}</strong>` : ''}
        </p>
      </div>
    </div>

    <div class="totals-block">
      <div class="section-title" style="padding-left:0">Summary</div>
      <div class="total-line"><span class="t-label">Taxable Amount</span><span class="t-val">${fmtINR(subtotal)}</span></div>
      ${taxRows}
      ${delivery > 0 ? `<div class="total-line"><span class="t-label">Delivery Charge</span><span class="t-val">${fmtINR(delivery)}</span></div>` : ''}
      ${platformFee > 0 ? `<div class="total-line"><span class="t-label">Platform Fee</span><span class="t-val">${fmtINR(platformFee)}</span></div>` : ''}
      ${discountRow}
      <div class="total-divider"></div>
      <div class="grand-total">
        <span class="t-label">Grand Total</span>
        <span class="t-val">${fmtINR(total)}</span>
      </div>
      <div class="words-row">${amountInWords}</div>
    </div>
  </div>

  <!-- BOTTOM BAR -->
  <div class="bottom-bar">
    <p>This is a computer-generated invoice and does not require a signature.<br>Subject to ${company.city || 'India'} jurisdiction.</p>
    <div class="contact">
      ${company.support_email || company.email ? `<span>${company.support_email || company.email}</span>` : ''}
      ${company.phone ? ` &nbsp;·&nbsp; <span>${company.phone}</span>` : ''}
    </div>
  </div>

</div>
</body>
</html>`
}

/* ─── getCompanySettings ─────────────────────────────────────────── */

async function getCompanySettings(client) {
  const r = await (client || pool).query(`SELECT * FROM company_settings WHERE is_active=true LIMIT 1`)
  return r.rows[0] || {}
}

/* =====================================
   GET INVOICES
===================================== */

exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit
    let where = ' WHERE 1=1 '
    let values = []
    let idx = 1
    if (search) {
      where += ` AND (i.invoice_no ILIKE $${idx} OR u.name ILIKE $${idx} OR o.id::TEXT ILIKE $${idx})`
      values.push(`%${search}%`)
      idx++
    }
    const dataQuery = `
      SELECT i.*, o.id AS order_id, u.name AS user_name, u.email AS user_email
      FROM invoices i
      JOIN orders o ON o.id = i.order_id
      JOIN users u ON u.id = o.user_id
      ${where}
      ORDER BY i.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`
    values.push(limit, offset)
    const data = await pool.query(dataQuery, values)
    const countQuery = `SELECT COUNT(*) FROM invoices i JOIN orders o ON o.id=i.order_id JOIN users u ON u.id=o.user_id ${where}`
    const count = await pool.query(countQuery, values.slice(0, values.length - 2))
    res.status(200).json({
      success: true,
      data: data.rows,
      meta: { total: Number(count.rows[0].count), page: Number(page), pages: Math.ceil(count.rows[0].count / limit) }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Load failed' })
  }
}

/* =====================================
   GENERATE INVOICE
===================================== */

exports.generateInvoice = async (req, res) => {
  const client = await pool.connect()
  try {
    const { orderId } = req.params
    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({ success: false, message: "Invalid order id" })
    }

    await client.query("BEGIN")

    /* ── order ── */
    const orderRes = await client.query(`SELECT * FROM orders WHERE id=$1 FOR UPDATE`, [orderId])
    if (!orderRes.rowCount) {
      await client.query("ROLLBACK")
      return res.status(404).json({ success: false, message: "Order not found" })
    }
    const order = orderRes.rows[0]
    const status = Number(order.status)
    const canGenerateInvoice =
      ([1, 2, 3, 4, 5].includes(status) && order.payment_method === 'online') ||
      (status === 5 && order.payment_method === 'cod')
    if (!canGenerateInvoice) {
      await client.query("ROLLBACK")
      return res.status(400).json({ success: false, message: "Invoice not allowed for this order status/payment" })
    }

    /* ── company settings ── */
    const company = await getCompanySettings(client)
    const sellerState = (company.state || '').toLowerCase().trim()

    /* ── invoice number / existing check ── */
    let invoiceId, invoiceNo, isRegenerate = false
    const exists = await client.query(`SELECT * FROM invoices WHERE order_id=$1 FOR UPDATE`, [orderId])
    if (exists.rowCount) {
      isRegenerate = true
      invoiceId = exists.rows[0].id
      invoiceNo = exists.rows[0].invoice_no
    } else {
      const year = new Date().getFullYear()
      const seqRes = await client.query(`SELECT nextval('invoice_number_seq')`)
      invoiceNo = `INV-${year}-${String(seqRes.rows[0].nextval).padStart(6, '0')}`
      const invRes = await client.query(
        `INSERT INTO invoices (order_id, invoice_no, subtotal, tax, total) VALUES ($1,$2,0,0,0) RETURNING id`,
        [orderId, invoiceNo]
      )
      invoiceId = invRes.rows[0].id
    }

    /* ── items with GST fields ── */
    const itemsRes = await client.query(`
      SELECT oi.quantity, oi.price, oi.product_id, oi.variant_id,
             p.name, COALESCE(p.hsn_code,'') AS hsn_code,
             COALESCE(p.gst_percent,0) AS gst_percent,
             COALESCE(p.unit,'Nos') AS unit
      FROM order_items oi
      JOIN products p ON p.id=oi.product_id
      WHERE oi.order_id=$1`, [orderId])

    if (!itemsRes.rowCount) {
      await client.query("ROLLBACK")
      return res.status(400).json({ success: false, message: "No items found for this order" })
    }

    /* ── price breakup ── */
    const breakup = order.shipping_address?.price_breakup || {}
    let subtotal = fmt2(breakup.subtotal || order.subtotal || 0)
    let tax = fmt2(breakup.gst || order.tax || 0)
    let delivery = fmt2(breakup.delivery || order.delivery_charge || 0)
    let platformFee = fmt2(breakup.platform_fee || order.platform_fee || 0)
    let total = fmt2(breakup.grand_total || order.grand_total || 0)
    const discountAmount = fmt2(
      (Number(breakup.coupon_discount || 0)) +
      (Number(breakup.wallet_discount || 0)) +
      (Number(breakup.loyalty_discount || 0))
    )

    if (total <= 0) throw new Error("Invalid invoice total")

    /* ── intra/inter state ── */
    const address = order.shipping_address || {}
    const buyerState = (address.state || '').toLowerCase().trim()
    const isInterState = !!(sellerState && buyerState && sellerState !== buyerState)

    /* ── per-item tax calculations ── */
    let totalCgst = 0, totalSgst = 0, totalIgst = 0
    const itemsWithTax = itemsRes.rows.map(item => {
      const qty = Number(item.quantity)
      const price = Number(item.price)
      const gstPct = Number(item.gst_percent || 0)
      const taxableValue = fmt2(price * qty)
      const itemTax = fmt2(taxableValue * gstPct / 100)

      let cgstRate = 0, cgstAmt = 0, sgstRate = 0, sgstAmt = 0, igstRate = 0, igstAmt = 0
      if (isInterState) {
        igstRate = gstPct
        igstAmt = itemTax
        totalIgst += igstAmt
      } else {
        cgstRate = gstPct / 2
        sgstRate = gstPct / 2
        cgstAmt = fmt2(itemTax / 2)
        sgstAmt = fmt2(itemTax - cgstAmt)
        totalCgst += cgstAmt
        totalSgst += sgstAmt
      }

      const lineTotal = fmt2(taxableValue + itemTax)
      return { ...item, taxableValue, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, lineTotal }
    })

    totalCgst = fmt2(totalCgst)
    totalSgst = fmt2(totalSgst)
    totalIgst = fmt2(totalIgst)

    /* ── update invoice row ── */
    await client.query(
      `UPDATE invoices SET subtotal=$1, tax=$2, total=$3, cgst_amount=$4, sgst_amount=$5, igst_amount=$6,
       place_of_supply=$7, payment_method=$8, discount_amount=$9, seller_gstin=$10 WHERE id=$11`,
      [subtotal, tax, total, totalCgst, totalSgst, totalIgst,
       address.state || null, order.payment_method || null, discountAmount, company.gst_number || null, invoiceId]
    )

    /* ── invoice items insert ── */
    if (isRegenerate) {
      await client.query(`DELETE FROM invoice_items WHERE invoice_id=$1`, [invoiceId])
    }
    const colCount = 16
    const vals = []
    const placeholders = itemsWithTax.map((item, i) => {
      const b = i * colCount
      vals.push(
        invoiceId, item.product_id, item.name, Number(item.quantity), Number(item.price), item.lineTotal,
        item.hsn_code || null, item.unit || 'Nos', Number(item.gst_percent || 0), item.taxableValue,
        item.cgstRate, item.cgstAmt, item.sgstRate, item.sgstAmt, item.igstRate, item.igstAmt
      )
      return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},$${b+14},$${b+15},$${b+16})`
    })
    await client.query(
      `INSERT INTO invoice_items
       (invoice_id, product_id, product_name, quantity, price, line_total,
        hsn_code, unit, gst_percent, taxable_value,
        cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount)
       VALUES ${placeholders.join(',')}`,
      vals
    )

    /* ── build buyer address ── */
    const buyerAddress = formatAddress([
      address.address_line1 || address.address,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
      address.country
    ])

    /* ── build PDF ── */
    const items_table = buildItemsTableHtml(itemsWithTax, isInterState)
    const buyerGstin = order.buyer_gstin || null
    const finalHtml = buildInvoiceHtml({
      company, isInterState, invoiceNo, orderId, items_table,
      invoiceDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      paymentMethod: order.payment_method,
      buyerName: address.name || '',
      buyerEmail: address.email || '',
      buyerPhone: address.phone || '',
      buyerAddress,
      buyerGstin,
      placeOfSupply: address.state || '',
      subtotal, totalCgst, totalSgst, totalIgst,
      discountAmount, delivery, platformFee, tax, total
    })

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
    const page = await browser.newPage()
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    const pdfUrl = await uploadInvoiceToAWS(pdfBuffer, invoiceNo)

    await client.query(`UPDATE invoices SET pdf_url=$1 WHERE id=$2`, [pdfUrl, invoiceId])
    await client.query(
      `UPDATE orders SET is_invoiced=true, invoice_no=$1, invoice_date=NOW(), is_igst=$2 WHERE id=$3`,
      [invoiceNo, isInterState, orderId]
    )

    await client.query("COMMIT")

    res.json({ success: true, invoice_no: invoiceNo, pdf_url: pdfUrl, regenerated: isRegenerate })

  } catch (err) {
    await client.query("ROLLBACK")
    console.error(err)
    res.status(500).json({ success: false, message: err.message })
  } finally {
    client.release()
  }
}

/* =====================================
   DOWNLOAD INVOICE
===================================== */

exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params

    /* ── fetch stored invoice + order + user ── */
    const invRes = await pool.query(`
      SELECT i.*,
             o.id AS ord_id, o.shipping_address, o.payment_method AS ord_payment_method,
             o.delivery_charge, o.platform_fee, o.buyer_gstin,
             u.name AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM invoices i
      JOIN orders o ON o.id = i.order_id
      JOIN users u ON u.id = o.user_id
      WHERE i.id = $1`, [id])

    if (!invRes.rowCount) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    const inv = invRes.rows[0]

    /* ── fetch stored items ── */
    const itemsRes = await pool.query(`SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY id`, [id])
    const storedItems = itemsRes.rows

    /* ── company settings ── */
    const company = await getCompanySettings()

    /* ── reconstruct tax data from stored invoice ── */
    const totalCgst = fmt2(inv.cgst_amount || 0)
    const totalSgst = fmt2(inv.sgst_amount || 0)
    const totalIgst = fmt2(inv.igst_amount || 0)
    const isInterState = totalIgst > 0 && (totalCgst + totalSgst) === 0

    const address = inv.shipping_address || {}
    const buyerAddress = formatAddress([
      address.address_line1 || address.address,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
      address.country
    ])

    const breakup = address.price_breakup || {}
    const delivery = fmt2(breakup.delivery || inv.delivery_charge || 0)
    const platformFee = fmt2(breakup.platform_fee || inv.platform_fee || 0)
    const discountAmount = fmt2(inv.discount_amount || 0)

    /* ── rebuild items with tax columns from stored data ── */
    const itemsWithTax = storedItems.map(item => ({
      name: item.product_name,
      hsn_code: item.hsn_code || '',
      unit: item.unit || 'Nos',
      quantity: item.quantity,
      price: item.price,
      gst_percent: item.gst_percent || 0,
      taxableValue: fmt2(item.taxable_value || item.price * item.quantity),
      cgstRate: fmt2(item.cgst_rate || 0),
      cgstAmt: fmt2(item.cgst_amount || 0),
      sgstRate: fmt2(item.sgst_rate || 0),
      sgstAmt: fmt2(item.sgst_amount || 0),
      igstRate: fmt2(item.igst_rate || 0),
      igstAmt: fmt2(item.igst_amount || 0),
      lineTotal: fmt2(item.line_total)
    }))

    const items_table = buildItemsTableHtml(itemsWithTax, isInterState)
    const finalHtml = buildInvoiceHtml({
      company, isInterState, items_table,
      invoiceNo: inv.invoice_no,
      orderId: inv.ord_id,
      invoiceDate: new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      paymentMethod: inv.payment_method || inv.ord_payment_method,
      buyerName: address.name || inv.user_name || '',
      buyerEmail: address.email || inv.user_email || '',
      buyerPhone: address.phone || inv.user_phone || '',
      buyerAddress,
      buyerGstin: inv.buyer_gstin || null,
      placeOfSupply: inv.place_of_supply || address.state || '',
      subtotal: fmt2(inv.subtotal),
      totalCgst, totalSgst, totalIgst,
      discountAmount, delivery, platformFee,
      tax: fmt2(inv.tax),
      total: fmt2(inv.total)
    })

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
    const page = await browser.newPage()
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${inv.invoice_no}.pdf`)
    res.send(pdf)

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'PDF generation failed' })
  }
}

/* =====================================
   BULK STOCK UPDATE
===================================== */

exports.bulkStockUpdate = async (req, res) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({ success: false, message: 'CSV file required' })
    }
    const csvFile = req.files.file[0]
    const rows = []
    const readable = new stream.Readable()
    readable.push(csvFile.buffer)
    readable.push(null)
    readable.pipe(csv()).on('data', row => rows.push(row)).on('end', async () => {
      let updated = 0
      const failed = []
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          try {
            const sku = (r.sku || '').trim()
            const inventory = Number(r.inventory)
            if (!sku) throw new Error('SKU missing')
            if (inventory < 0 || Number.isNaN(inventory)) throw new Error('Invalid inventory')
            const result = await client.query(`UPDATE products SET inventory=$1 WHERE LOWER(sku)=LOWER($2) RETURNING id`, [inventory, sku])
            if (!result.rowCount) throw new Error('SKU not found')
            updated++
          } catch (err) {
            failed.push({ row: i + 2, sku: r.sku || '', error: err.message || 'Failed' })
          }
        }
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(err)
        return res.status(500).json({ success: false, message: 'Stock update failed' })
      } finally {
        client.release()
      }
      return res.json({ success: true, message: 'Stock update completed', summary: { updated, failed: failed.length, total: rows.length }, failed })
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Stock update failed' })
  }
}
