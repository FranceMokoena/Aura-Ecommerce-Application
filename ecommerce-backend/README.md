# Aura E-commerce & Service Marketplace Backend API

A comprehensive Node.js backend API for a multi-role e-commerce and service marketplace platform.

## 🚀 Features

### Multi-Role System
- **Customer**: Browse products/services, place orders, make bookings
- **Seller**: Manage products, handle orders, track sales
- **Seeker**: Offer services, manage bookings, schedule management
- **Admin**: Platform management and analytics

### Core Functionality
- 🔐 JWT Authentication & Authorization
- 📦 Product Management (CRUD operations)
- 🛠️ Service Management (CRUD operations)
- 🛒 Order Processing & Management
- 📅 Booking System & Scheduling
- 💳 Payment Processing & Tracking
- ⭐ Rating & Review System
- 🔍 Search & Filtering
- 📊 Analytics & Statistics

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Validation**: Built-in validation
- **CORS**: Cross-origin resource sharing enabled

## 📁 Project Structure

```
ecommerce-backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── product.controller.js # Product management
│   │   ├── service.controller.js # Service management
│   │   ├── order.controller.js   # Order processing
│   │   ├── booking.controller.js # Booking management
│   │   └── payment.controller.js # Payment processing
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Product.js           # Product schema
│   │   ├── Service.js           # Service schema
│   │   ├── Order.js             # Order schema
│   │   ├── Booking.js           # Booking schema
│   │   └── Payment.js           # Payment schema
│   ├── routes/
│   │   ├── auth.routes.js       # Authentication routes
│   │   ├── product.routes.js    # Product routes
│   │   ├── service.routes.js    # Service routes
│   │   ├── order.routes.js      # Order routes
│   │   ├── booking.routes.js    # Booking routes
│   │   └── payment.routes.js    # Payment routes
│   ├── middlewares/
│   │   └── auth.middleware.js   # Authentication middleware
│   ├── utils/
│   │   └── index.js             # Utility functions
│   └── server.js                # Main server file
├── package.json
├── .env
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/aura_marketplace
   JWT_SECRET=your_jwt_secret_here
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:5000
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Product Endpoints

#### Get All Products (Public)
```http
GET /products?category=electronics&search=laptop&minPrice=100&maxPrice=1000
```

#### Get Single Product (Public)
```http
GET /products/:id
```

#### Create Product (Seller Only)
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 13",
  "description": "Latest iPhone model",
  "price": 999.99,
  "quantity": 10,
  "category": "electronics",
  "images": ["url1", "url2"],
  "location": "New York"
}
```

#### Update Product (Seller Only)
```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 899.99,
  "quantity": 5
}
```

### Service Endpoints

#### Get All Services (Public)
```http
GET /services?category=plumbing&search=repair&minRate=50&maxRate=200
```

#### Create Service (Seeker Only)
```http
POST /services
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Plumbing Services",
  "description": "Professional plumbing repair and installation",
  "rate": 75,
  "rateType": "hourly",
  "category": "home_services",
  "skills": ["pipe_repair", "installation"],
  "location": "Los Angeles"
}
```

### Order Endpoints

#### Create Order (Customer Only)
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "productId": "product_id_here",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "card"
}
```

#### Get Customer Orders
```http
GET /orders/customer
Authorization: Bearer <token>
```

#### Get Seller Orders
```http
GET /orders/seller?status=pending
Authorization: Bearer <token>
```

### Booking Endpoints

#### Create Booking (Customer Only)
```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "service_id_here",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "duration": 2,
  "location": "Customer Address",
  "notes": "Please bring tools",
  "paymentMethod": "card"
}
```

#### Get Customer Bookings
```http
GET /bookings/customer
Authorization: Bearer <token>
```

#### Get Seeker Bookings
```http
GET /bookings/seeker?status=confirmed
Authorization: Bearer <token>
```

### Payment Endpoints

#### Process Order Payment
```http
POST /payments/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id_here",
  "paymentMethod": "card",
  "transactionId": "txn_123456"
}
```

#### Get Payment Statistics
```http
GET /payments/stats?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: String (enum: ["customer", "seller", "seeker"]),
  profilePicture: String,
  location: {
    city: String,
    country: String,
    coordinates: [Number]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Product Collection
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: User),
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  images: [String],
  location: String,
  ratings: [{
    customerId: ObjectId,
    stars: Number,
    review: String,
    createdAt: Date
  }],
  status: String (enum: ["active", "inactive", "out_of_stock"]),
  createdAt: Date,
  updatedAt: Date
}
```

### Service Collection
```javascript
{
  _id: ObjectId,
  seekerId: ObjectId (ref: User),
  title: String,
  description: String,
  rate: Number,
  rateType: String (enum: ["hourly", "daily", "fixed"]),
  availability: Boolean,
  location: String,
  category: String,
  skills: [String],
  ratings: [{
    customerId: ObjectId,
    stars: Number,
    review: String,
    createdAt: Date
  }],
  status: String (enum: ["active", "inactive"]),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Error handling middleware

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Environment Variables for Production
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura_marketplace
JWT_SECRET=your_very_secure_jwt_secret
NODE_ENV=production
```

### Deployment Platforms
- **Render**: Easy deployment with automatic scaling
- **Railway**: Simple deployment with database integration
- **AWS EC2**: Full control over server configuration
- **Heroku**: Traditional Node.js deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- Multi-role authentication system
- Product and service management
- Order and booking system
- Payment processing
- Rating and review system

---

**Built with ❤️ for Aura Marketplace**
