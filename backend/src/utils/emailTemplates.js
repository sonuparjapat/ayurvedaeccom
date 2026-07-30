const APP_NAME = () => process.env.APP_NAME || 'Oroganix'
const FRONTEND_URL = () => process.env.FRONTEND_URL || 'https://oroganix.com'
const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png'

const baseWrapper = (bodyHtml, footerExtra = '') => `
<div style="margin:0;padding:30px 16px;background:#f0f7f4;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.09);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a3a2a 0%,#10b981 100%);padding:28px 32px;text-align:center;">
      <img src="${LOGO_URL}" alt="${APP_NAME()}" style="max-height:48px;max-width:180px;object-fit:contain;" />
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      ${bodyHtml}
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;font-size:12px;color:#9ca3af;line-height:1.7;">
      ${footerExtra}
      <br/>© ${new Date().getFullYear()} ${APP_NAME()} · All rights reserved<br/>
      <a href="${FRONTEND_URL()}/unsubscribe" style="color:#10b981;text-decoration:none;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="${FRONTEND_URL()}" style="color:#10b981;text-decoration:none;">Visit Store</a>
    </div>
  </div>
</div>`

/* ── Newsletter Welcome ── */
exports.newsletterWelcome = ({ email }) => ({
  subject: `Welcome to ${APP_NAME()} 🌿 You're now on the list!`,
  html: baseWrapper(`
    <h2 style="margin:0 0 8px;color:#1a3a2a;font-size:24px;">You're in! 🎉</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Welcome to the ${APP_NAME()} community</p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Thank you for subscribing! You'll be the <strong>first to know</strong> about:
    </p>
    <ul style="padding-left:20px;color:#374151;font-size:15px;line-height:2;margin:0 0 24px;">
      <li>🔥 Flash sales &amp; limited-time offers</li>
      <li>🎁 Exclusive coupon codes</li>
      <li>🌱 New product launches</li>
      <li>📖 Ayurvedic health tips</li>
    </ul>
    <div style="text-align:center;margin-top:28px;">
      <a href="${FRONTEND_URL()}/products" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;letter-spacing:0.3px;">
        Explore Products →
      </a>
    </div>
    <p style="margin-top:28px;font-size:13px;color:#9ca3af;text-align:center;">
      Subscribed as <strong>${email}</strong>
    </p>
  `, `Oroganix · Lab Tested · Farm Direct`)
})

/* ── Flash Sale Announcement ── */
exports.flashSaleAnnouncement = ({ title, description, discountType, discountValue, endsAt, saleUrl }) => {
  const discountLabel = discountType === 'percent'
    ? `${discountValue}% OFF`
    : `₹${discountValue} OFF`
  const endsDate = endsAt ? new Date(endsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null

  return {
    subject: `⚡ ${title} — ${discountLabel} starts NOW!`,
    html: baseWrapper(`
      <!-- Flash badge -->
      <div style="text-align:center;margin-bottom:24px;">
        <span style="background:#fef3c7;color:#92400e;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:bold;letter-spacing:1px;">⚡ FLASH SALE</span>
      </div>
      <h2 style="margin:0 0 10px;color:#1a3a2a;font-size:26px;text-align:center;line-height:1.3;">${title}</h2>
      ${description ? `<p style="color:#6b7280;font-size:15px;text-align:center;margin:0 0 24px;line-height:1.6;">${description}</p>` : ''}
      <!-- Discount badge -->
      <div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="margin:0;color:#78350f;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Limited Time Offer</p>
        <h1 style="margin:10px 0;color:#1c1917;font-size:48px;font-weight:900;letter-spacing:-1px;">${discountLabel}</h1>
        ${endsDate ? `<p style="margin:0;color:#78350f;font-size:13px;">⏳ Ends: <strong>${endsDate}</strong></p>` : ''}
      </div>
      <div style="text-align:center;">
        <a href="${saleUrl || FRONTEND_URL() + '/offers'}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;letter-spacing:0.3px;">
          Shop the Sale →
        </a>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center;">
        Hurry! Offer valid while stocks last.
      </p>
    `, `You received this because you subscribed to ${APP_NAME()} deals`)
  }
}

/* ── Coupon Campaign ── */
exports.couponCampaign = ({ subject, couponCode, description, discountType, discountValue, minOrder, validTo }) => {
  const discountLabel = discountType === 'percent'
    ? `${discountValue}% OFF`
    : `₹${discountValue} OFF`
  const expiryDate = validTo ? new Date(validTo).toLocaleDateString('en-IN', { dateStyle: 'long' }) : null

  return {
    subject: subject || `🎁 Your exclusive coupon: ${couponCode} — ${discountLabel}`,
    html: baseWrapper(`
      <div style="text-align:center;margin-bottom:20px;">
        <span style="background:#f0fdf4;color:#166534;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:bold;letter-spacing:1px;">🎁 EXCLUSIVE OFFER</span>
      </div>
      <h2 style="margin:0 0 8px;color:#1a3a2a;font-size:24px;text-align:center;">A special deal just for you!</h2>
      ${description ? `<p style="color:#6b7280;font-size:15px;text-align:center;margin:0 0 24px;">${description}</p>` : '<div style="margin-bottom:24px;"></div>'}
      <!-- Coupon card -->
      <div style="border:2.5px dashed #10b981;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;background:#f0fdf4;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Your Coupon Code</p>
        <div style="background:#1a3a2a;color:#fff;border-radius:10px;padding:14px 24px;display:inline-block;margin:8px 0 12px;">
          <span style="font-size:28px;font-weight:900;letter-spacing:4px;font-family:monospace;">${couponCode}</span>
        </div>
        <p style="margin:0;color:#047857;font-size:20px;font-weight:bold;">${discountLabel}</p>
        ${minOrder > 0 ? `<p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Minimum order: ₹${minOrder}</p>` : ''}
        ${expiryDate ? `<p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Valid till: <strong>${expiryDate}</strong></p>` : ''}
      </div>
      <div style="text-align:center;">
        <a href="${FRONTEND_URL()}/products" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
          Use Code Now →
        </a>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center;">
        Apply the code at checkout. One-time use per account.
      </p>
    `, `You received this because you subscribed to ${APP_NAME()} deals`)
  }
}

/* ── Back in Stock ── */
exports.backInStock = ({ productName, productUrl }) => ({
  subject: `✅ "${productName}" is back in stock — grab it before it's gone!`,
  html: baseWrapper(`
    <div style="text-align:center;margin-bottom:20px;">
      <span style="background:#f0fdf4;color:#166534;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:bold;letter-spacing:1px;">✅ BACK IN STOCK</span>
    </div>
    <h2 style="margin:0 0 12px;color:#1a3a2a;font-size:24px;text-align:center;line-height:1.3;">${productName} is available again!</h2>
    <p style="color:#6b7280;font-size:15px;text-align:center;margin:0 0 28px;line-height:1.7;">
      You asked us to notify you — and the wait is over. This product is back in stock now. Grab it before it sells out again!
    </p>
    <div style="text-align:center;">
      <a href="${productUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
        Shop Now →
      </a>
    </div>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center;">
      Stocks are limited — order soon!
    </p>
  `, `You received this because you signed up for a restock alert on ${APP_NAME()}`)
})

/* ── Custom Campaign (plain subject + body from admin) ── */
exports.customCampaign = ({ subject, heading, body, ctaText, ctaUrl }) => ({
  subject,
  html: baseWrapper(`
    <h2 style="margin:0 0 16px;color:#1a3a2a;font-size:24px;">${heading || subject}</h2>
    <div style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px;white-space:pre-wrap;">${body}</div>
    ${ctaText && ctaUrl ? `
    <div style="text-align:center;">
      <a href="${ctaUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
        ${ctaText} →
      </a>
    </div>` : ''}
  `, `You received this because you subscribed to ${APP_NAME()} deals`)
})
