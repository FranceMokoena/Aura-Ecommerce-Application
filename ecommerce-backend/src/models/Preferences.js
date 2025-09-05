const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Notification Preferences
  notifications: {
    orderUpdates: { type: Boolean, default: true },
    priceAlerts: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: false },
    promotionalOffers: { type: Boolean, default: true },
    serviceReminders: { type: Boolean, default: true }
  },

  // Price Range Filter
  priceRange: {
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 1000 }
  },

  // Location Preferences
  location: {
    deliveryLocation: { type: String, default: 'Home' },
    pickupLocation: { type: String, default: 'Nearest Store' }
  },

  // Account & Privacy
  account: {
    language: { type: String, default: 'English' },
    currency: { type: String, default: 'ZAR' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    privacySettings: { type: Boolean, default: true },
    autoLogin: { type: Boolean, default: true }
  },

  // Privacy & Security Settings
  privacy: {
    profileVisibility: { type: Boolean, default: true },
    orderHistory: { type: Boolean, default: false },
    locationSharing: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    dataAnalytics: { type: Boolean, default: true }
  },

  // Security Settings
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    biometricLogin: { type: Boolean, default: true },
    sessionTimeout: { type: String, default: '30min' },
    loginNotifications: { type: Boolean, default: true },
    deviceManagement: { type: Boolean, default: true }
  },

  // Payment & Delivery
  payment: {
    defaultPaymentMethod: { type: String, default: 'Credit Card' },
    deliveryPreference: { type: String, default: 'Standard' },
    savePaymentInfo: { type: Boolean, default: true },
    billingAddress: { type: String, default: '' }
  },

  // Service-Specific
  service: {
    preferredCategories: [{ type: String }],
    preferredProviders: [{ type: String }],
    bookingReminders: { type: Boolean, default: true }
  },

  // Shopping Preferences
  shopping: {
    defaultTab: { type: String, enum: ['products', 'services'], default: 'products' },
    sortPreference: { type: String, default: 'newest' },
    viewMode: { type: String, enum: ['grid', 'list'], default: 'grid' }
  }

}, { timestamps: true });

module.exports = mongoose.model("Preferences", preferencesSchema);
