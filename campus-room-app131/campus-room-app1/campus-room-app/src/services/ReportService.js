import API from '../api';
import ReservationEmailService from './ReservationEmailService';
import { generateId } from '../utils/helpers';


/**
 * Enhanced Service for handling report data operations
 * Improved with better data synchronization across components
 */
class ReportService {
  constructor() {
    // Setup event listeners for data changes from other components
    this.setupEventListeners();
    this.cacheExpiryTime = 5 * 60 * 1000; // 5 minutes cache validity
    this.dataCache = {
      dashboardStats: { data: null, timestamp: 0 },
      popularRooms: { data: null, timestamp: 0 },
      activeUsers: { data: null, timestamp: 0 },
      monthlyActivity: { data: null, timestamp: 0 },
      allReservations: { data: null, timestamp: 0 },
      usersByRole: { data: null, timestamp: 0 } // Added cache for users by role
    };
  }

  /**
   * Setup event listeners to catch data updates from other components
   */
  setupEventListeners() {
    // Listen for reservation changes
    document.addEventListener('reservation-updated', this.handleReservationUpdate.bind(this));
    document.addEventListener('reservation-created', this.handleReservationUpdate.bind(this));
    document.addEventListener('reservation-cancelled', this.handleReservationUpdate.bind(this));
    
    // Listen for user changes
    document.addEventListener('user-created', this.handleUserUpdate.bind(this));
    document.addEventListener('user-updated', this.handleUserUpdate.bind(this));
    
    // Listen for room changes
    document.addEventListener('room-updated', this.handleRoomUpdate.bind(this));
    
    // Process queued emails when reports are accessed
    this.processQueuedEmails();
  }

  /**
   * Process any queued emails that couldn't be sent previously
   */
  async processQueuedEmails() {
    try {
      const result = await ReservationEmailService.processEmailQueue();
      if (result.success > 0) {
        console.log(`Processed ${result.success} queued emails when loading reports`);
      }
    } catch (error) {
      console.error('Error processing email queue in ReportService:', error);
    }
  }

  /**
   * Handle reservation update event from other components
   */
  handleReservationUpdate(event) {
    console.log('ReportService detected reservation update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('popularRooms');
    this.invalidateCache('monthlyActivity');
    this.invalidateCache('allReservations');
  }

  /**
   * Handle user update event from other components
   */
  handleUserUpdate(event) {
    console.log('ReportService detected user update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('activeUsers');
    this.invalidateCache('usersByRole'); // Invalidate usersByRole cache
  }

  /**
   * Handle room update event from other components
   */
  handleRoomUpdate(event) {
    console.log('ReportService detected room update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('popularRooms');
  }

  /**
   * Invalidate a specific cache
   */
  invalidateCache(cacheKey) {
    if (this.dataCache[cacheKey]) {
      this.dataCache[cacheKey].timestamp = 0;
    }
  }

  /**
   * Check if cache is valid for a specific key
   */
  isCacheValid(cacheKey) {
    const cache = this.dataCache[cacheKey];
    if (!cache || !cache.data) return false;
    
    const now = Date.now();
    return (now - cache.timestamp) < this.cacheExpiryTime;
  }

  /**
   * Update cache for a specific key
   */
  updateCache(cacheKey, data) {
    this.dataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Format and normalize user data to handle null values
   * This function is identical to the one in UserManagement component
   * to ensure consistency in user data representation across components
   */
  formatUserData(user) {
    return {
      ...user,
      // Ensure these values have defaults if they're null or undefined
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'inactive', // Default to inactive if status is null
      lastLoginDisplay: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      timetableEntries: user.timetableEntries || []
    };
  }

  /**
   * Fetch users grouped by role
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Users by role
   */
  async getUsersByRole(forceRefresh = false) {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid('usersByRole')) {
      console.log('Using cached users by role');
      return this.dataCache.usersByRole.data;
    }

    try {
      // Try to get users from API
      const users = await this.getAllUsers(forceRefresh);
      
      // Group users by role
      const usersByRole = {
        admin: [],
        professor: [],
        student: [],
        other: []
      };
      
      // Process each user and categorize by role
      users.forEach(user => {
        const role = (user.role || '').toLowerCase();
        if (role === 'admin') {
          usersByRole.admin.push(user);
        } else if (role === 'professor') {
          usersByRole.professor.push(user);
        } else if (role === 'student') {
          usersByRole.student.push(user);
        } else {
          usersByRole.other.push(user);
        }
      });
      
      // Calculate counts
      const userCounts = {
        adminCount: usersByRole.admin.length,
        professorCount: usersByRole.professor.length,
        studentCount: usersByRole.student.length,
        otherCount: usersByRole.other.length,
        totalCount: users.length
      };
      
      // Combine counts and users
      const result = {
        ...userCounts,
        users: usersByRole
      };
      
      // Update cache
      this.updateCache('usersByRole', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  /**
   * Fetch dashboard statistics with improved caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(forceRefresh = false) {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid('dashboardStats')) {
      console.log('Using cached dashboard stats');
      return this.dataCache.dashboardStats.data;
    }

    try {
      // Make a direct API call to get fresh data
      const response = await API.get('/admin/dashboard/stats');
      const stats = response.data;
      
      // Get users by role to enhance stats
      const userRoleData = await this.getUsersByRole(forceRefresh);
      
      // Enhance stats with user role data
      const enhancedStats = {
        ...stats,
        usersByRole: {
          adminCount: userRoleData.adminCount,
          professorCount: userRoleData.professorCount,
          studentCount: userRoleData.studentCount,
          otherCount: userRoleData.otherCount
        }
      };
      
      // Update cache
      this.updateCache('dashboardStats', enhancedStats);
      
      // Dispatch an event to notify components of data update
      this.dispatchDataUpdateEvent('stats-updated');
      
      return enhancedStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Fallback: Try ReportsAPI if available in the API object
      try {
        if (API.reportsAPI && API.reportsAPI.getDashboardStats) {
          const response = await API.reportsAPI.getDashboardStats();
          const stats = response.data;
          
          // Get users by role to enhance stats
          const userRoleData = await this.getUsersByRole(forceRefresh);
          
          // Enhance stats with user role data
          const enhancedStats = {
            ...stats,
            usersByRole: {
              adminCount: userRoleData.adminCount,
              professorCount: userRoleData.professorCount,
              studentCount: userRoleData.studentCount,
              otherCount: userRoleData.otherCount
            }
          };
          
          this.updateCache('dashboardStats', enhancedStats);
          return enhancedStats;
        }
      } catch (fallbackError) {
        console.error('Fallback stats fetch failed:', fallbackError);
      }
      
      // Final fallback: try to combine data from multiple endpoints
      try {
        const combinedStats = await this.getCombinedStatsFromMultipleEndpoints();
        
        // Get users by role to enhance stats
        const userRoleData = await this.getUsersByRole(forceRefresh);
        
        // Enhance stats with user role data
        const enhancedStats = {
          ...combinedStats,
          usersByRole: {
            adminCount: userRoleData.adminCount,
            professorCount: userRoleData.professorCount,
            studentCount: userRoleData.studentCount,
            otherCount: userRoleData.otherCount
          }
        };
        
        this.updateCache('dashboardStats', enhancedStats);
        return enhancedStats;
      } catch (multiError) {
        console.error('Multi-endpoint stats gathering failed:', multiError);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Get combined stats from multiple endpoints when the primary endpoint fails
   * @private
   */
  async getCombinedStatsFromMultipleEndpoints() {
    const promises = [
      API.get('/rooms/classrooms').catch(() => ({ data: [] })),
      API.get('/rooms/study-rooms').catch(() => ({ data: [] })),
      API.get('/reservations').catch(() => ({ data: [] })),
      API.get('/users').catch(() => ({ data: [] }))
    ];
    
    const [classroomsRes, studyRoomsRes, reservationsRes, usersRes] = await Promise.all(promises);
    
    const classrooms = classroomsRes.data || [];
    const studyRooms = studyRoomsRes.data || [];
    const reservations = reservationsRes.data || [];
    const users = usersRes.data || [];
    
    // Calculate statistics from the raw data
    const activeReservations = reservations.filter(r => r.status === 'APPROVED').length;
    const pendingReservations = reservations.filter(r => r.status === 'PENDING').length;
    const professorReservations = reservations.filter(r => r.role?.toLowerCase() === 'professor').length;
    const studentReservations = reservations.filter(r => r.role?.toLowerCase() === 'student').length;
    
    const lectureHalls = classrooms.filter(c => c.type === 'Lecture Hall').length;
    const regularClassrooms = classrooms.filter(c => c.type === 'Classroom').length;
    const computerLabs = classrooms.filter(c => c.type === 'Computer Lab').length;
    
    // Group users by role
    const adminUsers = users.filter(u => u.role?.toLowerCase() === 'admin').length;
    const professorUsers = users.filter(u => u.role?.toLowerCase() === 'professor').length;
    const studentUsers = users.filter(u => u.role?.toLowerCase() === 'student').length;
    const otherUsers = users.length - adminUsers - professorUsers - studentUsers;
    
    // Return formatted stats
    return {
      totalClassrooms: classrooms.length,
      totalStudyRooms: studyRooms.length,
      totalReservations: reservations.length,
      approvedReservations: activeReservations,
      pendingReservations,
      rejectedReservations: reservations.filter(r => r.status === 'REJECTED').length,
      professorReservations,
      studentReservations,
      totalUsers: users.length,
      usersByRole: {
        adminCount: adminUsers,
        professorCount: professorUsers,
        studentCount: studentUsers,
        otherCount: otherUsers
      },
      classroomBreakdown: `${lectureHalls} lecture halls, ${regularClassrooms} classrooms, ${computerLabs} labs`,
      reservationBreakdown: `${professorReservations} by professors, ${studentReservations} by students`
    };
  }

  /**
   * Fetch full reports data for admin reports page
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Complete reports data
   */
  async getReportsData(forceRefresh = false) {
    if (!forceRefresh) {
      // Check if all caches are valid
      const allCachesValid = [
        'dashboardStats', 
        'popularRooms', 
        'activeUsers', 
        'monthlyActivity',
        'usersByRole' // Add usersByRole to cache check
      ].every(key => this.isCacheValid(key));
      
      if (allCachesValid) {
        console.log('Using cached reports data');
        return {
          statistics: this.dataCache.dashboardStats.data,
          popularRooms: this.dataCache.popularRooms.data,
          activeUsers: this.dataCache.activeUsers.data,
          monthlyActivity: this.dataCache.monthlyActivity.data,
          usersByRole: this.dataCache.usersByRole.data // Add usersByRole to returned data
        };
      }
    }

    try {
      // Try the dedicated endpoint for comprehensive report data
      const response = await API.get('/admin/reports');
      const reportData = response.data;
      
      // Get users by role to enhance report data
      const userRoleData = await this.getUsersByRole(forceRefresh);
      
      // Update caches
      if (reportData.statistics) {
        // Enhance statistics with user role data
        const enhancedStats = {
          ...reportData.statistics,
          usersByRole: {
            adminCount: userRoleData.adminCount,
            professorCount: userRoleData.professorCount,
            studentCount: userRoleData.studentCount,
            otherCount: userRoleData.otherCount
          }
        };
        
        this.updateCache('dashboardStats', enhancedStats);
        // Update reportData with enhanced stats
        reportData.statistics = enhancedStats;
      }
      
      if (reportData.popularRooms) {
        this.updateCache('popularRooms', reportData.popularRooms);
      }
      if (reportData.activeUsers) {
        this.updateCache('activeUsers', reportData.activeUsers);
      }
      if (reportData.monthlyActivity) {
        this.updateCache('monthlyActivity', reportData.monthlyActivity);
      }
      
      // Add usersByRole to reportData
      reportData.usersByRole = userRoleData;
      
      // Notify components of data update
      this.dispatchDataUpdateEvent('reports-updated');
      
      return reportData;
    } catch (error) {
      console.error('Error fetching reports data:', error);
      
      // Try alternative endpoint if available
      try {
        if (API.reportsAPI && API.reportsAPI.getReportsData) {
          const response = await API.reportsAPI.getReportsData();
          const reportData = response.data;
          
          // Get users by role to enhance report data
          const userRoleData = await this.getUsersByRole(forceRefresh);
          
          // Update caches
          if (reportData.statistics) {
            // Enhance statistics with user role data
            const enhancedStats = {
              ...reportData.statistics,
              usersByRole: {
                adminCount: userRoleData.adminCount,
                professorCount: userRoleData.professorCount,
                studentCount: userRoleData.studentCount,
                otherCount: userRoleData.otherCount
              }
            };
            
            this.updateCache('dashboardStats', enhancedStats);
            // Update reportData with enhanced stats
            reportData.statistics = enhancedStats;
          }
          
          if (reportData.popularRooms) {
            this.updateCache('popularRooms', reportData.popularRooms);
          }
          if (reportData.activeUsers) {
            this.updateCache('activeUsers', reportData.activeUsers);
          }
          if (reportData.monthlyActivity) {
            this.updateCache('monthlyActivity', reportData.monthlyActivity);
          }
          
          // Add usersByRole to reportData
          reportData.usersByRole = userRoleData;
          
          return reportData;
        }
      } catch (alternativeError) {
        console.error('Alternative endpoint failed:', alternativeError);
      }
      
      // Fallback: try to calculate the data from multiple endpoints
      try {
        // Fetch all the necessary data
        const allReservations = await this.getAllReservations(true);
        const allUsers = await this.getAllUsers();
        const allClassrooms = await this.getAllClassrooms();
        const allStudyRooms = await this.getAllStudyRooms();
        
        // Get users by role
        const userRoleData = await this.getUsersByRole(forceRefresh);
        
        // Calculate statistics
        const stats = this.calculateStats(allClassrooms, allStudyRooms, allReservations, allUsers);
        
        // Enhance statistics with user role data
        const enhancedStats = {
          ...stats,
          usersByRole: {
            adminCount: userRoleData.adminCount,
            professorCount: userRoleData.professorCount,
            studentCount: userRoleData.studentCount,
            otherCount: userRoleData.otherCount
          }
        };
        
        // Calculate popular rooms
        const popularRooms = this.calculatePopularRooms(allReservations);
        
        // Calculate most active users
        const mostActiveUsers = this.calculateActiveUsers(allReservations, allUsers);
        
        // Calculate monthly activity
        const monthlyActivity = this.calculateMonthlyActivity(allReservations);
        
        // Update caches
        this.updateCache('dashboardStats', enhancedStats);
        this.updateCache('popularRooms', popularRooms);
        this.updateCache('activeUsers', mostActiveUsers);
        this.updateCache('monthlyActivity', monthlyActivity);
        
        return {
          statistics: enhancedStats,
          popularRooms,
          activeUsers: mostActiveUsers,
          monthlyActivity,
          usersByRole: userRoleData
        };
      } catch (fallbackError) {
        console.error('Fallback reports data gathering failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Fetch all classrooms with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Array of classrooms
   */
  async getAllClassrooms(forceRefresh = false) {
    try {
      // Try multiple endpoints to get classrooms
      let response;
      try {
        response = await API.get('/api/rooms/classrooms');
      } catch (err) {
        console.log('Falling back to alternative classroom endpoint');
        try {
          response = await API.get('/api/classrooms');
        } catch (secondErr) {
          console.log('Falling back to localStorage for classrooms');
          const storedClassrooms = localStorage.getItem('availableClassrooms');
          if (storedClassrooms) {
            return JSON.parse(storedClassrooms);
          }
          return [];
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      return [];
    }
  }

  /**
   * Fetch all study rooms with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Array of study rooms
   */
  async getAllStudyRooms(forceRefresh = false) {
    try {
      // Try multiple endpoints to get study rooms
      let response;
      try {
        response = await API.get('/api/rooms/study-rooms');
      } catch (err) {
        console.log('Falling back to alternative study room endpoint');
        try {
          response = await API.get('/api/study-rooms');
        } catch (secondErr) {
          console.log('Falling back to localStorage for study rooms');
          const storedStudyRooms = localStorage.getItem('studyRooms');
          if (storedStudyRooms) {
            return JSON.parse(storedStudyRooms);
          }
          return [];
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching study rooms:', error);
      return [];
    }
  }

  /**
   * Fetch all users with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers(forceRefresh = false) {
    try {
      // Try multiple endpoints to get users
      let response;
      try {
        response = await API.get('/api/users');
      } catch (err) {
        console.log('Falling back to alternative users endpoint');
        try {
          response = await API.userAPI.getAllUsers();
        } catch (secondErr) {
          console.log('Falling back to localStorage for users');
          const storedUsers = localStorage.getItem('users');
          if (storedUsers) {
            return JSON.parse(storedUsers);
          }
          return [];
        }
      }
      
      // Format and normalize user data to handle null values
      const formattedUsers = response.data.map(user => this.formatUserData(user));
      
      return formattedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Fetch all reservations with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Array of reservations
   */
  async getAllReservations(forceRefresh = false) {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid('allReservations')) {
      console.log('Using cached reservations');
      return this.dataCache.allReservations.data;
    }

    try {
      // Try multiple endpoints to get reservations
      let response;
      try {
        response = await API.get('/api/reservations');
      } catch (err) {
        console.log('Falling back to alternative reservations endpoint');
        try {
          response = await API.reservationAPI.getAllReservations();
        } catch (secondErr) {
          console.log('Falling back to localStorage for reservations');
          
          // Combine professor and student reservations from localStorage
          const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
          const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
          
          // Format the reservations
          const allReservations = [
            ...professorReservations.map(res => ({
              id: res.id,
              classroom: res.classroom || res.room,
              reservedBy: res.userId || res.reservedBy || 'Unknown Professor',
              role: 'Professor',
              date: res.date,
              time: res.time || `${res.startTime} - ${res.endTime}`,
              purpose: res.purpose,
              status: res.status
            })),
            ...studentReservations.map(res => ({
              id: res.id,
              classroom: res.classroom || res.room,
              reservedBy: res.userId || res.reservedBy || 'Unknown Student',
              role: 'Student',
              date: res.date,
              time: res.time || `${res.startTime} - ${res.endTime}`,
              purpose: res.purpose,
              status: res.status
            }))
          ];
          
          this.updateCache('allReservations', allReservations);
          return allReservations;
        }
      }
      
      // Ensure reservations have role information
      const reservations = response.data.map(res => {
        // Make sure all reservations have a role
        if (!res.role) {
          // Try to determine role from userId or reservedBy if available
          if (res.userId) {
            if (res.userId.includes('professor') || res.userId.includes('prof')) {
              res.role = 'Professor';
            } else if (res.userId.includes('student') || res.userId.includes('stu')) {
              res.role = 'Student';
            } else if (res.userId.includes('admin')) {
              res.role = 'Admin';
            } else {
              res.role = 'Unknown';
            }
          } else if (res.reservedBy) {
            if (res.reservedBy.includes('professor') || res.reservedBy.includes('prof')) {
              res.role = 'Professor';
            } else if (res.reservedBy.includes('student') || res.reservedBy.includes('stu')) {
              res.role = 'Student';
            } else if (res.reservedBy.includes('admin')) {
              res.role = 'Admin';
            } else {
              res.role = 'Unknown';
            }
          } else {
            res.role = 'Unknown';
          }
        }
        return res;
      });
      
      this.updateCache('allReservations', reservations);
      return reservations;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  }
  
  /**
   * Calculate basic statistics from raw data
   * @private
   */
  calculateStats(classrooms, studyRooms, reservations, users) {
    const totalReservations = reservations.length;
    const approvedReservations = reservations.filter(r => 
      r.status?.toLowerCase() === 'approved').length;
    const pendingReservations = reservations.filter(r => 
      r.status?.toLowerCase() === 'pending').length;
    const rejectedReservations = reservations.filter(r => 
      r.status?.toLowerCase() === 'rejected').length;
    
    const professorReservations = reservations.filter(r => 
      r.role?.toLowerCase() === 'professor').length;
    const studentReservations = reservations.filter(r => 
      r.role?.toLowerCase() === 'student').length;
    const adminReservations = reservations.filter(r => 
      r.role?.toLowerCase() === 'admin').length;
    
    // Group users by role
    const adminUsers = users.filter(u => u.role?.toLowerCase() === 'admin').length;
    const professorUsers = users.filter(u => u.role?.toLowerCase() === 'professor').length;
    const studentUsers = users.filter(u => u.role?.toLowerCase() === 'student').length;
    const otherUsers = users.length - adminUsers - professorUsers - studentUsers;
    
    return {
      totalReservations,
      approvedReservations,
      pendingReservations,
      rejectedReservations,
      professorReservations,
      studentReservations,
      adminReservations,
      totalClassrooms: classrooms.length,
      totalStudyRooms: studyRooms.length,
      totalUsers: users.length,
      usersByRole: {
        adminCount: adminUsers,
        professorCount: professorUsers,
        studentCount: studentUsers,
        otherCount: otherUsers
      }
    };
  }
  
  /**
   * Calculate popular rooms statistics
   * @private
   */
  calculatePopularRooms(reservations) {
    // Count reservations by room
    const roomCounts = {};
    const roomRoleData = {}; // Track role information for each room
    
    reservations.forEach(res => {
      const roomName = res.classroom || res.room || 'Unknown';
      roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
      
      // Track role information
      if (!roomRoleData[roomName]) {
        roomRoleData[roomName] = {
          professor: 0,
          student: 0,
          admin: 0,
          unknown: 0
        };
      }
      
      const role = (res.role || '').toLowerCase();
      if (role === 'professor') {
        roomRoleData[roomName].professor++;
      } else if (role === 'student') {
        roomRoleData[roomName].student++;
      } else if (role === 'admin') {
        roomRoleData[roomName].admin++;
      } else {
        roomRoleData[roomName].unknown++;
      }
    });
    
    // Convert to array and sort
    const totalReservations = reservations.length || 1; // Avoid division by zero
    const popularRooms = Object.entries(roomCounts).map(([room, count]) => ({
      room,
      count,
      percentage: (count / totalReservations) * 100,
      // Add role breakdown
      roleData: roomRoleData[room] || { professor: 0, student: 0, admin: 0, unknown: 0 }
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return popularRooms;
  }
  
  /**
   * Calculate most active users
   * @private
   */
  calculateActiveUsers(reservations, users) {
    // Count reservations by user
    const userCounts = {};
    reservations.forEach(res => {
      const userId = res.userId || res.reservedBy || 'Unknown';
      userCounts[userId] = (userCounts[userId] || 0) + 1;
    });
    
    // Map user IDs to names and roles
    const userIdToDetails = {};
    users.forEach(user => {
      const userId = user.id || user.email || 'Unknown';
      userIdToDetails[userId] = {
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || userId,
        role: user.role || 'Unknown'
      };
    });
    
    // Convert to array and sort
    const activeUsers = Object.entries(userCounts).map(([userId, count]) => {
      const userDetails = userIdToDetails[userId] || { 
        userName: userId, 
        role: 'Unknown' 
      };
      
      return {
        userId,
        userName: userDetails.userName,
        role: userDetails.role,
        count
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return activeUsers;
  }
  
  /**
   * Calculate monthly activity
   * @private
   */
  calculateMonthlyActivity(reservations) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize counts for each month
    const monthlyStats = months.map(month => ({
      month,
      professorCount: 0,
      studentCount: 0,
      adminCount: 0, // Added admin count
      total: 0
    }));
    
    // Count reservations by month and role
    reservations.forEach(res => {
      if (!res.date) return;
      
      try {
        const date = new Date(res.date);
        const monthIndex = date.getMonth();
        
        const role = (res.role || '').toLowerCase();
        if (role === 'professor') {
          monthlyStats[monthIndex].professorCount++;
        } else if (role === 'student') {
          monthlyStats[monthIndex].studentCount++;
        } else if (role === 'admin') {
          monthlyStats[monthIndex].adminCount++;
        }
        
        monthlyStats[monthIndex].total++;
      } catch (e) {
        console.error('Error parsing date:', res.date, e);
      }
    });
    
    return monthlyStats;
  }

  /**
   * Generate CSV report of all reservations
   * @returns {Promise<string>} CSV content as string
   */
  async generateCSVReport() {
    try {
      // Try to get the CSV directly from the API
      try {
        const response = await API.get('/admin/reports/csv', {
          responseType: 'text'
        });
        return response.data;
      } catch (directError) {
        console.error('Direct CSV fetch failed:', directError);
      }
      
      // Try alternative endpoint if available
      try {
        if (API.reportsAPI && API.reportsAPI.getCSVReport) {
          const response = await API.reportsAPI.getCSVReport();
          return response.data;
        }
      } catch (alternativeError) {
        console.error('Alternative CSV endpoint failed:', alternativeError);
      }
      
      // Fallback: Generate CSV from raw data
      const reservations = await this.getAllReservations(true);
      
      // Create CSV header
      let csvContent = 'ID,Room,User,User Type,Date,Time,Purpose,Status\n';
      
      // Add rows
      reservations.forEach(res => {
        csvContent += `${res.id || ''},${res.classroom || res.room || ''},${res.reservedBy || ''},${res.role || ''},${res.date || ''},${res.time || ''},${this.escapeCsvField(res.purpose) || ''},${res.status || ''}\n`;
      });
      
      return csvContent;
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  }
  
  /**
   * Escape special characters in CSV fields
   * @private
   */
  escapeCsvField(field) {
    if (!field) return '';
    // Escape quotes and wrap in quotes if the field contains commas, quotes, or newlines
    const escaped = field.toString().replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  }
  
  /**
   * Generate Excel report with comprehensive data
   * @returns {Promise<Object>} Excel data object for client-side generation
   */
  async generateExcelData() {
    try {
      // Try API first
      try {
        if (API.reportsAPI && API.reportsAPI.getExcelReport) {
          const response = await API.reportsAPI.getExcelReport();
          return response.data;
        }
      } catch (error) {
        console.error("Excel API not available, generating manually", error);
      }
      
      // Manual generation
      const data = await this.getReportsData(true);
      
      // Format the data for Excel
      return {
        reservations: await this.getAllReservations(true),
        statistics: data.statistics,
        popularRooms: data.popularRooms,
        activeUsers: data.activeUsers,
        monthlyActivity: data.monthlyActivity,
        usersByRole: data.usersByRole
      };
    } catch (error) {
      console.error('Error generating Excel data:', error);
      throw error;
    }
  }
  
  /**
   * Generate PDF report with comprehensive data
   * @returns {Promise<Object>} PDF data object for client-side generation
   */
  async generatePDFData() {
    try {
      // Get all the report data
      const data = await this.getReportsData(true);
      
      // Get all reservations with role information
      const reservations = await this.getAllReservations(true);
      
      // Return the data formatted for PDF generation on the client
      return {
        reservations,
        statistics: data.statistics,
        popularRooms: data.popularRooms,
        activeUsers: data.activeUsers,
        monthlyActivity: data.monthlyActivity,
        usersByRole: data.usersByRole,
        generatedAt: new Date().toISOString(),
        title: "Classroom Reservation System Report",
        // Add table-focused data for PDF export
        tables: {
          reservations: this.formatTableData(reservations, [
            'ID', 'Room', 'Reserved By', 'Role', 'Date', 'Time', 'Purpose', 'Status'
          ]),
          popularRooms: this.formatTableData(data.popularRooms, [
            'Room', 'Count', 'Percentage', 'Professor', 'Student', 'Admin', 'Unknown'
          ], (room) => [
            room.room,
            room.count,
            `${room.percentage.toFixed(1)}%`,
            room.roleData.professor,
            room.roleData.student,
            room.roleData.admin,
            room.roleData.unknown
          ]),
          activeUsers: this.formatTableData(data.activeUsers, [
            'User', 'Role', 'Reservations'
          ]),
          monthlyActivity: this.formatTableData(data.monthlyActivity, [
            'Month', 'Professor', 'Student', 'Admin', 'Total'
          ], (month) => [
            month.month,
            month.professorCount,
            month.studentCount,
            month.adminCount,
            month.total
          ]),
          usersByRole: this.formatTableData([data.usersByRole], [
            'Admins', 'Professors', 'Students', 'Other', 'Total'
          ], (data) => [
            data.adminCount,
            data.professorCount,
            data.studentCount,
            data.otherCount,
            data.totalCount
          ])
        }
      };
    } catch (error) {
      console.error('Error generating PDF data:', error);
      throw error;
    }
  }
  
  /**
   * Format data for table display in PDFs and exports
   * @private
   */
  formatTableData(data, headers, rowMapper = null) {
    return {
      headers,
      rows: data.map(item => rowMapper ? rowMapper(item) : headers.map(h => this.extractDataByHeader(item, h)))
    };
  }
  
  /**
   * Extract data from an object based on a header name
   * @private
   */
  extractDataByHeader(item, header) {
    switch (header) {
      case 'ID': return item.id || '';
      case 'Room': return item.classroom || item.room || '';
      case 'Reserved By': return item.reservedBy || '';
      case 'Role': return item.role || '';
      case 'Date': return item.date || '';
      case 'Time': return item.time || '';
      case 'Purpose': return item.purpose || '';
      case 'Status': return item.status || '';
      case 'Count': return item.count || 0;
      case 'Percentage': return item.percentage ? `${item.percentage.toFixed(1)}%` : '0%';
      case 'User': return item.userName || '';
      case 'Reservations': return item.count || 0;
      case 'Month': return item.month || '';
      case 'Professor': return item.professorCount || 0;
      case 'Student': return item.studentCount || 0;
      case 'Admin': return item.adminCount || 0;
      case 'Total': return item.total || 0;
      default: return '';
    }
  }
  
  /**
   * Dispatch custom event to notify of data updates
   * @param {string} eventType - Type of update event
   */
  dispatchDataUpdateEvent(eventType) {
    const event = new CustomEvent(eventType, {
      detail: {
        timestamp: new Date().toISOString(),
        source: 'ReportService'
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Notify other components that a reservation has been updated
   * @param {Object} reservation - The updated reservation
   */
  notifyReservationUpdated(reservation) {
    const event = new CustomEvent('reservation-updated', {
      detail: {
        reservation,
        timestamp: new Date().toISOString()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Notify other components that a user has been created or updated
   * @param {Object} user - The updated user
   */
  notifyUserUpdated(user) {
    const event = new CustomEvent('user-updated', {
      detail: {
        user,
        timestamp: new Date().toISOString()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Notify other components that a room has been updated
   * @param {Object} room - The updated room
   */
  notifyRoomUpdated(room) {
    const event = new CustomEvent('room-updated', {
      detail: {
        room,
        timestamp: new Date().toISOString()
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Export a singleton instance
export default new ReportService();