const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Order = require('../models/Order');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get user by ID
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID, excluding password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update push token for notifications
const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user?.id || req.user?._id;

    console.log('🔔 updatePushToken called with:', { userId, pushToken });

    if (!pushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in request" });
    }

    // Update user's push token
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { pushToken: pushToken },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Push token updated for user: ${updatedUser.name} (${updatedUser._id})`);
    console.log(`✅ New push token: ${updatedUser.pushToken}`);
    
    res.json({ 
      success: true,
      message: "Push token updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Error updating push token:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    console.log('=== GET CURRENT USER START ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('User from auth middleware:', req.user);
    console.log('User object:', req.user);
    console.log('User ID being used:', req.user?.id || req.user?._id);
    
    // Get user from auth middleware - handle both id and _id
    const userId = req.user?.id || req.user?._id;
    console.log('User ID from auth middleware:', userId);

    // Find user by ID, excluding password
    const user = await User.findById(userId).select('-password');
    console.log('User found in database:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: "User not found" });
    }

    // Convert profile picture path to full URL if it exists
    if (user.profilePicture) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      user.profilePicture = `${baseURL}/${user.profilePicture}`;
    }
    
    console.log('User data to return:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    });
    
    console.log('=== GET CURRENT USER END ===');
    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user profile (for onboarding and basic profile updates)
const updateUserProfile = async (req, res) => {
  try {
    console.log('=== UPDATE USER PROFILE START ===');
    console.log('User ID:', req.params.userId);
    console.log('Update data:', req.body);
    
    const { userId } = req.params;
    const updateData = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('User found in database:', user.name);
    console.log('Current user location:', user.location);

    // Update basic user fields
    const basicFieldsToUpdate = ['name', 'email', 'phone'];
    basicFieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
        console.log(`Updated ${field}:`, updateData[field]);
      }
    });

    // Handle location update specially to ensure proper structure
    if (updateData.location !== undefined) {
      console.log('Updating location field:', updateData.location);
      
      if (updateData.location === null || updateData.location === '') {
        // Clear location
        user.location = undefined;
        console.log('Location cleared');
      } else if (typeof updateData.location === 'object') {
        // Ensure location object has proper structure
        user.location = {
          city: updateData.location.city || '',
          country: updateData.location.country || '',
          coordinates: Array.isArray(updateData.location.coordinates) && 
                      updateData.location.coordinates.length === 2 &&
                      typeof updateData.location.coordinates[0] === 'number' &&
                      typeof updateData.location.coordinates[1] === 'number'
                      ? updateData.location.coordinates 
                      : []
        };
        console.log('Location updated to object:', user.location);
      } else if (typeof updateData.location === 'string') {
        // Handle string location (legacy support)
        user.location = {
          city: updateData.location,
          country: '',
          coordinates: []
        };
        console.log('Location updated from string:', user.location);
      }
    }

    // Update business-related fields (excluding location which we handled above)
    const businessFieldsToUpdate = [
      'businessName', 'businessType', 'businessDescription', 'businessCategory',
      'hourlyRate', 'experience', 'onboardingCompleted',
      'bio', 'website', 'socialMedia', 'businessHours', 'specialties'
    ];

    businessFieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
        console.log(`Updated business field ${field}:`, updateData[field]);
      }
    });

    // Save user with proper validation
    await user.save();
    console.log('User saved successfully');
    console.log('Final user location after save:', user.location);

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    // Convert profile picture path to full URL if it exists
    if (updatedUser.profilePicture) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      updatedUser.profilePicture = `${baseURL}/${updatedUser.profilePicture}`;
    }
    
    console.log('Updated user location being returned:', updatedUser.location);
    console.log('=== UPDATE USER PROFILE END ===');
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update current user profile
const updateCurrentUserProfile = async (req, res) => {
  try {
    console.log('=== UPDATE CURRENT USER PROFILE START ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    // Get user from auth middleware - handle both id and _id
    const userId = req.user?.id || req.user?._id;
    const updateData = req.body;

    console.log('User ID from auth middleware:', userId);
    console.log('Update data:', updateData);

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('User found in database:', user.name);
    console.log('Current user location:', user.location);

    // Update basic user fields
    const basicFieldsToUpdate = ['name', 'email', 'phone'];
    basicFieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
        console.log(`Updated ${field}:`, updateData[field]);
      }
    });

    // Handle location update specially to ensure proper structure
    if (updateData.location !== undefined) {
      console.log('Updating location field:', updateData.location);
      
      if (updateData.location === null || updateData.location === '') {
        // Clear location
        user.location = undefined;
        console.log('Location cleared');
      } else if (typeof updateData.location === 'object') {
        // Ensure location object has proper structure
        user.location = {
          city: updateData.location.city || '',
          country: updateData.location.country || '',
          coordinates: Array.isArray(updateData.location.coordinates) && 
                      updateData.location.coordinates.length === 2 &&
                      typeof updateData.location.coordinates[0] === 'number' &&
                      typeof updateData.location.coordinates[1] === 'number'
                      ? updateData.location.coordinates 
                      : []
        };
        console.log('Location updated to object:', user.location);
      } else if (typeof updateData.location === 'string') {
        // Handle string location (legacy support)
        user.location = {
          city: updateData.location,
          country: '',
          coordinates: []
        };
        console.log('Location updated from string:', user.location);
      }
    }

    // Update business-related fields (excluding location which we handled above)
    const businessFieldsToUpdate = [
      'businessName', 'businessType', 'businessDescription', 'businessCategory',
      'hourlyRate', 'experience', 'onboardingCompleted',
      'bio', 'website', 'socialMedia', 'businessHours', 'specialties'
    ];

    businessFieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
        console.log(`Updated business field ${field}:`, updateData[field]);
      }
    });

    // Save user with proper validation
    await user.save();
    console.log('User saved successfully');
    console.log('Final user location after save:', user.location);

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    // Convert profile picture path to full URL if it exists
    if (updatedUser.profilePicture) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      updatedUser.profilePicture = `${baseURL}/${updatedUser.profilePicture}`;
    }
    
    console.log('Updated user location being returned:', updatedUser.location);
    console.log('=== UPDATE CURRENT USER PROFILE END ===');
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating current user profile:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    console.log('=== UPLOAD PROFILE PICTURE START ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('User from auth middleware:', req.user);
    console.log('File uploaded:', req.file ? 'Yes' : 'No');
    
    const { userId } = req.params;
    console.log('userId parameter:', userId);
    
    // Determine the actual user ID
    let actualUserId;
    if (userId === 'me' || !userId) {
      // For /me routes or when userId is undefined, use the authenticated user's ID
      actualUserId = req.user?.id || req.user?._id;
    } else {
      actualUserId = userId;
    }
    console.log('Actual user ID:', actualUserId);

    // Check if user exists
    const user = await User.findById(actualUserId);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: "User not found" });
    }
    console.log('User found in database:', user.name);

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: "No image file provided" });
    }
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Delete old profile picture if exists
    if (user.profilePicture && user.profilePicture !== req.file.path) {
      const oldImagePath = user.profilePicture;
      console.log('Deleting old profile picture:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('Old profile picture deleted');
      }
    }

    // Update user's profile picture path
    user.profilePicture = req.file.path;
    await user.save();
    console.log('User profile picture updated in database');

    // Return updated user without password
    const updatedUser = await User.findById(actualUserId).select('-password');
    
    // Convert local file path to full URL for frontend
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const profilePictureURL = `${baseURL}/${req.file.path}`;
    
    console.log('Profile picture URL:', profilePictureURL);
    console.log('=== UPLOAD PROFILE PICTURE END ===');
    res.json({ 
      message: "Profile picture uploaded successfully", 
      user: updatedUser,
      profilePicture: profilePictureURL
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user by ID (for viewing customer profiles)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get customer statistics
    const orders = await Order.find({ customerId: userId });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const lastOrder = orders.length > 0 ? orders[orders.length - 1].createdAt : null;

    const customerProfile = {
      ...user.toObject(),
      totalOrders,
      totalSpent,
      lastOrderDate: lastOrder
    };

    res.json(customerProfile);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user by ID
const updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, location } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (location) user.location = location;

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Debug endpoint to check push token status
const debugPushTokens = async (req, res) => {
  try {
    console.log('🔔 === PUSH TOKEN DEBUG START ===');
    
    // Get all users with their push token status
    const users = await User.find({}, 'name email role pushToken createdAt');
    
    const tokenStats = {
      totalUsers: users.length,
      usersWithTokens: users.filter(u => u.pushToken).length,
      usersWithoutTokens: users.filter(u => !u.pushToken).length,
      byRole: {}
    };
    
    // Group by role
    const roleGroups = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = {
          total: 0,
          withTokens: 0,
          withoutTokens: 0,
          users: []
        };
      }
      
      acc[user.role].total++;
      if (user.pushToken) {
        acc[user.role].withTokens++;
      } else {
        acc[user.role].withoutTokens++;
      }
      
      acc[user.role].users.push({
        id: user._id,
        name: user.name,
        email: user.email,
        hasToken: !!user.pushToken,
        tokenPreview: user.pushToken ? `${user.pushToken.substring(0, 20)}...` : 'NO TOKEN',
        createdAt: user.createdAt
      });
      
      return acc;
    }, {});
    
    tokenStats.byRole = roleGroups;
    
    console.log('🔔 Push token debug results:', tokenStats);
    console.log('🔔 === PUSH TOKEN DEBUG END ===');
    
    res.json({
      success: true,
      message: 'Push token debug information',
      data: tokenStats
    });
    
  } catch (error) {
    console.error('❌ Error in push token debug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get push token debug information',
      error: error.message
    });
  }
};

module.exports = {
  getUser,
  getCurrentUser,
  updateUserProfile,
  updateCurrentUserProfile,
  updatePushToken,
  uploadProfilePicture,
  upload, // Export multer upload middleware
  getUserById,
  updateUserById,
  debugPushTokens
};
