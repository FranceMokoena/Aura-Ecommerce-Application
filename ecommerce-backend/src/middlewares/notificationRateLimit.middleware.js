const rateLimit = require('express-rate-limit');

// Rate limiting for notification endpoints to handle millions of users
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many notification requests, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip rate limiting for system notifications
    return req.user?.role === 'admin' || req.user?.role === 'system';
  }
});

// Stricter rate limiting for bulk notifications
const bulkNotificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 bulk requests per hour
  message: {
    success: false,
    message: 'Too many bulk notification requests, please try again later.',
    retryAfter: 60 * 60 // 1 hour in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for test notifications
const testNotificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 test requests per 5 minutes
  message: {
    success: false,
    message: 'Too many test notification requests, please try again later.',
    retryAfter: 5 * 60 // 5 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  notificationRateLimit,
  bulkNotificationRateLimit,
  testNotificationRateLimit
};
