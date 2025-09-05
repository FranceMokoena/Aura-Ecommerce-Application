const ShopProduct = require("../models/ShopProduct");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const User = require("../models/User");

// Create shop product order (customer)
const createShopProductOrder = async (req, res) => {
  try {
    const { 
      shopId, 
      products, 
      shippingAddress, 
      paymentMethod,
      deliveryOption = 'pickup',
      notes 
    } = req.body;

    // Validate shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.status !== 'active') {
      return res.status(400).json({ message: "Shop is not active" });
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const orderProducts = [];
    const shopOwner = await User.findById(shop.ownerId);

    for (const item of products) {
      const product = await ShopProduct.findById(item.shopProductId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.shopProductId} not found` });
      }
      
      if (product.shopId.toString() !== shopId) {
        return res.status(400).json({ message: `Product does not belong to this shop` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      if (product.status !== 'active') {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }

      // Calculate price (consider sale price if applicable)
      const productPrice = product.onSale && product.salePercentage 
        ? product.price - (product.price * product.salePercentage / 100)
        : product.price;

      const itemTotal = productPrice * item.quantity;
      totalAmount += itemTotal;

      orderProducts.push({
        shopProductId: item.shopProductId,
        quantity: item.quantity,
        price: productPrice
      });

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.status = 'out_of_stock';
      }
      await product.save();
    }

    // Add delivery fee if delivery option is selected
    if (deliveryOption === 'delivery' && shop.deliveryFee > 0) {
      totalAmount += shop.deliveryFee;
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'pending',
      description: `Order from ${shop.name}`,
      transactionId: `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await payment.save();

    // Create order
    const order = new Order({
      customerId: req.user._id,
      sellerId: shop.ownerId,
      orderType: 'product',
      products: orderProducts,
      totalAmount,
      paymentId: payment._id,
      shippingAddress: deliveryOption === 'delivery' ? shippingAddress : null,
      notes,
      status: 'pending'
    });

    await order.save();

    // Populate order with product and shop details
    const populatedOrder = await Order.findById(order._id)
      .populate('products.shopProductId', 'name price images brand')
      .populate('sellerId', 'name')
      .populate('customerId', 'name email');

    res.status(201).json({
      order: populatedOrder,
      payment: payment,
      message: "Order created successfully"
    });
  } catch (error) {
    console.error('Error creating shop product order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get shop manager's orders (for shop owners)
const getShopManagerOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    let query = { 
      sellerId: req.user._id,
      orderType: 'product'
    };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { 'products.shopProductId': { $in: await ShopProduct.find({ 
          shopId: shop._id, 
          name: { $regex: search, $options: 'i' } 
        }).select('_id') }},
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone')
      .populate('products.shopProductId', 'name price images brand sku')
      .populate('paymentId', 'status method amount')
      .sort(sortOptions);

    res.json(orders);
  } catch (error) {
    console.error('Error getting shop manager orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update order status (shop manager)
const updateShopOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, estimatedDelivery, notes } = req.body;
    const orderId = req.params.orderId;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const order = await Order.findOne({
      _id: orderId,
      sellerId: req.user._id,
      orderType: 'product'
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // Update order
    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;
    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
    .populate('customerId', 'name email phone')
    .populate('products.shopProductId', 'name price images brand')
    .populate('paymentId', 'status method amount');

    // If order is cancelled, restore product quantities
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.products) {
        const product = await ShopProduct.findById(item.shopProductId);
        if (product) {
          product.quantity += item.quantity;
          if (product.status === 'out_of_stock' && product.quantity > 0) {
            product.status = 'active';
          }
          await product.save();
        }
      }
    }

    res.json({
      order: updatedOrder,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating shop order status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get shop order analytics
const getShopOrderAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          sellerId: req.user._id,
          orderType: 'product',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get daily order trends
    const dailyTrends = await Order.aggregate([
      {
        $match: {
          sellerId: req.user._id,
          orderType: 'product',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          sellerId: req.user._id,
          orderType: 'product',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.shopProductId',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'shopproducts',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    const analytics = {
      shopId: shop._id,
      period: `${period} days`,
      orderStats: orderStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
        return acc;
      }, {}),
      dailyTrends,
      topProducts,
      totalOrders: orderStats.reduce((sum, stat) => sum + stat.count, 0),
      totalRevenue: orderStats.reduce((sum, stat) => sum + stat.totalAmount, 0)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error getting shop order analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single shop order details
const getShopOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    const order = await Order.findOne({
      _id: orderId,
      sellerId: req.user._id,
      orderType: 'product'
    })
    .populate('customerId', 'name email phone')
    .populate('products.shopProductId', 'name price images brand sku weight dimensions')
    .populate('paymentId', 'status method amount transactionId createdAt');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error('Error getting shop order details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get customer's shop orders (for customers to view their shop purchases)
const getCustomerShopOrders = async (req, res) => {
  try {
    const { status, shopId } = req.query;

    let query = { 
      customerId: req.user._id,
      orderType: 'product'
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        query.sellerId = shop.ownerId;
      }
    }

    const orders = await Order.find(query)
      .populate('sellerId', 'name')
      .populate('products.shopProductId', 'name price images brand')
      .populate('paymentId', 'status method amount')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error getting customer shop orders:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createShopProductOrder,
  getShopManagerOrders,
  updateShopOrderStatus,
  getShopOrderAnalytics,
  getShopOrderDetails,
  getCustomerShopOrders
};
