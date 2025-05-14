// src/services/NotificationService.js
import API from '../api';

/**
 * Service for handling user notifications
 */
class NotificationService {
  /**
   * Fetch all notifications for the current user
   * 
   * @returns {Promise<Array>} - Array of notification objects
   */
  async getCurrentUserNotifications() {
    try {
      // Try using the notificationAPI first
      if (API.notificationAPI && API.notificationAPI.getAllNotifications) {
        const response = await API.notificationAPI.getAllNotifications();
        return response.data;
      }
      
      // Fallback to direct API call
      const response = await API.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user notifications:', error);
      
      // Try alternative endpoint as a second fallback
      try {
        const response = await API.get('/api/notifications/current');
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback notification fetch failed:', fallbackError);
        
        // Return empty array as last resort
        return [];
      }
    }
  }

  /**
   * Fetch unread notifications for the current user
   * 
   * @returns {Promise<Array>} - Array of unread notification objects
   */
  async getUnreadNotifications() {
    try {
      // Try using the notificationAPI first
      if (API.notificationAPI && API.notificationAPI.getUnreadNotifications) {
        const response = await API.notificationAPI.getUnreadNotifications();
        return response.data;
      }
      
      // Fallback to direct API call
      const response = await API.get('/api/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
      
      // Try from localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        return allNotifications.filter(notification => !notification.read);
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        // Return empty array as fallback
        return [];
      }
    }
  }

  /**
   * Get count of unread notifications
   * 
   * @returns {Promise<number>} - Count of unread notifications
   */
  async getUnreadCount() {
    try {
      // Try using the notificationAPI first
      if (API.notificationAPI && API.notificationAPI.getUnreadCount) {
        const response = await API.notificationAPI.getUnreadCount();
        return response.data.count;
      }
      
      // Fallback to direct API call
      const response = await API.get('/api/notifications/count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      
      // Try from localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        return allNotifications.filter(notification => !notification.read).length;
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        // Return 0 as fallback
        return 0;
      }
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  async markAsRead(id) {
    try {
      // Try using the notificationAPI first
      if (API.notificationAPI && API.notificationAPI.markAsRead) {
        const response = await API.notificationAPI.markAsRead(id);
        return response.data;
      }
      
      // Fallback to direct API call
      const response = await API.put(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      
      // Try updating in localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        const updatedNotifications = allNotifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
        return updatedNotifications.find(notification => notification.id === id);
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        throw error;
      }
    }
  }

  /**
   * Mark all notifications as read
   * 
   * @returns {Promise<Object>} - Result of the operation
   */
  async markAllAsRead() {
    try {
      // Try using the notificationAPI first
      if (API.notificationAPI && API.notificationAPI.markAllAsRead) {
        const response = await API.notificationAPI.markAllAsRead();
        return response.data;
      }
      
      // Fallback to direct API call
      const response = await API.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      
      // Try updating in localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        const updatedNotifications = allNotifications.map(notification => ({ ...notification, read: true }));
        localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
        return { success: true, message: 'All notifications marked as read in local storage' };
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        throw error;
      }
    }
  }

  /**
   * Create a notification for a specific user
   * 
   * @param {string|number} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} iconClass - CSS class for notification icon
   * @param {string} iconColor - Color for notification icon
   * @returns {Promise<Object>} - Created notification
   */
  async createNotification(userId, title, message, iconClass = 'fas fa-bell', iconColor = 'blue') {
    try {
      // Try using a direct API call
      const response = await API.post('/api/notifications/create', {
        userId,
        title,
        message,
        iconClass,
        iconColor
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      
      // Store in localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        const newNotification = {
          id: `local_${Date.now()}`,
          userId,
          title,
          message,
          iconClass,
          iconColor,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        allNotifications.push(newNotification);
        localStorage.setItem('userNotifications', JSON.stringify(allNotifications));
        return newNotification;
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        throw error;
      }
    }
  }

  /**
   * Get all notifications for a specific user
   * 
   * @param {string|number} userId - User ID
   * @returns {Promise<Array>} - Array of notifications
   */
  async getUserNotifications(userId) {
    try {
      // Try using a direct API call
      const response = await API.get(`/api/notifications/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch notifications for user ${userId}:`, error);
      
      // Try from localStorage if API fails
      try {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        return allNotifications.filter(notification => notification.userId === userId);
      } catch (storageError) {
        console.error('LocalStorage fallback failed:', storageError);
        return [];
      }
    }
  }
}

// Export a singleton instance
export default new NotificationService();