# Aura Marketplace Admin Dashboard

A comprehensive React/Next.js web dashboard for managing the Aura E-commerce & Service Marketplace platform.

## 🚀 Features

### Dashboard Overview
- 📊 **Real-time Analytics**: Revenue trends, user growth, and platform statistics
- 📈 **Interactive Charts**: Revenue trends, user growth, and payment method distribution
- 🎯 **Key Metrics**: Total users, products, services, orders, and revenue
- 📋 **Recent Activity**: Latest orders and top-performing products

### User Management
- 👥 **Multi-Role Support**: Manage customers, sellers, and seekers
- 🔍 **Advanced Search**: Search by name, email, or role
- ⚖️ **User Actions**: Suspend, activate, or delete users
- 📊 **User Statistics**: Growth metrics and role distribution

### Product Management
- 📦 **Product Oversight**: Review and manage all marketplace products
- ✅ **Approval System**: Approve or reject products with reasons
- 🔍 **Filtering**: Filter by status, category, and search terms
- 📊 **Product Analytics**: Ratings, sales, and performance metrics

### Service Management
- 🛠️ **Service Oversight**: Manage all marketplace services
- ✅ **Approval System**: Approve or reject services with reasons
- 🔍 **Advanced Filtering**: Filter by status, category, and availability
- 📊 **Service Analytics**: Ratings, bookings, and provider performance

### Order Management
- 🛒 **Order Tracking**: Monitor all marketplace orders
- 📦 **Status Management**: Update order status and tracking information
- 🔍 **Order Search**: Search by customer, seller, or tracking number
- 📊 **Order Analytics**: Revenue tracking and delivery performance

### Payment Management
- 💳 **Payment Tracking**: Monitor all transactions and payment methods
- 📊 **Revenue Analytics**: Detailed revenue trends and payment method distribution
- 🔄 **Refund Management**: Process refunds with reason tracking
- 📈 **Financial Reports**: Success rates and average transaction values

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Hooks + Zustand (optional)
- **Date Handling**: date-fns
- **Forms**: React Hook Form

## 📁 Project Structure

```
admin-dashboard/
├── pages/                    # Next.js pages
│   ├── index.tsx            # Dashboard overview
│   ├── users.tsx            # User management
│   ├── products.tsx         # Product management
│   ├── services.tsx         # Service management
│   ├── orders.tsx           # Order management
│   └── payments.tsx         # Payment management
├── services/                # API services
│   ├── api.ts              # Base API configuration
│   ├── auth.ts             # Authentication service
│   ├── users.ts            # User management API
│   ├── products.ts         # Product management API
│   ├── services.ts         # Service management API
│   ├── orders.ts           # Order management API
│   └── payments.ts         # Payment management API
├── utils/                   # Utility functions
│   └── format.ts           # Data formatting utilities
├── styles/                  # Global styles
│   └── globals.css         # Tailwind CSS imports
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend API running (ecommerce-backend)

### Installation

1. **Clone and navigate to the admin dashboard**
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   Open [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The admin dashboard connects to the backend API for authentication. Currently using mock data, but ready for integration with:

- JWT token-based authentication
- Role-based access control (admin only)
- Secure API communication

## 📊 Dashboard Features

### Main Dashboard
- **Overview Cards**: Key metrics at a glance
- **Revenue Chart**: Monthly revenue trends
- **User Growth**: User registration trends
- **Recent Orders**: Latest marketplace activity
- **Top Products**: Best-performing products

### User Management
- **User List**: All registered users with details
- **Role Filtering**: Filter by customer, seller, or seeker
- **User Actions**: Suspend, activate, or delete users
- **Search**: Find users by name or email

### Product Management
- **Product Grid**: Visual product cards with images
- **Status Management**: Active, inactive, out of stock
- **Approval System**: Approve or reject products
- **Category Filtering**: Filter by product categories

### Service Management
- **Service Cards**: Detailed service information
- **Availability Status**: Available/unavailable services
- **Skills Display**: Service provider skills
- **Rate Information**: Hourly, daily, or fixed rates

### Order Management
- **Order Table**: Complete order information
- **Status Tracking**: Pending, paid, shipped, delivered
- **Customer Details**: Shipping addresses and contact info
- **Product Information**: Ordered items and quantities

### Payment Management
- **Payment Analytics**: Revenue trends and success rates
- **Method Distribution**: Payment method breakdown
- **Transaction Details**: Complete payment information
- **Refund Processing**: Handle payment refunds

## 🔧 Configuration

### API Configuration
Update the API base URL in `services/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
```

### Styling
Customize the design system in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: { /* your primary colors */ },
      secondary: { /* your secondary colors */ }
    }
  }
}
```

## 📱 Responsive Design

The admin dashboard is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Secure API communication
- Input validation and sanitization
- Error handling and logging

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js
- **Netlify**: Easy deployment with Git integration
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

### Environment Variables for Production
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
NODE_ENV=production
```

## 🤝 Integration with Backend

The admin dashboard is designed to work seamlessly with the Aura marketplace backend:

- **Authentication**: Uses the same JWT system
- **API Endpoints**: Matches backend route structure
- **Data Models**: Consistent with backend schemas
- **Real-time Updates**: Ready for WebSocket integration

## 📈 Analytics and Reporting

- **Revenue Analytics**: Track platform revenue and growth
- **User Analytics**: Monitor user registration and activity
- **Product Performance**: Track product sales and ratings
- **Service Analytics**: Monitor service bookings and provider performance
- **Payment Analytics**: Track transaction success rates and methods

## 🔄 Future Enhancements

- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: More detailed reporting and insights
- **Bulk Operations**: Mass user/product management
- **Export Features**: CSV/PDF export for reports
- **Audit Logs**: Track all admin actions
- **Multi-language Support**: Internationalization
- **Dark Mode**: Theme switching capability

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the backend integration guide
- Contact the development team

---

**Built with ❤️ for Aura Marketplace**
