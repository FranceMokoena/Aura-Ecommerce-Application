const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notificationMonitoringService } = require('../services/notificationMonitoring.service');

describe('Notification System Integration Tests', () => {
  let testUser;
  let testSeller;
  let authToken;

  beforeAll(async () => {
    // Create test users
    testUser = new User({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      pushToken: 'test-customer-token-123'
    });
    await testUser.save();

    testSeller = new User({
      name: 'Test Seller',
      email: 'seller@test.com',
      password: 'password123',
      role: 'seller',
      pushToken: 'test-seller-token-456'
    });
    await testSeller.save();

    // Get auth token (simplified for testing)
    authToken = 'test-auth-token';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['customer@test.com', 'seller@test.com'] } });
    await Notification.deleteMany({ userId: { $in: [testUser._id, testSeller._id] } });
  });

  describe('POST /api/notifications/send-push', () => {
    it('should send push notification to specific user', async () => {
      const notificationData = {
        targetUserId: testUser._id.toString(),
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'test',
        data: {
          orderId: 'test-order-123',
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Push notification sent successfully');
      expect(response.body.notificationId).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Notification'
          // Missing targetUserId and message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle invalid user ID', async () => {
      const notificationData = {
        targetUserId: 'invalid-user-id',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'test'
      };

      const response = await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/notifications/seller-new-order', () => {
    it('should send seller notification for new order', async () => {
      const orderData = {
        _id: 'test-order-123',
        totalAmount: 99.99,
        products: [
          { productId: 'product-1', quantity: 2, price: 49.99 }
        ],
        customerId: {
          _id: testUser._id,
          name: testUser.name
        }
      };

      const response = await request(app)
        .post('/api/notifications/seller-new-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId: testSeller._id.toString(),
          orderData
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Seller notification sent successfully');
      expect(response.body.notificationId).toBeDefined();
    });

    it('should validate order data structure', async () => {
      const response = await request(app)
        .post('/api/notifications/seller-new-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerId: testSeller._id.toString(),
          orderData: {
            // Missing required fields
            totalAmount: 'invalid'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/notifications/customer-order-status', () => {
    it('should send customer notification for order status update', async () => {
      const response = await request(app)
        .post('/api/notifications/customer-order-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testUser._id.toString(),
          orderId: 'test-order-123',
          status: 'shipped',
          orderDetails: {
            trackingNumber: 'TRK123456',
            estimatedDelivery: new Date()
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer order status notification sent successfully');
      expect(response.body.notificationId).toBeDefined();
    });

    it('should validate order status values', async () => {
      const response = await request(app)
        .post('/api/notifications/customer-order-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testUser._id.toString(),
          orderId: 'test-order-123',
          status: 'invalid-status'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/notifications/send-bulk', () => {
    it('should send bulk notifications to multiple users', async () => {
      const response = await request(app)
        .post('/api/notifications/send-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetUserIds: [testUser._id.toString(), testSeller._id.toString()],
          title: 'Bulk Test Notification',
          message: 'This is a bulk test notification',
          type: 'test'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Push notifications sent to');
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBe(2);
    });

    it('should limit bulk notification size', async () => {
      const largeUserList = Array(1001).fill().map((_, i) => `user-${i}`);
      
      const response = await request(app)
        .post('/api/notifications/send-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetUserIds: largeUserList,
          title: 'Bulk Test Notification',
          message: 'This is a bulk test notification',
          type: 'test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/notifications/push-token-status', () => {
    it('should return user push token status', async () => {
      const response = await request(app)
        .get('/api/notifications/push-token-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.hasPushToken).toBeDefined();
      expect(response.body.user.deviceCount).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on notification endpoints', async () => {
      const notificationData = {
        targetUserId: testUser._id.toString(),
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'test'
      };

      // Send multiple requests quickly to trigger rate limit
      const promises = Array(101).fill().map(() => 
        request(app)
          .post('/api/notifications/send-push')
          .set('Authorization', `Bearer ${authToken}`)
          .send(notificationData)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Notification Monitoring', () => {
    it('should track notification metrics', async () => {
      const initialMetrics = notificationMonitoringService.getMetrics();
      
      // Send a notification
      await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetUserId: testUser._id.toString(),
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'test'
        });

      const updatedMetrics = notificationMonitoringService.getMetrics();
      expect(updatedMetrics.totalSent).toBeGreaterThan(initialMetrics.totalSent);
    });

    it('should provide health status', async () => {
      const healthStatus = await notificationMonitoringService.getHealthStatus();
      
      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.metrics).toBeDefined();
      expect(healthStatus.alerts).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    it('should store notifications in database', async () => {
      const notificationData = {
        targetUserId: testUser._id.toString(),
        title: 'Database Test Notification',
        message: 'This notification should be stored in database',
        type: 'test'
      };

      await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      // Check if notification was stored
      const storedNotification = await Notification.findOne({
        userId: testUser._id,
        title: 'Database Test Notification'
      });

      expect(storedNotification).toBeDefined();
      expect(storedNotification.message).toBe('This notification should be stored in database');
      expect(storedNotification.type).toBe('test');
    });
  });
});
