const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get current user's orders (for customer to view their own orders)
router.get('/customer', orderController.getCurrentUserOrders);

// Get seller's orders
router.get('/seller', orderController.getSellerOrders);

// Get seller statistics
router.get('/seller/stats', orderController.getSellerStats);

// Get customer orders (for seller to view customer history)
router.get('/customer/:customerId', orderController.getCustomerOrders);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

// Create new order
router.post('/', orderController.createOrder);

// Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/status', orderController.updateOrderStatus);

// 🚚 REAL-TIME DELIVERY TRACKING (SAFE NEW ENDPOINT)
router.patch('/:orderId/tracking', orderController.updateDeliveryTracking);

// Delete order
router.delete('/:orderId', orderController.deleteOrder);

// Delete all customer orders (delivered only)
router.delete('/', orderController.deleteAllCustomerOrders);

module.exports = router;
