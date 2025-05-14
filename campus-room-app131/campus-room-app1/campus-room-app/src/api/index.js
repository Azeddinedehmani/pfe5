// api/index.js
import axios from 'axios';

// Configure base URL for API requests
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable CORS credentials
  withCredentials: true
});

console.log('API baseURL configured as:', API.defaults.baseURL);

// Add a response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.log("Authentication error detected - token expired or invalid");
      
      // Mark as retried to prevent infinite loops
      originalRequest._retry = true;
      
      // Check if it's a token validation error
      const isTokenError = error.response.data && 
                          (error.response.data.error === 'invalid_token' || 
                           error.response.data.message?.toLowerCase().includes('token') ||
                           error.response.data.message?.toLowerCase().includes('unauthorized'));
      
      // Clear authentication
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Add a timestamp to prevent immediate relogin issues
      sessionStorage.setItem('auth_error_timestamp', Date.now().toString());
      
      // Create enhanced error with more detailed information
      return Promise.reject({
        ...error,
        isAuthError: true,
        errorType: isTokenError ? 'token_error' : 'unauthorized',
        message: isTokenError 
          ? "Your authentication token has expired or is invalid. Please log in again." 
          : "Your session has expired. Please log in again.",
        timestamp: Date.now()
      });
    }
    // Handle network errors that might also be related to auth
    if (!error.response && error.request) {
      console.log("Network error detected - could be connectivity issue or server down");
      
      // Check if we have a token but getting network errors
      // This could indicate a server issue or blocked requests
      const token = localStorage.getItem('token');
      if (token) {
        console.log("Network error with existing token - could be server unavailable");
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to add JWT token to requests
API.interceptors.request.use(
  (config) => {
    // Get and validate token
    const token = localStorage.getItem('token');
    const isTokenValid = validateToken(token);
    
    console.log('Request to:', config.url, '- Token exists:', !!token, '- Token valid:', isTokenValid);
    
    if (token && isTokenValid) {
      // Add token to Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Add request timestamp for potential request timeout detection
      config.metadata = { startTime: new Date().getTime() };
    } else if (token && !isTokenValid) {
      // If token exists but is invalid, remove it
      console.log('Invalid token detected, removing from localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Don't override Content-Type if it's multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Basic token validation function
function validateToken(token) {
  if (!token) return false;
  
  try {
    // Check if token has valid JWT format (header.payload.signature)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    // Decode the middle part (payload)
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check if token is expired
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    if (expiryTime < currentTime) {
      console.log('Token expired at:', new Date(expiryTime).toISOString());
      console.log('Current time:', new Date(currentTime).toISOString());
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error validating token:', e);
    return false;
  }
}

// Add response time tracking to all requests
API.interceptors.response.use(
  (response) => {
    // Calculate request duration if metadata exists
    if (response.config.metadata) {
      const endTime = new Date().getTime();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`Request to ${response.config.url} took ${duration}ms`);
      
      // Warning for slow requests
      if (duration > 5000) {
        console.warn(`Slow request detected: ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  }
);

// Debug info
console.log('API module loading correctly');

// FIX: Correct profileAPI implementation
API.profileAPI = {
  getUserProfile: () => {
    // Check token before even attempting the request
    if (!localStorage.getItem('token')) {
      return Promise.reject({
        isAuthError: true,
        message: "No authentication token found. Please log in."
      });
    }
    
    // FIXED: Use the correct path WITHOUT duplicate /api prefix
    return API.get('/profile')
      .catch(error => {
        // Don't retry if it's an auth error
        if (error.isAuthError) {
          return Promise.reject(error);
        }
        
        console.log('First profile endpoint failed, trying alternatives...', error);
        
        // Try alternative endpoint paths
        return API.get('/users/profile')
          .catch(error2 => {
            // Don't retry if it's an auth error
            if (error2.isAuthError) {
              return Promise.reject(error2);
            }
            
            console.log('Second profile endpoint failed, trying a third option...');
            
            // Try direct axios call as a last resort
            return API.get('/api/profile')
              .catch(error3 => {
                console.log('All profile endpoints failed:', error3);
                return Promise.reject(error3);
              });
          });
      });
  },
  
  updateProfile: (profileData) => {
    // Check token before attempting the request
    if (!localStorage.getItem('token')) {
      return Promise.reject({
        isAuthError: true,
        message: "No authentication token found. Please log in."
      });
    }
    
    // FIXED: Use the correct path WITHOUT duplicate /api prefix
    return API.put('/profile', profileData)
      .catch(error => {
        if (error.isAuthError) {
          return Promise.reject(error);
        }
        
        console.log('Falling back to alternative profile update endpoint');
        return API.put('/users/profile', profileData);
      });
  },
  
  changePassword: (passwordData) => {
    // Check token before attempting the request
    if (!localStorage.getItem('token')) {
      return Promise.reject({
        isAuthError: true,
        message: "No authentication token found. Please log in."
      });
    }
    
    // FIXED: Use the correct path WITHOUT duplicate /api prefix
    return API.put('/profile/password', passwordData)
      .catch(error => {
        if (error.isAuthError) {
          return Promise.reject(error);
        }
        
        console.log('Falling back to alternative password change endpoint');
        return API.put('/users/change-password', passwordData);
      });
  },
  
  getUserInfo: () => {
    // Check token before attempting the request
    if (!localStorage.getItem('token')) {
      return Promise.reject({
        isAuthError: true,
        message: "No authentication token found. Please log in."
      });
    }
    
    // FIXED: Use the correct path WITHOUT duplicate /api prefix
    return API.get('/profile/user-info')
      .catch(error => {
        if (error.isAuthError) {
          return Promise.reject(error);
        }
        
        console.log('Falling back to alternative user info endpoint');
        return API.get('/users/profile/info');
      });
  }
};

// Add this after the profileAPI implementation around line 216
API.userAPI = {
  // Get all users
  getAllUsers: () => {
    return API.get('/users');
  },
  
  // Get user by ID
  getUserById: (id) => {
    return API.get(`/users/${id}`);
  },
  
  // Toggle user status (activate/deactivate)
  toggleUserStatus: (userId, status) => {
    return API.put(`/users/${userId}/status`, { status });
  },
  
  // Other user methods you might need
  updateUser: (id, userData) => {
    return API.put(`/users/${id}`, userData);
  },
  
  deleteUser: (id) => {
    return API.delete(`/users/${id}`);
  },
  
  // Get users by role
  getUsersByRole: (role) => {
    return API.get(`/users/role/${role}`);
  }
};

// File upload API calls
API.fileAPI = {
  // Upload profile with image
  uploadProfileWithImage: (formData) => {
    return API.post('/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Upload any image file
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return API.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// FIX: Update timetableAPI to remove duplicate /api prefix
API.timetableAPI = {
  getMyTimetable: () => {
    // FIXED: Removed duplicate /api prefix
    return API.get('/timetable/my-timetable');
  },
  // Other timetable methods would be fixed similarly
  
  // Export timetable to various formats
  exportTimetable: (format = 'ics') => {
    return API.get('/timetable/my-timetable/export', { 
      params: { format },
      responseType: 'blob' 
    });
  }
};

// This is an extension for the API configuration in src/api/index.js

// Add or update the reportsAPI configuration to ensure it properly connects to the backend
API.reportsAPI = {
  // Get comprehensive report data
  getReportsData: () => {
    console.log('Calling reportsAPI.getReportsData');
    return API.get('/admin/reports');
  },
  
  // Get dashboard statistics
  getDashboardStats: () => {
    console.log('Calling reportsAPI.getDashboardStats');
    return API.get('/admin/dashboard/stats');
  },
  
  // Get CSV report data
  getCSVReport: () => {
    console.log('Calling reportsAPI.getCSVReport');
    return API.get('/admin/reports/csv', { 
      responseType: 'text'
    });
  },
  
  // Get Excel report data
  getExcelReport: () => {
    console.log('Calling reportsAPI.getExcelReport');
    return API.get('/admin/reports/excel', { 
      responseType: 'blob'
    });
  },
  
  // Get PDF report
  getPDFReport: () => {
    console.log('Calling reportsAPI.getPDFReport');
    return API.get('/admin/reports/pdf', { 
      responseType: 'blob'
    });
  },
  
  // Get popular rooms data
  getPopularRooms: () => {
    console.log('Calling reportsAPI.getPopularRooms');
    return API.get('/admin/reports/popular-rooms');
  },
  
  // Get active users data
  getActiveUsers: () => {
    console.log('Calling reportsAPI.getActiveUsers');
    return API.get('/admin/reports/active-users');
  },
  
  // Get monthly activity data
  getMonthlyActivity: () => {
    console.log('Calling reportsAPI.getMonthlyActivity');
    return API.get('/admin/reports/monthly-activity');
  },
  
  // Get reports for a specific date range
  getReportsByDateRange: (startDate, endDate) => {
    console.log(`Calling reportsAPI.getReportsByDateRange: ${startDate} to ${endDate}`);
    return API.get('/admin/reports/date-range', {
      params: { startDate, endDate }
    });
  },
  
  // Get reports by user role
  getReportsByRole: (role) => {
    console.log(`Calling reportsAPI.getReportsByRole: ${role}`);
    return API.get(`/admin/reports/role/${role}`);
  }
};

// Class Group API calls - FIXED: Removed duplicate /api prefixes
API.classGroupAPI = {
  // Get all class groups
  getAllClassGroups: () => {
    return API.get('/class-groups');
  },
  
  // Get a specific class group by ID
  getClassGroupById: (id) => {
    return API.get(`/class-groups/${id}`);
  },
  
  // Get class groups for a specific professor
  getClassGroupsByProfessor: (professorId) => {
    return API.get(`/class-groups/professor/${professorId}`);
  },
  
  // Get class groups for a specific student
  getClassGroupsByStudent: (studentId) => {
    return API.get(`/class-groups/student/${studentId}`);
  },
  
  // Create a new class group
  createClassGroup: (classGroupData) => {
    return API.post('/class-groups', classGroupData);
  },
  
  // Update a class group
  updateClassGroup: (id, classGroupData) => {
    return API.put(`/class-groups/${id}`, classGroupData);
  },
  
  // Delete a class group
  deleteClassGroup: (id) => {
    return API.delete(`/class-groups/${id}`);
  },
  
  // Add a student to a class group
  addStudentToClass: (classGroupId, studentId) => {
    return API.post(`/class-groups/${classGroupId}/students/${studentId}`);
  },
  
  // Remove a student from a class group
  removeStudentFromClass: (classGroupId, studentId) => {
    return API.delete(`/class-groups/${classGroupId}/students/${studentId}`);
  },
  
  // Update the timetable for a class group
  updateClassGroupTimetable: (classGroupId, timetableEntries) => {
    return API.put(`/class-groups/${classGroupId}/timetable`, timetableEntries);
  },
  
  // Get the timetable for a student based on their class groups
  getStudentTimetable: (studentId) => {
    return API.get(`/class-groups/student/${studentId}/timetable`);
  },
  
  // Get available students who aren't in a specific class group
  getAvailableStudents: (classGroupId) => {
    return API.get(`/class-groups/${classGroupId}/available-students`);
  }
};

// Student API Implementation with robust fallback mechanisms
API.studentAPI = {
  // Existing methods
  getStudyRooms: () => {
    console.log('Fetching study rooms...');
    return API.get('/student/study-rooms')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.get('/api/student/study-rooms')
          .catch(secondErr => {
            console.log('Trying rooms API endpoint');
            return API.get('/rooms/study-rooms');
          });
      });
  },
  
  // In your API.studentAPI object, update/add these methods:

// Search available classrooms using the correct endpoint
searchAvailableClassrooms: (criteria) => {
  console.log('Student searching available classrooms with criteria:', criteria);
  return API.post('/student/classroom-reservations/search', criteria)
    .catch(err => {
      console.error('Error with student search endpoint, trying fallback:', err);
      // Try the room search endpoint as fallback
      return API.post('/rooms/search', criteria);
    });
},

// In your API.studentAPI object
requestClassroomReservation: (requestData) => {
  console.log('Student requesting classroom reservation:', requestData);
  return API.post('/student/classroom-reservations/request', requestData)
    .catch(err => {
      console.error('Error with student reservation endpoint, trying fallback:', err);
      // Try general endpoint as fallback
      return API.post('/reservations/request', requestData)
        .catch(secondErr => {
          console.error('All reservation endpoints failed:', secondErr);
          throw secondErr;
        });
    });
},
  
  editClassroomReservation: (id, requestData) => {
    console.log('Student editing classroom reservation:', id, requestData);
    return API.put(`/api/student/classroom-reservations/${id}`, requestData)
      .catch(err => {
        console.error('Error with student edit endpoint, trying fallback:', err);
        // Try general endpoint as fallback
        return API.put(`/api/reservations/${id}`, requestData)
          .catch(secondErr => {
            console.error('All edit endpoints failed:', secondErr);
            throw secondErr;
          });
      });
  },
  // Request a study room reservation
  requestStudyRoomReservation: (requestData) => {
    console.log('Requesting study room reservation:', requestData);
    return API.post('/student/study-room-reservations', requestData)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.post('/api/student/study-room-reservations', requestData)
          .catch(secondErr => {
            console.log('Trying general reservations endpoint');
            // Notice we're using /reservations/request without /api prefix because API.post already adds it
            return API.post('/reservations/request', requestData);
          });
      });
  },
  
  // Update a study room reservation
  updateStudyRoomReservation: (id, requestData) => {
    console.log('Updating study room reservation:', id);
    return API.put(`/student/study-room-reservations/${id}`, requestData)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.put(`/api/student/study-room-reservations/${id}`, requestData)
          .catch(secondErr => {
            console.log('Trying general reservations endpoint');
            return API.put(`/reservations/${id}`, requestData);
          });
      });
  },
  
  // Get student's reservations
  getMyReservations: () => {
    console.log('Fetching my reservations...');
    return API.get('/student/my-reservations')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.get('/api/student/my-reservations')
          .catch(secondErr => {
            console.log('Trying general my-reservations endpoint');
            return API.get('/reservations/my');
          });
      });
  },
  
  // Cancel a reservation
  cancelReservation: (id) => {
    console.log('Cancelling reservation:', id);
    return API.put(`/student/reservations/${id}/cancel`)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.put(`/api/student/reservations/${id}/cancel`)
          .catch(secondErr => {
            console.log('Trying general cancellation endpoint');
            return API.put(`/reservations/${id}/cancel`);
          });
      });
  },
  
  // Search available study rooms
  searchAvailableStudyRooms: (criteria) => {
    console.log('Searching available study rooms with criteria:', criteria);
    return API.post('/student/study-rooms/search', criteria)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.post('/api/student/study-rooms/search', criteria)
          .catch(secondErr => {
            console.log('Trying general search endpoint');
            return API.post('/rooms/search', criteria);
          });
      });
  },
  
  // Get study room by ID
  getStudyRoomById: (id) => {
    console.log('Fetching study room by ID:', id);
    return API.get(`/student/study-rooms/${id}`)
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.get(`/api/student/study-rooms/${id}`)
          .catch(secondErr => {
            console.log('Trying general rooms endpoint');
            return API.get(`/rooms/study-rooms/${id}`);
          });
      });
  },
  
  // Get student's timetable
  getMyTimetable: () => {
    console.log('Fetching my timetable...');
    return API.get('/student/timetable')
      .catch(err => {
        console.log('Falling back to direct endpoint without /api prefix');
        return axios.get('/api/student/timetable')
          .catch(secondErr => {
            console.log('Trying general timetable endpoint');
            return API.get('/timetable/my-timetable');
          });
      });
  }
};
// In api.js, add or update the branchAPI object
API.branchAPI = {
  // Get all branches
  getAllBranches: () => {
    return API.get('/branches');
  },
  
  // Get branch by ID
  getBranchById: (id) => {
    return API.get(`/branches/${id}`);
  },
  
  // Create a new branch
  createBranch: (branchData) => {
    return API.post('/branches', branchData);
  },
  
  // Update a branch
  updateBranch: (id, branchData) => {
    return API.put(`/branches/${id}`, branchData);
  },
  
  // Delete a branch
  deleteBranch: (id) => {
    return API.delete(`/branches/${id}`);
  },
  
  // Get branch students
  getBranchStudents: (branchId) => {
    return API.get(`/branches/${branchId}/students`);
  },
  
  // Get available students for branch
  getAvailableStudentsForBranch: (branchId) => {
    return API.get(`/branches/${branchId}/available-students`);
  },
  
  // Add student to branch
  addStudentToBranch: (branchId, studentId) => {
    return API.post(`/branches/${branchId}/students/${studentId}`);
  },
  
  // Remove student from branch
  removeStudentFromBranch: (branchId, studentId) => {
    return API.delete(`/branches/${branchId}/students/${studentId}`);
  }
};

console.log('Student API integration complete');

// Export as default and named export for compatibility
export { API };
export default API;