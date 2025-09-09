const { sendPushNotification, sendToUserDevices } = require('../services/pushNotification.service');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validateNotificationData, validateSellerNewOrderNotification, validateCustomerOrderStatusNotification, validateBulkNotification, handleValidationErrors } = require('../middlewares/notificationValidation.middleware');

// Send push notification to specific user (for frontend to trigger)
const sendPushToUser = async (req, res) => {
  try {
    const { targetUserId, title, message, data, type } = req.body;
    const senderId = req.user._id;

    console.log('🔔 sendPushToUser called:', { targetUserId, title, message, type, senderId });

    if (!targetUserId || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'targetUserId, title, and message are required' 
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Target user not found' 
      });
    }

    // Send push notification
    const pushResult = await sendToUserDevices(targetUserId, {
      title,
      message,
      data: {
        ...data,
        type: type || 'general',
        senderId: senderId.toString(),
        timestamp: new Date().toISOString()
      }
    });

    console.log('🔔 Push notification result:', pushResult);

    // Store notification in database
    const notification = new Notification({
      userId: targetUserId,
      type: type || 'general',
      title,
      message,
      data: {
        ...data,
        senderId: senderId.toString(),
        orderId: data?.orderId,
        serviceId: data?.serviceId,
        productId: data?.productId
      },
      read: false,
      priority: 'normal'
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Push notification sent successfully',
      pushResult,
      notificationId: notification._id
    });

  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send push notification',
      error: error.message 
    });
  }
};

// Send push notification to multiple users
const sendPushToMultipleUsers = async (req, res) => {
  try {
    const { targetUserIds, title, message, data, type } = req.body;
    const senderId = req.user._id;

    console.log('🔔 sendPushToMultipleUsers called:', { 
      targetUserIds: targetUserIds?.length, 
      title, 
      message, 
      type, 
      senderId 
    });

    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'targetUserIds array is required' 
      });
    }

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'title and message are required' 
      });
    }

    const results = [];
    const errors = [];

    // Send to each user
    for (const targetUserId of targetUserIds) {
      try {
        // Verify user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          errors.push({ userId: targetUserId, error: 'User not found' });
          continue;
        }

        // Send push notification
        const pushResult = await sendToUserDevices(targetUserId, {
          title,
          message,
          data: {
            ...data,
            type: type || 'general',
            senderId: senderId.toString(),
            timestamp: new Date().toISOString()
          }
        });

        // Store notification in database
        const notification = new Notification({
          userId: targetUserId,
          type: type || 'general',
          title,
          message,
          data: {
            ...data,
            senderId: senderId.toString()
          },
          read: false,
          priority: 'normal'
        });

        await notification.save();

        results.push({
          userId: targetUserId,
          success: true,
          pushResult,
          notificationId: notification._id
        });

      } catch (error) {
        console.error(`❌ Error sending to user ${targetUserId}:`, error);
        errors.push({ 
          userId: targetUserId, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `Push notifications sent to ${results.length} users`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error sending bulk push notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk push notifications',
      error: error.message 
    });
  }
};

// Send seller notification for new order (frontend trigger)
const sendSellerNewOrderNotification = async (req, res) => {
  try {
    const { sellerId, orderData } = req.body;
    const senderId = req.user._id;

    console.log('🔔 sendSellerNewOrderNotification called:', { sellerId, orderData, senderId });

    if (!sellerId || !orderData) {
      return res.status(400).json({ 
        success: false, 
        message: 'sellerId and orderData are required' 
      });
    }

    // Verify seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    const notification = {
      title: '🛒 New Order Received!',
      message: `You have a new order for ${orderData.products?.length || 1} product(s) worth R${orderData.totalAmount || 0}`,
      data: {
        type: 'seller_order',
        orderId: orderData._id || orderData.id,
        sellerId,
        customerName: orderData.customerId?.name || 'Customer',
        totalAmount: orderData.totalAmount,
        productCount: orderData.products?.length || 1,
        senderId: senderId.toString(),
        timestamp: new Date().toISOString()
      }
    };

    // Send push notification
    const pushResult = await sendToUserDevices(sellerId, notification);

    // Store notification in database
    const dbNotification = new Notification({
      userId: sellerId,
      type: 'seller_order', // FIXED: Match frontend type
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      priority: 'high'
    });

    await dbNotification.save();

    res.json({
      success: true,
      message: 'Seller notification sent successfully',
      pushResult,
      notificationId: dbNotification._id
    });

  } catch (error) {
    console.error('❌ Error sending seller new order notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send seller notification',
      error: error.message 
    });
  }
};

// Send customer notification for order status update (frontend trigger)
const sendCustomerOrderStatusNotification = async (req, res) => {
  try {
    const { customerId, orderId, status, orderDetails } = req.body;
    const senderId = req.user._id;

    console.log('🔔 sendCustomerOrderStatusNotification called:', { 
      customerId, 
      orderId, 
      status, 
      senderId 
    });

    if (!customerId || !orderId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'customerId, orderId, and status are required' 
      });
    }

    // Verify customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Get status-specific title and message
    const { title, message } = getOrderStatusNotification(status);

    const notification = {
      title,
      message,
      data: {
        type: 'customer_order_status', // FIXED: Match frontend type
        orderId,
        status,
        orderDetails,
        senderId: senderId.toString(),
        timestamp: new Date().toISOString()
      }
    };

    // Send push notification
    const pushResult = await sendToUserDevices(customerId, notification);

    // Store notification in database
    const dbNotification = new Notification({
      userId: customerId,
      type: 'customer_order_status', // FIXED: Match frontend type
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      priority: 'normal'
    });

    await dbNotification.save();

    res.json({
      success: true,
      message: 'Customer order status notification sent successfully',
      pushResult,
      notificationId: dbNotification._id
    });

  } catch (error) {
    console.error('❌ Error sending customer order status notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send customer notification',
      error: error.message 
    });
  }
};

// Helper function to get order status notification content
const getOrderStatusNotification = (status) => {
  switch (status.toLowerCase()) {
    case 'shipped':
      return {
        title: '🚚 Order Shipped!',
        message: 'Your order has been shipped! Start tracking it now'
      };
    case 'delivered':
      return {
        title: '📦 Order Delivered!',
        message: 'Your order is delivered! Thank you for shopping with Aura'
      };
    case 'processing':
      return {
        title: '⚙️ Order Processing',
        message: 'Your order is being processed and will be shipped soon'
      };
    case 'out_for_delivery':
      return {
        title: '🚛 Out for Delivery',
        message: 'Your order is out for delivery! It will arrive soon'
      };
    case 'cancelled':
      return {
        title: '❌ Order Cancelled',
        message: 'Your order has been cancelled. Contact support if you have questions'
      };
    case 'refunded':
      return {
        title: '💰 Order Refunded',
        message: 'Your order has been refunded. Check your payment method for the refund'
      };
    case 'confirmed':
      return {
        title: '✅ Order Confirmed',
        message: 'Your order has been confirmed and is being prepared'
      };
    case 'preparing':
      return {
        title: '📋 Order Being Prepared',
        message: 'Your order is being prepared and will be shipped soon'
      };
    default:
      return {
        title: '📋 Order Update',
        message: `Your order status has been updated to: ${status}`
      };
  }
};

// Test push notification
const testPushNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.pushToken) {
      return res.status(400).json({ 
        message: "User has no push token registered",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          hasPushToken: false
        }
      });
    }

    const result = await sendPushNotification(user.pushToken, {
      title: 'Test Notification',
      message: 'This is a test notification from Aura App',
      data: { type: 'test' }
    });
    
    res.json({
      success: result.success,
      message: result.message,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        pushToken: user.pushToken.substring(0, 20) + '...' // Show first 20 chars for security
      }
    });

  } catch (error) {
    console.error('❌ Test push notification failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test notification failed',
      error: error.message 
    });
  }
};

// Get user's push token status
const getPushTokenStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId, 'name email pushToken devices');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasPushToken: !!user.pushToken,
        pushToken: user.pushToken ? `${user.pushToken.substring(0, 20)}...` : null,
        devices: user.devices || [],
        deviceCount: user.devices?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Error getting push token status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get push token status',
      error: error.message 
    });
  }
};

// Get all notifications for user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type, read } = req.query;
    
    const query = { userId };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get notifications',
      error: error.message 
    });
  }
};

// Get seller-specific notifications
const getSellerNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ 
      userId,
      type: { $in: ['seller_order', 'seller_payment', 'seller_system'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ 
      userId,
      type: { $in: ['seller_order', 'seller_payment', 'seller_system'] }
    });
    
    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error getting seller notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get seller notifications',
      error: error.message 
    });
  }
};

// Get customer-specific notifications
const getCustomerNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ 
      userId,
      type: { $in: ['customer_order_status', 'customer_payment', 'customer_system'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ 
      userId,
      type: { $in: ['customer_order_status', 'customer_payment', 'customer_system'] }
    });
    
    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error getting customer notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get customer notifications',
      error: error.message 
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, read: false });
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count',
      error: error.message 
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read',
      error: error.message 
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndDelete({ 
      _id: notificationId, 
      userId 
    });
    
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
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
};

// Clear all notifications
const clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.deleteMany({ userId });
    
    res.json({
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear notifications',
      error: error.message 
    });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority = 'normal' } = req.body;
    const senderId = req.user._id;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, type, title, and message are required' 
      });
    }
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data: {
        ...data,
        senderId: senderId.toString(),
        timestamp: new Date().toISOString()
      },
      read: false,
      priority
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
};

// Create system notification for all users
const createSystemNotification = async (req, res) => {
  try {
    const { type, title, message, data, priority = 'normal' } = req.body;
    const senderId = req.user._id;
    
    if (!type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'type, title, and message are required' 
      });
    }
    
    // Get all users
    const users = await User.find({}, '_id');
    
    const notifications = users.map(user => ({
      userId: user._id,
      type: `system_${type}`,
      title,
      message,
      data: {
        ...data,
        senderId: senderId.toString(),
        timestamp: new Date().toISOString()
      },
      read: false,
      priority
    }));
    
    const result = await Notification.insertMany(notifications);
    
    res.status(201).json({
      success: true,
      message: `System notification sent to ${result.length} users`,
      notificationCount: result.length
    });
  } catch (error) {
    console.error('❌ Error creating system notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create system notification',
      error: error.message 
    });
  }
};

module.exports = {
  sendPushToUser,
  sendPushToMultipleUsers,
  sendSellerNewOrderNotification,
  sendCustomerOrderStatusNotification,
  testPushNotification,
  getPushTokenStatus,
  getNotifications,
  getSellerNotifications,
  getCustomerNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  createNotification,
  createSystemNotification
};