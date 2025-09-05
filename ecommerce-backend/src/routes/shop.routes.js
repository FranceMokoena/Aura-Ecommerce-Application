const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createShop,
  getMyShop,
  updateShop,
  getAllShops,
  getShop,
  getShopAnalytics,
  updateShopRating,
  deleteShop
} = require('../controllers/shop.controller');

// Public routes (no authentication required)
router.get('/', getAllShops);
router.get('/:id', getShop);

// Protected routes (require authentication)
router.use(authMiddleware);

// Shop owner routes
router.post('/', createShop);
router.get('/me/shop', getMyShop);
router.put('/me/shop', updateShop);
router.get('/me/analytics', getShopAnalytics);
router.delete('/me/shop', deleteShop);

// Customer routes (for rating shops)
router.post('/:id/rating', updateShopRating);

module.exports = router;
