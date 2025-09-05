const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection options
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('IP whitelist')) {
      console.log('\n🔧 SOLUTION: Add your IP address to MongoDB Atlas whitelist:');
      console.log('1. Go to: https://cloud.mongodb.com/');
      console.log('2. Select your project: aura-app-cluster');
      console.log('3. Go to Network Access');
      console.log('4. Click "Add IP Address"');
      console.log('5. Add your current IP or use 0.0.0.0/0 for all IPs (less secure)');
      console.log('6. Save changes and wait 1-2 minutes');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 SOLUTION: Check your MongoDB credentials:');
      console.log('1. Verify username: francewitness9');
      console.log('2. Verify password in .env file');
      console.log('3. Check if user has proper permissions');
    }
    
    console.log('\n🌐 Your current IP address:');
    console.log('Visit: https://whatismyipaddress.com/ to get your IP');
    
    process.exit(1);
  }
};

module.exports = connectDB;
