# 🚚 Order Tracking System - Comprehensive Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Backend API Architecture](#backend-api-architecture)
4. [Order Lifecycle](#order-lifecycle)
5. [Real-Time Tracking](#real-time-tracking)
6. [Location Services](#location-services)
7. [Frontend Stores](#frontend-stores)
8. [API Endpoints](#api-endpoints)
9. [Data Flow](#data-flow)
10. [Integration for Desktop App](#integration-for-desktop-app)

---

## 🎯 System Overview

The Order Tracking System provides **real-time order management** and **location-based tracking** for an e-commerce platform supporting multiple user roles:

- **👥 Customers**: Place orders, track deliveries, view order history
- **🛒 Sellers**: Manage orders, update status, track sales performance
- **🏪 Shop Managers**: Oversee multiple orders, manage inventory, analytics
- **🎫 Club Owners**: Handle event tickets and bookings

### Key Features:
- ✅ Real-time order status updates
- 📍 GPS-based location tracking
- 📊 Comprehensive analytics and reporting
- 🔄 Multi-platform support (Mobile + Desktop)
- 💳 Payment integration
- 📱 Push notifications

---

## 🗄️ Database Schema

### Order Model (`Order.js`)
```javascript
{
  customerId: ObjectId,           // Reference to User (customer)
  sellerId: ObjectId,             // Reference to User (seller)
  orderType: 'product' | 'ticket', // Type of order
  
  // Product Orders
  products: [{
    productId: ObjectId,          // Reference to Product
    shopProductId: ObjectId,      // Reference to ShopProduct  
    quantity: Number,
    price: Number
  }],
  
  // Ticket Orders
  tickets: [{
    ticketId: ObjectId,           // Reference to Ticket
    eventId: ObjectId,            // Reference to Event
    quantity: Number,
    price: Number
  }],
  
  totalAmount: Number,            // Total order value
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled',
  
  // Shipping Information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: [Number],        // [longitude, latitude]
    fullAddress: String
  },
  
  // Enhanced Tracking Data
  trackingData: {
    customerCoordinates: [Number], // [longitude, latitude]
    customerAddress: String,
    locationAccuracy: 'high' | 'medium' | 'low',
    locationSource: 'gps' | 'manual' | 'profile',
    gpsEnabled: Boolean,
    locationPermission: Boolean,
    timestamp: Date
  },
  
  // Real-Time Delivery Tracking
  deliveryTracking: {
    startTime: Date,              // When delivery started
    estimatedMinutes: Number,     // Estimated delivery time
    actualDeliveryTime: Date,     // When actually delivered
    lastUpdated: Date,            // Last tracking update
    isActive: Boolean             // Whether tracking is active
  },
  
  trackingNumber: String,         // Unique tracking identifier
  estimatedDelivery: Date,        // Estimated delivery date
  notes: String,                  // Additional notes
  paymentId: ObjectId,            // Reference to Payment
  
  createdAt: Date,
  updatedAt: Date
}
```

### Related Models:

#### User Model (`User.js`)
```javascript
{
  name: String,
  email: String,
  phone: String,
  role: 'customer' | 'seller' | 'seeker' | 'shop_owner' | 'club_owner',
  location: {
    city: String,
    country: String,
    coordinates: [Number]         // [longitude, latitude]
  },
  // Business fields for sellers
  businessName: String,
  businessDescription: String,
  // ... additional fields
}
```

#### Product Model (`Product.js`)
```javascript
{
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  images: [String],
  sellerId: ObjectId,
  ratings: [{
    customerId: ObjectId,
    stars: Number,
    review: String,
    createdAt: Date
  }],
  status: 'active' | 'inactive' | 'out_of_stock',
  // Virtual fields
  averageRating: Number,
  reviewCount: Number
}
```

---

## 🏗️ Backend API Architecture

### Controller Structure (`/src/controllers/order.controller.js`)

#### Core Functions:

1. **Order Creation**
   ```javascript
   createOrder(req, res)
   // - Validates order data
   // - Creates order record
   // - Updates product inventory
   // - Initiates payment process
   ```

2. **Order Retrieval**
   ```javascript
   getSellerOrders(req, res)      // Get orders for seller
   getCurrentUserOrders(req, res)  // Get orders for customer
   getOrderById(req, res)         // Get specific order
   ```

3. **Status Management**
   ```javascript
   updateOrderStatus(req, res)
   // - Updates order status
   // - Triggers notifications
   // - Updates delivery tracking
   // - Logs status changes
   ```

4. **Analytics & Statistics**
   ```javascript
   getSellerStats(req, res)
   // - Calculates total sales
   // - Counts orders by status
   // - Computes average order value
   // - Generates completion rates
   ```

5. **Real-Time Tracking**
   ```javascript
   updateDeliveryTracking(req, res)
   // - Updates delivery progress
   // - Calculates estimated time
   // - Manages tracking state
   ```

### Enhanced Statistics Calculation
```javascript
// Advanced aggregation pipeline for seller statistics
const statsAggregation = await Order.aggregate([
  { $match: { sellerId: sellerObjectId } },
  {
    $facet: {
      totalSales: [
        { $match: { status: { $in: ['delivered', 'paid', 'shipped'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ],
      orderCounts: [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ],
      recentOrders: [
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ],
      averageOrderValue: [
        { $match: { status: { $in: ['delivered', 'paid', 'shipped'] } } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]
    }
  }
]);
```

---

## 🔄 Order Lifecycle

### 1. Order Creation Flow
```
Customer Places Order → Validate Data → Create Order Record → 
Update Inventory → Process Payment → Send Notifications → 
Generate Tracking Number
```

### 2. Status Progression
```
pending → paid → shipped → delivered
    ↓       ↓       ↓        ↓
 [Cancel] [Cancel] [Track] [Complete]
```

### 3. Status Definitions
- **`pending`**: Order placed, awaiting payment
- **`paid`**: Payment confirmed, preparing for shipment
- **`shipped`**: Order dispatched, in transit
- **`delivered`**: Order successfully delivered
- **`cancelled`**: Order cancelled by customer or seller

---

## 📍 Real-Time Tracking

### Location Data Collection
```javascript
// Customer location tracking
trackingData: {
  customerCoordinates: [longitude, latitude],
  customerAddress: "White River, South Africa",
  locationAccuracy: "high",        // GPS accuracy level
  locationSource: "gps",           // How location was obtained
  gpsEnabled: true,                // GPS availability
  locationPermission: true,        // Location permission granted
  timestamp: Date                  // When location was captured
}
```

### Delivery Tracking System
```javascript
// Real-time delivery progress
deliveryTracking: {
  startTime: "2025-08-31T20:42:03.719Z",     // Delivery start
  estimatedMinutes: 102,                      // ETA in minutes
  actualDeliveryTime: null,                   // Actual delivery time
  lastUpdated: "2025-08-31T20:54:29.545Z",  // Last update
  isActive: true                              // Tracking active status
}
```

### Tracking Calculation Logic
```javascript
// Calculate estimated delivery time
const calculateDeliveryTime = (distance, traffic, weatherConditions) => {
  const baseTime = distance * 2; // 2 minutes per km
  const trafficMultiplier = traffic === 'heavy' ? 1.5 : 1;
  const weatherMultiplier = weatherConditions === 'poor' ? 1.3 : 1;
  
  return Math.round(baseTime * trafficMultiplier * weatherMultiplier);
};
```

---

## 🌐 Location Services

### GPS Integration
- **High Accuracy**: Uses device GPS for precise location
- **Fallback Options**: Network-based location when GPS unavailable
- **Permission Handling**: Graceful degradation without location access
- **Privacy Compliance**: Location data encrypted and anonymized

### Address Resolution
```javascript
// Address formatting and validation
const formatAddress = (coordinates, city, country) => {
  return {
    fullAddress: `${coordinates[1]}, ${coordinates[0]} - ${city}, ${country}`,
    city: city,
    country: country,
    coordinates: coordinates,
    accuracy: 'high'
  };
};
```

---

## 🗂️ Frontend Stores (Zustand)

### Order Store (`orderStore.ts`)
```javascript
interface OrderStore {
  // State
  orders: Order[];
  productsWithRatings: ProductWithRatings[];
  sellerStats: SellerStats | null;
  newOrderCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: (status?: string) => Promise<void>;
  fetchProductsWithRatings: () => Promise<void>;
  fetchSellerStats: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  clearNewOrderCount: () => void;
  incrementNewOrderCount: () => void;
}
```

### Customer Order Store (`customerOrderStore.ts`)
```javascript
interface CustomerOrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  fetchCustomerOrders: () => Promise<void>;
  trackOrder: (orderId: string) => Promise<TrackingInfo>;
  cancelOrder: (orderId: string) => Promise<void>;
  rateOrder: (orderId: string, rating: number, review?: string) => Promise<void>;
}
```

### Data Persistence
- **AsyncStorage**: Stores order data locally for offline access
- **Selective Persistence**: Only essential data persisted to optimize performance
- **Auto-Sync**: Synchronizes with server when connection restored

---

## 🔗 API Endpoints

### Order Management
```
GET    /api/orders/customer          # Get customer orders
GET    /api/orders/seller            # Get seller orders  
GET    /api/orders/seller/stats      # Get seller statistics
GET    /api/orders/:orderId          # Get specific order
POST   /api/orders                   # Create new order
PUT    /api/orders/:orderId/status   # Update order status
PATCH  /api/orders/:orderId/tracking # Update delivery tracking
DELETE /api/orders/:orderId          # Delete order
```

### Product Management
```
GET    /api/products/seller/products # Get seller products
POST   /api/products/:id/rating      # Add product rating
GET    /api/products/:id             # Get product details
```

### User Management
```
GET    /api/users/current            # Get current user
PUT    /api/users/profile            # Update user profile
POST   /api/auth/login               # User authentication
```

### Analytics
```
GET    /api/orders/seller/stats      # Seller performance metrics
GET    /api/shop/analytics           # Shop analytics
GET    /api/products/analytics       # Product performance
```

---

## 📊 Data Flow

### Order Creation Flow
```
Mobile App → API Request → Validation → Database → 
Payment Processing → Inventory Update → Notifications → 
Response to App
```

### Real-Time Updates
```
Status Change → Database Update → WebSocket Notification → 
Mobile App Update → UI Refresh
```

### Analytics Pipeline
```
Raw Order Data → Aggregation Pipeline → Statistics Calculation → 
Caching → API Response → Dashboard Display
```

---

## 🖥️ Integration for Desktop App (Shop Managers)

### Desktop App Requirements

#### 1. **Order Management Dashboard**
```javascript
// Desktop-specific features needed
const desktopFeatures = {
  bulkOrderProcessing: true,
  advancedFiltering: true,
  exportCapabilities: true,
  printingSupport: true,
  multiStoreManagement: true,
  staffPermissions: true
};
```

#### 2. **Enhanced Analytics**
- **Multi-store Overview**: Aggregate data across multiple shops
- **Advanced Reporting**: Custom date ranges, detailed breakdowns
- **Export Functions**: CSV, PDF, Excel export capabilities
- **Real-time Dashboards**: Live updating charts and metrics

#### 3. **Batch Operations**
```javascript
// Bulk operations for shop managers
const bulkOperations = {
  updateMultipleOrders: async (orderIds, newStatus) => {
    return Promise.all(
      orderIds.map(id => updateOrderStatus(id, newStatus))
    );
  },
  
  generateBulkLabels: async (orderIds) => {
    return generateShippingLabels(orderIds);
  },
  
  exportOrderData: async (filters, format) => {
    return exportToFormat(getFilteredOrders(filters), format);
  }
};
```

### Desktop-Specific API Endpoints
```
GET    /api/desktop/orders/overview    # Multi-store order overview
POST   /api/desktop/orders/bulk-update # Bulk status updates
GET    /api/desktop/analytics/advanced # Advanced analytics
POST   /api/desktop/reports/generate   # Generate custom reports
GET    /api/desktop/stores/all         # All managed stores
```

### Data Synchronization
- **Real-time Sync**: WebSocket connections for live updates
- **Offline Capability**: Local database with sync when online
- **Conflict Resolution**: Handle concurrent updates from multiple sources

### Authentication & Permissions
```javascript
// Role-based access for desktop app
const desktopPermissions = {
  'shop_manager': {
    canViewAllOrders: true,
    canUpdateOrderStatus: true,
    canAccessAnalytics: true,
    canManageInventory: true,
    canExportData: true
  },
  'shop_owner': {
    // Full permissions
    canManageStaff: true,
    canAccessFinancials: true,
    canModifySettings: true
  }
};
```

---

## 🔧 Technical Implementation Notes

### Database Optimization
- **Indexing**: Proper indexes on frequently queried fields
- **Aggregation**: Optimized pipelines for statistics
- **Caching**: Redis caching for frequently accessed data

### Security Considerations
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Data Encryption**: Sensitive data encrypted at rest
- **API Rate Limiting**: Prevent abuse and ensure performance

### Performance Optimization
- **Pagination**: Large datasets paginated for performance
- **Lazy Loading**: Load data on-demand
- **Caching Strategy**: Multi-level caching implementation
- **Database Connection Pooling**: Efficient connection management

### Error Handling
- **Graceful Degradation**: System continues functioning with limited features
- **Comprehensive Logging**: Detailed logs for debugging
- **User-Friendly Messages**: Clear error messages for users
- **Retry Mechanisms**: Automatic retry for transient failures

---

## 📱 Mobile App Integration

### React Native Components
- **Order Tracking Modal**: Real-time tracking display
- **Status Updates**: Push notifications for status changes
- **Location Services**: GPS integration for accurate tracking
- **Offline Support**: Local storage with sync capabilities

### State Management
- **Zustand Stores**: Centralized state management
- **Persistence**: AsyncStorage for offline data
- **Real-time Updates**: WebSocket integration

---

## 🚀 Future Enhancements

### Planned Features
1. **AI-Powered Predictions**: Delivery time estimation using ML
2. **Route Optimization**: Optimal delivery routes for drivers
3. **Customer Communication**: In-app messaging system
4. **Advanced Analytics**: Predictive analytics and insights
5. **Multi-language Support**: Internationalization
6. **Voice Commands**: Voice-controlled order management

### Scalability Considerations
- **Microservices Architecture**: Break into smaller services
- **Database Sharding**: Distribute data across multiple databases
- **CDN Integration**: Global content delivery
- **Auto-scaling**: Dynamic resource allocation

---

## 📞 Support & Maintenance

### Monitoring
- **Application Performance Monitoring (APM)**
- **Error Tracking and Alerting**
- **Real-time System Health Checks**
- **User Analytics and Behavior Tracking**

### Documentation Updates
This documentation should be updated whenever:
- New features are added
- API endpoints are modified
- Database schema changes
- Business logic updates

---

*Last Updated: January 2025*
*Version: 2.0*
*Maintained by: Development Team*
