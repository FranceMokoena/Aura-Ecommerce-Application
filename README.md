# 🏆 Aura - Premium Marketplace Application

A comprehensive e-commerce and service marketplace application built with React Native (Expo) and Node.js, featuring multi-user roles, real-time messaging, payment processing, and over-the-air updates.

## 🌟 Features

### 🛍️ E-commerce Marketplace
- **Product Management**: Create, update, and manage product listings
- **Service Booking**: Book and manage service appointments
- **Order Tracking**: Real-time order status updates
- **Payment Processing**: Secure payments with Paystack integration
- **Rating & Reviews**: Customer feedback system

### 👥 Multi-User Roles
- **Customers**: Browse, purchase, and book services
- **Sellers**: Manage products and orders
- **Service Seekers**: Offer and manage services
- **Shop Owners**: Manage physical store operations
- **Club Owners**: Organize events and manage tickets

### 💬 Real-time Features
- **Messaging System**: Direct communication between users
- **Push Notifications**: Real-time updates and alerts
- **Live Order Tracking**: GPS-based delivery tracking
- **Real-time Analytics**: Live dashboard updates

### 📱 Mobile-First Design
- **Cross-platform**: iOS and Android support
- **Offline Support**: Works without internet connection
- **Over-the-Air Updates**: Instant app updates without app store
- **Responsive UI**: Optimized for all screen sizes

## 🏗️ Architecture

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Animations**: Lottie React Native
- **Payments**: React Native Paystack

### Backend (API Server)
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **File Storage**: Cloudinary
- **Push Notifications**: Firebase Admin SDK
- **Security**: Helmet, CORS, Rate Limiting

### Infrastructure
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Push Notifications**: Firebase
- **App Distribution**: EAS Build with OTA Updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Expo account
- Cloudinary account
- Firebase project

### Backend Setup
```bash
cd ecommerce-backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Mobile App Setup
```bash
cd ecommerce-app
npm install
npx expo start
```

## 📦 Deployment

### Backend Deployment (Render)
```bash
cd ecommerce-backend
npm run deploy:render
```

### Mobile App Build
```bash
cd ecommerce-app
eas build --platform android --profile production
```

### OTA Updates
```bash
cd ecommerce-app
eas update --branch production --message "Bug fixes and improvements"
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura-app
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

#### Mobile App
Update `utils/api.ts` with your backend URL:
```typescript
const PRODUCTION_API_URL = 'https://your-backend.onrender.com/api';
```

## 📱 App Structure

```
ecommerce-app/
├── app/                    # App screens and navigation
│   ├── (auth)/            # Authentication screens
│   ├── (customer-tabs)/   # Customer dashboard
│   ├── (seller)/          # Seller dashboard
│   └── (seeker)/          # Service seeker dashboard
├── components/            # Reusable components
├── utils/                 # API services and utilities
├── assets/               # Images, fonts, animations
└── constants/            # App constants and themes
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service

### Orders & Bookings
- `GET /api/orders/customer` - Get customer orders
- `GET /api/orders/seller` - Get seller orders
- `POST /api/orders` - Create order
- `POST /api/bookings` - Create booking

### Payments
- `POST /api/paystack/create-order` - Initialize payment
- `POST /api/paystack/verify` - Verify payment

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Request data validation
- **Helmet Security**: HTTP security headers

## 📊 Analytics & Monitoring

- **User Analytics**: Track user behavior and engagement
- **Order Analytics**: Monitor sales and performance
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: API response time tracking

## 🔄 OTA Updates

The app supports over-the-air updates for instant bug fixes and feature updates:

```bash
# Publish an update
eas update --branch production --message "Bug fixes"

# Publish to specific channel
eas update --channel production --message "New features"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🎯 Roadmap

- [ ] iOS app store submission
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Social media integration
- [ ] AI-powered recommendations

---

**Built with ❤️ by the Aura Development Team**
