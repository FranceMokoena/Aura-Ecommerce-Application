const express = require("express");
const { 
  createPaymentIntent,
  createOrderWithPayment,
  confirmPayment
} = require("../controllers/payment.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

console.log('Payment routes loaded');

// All routes require authentication
router.use(authMiddleware);

// Payment routes
router.post("/create-payment-intent", (req, res, next) => {
  console.log('Route hit: /create-payment-intent');
  next();
}, createPaymentIntent);

router.post("/create-order", (req, res, next) => {
  console.log('Route hit: /create-order');
  next();
}, createOrderWithPayment);

router.post("/confirm", (req, res, next) => {
  console.log('Route hit: /confirm');
  next();
}, confirmPayment);

module.exports = router;
