// src/services/SettingsService.js
import API from '../api';

/**
 * Service for managing application settings
 * This service centralizes access to system settings across the application
 */
class SettingsService {
  /**
   * Cache for system settings
   * @private
   */
  _settingsCache = null;

  /**
   * Timestamp when settings were last fetched
   * @private
   */
  _lastFetched = null;

  /**
   * Subscriptions to settings changes
   * @private
   */
  _subscribers = [];

  /**
   * Force refresh the settings from the backend
   * @returns {Promise<Object>} The system settings
   */
  async refreshSettings() {
    try {
      const response = await API.get('/settings');
      const settings = response.data;
      
      // Update cache and timestamp
      this._settingsCache = settings;
      this._lastFetched = Date.now();
      
      // Save to localStorage for offline access
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      // Notify subscribers
      this._notifySubscribers(settings);
      
      return settings;
    } catch (error) {
      console.error('Error refreshing settings:', error);
      
      // Try to get from localStorage as fallback
      const cachedSettings = localStorage.getItem('systemSettings');
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
      
      // If all else fails, return default settings
      return this._getDefaultSettings();
    }
  }

  /**
   * Get the system settings, using cache if available and recent
   * @param {boolean} [forceRefresh=false] Whether to force a refresh from the server
   * @returns {Promise<Object>} The system settings
   */
  async getSettings(forceRefresh = false) {
    // If we have cached settings and they're recent (less than 5 minutes old)
    const cacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isCacheValid = this._settingsCache && 
                        this._lastFetched && 
                        (Date.now() - this._lastFetched < cacheDuration);
    
    if (!forceRefresh && isCacheValid) {
      return this._settingsCache;
    }
    
    return this.refreshSettings();
  }

  /**
   * Update the system settings
   * @param {Object} updatedSettings The settings to update
   * @returns {Promise<Object>} The updated settings
   */
  async updateSettings(updatedSettings) {
    try {
      const response = await API.put('/settings', updatedSettings);
      const settings = response.data;
      
      // Update cache and timestamp
      this._settingsCache = settings;
      this._lastFetched = Date.now();
      
      // Save to localStorage for offline access
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      // Notify subscribers
      this._notifySubscribers(settings);
      
      return settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Subscribe to settings changes
   * @param {Function} callback Function to call when settings change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this._subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers of settings changes
   * @private
   * @param {Object} settings The updated settings
   */
  _notifySubscribers(settings) {
    this._subscribers.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('Error in settings subscriber callback:', error);
      }
    });
  }

  /**
   * Get default settings as fallback
   * @private
   * @returns {Object} Default settings
   */
  _getDefaultSettings() {
    return {
      systemName: 'Campus Room',
      tagline: 'Smart Classroom Management System',
      contactEmail: 'admin@campusroom.edu',
      supportPhone: '(555) 123-4567',
      autoApproveAdmin: true,
      autoApproveProfessor: false,
      autoApproveStudent: false,
      emailNotifications: true,
      reservationCreated: true,
      reservationApproved: true,
      reservationRejected: true,
      newUserRegistered: true,
      systemUpdates: true,
      dailyDigest: false,
      maxDaysInAdvance: 30,
      minTimeBeforeReservation: 1,
      maxHoursPerReservation: 4,
      maxReservationsPerWeek: 5,
      studentRequireApproval: true,
      professorRequireApproval: false,
      showAvailabilityCalendar: true
    };
  }

  /**
   * Check if a reservation requires approval based on user role
   * @param {string} userRole The user role (admin, professor, student)
   * @returns {Promise<boolean>} Whether approval is required
   */
  async isApprovalRequired(userRole) {
    const settings = await this.getSettings();
    
    switch (userRole.toLowerCase()) {
      case 'admin':
        return !settings.autoApproveAdmin;
      case 'professor':
        return settings.professorRequireApproval;
      case 'student':
        return settings.studentRequireApproval;
      default:
        return true; // Default to requiring approval
    }
  }

  /**
   * Get reservation time constraints based on settings
   * @returns {Promise<Object>} Time constraints
   */
  async getReservationTimeConstraints() {
    const settings = await this.getSettings();
    
    return {
      maxDaysInAdvance: settings.maxDaysInAdvance,
      minTimeBeforeReservation: settings.minTimeBeforeReservation,
      maxHoursPerReservation: settings.maxHoursPerReservation,
      maxReservationsPerWeek: settings.maxReservationsPerWeek
    };
  }

  /**
   * Check if email notifications are enabled for a specific event
   * @param {string} eventType The event type
   * @returns {Promise<boolean>} Whether notifications are enabled
   */
  async areNotificationsEnabled(eventType) {
    const settings = await this.getSettings();
    
    // First check if email notifications are enabled at all
    if (!settings.emailNotifications) {
      return false;
    }
    
    // Then check for specific event types
    switch (eventType) {
      case 'reservationCreated':
        return settings.reservationCreated;
      case 'reservationApproved':
        return settings.reservationApproved;
      case 'reservationRejected':
        return settings.reservationRejected;
      case 'newUserRegistered':
        return settings.newUserRegistered;
      case 'systemUpdates':
        return settings.systemUpdates;
      case 'dailyDigest':
        return settings.dailyDigest;
      default:
        return false;
    }
  }
}

// Export a singleton instance
export default new SettingsService();