const { sendPushNotification, sendBulkPushNotifications } = require('./pushNotification.service');
const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// ============================================================================
// CUSTOMER NOTIFICATIONS
// ============================================================================

// Customer Order Status Notifications
const sendCustomerOrderNotification = async (customerId, orderStatus, orderData) => {
  let type;
  switch (orderStatus) {
    case 'confirmed':
      type = 'order_confirmed';
      break;
    case 'shipped':
      type = 'order_shipped';
      break;
    case 'delivered':
      type = 'order_delivered';
      break;
    case 'cancelled':
      type = 'order_cancelled';
      break;
    default:
      type = 'order_update';
  }
  const notification = new Notification({
    userId: customerId,
    type,
    title: `Order ${orderStatus}`,
    message: `Your order status is now ${orderStatus}.`,
    data: orderData,
    read: false,
  });
  await notification.save();
  return notification;
};

// Customer Payment Notifications
const sendCustomerPaymentNotification = async (customerId, paymentStatus, paymentData) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) return;

    const statusMessages = {
      'successful': `Payment successful! Amount: R${paymentData.amount} ✅`,
      'failed': 'Payment failed. Please try again ❌',
      'pending': 'Payment is pending. Please wait ⏳',
      'refunded': `Refund processed! Amount: R${paymentData.amount} 💰`,
      'cancelled': 'Payment was cancelled ❌'
    };

    const message = statusMessages[paymentStatus] || 'Payment status updated';

    // Send push notification if user has push token
    if (customer.pushToken) {
    await sendPushNotification(customer.pushToken, {
      title: 'Payment Update',
      message: message,
      data: {
        type: 'customer_payment',
        paymentId: paymentData.paymentId,
        status: paymentStatus,
        amount: paymentData.amount,
        orderId: paymentData.orderId
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: customerId,
      title: 'Payment Update',
      message: message,
      type: 'customer_payment',
      data: {
        paymentId: paymentData.paymentId,
        status: paymentStatus,
        amount: paymentData.amount,
        orderId: paymentData.orderId
      },
      priority: 'normal'
    });

    await notification.save();
    console.log('✅ Payment notification stored in database for customer');

    console.log(`✅ Customer payment notification sent: ${paymentStatus} for payment ${paymentData.paymentId}`);

  } catch (error) {
    console.error('❌ Customer payment notification failed:', error);
  }
};

// Customer Service Booking Notifications
const sendCustomerBookingNotification = async (customerId, bookingStatus, bookingData) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) return;

    const statusMessages = {
      'pending': `Your ${bookingData.serviceName} booking is pending confirmation ⏳`,
      'confirmed': `Your ${bookingData.serviceName} booking has been confirmed! 🎉`,
      'in_progress': `Your ${bookingData.serviceName} service is in progress! ⚙️`,
      'completed': `Your ${bookingData.serviceName} service has been completed! ✅`,
      'cancelled': `Your ${bookingData.serviceName} booking has been cancelled ❌`,
      'rescheduled': `Your ${bookingData.serviceName} booking has been rescheduled 📅`
    };

    const message = statusMessages[bookingStatus] || `Your ${bookingData.serviceName} booking status updated`;

    // Send push notification if user has push token
    if (customer.pushToken) {
    await sendPushNotification(customer.pushToken, {
      title: 'Service Booking Update',
      message: message,
      data: {
        type: 'customer_booking',
        bookingId: bookingData.bookingId,
        status: bookingStatus,
        serviceName: bookingData.serviceName,
        serviceId: bookingData.serviceId,
        scheduledDate: bookingData.scheduledDate
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: customerId,
      title: 'Service Booking Update',
      message: message,
      type: 'customer_booking',
      data: {
        bookingId: bookingData.bookingId,
        status: bookingStatus,
        serviceName: bookingData.serviceName,
        serviceId: bookingData.serviceId,
        scheduledDate: bookingData.scheduledDate
      },
      priority: 'normal'
    });

    await notification.save();
    console.log('✅ Booking notification stored in database for customer');

    console.log(`✅ Customer booking notification sent: ${bookingStatus} for booking ${bookingData.bookingId}`);

  } catch (error) {
    console.error('❌ Customer booking notification failed:', error);
  }
};

// Customer Delivery Notifications
const sendCustomerDeliveryNotification = async (customerId, deliveryStatus, deliveryData) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) return;

    const statusMessages = {
      'picked_up': 'Your order has been picked up and is on its way! 🚚',
      'in_transit': 'Your order is in transit! 📦',
      'out_for_delivery': 'Your order is out for delivery! 🎯',
      'delivered': 'Your order has been delivered! 🎉',
      'failed_delivery': 'Delivery failed. We will retry! 🔄'
    };

    const message = statusMessages[deliveryStatus] || 'Delivery status updated';

    // Send push notification if user has push token
    if (customer.pushToken) {
    await sendPushNotification(customer.pushToken, {
      title: 'Delivery Update',
      message: message,
      data: {
        type: 'customer_delivery',
        orderId: deliveryData.orderId,
        status: deliveryStatus,
        trackingNumber: deliveryData.trackingNumber,
        estimatedDelivery: deliveryData.estimatedDelivery
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: customerId,
      title: 'Delivery Update',
      message: message,
      type: 'customer_delivery',
      data: {
        orderId: deliveryData.orderId,
        status: deliveryStatus,
        trackingNumber: deliveryData.trackingNumber,
        estimatedDelivery: deliveryData.estimatedDelivery
      },
      priority: 'normal'
    });

    await notification.save();
    console.log('✅ Delivery notification stored in database for customer');

    console.log(`✅ Customer delivery notification sent: ${deliveryStatus} for order ${deliveryData.orderId}`);

  } catch (error) {
    console.error('❌ Customer delivery notification failed:', error);
  }
};

// ============================================================================
// SELLER NOTIFICATIONS
// ============================================================================

// Seller New Order Notifications
const sendSellerNewOrderNotification = async (sellerId, orderData) => {
  try {
    console.log('🔔 === SELLER NEW ORDER NOTIFICATION DEBUG START ===');
    console.log('🔔 sendSellerNewOrderNotification called with:', { sellerId, orderData });
    
    const seller = await User.findById(sellerId);
    console.log('🔔 Seller found:', seller ? { 
      id: seller._id, 
      name: seller.name, 
      hasPushToken: !!seller.pushToken,
      pushToken: seller.pushToken ? `${seller.pushToken.substring(0, 20)}...` : 'NO TOKEN'
    } : 'NOT FOUND');
    
    if (!seller) {
      console.error('❌ Seller not found with ID:', sellerId);
      console.log('🔔 === SELLER NEW ORDER NOTIFICATION DEBUG END ===');
      return;
    }
    
    if (!seller.pushToken) {
      console.error('❌ Seller has no push token:', { 
        sellerId, 
        sellerName: seller.name,
        sellerRole: seller.role,
        sellerEmail: seller.email
      });
      console.log('🔔 === SELLER NEW ORDER NOTIFICATION DEBUG END ===');
      return;
    }

    console.log('🔔 Sending push notification to seller:', { 
      sellerId, 
      sellerName: seller.name,
      pushToken: `${seller.pushToken.substring(0, 20)}...` 
    });
    
    // Send push notification
    await sendPushNotification(seller.pushToken, {
      title: '🆕 New Order Received!',
      message: `New order #${orderData.orderNumber} worth R${orderData.totalAmount}`,
      data: {
        type: 'seller_new_order',
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        customerName: orderData.customerName,
        itemsCount: orderData.itemsCount
      }
    });

    // Store notification in database
    const notification = new Notification({
      userId: sellerId,
      title: '🆕 New Order Received!',
      message: `New order #${orderData.orderNumber} worth R${orderData.totalAmount}`,
      type: 'seller_new_order',
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        customerName: orderData.customerName,
        itemsCount: orderData.itemsCount
      },
      priority: 'high'
    });

    await notification.save();
    console.log('✅ Notification stored in database for seller');

    console.log(`✅ Seller new order notification sent for order ${orderData.orderId}`);
    console.log('🔔 === SELLER NEW ORDER NOTIFICATION DEBUG END ===');

  } catch (error) {
    console.error('❌ Seller new order notification failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    console.log('🔔 === SELLER NEW ORDER NOTIFICATION DEBUG END ===');
  }
};

// Seller Order Cancellation Notifications
const sendSellerOrderCancellationNotification = async (sellerId, orderData) => {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) return;

    // Send push notification if user has push token
    if (seller.pushToken) {
    await sendPushNotification(seller.pushToken, {
      title: '❌ Order Cancelled',
      message: `Order #${orderData.orderNumber} has been cancelled by customer`,
      data: {
        type: 'seller_order_cancelled',
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        cancellationReason: orderData.cancellationReason
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: sellerId,
      title: '❌ Order Cancelled',
      message: `Order #${orderData.orderNumber} has been cancelled by customer`,
      type: 'seller_order_cancelled',
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        cancellationReason: orderData.cancellationReason
      },
      priority: 'normal'
    });

    await notification.save();
    console.log('✅ Order cancellation notification stored in database for seller');

    console.log(`✅ Seller order cancellation notification sent for order ${orderData.orderId}`);

  } catch (error) {
    console.error('❌ Seller order cancellation notification failed:', error);
  }
};

// Seller Payment Received Notifications
const sendSellerPaymentNotification = async (sellerId, paymentData) => {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) return;

    // Send push notification if user has push token
    if (seller.pushToken) {
    await sendPushNotification(seller.pushToken, {
      title: '💰 Payment Received!',
      message: `Payment of R${paymentData.amount} received for order #${paymentData.orderNumber}`,
      data: {
        type: 'seller_payment_received',
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        orderNumber: paymentData.orderNumber,
        amount: paymentData.amount,
        customerName: paymentData.customerName
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: sellerId,
      title: '💰 Payment Received!',
      message: `Payment of R${paymentData.amount} received for order #${paymentData.orderNumber}`,
      type: 'seller_payment_received',
      data: {
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        orderNumber: paymentData.orderNumber,
        amount: paymentData.amount,
        customerName: paymentData.customerName
      },
      priority: 'high'
    });

    await notification.save();
    console.log('✅ Payment notification stored in database for seller');

    console.log(`✅ Seller payment notification sent for payment ${paymentData.paymentId}`);

  } catch (error) {
    console.error('❌ Seller payment notification failed:', error);
  }
};

// Seller Customer Review Notifications
const sendSellerReviewNotification = async (sellerId, reviewData) => {
  try {
    const seller = await User.findById(sellerId);
    if (!seller || !seller.pushToken) return;

    await sendPushNotification(seller.pushToken, {
      title: '⭐ New Customer Review!',
      message: `${reviewData.customerName} left a ${reviewData.rating}-star review`,
      data: {
        type: 'seller_new_review',
        reviewId: reviewData.reviewId,
        orderId: reviewData.orderId,
        rating: reviewData.rating,
        customerName: reviewData.customerName,
        comment: reviewData.comment
      }
    });

    console.log(`✅ Seller review notification sent for review ${reviewData.reviewId}`);

  } catch (error) {
    console.error('❌ Seller review notification failed:', error);
  }
};

// Seller Inventory Alerts
const sendSellerInventoryAlert = async (sellerId, inventoryData) => {
  try {
    const seller = await User.findById(sellerId);
    if (!seller || !seller.pushToken) return;

    await sendPushNotification(seller.pushToken, {
      title: '⚠️ Inventory Alert!',
      message: `${inventoryData.productName} is running low (${inventoryData.currentStock} left)`,
      data: {
        type: 'seller_inventory_alert',
        productId: inventoryData.productId,
        productName: inventoryData.productName,
        currentStock: inventoryData.currentStock,
        threshold: inventoryData.threshold
      }
    });

    console.log(`✅ Seller inventory alert sent for product ${inventoryData.productId}`);

  } catch (error) {
    console.error('❌ Seller inventory alert failed:', error);
  }
};

// ============================================================================
// SEEKER NOTIFICATIONS
// ============================================================================

// Seeker New Booking Notifications
const sendSeekerNewBookingNotification = async (seekerId, bookingData) => {
  try {
    const seeker = await User.findById(seekerId);
    if (!seeker || !seeker.pushToken) return;

    // Send push notification
    await sendPushNotification(seeker.pushToken, {
      title: '📅 New Service Booking!',
      message: `New booking for ${bookingData.serviceName} on ${bookingData.scheduledDate}`,
      data: {
        type: 'seeker_new_booking',
        bookingId: bookingData.bookingId,
        serviceName: bookingData.serviceName,
        customerName: bookingData.customerName,
        scheduledDate: bookingData.scheduledDate,
        serviceId: bookingData.serviceId
      }
    });

    // Store notification in database
    const notification = new Notification({
      userId: seekerId,
      title: '📅 New Service Booking!',
      message: `New booking for ${bookingData.serviceName} on ${bookingData.scheduledDate}`,
      type: 'seeker_new_booking',
      data: {
        bookingId: bookingData.bookingId,
        serviceName: bookingData.serviceName,
        customerName: bookingData.customerName,
        scheduledDate: bookingData.scheduledDate,
        serviceId: bookingData.serviceId
      },
      priority: 'high'
    });

    await notification.save();
    console.log('✅ Notification stored in database for seeker');

    console.log(`✅ Seeker new booking notification sent for booking ${bookingData.bookingId}`);

  } catch (error) {
    console.error('❌ Seeker new booking notification failed:', error);
  }
};

// Seeker Booking Cancellation Notifications
const sendSeekerBookingCancellationNotification = async (seekerId, bookingData) => {
  try {
    const seeker = await User.findById(seekerId);
    if (!seeker) return;

    // Send push notification if user has push token
    if (seeker.pushToken) {
    await sendPushNotification(seeker.pushToken, {
      title: '❌ Booking Cancelled',
      message: `Booking for ${bookingData.serviceName} has been cancelled by customer`,
      data: {
        type: 'seeker_booking_cancelled',
        bookingId: bookingData.bookingId,
        serviceName: bookingData.serviceName,
        customerName: bookingData.customerName,
        cancellationReason: bookingData.cancellationReason
      }
    });
    }

    // Store notification in database
    const notification = new Notification({
      userId: seekerId,
      title: '❌ Booking Cancelled',
      message: `Booking for ${bookingData.serviceName} has been cancelled by customer`,
      type: 'seeker_booking_cancelled',
      data: {
        bookingId: bookingData.bookingId,
        serviceName: bookingData.serviceName,
        customerName: bookingData.customerName,
        cancellationReason: bookingData.cancellationReason
      },
      priority: 'normal'
    });

    await notification.save();
    console.log('✅ Booking cancellation notification stored in database for seeker');

    console.log(`✅ Seeker booking cancellation notification sent for booking ${bookingData.bookingId}`);

  } catch (error) {
    console.error('❌ Seeker booking cancellation notification failed:', error);
  }
};

// Seeker Payment Received Notifications
const sendSeekerPaymentNotification = async (seekerId, paymentData) => {
  try {
    const seeker = await User.findById(seekerId);
    if (!seeker || !seeker.pushToken) return;

    await sendPushNotification(seeker.pushToken, {
      title: '💰 Payment Received!',
      message: `Payment of R${paymentData.amount} received for ${paymentData.serviceName}`,
      data: {
        type: 'seeker_payment_received',
        paymentId: paymentData.paymentId,
        bookingId: paymentData.bookingId,
        serviceName: paymentData.serviceName,
        amount: paymentData.amount,
        customerName: paymentData.customerName
      }
    });

    console.log(`✅ Seeker payment notification sent for payment ${paymentData.paymentId}`);

  } catch (error) {
    console.error('❌ Seeker payment notification failed:', error);
  }
};

// Seeker Service Update Notifications
const sendSeekerServiceUpdateNotification = async (seekerId, serviceData) => {
  try {
    const seeker = await User.findById(seekerId);
    if (!seeker || !seeker.pushToken) return;

    await sendPushNotification(seeker.pushToken, {
      title: '📝 Service Update',
      message: `Your service ${serviceData.serviceName} has been updated`,
      data: {
        type: 'seeker_service_update',
        serviceId: serviceData.serviceId,
        serviceName: serviceData.serviceName,
        updateType: serviceData.updateType,
        updateDetails: serviceData.updateDetails
      }
    });

    console.log(`✅ Seeker service update notification sent for service ${serviceData.serviceId}`);

  } catch (error) {
    console.error('❌ Seeker service update notification failed:', error);
  }
};

// ============================================================================
// SYSTEM NOTIFICATIONS (ALL USERS)
// ============================================================================

// System Maintenance Notifications
const sendSystemMaintenanceNotification = async (userIds, maintenanceData) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }, 'pushToken');
    const tokens = users.map(user => user.pushToken).filter(Boolean);

    if (tokens.length === 0) return;

    await sendBulkPushNotifications(tokens, {
      title: '🔧 System Maintenance',
      message: maintenanceData.message,
      data: {
        type: 'system_maintenance',
        maintenanceId: maintenanceData.maintenanceId,
        scheduledTime: maintenanceData.scheduledTime,
        duration: maintenanceData.duration,
        impact: maintenanceData.impact
      }
    });

    console.log(`✅ System maintenance notification sent to ${tokens.length} users`);

  } catch (error) {
    console.error('❌ System maintenance notification failed:', error);
  }
};

// Security Alert Notifications
const sendSecurityAlertNotification = async (userId, securityData) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) return;

    await sendPushNotification(user.pushToken, {
      title: '🚨 Security Alert',
      message: securityData.message,
      data: {
        type: 'security_alert',
        alertType: securityData.alertType,
        severity: securityData.severity,
        timestamp: securityData.timestamp,
        action: securityData.action
      }
    });

    console.log(`✅ Security alert notification sent to user ${userId}`);

  } catch (error) {
    console.error('❌ Security alert notification failed:', error);
  }
};

// Promotional Notifications
const sendPromotionalNotification = async (userIds, promoData) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }, 'pushToken');
    const tokens = users.map(user => user.pushToken).filter(Boolean);

    if (tokens.length === 0) return;

    await sendBulkPushNotifications(tokens, {
      title: '🎉 Special Offer!',
      message: promoData.message,
      data: {
        type: 'promotional',
        promoId: promoData.promoId,
        discount: promoData.discount,
        validUntil: promoData.validUntil,
        category: promoData.category
      }
    });

    console.log(`✅ Promotional notification sent to ${tokens.length} users`);

  } catch (error) {
    console.error('❌ Promotional notification failed:', error);
  }
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

module.exports = {
  // Customer Notifications
  sendCustomerOrderNotification,
  sendCustomerPaymentNotification,
  sendCustomerBookingNotification,
  sendCustomerDeliveryNotification,

  // Seller Notifications
  sendSellerNewOrderNotification,
  sendSellerOrderCancellationNotification,
  sendSellerPaymentNotification,
  sendSellerReviewNotification,
  sendSellerInventoryAlert,

  // Seeker Notifications
  sendSeekerNewBookingNotification,
  sendSeekerBookingCancellationNotification,
  sendSeekerPaymentNotification,
  sendSeekerServiceUpdateNotification,

  // System Notifications
  sendSystemMaintenanceNotification,
  sendSecurityAlertNotification,
  sendPromotionalNotification
};
