const Message = require('../models/Message');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    console.log('=== MESSAGE CONTROLLER SEND MESSAGE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { receiverId, content, messageType = 'text', orderReference, productReference, attachments } = req.body;
    const senderId = req.user._id;

    console.log('Sender ID:', senderId);
    console.log('Receiver ID:', receiverId);
    console.log('Content:', content);
    console.log('Message type:', messageType);

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log('Receiver not found:', receiverId);
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    console.log('Receiver found:', receiver.name);

    // Validate order reference if provided
    if (orderReference) {
      const order = await Order.findById(orderReference);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order reference not found'
        });
      }
    }

    // Validate product reference if provided
    if (productReference) {
      const product = await Product.findById(productReference);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product reference not found'
        });
      }
    }

    // Create new message
    const message = new Message({
      senderId,
      receiverId,
      content,
      messageType,
      orderReference,
      productReference,
      attachments: attachments || []
    });

    console.log('Saving message to database...');
    await message.save();
    console.log('Message saved successfully');

    // Populate sender and receiver details
    await message.populate('senderId', 'name profilePicture');
    await message.populate('receiverId', 'name profilePicture');
    await message.populate('orderReference', 'orderNumber totalAmount status');
    await message.populate('productReference', 'name images price');

    console.log('Message populated and ready to send response');
    console.log('=== MESSAGE CONTROLLER SEND MESSAGE END ===');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get conversations list for a user
exports.getConversationsList = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.getConversationsList(userId);

    // Convert profile picture paths to full URLs
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const conversationsWithFullUrls = conversations.map(conversation => {
      console.log('=== CONVERSATION DEBUG ===');
      console.log('Original partner:', conversation.partner);
      console.log('Original profile picture:', conversation.partner.profilePicture);
      
      const fullUrl = conversation.partner.profilePicture 
        ? `${baseURL}/${conversation.partner.profilePicture}`
        : conversation.partner.profilePicture;
      
      console.log('Converted profile picture URL:', fullUrl);
      
      return {
        ...conversation,
        partner: {
          ...conversation.partner,
          profilePicture: fullUrl
        }
      };
    });

    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversationsWithFullUrls
    });

  } catch (error) {
    console.error('Error getting conversations list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations list',
      error: error.message
    });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    // Validate partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Conversation partner not found'
      });
    }

    const messages = await Message.getConversation(userId, partnerId, parseInt(limit), parseInt(skip));

    // Mark messages as read
    await Message.markConversationAsRead(userId, partnerId);

    // Convert profile picture path to full URL
    const baseURL = `${req.protocol}://${req.get('host')}`;
    console.log('=== INDIVIDUAL CONVERSATION DEBUG ===');
    console.log('Partner data:', partner);
    console.log('Original profile picture:', partner.profilePicture);
    console.log('Base URL:', baseURL);
    
    const fullUrl = partner.profilePicture 
      ? `${baseURL}/${partner.profilePicture}`
      : partner.profilePicture;
    
    console.log('Converted profile picture URL:', fullUrl);
    
    const partnerWithFullUrl = {
      _id: partner._id,
      name: partner.name,
      profilePicture: fullUrl,
      role: partner.role,
      isOnline: partner.isOnline,
      lastSeen: partner.lastSeen
    };

    res.json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        partner: partnerWithFullUrl
      }
    });

  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error.message
    });
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only receiver can mark message as read
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

// Mark conversation as read
exports.markConversationAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user._id;

    // Validate partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Conversation partner not found'
      });
    }

    await Message.markConversationAsRead(userId, partnerId);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read',
      error: error.message
    });
  }
};

// Get unread count for a user
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.getUnreadCount(userId);

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Delete a message (only sender can delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

// Get recent messages for dashboard
exports.getRecentMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const recentMessages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('senderId', 'name profilePicture role')
    .populate('receiverId', 'name profilePicture role')
    .populate('orderReference', 'orderNumber totalAmount status')
    .populate('productReference', 'name images price');

    res.json({
      success: true,
      message: 'Recent messages retrieved successfully',
      data: recentMessages
    });

  } catch (error) {
    console.error('Error getting recent messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent messages',
      error: error.message
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, partnerId } = req.query;
    const { limit = 20, skip = 0 } = req.query;

    let searchQuery = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      content: { $regex: query, $options: 'i' }
    };

    // If partnerId is provided, search only in that conversation
    if (partnerId) {
      searchQuery.$and = [
        {
          $or: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId }
          ]
        }
      ];
    }

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('senderId', 'name profilePicture role')
      .populate('receiverId', 'name profilePicture role')
      .populate('orderReference', 'orderNumber totalAmount status')
      .populate('productReference', 'name images price');

    res.json({
      success: true,
      message: 'Messages search completed',
      data: messages
    });

  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message
    });
  }
};
