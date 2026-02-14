const pool = require("../../config/db")
const PDFDocument = require('pdfkit')

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

  const client = await pool.connect()

  try {

    const { orderId } = req.params

    await client.query('BEGIN')


    /* CHECK ORDER */

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id=$1`,
      [orderId]
    )

    if (!orderRes.rowCount) {

      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }


    const order = orderRes.rows[0]


    if (order.status !== 'processing') {

      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'Only processing orders can be invoiced'
      })
    }


    /* CHECK EXISTS */

    const exists = await client.query(
      `SELECT id FROM invoices WHERE order_id=$1`,
      [orderId]
    )

    if (exists.rowCount) {

      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'Invoice already exists'
      })
    }


    /* GENERATE NUMBER */

    const year = new Date().getFullYear()

    const countRes = await client.query(
      `SELECT COUNT(*) FROM invoices`
    )

    const next =
      Number(countRes.rows[0].count) + 1


    const invoiceNo =
      `INV-${year}-${String(next).padStart(6, '0')}`


    /* GET ITEMS */

    const itemsRes = await client.query(
      `
      SELECT
        oi.*,
        p.name
      FROM order_items oi
      JOIN products p ON p.id=oi.product_id
      WHERE oi.order_id=$1
      `,
      [orderId]
    )


    const items = itemsRes.rows


    if (!items.length) {

      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'No items found'
      })
    }


    /* TOTAL */

    let subtotal = 0

    items.forEach(i => {
      subtotal += Number(i.price) * i.quantity
    })


    const tax = 0
    const total = subtotal + tax


    /* INSERT INVOICE */

    const invRes = await client.query(
      `
      INSERT INTO invoices
      (order_id, invoice_no, subtotal, tax, total)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `,
      [orderId, invoiceNo, subtotal, tax, total]
    )


    const invoiceId = invRes.rows[0].id


    /* SNAPSHOT ITEMS */

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
      )

    }


    await client.query('COMMIT')


    res.json({
      success: true,
      invoice_no: invoiceNo
    })


  } catch (err) {

    await client.query('ROLLBACK')

    console.error(err)

    res.status(500).json({
      success: false,
      message: 'Invoice failed'
    })

  } finally {

    client.release()

  }

}



/* =====================================
   DOWNLOAD PDF
===================================== */

exports.downloadInvoice = async (req, res) => {
  console.log("Generating Premium Invoice PDF")
  try {

    const { id } = req.params

    const invoiceRes = await pool.query(
      `
      SELECT
        i.*,
        o.id AS order_id,
        u.name,
        u.email,
        u.phone,
        u.address1,
        u.state,
        u.pincode
      FROM invoices i
      JOIN orders o ON o.id=i.order_id
      JOIN users u ON u.id=o.user_id
      WHERE i.id=$1
      `,
      [id]
    )

    if (!invoiceRes.rowCount) {
      return res.status(404).send('Not found')
    }

    const inv = invoiceRes.rows[0]

    const itemsRes = await pool.query(
      `
      SELECT *
      FROM invoice_items
      WHERE invoice_id=$1
      `,
      [id]
    )

    const items = itemsRes.rows

    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${inv.invoice_no}.pdf`
    )

    doc.pipe(res)

    // ============================================
    // PREMIUM HEADER WITH GRADIENT EFFECT
    // ============================================
    
    // Company Header Background (Simulated Gradient)
    doc.rect(0, 0, doc.page.width, 150)
       .fillAndStroke('#4F46E5', '#4F46E5')
    
    doc.rect(0, 0, doc.page.width, 150)
       .fillOpacity(0.9)
       .fill('#6366F1')
    
    // Company Name
    doc.fillColor('#FFFFFF')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('Ayurveda', 50, 40)
    
    // Company Tagline
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#E0E7FF')
       .text('Premium Products & Services', 50, 80)
    
    // Company Contact Info
    doc.fontSize(9)
       .fillColor('#C7D2FE')
       .text('123 Business Street, City, State 12345', 50, 100)
       .text('Phone: +91 1234567890 | Email: info@company.com', 50, 115)
    
    // INVOICE Label (Right Side)
    doc.fontSize(36)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('INVOICE', 400, 50, { align: 'right', width: 150 })

    doc.fillColor('#000000').fillOpacity(1)

    // ============================================
    // INVOICE INFO SECTION
    // ============================================
    
    let yPos = 180

    // Invoice Details Box
    doc.roundedRect(50, yPos, 250, 100, 5)
       .fillAndStroke('#F3F4F6', '#E5E7EB')
    
    doc.fillColor('#1F2937')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('INVOICE DETAILS', 60, yPos + 15)
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text('Invoice Number:', 60, yPos + 35)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(inv.invoice_no, 160, yPos + 35)
    
    doc.fillColor('#6B7280')
       .font('Helvetica')
       .text('Order Number:', 60, yPos + 50)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(`#${inv.order_id}`, 160, yPos + 50)
    
    doc.fillColor('#6B7280')
       .font('Helvetica')
       .text('Invoice Date:', 60, yPos + 65)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(new Date(inv.invoice_date).toLocaleDateString('en-IN'), 160, yPos + 65)

    // Bill To Box
    doc.roundedRect(320, yPos, 245, 100, 5)
       .fillAndStroke('#EEF2FF', '#C7D2FE')
    
    doc.fillColor('#4F46E5')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('BILL TO', 330, yPos + 15)
    
    doc.fontSize(11)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(inv.name, 330, yPos + 35, { width: 225 })
    
    doc.fontSize(9)
       .fillColor('#6B7280')
       .font('Helvetica')
       .text(inv.email, 330, yPos + 50, { width: 225 })
    
    if (inv.phone) {
      doc.text(`Phone: ${inv.phone}`, 330, yPos + 65)
    }
    
    if (inv.address) {
      doc.text(inv.address, 330, yPos + 80, { width: 225 })
    }

    yPos += 130

    // ============================================
    // ITEMS TABLE
    // ============================================
    
    // Table Header Background
    doc.rect(50, yPos, 515, 30)
       .fillAndStroke('#4F46E5', '#4F46E5')
    
    // Table Headers
    doc.fillColor('#FFFFFF')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('ITEM', 60, yPos + 10, { width: 200 })
       .text('QTY', 270, yPos + 10, { width: 60, align: 'center' })
       .text('PRICE', 340, yPos + 10, { width: 80, align: 'right' })
       .text('AMOUNT', 430, yPos + 10, { width: 125, align: 'right' })

    yPos += 35

    // Table Rows
    items.forEach((item, index) => {
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, yPos - 5, 515, 25)
           .fillAndStroke('#F9FAFB', '#F9FAFB')
      }
      
      doc.fillColor('#1F2937')
         .fontSize(9)
         .font('Helvetica')
         .text(item.product_name, 60, yPos, { width: 200 })
         .text(item.quantity.toString(), 270, yPos, { width: 60, align: 'center' })
         .text(`₹${Number(item.price).toLocaleString('en-IN')}`, 340, yPos, { width: 80, align: 'right' })
      
      doc.font('Helvetica-Bold')
         .text(`₹${Number(item.line_total).toLocaleString('en-IN')}`, 430, yPos, { width: 125, align: 'right' })
      
      yPos += 25
    })

    // Bottom border for table
    doc.moveTo(50, yPos)
       .lineTo(565, yPos)
       .strokeColor('#E5E7EB')
       .stroke()

    yPos += 20

    // ============================================
    // TOTALS SECTION
    // ============================================
    
    const totalsX = 380

    // Subtotal
    doc.fillColor('#6B7280')
       .fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', totalsX, yPos)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(`₹${Number(inv.subtotal).toLocaleString('en-IN')}`, totalsX + 100, yPos, { align: 'right', width: 85 })

    yPos += 20

    // Tax
    doc.fillColor('#6B7280')
       .font('Helvetica')
       .text('Tax:', totalsX, yPos)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(`₹${Number(inv.tax).toLocaleString('en-IN')}`, totalsX + 100, yPos, { align: 'right', width: 85 })

    yPos += 5

    // Separator line
    doc.moveTo(totalsX, yPos)
       .lineTo(565, yPos)
       .strokeColor('#E5E7EB')
       .stroke()

    yPos += 10

    // Total Box with Background
    doc.roundedRect(totalsX - 10, yPos - 5, 195, 35, 5)
       .fillAndStroke('#4F46E5', '#4F46E5')

    doc.fillColor('#FFFFFF')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL', totalsX, yPos + 5)
       .fontSize(16)
       .text(`₹${Number(inv.total).toLocaleString('en-IN')}`, totalsX + 100, yPos + 5, { align: 'right', width: 85 })

    yPos += 50

    // ============================================
    // PAYMENT INFO & NOTES
    // ============================================
    
    if (yPos < 650) {
      
      // Payment Info Box
      doc.roundedRect(50, yPos, 250, 80, 5)
         .fillAndStroke('#F0FDF4', '#BBF7D0')
      
      doc.fillColor('#166534')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('PAYMENT INFORMATION', 60, yPos + 12)
      
      doc.fontSize(8)
         .fillColor('#15803D')
         .font('Helvetica')
         .text('Bank: XYZ Bank', 60, yPos + 30)
         .text('Account: 1234567890', 60, yPos + 42)
         .text('IFSC: XYZB0001234', 60, yPos + 54)
      
      // Terms & Conditions
      doc.roundedRect(320, yPos, 245, 80, 5)
         .fillAndStroke('#FEF3C7', '#FDE68A')
      
      doc.fillColor('#92400E')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('TERMS & CONDITIONS', 330, yPos + 12)
      
      doc.fontSize(7)
         .fillColor('#B45309')
         .font('Helvetica')
         .text('• Payment due within 30 days', 330, yPos + 30)
         .text('• Please include invoice number with payment', 330, yPos + 42)
         .text('• Contact us for any billing questions', 330, yPos + 54)
    }

    // ============================================
    // FOOTER
    // ============================================
    
    const footerY = doc.page.height - 80

    // Footer background
    doc.rect(0, footerY, doc.page.width, 80)
       .fillAndStroke('#F3F4F6', '#F3F4F6')

    doc.fillColor('#6B7280')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('Thank you for your business!', 50, footerY + 20, { align: 'center', width: doc.page.width - 100 })
    
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#9CA3AF')
       .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 35, { align: 'center', width: doc.page.width - 100 })
       .text('For questions, contact us at support@company.com or call +91 1234567890', 50, footerY + 48, { align: 'center', width: doc.page.width - 100 })

    doc.end()

  } catch (err) {

    console.error(err)
    res.status(500).send('PDF generation failed')

  }

}
