const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationMonitoringService {
  constructor() {
    this.metrics = {
      totalSent: 0,
      totalFailed: 0,
      totalDelivered: 0,
      totalRead: 0,
      averageDeliveryTime: 0,
      successRate: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Track notification sent
   */
  async trackNotificationSent(notificationId, type, targetUserId) {
    try {
      this.metrics.totalSent++;
      this.metrics.lastUpdated = new Date();
      
      // Log to database for analytics
      await this.logNotificationEvent('sent', notificationId, type, targetUserId);
      
      console.log(`📊 Notification sent tracked: ${notificationId} (${type})`);
    } catch (error) {
      console.error('❌ Error tracking notification sent:', error);
    }
  }

  /**
   * Track notification failed
   */
  async trackNotificationFailed(notificationId, type, targetUserId, error) {
    try {
      this.metrics.totalFailed++;
      this.metrics.lastUpdated = new Date();
      
      // Log to database for analytics
      await this.logNotificationEvent('failed', notificationId, type, targetUserId, error);
      
      console.log(`📊 Notification failed tracked: ${notificationId} (${type}) - ${error}`);
    } catch (err) {
      console.error('❌ Error tracking notification failed:', err);
    }
  }

  /**
   * Track notification delivered
   */
  async trackNotificationDelivered(notificationId, type, targetUserId, deliveryTime) {
    try {
      this.metrics.totalDelivered++;
      this.metrics.lastUpdated = new Date();
      
      // Update average delivery time
      this.updateAverageDeliveryTime(deliveryTime);
      
      // Log to database for analytics
      await this.logNotificationEvent('delivered', notificationId, type, targetUserId, null, deliveryTime);
      
      console.log(`📊 Notification delivered tracked: ${notificationId} (${type}) in ${deliveryTime}ms`);
    } catch (error) {
      console.error('❌ Error tracking notification delivered:', error);
    }
  }

  /**
   * Track notification read
   */
  async trackNotificationRead(notificationId, type, targetUserId) {
    try {
      this.metrics.totalRead++;
      this.metrics.lastUpdated = new Date();
      
      // Log to database for analytics
      await this.logNotificationEvent('read', notificationId, type, targetUserId);
      
      console.log(`📊 Notification read tracked: ${notificationId} (${type})`);
    } catch (error) {
      console.error('❌ Error tracking notification read:', error);
    }
  }

  /**
   * Update average delivery time
   */
  updateAverageDeliveryTime(deliveryTime) {
    const totalDelivered = this.metrics.totalDelivered;
    if (totalDelivered === 1) {
      this.metrics.averageDeliveryTime = deliveryTime;
    } else {
      this.metrics.averageDeliveryTime = 
        ((this.metrics.averageDeliveryTime * (totalDelivered - 1)) + deliveryTime) / totalDelivered;
    }
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate() {
    const total = this.metrics.totalSent;
    if (total === 0) return 0;
    
    this.metrics.successRate = ((total - this.metrics.totalFailed) / total) * 100;
    return this.metrics.successRate;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    this.calculateSuccessRate();
    return {
      ...this.metrics,
      successRate: this.metrics.successRate.toFixed(2) + '%'
    };
  }

  /**
   * Get detailed analytics
   */
  async getDetailedAnalytics(timeRange = '24h') {
    try {
      const now = new Date();
      let startTime;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Get notification statistics
      const notifications = await Notification.find({
        createdAt: { $gte: startTime }
      });

      const stats = {
        total: notifications.length,
        byType: {},
        byStatus: {
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0
        },
        byHour: {},
        topUsers: {},
        averageDeliveryTime: 0,
        successRate: 0
      };

      // Process notifications
      notifications.forEach(notification => {
        // Count by type
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Count by status
        if (notification.delivered) stats.byStatus.delivered++;
        if (notification.read) stats.byStatus.read++;
        if (notification.pushSent) stats.byStatus.sent++;
        
        // Count by hour
        const hour = new Date(notification.createdAt).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        
        // Count by user
        const userId = notification.userId.toString();
        stats.topUsers[userId] = (stats.topUsers[userId] || 0) + 1;
      });

      // Calculate success rate
      const totalSent = stats.byStatus.sent;
      const totalDelivered = stats.byStatus.delivered;
      stats.successRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) + '%' : '0%';

      return stats;

    } catch (error) {
      console.error('❌ Error getting detailed analytics:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId, 'notificationSettings');
      return user?.notificationSettings || {
        pushNotifications: true,
        emailNotifications: true,
        orderUpdates: true,
        promotionalOffers: true,
        securityAlerts: true
      };
    } catch (error) {
      console.error('❌ Error getting user notification preferences:', error);
      return null;
    }
  }

  /**
   * Check if user should receive notification
   */
  async shouldSendNotification(userId, type) {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);
      if (!preferences) return false;

      // Check if user has disabled all notifications
      if (!preferences.pushNotifications) return false;

      // Check specific notification types
      switch (type) {
        case 'order':
        case 'order_status':
        case 'customer_order_updated':
        case 'seller_new_order':
          return preferences.orderUpdates;
        case 'promotion':
        case 'promotional':
          return preferences.promotionalOffers;
        case 'security':
        case 'security_alert':
          return preferences.securityAlerts;
        default:
          return true; // Allow other types by default
      }
    } catch (error) {
      console.error('❌ Error checking notification preferences:', error);
      return true; // Default to sending if check fails
    }
  }

  /**
   * Log notification event to database
   */
  async logNotificationEvent(event, notificationId, type, targetUserId, error = null, deliveryTime = null) {
    try {
      // This would typically go to a separate analytics collection
      // For now, we'll just log to console
      console.log(`📊 Notification Event: ${event}`, {
        notificationId,
        type,
        targetUserId,
        error,
        deliveryTime,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('❌ Error logging notification event:', err);
    }
  }

  /**
   * Get notification health status
   */
  async getHealthStatus() {
    try {
      const metrics = this.getMetrics();
      const recentAnalytics = await this.getDetailedAnalytics('1h');
      
      const health = {
        status: 'healthy',
        metrics,
        recentActivity: recentAnalytics,
        alerts: []
      };

      // Check for issues
      if (metrics.successRate < 90) {
        health.alerts.push({
          type: 'warning',
          message: `Low success rate: ${metrics.successRate}`
        });
        health.status = 'degraded';
      }

      if (metrics.averageDeliveryTime > 5000) {
        health.alerts.push({
          type: 'warning',
          message: `Slow delivery time: ${metrics.averageDeliveryTime}ms`
        });
        health.status = 'degraded';
      }

      if (metrics.totalFailed > metrics.totalSent * 0.1) {
        health.alerts.push({
          type: 'error',
          message: `High failure rate: ${metrics.totalFailed} failures`
        });
        health.status = 'unhealthy';
      }

      return health;
    } catch (error) {
      console.error('❌ Error getting health status:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const notificationMonitoringService = new NotificationMonitoringService();

module.exports = notificationMonitoringService;
