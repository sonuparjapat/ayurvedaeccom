const pool = require('../../config/db');
const { emitToTicket, emitToAdmin, emitToUser } = require('../../socket');
const { createNotification } = require('../../services/notification.service');
const { sendToUser: sendPushToUser } = require('../../services/pushNotification');
const mailer = require('../../config/mail');

const APP = () => process.env.APP_NAME || 'Oroganix';
const MAIL_FROM = () => process.env.MAIL_FROM || 'noreply@oroganix.com';
const FRONTEND_URL = () => process.env.FRONTEND_URL || 'https://oroganix.com';

async function sendSupportEmail({ email, name, subject, html }) {
  try {
    await mailer.sendTransacEmail({
      sender: { email: MAIL_FROM(), name: APP() },
      to: [{ email, name: name || 'Customer' }],
      subject,
      htmlContent: html,
    });
  } catch (err) {
    console.error('[SUPPORT EMAIL]', err.message);
  }
}

/* ── USER: list own tickets ── */
exports.myTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE t.user_id=$1';
    const vals = [req.user.id];
    let i = 2;
    if (status) { where += ` AND t.status=$${i++}`; vals.push(status); }
    const total = (await pool.query(`SELECT COUNT(*) FROM support_tickets t ${where}`, vals)).rows[0].count;
    const rows = await pool.query(
      `SELECT t.id, t.subject, t.category, t.status, t.priority, t.created_at, t.updated_at,
              (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id=t.id) AS message_count
       FROM support_tickets t ${where} ORDER BY t.updated_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    res.json({ success: true, tickets: rows.rows, total: parseInt(total), page: parseInt(page) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── USER: create ticket ── */
exports.createTicket = async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject, category = 'general', priority = 'medium', message, order_id } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'subject and message required' });
    const user = (await pool.query('SELECT name, email FROM users WHERE id=$1', [req.user.id])).rows[0];
    await client.query('BEGIN');
    const ticket = await client.query(
      `INSERT INTO support_tickets (user_id, user_name, user_email, subject, category, priority, order_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'open') RETURNING *`,
      [req.user.id, user.name, user.email, subject, category, priority, order_id || null]
    );
    const t = ticket.rows[0];
    await client.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_type, message) VALUES ($1,$2,'user',$3)`,
      [t.id, req.user.id, message]
    );
    await client.query('COMMIT');
    emitToAdmin('new_ticket', { ticket_id: t.id, subject: t.subject, user_name: user.name });
    sendSupportEmail({
      email: user.email,
      name: user.name,
      subject: `[#${t.id}] Support Ticket Received — ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f0f7f4;border-radius:12px;">
        <h2 style="color:#1a3a2a;margin:0 0 8px;">Ticket Received ✅</h2>
        <p style="color:#374151;margin:0 0 16px;">Hi ${user.name}, we've received your support request and will respond within 24 hours.</p>
        <div style="background:#fff;border-radius:8px;padding:16px;border-left:4px solid #10b981;margin-bottom:16px;">
          <p style="margin:0;font-size:13px;color:#6b7280;">Ticket #${t.id}</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#1a3a2a;">${subject}</p>
        </div>
        <a href="${FRONTEND_URL()}/support/${t.id}" style="display:inline-block;padding:12px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View Ticket →</a>
        <p style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ${APP()} · All rights reserved</p>
      </div>`,
    });
    res.status(201).json({ success: true, ticket: t });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

/* ── USER / ADMIN: get ticket detail + messages ── */
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role <= 2;
    const ticketQ = isAdmin
      ? `SELECT t.*, u.name as assigned_name FROM support_tickets t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=$1`
      : `SELECT t.*, u.name as assigned_name FROM support_tickets t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=$1 AND t.user_id=$2`;
    const vals = isAdmin ? [id] : [id, req.user.id];
    const ticket = (await pool.query(ticketQ, vals)).rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const messages = (await pool.query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM support_messages m LEFT JOIN users u ON u.id=m.sender_id
       WHERE m.ticket_id=$1 ORDER BY m.created_at ASC`,
      [id]
    )).rows;
    res.json({ success: true, ticket, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── USER: reply to own ticket ── */
exports.replyTicket = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
    const ticket = (await pool.query('SELECT * FROM support_tickets WHERE id=$1 AND user_id=$2', [id, req.user.id])).rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'closed') return res.status(400).json({ success: false, message: 'Ticket is closed' });
    await client.query('BEGIN');
    const msg = (await client.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_type, message) VALUES ($1,$2,'user',$3) RETURNING *`,
      [id, req.user.id, message.trim()]
    )).rows[0];
    await client.query(`UPDATE support_tickets SET updated_at=NOW(), status=CASE WHEN status='resolved' THEN 'open' ELSE status END WHERE id=$1`, [id]);
    await client.query('COMMIT');
    const user = (await pool.query('SELECT name FROM users WHERE id=$1', [req.user.id])).rows[0];
    emitToTicket(id, 'new_message', { ...msg, sender_name: user?.name });
    emitToAdmin('ticket_reply', { ticket_id: parseInt(id), sender: user?.name });
    res.json({ success: true, message: msg });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

/* ── USER: close own ticket ── */
exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = (await pool.query('SELECT id FROM support_tickets WHERE id=$1 AND user_id=$2', [id, req.user.id])).rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    await pool.query(`UPDATE support_tickets SET status='closed', closed_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── ADMIN: list all tickets ── */
exports.adminTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, category, search } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const vals = [];
    let i = 1;
    if (status) { where += ` AND t.status=$${i++}`; vals.push(status); }
    if (priority) { where += ` AND t.priority=$${i++}`; vals.push(priority); }
    if (category) { where += ` AND t.category=$${i++}`; vals.push(category); }
    if (search) { where += ` AND (t.subject ILIKE $${i} OR t.user_email ILIKE $${i} OR t.user_name ILIKE $${i})`; vals.push(`%${search}%`); i++; }
    const total = (await pool.query(`SELECT COUNT(*) FROM support_tickets t ${where}`, vals)).rows[0].count;
    const rows = await pool.query(
      `SELECT t.id, t.subject, t.category, t.status, t.priority, t.user_name, t.user_email,
              t.created_at, t.updated_at,
              (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id=t.id) AS message_count,
              a.name as assigned_name
       FROM support_tickets t LEFT JOIN users a ON a.id=t.assigned_to
       ${where} ORDER BY t.updated_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    res.json({ success: true, tickets: rows.rows, total: parseInt(total), page: parseInt(page) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── ADMIN: update ticket (status/priority/assigned_to) ── */
exports.adminUpdateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;
    const fields = [];
    const vals = [];
    let i = 1;
    if (status) { fields.push(`status=$${i++}`); vals.push(status); }
    if (priority) { fields.push(`priority=$${i++}`); vals.push(priority); }
    if (assigned_to !== undefined) { fields.push(`assigned_to=$${i++}`); vals.push(assigned_to || null); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    if (status === 'closed') { fields.push(`closed_at=NOW()`); }
    fields.push(`updated_at=NOW()`);
    vals.push(id);
    const t = (await pool.query(`UPDATE support_tickets SET ${fields.join(',')} WHERE id=$${i} RETURNING user_id`, vals)).rows[0];
    if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (t.user_id && status) {
      emitToUser(t.user_id, 'ticket_status_updated', { ticket_id: parseInt(id), status });
      const label = status.replace(/_/g, ' ')
      createNotification(t.user_id, 'ticket_status', `Support ticket #${id} — ${label}`, `Your support ticket status has been updated to: ${label}`, { ticket_id: parseInt(id), status })
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── ADMIN: reply to ticket ── */
exports.adminReply = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
    const ticket = (await pool.query('SELECT * FROM support_tickets WHERE id=$1', [id])).rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    await client.query('BEGIN');
    const msg = (await client.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_type, message) VALUES ($1,$2,'admin',$3) RETURNING *`,
      [id, req.user.id, message.trim()]
    )).rows[0];
    await client.query(
      `UPDATE support_tickets SET updated_at=NOW(), status=CASE WHEN status='open' THEN 'in_progress' ELSE status END WHERE id=$1`,
      [id]
    );
    await client.query('COMMIT');
    const admin = (await pool.query('SELECT name FROM users WHERE id=$1', [req.user.id])).rows[0];
    const fullMsg = { ...msg, sender_name: admin?.name || 'Support Team' };
    emitToTicket(id, 'new_message', fullMsg);
    emitToAdmin('ticket_reply', { ticket_id: parseInt(id), sender: admin?.name || 'Admin' });
    if (ticket.user_id) {
      emitToUser(ticket.user_id, 'admin_replied', { ticket_id: parseInt(id), subject: ticket.subject });
      createNotification(ticket.user_id, 'support_reply', `Support replied: ${ticket.subject}`, message.trim(), { ticket_id: parseInt(id) });
      sendPushToUser(
        ticket.user_id,
        `Support Reply 💬`,
        `Your ticket "${ticket.subject}" has a new reply`,
        { type: 'support_reply', ticket_id: parseInt(id) }
      );
      if (ticket.user_email) {
        sendSupportEmail({
          email: ticket.user_email,
          name: ticket.user_name,
          subject: `[#${id}] New Reply — ${ticket.subject}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f0f7f4;border-radius:12px;">
            <h2 style="color:#1a3a2a;margin:0 0 8px;">New reply on your support ticket 💬</h2>
            <p style="color:#374151;margin:0 0 16px;">Hi ${ticket.user_name || 'there'}, our support team has replied to your ticket.</p>
            <div style="background:#fff;border-radius:8px;padding:16px;border-left:4px solid #10b981;margin-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#6b7280;">Ticket #${id} · ${ticket.subject}</p>
              <p style="margin:8px 0 0;font-size:15px;color:#1a3a2a;">${message.trim()}</p>
            </div>
            <a href="${FRONTEND_URL()}/support/${id}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Reply →</a>
            <p style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ${APP()} · All rights reserved</p>
          </div>`,
        });
      }
    }
    res.json({ success: true, message: fullMsg });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

/* ── PUBLIC: contact form → creates guest ticket ── */
exports.contactForm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, subject, message, category = 'general' } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: 'All fields required' });
    const userId = req.user?.id || null;
    await client.query('BEGIN');
    const ticket = (await client.query(
      `INSERT INTO support_tickets (user_id, user_name, user_email, subject, category, status, priority)
       VALUES ($1,$2,$3,$4,$5,'open','medium') RETURNING *`,
      [userId, name, email, subject, category]
    )).rows[0];
    await client.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_type, message) VALUES ($1,$2,'user',$3)`,
      [ticket.id, userId, message]
    );
    await client.query('COMMIT');
    emitToAdmin('new_ticket', { ticket_id: ticket.id, subject: ticket.subject, user_name: name });
    res.status(201).json({ success: true, ticket_id: ticket.id, message: 'Your enquiry has been submitted. We will get back to you soon.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};
