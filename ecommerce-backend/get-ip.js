/**
 * Simple script to get your current IP address for MongoDB Atlas whitelist
 */

const https = require('https');

console.log('🌐 Getting your current IP address...');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n✅ Your current IP address is:', result.ip);
      console.log('\n🔧 Add this IP to MongoDB Atlas:');
      console.log('1. Go to: https://cloud.mongodb.com/');
      console.log('2. Select your project: aura-app-cluster');
      console.log('3. Go to Network Access');
      console.log('4. Click "Add IP Address"');
      console.log('5. Enter:', result.ip);
      console.log('6. Save changes and wait 1-2 minutes');
      console.log('\n🚀 Then restart your backend server!');
    } catch (error) {
      console.error('❌ Error parsing IP response:', error);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error getting IP address:', error);
  console.log('\n🔧 Manual solution:');
  console.log('1. Visit: https://whatismyipaddress.com/');
  console.log('2. Copy your IP address');
  console.log('3. Add it to MongoDB Atlas Network Access');
});
