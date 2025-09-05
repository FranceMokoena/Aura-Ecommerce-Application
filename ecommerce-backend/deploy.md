# Aura Backend Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Cloudinary account (for image storage)
- Railway/Heroku/Vercel account (for hosting)

## Deployment Options

### Option 1: Railway (Recommended)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize project: `railway init`
4. Set environment variables in Railway dashboard
5. Deploy: `railway up`

### Option 2: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create aura-backend`
4. Set environment variables: `heroku config:set NODE_ENV=production`
5. Deploy: `git push heroku main`

### Option 3: Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

## Environment Variables to Set

### Required Variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura-app-prod
JWT_SECRET=your_secure_jwt_secret_here
PORT=5000
```

### Optional Variables:
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HELMET_ENABLED=true
TRUST_PROXY=true
```

## Post-Deployment Steps

1. Update the mobile app's `PRODUCTION_API_URL` in `utils/api.ts`
2. Test all API endpoints
3. Verify database connections
4. Test file uploads (if using Cloudinary)
5. Monitor logs for any errors

## Health Check

After deployment, test the health endpoint:
```
GET https://your-backend-domain.com/
```

Expected response:
```json
{
  "message": "Aura E-commerce & Service Marketplace API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "products": "/api/products",
    "services": "/api/services",
    "orders": "/api/orders",
    "bookings": "/api/bookings",
    "payments": "/api/payments"
  }
}
```
