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

    await client.query('BEGIN');

    /* ================= CHECK ORDER ================= */

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id=$1`,
      [orderId]
    );

    if (!orderRes.rowCount) {

      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderRes.rows[0];

    /* ================= VALIDATE ================= */

    const canGenerateInvoice =
      (
        [1,2,3,4].includes(Number(order.status)) &&
        order.payment_method === "online"
      ) ||
      (
        order.status == 4 &&
        order.payment_method === "cod"
      );

    if (!canGenerateInvoice) {

      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: 'Invoice not allowed'
      });
    }

    /* ================= CHECK EXIST ================= */

    let invoiceId;
    let invoiceNo;
    let isRegenerate = false;

    const exists = await client.query(
      `SELECT * FROM invoices WHERE order_id=$1`,
      [orderId]
    );

    if (exists.rowCount) {

      isRegenerate = true;
      invoiceId = exists.rows[0].id;
      invoiceNo = exists.rows[0].invoice_no;

    } else {

      const year = new Date().getFullYear();

      const countRes = await client.query(
        `SELECT COUNT(*) FROM invoices`
      );

      const next = Number(countRes.rows[0].count) + 1;

      invoiceNo =
        `INV-${year}-${String(next).padStart(6,'0')}`;

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

    /* ================= GET ITEMS ================= */

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

      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: 'No items found'
      });
    }

    /* ================= TOTAL ================= */

    let subtotal = 0;

    items.forEach(i => {
      subtotal += Number(i.price) * i.quantity;
    });

    const tax = 0;
    const total = subtotal + tax;

    await client.query(
      `
      UPDATE invoices
      SET subtotal=$1, tax=$2, total=$3
      WHERE id=$4
      `,
      [subtotal, tax, total, invoiceId]
    );

    /* ================= RESET ITEMS ================= */

    if (isRegenerate) {

      await client.query(
        `DELETE FROM invoice_items WHERE invoice_id=$1`,
        [invoiceId]
      );
    }

    for (const i of items) {

      await client.query(
        `
        INSERT INTO invoice_items
        (invoice_id, product_id, product_name,
         quantity, price, line_total)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          invoiceId,
          i.product_id,
          i.name,
          i.quantity,
          i.price,
          i.price * i.quantity
        ]
      );
    }

    /* ================= BUILD PDF ================= */

    const html = fs.readFileSync(
      path.join(__dirname,"../../template/invoice.html"),
      "utf8"
    );

    let finalHtml = html
      .replace("{{invoice_no}}", invoiceNo)
      .replace("{{order_id}}", orderId)
      .replace("{{date}}",
        new Date().toLocaleDateString("en-IN")
      );

    const browser = await puppeteer.launch({
      headless: "new"
    });

    const page = await browser.newPage();

    await page.setContent(finalHtml,{
      waitUntil:"networkidle0"
    });

    const pdfBuffer = await page.pdf({
      format:"A4",
      printBackground:true
    });
fs.writeFileSync(
  `./test-${invoiceNo}.pdf`,
  pdfBuffer
);

console.log("PDF saved locally:", invoiceNo);
    await browser.close();

    /* ================= UPLOAD ================= */

   
const pdfUrl = await uploadInvoiceToAWS(
      pdfBuffer,
      invoiceNo
    );
    console.log(pdfUrl,"comingfine")
    await client.query(
      `UPDATE invoices SET pdf_url=$1 WHERE id=$2`,
      [pdfUrl, invoiceId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      invoice_no: invoiceNo,
      pdf_url: pdfUrl,
      regenerated: isRegenerate
    });

  } catch (err) {

    await client.query('ROLLBACK');

    console.error(err,"erro message");

    res.status(500).json({
      success: false,
      message: 'Invoice failed'
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
