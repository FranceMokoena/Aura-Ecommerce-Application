const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who receives the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  // Notification type for categorization
  type: {
    type: String,
    enum: [
      // General types
      'order',           // Order updates
      'payment',         // Payment confirmations
      'service',         // Service bookings
      'delivery',        // Delivery updates
      'promotion',       // Marketing promotions
      'security',        // Security alerts
      'system',          // System notifications
      'chat',            // Chat messages
      'review',          // Review requests
      'reminder',        // General reminders
      
      // Customer-specific types
      'customer_order',      // Customer order updates
      'customer_payment',    // Customer payment updates
      'customer_booking',    // Customer booking updates
      'customer_delivery',   // Customer delivery updates
      
      // Seller-specific types
      'seller_new_order',        // New order received
      'seller_order_cancelled',  // Order cancelled by customer
      'seller_order_updated',    // Order status updated by seller
      'seller_payment_received', // Payment received
      'seller_review',           // New customer review
      'seller_low_stock',        // Low stock alert
      
      // Seeker-specific types
      'seeker_new_booking',      // New service booking
      'seeker_booking_confirmed', // Booking confirmed
      'seeker_booking_cancelled', // Booking cancelled
      'seeker_service_completed',  // Service completed

      // Additional types
      'order_update',           // Order updates
      'customer_order_updated',  // Customer order updates

      // Newly added types
      'order_pending',
      'order_confirmed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'seller_new_review',
      'seller_inventory_alert',
      'seeker_payment_received',
      'seeker_service_update',
      'system_maintenance',
      'security_alert',
      'promotional'
    ],
    required: true,
    index: true
  },

  // Additional data for deep linking
  data: {
    orderId: String,
    serviceId: String,
    productId: String,
    chatId: String,
    url: String,
    action: String
  },

  // Notification status
  read: {
    type: Boolean,
    default: false,
    index: true
  },

  // Priority levels
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Delivery status
  delivered: {
    type: Boolean,
    default: false
  },

  // Push notification sent
  pushSent: {
    type: Boolean,
    default: false
  },

  // Email notification sent
  emailSent: {
    type: Boolean,
    default: false
  },

  // Expiration (optional)
  expiresAt: {
    type: Date,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
notificationSchema.statics.findUnreadByUser = function(userId) {
  return this.find({ userId, read: false }).sort({ createdAt: -1 });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, updatedAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.updatedAt = new Date();
  return this.save();
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
