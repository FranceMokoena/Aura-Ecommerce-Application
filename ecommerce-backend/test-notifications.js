#!/usr/bin/env node

/**
 * Test script for push notifications
 * Run with: node test-notifications.js
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const { sendToUserDevices } = require('./src/services/pushNotification.service');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://francewitness9:QmiLPiceLsU87mye@aura-app-cluster.4la8fhd.mongodb.net/aura-app?retryWrites=true&w=majority&appName=aura-app-cluster');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Test push notification
const testPushNotification = async () => {
  try {
    console.log('🔔 === PUSH NOTIFICATION TEST START ===');
    
    // Get a user with push token
    const user = await User.findOne({ 
      $or: [
        { pushToken: { $exists: true, $ne: null } },
        { 'devices.pushToken': { $exists: true, $ne: null } }
      ]
    });
    
    if (!user) {
      console.log('❌ No users with push tokens found');
      console.log('💡 Please register a push token first through the app');
      return;
    }
    
    console.log(`🔔 Testing with user: ${user.name} (${user._id})`);
    console.log(`🔔 User has push token: ${!!user.pushToken}`);
    console.log(`🔔 User devices: ${user.devices?.length || 0}`);
    
    const testNotification = {
      title: '🧪 Test Notification',
      message: 'This is a test notification from the backend',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('🔔 Sending test notification...');
    const result = await sendToUserDevices(user._id, testNotification);
    
    console.log('📊 Test results:', result);
    console.log('🔔 === PUSH NOTIFICATION TEST END ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testPushNotification();
  process.exit(0);
};

// Run the test
main().catch(console.error);
