// Simple Paystack Controller for Demo
const Order = require('../../models/Order');

// Initialize Paystack payment
const initializePayment = async (req, res) => {
  try {
    console.log('=== PAYSTACK PAYMENT INITIALIZATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const { amount, email, reference } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount and email are required' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: 'https://demo.paystack.com/pay',
        access_code: 'demo_access_code',
        reference: reference || `demo_ref_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Paystack payment initialization error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
};

// Verify Paystack payment
const verifyPayment = async (req, res) => {
  try {
    console.log('=== PAYSTACK PAYMENT VERIFICATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment reference is required' 
      });
    }

    // For demo purposes, return a mock successful verification
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        status: 'success',
        reference: reference,
        amount: 10000, // 100 NGN in kobo
        paid_at: new Date().toISOString(),
        metadata: {
          orderId: 'demo_order_id'
        }
      }
    });

  } catch (error) {
    console.error('Paystack payment verification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Create order with Paystack payment
const createOrderWithPayment = async (req, res) => {
  try {
    console.log('=== PAYSTACK CREATE ORDER WITH PAYMENT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? JSON.stringify(req.user, null, 2) : 'No user');

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const { 
      products, 
      shippingAddress, 
      customerEmail 
    } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No products provided' 
      });
    }

    if (!customerEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer email is required' 
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      console.log('Processing product:', item);
      
      // For demo purposes, use the provided price
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    }

    // Create temporary order for payment reference
    const tempOrder = new Order({
      customerId: req.user.id,
      sellerId: 'demo_seller_id', // For demo purposes
      products: orderProducts,
      totalAmount: totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress,
      paymentMethod: 'paystack'
    });

    await tempOrder.save();
    console.log('Temporary order created:', tempOrder._id);

    // For demo purposes, return a mock Paystack response
    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: 'https://demo.paystack.com/pay',
        access_code: 'demo_access_code',
        reference: `AURA_ORDER_${tempOrder._id}_${Date.now()}`,
        orderId: tempOrder._id
      }
    });

  } catch (error) {
    console.error('Error creating order with payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order with payment' 
    });
  }
};

// Create subscription for premium tier
const createSubscription = async (req, res) => {
  try {
    console.log('=== CREATE PREMIUM SUBSCRIPTION ===');

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription_code: 'demo_subscription_code',
        authorization_url: 'https://demo.paystack.com/subscribe',
        access_code: 'demo_access_code'
      }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    console.log('=== CANCEL SUBSCRIPTION ===');

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      message: 'Subscription status retrieved successfully',
      data: {
        status: 'free',
        tier: 'free',
        trialEndsAt: null,
        nextBillingDate: null,
        productLimit: 5
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get bank list for payout setup
const getBankList = async (req, res) => {
  try {
    // For demo purposes, return a mock bank list
    const mockBanks = [
      { code: '044', name: 'Access Bank' },
      { code: '050', name: 'Ecobank' },
      { code: '011', name: 'First Bank' },
      { code: '058', name: 'GT Bank' },
      { code: '030', name: 'Heritage Bank' }
    ];
    
    res.status(200).json({
      success: true,
      data: mockBanks
    });

  } catch (error) {
    console.error('Get bank list error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Setup payout recipient
const setupPayoutRecipient = async (req, res) => {
  try {
    console.log('=== SETUP PAYOUT RECIPIENT ===');

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const { accountNumber, bankCode, accountName } = req.body;

    if (!accountNumber || !bankCode || !accountName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account number, bank code, and account name are required' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      message: 'Payout recipient setup successfully',
      data: {
        recipientCode: 'demo_recipient_code',
        accountNumber: accountNumber,
        bankCode: bankCode,
        accountName: accountName
      }
    });

  } catch (error) {
    console.error('Setup payout recipient error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get seller revenue summary
const getSellerRevenue = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // For demo purposes, return a mock response
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales: 1000,
          totalCommission: 100,
          totalEarnings: 900,
          transactionCount: 10
        },
        recentTransactions: [],
        pendingPayouts: 500
      }
    });

  } catch (error) {
    console.error('Get seller revenue error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Webhook handler for Paystack events
const handleWebhook = async (req, res) => {
  try {
    console.log('=== PAYSTACK WEBHOOK RECEIVED ===');
    console.log('Event:', req.body.event);

    // For demo purposes, just acknowledge the webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  createOrderWithPayment,
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  getBankList,
  setupPayoutRecipient,
  getSellerRevenue,
  handleWebhook
};
