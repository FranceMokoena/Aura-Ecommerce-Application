const express = require('express');
const router = express.Router();
const messageController = require('../controllers/seeker.message.controller');
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

// Send a message as a seeker
router.post('/send', messageController.sendSeekerMessage);

// Get seeker conversations list (ONLY with customers)
router.get('/conversations', messageController.getSeekerConversationsList);

// Get conversation between seeker and a specific customer
router.get('/conversation/:partnerId', messageController.getSeekerConversation);

// Mark message as read
router.put('/:messageId/read', messageController.markSeekerMessageAsRead);

// Mark conversation as read
router.put('/conversation/:partnerId/read', messageController.markSeekerConversationAsRead);

// Get unread count for seeker
router.get('/unread-count', messageController.getSeekerUnreadCount);

// Delete a message (only sender can delete)
router.delete('/:messageId', messageController.deleteSeekerMessage);

// Search messages in seeker conversations
router.get('/search', messageController.searchSeekerMessages);

module.exports = router;
