const User = require('../models/User');
const { sendToUserDevices } = require('../services/pushNotification.service');

// Test push token registration and notification sending
const testPushTokenSystem = async (req, res) => {
  try {
    console.log('🧪 === PUSH TOKEN SYSTEM TEST START ===');
    
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found in request' 
      });
    }

    // Get user with all token information
    const user = await User.findById(userId, 'name email role pushToken devices status');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('🧪 Testing user:', {
      id: user._id,
      name: user.name,
      role: user.role,
      status: user.status,
      hasLegacyToken: !!user.pushToken,
      devicesCount: user.devices?.length || 0
    });

    // Test token collection
    const tokens = [];
    const tokenSources = [];

    // Add legacy token
    if (user.pushToken && user.pushToken.length > 10) {
      tokens.push(user.pushToken);
      tokenSources.push('legacy');
    }

    // Add device tokens
    if (Array.isArray(user.devices)) {
      user.devices.forEach((device, index) => {
        if (device && device.active !== false && device.pushToken && device.pushToken.length > 10) {
          if (!tokens.includes(device.pushToken)) {
            tokens.push(device.pushToken);
            tokenSources.push(`device_${index}_${device.platform || 'unknown'}`);
          }
        }
      });
    }

    // Send test notification
    const testNotification = {
      title: '🧪 Push Token Test',
      message: `Hello ${user.name}! Your push token system is working correctly.`,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        userId: user._id.toString()
      }
    };

    console.log('🧪 Sending test notification to tokens:', tokens.length);
    const result = await sendToUserDevices(userId, testNotification);

    // Prepare response
    const response = {
      success: true,
      message: 'Push token system test completed',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status
      },
      tokens: {
        total: tokens.length,
        sources: tokenSources,
        previews: tokens.map(token => token.substring(0, 20) + '...')
      },
      notification: {
        sent: result.successCount,
        failed: result.failureCount,
        total: result.successCount + result.failureCount
      },
      devices: user.devices?.map(device => ({
        deviceId: device.deviceId,
        platform: device.platform,
        active: device.active,
        hasToken: !!device.pushToken,
        lastSeen: device.lastSeenAt
      })) || []
    };

    console.log('🧪 Test results:', response);
    console.log('🧪 === PUSH TOKEN SYSTEM TEST END ===');

    res.json(response);

  } catch (error) {
    console.error('❌ Push token system test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

// Get detailed push token status for debugging
const getPushTokenStatus = async (req, res) => {
  try {
    console.log('🔍 === PUSH TOKEN STATUS CHECK START ===');
    
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found in request' 
      });
    }

    // Get user with all token information
    const user = await User.findById(userId, 'name email role pushToken devices status createdAt');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Analyze token status
    const analysis = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      },
      legacyToken: {
        exists: !!user.pushToken,
        length: user.pushToken?.length || 0,
        preview: user.pushToken ? user.pushToken.substring(0, 20) + '...' : 'N/A',
        valid: user.pushToken && user.pushToken.length > 10
      },
      devices: {
        total: user.devices?.length || 0,
        active: user.devices?.filter(d => d.active !== false).length || 0,
        withTokens: user.devices?.filter(d => d.pushToken && d.pushToken.length > 10).length || 0,
        details: user.devices?.map(device => ({
          deviceId: device.deviceId,
          platform: device.platform,
          active: device.active,
          hasToken: !!device.pushToken,
          tokenLength: device.pushToken?.length || 0,
          tokenPreview: device.pushToken ? device.pushToken.substring(0, 20) + '...' : 'N/A',
          lastSeen: device.lastSeenAt
        })) || []
      },
      summary: {
        hasAnyTokens: !!(user.pushToken || user.devices?.some(d => d.pushToken)),
        totalValidTokens: [
          ...(user.pushToken && user.pushToken.length > 10 ? [user.pushToken] : []),
          ...(user.devices?.filter(d => d.active !== false && d.pushToken && d.pushToken.length > 10).map(d => d.pushToken) || [])
        ].filter((token, index, arr) => arr.indexOf(token) === index).length,
        canReceiveNotifications: user.status === 'active' && (
          (user.pushToken && user.pushToken.length > 10) || 
          user.devices?.some(d => d.active !== false && d.pushToken && d.pushToken.length > 10)
        )
      }
    };

    console.log('🔍 Token analysis:', analysis);
    console.log('🔍 === PUSH TOKEN STATUS CHECK END ===');

    res.json({
      success: true,
      message: 'Push token status retrieved',
      data: analysis
    });

  } catch (error) {
    console.error('❌ Push token status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
};

module.exports = {
  testPushTokenSystem,
  getPushTokenStatus
};
