// AURA Payment System Integration Guide
// This file shows how to integrate the new payment system with existing backend

const express = require('express');
const paystackRoutes = require('./routes/paystack.routes');

// Integration function to add payment system to existing app
function integratePaymentSystem(app) {
  console.log('🔧 Integrating AURA Payment System...');
  
  // Add Paystack routes to existing app
  app.use('/api/paystack', paystackRoutes);
  
  // Add payment system middleware
  app.use('/api/payment-system', (req, res, next) => {
    req.paymentSystem = {
      type: 'paystack',
      commission: {
        rate: 0.10, // 10%
        currency: 'NGN'
      },
      subscription: {
        premiumAmount: 8799, // R87.99 in kobo
        currency: 'NGN'
      }
    };
    next();
  });
  
  console.log('✅ AURA Payment System integrated successfully');
}

// Middleware to check subscription status
function checkSubscriptionStatus(req, res, next) {
  const Subscription = require('./models/Subscription');
  
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  Subscription.findOne({ userId: req.user.id })
    .then(subscription => {
      if (!subscription) {
        // Create free subscription for new users
        const newSubscription = new Subscription({
          userId: req.user.id,
          status: 'free',
          tier: 'free',
          productLimit: 5
        });
        return newSubscription.save();
      }
      return subscription;
    })
    .then(subscription => {
      req.userSubscription = subscription;
      next();
    })
    .catch(error => {
      console.error('Subscription check error:', error);
      next();
    });
}

// Middleware to check product limits based on subscription
function checkProductLimits(req, res, next) {
  if (!req.userSubscription) {
    return res.status(400).json({ error: 'Subscription not found' });
  }
  
  const { productLimit } = req.userSubscription;
  
  // If unlimited (-1) or user is within limit, allow
  if (productLimit === -1) {
    return next();
  }
  
  // Check current product count
  const Product = require('../models/Product');
  Product.countDocuments({ sellerId: req.user.id })
    .then(count => {
      if (count >= productLimit) {
        return res.status(403).json({
          error: 'Product limit reached',
          currentLimit: productLimit,
          upgradeMessage: 'Upgrade to Premium for unlimited products'
        });
      }
      next();
    })
    .catch(error => {
      console.error('Product limit check error:', error);
      next();
    });
}

// Function to calculate commission for existing orders
async function calculateCommissionForOrder(orderId) {
  const Order = require('../models/Order');
  const Commission = require('./models/Commission');
  const Payment = require('../models/Payment');
  
  try {
    const order = await Order.findById(orderId).populate('paymentId');
    
    if (!order || !order.paymentId) {
      throw new Error('Order or payment not found');
    }
    
    // Check if commission already exists
    const existingCommission = await Commission.findOne({ orderId: orderId });
    if (existingCommission) {
      return existingCommission;
    }
    
    // Calculate commission
    const totalAmount = order.totalAmount * 100; // Convert to kobo
    const commissionAmount = Math.round(totalAmount * 0.10);
    const sellerAmount = totalAmount - commissionAmount;
    
    // Create commission record
    const commission = new Commission({
      paymentId: order.paymentId._id,
      orderId: order._id,
      transactionId: `AURA_${order.paymentId.transactionId || Date.now()}`,
      customerId: order.customerId,
      sellerId: order.sellerId,
      totalAmount: totalAmount,
      commissionAmount: commissionAmount,
      sellerAmount: sellerAmount,
      commissionRate: 0.10,
      currency: 'NGN',
      paymentMethod: order.paymentId.method || 'stripe',
      status: 'calculated',
      escrowStatus: 'held',
      escrowReleaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      orderType: order.orderType || 'product',
      calculatedAt: new Date()
    });
    
    await commission.save();
    console.log(`Commission calculated for order ${orderId}: ${commissionAmount / 100} NGN`);
    
    return commission;
    
  } catch (error) {
    console.error('Error calculating commission for order:', error);
    throw error;
  }
}

// Function to process payouts for eligible commissions
async function processPayouts() {
  const Commission = require('./models/Commission');
  const Payout = require('./models/Payout');
  const PaystackService = require('./services/PaystackService');
  
  try {
    // Get eligible commissions for payout
    const eligibleCommissions = await Commission.find({
      status: 'collected',
      escrowStatus: 'held',
      escrowReleaseDate: { $lte: new Date() }
    }).populate('sellerId');
    
    if (eligibleCommissions.length === 0) {
      console.log('No eligible commissions for payout');
      return;
    }
    
    // Group by seller
    const commissionsBySeller = {};
    eligibleCommissions.forEach(commission => {
      const sellerId = commission.sellerId._id.toString();
      if (!commissionsBySeller[sellerId]) {
        commissionsBySeller[sellerId] = [];
      }
      commissionsBySeller[sellerId].push(commission);
    });
    
    // Process payouts for each seller
    for (const [sellerId, commissions] of Object.entries(commissionsBySeller)) {
      try {
        const commissionIds = commissions.map(c => c._id);
        const totalAmount = commissions.reduce((sum, c) => sum + c.sellerAmount, 0);
        
        // Check minimum payout amount
        if (totalAmount < 1000) { // 10 NGN minimum
          console.log(`Payout amount too low for seller ${sellerId}: ${totalAmount / 100} NGN`);
          continue;
        }
        
        // Create payout record
        const payout = await Payout.createFromCommissions(sellerId, commissionIds);
        
        // Process payout through Paystack
        const seller = commissions[0].sellerId;
        if (seller.businessProfile?.bankAccount) {
          const payoutData = {
            amount: totalAmount,
            recipientCode: seller.paystackRecipientCode // This should be set during seller setup
          };
          
          const paystackResult = await PaystackService.processPayout(payoutData);
          
          if (paystackResult) {
            await payout.markSuccess(paystackResult);
            console.log(`Payout processed for seller ${sellerId}: ${totalAmount / 100} NGN`);
          }
        } else {
          console.log(`No bank details found for seller ${sellerId}`);
        }
        
      } catch (error) {
        console.error(`Error processing payout for seller ${sellerId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error processing payouts:', error);
  }
}

// Function to get platform revenue statistics
async function getPlatformRevenueStats(startDate, endDate) {
  const Commission = require('./models/Commission');
  const Subscription = require('./models/Subscription');
  
  try {
    // Get commission revenue
    const commissionStats = await Commission.getTotalCommission(startDate, endDate);
    
    // Get subscription revenue
    const subscriptionStats = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'premium'
        }
      },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    
    const subscriptionRevenue = subscriptionStats[0] || { totalSubscriptions: 0, totalRevenue: 0 };
    
    return {
      commission: {
        totalRevenue: commissionStats.totalCommission / 100,
        transactionCount: commissionStats.totalTransactions,
        averageCommission: commissionStats.averageCommission / 100
      },
      subscription: {
        totalRevenue: subscriptionRevenue.totalRevenue / 100,
        activeSubscriptions: subscriptionRevenue.totalSubscriptions
      },
      total: {
        revenue: (commissionStats.totalCommission + subscriptionRevenue.totalRevenue) / 100,
        transactions: commissionStats.totalTransactions
      }
    };
    
  } catch (error) {
    console.error('Error getting platform revenue stats:', error);
    throw error;
  }
}

module.exports = {
  integratePaymentSystem,
  checkSubscriptionStatus,
  checkProductLimits,
  calculateCommissionForOrder,
  processPayouts,
  getPlatformRevenueStats
};
