const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  location: {
    type: String,
    required: false
  },
  ratings: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    stars: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  // Delivery options
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
  // Stock status management
  stockStatus: {
    type: String,
    enum: ['in_stock', 'sold_out', 'out_of_stock'],
    default: 'in_stock'
  }
}, { timestamps: true });

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, rating) => sum + rating.stars, 0);
  return Math.round((total / this.ratings.length) * 10) / 10; // Round to 1 decimal place
});

// Virtual for review count
productSchema.virtual('reviewCount').get(function() {
  return this.ratings ? this.ratings.length : 0;
});

// Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
