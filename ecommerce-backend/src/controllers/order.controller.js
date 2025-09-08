const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");

// Role-based notification service for comprehensive notifications
const {
  sendCustomerOrderNotification,
  sendSellerNewOrderNotification,
  sendSellerOrderCancellationNotification,
  sendCustomerDeliveryNotification
} = require("../services/roleBasedNotification.service");

// Get current user's orders (for customer to view their own orders)
const getCurrentUserOrders = async (req, res) => {
  try {
    console.log('=== GET CURRENT USER ORDERS START ===');
    console.log('Customer ID:', req.user.id);
    
    const orders = await Order.find({ customerId: req.user.id })
      .populate('sellerId', 'name location businessName businessDescription role')
      .populate('customerId', 'name location') // Also populate customer data for tracking
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for customer`);
    
    // Log seller location data and delivery tracking for debugging
    orders.forEach((order, index) => {
      if (index < 3) { // Log first 3 orders for debugging
        console.log(`Order ${index + 1} data:`, {
          orderId: order._id,
          status: order.status,
          sellerId: order.sellerId?._id,
          sellerName: order.sellerId?.name,
          sellerLocation: order.sellerId?.location,
          deliveryTracking: order.deliveryTracking // 🚚 LOG DELIVERY TRACKING
        });
      }
    });
    
    console.log('=== GET CURRENT USER ORDERS END ===');
    res.json(orders);
  } catch (error) {
    console.error('Error getting current user orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get customer orders (for seller to view customer history)
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    console.log('Getting orders for customer:', customerId);
    
    // First, verify the customer exists
    const User = require('../models/User');
    const customer = await User.findById(customerId).select('name email phone location createdAt');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get all orders for this customer
    const orders = await Order.find({ customerId })
      .populate('customerId', 'name email phone location createdAt')
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for customer ${customer.name}`);
    
    // If no orders found, return customer info with empty orders array
    if (orders.length === 0) {
      const customerProfile = {
        customerId: customer,
        orders: [],
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null
      };
      return res.json([customerProfile]);
    }

    res.json(orders);
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get seller's orders
const getSellerOrders = async (req, res) => {
  try {
    console.log('=== GET SELLER ORDERS START ===');
    console.log('Seller ID:', req.user._id);
    
    // Validate user ID
    if (!req.user._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { status } = req.query;
    let query = { sellerId: req.user._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email location') // Include location for customer tracking
      .populate('sellerId', 'name location businessName businessDescription role') // CRITICAL: Populate seller data for TrackOrderModal
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for seller`);
    
    // Log customer and seller location data and delivery tracking for debugging
    orders.forEach((order, index) => {
      if (index < 3) { // Log first 3 orders for debugging
        console.log(`Seller Order ${index + 1} data:`, {
          orderId: order._id,
          status: order.status,
          customerId: order.customerId?._id,
          customerName: order.customerId?.name,
          customerLocation: order.customerId?.location,
          sellerId: order.sellerId?._id,
          sellerName: order.sellerId?.name,
          sellerLocation: order.sellerId?.location,
          deliveryTracking: order.deliveryTracking // 🚚 LOG DELIVERY TRACKING
        });
      }
    });
    
    console.log('=== GET SELLER ORDERS END ===');
    res.json(orders);
  } catch (error) {
    console.error('getSellerOrders error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get seller statistics
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    console.log('=== GET SELLER STATS START ===');
    console.log('getSellerStats called with sellerId:', sellerId);
    
    // Validate user ID
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      console.error('Invalid seller ID:', sellerId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Convert to ObjectId if it's a string
    const sellerObjectId = mongoose.Types.ObjectId.isValid(sellerId) 
      ? new mongoose.Types.ObjectId(sellerId) 
      : sellerId;

    console.log('Processing stats for seller:', sellerObjectId);

    // Enhanced aggregation pipeline with better error handling and data validation
    const statsAggregation = await Order.aggregate([
      { 
        $match: { 
          sellerId: sellerObjectId 
        } 
      },
      {
        $facet: {
          // Total sales from completed orders (more comprehensive status list)
          totalSales: [
            { 
              $match: { 
                status: { $in: ['delivered', 'paid', 'shipped', 'completed', 'confirmed'] } 
              } 
            },
            { 
              $group: { 
                _id: null, 
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              } 
            }
          ],
          // Order counts by status with validation
          orderCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          // Recent orders (last 7 days) with date validation
          recentOrders: [
            {
              $match: {
                createdAt: { 
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  $lte: new Date() // Ensure we don't get future dates
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ],
          // Average order value (only from revenue-generating orders)
          averageOrderValue: [
            { 
              $match: { 
                status: { $in: ['delivered', 'paid', 'shipped', 'completed', 'confirmed'] },
                totalAmount: { $gt: 0 } // Ensure positive amounts
              } 
            },
            {
              $group: {
                _id: null,
                avg: { $avg: '$totalAmount' },
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            }
          ],
          // Pending orders with status validation
          pendingOrders: [
            {
              $match: {
                status: { $in: ['pending', 'processing', 'preparing'] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ],
          // Additional stats for better insights
          totalOrders: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ],
          // Completed orders count
          completedOrders: [
            {
              $match: {
                status: { $in: ['delivered', 'completed'] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    console.log('Raw aggregation result:', JSON.stringify(statsAggregation, null, 2));
    
    // Validate aggregation result
    if (!statsAggregation || !Array.isArray(statsAggregation) || statsAggregation.length === 0) {
      console.error('Invalid aggregation result:', statsAggregation);
      throw new Error('Failed to aggregate order statistics');
    }

    const result = statsAggregation[0];

    // Process the results with enhanced validation and fallbacks
    const totalSalesData = result.totalSales[0] || { total: 0, count: 0 };
    const orderCountsData = result.orderCounts || [];
    const recentOrdersData = result.recentOrders[0] || { count: 0 };
    const avgOrderData = result.averageOrderValue[0] || { avg: 0, total: 0, count: 0 };
    const pendingOrdersData = result.pendingOrders[0] || { count: 0 };
    const totalOrdersData = result.totalOrders[0] || { count: 0 };
    const completedOrdersData = result.completedOrders[0] || { count: 0 };

    // Validate numeric values and provide fallbacks
    const validateNumber = (value, fallback = 0) => {
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value;
      }
      console.warn(`Invalid numeric value: ${value}, using fallback: ${fallback}`);
      return fallback;
    };

    // Build order counts by status object with validation
    const orderCountsByStatus = {};
    orderCountsData.forEach(item => {
      if (item._id && typeof item.count === 'number' && !isNaN(item.count)) {
        orderCountsByStatus[item._id] = Math.max(0, item.count);
      }
    });

    // Calculate validated statistics
    const totalSales = validateNumber(totalSalesData.total);
    const totalOrders = validateNumber(totalOrdersData.count);
    const recentOrders = validateNumber(recentOrdersData.count);
    const pendingOrders = validateNumber(pendingOrdersData.count);
    const averageOrderValue = validateNumber(avgOrderData.avg);
    const completedOrders = validateNumber(completedOrdersData.count);
    
    // Calculate completion rate with validation
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Ensure all values are within reasonable bounds
    const finalStats = {
      totalSales: Math.max(0, Math.round(totalSales * 100) / 100), // Round to 2 decimal places, ensure non-negative
      totalOrders: Math.max(0, totalOrders),
      recentOrders: Math.max(0, Math.min(recentOrders, totalOrders)), // Recent orders can't exceed total
      pendingOrders: Math.max(0, Math.min(pendingOrders, totalOrders)), // Pending orders can't exceed total
      averageOrderValue: Math.max(0, Math.round(averageOrderValue * 100) / 100), // Round to 2 decimal places, ensure non-negative
      orderCountsByStatus: orderCountsByStatus,
      completedOrders: Math.max(0, Math.min(completedOrders, totalOrders)), // Completed orders can't exceed total
      completionRate: Math.max(0, Math.min(completionRate, 100)) // Completion rate between 0-100%
    };

    // Final validation of the stats object
    console.log('Final calculated stats:', finalStats);
    
    // Validate that the stats make logical sense
    if (finalStats.totalSales < 0 || finalStats.totalOrders < 0 || finalStats.averageOrderValue < 0) {
      console.error('Invalid negative values in stats:', finalStats);
      throw new Error('Calculated statistics contain invalid negative values');
    }

    if (finalStats.completedOrders > finalStats.totalOrders) {
      console.error('Completed orders exceed total orders:', finalStats);
      finalStats.completedOrders = finalStats.totalOrders;
    }

    if (finalStats.pendingOrders > finalStats.totalOrders) {
      console.error('Pending orders exceed total orders:', finalStats);
      finalStats.pendingOrders = finalStats.totalOrders;
    }

    console.log('=== GET SELLER STATS END ===');
    res.json(finalStats);
  } catch (error) {
    console.error('getSellerStats error:', error);
    
    // Provide comprehensive fallback data to prevent frontend crashes
    const fallbackStats = {
      totalSales: 0,
      totalOrders: 0,
      recentOrders: 0,
      pendingOrders: 0,
      averageOrderValue: 0,
      orderCountsByStatus: {},
      completedOrders: 0,
      completionRate: 0
    };
    
    res.status(500).json({ 
      error: 'Failed to fetch seller statistics',
      details: error.message,
      fallbackStats: fallbackStats,
      timestamp: new Date().toISOString()
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    console.log('=== GET SINGLE ORDER START ===');
    console.log('Order ID:', req.params.orderId);
    console.log('Requesting user ID:', req.user._id);
    
    const order = await Order.findById(req.params.orderId)
      .populate('customerId', 'name email location') // Include email and location for customer tracking
      .populate('sellerId', 'name location businessName businessDescription role') // Include complete seller data
      .populate('products.productId', 'name price images')
      .populate('paymentId');
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: "Order not found" });
    }

    console.log('Order found:', {
      orderId: order._id,
      sellerId: order.sellerId?._id,
      sellerName: order.sellerId?.name,
      sellerLocation: order.sellerId?.location,
      customerId: order.customerId?._id,
      customerName: order.customerId?.name,
      customerLocation: order.customerId?.location
    });

    // Check if user is authorized to view this order
    if (order.customerId._id.toString() !== req.user._id.toString() && 
        order.sellerId._id.toString() !== req.user._id.toString()) {
      console.log('User not authorized to view this order');
      return res.status(403).json({ message: "Not authorized" });
    }
    
    console.log('=== GET SINGLE ORDER END ===');
    res.json(order);
  } catch (error) {
    console.error('Error getting single order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create order (customer only)
const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod, orderType, trackingData } = req.body;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
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

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'pending',
      description: 'Order payment',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await payment.save();

    // Create order
    const order = new Order({
      customerId: req.user._id,
      sellerId: products[0].sellerId, // Assuming single seller per order
      orderType: orderType || 'product', // Add orderType with default fallback
      products: orderProducts,
      totalAmount,
      paymentId: payment._id,
      shippingAddress,
      trackingData: trackingData || null
    });

    await order.save();

    // 📱 SEND NOTIFICATIONS FOR NEW ORDER CREATION
    
    // 1. Customer notification - Order confirmation
    try {
      const orderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: totalAmount,
        status: 'pending'
      };
      
      await sendCustomerOrderNotification(
        req.user._id.toString(),
        'pending',
        orderData
      );
      console.log('✅ Customer order confirmation notification sent');
    } catch (notificationError) {
      console.error('⚠️ Customer order notification error:', notificationError);
    }

    // 2. Seller notification - New order received
    try {
      const orderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: totalAmount,
        customerName: req.user.name || 'Customer',
        itemsCount: orderProducts.length
      };
      
      await sendSellerNewOrderNotification(
        products[0].sellerId,
        orderData
      );
      console.log('✅ Seller new order notification sent');
    } catch (notificationError) {
      console.error('⚠️ Seller new order notification error:', notificationError);
    }

    // Populate order with product details
    const populatedOrder = await Order.findById(order._id)
      .populate('products.productId', 'name price images')
      .populate('sellerId', 'name');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status (seller only)
const updateOrderStatus = async (req, res) => {
  try {
    console.log('=== UPDATE ORDER STATUS DEBUG ===');
    console.log('Order ID:', req.params.orderId);
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    console.log('Request method:', req.method);
    
    const { status, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    console.log('Found order:', order ? 'Yes' : 'No');
    if (order) {
      console.log('Order seller ID:', order.sellerId);
      console.log('Current order status:', order.status);
      console.log('Order customer ID:', order.customerId);
    }
    
    if (!order) {
      console.log('Order not found - returning 404');
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.sellerId.toString() !== req.user._id.toString()) {
      console.log('Authorization failed: seller ID mismatch');
      console.log('Order seller ID:', order.sellerId.toString());
      console.log('User ID:', req.user._id.toString());
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;

    // 🚚 REAL-TIME DELIVERY TRACKING LOGIC (SAFE ENHANCEMENT)
    const now = new Date();
    
    if (status === 'shipped' && order.status !== 'shipped') {
      // Order is being marked as shipped - START TRACKING
      console.log('🚚 Starting delivery tracking...');
      
      updateData.deliveryTracking = {
        startTime: now,
        lastUpdated: now,
        isActive: true,
        // estimatedMinutes will be calculated by frontend based on distance
      };
      
      console.log('✅ Delivery tracking started at:', now);
    } else if (status === 'delivered' && order.status === 'shipped') {
      // Order is being marked as delivered - END TRACKING
      console.log('🎯 Ending delivery tracking...');
      
      updateData['deliveryTracking.actualDeliveryTime'] = now;
      updateData['deliveryTracking.isActive'] = false;
      updateData['deliveryTracking.lastUpdated'] = now;
      
      console.log('✅ Delivery completed at:', now);
    } else if (status === 'out_for_delivery' && order.status !== 'out_for_delivery') {
      // Order is out for delivery - send delivery notification
      console.log('🚚 Order is out for delivery...');
    } else if (order.deliveryTracking?.isActive) {
      // Update last updated time for active deliveries
      updateData['deliveryTracking.lastUpdated'] = now;
    }

    console.log('Update data with tracking:', updateData);

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      updateData,
      { new: true }
    ).populate('customerId', 'name email')
     .populate('products.productId', 'name price images');

    console.log('Order updated successfully');
    console.log('New status:', updatedOrder.status);
    console.log('Updated order:', updatedOrder);
    
    // 📱 SAFE NOTIFICATION ADDITION - Send notification to customer
    try {
      console.log('🔔 Creating customer notification...');
      console.log('🔔 Order customer ID (raw):', order.customerId);
      console.log('🔔 Order customer ID (string):', order.customerId.toString());
      console.log('🔔 Order customer ID (type):', typeof order.customerId);
      console.log('🔔 Current user ID (raw):', req.user._id);
      console.log('🔔 Current user ID (string):', req.user._id.toString());
      console.log('🔔 Current user ID (type):', typeof req.user._id);
      
      // Ensure we use the correct user ID format
      const customerUserId = order.customerId.toString();
      
      const orderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: order.totalAmount,
        status: status
      };
      
      await sendCustomerOrderNotification(
        customerUserId,
        status,
        orderData
      );
      console.log('✅ Order status notification sent to customer successfully');
      
      // Send delivery notification for delivery-related statuses
      if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
        try {
          const deliveryData = {
            orderId: order._id.toString(),
            status: status,
            trackingNumber: updatedOrder.trackingNumber,
            estimatedDelivery: updatedOrder.estimatedDelivery
          };
          
          await sendCustomerDeliveryNotification(
            customerUserId,
            status,
            deliveryData
          );
          console.log('✅ Delivery notification sent to customer successfully');
        } catch (deliveryNotificationError) {
          console.error('⚠️ Delivery notification error (non-critical):', deliveryNotificationError);
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Customer notification error (non-critical):', notificationError);
      // Don't fail the main order update if notification fails
    }

    // 📱 CUSTOMER IN-APP NOTIFICATION - Create in-app notification for customer
    try {
      const customerOrderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: order.totalAmount,
        status: status
      };
      
      // Create a customer notification about the status update
      const notification = new Notification({
        userId: order.customerId.toString(),
        title: `Order Status Updated`,
        message: `Your order #${customerOrderData.orderNumber} status has been updated to ${status}`,
        type: 'customer_order_updated',
        data: {
          orderId: order._id.toString(),
          orderNumber: customerOrderData.orderNumber,
          status: status,
          totalAmount: customerOrderData.totalAmount
        },
        priority: 'normal'
      });
      
      await notification.save();
      console.log('✅ Customer order update notification created successfully');
    } catch (customerNotificationError) {
      console.error('⚠️ Customer notification error (non-critical):', customerNotificationError);
      // Don't fail the main order update if notification fails
    }
    
    console.log('=== UPDATE ORDER STATUS END ===');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Cancel order (customer only)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    // Restore product quantities
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.quantity += item.quantity;
        if (product.status === 'out_of_stock' && product.quantity > 0) {
          product.status = 'active';
        }
        await product.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    // 📱 SEND NOTIFICATIONS FOR ORDER CANCELLATION
    
    // 1. Customer notification about cancellation
    try {
      const orderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: order.totalAmount,
        status: 'cancelled'
      };
      
      await sendCustomerOrderNotification(
        order.customerId.toString(),
        'cancelled',
        orderData
      );
      console.log('✅ Customer cancellation notification sent');
    } catch (notificationError) {
      console.error('⚠️ Customer cancellation notification error:', notificationError);
    }

    // 2. Seller notification about cancellation
    try {
      const orderData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        totalAmount: order.totalAmount,
        customerName: order.customerId?.name || 'Customer',
        itemsCount: order.products?.length || 0,
        cancellationReason: 'Cancelled by customer'
      };
      
      await sendSellerOrderCancellationNotification(
        order.sellerId.toString(),
        orderData
      );
      console.log('✅ Seller cancellation notification sent');
    } catch (notificationError) {
      console.error('⚠️ Seller cancellation notification error:', notificationError);
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete order (customer or seller - for delivered orders only)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Allow both customer and seller to delete the order
    const isAuthorized = order.customerId.toString() === req.user._id.toString() || 
                        order.sellerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: "Only delivered orders can be deleted" });
    }

    // Delete the order
    await Order.findByIdAndDelete(req.params.orderId);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all user's orders (where user is customer OR seller, only delivered orders)
const deleteAllCustomerOrders = async (req, res) => {
  try {
    console.log('🗑️ DELETE ALL ORDERS - User:', req.user._id);
    
    // Delete delivered orders where user is either customer OR seller
    const result = await Order.deleteMany({
      $or: [
        { customerId: req.user._id },
        { sellerId: req.user._id }
      ],
      status: 'delivered'
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} delivered orders`);
    
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} delivered orders`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all user orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🚚 UPDATE DELIVERY TRACKING (SAFE NEW FUNCTION)
const updateDeliveryTracking = async (req, res) => {
  try {
    console.log('=== UPDATE DELIVERY TRACKING START ===');
    console.log('Order ID:', req.params.orderId);
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    
    const { estimatedMinutes } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: "Order not found" });
    }

    // Allow both customer and seller to update tracking data
    const isAuthorized = order.customerId.toString() === req.user._id.toString() || 
                        order.sellerId.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      console.log('Not authorized to update tracking');
      return res.status(403).json({ message: "Not authorized" });
    }

    // Initialize delivery tracking if it doesn't exist or is inactive
    if (!order.deliveryTracking || !order.deliveryTracking.isActive) {
      console.log('Initializing delivery tracking...');
      order.deliveryTracking = {
        startTime: order.updatedAt || order.createdAt,
        estimatedMinutes: estimatedMinutes,
        lastUpdated: new Date(),
        isActive: true
      };
    }

    const updateData = {
      'deliveryTracking.lastUpdated': new Date()
    };

    // Update estimated minutes if provided (from frontend distance calculation)
    if (estimatedMinutes && typeof estimatedMinutes === 'number' && estimatedMinutes > 0) {
      updateData['deliveryTracking.estimatedMinutes'] = estimatedMinutes;
      console.log('Updated estimated minutes:', estimatedMinutes);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      updateData,
      { new: true }
    ).populate('customerId', 'name email location')
     .populate('sellerId', 'name location businessName role')
     .populate('products.productId', 'name price images');

    console.log('Delivery tracking updated successfully');
    console.log('=== UPDATE DELIVERY TRACKING END ===');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating delivery tracking:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCurrentUserOrders,
  getCustomerOrders,
  getSellerOrders,
  getSellerStats,
  getOrderById: getOrder,
  createOrder,
  updateOrderStatus,
  updateDeliveryTracking,
  cancelOrder,
  deleteOrder,
  deleteAllCustomerOrders
};
