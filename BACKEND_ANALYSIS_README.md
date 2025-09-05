# 🚀 AURA MARKETPLACE - BACKEND ANALYSIS

## 📋 Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Location Management](#location-management)
- [User Roles & Permissions](#user-roles--permissions)
- [Data Relationships](#data-relationships)
- [Security & Authentication](#security--authentication)
- [Technical Architecture](#technical-architecture)

---

## 🎯 Overview

Aura is a comprehensive e-commerce and service marketplace platform that supports multiple user types: **Customers**, **Sellers**, **Service Providers (Seekers)**, **Shop Owners**, and **Club Owners**. The backend is built with Node.js, Express, and MongoDB, featuring robust location management and role-based access control.

---

## 🗄️ Database Schema

### **User Model** (`User.js`)
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String,
  password: String (required, hashed),
  role: String (enum: ["customer", "seller", "seeker", "shop_owner", "club_owner"]),
  profilePicture: String,
  location: {
    city: String,
    country: String,
    coordinates: [Number] // [lat, long]
  },
  // Business fields
  businessName: String,
  businessType: String,
  businessDescription: String,
  businessCategory: String,
  hourlyRate: Number,
  experience: String,
  onboardingCompleted: Boolean (default: false)
}
```

### **Shop Model** (`Shop.js`) - **Most Advanced Location System**
```javascript
{
  ownerId: ObjectId (ref: 'User', required, unique),
  name: String (required),
  description: String (required),
  location: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: [Number], // [longitude, latitude] - GeoJSON format
    address: String (required),
    city: String (required),
    country: String (required)
  },
  images: [String],
  contactInfo: {
    email: String (required),
    phone: String (required),
    website: String
  },
  businessHours: {
    monday: { open: String, close: String },
    // ... all days of week
  },
  deliveryOptions: String (enum: ['delivery', 'pickup', 'both']),
  deliveryFee: Number (default: 0),
  deliveryRadius: Number (default: 10), // in kilometers
  category: String (enum: ['electronics', 'clothing', 'food', ...]),
  status: String (enum: ['active', 'inactive', 'suspended']),
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  featured: Boolean (default: false),
  verificationStatus: String (enum: ['pending', 'verified', 'rejected'])
}
```

### **Product Model** (`Product.js`)
```javascript
{
  sellerId: ObjectId (ref: 'User', required),
  name: String (required),
  description: String (required),
  price: Number (required),
  quantity: Number (required, default: 0),
  category: String (required),
  images: [String],
  location: String, // Simple string location
  ratings: [{
    customerId: ObjectId (ref: 'User'),
    stars: Number (1-5),
    review: String,
    createdAt: Date
  }],
  status: String (enum: ['active', 'inactive', 'out_of_stock']),
  deliveryOptions: String (enum: ['delivery', 'pickup', 'both']),
  deliveryFee: Number (default: 0),
  stockStatus: String (enum: ['in_stock', 'sold_out', 'out_of_stock'])
}
```

### **Service Model** (`Service.js`)
```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum: ['cleaning', 'plumbing', 'electrical', ...]),
  rate: Number (required),
  rateType: String (enum: ['hourly', 'daily', 'fixed']),
  location: String (required), // Service location
  skills: String (required),
  availability: Boolean (default: true),
  images: [String],
  provider: ObjectId (ref: 'User', required),
  ratings: [{
    customerId: ObjectId (ref: 'User'),
    stars: Number (1-5),
    review: String,
    createdAt: Date
  }]
}
```

### **Order Model** (`Order.js`)
```javascript
{
  customerId: ObjectId (ref: 'User', required),
  sellerId: ObjectId (ref: 'User', required),
  orderType: String (enum: ['product', 'ticket']),
  products: [{
    productId: ObjectId (ref: 'Product'),
    shopProductId: ObjectId (ref: 'ShopProduct'),
    quantity: Number (required),
    price: Number (required)
  }],
  totalAmount: Number (required),
  status: String (enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  paymentId: ObjectId (ref: 'Payment'),
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  notes: String
}
```

### **Booking Model** (`Booking.js`)
```javascript
{
  customerId: ObjectId (ref: 'User', required),
  seekerId: ObjectId (ref: 'User', required),
  serviceId: ObjectId (ref: 'Service', required),
  date: Date (required),
  startTime: String (required),
  endTime: String (required),
  duration: Number (required), // in hours
  status: String (enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  totalAmount: Number (required),
  paymentId: ObjectId (ref: 'Payment'),
  location: String (required), // Booking location
  notes: String,
  cancellationReason: String
}
```

---

## 🔌 API Endpoints

### **Authentication**
```
POST /api/auth/signup - User registration
POST /api/auth/login - User login
```

### **User Management**
```
GET /api/users/me - Get current user profile
PUT /api/users/me/profile - Update current user profile
GET /api/users/:userId - Get user by ID
PUT /api/users/:userId/profile - Update user by ID
```

### **Shop Management** (Shop Owners)
```
POST /api/shops - Create shop profile
GET /api/shops/me/shop - Get my shop profile
PUT /api/shops/me/shop - Update shop profile
GET /api/shops/me/analytics - Get shop analytics
DELETE /api/shops/me/shop - Delete shop (soft delete)
```

### **Product Management** (Sellers)
```
GET /api/products/seller/products - Get seller's products
POST /api/products - Create product
PUT /api/products/:id - Update product
DELETE /api/products/:id - Delete product
```

### **Service Management** (Service Providers/Seekers)
```
POST /api/services - Create service
PUT /api/services/:id - Update service
DELETE /api/services/:id - Delete service
PATCH /api/services/:id/toggle-availability - Toggle availability
GET /api/services/provider/:providerId - Get provider services
```

### **Customer Browsing & Interaction**
```
GET /api/products - Browse all products
GET /api/products/:id - View product details
POST /api/products/:id/rating - Rate product
GET /api/services - Browse all services
GET /api/services/:id - View service details
POST /api/services/:id/rating - Rate service
GET /api/shops - Browse all shops
GET /api/shops/:id - View shop details
POST /api/shops/:id/rating - Rate shop
```

### **Public Endpoints** (No Authentication Required)
```
GET /api/products - Browse products
GET /api/products/:id - View product
GET /api/services - Browse services
GET /api/services/:id - View service
GET /api/shops - Browse shops
GET /api/shops/:id - View shop
```

---

## 📍 Location Management

### **Location Storage Hierarchy**

1. **🏪 Shop Model** - Most Sophisticated
   - GeoJSON format with 2dsphere indexing
   - Full address, city, country, coordinates
   - Delivery radius and business hours
   - Geospatial queries supported

2. **👤 User Model** - Basic Location
   - City, country, coordinates array
   - Used for service provider locations

3. **📦 Product Model** - Simple String
   - Basic location as text
   - Can inherit from seller's profile location

4. **🔧 Service Model** - Required String
   - Service location as text
   - Required field for service providers

5. **📋 Order/Booking Models** - Address-Based
   - Complete shipping addresses
   - Booking location strings

### **Location-Based Features**

#### **✅ Implemented**
- **Geospatial Indexing**: Shop locations with MongoDB 2dsphere
- **Location Filtering**: Search by city/location across all models
- **Delivery Zones**: Configurable delivery radius per shop
- **Address Management**: Complete shipping address system
- **Coordinate Storage**: Latitude/longitude support

#### **🔍 Location Queries**
```javascript
// Shop location filtering
if (location) {
  query['location.city'] = { $regex: location, $options: 'i' };
}

// Product location filtering
if (location) query.location = { $regex: location, $options: 'i' };

// Service location filtering
if (location) {
  query.location = { $regex: location, $options: 'i' };
}
```

#### **⚠️ Potential Enhancements**
- Distance calculation for nearby searches
- Geocoding (address-to-coordinates conversion)
- Location validation and verification
- Real-time GPS tracking
- Location-based notifications

---

## 👥 User Roles & Permissions

### **Role Types**
1. **Customer** - Browse, purchase, rate, book services
2. **Seller** - Create/manage products, view orders
3. **Seeker** - Create/manage services, view bookings
4. **Shop Owner** - Create/manage shops, shop products
5. **Club Owner** - Event management (future feature)

### **Permission Matrix**

| Action | Customer | Seller | Seeker | Shop Owner |
|--------|----------|--------|--------|------------|
| Browse Products | ✅ | ✅ | ✅ | ✅ |
| Browse Services | ✅ | ✅ | ✅ | ✅ |
| Browse Shops | ✅ | ✅ | ✅ | ✅ |
| Create Products | ❌ | ✅ | ❌ | ❌ |
| Create Services | ❌ | ❌ | ✅ | ❌ |
| Create Shops | ❌ | ❌ | ❌ | ✅ |
| Rate Items | ✅ | ❌ | ❌ | ❌ |
| Manage Own Items | ❌ | ✅ | ✅ | ✅ |

---

## 🔗 Data Relationships

### **One-to-One Relationships**
- **User ↔ Shop**: Each shop has one owner, each user can have one shop

### **One-to-Many Relationships**
- **User → Products**: One seller can have many products
- **User → Services**: One service provider can have many services
- **User → Orders**: One customer can have many orders
- **User → Bookings**: One customer can have many bookings
- **Shop → ShopProducts**: One shop can have many products

### **Many-to-Many Relationships**
- **Products ↔ Users**: Products can be rated by many customers
- **Services ↔ Users**: Services can be rated by many customers
- **Shops ↔ Users**: Shops can be rated by many customers

### **Data Flow**
```
User Registration → Role Assignment
Shop Creation → User Role Updated to 'shop_owner'
Product Creation → Linked to Seller's User ID
Service Creation → Linked to Provider's User ID
Order Creation → Links Customer, Seller, and Products
Booking Creation → Links Customer, Seeker, and Service
```

---

## 🔐 Security & Authentication

### **Authentication System**
- **JWT-based**: JSON Web Tokens for session management
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiry**: 7-day token validity
- **Role-based Access**: Middleware protection on routes

### **Authorization Rules**
- **Shop Management**: Only shop owners can manage their shops
- **Product Management**: Only sellers can manage their products
- **Service Management**: Only service providers can manage their services
- **Rating System**: Only customers can rate items
- **Profile Access**: Users can only modify their own profiles

### **Security Features**
- **Input Validation**: Request body validation
- **File Upload Security**: Image type and size restrictions
- **CORS Configuration**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Protection against abuse

---

## 🏗️ Technical Architecture

### **Technology Stack**
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **File Storage**: Local file system (profile pictures)
- **Payment**: Paystack integration (demo mode)

### **Database Indexes**
```javascript
// Shop model indexes
shopSchema.index({ location: '2dsphere' }); // Geospatial queries
shopSchema.index({ category: 1, status: 1 }); // Category filtering
shopSchema.index({ featured: 1, status: 1 }); // Featured shops

// User model indexes
userSchema.index({ email: 1 }); // Unique email constraint
```

### **API Response Format**
```javascript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### **File Structure**
```
src/
├── config/
│   └── db.js              # Database connection
├── controllers/           # Business logic
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── shop.controller.js
│   ├── product.controller.js
│   └── service.controller.js
├── middlewares/
│   └── auth.middleware.js # Authentication middleware
├── models/               # Database schemas
│   ├── User.js
│   ├── Shop.js
│   ├── Product.js
│   ├── Service.js
│   ├── Order.js
│   └── Booking.js
├── routes/              # API route definitions
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── shop.routes.js
│   ├── product.routes.js
│   └── service.routes.js
└── server.js           # Main application file
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB database
- Environment variables configured

### **Environment Variables**
```env
MONGODB_URI=mongodb://localhost:27017/aura-marketplace
JWT_SECRET=your-secret-key
PORT=5000
```

### **Installation**
```bash
npm install
npm start
```

### **API Base URL**
```
http://localhost:5000/api
```

---

## 📊 Performance Considerations

### **Database Optimization**
- Geospatial indexing for location queries
- Compound indexes for common query patterns
- Virtual fields for calculated values (ratings)

### **API Optimization**
- Pagination for large datasets
- Population of related data
- Efficient query filtering

### **Security Best Practices**
- Input sanitization
- Rate limiting
- Secure file uploads
- JWT token management

---

## 🔮 Future Enhancements

### **Location Features**
- Real-time location tracking
- Geofencing for delivery zones
- Location-based notifications
- Distance-based pricing

### **Advanced Features**
- Real-time messaging system
- Advanced analytics dashboard
- Multi-language support
- Mobile push notifications
- Advanced search with filters

---

*This documentation provides a comprehensive overview of the Aura marketplace backend architecture, covering all aspects from database design to API endpoints and security considerations.*
