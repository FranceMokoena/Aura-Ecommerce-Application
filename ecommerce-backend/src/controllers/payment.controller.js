const stripe = require('stripe')('sk_test_d032d31cc54320da3083a5cb5f2510453e75e6d0');
const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");

// Role-based notification service for comprehensive notifications
const {
  sendCustomerPaymentNotification,
  sendSellerPaymentNotification,
  sendSellerNewOrderNotification
} = require("../services/roleBasedNotification.service");

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        customerId: req.user.id,
        customerName: req.user.name
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('createPaymentIntent error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create order with payment
const createOrderWithPayment = async (req, res) => {
  console.log('=== PAYMENT CONTROLLER START ===');
  console.log('createOrderWithPayment called with:', JSON.stringify(req.body, null, 2));
  console.log('User object:', req.user ? JSON.stringify(req.user, null, 2) : 'No user');
  console.log('User ID:', req.user?.id);
  
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { products, shippingAddress, paymentMethod, paymentIntentId } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      console.log('Processing product:', item);
      
      // Validate productId format
      if (!item.productId || typeof item.productId !== 'string' || item.productId.length !== 24) {
        console.log('Invalid productId format:', item.productId);
        return res.status(400).json({ 
          message: `Invalid product ID format: ${item.productId}. Product ID must be a 24-character MongoDB ObjectId.` 
        });
      }
      
      const product = await Product.findById(item.productId);
      if (!product) {
        console.log('Product not found:', item.productId);
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      if (product.status !== 'active') {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.status = 'out_of_stock';
      }
      await product.save();
    }

    // Verify payment intent
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: 'Payment not completed' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid payment intent' });
      }
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      amount: totalAmount,
      method: paymentMethod || 'stripe',
      status: 'completed',
      description: 'Order payment',
      transactionId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique demo transaction ID
      stripePaymentIntentId: paymentIntentId
    });
    await payment.save();

    // Create orders for each seller (one order per seller)
    const createdOrders = [];
    
    // Group products by seller
    const productsBySeller = {};
    
    for (const item of products) {
      console.log('Processing item for grouping:', item);
      const product = await Product.findById(item.productId);
      console.log('Found product:', product ? product.name : 'NOT FOUND');
      
      if (!product) {
        console.log('Product not found, skipping:', item.productId);
        continue;
      }
      
      const sellerId = product.sellerId.toString();
      console.log('Seller ID from product:', sellerId);
      
      if (!productsBySeller[sellerId]) {
        productsBySeller[sellerId] = [];
      }
      
      productsBySeller[sellerId].push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }
    
    console.log('Products grouped by seller:', Object.keys(productsBySeller));

    // Create an order for each seller
    for (const [sellerId, sellerProducts] of Object.entries(productsBySeller)) {
      console.log('Creating order for seller:', sellerId);
      console.log('Seller products:', sellerProducts);
      
      const sellerTotal = sellerProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log('Seller total:', sellerTotal);

      const order = new Order({
        customerId: req.user.id,
        sellerId: sellerId,
        products: sellerProducts,
        totalAmount: sellerTotal,
        paymentId: payment._id,
        shippingAddress,
        status: 'paid'
      });

      console.log('Order object created:', order);
      
      try {
        await order.save();
        console.log('Order saved successfully');
        
        // Populate order with product details
        const populatedOrder = await Order.findById(order._id)
          .populate('products.productId', 'name price images')
          .populate('sellerId', 'name')
          .populate('customerId', 'name email');

        // 📱 SELLER NOTIFICATION - Notify seller about new order
        try {
          const orderData = {
            orderId: populatedOrder._id.toString(),
            orderNumber: `#${populatedOrder._id.toString().slice(-6)}`,
            totalAmount: populatedOrder.totalAmount,
            customerName: populatedOrder.customerId?.name || 'Customer',
            itemsCount: populatedOrder.products?.length || 0
          };
          
          await sendSellerNewOrderNotification(
            populatedOrder.sellerId._id.toString(),
            orderData
          );
          console.log('✅ New order notification sent to seller successfully');
        } catch (sellerNotificationError) {
          console.error('⚠️ Seller notification error (non-critical):', sellerNotificationError);
          // Don't fail the main order creation if notification fails
        }

        // 📱 CUSTOMER NOTIFICATION - Notify customer about payment success
        try {
          const paymentData = {
            paymentId: payment._id.toString(),
            orderId: populatedOrder._id.toString(),
            orderNumber: `#${populatedOrder._id.toString().slice(-6)}`,
            amount: populatedOrder.totalAmount
          };
          
          await sendCustomerPaymentNotification(
            req.user.id,
            'successful',
            paymentData
          );
          console.log('✅ Payment success notification sent to customer successfully');
        } catch (customerNotificationError) {
          console.error('⚠️ Customer notification error (non-critical):', customerNotificationError);
          // Don't fail the main order creation if notification fails
        }

        createdOrders.push(populatedOrder);
        console.log('Order populated and added to createdOrders');
      } catch (saveError) {
        console.error('Error saving order:', saveError);
        throw saveError;
      }
    }

    console.log('Orders created successfully:', createdOrders.length);
    res.status(201).json({
      message: 'Order created successfully',
      orders: createdOrders,
      payment: payment
    });
  } catch (error) {
    console.error('createOrderWithPayment error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Confirm payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      res.json({ 
        success: true, 
        message: 'Payment confirmed',
        paymentIntent: paymentIntent
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Payment not completed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('confirmPayment error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  createOrderWithPayment,
  confirmPayment
};
