const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Paystack integration
  paystackCustomerCode: {
    type: String,
    required: false
  },
  paystackSubscriptionCode: {
    type: String,
    required: false
  },
  // Subscription details
  status: {
    type: String,
    enum: ['free', 'premium', 'cancelled', 'expired'],
    default: 'free'
  },
  tier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  // Trial management
  trialEndDate: {
    type: Date,
    required: false
  },
  trialUsed: {
    type: Boolean,
    default: false
  },
  // Billing details
  amount: {
    type: Number,
    default: 8799, // R87.99 in cents/kobo
    required: true
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  // Billing cycle
  currentPeriodStart: {
    type: Date,
    required: false
  },
  currentPeriodEnd: {
    type: Date,
    required: false
  },
  nextBillingDate: {
    type: Date,
    required: false
  },
  // Product limits based on tier
  productLimit: {
    type: Number,
    default: 5, // Free tier limit
    required: true
  },
  // Commission rate (same for all tiers but tracked here)
  commissionRate: {
    type: Number,
    default: 0.10, // 10%
    required: true
  },
  // Cancellation tracking
  cancelledAt: {
    type: Date,
    required: false
  },
  cancelReason: {
    type: String,
    required: false
  },
  // Reactivation tracking
  reactivatedAt: {
    type: Date,
    required: false
  },
  // Payment tracking
  lastPaymentDate: {
    type: Date,
    required: false
  },
  lastPaymentAmount: {
    type: Number,
    required: false
  },
  // Failed payment tracking
  failedPaymentCount: {
    type: Number,
    default: 0
  },
  lastFailedPaymentDate: {
    type: Date,
    required: false
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1, tier: 1 });
subscriptionSchema.index({ paystackCustomerCode: 1 });
subscriptionSchema.index({ paystackSubscriptionCode: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ trialEndDate: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status === 'free') return true;
  if (this.status === 'premium') {
    return this.currentPeriodEnd && this.currentPeriodEnd > new Date();
  }
  return false;
});

// Virtual for checking if user is on trial
subscriptionSchema.virtual('isOnTrial').get(function() {
  return this.trialEndDate && this.trialEndDate > new Date() && !this.trialUsed;
});

// Virtual for days remaining in trial
subscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.isOnTrial) return 0;
  const now = new Date();
  const diffTime = this.trialEndDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to start trial
subscriptionSchema.methods.startTrial = function() {
  if (this.trialUsed) {
    throw new Error('Trial already used');
  }
  
  this.trialUsed = true;
  this.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  this.status = 'premium';
  this.tier = 'premium';
  this.productLimit = -1; // Unlimited for premium
  
  return this.save();
};

// Method to upgrade to premium
subscriptionSchema.methods.upgradeToPremium = function() {
  this.status = 'premium';
  this.tier = 'premium';
  this.productLimit = -1; // Unlimited
  this.currentPeriodStart = new Date();
  this.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  this.nextBillingDate = this.currentPeriodEnd;
  
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancelSubscription = function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.productLimit = 5; // Back to free tier limit
  
  return this.save();
};

// Method to reactivate subscription
subscriptionSchema.methods.reactivateSubscription = function() {
  this.status = 'premium';
  this.tier = 'premium';
  this.productLimit = -1;
  this.reactivatedAt = new Date();
  this.cancelledAt = null;
  this.cancelReason = null;
  
  return this.save();
};

// Static method to get active premium subscriptions
subscriptionSchema.statics.getActivePremiumSubscriptions = function() {
  return this.find({
    status: 'premium',
    currentPeriodEnd: { $gt: new Date() }
  }).populate('userId', 'name email businessName');
};

// Static method to get subscriptions expiring soon
subscriptionSchema.statics.getExpiringSubscriptions = function(days = 3) {
  const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'premium',
    currentPeriodEnd: { $lte: expiryDate, $gt: new Date() }
  }).populate('userId', 'name email businessName');
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
