import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';
import ProfileService from '../services/ProfileService';

// Create auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in via localStorage - Improved implementation
  useEffect(() => {
    const checkLoggedInUser = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('Checking authentication status...');
        
        if (storedToken && storedUser) {
          try {
            // Validate JSON format
            const parsedUser = JSON.parse(storedUser);
            
            // Ensure the parsed user has the necessary properties
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
              console.log('User authenticated from localStorage:', parsedUser.email, 'Role:', parsedUser.role);
              setCurrentUser(parsedUser);
            } else {
              console.warn('Stored user data is invalid, clearing localStorage');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (e) {
            console.error('Error parsing stored user data:', e);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          console.log('No stored authentication found');
          if (!storedToken && storedUser) {
            // Token missing but user exists - clear for consistency
            localStorage.removeItem('user');
          } else if (storedToken && !storedUser) {
            // User missing but token exists - clear for consistency
            localStorage.removeItem('token');
          }
        }
      } catch (e) {
        console.error('Error checking authentication status:', e);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedInUser();
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authAPI.login(email, password, rememberMe);
      const userData = response.data;
      
      if (userData.success !== false) {
        console.log('Login successful for:', email);
        
        // Store token and user info
        localStorage.setItem('token', userData.token);
        
        const userToStore = {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role.toLowerCase(),
          status: 'active' // We know it's active if login succeeded
        };
        
        localStorage.setItem('user', JSON.stringify(userToStore));
        setCurrentUser(userToStore);
        
        return { success: true, user: userData };
      } else {
        console.warn('Login failed for:', email, 'Reason:', userData.message);
        return { success: false, message: userData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to log in' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create an account' 
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('User logged out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Request password reset function (forgot password)
  const resetPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  // Reset password with token function
  const resetPasswordWithToken = async (token, password, confirmPassword) => {
    try {
      const response = await authAPI.resetPassword(token, password, confirmPassword);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Password reset with token error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  // Update user profile - now uses ProfileService
  const updateUserProfile = async (profileData) => {
    try {
      const response = await ProfileService.updateProfile(profileData);
      
      if (response.success) {
        // Update the current user in state and localStorage
        if (currentUser && profileData.id && currentUser.id === profileData.id) {
          const updatedUser = updateCurrentUser({
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            department: profileData.department,
            phone: profileData.phone
          });
          
          console.log('User profile updated in auth context:', updatedUser);
        }
        
        return { 
          success: true, 
          message: response.message || 'Profile updated successfully',
          profile: response.profile
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Failed to update profile' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  // Change password - now uses ProfileService
  const changePassword = async (passwordData) => {
    try {
      const response = await ProfileService.changePassword(passwordData);
      
      return { 
        success: response.success, 
        message: response.message || 'Password changed successfully' 
      };
    } catch (error) {
      console.error('Password change error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to change password' 
      };
    }
  };

  // Update current user data in state and localStorage
  const updateCurrentUser = (updatedUserData) => {
    if (currentUser && updatedUserData) {
      // Create updated user with new data
      const updatedUser = {
        ...currentUser,
        ...updatedUserData
      };
      
      // Update state
      setCurrentUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    }
    return currentUser;
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    resetPasswordWithToken,
    updateUserProfile,
    changePassword,
    updateCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;