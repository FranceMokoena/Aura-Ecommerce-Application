const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/notifications - Get all notifications for user
router.get('/', notificationController.getNotifications);

// GET /api/notifications/seller - Get seller-specific notifications
router.get('/seller', notificationController.getSellerNotifications);

// GET /api/notifications/customer - Get customer-specific notifications
router.get('/customer', notificationController.getCustomerNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// DELETE /api/notifications/clear - Clear all notifications
router.delete('/clear', notificationController.clearNotifications);

// POST /api/notifications/test - Test push notification for current user
// This MUST come BEFORE the general POST / route to avoid conflicts
router.post('/test', notificationController.testPushNotification);

// POST /api/notifications - Create a new notification
router.post('/', notificationController.createNotification);

// POST /api/notifications/system - Create system notification for all users
router.post('/system', notificationController.createSystemNotification);

module.exports = router;
