const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getProviderServices,
  toggleServiceAvailability,
  addServiceRating,
  getSeekerAnalytics
} = require('../controllers/service.controller');

// Public routes (no authentication required)
router.get('/', getServices);
router.get('/:id', getService);
router.get('/provider/:providerId', getProviderServices);

// Protected routes (authentication required)
router.post('/', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.delete('/:id', authMiddleware, deleteService);
router.patch('/:id/toggle-availability', authMiddleware, toggleServiceAvailability);
router.post('/:id/rating', authMiddleware, addServiceRating);

// Analytics routes
router.get('/me/analytics', authMiddleware, getSeekerAnalytics);

module.exports = router;
