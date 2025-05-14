import React, { useState, useEffect } from 'react';
import NotificationService from '../../services/NotificationService';
import '../../styles/notifications.css';

const NotificationPanel = ({ userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getCurrentUserNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      // Update the local state to reflect the change
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError("Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      // Update all notifications in local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError("Failed to mark all notifications as read.");
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Unknown time";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Filter notifications based on user role if needed
  const filteredNotifications = userRole 
    ? notifications.filter(notification => {
        // Add role-specific filtering logic here if needed
        // For example, only show certain notifications to professors
        return true; // For now, show all notifications
      }) 
    : notifications;

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        {filteredNotifications.length > 0 && (
          <button 
            className="btn-mark-all"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
        <button 
          className="btn-refresh"
          onClick={loadNotifications}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      {error && <div className="notification-error">{error}</div>}
      
      {loading ? (
        <div className="notification-loading">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="notification-empty">No notifications</div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                <i className={notification.iconClass || "fas fa-bell"} style={{ color: notification.iconColor || 'blue' }}></i>
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{notification.timeAgo || getRelativeTime(notification.createdAt)}</div>
              </div>
              {!notification.read && (
                <button 
                  className="btn-mark-read"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;