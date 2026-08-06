const pool = require('../../config/db')

/* ── GST Dashboard: monthly breakdown ─────────────────────────────── */
exports.gstDashboard = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), period = 'monthly' } = req.query
    const fy_start = `${year}-04-01`
    const fy_end   = `${Number(year) + 1}-03-31`

    const summary = await pool.query(
      `SELECT
         DATE_TRUNC('month', i.invoice_date) AS month,
         COUNT(i.id)                          AS invoice_count,
         SUM(i.subtotal)                      AS taxable_value,
         SUM(i.cgst_amount)                   AS total_cgst,
         SUM(i.sgst_amount)                   AS total_sgst,
         SUM(i.igst_amount)                   AS total_igst,
         SUM(i.cgst_amount + i.sgst_amount + i.igst_amount) AS total_tax,
         SUM(i.total)                         AS gross_total,
         COUNT(*) FILTER (WHERE i.igst_amount > 0 AND i.cgst_amount = 0) AS inter_state_count,
         COUNT(*) FILTER (WHERE i.cgst_amount > 0) AS intra_state_count
       FROM invoices i
       WHERE i.invoice_date BETWEEN $1 AND $2
         AND i.is_voided IS NOT TRUE
       GROUP BY DATE_TRUNC('month', i.invoice_date)
       ORDER BY month ASC`,
      [fy_start, fy_end]
    )

    const hsnSummary = await pool.query(
      `SELECT
         ii.hsn_code,
         SUM(ii.quantity)      AS total_qty,
         SUM(ii.taxable_value) AS taxable_value,
         SUM(ii.cgst_amount)   AS cgst,
         SUM(ii.sgst_amount)   AS sgst,
         SUM(ii.igst_amount)   AS igst,
         ii.gst_percent
       FROM invoice_items ii
       JOIN invoices i ON i.id=ii.invoice_id
       WHERE i.invoice_date BETWEEN $1 AND $2
         AND i.is_voided IS NOT TRUE
         AND ii.hsn_code IS NOT NULL AND ii.hsn_code != ''
       GROUP BY ii.hsn_code, ii.gst_percent
       ORDER BY taxable_value DESC`,
      [fy_start, fy_end]
    )

    const totals = await pool.query(
      `SELECT
         SUM(subtotal)    AS taxable_value,
         SUM(cgst_amount) AS total_cgst,
         SUM(sgst_amount) AS total_sgst,
         SUM(igst_amount) AS total_igst,
         SUM(cgst_amount + sgst_amount + igst_amount) AS total_tax,
         SUM(total)       AS gross_total,
         COUNT(*)         AS invoice_count
       FROM invoices
       WHERE invoice_date BETWEEN $1 AND $2
         AND is_voided IS NOT TRUE`,
      [fy_start, fy_end]
    )

    res.json({
      success: true,
      fy: `${year}-${Number(year) + 1}`,
      totals: totals.rows[0],
      monthly: summary.rows,
      hsn_summary: hsnSummary.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'GST dashboard error' })
  }
}

/* ── GSTR-1 Summary for a period ─────────────────────────────────── */
exports.gstr1Summary = async (req, res) => {
  try {
    const { from, to } = req.query
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from and to dates required (YYYY-MM-DD)' })
    }

    const invoices = await pool.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.subtotal,
              i.cgst_amount, i.sgst_amount, i.igst_amount, i.total,
              i.place_of_supply, i.seller_gstin,
              o.shipping_address->>'name' AS buyer_name,
              o.id AS order_id
       FROM invoices i
       JOIN orders o ON o.id=i.order_id
       WHERE i.invoice_date BETWEEN $1 AND $2
         AND i.is_voided IS NOT TRUE
       ORDER BY i.invoice_date ASC`,
      [from, to]
    )

    // B2C Large (total > 2.5L), B2C Small, B2B
    const b2c_large = invoices.rows.filter(r => Number(r.total) > 250000)
    const b2c_small = invoices.rows.filter(r => Number(r.total) <= 250000)

    const calcTotals = (rows) => ({
      count: rows.length,
      taxable_value: rows.reduce((s, r) => s + Number(r.subtotal || 0), 0),
      cgst: rows.reduce((s, r) => s + Number(r.cgst_amount || 0), 0),
      sgst: rows.reduce((s, r) => s + Number(r.sgst_amount || 0), 0),
      igst: rows.reduce((s, r) => s + Number(r.igst_amount || 0), 0),
      gross: rows.reduce((s, r) => s + Number(r.total || 0), 0),
    })

    res.json({
      success: true,
      period: { from, to },
      b2c_large: { ...calcTotals(b2c_large), invoices: b2c_large },
      b2c_small: calcTotals(b2c_small),
      totals: calcTotals(invoices.rows),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'GSTR-1 summary error' })
  }
}

/* ── GSTR-1 Export as CSV (government format) ───────────────────── */
exports.gstr1Export = async (req, res) => {
  try {
    const { from, to, type = 'invoices' } = req.query
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from and to dates required' })
    }

    if (type === 'hsn') {
      // HSN-wise summary (Table 12 of GSTR-1)
      const rows = await pool.query(
        `SELECT
           ii.hsn_code,
           p.name AS description,
           'NOS' AS uom,
           SUM(ii.quantity) AS total_qty,
           SUM(ii.taxable_value) AS taxable_value,
           ii.gst_percent AS tax_rate,
           SUM(ii.igst_amount) AS igst_amount,
           SUM(ii.cgst_amount) AS cgst_amount,
           SUM(ii.sgst_amount) AS sgst_amount
         FROM invoice_items ii
         JOIN invoices i ON i.id=ii.invoice_id
         JOIN products p ON p.id=ii.product_id
         WHERE i.invoice_date BETWEEN $1 AND $2
           AND i.is_voided IS NOT TRUE
           AND ii.hsn_code IS NOT NULL AND ii.hsn_code != ''
         GROUP BY ii.hsn_code, p.name, ii.gst_percent
         ORDER BY ii.hsn_code`,
        [from, to]
      )
      const csvLines = [
        'HSN Code,Description,UOM,Total Quantity,Taxable Value,Tax Rate %,IGST Amount,CGST Amount,SGST Amount'
      ]
      rows.rows.forEach(r => {
        csvLines.push([
          r.hsn_code, `"${r.description}"`, r.uom,
          r.total_qty, r.taxable_value, r.tax_rate,
          r.igst_amount, r.cgst_amount, r.sgst_amount,
        ].join(','))
      })
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=GSTR1_HSN_${from}_${to}.csv`)
      return res.send(csvLines.join('\n'))
    }

    // Invoice-wise (B2C summary - most common for eCommerce)
    const rows = await pool.query(
      `SELECT i.invoice_no, i.invoice_date,
              o.shipping_address->>'name' AS buyer_name,
              i.place_of_supply,
              i.subtotal AS taxable_value,
              i.cgst_amount, i.sgst_amount, i.igst_amount,
              (i.cgst_amount + i.sgst_amount + i.igst_amount) AS total_tax,
              i.total AS invoice_value
       FROM invoices i
       JOIN orders o ON o.id=i.order_id
       WHERE i.invoice_date BETWEEN $1 AND $2
         AND i.is_voided IS NOT TRUE
       ORDER BY i.invoice_date ASC`,
      [from, to]
    )

    const csvLines = [
      'Invoice No,Invoice Date,Buyer Name,Place of Supply,Taxable Value,CGST Amount,SGST Amount,IGST Amount,Total Tax,Invoice Value'
    ]
    rows.rows.forEach(r => {
      const d = r.invoice_date ? new Date(r.invoice_date).toLocaleDateString('en-IN') : ''
      csvLines.push([
        r.invoice_no, d,
        `"${(r.buyer_name || '').replace(/"/g, "'")}"`,
        `"${r.place_of_supply || ''}"`,
        r.taxable_value, r.cgst_amount, r.sgst_amount, r.igst_amount,
        r.total_tax, r.invoice_value,
      ].join(','))
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=GSTR1_${from}_${to}.csv`)
    res.send(csvLines.join('\n'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'GSTR-1 export failed' })
  }
}

/* ── Void Invoice ─────────────────────────────────────────────────── */
exports.voidInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Void reason must be at least 5 characters' })
    }

    const invRes = await pool.query(
      `SELECT id, invoice_no, is_voided, order_id FROM invoices WHERE id=$1`, [id]
    )
    if (!invRes.rowCount) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    if (invRes.rows[0].is_voided) {
      return res.status(400).json({ success: false, message: 'Invoice is already voided' })
    }

    // Credit note number: CN + original invoice no
    const creditNoteNumber = `CN-${invRes.rows[0].invoice_no}`

    await pool.query(
      `UPDATE invoices SET
         is_voided=true, voided_at=NOW(), void_reason=$1, credit_note_number=$2
       WHERE id=$3`,
      [reason.trim(), creditNoteNumber, id]
    )

    res.json({
      success: true,
      message: 'Invoice voided successfully',
      credit_note_number: creditNoteNumber,
      invoice_no: invRes.rows[0].invoice_no,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Void failed' })
  }
}
