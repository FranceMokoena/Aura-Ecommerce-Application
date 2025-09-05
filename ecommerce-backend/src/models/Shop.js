const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  images: [{
    type: String,
    required: false
  }],
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    website: {
      type: String,
      required: false
    }
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  deliveryOptions: {
    type: String,
    enum: ['delivery', 'pickup', 'both'],
    default: 'pickup'
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryRadius: {
    type: Number, // in kilometers
    default: 10
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'food', 'beauty', 'home', 'sports', 'books', 'automotive', 'health', 'other']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Index for efficient querying
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ category: 1, status: 1 });
shopSchema.index({ featured: 1, status: 1 });

module.exports = mongoose.model('Shop', shopSchema);
