const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Import models
const Order = require("./models/Order");
const Payment = require("./models/Payment");
const Product = require("./models/Product");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const serviceRoutes = require("./routes/service.routes");
const orderRoutes = require("./routes/order.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const cardRoutes = require("./routes/card.routes");
const preferencesRoutes = require("./routes/preferences.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const messageRoutes = require("./routes/message.routes");
const seekerMessageRoutes = require("./routes/seeker.message.routes");
const seekerPreferencesRoutes = require("./routes/seeker.preferences.routes");

// New routes for shops and events
const shopRoutes = require("./routes/shop.routes");
const eventRoutes = require("./routes/event.routes");
const ticketRoutes = require("./routes/ticket.routes");
const shopProductRoutes = require("./routes/shopProduct.routes");
const shopOrderRoutes = require("./routes/shopOrder.routes");

// Notification routes (NEW - SAFE ADDITION)
const notificationRoutes = require("./routes/notification.routes");
const testNotificationRoutes = require("./routes/test-notification.routes");

// Import AURA Payment System - TEMPORARILY DISABLED
// const { integratePaymentSystem } = require("./payment-system/integration");

// Import auth middleware
const { authMiddleware } = require("./middlewares/auth.middleware");

// Import Firebase initialization
const { initializeFirebase } = require("./services/pushNotification.service");

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for production
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Serve static files (profile pictures)
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/messages/seeker", seekerMessageRoutes);
app.use("/api/preferences/seeker", seekerPreferencesRoutes);

// New routes for shops and events
app.use("/api/shops", shopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/shop-products", shopProductRoutes);
app.use("/api/shop-orders", shopOrderRoutes);

// Notification routes (NEW - SAFE ADDITION)
app.use("/api/notifications", notificationRoutes);
app.use("/api/test-notifications", testNotificationRoutes);

// Integrate AURA Payment System - TEMPORARILY DISABLED
// integratePaymentSystem(app);

// Simple Paystack routes for demo
console.log('🔧 Registering Paystack routes...');

// Test route to verify server is working
app.get('/api/paystack/test', (req, res) => {
  res.json({ message: 'Paystack routes are working!', timestamp: new Date().toISOString() });
});

// Demo payment page route
app.get('/demo-payment', (req, res) => {
  const { amount, reference } = req.query;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paystack Demo Payment</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .payment-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            
            .title {
                font-size: 24px;
                font-weight: 600;
                color: #333;
                margin-bottom: 10px;
            }
            
            .subtitle {
                color: #666;
                font-size: 16px;
            }
            
            .amount {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .amount-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .amount-value {
                font-size: 32px;
                font-weight: 700;
                color: #667eea;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #333;
                margin-bottom: 8px;
            }
            
            .form-input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e1e5e9;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .card-row {
                display: flex;
                gap: 10px;
            }
            
            .card-row .form-group {
                flex: 1;
            }
            
            .pay-button {
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 18px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .pay-button:hover {
                transform: translateY(-2px);
            }
            
            .demo-notice {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .demo-notice h4 {
                color: #856404;
                margin-bottom: 5px;
            }
            
            .demo-notice p {
                color: #856404;
                font-size: 14px;
            }
            
            .success-page {
                text-align: center;
                display: none;
            }
            
            .success-icon {
                width: 80px;
                height: 80px;
                background: #4CAF50;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 40px;
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <div id="payment-form">
                <div class="header">
                    <div class="logo">PS</div>
                    <h1 class="title">Paystack Payment</h1>
                    <p class="subtitle">Secure payment processing</p>
                </div>
                
                <div class="demo-notice">
                    <h4>Demo Mode</h4>
                    <p>This is a demonstration payment page. Use the test card details below.</p>
                </div>
                
                <div class="amount">
                    <div class="amount-label">Amount to Pay</div>
                    <div class="amount-value">R${amount || '0.00'}</div>
                </div>
                
                <form id="card-form">
                    <div class="form-group">
                        <label class="form-label">Card Number</label>
                        <input type="text" class="form-input" id="card-number" placeholder="4084 0840 8408 4081" value="4084 0840 8408 4081" readonly>
                    </div>
                    
                    <div class="card-row">
                        <div class="form-group">
                            <label class="form-label">Expiry Date</label>
                            <input type="text" class="form-input" id="expiry" placeholder="12/25" value="12/25" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">CVC</label>
                            <input type="text" class="form-input" id="cvc" placeholder="123" value="123" readonly>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Cardholder Name</label>
                        <input type="text" class="form-input" id="name" placeholder="John Doe" value="Demo User" readonly>
                    </div>
                    
                    <button type="submit" class="pay-button" id="pay-btn">
                        Pay R${amount || '0.00'}
                    </button>
                </form>
            </div>
            
            <div id="success-page" class="success-page">
                <div class="success-icon">✓</div>
                <h1 class="title">Payment Successful!</h1>
                <p class="subtitle">Your payment has been processed successfully.</p>
                <div class="amount">
                    <div class="amount-label">Amount Paid</div>
                    <div class="amount-value">R${amount || '0.00'}</div>
                </div>
                <p style="color: #666; margin-top: 20px;">You will be redirected back to the app shortly...</p>
            </div>
        </div>
        
        <script>
            document.getElementById('card-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show loading state
                const payBtn = document.getElementById('pay-btn');
                payBtn.textContent = 'Processing...';
                payBtn.disabled = true;
                
                // Simulate payment processing
                setTimeout(() => {
                    // Hide payment form and show success
                    document.getElementById('payment-form').style.display = 'none';
                    document.getElementById('success-page').style.display = 'block';
                    
                    // Redirect back to app with success
                    setTimeout(() => {
                        window.location.href = 'aura://payment-success?reference=${reference}&amount=${amount}';
                    }, 2000);
                }, 2000);
            });
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.post('/api/paystack/create-order', authMiddleware, async (req, res) => {
  try {
    console.log('=== PAYSTACK CREATE ORDER ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { products, shippingAddress, customerEmail } = req.body;

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
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      amount: totalAmount,
      method: 'paystack',
      status: 'pending',
      description: 'Paystack order payment',
      transactionId: `PAYSTACK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await payment.save();

    // Group products by seller
    const productsBySeller = {};
    
    for (const item of orderProducts) {
      const product = await Product.findById(item.productId);
      const sellerId = product.sellerId.toString();
      
      if (!productsBySeller[sellerId]) {
        productsBySeller[sellerId] = [];
      }
      
      productsBySeller[sellerId].push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    }

    // Create orders for each seller
    const createdOrders = [];
    
    for (const [sellerId, sellerProducts] of Object.entries(productsBySeller)) {
      const sellerTotal = sellerProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const order = new Order({
        customerId: req.user.id,
        sellerId: sellerId,
        orderType: 'product', // Add the required orderType field
        products: sellerProducts,
        totalAmount: sellerTotal,
        paymentId: payment._id,
        shippingAddress,
        status: 'pending'
      });

      await order.save();
      
      // Populate order with product details
      const populatedOrder = await Order.findById(order._id)
        .populate('products.productId', 'name price images')
        .populate('sellerId', 'name')
        .populate('customerId', 'name email');

      createdOrders.push(populatedOrder);
    }

    // For demo purposes, return a simple working URL
    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: 'https://httpbin.org/html',
        access_code: 'demo_access_code',
        reference: `AURA_ORDER_${Date.now()}`,
        orderId: createdOrders[0]._id // Return the first order ID
      }
    });

  } catch (error) {
    console.error('Error creating order with payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order with payment' 
    });
  }
});

app.post('/api/paystack/verify', authMiddleware, async (req, res) => {
  try {
    console.log('=== PAYSTACK VERIFY ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment reference is required' 
      });
    }

    // Find the payment record by reference
    const payment = await Payment.findOne({ 
      transactionId: { $regex: reference, $options: 'i' } 
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Update payment status to completed
    payment.status = 'completed';
    await payment.save();

    // Find and update all orders associated with this payment
    const orders = await Order.find({ paymentId: payment._id });
    
    for (const order of orders) {
      order.status = 'paid';
      await order.save();
    }

    // For demo purposes, return a mock successful verification
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        status: 'success',
        reference: reference,
        amount: payment.amount * 100, // Convert to kobo for Paystack
        paid_at: new Date().toISOString(),
        metadata: {
          orderId: orders[0]?._id || 'demo_order_id'
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
});

// Default Route
app.get("/", (req, res) => {
  res.json({
    message: "Aura E-commerce & Service Marketplace API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      services: "/api/services",
      orders: "/api/orders",
      bookings: "/api/bookings",
      payments: "/api/payments",
      cards: "/api/cards",
      preferences: "/api/preferences",
      favorites: "/api/favorites",
      messages: "/api/messages",
      shops: "/api/shops",
      events: "/api/events",
      tickets: "/api/tickets",
      shopProducts: "/api/shop-products"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database Connection
connectDB();

// Initialize Firebase Admin SDK
console.log('🔧 Initializing Firebase Admin SDK...');
initializeFirebase();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API Documentation: http://localhost:${PORT}`);
  console.log(`💳 Paystack routes available:`);
  console.log(`   - POST /api/paystack/create-order`);
  console.log(`   - POST /api/paystack/verify`);
});
