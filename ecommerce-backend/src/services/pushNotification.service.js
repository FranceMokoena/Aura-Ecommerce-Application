const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const User = require('../models/User');

// Initialize Firebase Admin (you'll need to add your service account key)
let firebaseInitialized = false;

const initializeFirebase = () => {
  try {
    console.log('🔧 initializeFirebase called, firebaseInitialized:', firebaseInitialized);
    console.log('🔧 Environment variables:', {
      FIREBASE_SERVICE_ACCOUNT_KEY_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID
    });
    
    if (!firebaseInitialized) {
      // Check for service account key file path
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
        console.log('🔧 Loading service account from file:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
        
        // Resolve the path relative to the project root
        const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
        console.log('🔧 Resolved service account path:', serviceAccountPath);
        
        // Check if file exists
        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(`Service account file not found at: ${serviceAccountPath}`);
        }
        
        try {
          const serviceAccount = require(serviceAccountPath);
        
          console.log('🔧 Service account loaded:', {
            project_id: serviceAccount.project_id,
            client_email: serviceAccount.client_email
          });
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || 'sacred-age-457512-c3'
          });
          
          firebaseInitialized = true;
          console.log('✅ Firebase Admin initialized with service account key');
        } catch (error) {
          console.log('⚠️ Firebase service account file not found, trying environment variable');
          console.log('Error details:', error.message);
          
          if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
              const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID || 'sacred-age-457512-c3'
              });
              
              firebaseInitialized = true;
              console.log('✅ Firebase Admin initialized with environment key');
            } catch (envError) {
              console.log('❌ Firebase initialization failed with environment key:', envError.message);
              firebaseInitialized = false;
            }
          } else {
            console.log('❌ No Firebase credentials available');
            firebaseInitialized = false;
          }
        }
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Fallback: parse JSON from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'sacred-age-457512-c3'
        });
        
        console.log('✅ Firebase Admin initialized with environment key');
      } else {
        // Initialize with default credentials (for development)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sacred-age-457512-c3'
        });
        
        console.log('✅ Firebase Admin initialized with default credentials');
      }
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.log('🔧 Firebase Admin already initialized');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
};

// Send Expo push notification
const sendExpoPushNotification = async (token, notification) => {
  try {
    console.log('🔔 === EXPO PUSH NOTIFICATION DEBUG START ===');
    console.log('🔧 Token type: Expo');
    console.log('🔧 Token preview:', token.substring(0, 20) + '...');
    console.log('🔧 Notification:', {
      title: notification.title,
      message: notification.message,
      data: notification.data
    });

    const message = {
      to: token,
      title: notification.title,
      body: notification.message,
      data: notification.data,
      sound: 'default',
      badge: 1,
      priority: 'high',
      channelId: 'aura-notifications'
    };

    console.log('🔧 Expo message created:', JSON.stringify(message, null, 2));
    console.log('🔧 Sending via Expo Push API...');
    
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Expo push notification sent successfully:', response.data);
    console.log('🔔 === EXPO PUSH NOTIFICATION DEBUG END ===');
    return response.data;

  } catch (error) {
    console.error('❌ Expo push notification failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    console.log('🔔 === EXPO PUSH NOTIFICATION DEBUG END ===');
    throw error;
  }
};

// Send push notification to a single user (handles both FCM and Expo tokens)
const sendPushNotification = async (token, notification) => {
  try {
    console.log('🔔 === PUSH NOTIFICATION DEBUG START ===');
    console.log('🔔 sendPushNotification called with:', { 
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      notification: {
        title: notification.title,
        message: notification.message,
        data: notification.data
      }
    });

    // Check if this is an Expo token
    if (token && token.startsWith('ExponentPushToken[')) {
      console.log('🔧 Detected Expo token, using Expo Push API');
      return await sendExpoPushNotification(token, notification);
    }
    
    // Check if this is an FCM token (starts with specific patterns)
    if (token && (token.startsWith('c') || token.startsWith('d') || token.startsWith('e') || token.startsWith('f'))) {
      console.log('🔧 Detected FCM token, using Firebase Admin SDK');
    } else {
      console.log('🔧 Unknown token format, attempting FCM anyway');
    }
    
    if (!firebaseInitialized) {
      console.log('🔧 Firebase not initialized, initializing now...');
      initializeFirebase();
    }

    if (!token) {
      console.error('❌ No push token provided');
      throw new Error('Push token is required');
    }

    console.log('🔧 Creating FCM message...');
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        ...notification.data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        badge: '1'
      },
      token: token,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'aura-notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    console.log('🔧 FCM message created:', JSON.stringify(message, null, 2));
    console.log('🔧 Sending via Firebase Admin...');
    
    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent successfully:', response);
    console.log('🔔 === PUSH NOTIFICATION DEBUG END ===');
    return response;

  } catch (error) {
    console.error('❌ Push notification failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    console.log('🔔 === PUSH NOTIFICATION DEBUG END ===');
    throw error;
  }
};

// Send push notification to multiple users
const sendBulkPushNotifications = async (tokens, notification) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    if (!tokens || tokens.length === 0) {
      throw new Error('Push tokens are required');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        ...notification.data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        badge: '1'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'aura-notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send to multiple tokens individually using the main sendPushNotification function
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    console.log(`🔧 Sending to ${tokens.length} tokens individually...`);
    
    for (const token of tokens) {
      try {
        // Use the main sendPushNotification function which handles both FCM and Expo tokens
        await sendPushNotification(token, notification);
        successCount++;
        console.log(`✅ Sent to token: ${token.substring(0, 20)}...`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to send to token ${token.substring(0, 20)}...:`, error.message);
        errors.push({ token: token.substring(0, 20), error: error.message });
      }
    }

    console.log('✅ Bulk push notifications completed:', {
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined
    });

    return { successCount, failureCount, errors };

  } catch (error) {
    console.error('❌ Bulk push notifications failed:', error);
    throw error;
  }
};

// Send notification to all users
const sendNotificationToAllUsers = async (notification) => {
  try {
    // Get all users with push tokens
    const users = await User.find({ pushToken: { $exists: true, $ne: null } }, 'pushToken');
    const tokens = users.map(user => user.pushToken).filter(Boolean);

    if (tokens.length === 0) {
      console.log('ℹ️ No users with push tokens found');
      return { successCount: 0, failureCount: 0 };
    }

    return await sendBulkPushNotifications(tokens, notification);

  } catch (error) {
    console.error('❌ Send to all users failed:', error);
    throw error;
  }
};

// Send notification to users by criteria
const sendNotificationToUsersByCriteria = async (criteria, notification) => {
  try {
    // Find users matching criteria
    const users = await User.find(criteria, 'pushToken');
    const tokens = users.map(user => user.pushToken).filter(Boolean);

    if (tokens.length === 0) {
      console.log('ℹ️ No users matching criteria found');
      return { successCount: 0, failureCount: 0 };
    }

    return await sendBulkPushNotifications(tokens, notification);

  } catch (error) {
    console.error('❌ Send to users by criteria failed:', error);
    throw error;
  }
};

// Send order status notification
const sendOrderStatusNotification = async (userId, orderStatus, orderId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return;
    }

    const statusMessages = {
      'confirmed': 'Your order has been confirmed! 🎉',
      'processing': 'Your order is being processed! ⚙️',
      'shipped': 'Your order has been shipped! 📦',
      'delivered': 'Your order has been delivered! 🎯',
      'cancelled': 'Your order has been cancelled ❌',
      'refunded': 'Your refund has been processed! 💰'
    };

    const message = statusMessages[orderStatus] || 'Your order status has been updated!';

    await sendPushNotification(user.pushToken, {
      title: 'Order Update',
      message: message,
      data: {
        type: 'order',
        orderId: orderId,
        status: orderStatus
      }
    });

  } catch (error) {
    console.error('❌ Order status notification failed:', error);
  }
};

// Send payment notification
const sendPaymentNotification = async (userId, paymentStatus, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return;
    }

    const statusMessages = {
      'successful': `Payment successful! Amount: R${amount} ✅`,
      'failed': 'Payment failed. Please try again ❌',
      'pending': 'Payment is pending. Please wait ⏳',
      'refunded': `Refund processed! Amount: R${amount} 💰`
    };

    const message = statusMessages[paymentStatus] || 'Payment status updated';

    await sendPushNotification(user.pushToken, {
      title: 'Payment Update',
      message: message,
      data: {
        type: 'payment',
        status: paymentStatus,
        amount: amount
      }
    });

  } catch (error) {
    console.error('❌ Payment notification failed:', error);
  }
};

// Send service booking notification
const sendServiceBookingNotification = async (userId, bookingStatus, serviceName) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return;
    }

    const statusMessages = {
      'confirmed': `Your ${serviceName} booking has been confirmed! 🎉`,
      'pending': `Your ${serviceName} booking is pending confirmation ⏳`,
      'cancelled': `Your ${serviceName} booking has been cancelled ❌`,
      'completed': `Your ${serviceName} service has been completed! ✅`
    };

    const message = statusMessages[bookingStatus] || `Your ${serviceName} booking status updated`;

    await sendPushNotification(user.pushToken, {
      title: 'Service Booking Update',
      message: message,
      data: {
        type: 'service',
        status: bookingStatus,
        serviceName: serviceName
      }
    });

  } catch (error) {
    console.error('❌ Service booking notification failed:', error);
  }
};

// Send promotional notification
const sendPromotionalNotification = async (userId, title, message, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return;
    }

    await sendPushNotification(user.pushToken, {
      title: title,
      message: message,
      data: {
        type: 'promotion',
        ...data
      }
    });

  } catch (error) {
    console.error('❌ Promotional notification failed:', error);
  }
};

// Send security notification
const sendSecurityNotification = async (userId, securityType, message) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return;
    }

    await sendPushNotification(user.pushToken, {
      title: 'Security Alert',
      message: message,
      data: {
        type: 'security',
        securityType: securityType
      }
    });

  } catch (error) {
    console.error('❌ Security notification failed:', error);
  }
};

// Test push notification
const testPushNotification = async (token) => {
  try {
    await sendPushNotification(token, {
      title: '🧪 Test Notification',
      message: 'This is a test push notification from Aura!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, message: 'Test notification sent successfully' };

  } catch (error) {
    console.error('❌ Test notification failed:', error);
    return { success: false, message: error.message };
  }
};

// Helper: send to all active devices for a userId
const sendToUserDevices = async (userId, notification) => {
  try {
    console.log(`🔔 sendToUserDevices called for user: ${userId}`);
    console.log(`🔔 Notification data:`, {
      title: notification.title,
      message: notification.message,
      type: notification.data?.type
    });
    
    const user = await User.findById(userId, 'pushToken devices name');
    if (!user) {
      console.log('❌ User not found for push notification');
      return { successCount: 0, failureCount: 0 };
    }

    console.log(`🔔 User found: ${user.name} (${user._id})`);
    console.log(`🔔 User has push token: ${!!user.pushToken}`);
    console.log(`🔔 User push token preview: ${user.pushToken ? user.pushToken.substring(0, 20) + '...' : 'NO TOKEN'}`);
    console.log(`🔔 User devices count: ${user.devices?.length || 0}`);

    const tokens = [];
    if (user.pushToken) {
      tokens.push(user.pushToken);
      console.log('✅ Added legacy push token');
    }
    
    if (Array.isArray(user.devices)) {
      console.log(`🔔 Processing ${user.devices.length} devices...`);
      for (const d of user.devices) {
        if (d && d.active !== false && d.pushToken) {
          tokens.push(d.pushToken);
          console.log(`✅ Added device token: ${d.platform || 'unknown'}`);
        } else {
          console.log(`⚠️ Skipping device: ${d?.platform || 'unknown'} - ${!d?.pushToken ? 'no token' : 'inactive'}`);
        }
      }
    }

    // De-duplicate tokens
    const unique = Array.from(new Set(tokens));
    console.log(`🔔 Unique tokens found: ${unique.length}`);
    
    if (unique.length === 0) {
      console.log('❌ No valid push tokens found');
      return { successCount: 0, failureCount: 0 };
    }

    console.log('🔔 Attempting to send bulk push notifications...');
    const result = await sendBulkPushNotifications(unique, notification);
    console.log(`📊 Push notification results: ${result.successCount} success, ${result.failureCount} failures`);
    return result;
  } catch (e) {
    console.error('❌ sendToUserDevices error:', e);
    return { successCount: 0, failureCount: 1, error: e?.message };
  }
};

module.exports = {
  sendPushNotification,
  sendExpoPushNotification,
  sendBulkPushNotifications,
  sendToUserDevices,
  sendNotificationToAllUsers,
  sendNotificationToUsersByCriteria,
  sendOrderStatusNotification,
  sendPaymentNotification,
  sendServiceBookingNotification,
  sendPromotionalNotification,
  sendSecurityNotification,
  testPushNotification,
  initializeFirebase
};
