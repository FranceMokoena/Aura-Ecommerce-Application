const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createShopProduct,
  getMyShopProducts,
  getShopProduct,
  updateShopProduct,
  getAllShopProducts,
  addProductRating,
  bulkUpdateProducts,
  deleteShopProduct,
  getProductAnalytics,
  createDualProduct
} = require('../controllers/shopProduct.controller');

// Public routes (no authentication required)
router.get('/', getAllShopProducts);
router.get('/:id', getShopProduct);

// Protected routes (require authentication)
router.use(authMiddleware);

// Shop owner routes
router.post('/', createShopProduct);
router.post('/dual-create', createDualProduct); // NEW: Dual product creation
router.get('/me/products', getMyShopProducts);
router.put('/:id', updateShopProduct);
router.post('/bulk-update', bulkUpdateProducts);
router.delete('/:id', deleteShopProduct);
router.get('/me/analytics', getProductAnalytics);

// Customer routes (for rating products)
router.post('/:id/rating', addProductRating);

module.exports = router;
