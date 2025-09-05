const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['savings', 'payment', 'voucher', 'grocery', 'coupon'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: String,
    trim: true
  },
  cvv: {
    type: String,
    trim: true
  },
  balance: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  cardColor: {
    type: String,
    default: '#007AFF'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one default card per user per type
cardSchema.index({ userId: 1, type: 1, isDefault: 1 });

// Pre-save middleware to handle default card logic
cardSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Set all other cards of the same type for this user to not default
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        type: this.type, 
        _id: { $ne: this._id } 
      },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Card', cardSchema);
