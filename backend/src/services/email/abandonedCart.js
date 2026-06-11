const mailer = require('../../config/mail')

module.exports = async function sendAbandonedCartEmail(email, name, items) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const appName = process.env.APP_NAME || 'AyurVeda Desi Foods'

  const itemRows = (items || []).map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;">
        ${item.image ? `<img src="${item.image}" width="50" style="border-radius:6px;vertical-align:middle;" />` : ''}
        ${item.name}
      </td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${Number(item.price).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;background:#f9f9f9;padding:20px;">
      <div style="max-width:580px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:28px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">${appName}</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your cart misses you 🌿</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;margin:0 0 8px;">Hey ${name || 'there'}!</h2>
          <p style="color:#555;line-height:1.6;">You left some amazing Ayurvedic products in your cart. Your natural wellness journey is just one step away!</p>

          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:10px;text-align:left;font-size:13px;color:#666;">Product</th>
                <th style="padding:10px;text-align:center;font-size:13px;color:#666;">Qty</th>
                <th style="padding:10px;text-align:right;font-size:13px;color:#666;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="text-align:center;margin:28px 0;">
            <a href="${frontendUrl}/cart"
               style="background:linear-gradient(135deg,#2d6a4f,#40916c);color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
              Complete Your Order →
            </a>
          </div>

          <p style="color:#999;font-size:12px;text-align:center;margin:0;">
            Your cart will be saved for 48 hours. Don't let these products sell out!
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await mailer.sendTransacEmail({
    sender: { email: process.env.MAIL_FROM, name: appName },
    to: [{ email, name: name || 'Customer' }],
    subject: `${name ? name + ', your' : 'Your'} cart is waiting 🛒 — Complete your order`,
    htmlContent: html,
  })
}
