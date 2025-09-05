const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['product', 'ticket'],
    required: true
  },
  // For product orders
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false
    },
    shopProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopProduct',
      required: false
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  // For ticket orders
  tickets: [{
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: false
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: false
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'confirmed', 'used'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // For product orders
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: [Number], // [longitude, latitude]
    fullAddress: String
  },
  // Enhanced tracking data for real-time location tracking
  trackingData: {
    customerCoordinates: [Number], // [longitude, latitude] from GPS or profile
    customerAddress: String,
    locationAccuracy: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    locationSource: {
      type: String,
      enum: ['gps', 'manual', 'profile'],
      default: 'manual'
    },
    gpsEnabled: Boolean,
    locationPermission: Boolean,
    timestamp: Date
  },
  // For ticket orders
  attendeeInfo: {
    name: String,
    email: String,
    phone: String
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  notes: String,
  // 🚚 REAL-TIME DELIVERY TRACKING (SAFE ADDITION)
  deliveryTracking: {
    startTime: Date,           // When delivery actually started (status changed to 'shipped')
    estimatedMinutes: Number,  // Calculated delivery time in minutes
    actualDeliveryTime: Date,  // When actually delivered (status changed to 'delivered')
    lastUpdated: Date,         // Last time tracking was updated
    isActive: {               // Whether tracking is currently active
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
