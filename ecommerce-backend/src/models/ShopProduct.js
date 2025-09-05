const mongoose = require('mongoose');

const shopProductSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: false,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'food', 'beauty', 'home', 'sports', 'books', 'automotive', 'health', 'other']
  },
  subcategory: {
    type: String,
    required: false
  },
  images: [{
    type: String,
    required: false
  }],
  brand: {
    type: String,
    required: false
  },
  sku: {
    type: String,
    required: false,
    unique: true
  },
  weight: {
    type: Number,
    required: false,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  specifications: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    trim: true
  }],
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
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  salePercentage: {
    type: Number,
    min: 0,
    max: 100
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
  estimatedDeliveryDays: {
    type: Number,
    default: 3,
    min: 1
  },
  returnPolicy: {
    allowed: {
      type: Boolean,
      default: true
    },
    days: {
      type: Number,
      default: 30,
      min: 0
    },
    conditions: {
      type: String,
      required: false
    }
  },
  warranty: {
    type: String,
    required: false
  },
  stockAlert: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 5,
      min: 0
    }
  }
}, { timestamps: true });

// Index for efficient querying
shopProductSchema.index({ shopId: 1, status: 1 });
shopProductSchema.index({ category: 1, status: 1 });
shopProductSchema.index({ featured: 1, status: 1 });
shopProductSchema.index({ onSale: 1, status: 1 });
shopProductSchema.index({ tags: 1 });

// Virtual for average rating
shopProductSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, rating) => sum + rating.stars, 0);
  return Math.round((total / this.ratings.length) * 10) / 10;
});

// Virtual for review count
shopProductSchema.virtual('reviewCount').get(function() {
  return this.ratings ? this.ratings.length : 0;
});

// Virtual for sale price
shopProductSchema.virtual('salePrice').get(function() {
  if (this.onSale && this.salePercentage) {
    return this.price - (this.price * this.salePercentage / 100);
  }
  return this.price;
});

// Virtual for stock status
shopProductSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= (this.stockAlert.threshold || 5)) return 'low_stock';
  return 'in_stock';
});

// Pre-save middleware to generate SKU if not provided
shopProductSchema.pre('save', function(next) {
  if (this.isNew && !this.sku) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.sku = `SP-${timestamp}-${random}`;
  }
  next();
});

shopProductSchema.set('toObject', { virtuals: true });
shopProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ShopProduct', shopProductSchema);
