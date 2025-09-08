const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { sendSellerNewOrderNotification, sendCustomerOrderNotification } = require('../services/roleBasedNotification.service');
const { testPushNotification } = require('../services/pushNotification.service');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Test push notification endpoint
router.post('/push', async (req, res) => {
  try {
    console.log('🧪 === TEST PUSH NOTIFICATION START ===');
    console.log('🧪 User:', req.user);
    
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!user.pushToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'No push token found for user. Please ensure push notifications are enabled.',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          hasPushToken: false
        }
      });
    }
    
    console.log('🧪 Testing push notification for user:', {
      id: user._id,
      name: user.name,
      role: user.role,
      pushToken: `${user.pushToken.substring(0, 20)}...`
    });
    
    const result = await testPushNotification(user.pushToken);
    
    console.log('🧪 Test result:', result);
    console.log('🧪 === TEST PUSH NOTIFICATION END ===');
    
    res.json({
      success: result.success,
      message: result.message,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        hasPushToken: true,
        pushTokenPreview: `${user.pushToken.substring(0, 20)}...`
      }
    });
    
  } catch (error) {
    console.error('❌ Test push notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    });
  }
});

// Test seller new order notification
router.post('/seller-order', async (req, res) => {
  try {
    console.log('🧪 === TEST SELLER ORDER NOTIFICATION START ===');
    
    const { sellerId } = req.body;
    const targetSellerId = sellerId || req.user._id;
    
    console.log('🧪 Testing seller order notification for seller:', targetSellerId);
    
    const mockOrderData = {
      orderId: 'test_order_' + Date.now(),
      orderNumber: '#TEST' + Date.now().toString().slice(-6),
      totalAmount: 99.99,
      customerName: 'Test Customer',
      itemsCount: 2
    };
    
    console.log('🧪 Mock order data:', mockOrderData);
    
    await sendSellerNewOrderNotification(targetSellerId, mockOrderData);
    
    console.log('🧪 === TEST SELLER ORDER NOTIFICATION END ===');
    
    res.json({
      success: true,
      message: 'Seller order notification test sent successfully',
      data: {
        sellerId: targetSellerId,
        orderData: mockOrderData
      }
    });
    
  } catch (error) {
    console.error('❌ Test seller order notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    });
  }
});

// Test customer order status notification
router.post('/customer-order', async (req, res) => {
  try {
    console.log('🧪 === TEST CUSTOMER ORDER NOTIFICATION START ===');
    
    const { customerId, status } = req.body;
    const targetCustomerId = customerId || req.user._id;
    const orderStatus = status || 'shipped';
    
    console.log('🧪 Testing customer order notification for customer:', targetCustomerId);
    console.log('🧪 Order status:', orderStatus);
    
    const mockOrderData = {
      orderId: 'test_order_' + Date.now(),
      orderNumber: '#TEST' + Date.now().toString().slice(-6),
      totalAmount: 149.99,
      status: orderStatus
    };
    
    console.log('🧪 Mock order data:', mockOrderData);
    
    await sendCustomerOrderNotification(targetCustomerId, orderStatus, mockOrderData);
    
    console.log('🧪 === TEST CUSTOMER ORDER NOTIFICATION END ===');
    
    res.json({
      success: true,
      message: 'Customer order notification test sent successfully',
      data: {
        customerId: targetCustomerId,
        status: orderStatus,
        orderData: mockOrderData
      }
    });
    
  } catch (error) {
    console.error('❌ Test customer order notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    });
  }
});

// Get user push token status
router.get('/token-status', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Push token status retrieved',
      data: {
        userId: user._id,
        name: user.name,
        role: user.role,
        hasPushToken: !!user.pushToken,
        pushTokenPreview: user.pushToken ? `${user.pushToken.substring(0, 20)}...` : 'NO TOKEN',
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Get token status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get token status', 
      error: error.message 
    });
  }
});

module.exports = router;
