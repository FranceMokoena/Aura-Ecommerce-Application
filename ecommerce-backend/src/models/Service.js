const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['cleaning', 'plumbing', 'electrical', 'tutoring', 'gardening', 'cooking', 'transport', 'beauty', 'fitness', 'other']
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  rateType: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'fixed']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  skills: {
    type: String,
    required: true,
    trim: true
  },
  availability: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    required: false
  }],
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Upfront payment options
  requiresUpfrontPayment: {
    type: Boolean,
    default: false
  },
  upfrontPaymentAmount: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for average rating
serviceSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.stars, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal place
});

// Virtual for review count
serviceSchema.virtual('reviewCount').get(function() {
  return this.ratings ? this.ratings.length : 0;
});

// Configure toJSON and toObject to include virtuals
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);
