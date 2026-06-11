const express = require('express');
const router = express.Router();
const ctrl = require('./support.controller');
const { auth, optionalAuth } = require('../../middlewares/auth');
const { admin } = require('../../middlewares/admin');

/* ── PUBLIC (contact form) ── */
router.post('/contact', optionalAuth, ctrl.contactForm);

/* ── USER ── */
router.get('/tickets', auth, ctrl.myTickets);
router.post('/tickets', auth, ctrl.createTicket);
router.get('/tickets/:id', auth, ctrl.getTicket);
router.post('/tickets/:id/reply', auth, ctrl.replyTicket);
router.put('/tickets/:id/close', auth, ctrl.closeTicket);

/* ── ADMIN ── */
router.get('/admin/tickets', admin, ctrl.adminTickets);
router.get('/admin/tickets/:id', admin, ctrl.getTicket);
router.put('/admin/tickets/:id', admin, ctrl.adminUpdateTicket);
router.post('/admin/tickets/:id/reply', admin, ctrl.adminReply);

module.exports = router;
