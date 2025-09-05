const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'order_update'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  orderReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  productReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

// Virtual for conversation ID (unique identifier for a conversation between two users)
messageSchema.virtual('conversationId').get(function() {
  const sortedIds = [this.senderId.toString(), this.receiverId.toString()].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
});

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('senderId', 'name profilePicture')
  .populate('receiverId', 'name profilePicture')
  .populate('orderReference', 'orderNumber totalAmount status')
  .populate('productReference', 'name images price');
};

// Static method to get conversations list for a user
messageSchema.statics.getConversationsList = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    },
    {
      $addFields: {
        conversationPartner: {
          $cond: {
            if: { $eq: ['$senderId', userId] },
            then: '$receiverId',
            else: '$senderId'
          }
        },
        isOutgoing: { $eq: ['$senderId', userId] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationPartner',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', userId] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    {
      $unwind: '$partner'
    },
    {
      $project: {
        _id: 1,
        partner: {
          _id: 1,
          name: 1,
          profilePicture: 1,
          role: 1,
          isOnline: 1,
          lastSeen: 1
        },
        lastMessage: {
          content: 1,
          messageType: 1,
          createdAt: 1,
          isRead: 1
        },
        unreadCount: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Static method to get seeker conversations list (ONLY with customers)
messageSchema.statics.getSeekerConversationsList = function(seekerId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: seekerId },
          { receiverId: seekerId }
        ]
      }
    },
    {
      $addFields: {
        conversationPartner: {
          $cond: {
            if: { $eq: ['$senderId', seekerId] },
            then: '$receiverId',
            else: '$senderId'
          }
        },
        isOutgoing: { $eq: ['$senderId', seekerId] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationPartner',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', seekerId] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    {
      $unwind: '$partner'
    },
    {
      $project: {
        _id: 1,
        partner: {
          _id: 1,
          name: 1,
          profilePicture: 1,
          role: 1,
          isOnline: 1,
          lastSeen: 1
        },
        lastMessage: {
          content: 1,
          messageType: 1,
          createdAt: 1,
          isRead: 1
        },
        unreadCount: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(userId1, userId2) {
  return this.updateMany(
    {
      senderId: userId2,
      receiverId: userId1,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
