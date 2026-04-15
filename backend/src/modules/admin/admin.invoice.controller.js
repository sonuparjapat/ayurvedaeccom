
const pool = require("../../config/db")
const PDFDocument = require('pdfkit')
const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")
const { uploadInvoiceToCloud } = require("../../utils/uploadInvoicetoCloud");
const { uploadInvoiceToAWS } = require("../../utils/awsUpload");
const { platform } = require("os")

/* =====================================
   GET INVOICES (UNCHANGED)
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
        pages: Math.ceil(count.rows[0].count / limit)
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
   GENERATE INVOICE (UPGRADED SAFE)
===================================== */

exports.generateInvoice = async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id"
      });
    }

    await client.query("BEGIN");

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

    const status = Number(order.status);

    const canGenerateInvoice =
      ([1, 2, 3, 4, 5].includes(status) && order.payment_method == "online") ||
      (status === 5 && order.payment_method == "cod");

    if (!canGenerateInvoice) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invoice not allowed"
      });
    }

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
        `INSERT INTO invoices (order_id, invoice_no, subtotal, tax, total)
         VALUES ($1,$2,0,0,0)
         RETURNING id`,
        [orderId, invoiceNo]
      );

      invoiceId = invRes.rows[0].id;
    }

    /* ================= ITEMS ================= */

    const itemsRes = await client.query(
      `SELECT oi.*, p.name
       FROM order_items oi
       JOIN products p ON p.id=oi.product_id
       WHERE oi.order_id=$1`,
      [orderId]
    );

    const items = itemsRes.rows;

    if (!items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "No items found"
      });
    }

    /* ================= PRICE SAFE ================= */

    let subtotal, tax, delivery, platform, total;

    if (order.shipping_address?.price_breakup) {
     
      const breakup = order.shipping_address.price_breakup;

      subtotal = Number(breakup.subtotal || 0);
      tax = Number(breakup.gst || 0);
      delivery = Number(breakup.delivery || 0);
      platform = Number(breakup.platform_fee || 0);
      total = Number(breakup.grand_total || 0);

    } else {
    
      subtotal = Number(order.subtotal || 0);
      tax = Number(order.tax || 0);
      delivery = Number(order.delivery_charge || 0);
      platform = Number(order.platform_fee || 0);
      total = Number(order.grand_total || 0);
    }

    subtotal = Number(subtotal.toFixed(2));
    tax = Number(tax.toFixed(2));
    total = Number(total.toFixed(2));

    if (total <= 0) {
      throw new Error("Invalid invoice total");
    }

    await client.query(
      `UPDATE invoices SET subtotal=$1, tax=$2, total=$3 WHERE id=$4`,
      [subtotal, tax, total, invoiceId]
    );

    if (isRegenerate) {
      await client.query(
        `DELETE FROM invoice_items WHERE invoice_id=$1`,
        [invoiceId]
      );
    }

    /* ================= BULK INSERT 🔥 ================= */

    const values = [];
    const placeholders = [];

    items.forEach((item, i) => {
      const base = i * 6;

      placeholders.push(
        `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`
      );

      values.push(
        invoiceId,
        item.product_id,
        item.name,
        Number(item.quantity),
        Number(item.price),
        Number((item.quantity * item.price).toFixed(2))
      );
    });

    await client.query(
      `INSERT INTO invoice_items
      (invoice_id, product_id, product_name, quantity, price, line_total)
      VALUES ${placeholders.join(",")}`,
      values
    );

    /* ================= TEMPLATE ================= */

    const html = fs.readFileSync(
      path.join(__dirname, "../../template/invoice.html"),
      "utf8"
    );

    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    const address = order.shipping_address || {};

    const data = {
      invoice_no: invoiceNo,
      order_id: orderId,
      date: new Date().toLocaleDateString("en-IN"),
      name: address.name || "",
      email: address.email || "",
      phone: address.phone || "",
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      delivery:delivery||0,
      platformfee:platform||0,
      total: total.toFixed(2),
      items: itemsHtml
    };

    let finalHtml = html.replace(/{{\s*(\w+)\s*}}/g, (m, k) => data[k] || "");

    /* ================= PDF ================= */

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: puppeteer.executablePath(),
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process",
    "--no-zygote"
  ]
});
    const page = await browser.newPage();

    await page.setContent(finalHtml);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    const pdfUrl = await uploadInvoiceToAWS(pdfBuffer, invoiceNo);

    await client.query(
      `UPDATE invoices SET pdf_url=$1 WHERE id=$2`,
      [pdfUrl, invoiceId]
    );

    /* ================= ORDER UPDATE 🔥 ================= */

    await client.query(
      `UPDATE orders 
       SET is_invoiced=true,
           invoice_no=$1,
           invoice_date=NOW()
       WHERE id=$2`,
      [invoiceNo, orderId]
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
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    client.release();
  }
};

/* =====================================
   DOWNLOAD (UNCHANGED)
===================================== */

exports.downloadInvoice = async (req,res)=>{
  try{
    const { id } = req.params
    const inv = await getInvoice(id)
    const items = await getItems(id)

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
      .replace("{{delivery}}",delivery)
            .replace("{{platformfee}}",platform)
      .replace("{{subtotal}}",inv.subtotal)
      .replace("{{tax}}",inv.tax)
      .replace("{{total}}",inv.total)

    const browser = await puppeteer.launch({ headless:"new" })
    const page = await browser.newPage()

    await page.setContent(html,{ waitUntil:"networkidle0" })

    const pdf = await page.pdf({
      format:"A4",
      printBackground:true
    })

    await browser.close()

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