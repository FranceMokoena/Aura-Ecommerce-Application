const Notification = require('../models/Notification');
const User = require('../models/User');

// Notification service for automatically creating business notifications
class NotificationService {
  
  // Create seller notification for new order
  static async createSellerNewOrderNotification(sellerId, orderData) {
    try {
      const notification = new Notification({
        userId: sellerId,
        title: '🆕 New Order Received',
        message: `You have received a new order for ${orderData.totalAmount} from ${orderData.customerName}`,
        type: 'seller_new_order',
        priority: 'high',
        data: {
          orderId: orderData.orderId,
          totalAmount: orderData.totalAmount,
          customerName: orderData.customerName,
          action: 'view_order'
        }
      });

      await notification.save();
      console.log(`✅ Seller notification created for new order: ${orderData.orderId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating seller new order notification:', error);
      throw error;
    }
  }

  // Create seller notification for order status update
  static async createSellerOrderStatusNotification(sellerId, orderData, newStatus, oldStatus) {
    let type;
    switch (newStatus) {
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
      title: `Order ${newStatus}`,
      message: `Your order status changed from ${oldStatus} to ${newStatus}.`,
      data: orderData,
      read: false,
    });
    await notification.save();
    return notification;
  }

  // Create seller notification for payment received
  static async createSellerPaymentNotification(sellerId, paymentData) {
    try {
      const notification = new Notification({
        userId: sellerId,
        title: '💳 Payment Received',
        message: `Payment of ${paymentData.amount} received for order #${paymentData.orderId.slice(-6)}`,
        type: 'seller_payment_received',
        priority: 'high',
        data: {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          paymentId: paymentData.paymentId,
          action: 'view_payment'
        }
      });

      await notification.save();
      console.log(`✅ Seller notification created for payment: ${paymentData.paymentId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating seller payment notification:', error);
      throw error;
    }
  }

  // Create seller notification for new review
  static async createSellerReviewNotification(sellerId, reviewData) {
    try {
      const notification = new Notification({
        userId: sellerId,
        title: '⭐ New Product Review',
        message: `${reviewData.customerName} left a ${reviewData.rating}-star review for ${reviewData.productName}`,
        type: 'seller_review',
        priority: 'normal',
        data: {
          productId: reviewData.productId,
          reviewId: reviewData.reviewId,
          rating: reviewData.rating,
          customerName: reviewData.customerName,
          action: 'view_review'
        }
      });

      await notification.save();
      console.log(`✅ Seller notification created for review: ${reviewData.reviewId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating seller review notification:', error);
      throw error;
    }
  }

  // Create seller notification for low stock
  static async createSellerLowStockNotification(sellerId, productData) {
    try {
      const notification = new Notification({
        userId: sellerId,
        title: '⚠️ Low Stock Alert',
        message: `${productData.productName} is running low on stock (${productData.quantity} remaining)`,
        type: 'seller_low_stock',
        priority: 'high',
        data: {
          productId: productData.productId,
          currentStock: productData.quantity,
          threshold: productData.threshold || 5,
          action: 'restock_product'
        }
      });

      await notification.save();
      console.log(`✅ Seller notification created for low stock: ${productData.productId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating seller low stock notification:', error);
      throw error;
    }
  }

  // Create customer notification for order status update
  static async createCustomerOrderStatusNotification(customerId, orderData, newStatus, oldStatus) {
    let type;
    switch (newStatus) {
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
      title: `Order ${newStatus}`,
      message: `Your order status changed from ${oldStatus} to ${newStatus}.`,
      data: orderData,
      read: false,
    });
    await notification.save();
    return notification;
  }

  // Create customer notification for payment confirmation
  static async createCustomerPaymentNotification(customerId, paymentData) {
    try {
      const notification = new Notification({
        userId: customerId,
        title: '💳 Payment Confirmed',
        message: `Your payment of ${paymentData.amount} has been confirmed for order #${paymentData.orderId.slice(-6)}`,
        type: 'customer_payment',
        priority: 'normal',
        data: {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          paymentId: paymentData.paymentId,
          action: 'view_order'
        }
      });

      await notification.save();
      console.log(`✅ Customer notification created for payment: ${paymentData.paymentId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating customer payment notification:', error);
      throw error;
    }
  }

  // Bulk create notifications for multiple users
  static async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || 'normal',
        data: notificationData.data || {}
      }));

      const result = await Notification.insertMany(notifications);
      console.log(`✅ Bulk notifications created for ${userIds.length} users`);
      return result;
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Clean up old notifications (older than 90 days)
  static async cleanupOldNotifications() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true // Only delete read notifications
      });

      console.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
