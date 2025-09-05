const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  location: {
    type: String,
    required: true
  },
  // Enhanced location tracking data (EXACT COPY from Order model)
  serviceAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: [Number], // [longitude, latitude]
    fullAddress: String
  },
  // Enhanced tracking data for real-time location tracking
  trackingData: {
    customerCoordinates: [Number], // [longitude, latitude] from GPS or profile
    customerAddress: String,
    seekerCoordinates: [Number], // [longitude, latitude] - seeker location
    seekerAddress: String,
    locationAccuracy: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    locationSource: {
      type: String,
      enum: ['gps', 'manual', 'profile'],
      default: 'manual'
    },
    gpsEnabled: Boolean,
    locationPermission: Boolean,
    timestamp: Date
  },
  // Upfront payment fields
  requiresUpfrontPayment: {
    type: Boolean,
    default: false
  },
  upfrontPaymentAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: String,
  cancellationReason: String
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
