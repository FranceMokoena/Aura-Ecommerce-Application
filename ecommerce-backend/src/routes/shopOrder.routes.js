const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createShopProductOrder,
  getShopManagerOrders,
  updateShopOrderStatus,
  getShopOrderAnalytics,
  getShopOrderDetails,
  getCustomerShopOrders
} = require('../controllers/shopOrder.controller');

// All routes require authentication
router.use(authMiddleware);

// Customer routes
router.post('/create', createShopProductOrder);
router.get('/customer/orders', getCustomerShopOrders);

// Shop manager routes
router.get('/manager/orders', getShopManagerOrders);
router.get('/manager/analytics', getShopOrderAnalytics);
router.get('/manager/orders/:orderId', getShopOrderDetails);
router.put('/manager/orders/:orderId/status', updateShopOrderStatus);

module.exports = router;
