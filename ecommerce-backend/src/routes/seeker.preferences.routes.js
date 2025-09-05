const express = require('express');
const router = express.Router();
const seekerPreferencesController = require('../controllers/seeker.preferences.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Verify user is a seeker
router.use((req, res, next) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only seekers can access this endpoint.'
    });
  }
  next();
});

// Get seeker preferences
router.get('/', seekerPreferencesController.getSeekerPreferences);

// Update seeker preferences
router.put('/', seekerPreferencesController.updateSeekerPreferences);

// Reset seeker preferences to defaults
router.post('/reset', seekerPreferencesController.resetSeekerPreferences);

// Export seeker preferences
router.get('/export', seekerPreferencesController.exportSeekerPreferences);

module.exports = router;
