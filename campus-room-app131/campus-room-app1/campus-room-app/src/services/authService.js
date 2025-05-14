/**
 * Auth Service
 * 
 * In a real application, these functions would call an API.
 * For this demo, we're using localStorage and sessionStorage.
 */

// Initialize users if not exists
const initializeUsers = () => {
    const storedUsers = localStorage.getItem('users');
    
    if (!storedUsers) {
      const defaultUsers = [
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin'
        },
        {
          firstName: 'Professor',
          lastName: 'Smith',
          email: 'professor@example.com',
          password: 'prof123',
          role: 'professor'
        },
        {
          firstName: 'Student',
          lastName: 'Jones',
          email: 'student@example.com',
          password: 'student123',
          role: 'student'
        }
      ];
      
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    
    return JSON.parse(storedUsers);
  };
  
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} Result object { success, user, message }
   */
  export const login = (email, password) => {
    const users = initializeUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Remove password for security before storing in session
      const { password, ...userWithoutPassword } = user;
      sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };
  
  /**
   * Register a new user
   * @param {Object} userData - User data (firstName, lastName, email, password, role)
   * @returns {Object} Result object { success, message }
   */
  export const register = (userData) => {
    const users = initializeUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === userData.email)) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Add new user
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true, message: 'Account created successfully' };
  };
  
  /**
   * Logout the current user
   */
  export const logout = () => {
    sessionStorage.removeItem('currentUser');
  };
  
  /**
   * Get the current user
   * @returns {Object|null} Current user or null if not logged in
   */
  export const getCurrentUser = () => {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  };
  
  /**
   * Reset password (mock implementation)
   * @param {string} email - User email
   * @returns {Object} Result object { success, message }
   */
  export const resetPassword = (email) => {
    const users = initializeUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      return { success: true, message: 'Password reset link has been sent to your email' };
    }
    
    return { success: false, message: 'No account found with this email' };
  };
  
  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updatedData - Updated user data
   * @returns {Object} Result object { success, user, message }
   */
  export const updateProfile = (userId, updatedData) => {
    const users = initializeUsers();
    const userIndex = users.findIndex(u => u.email === userId);
    
    if (userIndex !== -1) {
      // Update user data
      users[userIndex] = { ...users[userIndex], ...updatedData };
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current user in session if it's the logged-in user
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.email === userId) {
        const { password, ...userWithoutPassword } = users[userIndex];
        sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      }
      
      return { success: true, user: users[userIndex], message: 'Profile updated successfully' };
    }
    
    return { success: false, message: 'User not found' };
  };
  
  export default {
    login,
    register,
    logout,
    getCurrentUser,
    resetPassword,
    updateProfile
  };