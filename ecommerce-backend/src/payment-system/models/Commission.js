const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  // Reference to existing payment
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  // Reference to existing order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  // Customer and seller references
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
  // Amount calculations
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  sellerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Commission rate used
  commissionRate: {
    type: Number,
    default: 0.10, // 10%
    required: true
  },
  // Currency
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paystack', 'card', 'paypal', 'mobile_money', 'bank_transfer'],
    required: true
  },
  // Paystack specific fields
  paystackReference: {
    type: String,
    required: false
  },
  paystackTransactionId: {
    type: String,
    required: false
  },
  // Stripe specific fields (for existing integration)
  stripePaymentIntentId: {
    type: String,
    required: false
  },
  // Commission status
  status: {
    type: String,
    enum: ['pending', 'calculated', 'collected', 'payout_scheduled', 'payout_completed', 'refunded'],
    default: 'pending'
  },
  // Escrow tracking
  escrowStatus: {
    type: String,
    enum: ['held', 'released', 'refunded'],
    default: 'held'
  },
  escrowReleaseDate: {
    type: Date,
    required: false
  },
  // Payout tracking
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout',
    required: false
  },
  payoutScheduledDate: {
    type: Date,
    required: false
  },
  payoutCompletedDate: {
    type: Date,
    required: false
  },
  // Product/Service details
  orderType: {
    type: String,
    enum: ['product', 'ticket', 'service', 'booking'],
    required: true
  },
  // Product details for commission calculation
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
    },
    commissionAmount: {
      type: Number,
      required: true
    }
  }],
  // Ticket details
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
    },
    commissionAmount: {
      type: Number,
      required: true
    }
  }],
  // Metadata for tracking
  metadata: {
    customerEmail: String,
    customerPhone: String,
    sellerEmail: String,
    sellerPhone: String,
    businessName: String,
    deliveryAddress: Object,
    notes: String
  },
  // Audit trail
  calculatedAt: {
    type: Date,
    required: false
  },
  collectedAt: {
    type: Date,
    required: false
  },
  refundedAt: {
    type: Date,
    required: false
  },
  refundReason: {
    type: String,
    required: false
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
commissionSchema.index({ paymentId: 1 });
commissionSchema.index({ orderId: 1 });
commissionSchema.index({ transactionId: 1 });
commissionSchema.index({ customerId: 1 });
commissionSchema.index({ sellerId: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ escrowStatus: 1 });
commissionSchema.index({ paystackReference: 1 });
commissionSchema.index({ stripePaymentIntentId: 1 });
commissionSchema.index({ payoutScheduledDate: 1 });
commissionSchema.index({ createdAt: 1 });

// Virtual for commission percentage
commissionSchema.virtual('commissionPercentage').get(function() {
  return (this.commissionAmount / this.totalAmount * 100).toFixed(2);
});

// Virtual for seller percentage
commissionSchema.virtual('sellerPercentage').get(function() {
  return ((this.totalAmount - this.commissionAmount) / this.totalAmount * 100).toFixed(2);
});

// Method to calculate commission
commissionSchema.methods.calculateCommission = function() {
  this.commissionAmount = Math.round(this.totalAmount * this.commissionRate);
  this.sellerAmount = this.totalAmount - this.commissionAmount;
  this.calculatedAt = new Date();
  this.status = 'calculated';
  
  return this.save();
};

// Method to mark commission as collected
commissionSchema.methods.markCollected = function() {
  this.status = 'collected';
  this.collectedAt = new Date();
  
  return this.save();
};

// Method to schedule payout
commissionSchema.methods.schedulePayout = function(payoutId, scheduledDate) {
  this.payoutId = payoutId;
  this.payoutScheduledDate = scheduledDate;
  this.status = 'payout_scheduled';
  
  return this.save();
};

// Method to mark payout completed
commissionSchema.methods.markPayoutCompleted = function() {
  this.status = 'payout_completed';
  this.payoutCompletedDate = new Date();
  
  return this.save();
};

// Method to process refund
commissionSchema.methods.processRefund = function(reason) {
  this.status = 'refunded';
  this.escrowStatus = 'refunded';
  this.refundedAt = new Date();
  this.refundReason = reason;
  
  return this.save();
};

// Static method to get total commission for a period
commissionSchema.statics.getTotalCommission = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['collected', 'payout_completed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$commissionAmount' },
        totalTransactions: { $sum: 1 },
        averageCommission: { $avg: '$commissionAmount' }
      }
    }
  ]);
  
  return result[0] || { totalCommission: 0, totalTransactions: 0, averageCommission: 0 };
};

// Static method to get seller commission summary
commissionSchema.statics.getSellerCommissionSummary = async function(sellerId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        sellerId: mongoose.Types.ObjectId(sellerId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['collected', 'payout_completed'] }
      }
    },
    {
      $group: {
        _id: '$sellerId',
        totalSales: { $sum: '$totalAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalEarnings: { $sum: '$sellerAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalSales: 0, totalCommission: 0, totalEarnings: 0, transactionCount: 0 };
};

// Static method to get pending payouts
commissionSchema.statics.getPendingPayouts = function() {
  return this.find({
    status: 'collected',
    escrowStatus: 'held',
    escrowReleaseDate: { $lte: new Date() }
  }).populate('sellerId', 'name email businessName');
};

module.exports = mongoose.model('Commission', commissionSchema);
