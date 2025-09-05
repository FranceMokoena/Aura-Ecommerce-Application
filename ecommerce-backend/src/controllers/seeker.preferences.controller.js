const User = require('../models/User');

// Default seeker preferences
const defaultSeekerPreferences = {
  notifications: {
    bookingNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingNotifications: false,
    pushNotifications: true,
    emailNotifications: true,
    serviceRequests: true,
    customerInquiries: true,
    availabilityUpdates: true,
  },
  privacy: {
    profileVisibility: true,
    serviceHistory: true,
    locationSharing: true,
    pushNotifications: true,
    marketingEmails: false,
    dataAnalytics: true,
    showOnlineStatus: true,
    showLastSeen: false,
  },
  account: {
    language: 'en',
    currency: 'USD',
    theme: 'auto',
    privacySettings: true,
    autoLogin: false,
    twoFactorAuth: false,
    biometricLogin: false,
  },
  service: {
    autoAcceptBookings: false,
    requireUpfrontPayment: false,
    upfrontPaymentPercentage: 0,
    cancellationPolicy: 'moderate',
    responseTime: 'within_1_hour',
    availabilityCalendar: true,
    instantBooking: false,
  }
};

// Get seeker preferences
exports.getSeekerPreferences = async (req, res) => {
  try {
    const seekerId = req.user._id;
    console.log('=== GET SEEKER PREFERENCES DEBUG ===');
    console.log('Seeker ID:', seekerId);

    const seeker = await User.findById(seekerId);
    if (!seeker) {
      return res.status(404).json({
        success: false,
        message: 'Seeker not found'
      });
    }

    // Get preferences from user document or use defaults
    let preferences = seeker.preferences || {};
    
    // Merge with defaults to ensure all fields exist
    const mergedPreferences = {
      ...defaultSeekerPreferences,
      ...preferences,
      notifications: {
        ...defaultSeekerPreferences.notifications,
        ...preferences.notifications
      },
      privacy: {
        ...defaultSeekerPreferences.privacy,
        ...preferences.privacy
      },
      account: {
        ...defaultSeekerPreferences.account,
        ...preferences.account
      },
      service: {
        ...defaultSeekerPreferences.service,
        ...preferences.service
      }
    };

    console.log('Merged preferences:', mergedPreferences);

    res.json({
      success: true,
      message: 'Seeker preferences retrieved successfully',
      data: mergedPreferences
    });

  } catch (error) {
    console.error('Error getting seeker preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seeker preferences',
      error: error.message
    });
  }
};

// Update seeker preferences
exports.updateSeekerPreferences = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const updates = req.body;
    
    console.log('=== UPDATE SEEKER PREFERENCES DEBUG ===');
    console.log('Seeker ID:', seekerId);
    console.log('Updates:', updates);

    const seeker = await User.findById(seekerId);
    if (!seeker) {
      return res.status(404).json({
        success: false,
        message: 'Seeker not found'
      });
    }

    // Get current preferences
    let currentPreferences = seeker.preferences || {};
    
    // Deep merge the updates
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      notifications: {
        ...currentPreferences.notifications,
        ...updates.notifications
      },
      privacy: {
        ...currentPreferences.privacy,
        ...updates.privacy
      },
      account: {
        ...currentPreferences.account,
        ...updates.account
      },
      service: {
        ...currentPreferences.service,
        ...updates.service
      }
    };

    // Update user document
    seeker.preferences = updatedPreferences;
    await seeker.save();

    console.log('Preferences updated successfully');

    res.json({
      success: true,
      message: 'Seeker preferences updated successfully',
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Error updating seeker preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seeker preferences',
      error: error.message
    });
  }
};

// Reset seeker preferences to defaults
exports.resetSeekerPreferences = async (req, res) => {
  try {
    const seekerId = req.user._id;
    console.log('=== RESET SEEKER PREFERENCES DEBUG ===');
    console.log('Seeker ID:', seekerId);

    const seeker = await User.findById(seekerId);
    if (!seeker) {
      return res.status(404).json({
        success: false,
        message: 'Seeker not found'
      });
    }

    // Reset to default preferences
    seeker.preferences = defaultSeekerPreferences;
    await seeker.save();

    console.log('Preferences reset to defaults successfully');

    res.json({
      success: true,
      message: 'Seeker preferences reset to defaults successfully',
      data: defaultSeekerPreferences
    });

  } catch (error) {
    console.error('Error resetting seeker preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset seeker preferences',
      error: error.message
    });
  }
};

// Export seeker preferences
exports.exportSeekerPreferences = async (req, res) => {
  try {
    const seekerId = req.user._id;
    console.log('=== EXPORT SEEKER PREFERENCES DEBUG ===');
    console.log('Seeker ID:', seekerId);

    const seeker = await User.findById(seekerId);
    if (!seeker) {
      return res.status(404).json({
        success: false,
        message: 'Seeker not found'
      });
    }

    // Get current preferences or defaults
    const preferences = seeker.preferences || defaultSeekerPreferences;
    
    // Convert to JSON string
    const preferencesJson = JSON.stringify(preferences, null, 2);

    console.log('Preferences exported successfully');

    res.json({
      success: true,
      message: 'Seeker preferences exported successfully',
      data: preferencesJson
    });

  } catch (error) {
    console.error('Error exporting seeker preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export seeker preferences',
      error: error.message
    });
  }
};
