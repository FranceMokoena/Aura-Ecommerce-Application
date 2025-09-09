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

    const result = await testPushNotification(user.pushToken);
    
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

module.exports = {
  sendPushToUser,
  sendPushToMultipleUsers,
  sendSellerNewOrderNotification,
  sendCustomerOrderStatusNotification,
  testPushNotification,
  getPushTokenStatus
};