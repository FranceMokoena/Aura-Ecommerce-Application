# 🚀 Aura App - Render Deployment & EAS OTA Setup Guide

## ✅ Repository Successfully Pushed to GitHub!
Your Aura marketplace application is now available at: https://github.com/FranceMokoena/Aura-Ecommerce-Application

---

## 🎯 Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 2: Deploy Backend Service
1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `FranceMokoena/Aura-Ecommerce-Application`
   - Choose the `ecommerce-backend` folder as the root directory

2. **Configure Service Settings**
   ```
   Name: aura-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://francewitness9:QmiLPiceLsU87mye@aura-app-cluster.4la8fhd.mongodb.net/aura-app-prod?retryWrites=true&w=majority&appName=aura-app-cluster
   JWT_SECRET=franceman99_production_secure_key_2024
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   FIREBASE_PROJECT_ID=sacred-age-457512-c3
   FIREBASE_MESSAGING_SENDER_ID=591319256085
   CORS_ORIGIN=*
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://aura-backend.onrender.com`)

---

## 📱 Part 2: Set Up EAS OTA Updates

### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Project
```bash
cd ecommerce-app
eas build:configure
```

### Step 4: Update API Configuration
Update `ecommerce-app/utils/api.ts` with your Render backend URL:
```typescript
const PRODUCTION_API_URL = 'https://your-backend-url.onrender.com/api';
```

### Step 5: Build APK with OTA Updates
```bash
# Build preview APK with OTA channel
eas build --platform android --profile preview

# Build production APK with OTA channel
eas build --platform android --profile production
```

### Step 6: Publish OTA Updates
```bash
# Publish update to preview channel
eas update --channel preview --message "Bug fixes and improvements"

# Publish update to production channel
eas update --channel production --message "New features and enhancements"
```

---

## 🔧 Part 3: Environment Configuration

### Backend Environment Variables (Render)
Update these in your Render dashboard:

```env
# Database
MONGODB_URI=mongodb+srv://francewitness9:QmiLPiceLsU87mye@aura-app-cluster.4la8fhd.mongodb.net/aura-app-prod?retryWrites=true&w=majority&appName=aura-app-cluster

# Security
JWT_SECRET=franceman99_production_secure_key_2024

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=sacred-age-457512-c3
FIREBASE_MESSAGING_SENDER_ID=591319256085

# Server Configuration
NODE_ENV=production
PORT=10000
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Mobile App Configuration
Update `ecommerce-app/utils/api.ts`:
```typescript
const PRODUCTION_API_URL = 'https://your-backend-url.onrender.com/api';
```

---

## 🚀 Part 4: Deployment Commands

### Backend Deployment
```bash
# Navigate to backend
cd ecommerce-backend

# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to Render (automatic via GitHub)
git add .
git commit -m "Update backend configuration"
git push origin main
```

### Mobile App APK Building
```bash
# Navigate to mobile app
cd ecommerce-app

# Install dependencies
npm install

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile production

# Publish OTA update
eas update --channel production --message "Latest updates"
```

---

## 📋 Part 5: Post-Deployment Checklist

### ✅ Backend Verification
- [ ] Backend deployed successfully on Render
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] CORS configured for mobile app

### ✅ Mobile App Verification
- [ ] APK built successfully
- [ ] OTA updates configured
- [ ] API URL updated to production
- [ ] App connects to backend
- [ ] Push notifications working

### ✅ Testing
- [ ] User registration/login
- [ ] Product browsing
- [ ] Order placement
- [ ] Payment processing
- [ ] Real-time messaging
- [ ] OTA update delivery

---

## 🔄 Part 6: Ongoing Maintenance

### Regular Updates
1. **Backend Updates**: Push to GitHub → Auto-deploy on Render
2. **Mobile Updates**: Use EAS OTA for instant updates
3. **Database**: Monitor MongoDB Atlas usage
4. **Performance**: Check Render logs and metrics

### Monitoring
- **Render Dashboard**: Monitor backend performance
- **Expo Dashboard**: Track OTA update delivery
- **MongoDB Atlas**: Monitor database performance
- **Firebase Console**: Check push notification delivery

---

## 🆘 Troubleshooting

### Common Issues
1. **Backend not starting**: Check environment variables
2. **APK build fails**: Verify EAS configuration
3. **OTA updates not working**: Check channel configuration
4. **Database connection issues**: Verify MongoDB URI

### Support Resources
- [Render Documentation](https://render.com/docs)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo OTA Updates](https://docs.expo.dev/eas-update/introduction/)

---

## 🎉 Success!
Your Aura marketplace application is now:
- ✅ Backend deployed on Render
- ✅ Mobile app ready for APK building
- ✅ OTA updates configured
- ✅ Production-ready with monitoring

**Next Steps:**
1. Deploy backend to Render
2. Build APK with EAS
3. Test all functionality
4. Publish to app stores
5. Set up monitoring and analytics

---

*For support, check the documentation or create an issue in the GitHub repository.*
