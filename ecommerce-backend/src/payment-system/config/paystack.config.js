// Paystack Configuration for AURA Platform
module.exports = {
  // API Configuration
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  baseURL: 'https://api.paystack.co',
  
  // Subscription Plans
  plans: {
    premium: {
      code: process.env.PAYSTACK_PREMIUM_PLAN_CODE || 'PLN_AURA_PREMIUM',
      name: 'AURA Premium Subscription',
      amount: 8799, // R87.99 in kobo
      currency: 'NGN',
      interval: 'monthly',
      description: 'Premium subscription for unlimited products and advanced features'
    }
  },
  
  // Commission Configuration
  commission: {
    rate: 0.10, // 10%
    currency: 'NGN',
    escrowPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    minimumPayout: 1000 // 10 NGN minimum payout amount
  },
  
  // Webhook Configuration
  webhook: {
    secret: process.env.PAYSTACK_WEBHOOK_SECRET,
    events: [
      'charge.success',
      'transfer.success',
      'subscription.create',
      'subscription.disable',
      'invoice.create',
      'invoice.payment_failed'
    ]
  },
  
  // Payout Configuration
  payout: {
    currency: 'NGN',
    source: 'balance',
    reason: 'AURA Platform Commission Payout',
    batchSize: 50, // Maximum payouts per batch
    retryAttempts: 3
  },
  
  // Bank Configuration
  banks: {
    defaultCountry: 'NG',
    supportedTypes: ['nuban', 'mobile_money', 'basa']
  },
  
  // Environment Configuration
  environment: {
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    isDevelopment: process.env.NODE_ENV === 'development'
  },
  
  // Error Messages
  errors: {
    INVALID_AMOUNT: 'Invalid payment amount',
    PAYMENT_FAILED: 'Payment processing failed',
    VERIFICATION_FAILED: 'Payment verification failed',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    SUBSCRIPTION_FAILED: 'Subscription creation failed',
    PAYOUT_FAILED: 'Payout processing failed',
    INVALID_WEBHOOK: 'Invalid webhook signature',
    INSUFFICIENT_BALANCE: 'Insufficient balance for payout'
  },
  
  // Success Messages
  messages: {
    PAYMENT_SUCCESS: 'Payment processed successfully',
    VERIFICATION_SUCCESS: 'Payment verified successfully',
    SUBSCRIPTION_SUCCESS: 'Subscription created successfully',
    PAYOUT_SUCCESS: 'Payout processed successfully',
    WEBHOOK_SUCCESS: 'Webhook processed successfully'
  }
};
