const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  ticketType: {
    type: String,
    enum: ['regular', 'early_bird', 'vip'],
    default: 'regular'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['reserved', 'paid', 'confirmed', 'used', 'cancelled', 'refunded'],
    default: 'reserved'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  attendeeInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: false
    }
  },
  qrCode: {
    type: String,
    required: false
  },
  usedAt: {
    type: Date,
    required: false
  },
  usedBy: {
    type: String,
    required: false
  },
  refundReason: {
    type: String,
    required: false
  },
  refundDate: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Index for efficient querying
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ qrCode: 1 });

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', function(next) {
  if (this.isNew && !this.ticketNumber) {
    // Generate unique ticket number: EVENT-YYYYMMDD-XXXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.ticketNumber = `TKT-${date}-${random}`;
  }
  next();
});

// Virtual for checking if ticket is valid for entry
ticketSchema.virtual('isValidForEntry').get(function() {
  return this.status === 'confirmed' && !this.usedAt;
});

// Virtual for checking if ticket can be refunded
ticketSchema.virtual('canBeRefunded').get(function() {
  const now = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  const hoursSincePurchase = (now - purchaseDate) / (1000 * 60 * 60);
  
  // Allow refund within 24 hours of purchase and before event
  return this.status === 'confirmed' && 
         hoursSincePurchase <= 24 && 
         !this.usedAt;
});

ticketSchema.set('toObject', { virtuals: true });
ticketSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
