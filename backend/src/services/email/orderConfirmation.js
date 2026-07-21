const mailer = require('../../config/mail')

module.exports = async function sendOrderConfirmationEmail({ email, name, orderId, invoiceNo, items, total, paymentMethod, address }) {
  const appName = process.env.APP_NAME || 'Oroganix'
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  const itemRows = (items || []).map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">
        ${item.image ? `<img src="${item.image}" width="44" height="44" style="border-radius:6px;vertical-align:middle;margin-right:8px;" />` : ''}
        ${item.name || item.product_name || ''}
        ${item.variant_label ? `<span style="color:#888;font-size:11px;"> (${item.variant_label})</span>` : ''}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#555;">×${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;">₹${Number(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('')

  const methodLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a2e1a,#3d7a5a);padding:32px 28px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Order Confirmed ✅</p>
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">${appName}</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:8px 0 0;">Your natural wellness order is placed!</p>
        </div>

        <!-- Body -->
        <div style="padding:28px;">
          <p style="font-size:15px;color:#333;margin:0 0 6px;">Hey <strong>${name || 'there'}</strong> 👋</p>
          <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
            Thank you for your order! We've received it and will start processing shortly.
          </p>

          <!-- Order Meta -->
          <div style="background:#f8faf8;border:1px solid #e4ede4;border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div>
              <p style="font-size:11px;color:#888;margin:0;text-transform:uppercase;letter-spacing:0.1em;">Order ID</p>
              <p style="font-size:14px;font-weight:700;color:#1a2e1a;margin:2px 0 0;">#${invoiceNo || orderId}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#888;margin:0;text-transform:uppercase;letter-spacing:0.1em;">Payment</p>
              <p style="font-size:14px;font-weight:600;color:#3d7a5a;margin:2px 0 0;">${methodLabel}</p>
            </div>
          </div>

          <!-- Items Table -->
          <p style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Your Items</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                <th style="padding:8px;text-align:center;font-size:11px;color:#888;font-weight:600;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:11px;color:#888;font-weight:600;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Total -->
          <div style="border-top:2px solid #e4ede4;padding-top:12px;text-align:right;margin-bottom:24px;">
            <span style="font-size:13px;color:#666;">Total Paid: </span>
            <span style="font-size:18px;font-weight:800;color:#1a2e1a;">₹${Number(total).toLocaleString('en-IN')}</span>
          </div>

          ${address ? `
          <!-- Address -->
          <div style="background:#fffbf0;border:1px solid #f5e4b3;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
            <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Delivering To</p>
            <p style="font-size:13px;color:#333;margin:0;line-height:1.6;">${address}</p>
          </div>` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${frontendUrl}/orders/${orderId}"
               style="display:inline-block;background:linear-gradient(135deg,#1a2e1a,#3d7a5a);color:#fff;text-decoration:none;padding:13px 32px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.04em;">
              Track My Order →
            </a>
          </div>

          <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
            Questions? Reply to this email or visit our <a href="${frontendUrl}/support" style="color:#3d7a5a;">support page</a>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8faf8;padding:16px 28px;text-align:center;border-top:1px solid #eee;">
          <p style="font-size:11px;color:#bbb;margin:0;">&copy; ${new Date().getFullYear()} ${appName} · Natural Ayurvedic Wellness</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await mailer.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM || 'noreply@oroganix.com', name: appName },
      to: [{ email, name: name || 'Customer' }],
      subject: `Order Confirmed ✅ #${invoiceNo || orderId} — ${appName}`,
      htmlContent: html,
    })
  } catch (err) {
    console.error('[OrderConfirmationEmail]', err.message)
  }
}
