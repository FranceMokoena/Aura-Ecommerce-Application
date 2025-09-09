const { body, validationResult } = require('express-validator');

// Validation rules for notification data
const validateNotificationData = [
  body('targetUserId')
    .isMongoId()
    .withMessage('targetUserId must be a valid MongoDB ObjectId'),
  
  body('title')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('title must be a string between 1 and 100 characters')
    .trim(),
  
  body('message')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('message must be a string between 1 and 500 characters')
    .trim(),
  
  body('type')
    .optional()
    .isString()
    .isIn([
      'order', 'payment', 'service', 'delivery', 'promotion', 'security', 'system',
      'chat', 'review', 'reminder', 'customer_order', 'customer_payment', 'customer_booking',
      'customer_delivery', 'seller_new_order', 'seller_order_cancelled', 'seller_order_updated',
      'seller_payment_received', 'seller_review', 'seller_low_stock', 'seeker_new_booking',
      'seeker_booking_confirmed', 'seeker_booking_cancelled', 'seeker_service_completed',
      'order_update', 'customer_order_updated', 'order_pending', 'order_confirmed',
      'order_shipped', 'order_delivered', 'order_cancelled', 'seller_new_review',
      'seller_inventory_alert', 'seeker_payment_received', 'seeker_service_update',
      'system_maintenance', 'security_alert', 'promotional', 'seller_order',
      'customer_order_status', 'order_status', 'general', 'test', 'delivery_proximity',
      'doorstep_arrival', 'delivery_attempt', 'booking_confirmation', 'service_booking_request',
      'booking_status_update', 'service_booking_status_update'
    ])
    .withMessage('Invalid notification type'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('data must be an object'),
  
  body('data.orderId')
    .optional()
    .isMongoId()
    .withMessage('data.orderId must be a valid MongoDB ObjectId'),
  
  body('data.totalAmount')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('data.totalAmount must be a positive number'),
  
  body('data.productCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('data.productCount must be a positive integer'),
  
  body('data.customerName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('data.customerName must be a string between 1 and 100 characters')
    .trim(),
  
  body('data.sellerName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('data.sellerName must be a string between 1 and 100 characters')
    .trim()
];

// Validation for seller new order notification
const validateSellerNewOrderNotification = [
  body('sellerId')
    .isMongoId()
    .withMessage('sellerId must be a valid MongoDB ObjectId'),
  
  body('orderData')
    .isObject()
    .withMessage('orderData must be an object'),
  
  body('orderData._id')
    .isMongoId()
    .withMessage('orderData._id must be a valid MongoDB ObjectId'),
  
  body('orderData.totalAmount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('orderData.totalAmount must be a positive number'),
  
  body('orderData.products')
    .isArray({ min: 1 })
    .withMessage('orderData.products must be a non-empty array'),
  
  body('orderData.customerId')
    .optional()
    .isMongoId()
    .withMessage('orderData.customerId must be a valid MongoDB ObjectId')
];

// Validation for customer order status notification
const validateCustomerOrderStatusNotification = [
  body('customerId')
    .isMongoId()
    .withMessage('customerId must be a valid MongoDB ObjectId'),
  
  body('orderId')
    .isMongoId()
    .withMessage('orderId must be a valid MongoDB ObjectId'),
  
  body('status')
    .isString()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'])
    .withMessage('status must be a valid order status'),
  
  body('orderDetails')
    .optional()
    .isObject()
    .withMessage('orderDetails must be an object')
];

// Validation for bulk notifications
const validateBulkNotification = [
  body('targetUserIds')
    .isArray({ min: 1, max: 1000 })
    .withMessage('targetUserIds must be an array with 1-1000 user IDs'),
  
  body('targetUserIds.*')
    .isMongoId()
    .withMessage('Each targetUserId must be a valid MongoDB ObjectId'),
  
  body('title')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('title must be a string between 1 and 100 characters')
    .trim(),
  
  body('message')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('message must be a string between 1 and 500 characters')
    .trim(),
  
  body('type')
    .optional()
    .isString()
    .isIn([
      'order', 'payment', 'service', 'delivery', 'promotion', 'security', 'system',
      'chat', 'review', 'reminder', 'customer_order', 'customer_payment', 'customer_booking',
      'customer_delivery', 'seller_new_order', 'seller_order_cancelled', 'seller_order_updated',
      'seller_payment_received', 'seller_review', 'seller_low_stock', 'seeker_new_booking',
      'seeker_booking_confirmed', 'seeker_booking_cancelled', 'seeker_service_completed',
      'order_update', 'customer_order_updated', 'order_pending', 'order_confirmed',
      'order_shipped', 'order_delivered', 'order_cancelled', 'seller_new_review',
      'seller_inventory_alert', 'seeker_payment_received', 'seeker_service_update',
      'system_maintenance', 'security_alert', 'promotional', 'seller_order',
      'customer_order_status', 'order_status', 'general', 'test', 'delivery_proximity',
      'doorstep_arrival', 'delivery_attempt', 'booking_confirmation', 'service_booking_request',
      'booking_status_update', 'service_booking_status_update'
    ])
    .withMessage('Invalid notification type')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validateNotificationData,
  validateSellerNewOrderNotification,
  validateCustomerOrderStatusNotification,
  validateBulkNotification,
  handleValidationErrors
};
