const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  purchaseTicket,
  confirmTicketPurchase,
  getMyTickets,
  getTicket,
  validateTicket,
  refundTicket,
  getTicketStats
} = require('../controllers/ticket.controller');

// All routes require authentication
router.use(authMiddleware);

// Customer routes
router.post('/purchase', purchaseTicket);
router.post('/confirm-purchase', confirmTicketPurchase);
router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicket);
router.post('/refund', refundTicket);

// Event organizer routes (for ticket validation and stats)
router.post('/validate', validateTicket);
router.get('/stats/:eventId', getTicketStats);

module.exports = router;
