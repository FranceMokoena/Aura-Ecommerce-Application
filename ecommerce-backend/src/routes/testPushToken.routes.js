const express = require('express');
const router = express.Router();
const { testPushTokenSystem, getPushTokenStatus } = require('../controllers/testPushToken.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Test push token system
router.post('/test', testPushTokenSystem);

// Get push token status
router.get('/status', getPushTokenStatus);

module.exports = router;
