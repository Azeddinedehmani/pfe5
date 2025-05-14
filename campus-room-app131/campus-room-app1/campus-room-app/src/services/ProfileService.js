// src/services/ProfileService.js
import { API } from '../api';
import axios from 'axios'; // Add this import

class ProfileService {
  /**
   * Get the current user's profile
   * @returns {Promise} Promise object with profile data
   */
  // Improve error handling in ProfileService.js
getUserProfile() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('ProfileService: Fetching user profile');
      
      // Try with the direct API path first
      try {
        const response = await API.profileAPI.getUserProfile();
        
        if (response && response.data) {
          console.log('ProfileService: Profile data received:', response.data);
          resolve(response.data);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (error) {
        console.error('Error in primary profile fetch:', error);
        
        // If this is an auth error, reject with that specific error
        if (error.isAuthError) {
          return reject(error);
        }
        
        // Fall back to using locally stored user data instead
        console.warn('Could not fetch profile data from server. Using locally stored data instead.');
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            resolve({
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              role: user.role || '',
              department: user.department || '',
              phone: user.phone || ''
            });
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            reject({
              success: false,
              message: 'Could not parse locally stored user data'
            });
          }
        } else {
          reject({
            success: false,
            message: 'No profile data available'
          });
        }
      }
    } catch (error) {
      console.error('Fatal error in profile service:', error);
      reject(error);
    }
  });
}

  /**
   * Update the user's profile
   * @param {Object} profileData - The updated profile data
   * @returns {Promise} Promise object with update result
   */
  updateProfile(profileData) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('ProfileService: Updating profile with data:', profileData);
        
        // Make sure the ID is present
        if (!profileData.id) {
          console.error('Profile data missing ID');
          return reject({
            success: false,
            message: 'Profile data missing ID'
          });
        }
        
        const response = await API.profileAPI.updateProfile(profileData);
        console.log('ProfileService: Update response:', response.data);
        
        // Handle response based on structure
        if (response.data && typeof response.data === 'object') {
          if (response.data.profile) {
            // If the response contains a profile object
            resolve({
              success: true,
              profile: response.data.profile,
              message: response.data.message || 'Profile updated successfully'
            });
          } else if (response.data.success !== undefined) {
            // If the response directly contains success
            resolve({
              success: response.data.success,
              profile: response.data,
              message: response.data.message
            });
          } else {
            // Assume the response data is the profile object
            resolve({
              success: true,
              profile: response.data,
              message: 'Profile updated successfully'
            });
          }
        } else {
          resolve({
            success: false,
            message: 'Invalid response from server'
          });
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        // Enhanced error handling with more detailed information
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
          
          reject({
            success: false,
            status: error.response.status,
            message: error.response.data?.message || 'Failed to update profile'
          });
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          reject({
            success: false,
            message: 'No response from server. Please check your connection.'
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          reject({
            success: false,
            message: error.message || 'Failed to update profile'
          });
        }
      }
    });
  }

  /**
   * Change the user's password
   * @param {Object} passwordData - The password change data
   * @returns {Promise} Promise object with change result
   */
  changePassword(passwordData) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('ProfileService: Changing password');
        
        // Validate password data
        if (!passwordData.currentPassword) {
          return reject({
            success: false,
            message: 'Current password is required'
          });
        }
        
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
          return reject({
            success: false,
            message: 'New password and confirmation are required'
          });
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          return reject({
            success: false,
            message: 'New passwords do not match'
          });
        }
        
        const response = await API.profileAPI.changePassword(passwordData);
        console.log('ProfileService: Password change response received');
        
        // Handle response based on structure
        if (response.data && typeof response.data === 'object') {
          if (response.data.success !== undefined) {
            resolve({
              success: response.data.success,
              message: response.data.message
            });
          } else {
            resolve({
              success: true,
              message: 'Password changed successfully'
            });
          }
        } else {
          resolve({
            success: false,
            message: 'Invalid response from server'
          });
        }
      } catch (error) {
        console.error('Error changing password:', error);
        
        // Enhanced error handling
        if (error.response) {
          // Server responded with error
          const errorMessage = error.response.data?.message || 'Failed to change password';
          
          // Look for specific error messages that might help users
          let userFriendlyMessage = errorMessage;
          if (errorMessage.includes('incorrect') || errorMessage.includes('wrong')) {
            userFriendlyMessage = 'Current password is incorrect';
          } else if (errorMessage.includes('complexity') || errorMessage.includes('requirements')) {
            userFriendlyMessage = 'New password does not meet complexity requirements';
          }
          
          reject({
            success: false,
            status: error.response.status,
            message: userFriendlyMessage
          });
        } else if (error.request) {
          // No response received
          reject({
            success: false,
            message: 'No response from server. Please check your connection.'
          });
        } else {
          // Request setup error
          reject({
            success: false,
            message: error.message || 'Failed to change password'
          });
        }
      }
    });
  }

  /**
   * Get user information
   * @returns {Promise} Promise object with user info
   */
  getUserInfo() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('ProfileService: Fetching user info');
        const response = await API.profileAPI.getUserInfo();
        console.log('ProfileService: User info received');
        resolve(response.data);
      } catch (error) {
        console.error('Error fetching user info:', error);
        reject(error);
      }
    });
  }
}

export default new ProfileService();