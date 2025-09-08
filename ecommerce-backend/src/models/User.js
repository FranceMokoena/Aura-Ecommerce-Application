const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "seller", "seeker", "shop_owner", "club_owner"], required: true },
  status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  profilePicture: { type: String },
  location: {
    city: String,
    country: String,
    coordinates: [Number] // [longitude, latitude] format for GeoJSON compatibility
  },
  // Business/Service Provider fields
  businessName: { type: String },
  businessType: { type: String },
  businessDescription: { type: String },
  businessCategory: { type: String },
  hourlyRate: { type: Number },
  experience: { type: String },
  onboardingCompleted: { type: Boolean, default: false },
  // Additional seller profile fields
  bio: { type: String },
  website: { type: String },
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  businessHours: { type: String },
  specialties: [String],
  // User preferences field
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Push notification token for FCM
  pushToken: { type: String },
  // Multi-device support: track multiple device tokens
  devices: [{
    deviceId: { type: String },
    platform: { type: String, enum: ['android', 'ios', 'web', 'unknown'], default: 'unknown' },
    pushToken: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  }],
  // Notification settings
  notificationSettings: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    promotionalOffers: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
