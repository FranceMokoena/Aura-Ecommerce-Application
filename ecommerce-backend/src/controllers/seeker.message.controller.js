const Message = require('../models/Message');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Send a message as a seeker (ONLY to customers)
exports.sendSeekerMessage = async (req, res) => {
  try {
    console.log('=== SEEKER MESSAGE CONTROLLER SEND MESSAGE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { receiverId, content, messageType = 'text', orderReference, productReference, attachments } = req.body;
    const senderId = req.user._id;

    console.log('Sender ID (Seeker):', senderId);
    console.log('Receiver ID:', receiverId);
    console.log('Content:', content);
    console.log('Message type:', messageType);

    // Validate receiver exists and is a customer
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log('Receiver not found:', receiverId);
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    if (receiver.role !== 'customer') {
      console.log('Receiver is not a customer:', receiver.role);
      return res.status(403).json({
        success: false,
        message: 'Seekers can only message customers'
      });
    }

    console.log('Receiver found (Customer):', receiver.name);

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

    console.log('Saving seeker message to database...');
    await message.save();
    console.log('Seeker message saved successfully');

    // Populate sender and receiver details
    await message.populate('senderId', 'name profilePicture role');
    await message.populate('receiverId', 'name profilePicture role');
    await message.populate('orderReference', 'orderNumber totalAmount status');
    await message.populate('productReference', 'name images price');

    console.log('Seeker message populated and ready to send response');
    console.log('=== SEEKER MESSAGE CONTROLLER SEND MESSAGE END ===');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending seeker message:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get seeker conversations list (ONLY with customers)
exports.getSeekerConversationsList = async (req, res) => {
  try {
    const seekerId = req.user._id;
    console.log('=== SEEKER CONVERSATIONS LIST DEBUG ===');
    console.log('Seeker ID:', seekerId);
    
    // Get conversations where seeker is sender or receiver
    const conversations = await Message.getSeekerConversationsList(seekerId);

    // Filter to only show conversations with customers
    const customerConversations = conversations.filter(conversation => {
      return conversation.partner.role === 'customer';
    });

    console.log(`Found ${conversations.length} total conversations, ${customerConversations.length} with customers`);

    // Convert profile picture paths to full URLs
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const conversationsWithFullUrls = customerConversations.map(conversation => {
      console.log('=== CUSTOMER CONVERSATION DEBUG ===');
      console.log('Customer partner:', conversation.partner);
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
      message: 'Seeker conversations retrieved successfully',
      data: conversationsWithFullUrls
    });

  } catch (error) {
    console.error('Error getting seeker conversations list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seeker conversations list',
      error: error.message
    });
  }
};

// Get conversation between seeker and a specific customer
exports.getSeekerConversation = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const seekerId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    console.log('=== SEEKER CONVERSATION DEBUG ===');
    console.log('Seeker ID:', seekerId);
    console.log('Customer Partner ID:', partnerId);

    // Validate partner exists and is a customer
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Conversation partner not found'
      });
    }

    if (partner.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Seekers can only view conversations with customers'
      });
    }

    console.log('Customer partner found:', partner.name);

    const messages = await Message.getConversation(seekerId, partnerId, parseInt(limit), parseInt(skip));

    // Mark messages as read
    await Message.markConversationAsRead(seekerId, partnerId);

    // Convert profile picture path to full URL
    const baseURL = `${req.protocol}://${req.get('host')}`;
    console.log('=== SEEKER-CUSTOMER CONVERSATION DEBUG ===');
    console.log('Customer data:', partner);
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
      message: 'Seeker conversation retrieved successfully',
      data: {
        messages,
        partner: partnerWithFullUrl
      }
    });

  } catch (error) {
    console.error('Error getting seeker conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seeker conversation',
      error: error.message
    });
  }
};

// Mark seeker message as read
exports.markSeekerMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const seekerId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify the seeker is the receiver of this message
    if (message.receiverId.toString() !== seekerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Error marking seeker message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

// Mark seeker conversation as read
exports.markSeekerConversationAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const seekerId = req.user._id;

    // Verify partner is a customer
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer partner not found'
      });
    }

    await Message.markConversationAsRead(seekerId, partnerId);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Error marking seeker conversation as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read',
      error: error.message
    });
  }
};

// Get unread count for seeker
exports.getSeekerUnreadCount = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiverId: seekerId,
      isRead: false
    });

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: unreadCount
    });

  } catch (error) {
    console.error('Error getting seeker unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Delete seeker message
exports.deleteSeekerMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const seekerId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify the seeker is the sender of this message
    if (message.senderId.toString() !== seekerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete messages you sent'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting seeker message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

// Search seeker messages
exports.searchSeekerMessages = async (req, res) => {
  try {
    const { query, partnerId } = req.query;
    const seekerId = req.user._id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let searchQuery = {
      $or: [
        { senderId: seekerId },
        { receiverId: seekerId }
      ],
      content: { $regex: query, $options: 'i' }
    };

    if (partnerId) {
      // Verify partner is a customer
      const partner = await User.findById(partnerId);
      if (!partner || partner.role !== 'customer') {
        return res.status(404).json({
          success: false,
          message: 'Customer partner not found'
        });
      }
      
      searchQuery.$or = [
        { senderId: seekerId, receiverId: partnerId },
        { senderId: partnerId, receiverId: seekerId }
      ];
    }

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name profilePicture role')
      .populate('receiverId', 'name profilePicture role');

    // Filter to only show messages with customers
    const customerMessages = messages.filter(message => {
      const otherUserId = message.senderId._id.toString() === seekerId.toString() 
        ? message.receiverId._id 
        : message.senderId._id;
      
      return message.senderId.role === 'customer' || message.receiverId.role === 'customer';
    });

    res.json({
      success: true,
      message: 'Messages searched successfully',
      data: customerMessages
    });

  } catch (error) {
    console.error('Error searching seeker messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message
    });
  }
};
