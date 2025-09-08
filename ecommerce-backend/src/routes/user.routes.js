const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get current user
router.get('/me', userController.getCurrentUser);

// Update current user profile
router.put('/me/profile', userController.updateCurrentUserProfile);

// Update push token for notifications
router.put('/me/push-token', userController.updatePushToken);

// Register/unregister device tokens
router.post('/me/devices/register', userController.registerDevice);
router.post('/me/devices/unregister', userController.unregisterDevice);

// Debug endpoint to check push token status (for development only)
router.get('/debug/push-tokens', userController.debugPushTokens);

// Upload current user profile picture
router.post('/me/profile-picture', userController.upload.single('profilePicture'), userController.uploadProfilePicture);

// Get user by ID (for viewing customer profiles)
router.get('/:userId', userController.getUserById);

// Update user by ID
router.put('/:userId/profile', userController.updateUserById);

// Upload profile picture for specific user
router.post('/:userId/profile-picture', userController.upload.single('profilePicture'), userController.uploadProfilePicture);

module.exports = router;
