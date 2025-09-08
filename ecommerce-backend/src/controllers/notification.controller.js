const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification, testPushNotification } = require('../services/pushNotification.service');

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;
    const userId = req.user.id;

    // Build query
    const query = { userId };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: notificationId, userId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Clear all notifications for a user
exports.clearNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({ userId });

    res.json({
      success: true,
      message: 'All notifications cleared successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority = 'normal' } = req.body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      priority,
      read: false
    });

    await notification.save();

    // Send push notification if user has push token
    if (user.pushToken) {
      try {
        await sendPushNotification(user.pushToken, {
          title,
          body: message,
          data: {
            notificationId: notification._id.toString(),
            type,
            ...data
          }
        });
      } catch (pushError) {
        console.error('Push notification failed:', pushError);
        // Don't fail the request if push notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Create a system notification (admin only)
exports.createSystemNotification = async (req, res) => {
  try {
    const { userIds, type, title, message, data, priority = 'normal' } = req.body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userIds (array), type, title, message'
      });
    }

    // Check if all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some users not found'
      });
    }

    // Create notifications for all users
    const notifications = [];
    const pushPromises = [];

    for (const userId of userIds) {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
        priority,
        read: false,
        isSystem: true
      });

      notifications.push(notification);

      // Prepare push notification if user has push token
      const user = users.find(u => u._id.toString() === userId);
      if (user && user.pushToken) {
        pushPromises.push(
          sendPushNotification(user.pushToken, {
            title,
            body: message,
            data: {
              notificationId: notification._id.toString(),
              type,
              isSystem: true,
              ...data
            }
          }).catch(error => {
            console.error(`Push notification failed for user ${userId}:`, error);
            return null; // Don't fail the entire operation
          })
        );
      }
    }

    // Save all notifications
    await Notification.insertMany(notifications);

    // Send push notifications (don't wait for them to complete)
    Promise.all(pushPromises).catch(error => {
      console.error('Some push notifications failed:', error);
    });

    res.status(201).json({
      success: true,
      message: 'System notifications created successfully',
      count: notifications.length
    });

  } catch (error) {
    console.error('Error creating system notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create system notifications',
      error: error.message
    });
  }
};

// Get seller notifications
exports.getSellerNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;
    const userId = req.user.id;

    // Build query for seller notifications
    const query = { 
      userId,
      type: { $in: [
        'new_order',
        'order_cancelled',
        'order_completed',
        'payment_received',
        'refund_requested',
        'product_review',
        'low_stock_alert'
      ]}
    };
    
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching seller notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller notifications',
      error: error.message
    });
  }
};

// Get customer notifications
exports.getCustomerNotifications = async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user._id,
    type: { $in: [
      'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
      'payment_confirmed', 'refund_processed', 'product_available', 'promotion_offer'
    ]}
  }).sort({ createdAt: -1 });
  // Map _id to id for frontend
  const mapped = notifications.map(n => ({
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data,
    read: n.read,
    createdAt: n.createdAt,
    // ...other fields...
  }));
  res.json(mapped);
};

// Get seeker notifications
exports.getSeekerNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;
    const userId = req.user.id;

    // Build query for seeker notifications
    const query = { 
      userId,
      type: { $in: [
        'seeker_new_booking',
        'seeker_booking_confirmed',
        'seeker_booking_cancelled',
        'seeker_service_completed'
      ]}
    };
    
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching seeker notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker notifications',
      error: error.message
    });
  }
};

// Test push notification for current user
exports.testPushNotification = async (req, res) => {
  try {
    console.log('🚨🚨🚨 TEST PUSH NOTIFICATION METHOD CALLED! 🚨🚨🚨');
    console.log('🚨🚨🚨 This is the CORRECT method for /notifications/test endpoint 🚨🚨🚨');
    const userId = req.user.id;
    console.log('🧪 Testing push notification for user:', userId);
    
    // Get user to check if they have a push token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'User has no push token registered',
        hasPushToken: false
      });
    }
    
    console.log('🧪 User has push token, testing notification...');
    
    // Test the push notification
    const result = await testPushNotification(user.pushToken);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test push notification sent successfully',
        hasPushToken: true,
        pushToken: user.pushToken.substring(0, 20) + '...' // Show first 20 chars for security
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test push notification failed',
        error: result.message,
        hasPushToken: true
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing push notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test push notification',
      error: error.message
    });
  }
};
