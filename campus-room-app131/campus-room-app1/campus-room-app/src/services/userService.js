import { generateId } from '../utils/helpers';
import authService from './authService';

/**
 * User Service
 * 
 * In a real application, these functions would call an API.
 * For this demo, we're using localStorage.
 */

/**
 * Get all users
 * @returns {Array} Array of all users (without passwords)
 */
export const getAllUsers = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Remove passwords for security
  return users.map(({ password, ...user }) => ({
    ...user,
    id: generateId('USR'), // In a real app, users would have a proper ID
    status: 'active',  // In a real app, status would be stored in the database
    lastLogin: new Date().toISOString().split('T')[0] // Dummy data
  }));
};

/**
 * Get user by ID (email)
 * @param {string} email - User email
 * @returns {Object} User object (without password)
 */
export const getUserByEmail = (email) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} Result object { success, user, message }
 */
export const createUser = (userData) => {
  // Use the register function from authService
  const result = authService.register(userData);
  
  if (result.success) {
    return { 
      success: true, 
      user: userData, 
      message: 'User created successfully' 
    };
  }
  
  return result;
};

/**
 * Update a user
 * @param {string} email - User email
 * @param {Object} updatedData - Updated user data
 * @returns {Object} Result object { success, user, message }
 */
export const updateUser = (email, updatedData) => {
  // Use the updateProfile function from authService
  return authService.updateProfile(email, updatedData);
};

/**
 * Delete a user
 * @param {string} email - User email
 * @returns {Object} Result object { success, message }
 */
export const deleteUser = (email) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'User deleted successfully' };
  }
  
  return { success: false, message: 'User not found' };
};

/**
 * Change user status (active/inactive)
 * @param {string} email - User email
 * @param {string} status - New status
 * @returns {Object} Result object { success, message }
 */
export const changeUserStatus = (email, status) => {
  // In a real app, user status would be stored in the database
  // For this demo, we'll just return success
  return { success: true, message: `User status changed to ${status}` };
};

export default {
  getAllUsers,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus
};