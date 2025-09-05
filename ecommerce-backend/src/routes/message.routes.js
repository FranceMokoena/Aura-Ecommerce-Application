const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Send a message
router.post('/send', messageController.sendMessage);

// Get conversations list for a user
router.get('/conversations', messageController.getConversationsList);

// Get conversation between two users
router.get('/conversation/:partnerId', messageController.getConversation);

// Mark message as read
router.put('/read/:messageId', messageController.markMessageAsRead);

// Mark conversation as read
router.put('/conversation/:partnerId/read', messageController.markConversationAsRead);

// Get unread count for a user
router.get('/unread-count', messageController.getUnreadCount);

// Delete a message (only sender can delete)
router.delete('/:messageId', messageController.deleteMessage);

// Get recent messages for dashboard
router.get('/recent', messageController.getRecentMessages);

// Search messages
router.get('/search', messageController.searchMessages);

module.exports = router;
