const mailer = require('../../config/mail')

const APP = process.env.APP_NAME || 'Oroganix'
const FE  = process.env.FRONTEND_URL || 'http://localhost:3000'

function header(emoji, label, sub) {
  return `
    <div style="background:linear-gradient(135deg,#1a2e1a,#3d7a5a);padding:32px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">${emoji} ${label}</p>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">${APP}</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:8px 0 0;">${sub}</p>
    </div>`
}

function footer() {
  return `
    <div style="background:#f8faf8;padding:16px 28px;text-align:center;border-top:1px solid #eee;">
      <p style="font-size:11px;color:#bbb;margin:0;">&copy; ${new Date().getFullYear()} ${APP} · Natural Ayurvedic Wellness</p>
    </div>`
}

function ctaBtn(href, label) {
  return `<div style="text-align:center;margin:20px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#1a2e1a,#3d7a5a);color:#fff;text-decoration:none;padding:13px 32px;border-radius:50px;font-size:14px;font-weight:700;">${label}</a>
  </div>`
}

async function send({ email, name, subject, html }) {
  try {
    await mailer.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM || 'noreply@oroganix.com', name: APP },
      to: [{ email, name: name || 'Customer' }],
      subject,
      htmlContent: html,
    })
  } catch (err) {
    console.error('[OrderStatusEmail]', err.message)
  }
}

// ── Shipped ──────────────────────────────────────────────────────────────────
exports.sendOrderShippedEmail = async ({ email, name, orderId, invoiceNo, trackingNumber, carrier }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('🚚', 'Order Shipped!', 'Your order is on its way')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong> 👋</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Great news! Your order <strong>#${ref}</strong> has been shipped and is on its way to you.
        </p>
        ${trackingNumber ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
          <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Tracking Info</p>
          <p style="font-size:14px;font-weight:700;color:#1a2e1a;margin:0;">${carrier ? carrier + ' — ' : ''}${trackingNumber}</p>
        </div>` : ''}
        ${ctaBtn(`${FE}/orders/${orderId}`, 'Track My Order →')}
        <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
          Questions? Visit our <a href="${FE}/support" style="color:#3d7a5a;">support page</a>.
        </p>
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `📦 Your Order #${ref} Has Been Shipped — ${APP}`, html })
}

// ── Delivered ─────────────────────────────────────────────────────────────────
exports.sendOrderDeliveredEmail = async ({ email, name, orderId, invoiceNo }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('✅', 'Order Delivered!', 'Your order has arrived')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong> 👋</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Your order <strong>#${ref}</strong> has been delivered. We hope you love your Ayurvedic products!
        </p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          If you're happy with your purchase, please take a moment to leave a review — it helps other customers discover natural wellness products.
        </p>
        ${ctaBtn(`${FE}/orders/${orderId}`, '⭐ Write a Review')}
        <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
          Need help? Visit our <a href="${FE}/support" style="color:#3d7a5a;">support page</a>.
        </p>
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `✅ Your Order #${ref} Has Been Delivered — ${APP}`, html })
}

// ── Cancelled ─────────────────────────────────────────────────────────────────
exports.sendOrderCancelledEmail = async ({ email, name, orderId, invoiceNo, reason, refundAmount, refundTo }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('❌', 'Order Cancelled', 'Your order has been cancelled')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Your order <strong>#${ref}</strong> has been cancelled.${reason ? ` Reason: <em>${reason}</em>.` : ''}
        </p>
        ${refundAmount ? `
        <div style="background:#fffbf0;border:1px solid #f5e4b3;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
          <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Refund Info</p>
          <p style="font-size:14px;font-weight:700;color:#1a2e1a;margin:0;">₹${Number(refundAmount).toLocaleString('en-IN')} will be refunded to your ${refundTo || 'wallet'} within 3-5 business days.</p>
        </div>` : ''}
        ${ctaBtn(`${FE}/products`, '🛍️ Continue Shopping')}
        <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
          Need help? Visit our <a href="${FE}/support" style="color:#3d7a5a;">support page</a>.
        </p>
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `❌ Order #${ref} Cancelled — ${APP}`, html })
}

// ── Return Requested ──────────────────────────────────────────────────────────
exports.sendReturnRequestedEmail = async ({ email, name, orderId, invoiceNo }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('↩️', 'Return Request Received', 'We are processing your return')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          We have received your return request for order <strong>#${ref}</strong>. Our team will review it within 24–48 hours and reach out to you.
        </p>
        ${ctaBtn(`${FE}/orders/${orderId}`, 'View Order Status')}
        <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
          Questions? Visit our <a href="${FE}/support" style="color:#3d7a5a;">support page</a>.
        </p>
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `↩️ Return Request Received — Order #${ref} — ${APP}`, html })
}

// ── Return Approved ───────────────────────────────────────────────────────────
exports.sendReturnApprovedEmail = async ({ email, name, orderId, invoiceNo, refundAmount, refundTo }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('✅', 'Return Approved!', 'Your refund is being processed')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Your return for order <strong>#${ref}</strong> has been approved!
        </p>
        ${refundAmount ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
          <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Refund</p>
          <p style="font-size:14px;font-weight:700;color:#1a2e1a;margin:0;">₹${Number(refundAmount).toLocaleString('en-IN')} → ${refundTo || 'Wallet'}</p>
          <p style="font-size:12px;color:#666;margin:4px 0 0;">${refundTo === 'bank' ? 'Bank refund takes 5–7 business days.' : 'Wallet credit is instant.'}</p>
        </div>` : ''}
        ${ctaBtn(`${FE}/account?tab=wallet`, 'View My Wallet')}
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `✅ Return Approved — Order #${ref} — ${APP}`, html })
}

// ── Replacement Approved ──────────────────────────────────────────────────────
exports.sendReplacementApprovedEmail = async ({ email, name, orderId, invoiceNo }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('🔄', 'Replacement Approved', 'Your replacement is being processed')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Your return request for order <strong>#${ref}</strong> has been approved for a <strong>replacement</strong>. Our team is processing your new shipment and you will receive a dispatch notification shortly.
        </p>
        ${ctaBtn(`${FE}/orders/${orderId}`, 'View Order')}
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `Replacement Approved — Order #${ref} — ${APP}`, html })
}

// ── Replacement Dispatched ─────────────────────────────────────────────────────
exports.sendReplacementDispatchedEmail = async ({ email, name, orderId, invoiceNo, trackingNumber }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('🚚', 'Replacement Dispatched', 'Your replacement is on the way')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          Great news! Your replacement for order <strong>#${ref}</strong> has been dispatched.${trackingNumber ? `<br><br><strong>Tracking Number:</strong> ${trackingNumber}` : ''}
        </p>
        ${ctaBtn(`${FE}/orders/${orderId}`, 'Track Order')}
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `Replacement Dispatched — Order #${ref} — ${APP}`, html })
}

// ── Return Rejected ───────────────────────────────────────────────────────────
exports.sendReturnRejectedEmail = async ({ email, name, orderId, invoiceNo, reason }) => {
  const ref = invoiceNo || orderId
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${header('❌', 'Return Request Update', 'Regarding your return request')}
      <div style="padding:28px;">
        <p style="font-size:15px;color:#333;margin:0 0 12px;">Hey <strong>${name || 'there'}</strong>,</p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          We were unable to approve your return for order <strong>#${ref}</strong>.${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}
        </p>
        <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
          If you believe this is an error or need further help, please contact our support team.
        </p>
        ${ctaBtn(`${FE}/support`, 'Contact Support')}
      </div>
      ${footer()}
    </div></body></html>`
  await send({ email, name, subject: `Return Request Update — Order #${ref} — ${APP}`, html })
}
