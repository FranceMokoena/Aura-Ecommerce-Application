const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  clubOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  date: {
    type: Date,
    required: true
  },
  time: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: false
    }
  },
  location: {
    venue: {
      type: String,
      required: true
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
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON standard
      required: false
    }
  },
  images: [{
    type: String,
    required: false
  }],
  ticketPricing: {
    regularPrice: {
      type: Number,
      required: true,
      min: 0
    },
    earlyBirdPrice: {
      type: Number,
      required: false,
      min: 0
    },
    earlyBirdEndDate: {
      type: Date,
      required: false
    },
    vipPrice: {
      type: Number,
      required: false,
      min: 0
    }
  },
  capacity: {
    maxTickets: {
      type: Number,
      required: true,
      min: 1
    },
    availableTickets: {
      type: Number,
      required: true,
      min: 0
    },
    reservedTickets: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['music', 'sports', 'comedy', 'theater', 'conference', 'workshop', 'party', 'exhibition', 'festival', 'other']
  },
  ageRestriction: {
    type: String,
    enum: ['all_ages', '18+', '21+', 'family_friendly'],
    default: 'all_ages'
  },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  organizerInfo: {
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
  refundPolicy: {
    type: String,
    required: false
  },
  terms: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Index for efficient querying
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ featured: 1, status: 1 });

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.capacity.availableTickets === 0;
});

// Virtual for checking if early bird pricing is active
eventSchema.virtual('isEarlyBirdActive').get(function() {
  if (!this.ticketPricing.earlyBirdEndDate) return false;
  return new Date() < this.ticketPricing.earlyBirdEndDate;
});

// Virtual for current ticket price
eventSchema.virtual('currentPrice').get(function() {
  if (this.isEarlyBirdActive && this.ticketPricing.earlyBirdPrice) {
    return this.ticketPricing.earlyBirdPrice;
  }
  return this.ticketPricing.regularPrice;
});

eventSchema.set('toObject', { virtuals: true });
eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
