const pool = require("../config/db");
const mailer = require("../config/mail");

/* =====================================
   Get Status Label From DB
===================================== */

const getStatusLabel = async (code) => {
  try {
    const res = await pool.query(
      `
      SELECT label
      FROM order_status_master
      WHERE code = $1
        AND is_active = true
      LIMIT 1
      `,
      [code]
    );

    if (res.rows.length) {
      return res.rows[0].label;
    }

    return "Updated";

  } catch (err) {
    console.log(
      "Status label fetch error:",
      err.message
    );

    return "Updated";
  }
};

/* =====================================
   Send Order Status Mail
===================================== */

exports.sendOrderStatusMail = async ({
  email,
  name,
  orderId,
  status
}) => {
  try {
    const label =
      await getStatusLabel(status);

    const html = `
      <div style="
        margin:0;
        padding:30px;
        background:#f3f4f6;
        font-family:Arial,sans-serif;
      ">

        <div style="
          max-width:620px;
          margin:auto;
          background:#ffffff;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 10px 25px rgba(0,0,0,0.08);
        ">

          <!-- Header -->
          <div style="
            background:linear-gradient(90deg,#10b981,#059669);
            padding:22px;
            color:#ffffff;
            text-align:center;
          ">
            <h1 style="
              margin:0;
              font-size:24px;
            ">
              Order Update
            </h1>

            <p style="
              margin:8px 0 0;
              opacity:.95;
              font-size:14px;
            ">
              Your latest order status notification
            </p>
          </div>

          <!-- Body -->
          <div style="padding:28px;">

            <p style="
              margin:0 0 12px;
              font-size:16px;
              color:#111827;
            ">
              Hi ${name || "Customer"},
            </p>

            <p style="
              margin:0 0 18px;
              font-size:15px;
              color:#4b5563;
              line-height:1.6;
            ">
              Your order
              <strong>#${orderId}</strong>
              has been updated successfully.
            </p>

            <div style="
              background:#ecfdf5;
              border:1px solid #a7f3d0;
              border-radius:12px;
              padding:18px;
              text-align:center;
              margin-bottom:22px;
            ">
              <p style="
                margin:0;
                font-size:13px;
                color:#065f46;
                letter-spacing:.4px;
              ">
                CURRENT STATUS
              </p>

              <h2 style="
                margin:8px 0 0;
                color:#047857;
                font-size:24px;
              ">
                ${label}
              </h2>
            </div>

            <div style="text-align:center;">
              <a
                href="${process.env.FRONTEND_URL}/orders"
                style="
                  display:inline-block;
                  padding:12px 22px;
                  background:#10b981;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:bold;
                "
              >
                View My Orders
              </a>
            </div>

            <p style="
              margin:28px 0 0;
              font-size:14px;
              color:#6b7280;
              line-height:1.6;
            ">
              Thank you for shopping with us ❤️
            </p>

          </div>

          <!-- Footer -->
          <div style="
            background:#f9fafb;
            padding:16px;
            text-align:center;
            font-size:12px;
            color:#6b7280;
          ">
            ${process.env.APP_NAME}
          </div>

        </div>

      </div>
    `;

    await mailer.sendTransacEmail({
      sender: {
        email: process.env.MAIL_FROM,
        name: process.env.APP_NAME
      },

      to: [
        {
          email
        }
      ],

      subject: `Order #${orderId} is now ${label}`,

      htmlContent: html
    });

  } catch (err) {
    console.log(
      "Order mail error:",
      err.message
    );
  }
};