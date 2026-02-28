const pool = require("../../config/db")
const PDFDocument = require('pdfkit')
const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")
const { uploadInvoiceToCloud } = require("../../utils/uploadInvoicetoCloud");
const { uploadInvoiceToAWS } = require("../../utils/awsUpload");
/* =====================================
   GET INVOICES (LIST)
===================================== */

exports.getInvoices = async (req, res) => {

  try {

    const {
      page = 1,
      limit = 10,
      search = ''
    } = req.query


    const offset = (page - 1) * limit


    let where = ` WHERE 1=1 `
    let values = []
    let idx = 1


    /* SEARCH */

    if (search) {

      where += `
        AND (
          i.invoice_no ILIKE $${idx}
          OR u.name ILIKE $${idx}
          OR o.id::TEXT ILIKE $${idx}
        )
      `

      values.push(`%${search}%`)
      idx++

    }


    /* DATA */

    const dataQuery = `

      SELECT

        i.*,

        o.id AS order_id,

        u.name AS user_name,
        u.email AS user_email


      FROM invoices i

      JOIN orders o ON o.id = i.order_id

      JOIN users u ON u.id = o.user_id


      ${where}


      ORDER BY i.created_at DESC


      LIMIT $${idx}
      OFFSET $${idx + 1}

    `


    values.push(limit, offset)


    const data = await pool.query(dataQuery, values)


    /* COUNT */

    const countQuery = `

      SELECT COUNT(*)

      FROM invoices i

      JOIN orders o ON o.id=i.order_id

      JOIN users u ON u.id=o.user_id

      ${where}

    `


    const count = await pool.query(
      countQuery,
      values.slice(0, values.length - 2)
    )


    res.status(200).json({

      success: true,

      data: data.rows,

      meta: {

        total: Number(count.rows[0].count),

        page: Number(page),

        pages: Math.ceil(
          count.rows[0].count / limit
        )

      }

    })


  } catch (err) {

    console.error(err)

    res.status(500).json({
      success: false,
      message: 'Load failed'
    })

  }

}

/* =====================================
   GENERATE INVOICE
===================================== */

exports.generateInvoice = async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    /* ================= BASIC VALIDATION ================= */

    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id"
      });
    }

    await client.query("BEGIN");

    /* ================= LOCK ORDER ================= */

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId]
    );

    if (!orderRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orderRes.rows[0];

    /* ================= VALIDATE STATUS ================= */

    const status = Number(order.status);

    const canGenerateInvoice =
      (
        [1, 2, 3, 4, 5].includes(status) &&
        order.payment_method == "online"
      ) ||
      (
        status === 5 &&
        order.payment_method == "cod"
      );

    if (!canGenerateInvoice) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invoice not allowed for this order status"
      });
    }

    /* ================= CHECK / CREATE INVOICE ================= */

    let invoiceId;
    let invoiceNo;
    let isRegenerate = false;

    const exists = await client.query(
      `SELECT * FROM invoices WHERE order_id=$1 FOR UPDATE`,
      [orderId]
    );

    if (exists.rowCount) {
      isRegenerate = true;
      invoiceId = exists.rows[0].id;
      invoiceNo = exists.rows[0].invoice_no;
    } else {
      const year = new Date().getFullYear();

      const seqRes = await client.query(
        `SELECT nextval('invoice_number_seq')`
      );

      const next = seqRes.rows[0].nextval;

      invoiceNo = `INV-${year}-${String(next).padStart(6, "0")}`;

      const invRes = await client.query(
        `
        INSERT INTO invoices
        (order_id, invoice_no, subtotal, tax, total)
        VALUES ($1,$2,0,0,0)
        RETURNING id
        `,
        [orderId, invoiceNo]
      );

      invoiceId = invRes.rows[0].id;
    }

    /* ================= FETCH ORDER ITEMS ================= */

    const itemsRes = await client.query(
      `
      SELECT oi.*, p.name
      FROM order_items oi
      JOIN products p ON p.id=oi.product_id
      WHERE oi.order_id=$1
      `,
      [orderId]
    );

    const items = itemsRes.rows;

    if (!items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "No items found for invoice"
      });
    }

    /* ================= PRICE BREAKUP ================= */

    const breakup = order.shipping_address?.price_breakup;

    if (!breakup) {
      throw new Error("Price breakup not found in order snapshot");
    }

    let subtotal = Number(breakup.subtotal || 0);
    let tax = Number(breakup.gst || 0);
    let delivery = Number(breakup.delivery || 0);
    let platform = Number(breakup.platform_fee || 0);
    let total = Number(breakup.grand_total || 0);

    subtotal = Number(subtotal.toFixed(2));
    tax = Number(tax.toFixed(2));
    delivery = Number(delivery.toFixed(2));
    platform = Number(platform.toFixed(2));
    total = Number(total.toFixed(2));

    if (total <= 0) {
      throw new Error("Invalid invoice total");
    }

    /* ================= UPDATE INVOICE TOTALS ================= */

    await client.query(
      `
      UPDATE invoices
      SET subtotal=$1, tax=$2, total=$3
      WHERE id=$4
      `,
      [subtotal, tax, total, invoiceId]
    );

    /* ================= RESET ITEMS IF REGENERATE ================= */

    if (isRegenerate) {
      await client.query(
        `DELETE FROM invoice_items WHERE invoice_id=$1`,
        [invoiceId]
      );
    }

    /* ================= INSERT INVOICE ITEMS ================= */

    for (const item of items) {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const lineTotal = Number((quantity * price).toFixed(2));

      await client.query(
        `
        INSERT INTO invoice_items
        (invoice_id, product_id, product_name,
         quantity, price, line_total)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          invoiceId,
          item.product_id,
          item.name,
          quantity,
          price,
          lineTotal
        ]
      );
    }

    /* ================= LOAD TEMPLATE ================= */

    const html = fs.readFileSync(
      path.join(__dirname, "../../template/invoice.html"),
      { encoding: "utf8" }
    );

    /* ================= BUILD ITEMS HTML ================= */

    const itemsHtml = items.map(item => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const lineTotal = (quantity * price).toFixed(2);

      return `
        <tr>
          <td>${item.name}</td>
          <td>${quantity}</td>
          <td>₹${price.toFixed(2)}</td>
          <td>₹${lineTotal}</td>
        </tr>
      `;
    }).join("");

    /* ================= CUSTOMER DETAILS ================= */

    const address = order.shipping_address || {};

    const customerName = address.name || "";
    const customerEmail = address.email || "";
    const customerPhone = address.phone || "";

    const addressLine1 = address.address_line1 || address.address || "";
    const addressLine2 = address.address_line2 || "";
    const city = address.city || "";
    const state = address.state || "";
    const pincode = address.pincode || "";
    const country = address.country || "India";
    const gstNumber = address.gst_number || "";

    const fullAddress = `
      ${addressLine1}
      ${addressLine2 ? ", " + addressLine2 : ""}
      ${city ? ", " + city : ""}
      ${state ? ", " + state : ""}
      ${pincode ? " - " + pincode : ""}
      ${country ? ", " + country : ""}
    `.replace(/\s+/g, " ").trim();

    /* ================= TEMPLATE DATA ================= */

    const data = {
      invoice_no: invoiceNo,
      order_id: orderId,
      date: new Date().toLocaleDateString("en-IN"),

      name: customerName,
      email: customerEmail,
      phone: customerPhone,

      address: fullAddress,
      city,
      state,
      pincode,
      country,
      gst_number: gstNumber,

      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      delivery: delivery.toFixed(2),
      platform_fee: platform.toFixed(2),
      total: total.toFixed(2),

      items: itemsHtml
    };

    let finalHtml = html.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        return data[key];
      }
      return "";
    });

    /* ================= GENERATE PDF ================= */

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(finalHtml, {
      waitUntil: "domcontentloaded"
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();

    /* ================= UPLOAD TO AWS ================= */

    const pdfUrl = await uploadInvoiceToAWS(
      pdfBuffer,
      invoiceNo
    );

    await client.query(
      `UPDATE invoices SET pdf_url=$1 WHERE id=$2`,
      [pdfUrl, invoiceId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      invoice_no: invoiceNo,
      pdf_url: pdfUrl,
      regenerated: isRegenerate
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[INVOICE ERROR]", err);

    res.status(500).json({
      success: false,
      message: err.message || "Invoice failed"
    });
  } finally {
    client.release();
  }
};



/* =====================================
   DOWNLOAD PDF
===================================== */

exports.downloadInvoice = async (req,res)=>{

  try{

    const { id } = req.params

    // 1️⃣ Get data
    const inv = await getInvoice(id)
    const items = await getItems(id)


    // 2️⃣ Build HTML
    let html = fs.readFileSync(
      path.join(__dirname,"../../template/invoice.html"),
      "utf8"
    )


    html = html
      .replace("{{invoice_no}}",inv.invoice_no)
      .replace("{{order_id}}",inv.order_id)
      .replace("{{date}}",
        new Date(inv.invoice_date).toLocaleDateString("en-IN"))
      .replace("{{name}}",inv.name)
      .replace("{{email}}",inv.email)
      .replace("{{phone}}",inv.phone || "")


    // Items loop
    let rows = ""

    items.forEach(i=>{
      rows += `
        <tr>
          <td>${i.product_name}</td>
          <td>${i.quantity}</td>
          <td>₹${i.price}</td>
          <td>₹${i.line_total}</td>
        </tr>
      `
    })


    html = html
      .replace("{{items}}",rows)
      .replace("{{subtotal}}",inv.subtotal)
      .replace("{{tax}}",inv.tax)
      .replace("{{total}}",inv.total)


    // 3️⃣ Convert to PDF
    const browser = await puppeteer.launch({
      headless:"new"
    })

    const page = await browser.newPage()

    await page.setContent(html,{
      waitUntil:"networkidle0"
    })

    const pdf = await page.pdf({
      format:"A4",
      printBackground:true
    })


    await browser.close()


    // 4️⃣ Send PDF
    res.setHeader("Content-Type","application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${inv.invoice_no}.pdf`
    )

    res.send(pdf)


  }catch(err){

    console.log(err)
    res.status(500).send("PDF Error")

  }

}



// DB FUNCTIONS
async function getInvoice(id){

  const res = await pool.query(`
    SELECT i.*,o.id order_id,u.*
    FROM invoices i
    JOIN orders o ON o.id=i.order_id
    JOIN users u ON u.id=o.user_id
    WHERE i.id=$1
  `,[id])

  return res.rows[0]
}


async function getItems(id){

  const res = await pool.query(`
    SELECT * FROM invoice_items
    WHERE invoice_id=$1
  `,[id])

  return res.rows
}
