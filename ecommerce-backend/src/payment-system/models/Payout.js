const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  // Seller reference
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Paystack transfer details
  paystackTransferCode: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  paystackRecipientCode: {
    type: String,
    required: false
  },
  // Payout details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  // Payout status
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Recipient bank details
  recipient: {
    type: {
      type: String,
      enum: ['nuban', 'mobile_money', 'basa'],
      default: 'nuban'
    },
    bankCode: {
      type: String,
      required: false
    },
    bankName: {
      type: String,
      required: false
    },
    accountNumber: {
      type: String,
      required: false
    },
    accountName: {
      type: String,
      required: false
    }
  },
  // Commission records included in this payout
  commissionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission',
    required: true
  }],
  // Transaction details
  transactionCount: {
    type: Number,
    default: 0
  },
  totalSalesAmount: {
    type: Number,
    default: 0
  },
  totalCommissionAmount: {
    type: Number,
    default: 0
  },
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  processedDate: {
    type: Date,
    required: false
  },
  // Paystack response details
  paystackResponse: {
    domain: String,
    amount: Number,
    currency: String,
    source: String,
    reason: String,
    recipient: Number,
    status: String,
    transfer_code: String,
    id: Number,
    created_at: Date,
    updated_at: Date
  },
  // Error handling
  errorDetails: {
    code: String,
    message: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date
  },
  // Metadata
  metadata: {
    sellerEmail: String,
    sellerPhone: String,
    businessName: String,
    notes: String,
    batchId: String // For batch processing
  },
  // Audit trail
  createdBy: {
    type: String,
    enum: ['system', 'admin', 'manual'],
    default: 'system'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approvedAt: {
    type: Date,
    required: false
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
payoutSchema.index({ sellerId: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ paystackTransferCode: 1 });
payoutSchema.index({ scheduledDate: 1 });
payoutSchema.index({ processedDate: 1 });
payoutSchema.index({ createdAt: 1 });
payoutSchema.index({ 'recipient.accountNumber': 1 });

// Virtual for payout amount in currency format
payoutSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount / 100);
});

// Virtual for status display
payoutSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    success: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Method to mark as processing
payoutSchema.methods.markProcessing = function() {
  this.status = 'processing';
  return this.save();
};

// Method to mark as successful
payoutSchema.methods.markSuccess = function(paystackResponse) {
  this.status = 'success';
  this.processedDate = new Date();
  this.paystackResponse = paystackResponse;
  this.paystackTransferCode = paystackResponse.transfer_code;
  
  return this.save();
};

// Method to mark as failed
payoutSchema.methods.markFailed = function(errorDetails) {
  this.status = 'failed';
  this.errorDetails = {
    ...this.errorDetails,
    ...errorDetails,
    retryCount: (this.errorDetails?.retryCount || 0) + 1,
    lastRetryAt: new Date()
  };
  
  return this.save();
};

// Method to cancel payout
payoutSchema.methods.cancelPayout = function(reason) {
  this.status = 'cancelled';
  this.metadata.notes = reason;
  
  return this.save();
};

// Method to retry failed payout
payoutSchema.methods.retryPayout = function() {
  if (this.status !== 'failed') {
    throw new Error('Only failed payouts can be retried');
  }
  
  this.status = 'pending';
  this.scheduledDate = new Date();
  
  return this.save();
};

// Static method to get pending payouts
payoutSchema.statics.getPendingPayouts = function() {
  return this.find({
    status: 'pending',
    scheduledDate: { $lte: new Date() }
  }).populate('sellerId', 'name email businessName');
};

// Static method to get seller payout history
payoutSchema.statics.getSellerPayoutHistory = function(sellerId, limit = 10) {
  return this.find({ sellerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('commissionIds', 'transactionId totalAmount commissionAmount');
};

// Static method to get payout statistics
payoutSchema.statics.getPayoutStats = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  return result;
};

// Static method to get total payouts for a period
payoutSchema.statics.getTotalPayouts = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: null,
        totalPayouts: { $sum: '$amount' },
        payoutCount: { $sum: 1 },
        averagePayout: { $avg: '$amount' }
      }
    }
  ]);
  
  return result[0] || { totalPayouts: 0, payoutCount: 0, averagePayout: 0 };
};

// Static method to create payout from commission records
payoutSchema.statics.createFromCommissions = async function(sellerId, commissionIds) {
  const Commission = require('./Commission');
  
  // Get commission records
  const commissions = await Commission.find({
    _id: { $in: commissionIds },
    sellerId: sellerId,
    status: 'collected',
    escrowStatus: 'held',
    escrowReleaseDate: { $lte: new Date() }
  });
  
  if (commissions.length === 0) {
    throw new Error('No eligible commissions found for payout');
  }
  
  // Calculate payout amount
  const totalAmount = commissions.reduce((sum, commission) => sum + commission.sellerAmount, 0);
  const totalSalesAmount = commissions.reduce((sum, commission) => sum + commission.totalAmount, 0);
  const totalCommissionAmount = commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
  
  // Get seller details for recipient info
  const User = require('../../models/User');
  const seller = await User.findById(sellerId);
  
  if (!seller) {
    throw new Error('Seller not found');
  }
  
  // Create payout record
  const payout = new this({
    sellerId: sellerId,
    amount: totalAmount,
    currency: 'NGN',
    status: 'pending',
    recipient: {
      type: 'nuban',
      accountNumber: seller.businessProfile?.bankAccount?.accountNumber,
      accountName: seller.businessProfile?.bankAccount?.accountName
    },
    commissionIds: commissionIds,
    transactionCount: commissions.length,
    totalSalesAmount: totalSalesAmount,
    totalCommissionAmount: totalCommissionAmount,
    scheduledDate: new Date(),
    metadata: {
      sellerEmail: seller.email,
      sellerPhone: seller.phone,
      businessName: seller.businessName
    }
  });
  
  await payout.save();
  
  // Update commission records
  await Commission.updateMany(
    { _id: { $in: commissionIds } },
    { 
      status: 'payout_scheduled',
      payoutId: payout._id,
      payoutScheduledDate: payout.scheduledDate
    }
  );
  
  return payout;
};

module.exports = mongoose.model('Payout', payoutSchema);
