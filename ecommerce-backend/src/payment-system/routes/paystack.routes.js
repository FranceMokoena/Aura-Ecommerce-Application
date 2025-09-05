const express = require('express');
const router = express.Router();
const paystackController = require('../controllers/paystack.controller');
const auth = require('../../middlewares/auth.middleware');

// Payment routes
router.post('/initialize', auth, paystackController.initializePayment);
router.post('/verify', auth, paystackController.verifyPayment);
router.post('/create-order', auth, paystackController.createOrderWithPayment);

// Subscription routes
router.post('/subscription/create', auth, paystackController.createSubscription);
router.post('/subscription/cancel', auth, paystackController.cancelSubscription);
router.get('/subscription/status', auth, paystackController.getSubscriptionStatus);

// Payout setup routes
router.get('/banks', paystackController.getBankList);
router.post('/payout/setup', auth, paystackController.setupPayoutRecipient);

// Revenue tracking routes
router.get('/revenue', auth, paystackController.getSellerRevenue);

// Webhook route (no auth required for webhooks)
router.post('/webhook', paystackController.handleWebhook);

module.exports = router;
