import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add JWT token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't override Content-Type if it's multipart/form-data (for file uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; // Let axios set it automatically with boundary
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Here you could handle token refresh if implemented
      // For now, just logout the user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// File upload API calls
export const fileAPI = {
  // Upload an image file
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return instance.post('/uploads/images', formData);
  }
};

// Auth API calls
export const authAPI = {
  login: (email, password, rememberMe) => {
    console.log('Login request:', { email, password, rememberMe });
    return instance.post('/auth/login', { email, password, rememberMe });
  },

  register: (userData) => {
    console.log('Register request:', userData);
    return instance.post('/auth/register', userData);
  },
  
  forgotPassword: (email) => {
    return instance.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token, password, confirmPassword) => {
    return instance.post('/auth/reset-password', { token, password, confirmPassword });
  },
};

// Enhanced Student API calls with robust fallback mechanisms
export const studentAPI = {
  // Get all study rooms
  getStudyRooms: () => {
    console.log('Fetching study rooms...');
    return instance.get('/api/student/study-rooms')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.get('/student/study-rooms')
          .catch(secondErr => {
            console.log('Trying rooms API endpoint');
            return instance.get('/api/rooms/study-rooms');
          });
      });
  },
  
  // Request a study room reservation
  requestStudyRoomReservation: (requestData) => {
    console.log('Requesting study room reservation:', requestData);
    return instance.post('/api/student/study-room-reservations', requestData)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.post('/student/study-room-reservations', requestData)
          .catch(secondErr => {
            console.log('Trying general reservations endpoint');
            return instance.post('/api/reservations/request', requestData);
          });
      });
  },
  
  // Update a study room reservation
  updateStudyRoomReservation: (id, requestData) => {
    console.log('Updating study room reservation:', id);
    return instance.put(`/api/student/study-room-reservations/${id}`, requestData)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.put(`/student/study-room-reservations/${id}`, requestData)
          .catch(secondErr => {
            console.log('Trying general reservations endpoint');
            return instance.put(`/api/reservations/${id}`, requestData);
          });
      });
  },
  
  // Get student's reservations
  getMyReservations: () => {
    console.log('Fetching my reservations...');
    return instance.get('/api/student/my-reservations')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.get('/student/my-reservations')
          .catch(secondErr => {
            console.log('Trying general my-reservations endpoint');
            return instance.get('/api/reservations/my');
          });
      });
  },
  
  // Cancel a reservation
  cancelReservation: (id) => {
    console.log('Cancelling reservation:', id);
    return instance.put(`/api/student/reservations/${id}/cancel`)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.put(`/student/reservations/${id}/cancel`)
          .catch(secondErr => {
            console.log('Trying general cancellation endpoint');
            return instance.put(`/api/reservations/${id}/cancel`);
          });
      });
  },
  
  // Search available study rooms
  searchAvailableStudyRooms: (criteria) => {
    console.log('Searching available study rooms with criteria:', criteria);
    return instance.post('/api/student/study-rooms/search', criteria)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.post('/student/study-rooms/search', criteria)
          .catch(secondErr => {
            console.log('Trying general search endpoint');
            return instance.post('/api/rooms/search', criteria);
          });
      });
  },
  
  // Get study room by ID
  getStudyRoomById: (id) => {
    console.log('Fetching study room by ID:', id);
    return instance.get(`/api/student/study-rooms/${id}`)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.get(`/student/study-rooms/${id}`)
          .catch(secondErr => {
            console.log('Trying general rooms endpoint');
            return instance.get(`/api/rooms/study-rooms/${id}`);
          });
      });
  },
  
  // Get student's timetable
  getMyTimetable: () => {
    console.log('Fetching my timetable...');
    return instance.get('/api/student/timetable')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return instance.get('/student/timetable')
          .catch(secondErr => {
            console.log('Trying general timetable endpoint');
            return instance.get('/api/timetable/my-timetable');
          });
      });
  }
};

// Professor reservation API calls - Updated for more robust handling
export const professorAPI = {
  // Get professor's own reservations - FIXED to match the controller endpoint
  getProfessorReservations: () => {
    return instance.get('/professor/reservations');
  },
  
  // Add fallback method to handle both endpoint patterns
  getMyReservations: () => {
    // First try the "my-reservations" endpoint
    return instance.get('/professor/reservations/my-reservations')
      .catch(error => {
        console.log('Falling back to main endpoint');
        // If it fails, try the main endpoint
        return instance.get('/professor/reservations');
      });
  },
  
  // Search for available classrooms
  searchAvailableClassrooms: (criteria) => {
    return instance.post('/professor/reservations/search', criteria);
  },
  
  // Submit a reservation request
  requestReservation: (data) => {
    return instance.post('/professor/reservations/request', data);
  },
  
  // Cancel a reservation - FIXED direct API call
  cancelReservation: (id) => {
    return instance.put(`/professor/reservations/${id}/cancel`);
  },
  
  // Edit a reservation - NEW direct endpoint for updates
  updateReservation: (id, data) => {
    return instance.put(`/professor/reservations/${id}`, data);
  }
};

// Admin API calls
export const adminAPI = {
  // Get dashboard statistics
  getDashboardStats: () => {
    return instance.get('/admin/dashboard/stats');
  },
  
  // Get notifications
  getNotifications: () => {
    return instance.get('/admin/dashboard/notifications');
  },
  
  // Get recent reservations
  getRecentReservations: () => {
    return instance.get('/admin/dashboard/recent-reservations');
  },
  
  // Get pending demands
  getPendingDemands: () => {
    return instance.get('/admin/dashboard/pending-demands');
  },
  
  // Approve a reservation
  approveReservation: (id) => {
    return instance.put(`/admin/approve-reservation/${id}`);
  },
  
  // Reject a reservation with reason
  rejectReservation: (id, reason) => {
    return instance.put(`/admin/reject-reservation/${id}`, { reason });
  },
  
  // Get user notifications
  getUserNotifications: (userId) => {
    return instance.get(`/admin/user-notifications/${userId}`);
  }
};

// Reservation API calls
export const reservationAPI = {
  // Get all reservations
  getAllReservations: () => {
    return instance.get('/reservations');
  },
  
  // Get reservations by status
  getReservationsByStatus: (status) => {
    return instance.get(`/reservations/status/${status}`);
  },
  
  // Get pending demands
  getPendingDemands: () => {
    return instance.get('/reservations/pending');
  },
  
  // Approve a reservation
  approveReservation: (id) => {
    return instance.put(`/reservations/${id}/approve`);
  },
  
  // Reject a reservation with reason
  rejectReservation: (id, reason) => {
    return instance.put(`/reservations/${id}/reject`, { reason });
  },
  
  // Cancel a reservation
  cancelReservation: (id) => {
    return instance.put(`/reservations/${id}/cancel`);
  }
};

// Room API calls
export const roomAPI = {
  // Get all classrooms
  getAllClassrooms: () => {
    return instance.get('/rooms/classrooms');
  },
  
  // Get a specific classroom by ID
  getClassroomById: (id) => {
    return instance.get(`/rooms/classrooms/${id}`);
  },
  
  // Get all study rooms
  getAllStudyRooms: () => {
    return instance.get('/rooms/study-rooms');
  },
  
  // Get available classrooms based on criteria
  searchAvailableRooms: (date, startTime, endTime, type, minCapacity) => {
    return instance.get('/rooms/search', {
      params: { date, startTime, endTime, type, minCapacity }
    });
  },
  
  // Check classroom availability for a specific date
  checkClassroomAvailability: (id, date) => {
    return instance.get(`/rooms/classrooms/${id}/availability`, {
      params: { date }
    });
  }
};

// Notification API calls
export const notificationAPI = {
  // Get all notifications for current user
  getCurrentUserNotifications: () => {
    return instance.get('/notifications');
  },
  
  // Get unread notifications for current user
  getUnreadNotifications: () => {
    return instance.get('/notifications/unread');
  },
  
  // Get count of unread notifications
  getUnreadCount: () => {
    return instance.get('/notifications/count');
  },
  
  // Mark a notification as read
  markAsRead: (id) => {
    return instance.put(`/notifications/${id}/read`);
  },
  
  // Mark all notifications as read
  markAllAsRead: () => {
    return instance.put('/notifications/read-all');
  },
  
  // Send a reservation status notification email
  sendReservationStatusEmail: (reservationId, status, reason) => {
    return instance.post('/notifications/reservation-status', {
      reservationId,
      status,
      reason
    });
  },
  
  // Send notification about new reservation
  notifyAboutNewReservation: (reservationData) => {
    return instance.post('/notifications/new-reservation', { reservationData });
  }
};

// Timetable API calls - NEW
export const timetableAPI = {
  // Get a user's timetable
  getUserTimetable: (userId) => {
    return instance.get(`/users/${userId}/timetable`);
  },
  
  // Get current user's timetable
  getMyTimetable: () => {
    return instance.get('/api/timetable/my-timetable');
  },
  
  // Update a user's timetable
  updateTimetable: (userId, timetableEntries) => {
    return instance.put(`/users/${userId}/timetable`, timetableEntries);
  },
  
  // Add a single timetable entry
  addTimetableEntry: (userId, entryData) => {
    return instance.post(`/users/${userId}/timetable/entry`, entryData);
  },
  
  // Remove a timetable entry
  removeTimetableEntry: (userId, entryId) => {
    return instance.delete(`/users/${userId}/timetable/entry/${entryId}`);
  },
  
  // Export timetable to various formats
  exportTimetable: (userId, format = 'ics') => {
    return instance.get(`/users/${userId}/timetable/export`, { 
      params: { format },
      responseType: 'blob' 
    });
  },
  
  // For future implementation - timetable sharing
  shareTimetable: (userId, shareWith) => {
    return instance.post(`/users/${userId}/timetable/share`, { shareWith });
  }
};

// Profile API calls - NEW
export const profileAPI = {
  // Get current user profile
  getUserProfile: () => {
    return instance.get('/profile');
  },
  
  // Update user profile
  updateProfile: (profileData) => {
    return instance.put('/profile', profileData);
  },
  
  // Change password
  changePassword: (passwordData) => {
    return instance.put('/profile/password', passwordData);
  },
  
  // Get current user info
  getUserInfo: () => {
    return instance.get('/profile/user-info');
  }
};

// User API calls - UPDATED to include timetable methods
export const userAPI = {
  // Get all users
  getAllUsers: () => {
    return instance.get('/users');
  },
  // Add this to your userAPI object
deleteUser: (id) => {
  return instance.delete(`/users/${id}`);
},
  // Get user by ID
  getUserById: (id) => {
    return instance.get(`/users/${id}`);
  },
  
  // Get current user profile
  getUserProfile: () => {
    return instance.get('/users/profile');
  },
  
  // Update user profile
  updateUserProfile: (userData) => {
    return instance.put('/users/profile', userData);
  },
  
  // Change password
  changePassword: (passwordData) => {
    return instance.put('/users/change-password', passwordData);
  },
  
  // Get users by role
  getUsersByRole: (role) => {
    return instance.get(`/users/role/${role}`);
  },
  
  // NEW: Get user's timetable
  getUserTimetable: (userId) => {
    return instance.get(`/users/${userId}/timetable`);
  },
  
  // NEW: Update user's timetable
  updateUserTimetable: (userId, timetableEntries) => {
    return instance.put(`/users/${userId}/timetable`, timetableEntries);
  },
  
  // NEW: Toggle user status (activate/deactivate)
  toggleUserStatus: (userId, status) => {
    return instance.put(`/users/${userId}/status`, { status });
  }
};

// Export the default axios instance
export default instance;

// Export API services
export const API = {
  instance,
  fileAPI,
  authAPI,
  studentAPI,  // Enhanced studentAPI implementation
  professorAPI,
  adminAPI,
  reservationAPI,
  roomAPI,
  notificationAPI,
  timetableAPI,
  profileAPI,
  userAPI,
  get: instance.get,
  post: instance.post,
  put: instance.put,
  delete: instance.delete
};