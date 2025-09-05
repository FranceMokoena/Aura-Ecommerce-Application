const mongoose = require('mongoose');

const sellerNotificationSchema = new mongoose.Schema({
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // For faster queries
  },
  type: { 
    type: String, 
    required: true,
    enum: ['new_order', 'order_update', 'customer_message', 'system', 'payment_received', 'review_received'] // Seller-specific types
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100 // Prevent extremely long titles
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 500 // Prevent extremely long messages
  },
  data: { 
    type: mongoose.Schema.Types.Mixed, // Flexible data storage for order details, customer info, etc.
    default: {}
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // For sorting by date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Auto-expire notifications after 90 days
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
  }
});

// Index for efficient queries
sellerNotificationSchema.index({ sellerId: 1, read: 1, createdAt: -1 });

// Auto-cleanup expired notifications
sellerNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SellerNotification = mongoose.model('SellerNotification', sellerNotificationSchema);

module.exports = SellerNotification;
