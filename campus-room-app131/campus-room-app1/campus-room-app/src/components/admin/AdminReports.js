import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import ReportService from '../../services/ReportService';
import PDFReport from './PDFReport';
import { API } from '../../api';

const AdminReports = () => {
  // State for stats and data
  const [stats, setStats] = useState({
    totalReservations: 0,
    approvedReservations: 0,
    pendingReservations: 0,
    rejectedReservations: 0,
    professorReservations: 0,
    studentReservations: 0,
    totalClassrooms: 0,
    totalStudyRooms: 0,
    totalUsers: 0,
    usersByRole: {
      adminCount: 0,
      professorCount: 0,
      studentCount: 0,
      otherCount: 0
    }
  });
  
  const [popularRooms, setPopularRooms] = useState([]);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [renderError, setRenderError] = useState(null);
  
  // Export state
  const [exportType, setExportType] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Show PDF Report modal
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [pdfData, setPDFData] = useState(null);
  
  // Log component mount for debugging
  useEffect(() => {
    console.log("AdminReports component mounted");
  }, []);
  
  // Process any queued emails on component mount
  useEffect(() => {
    const processQueuedEmails = async () => {
      try {
        const result = await ReportService.processQueuedEmails();
        if (result && result.success > 0) {
          console.log(`Processed ${result.success} queued emails`);
        }
      } catch (error) {
        console.error('Error processing email queue:', error);
      }
    };
    
    processQueuedEmails();
  }, []);
  
  // Set up data update listener
  useEffect(() => {
    // Set up data update listener
    const handleDataUpdate = (event) => {
      console.log('Data update detected:', event.detail);
      // Trigger a refresh of the data
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Register event listeners for data updates
    document.addEventListener('reservation-updated', handleDataUpdate);
    document.addEventListener('reservation-created', handleDataUpdate);
    document.addEventListener('reservation-cancelled', handleDataUpdate);
    document.addEventListener('user-created', handleDataUpdate);
    document.addEventListener('user-updated', handleDataUpdate);
    document.addEventListener('room-updated', handleDataUpdate);
    
    // Clean up
    return () => {
      document.removeEventListener('reservation-updated', handleDataUpdate);
      document.removeEventListener('reservation-created', handleDataUpdate);
      document.removeEventListener('reservation-cancelled', handleDataUpdate);
      document.removeEventListener('user-created', handleDataUpdate);
      document.removeEventListener('user-updated', handleDataUpdate);
      document.removeEventListener('room-updated', handleDataUpdate);
    };
  }, []); // Empty dependency is appropriate here
  
  // Load data on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchReportData();
  }, [refreshTrigger]);
  
  // Fetch report data from API
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use ReportService to fetch comprehensive reports data
      const reportData = await ReportService.getReportsData();
      
      // Set stats from API response
      if (reportData.statistics) {
        setStats(reportData.statistics);
      }
      
      // Set popular rooms from API response
      if (reportData.popularRooms) {
        setPopularRooms(reportData.popularRooms);
      }
      
      // Set most active users from API response
      if (reportData.activeUsers) {
        setMostActiveUsers(reportData.activeUsers);
      }
      
      // Set monthly activity from API response
      if (reportData.monthlyActivity) {
        setMonthlyActivity(reportData.monthlyActivity);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data from server.");
      
      // Fallback to localStorage if API fails
      fallbackToLocalStorage();
    } finally {
      setLoading(false);
    }
  };
  
  // Fallback to localStorage data if API fails
  const fallbackToLocalStorage = () => {
    try {
      console.log("Falling back to localStorage data");
      
      // Get data from localStorage
      const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
      const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
      const classrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
      const studyRooms = JSON.parse(localStorage.getItem('studyRooms') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Calculate basic stats
      const totalReservations = professorReservations.length + studentReservations.length;
      const approvedReservations = professorReservations.filter(res => res.status.toLowerCase() === 'approved').length + 
                                studentReservations.filter(res => res.status.toLowerCase() === 'approved').length;
      const pendingReservations = professorReservations.filter(res => res.status.toLowerCase() === 'pending').length + 
                              studentReservations.filter(res => res.status.toLowerCase() === 'pending').length;
      const rejectedReservations = professorReservations.filter(res => res.status.toLowerCase() === 'rejected').length + 
                              studentReservations.filter(res => res.status.toLowerCase() === 'rejected').length;
      
      // Count users by role
      const adminCount = users.filter(u => u.role?.toLowerCase() === 'admin').length;
      const professorCount = users.filter(u => u.role?.toLowerCase() === 'professor').length;
      const studentCount = users.filter(u => u.role?.toLowerCase() === 'student').length;
      const otherCount = users.length - adminCount - professorCount - studentCount;
      
      setStats({
        totalReservations,
        approvedReservations,
        pendingReservations,
        rejectedReservations,
        professorReservations: professorReservations.length,
        studentReservations: studentReservations.length,
        totalClassrooms: classrooms.length,
        totalStudyRooms: studyRooms.length,
        totalUsers: users.length,
        usersByRole: {
          adminCount,
          professorCount,
          studentCount,
          otherCount
        }
      });
      
      // Calculate popular rooms
      const roomCounts = {};
      const roomRoleData = {}; // Track which roles made reservations for each room
      
      // Count professor reservations by room
      professorReservations.forEach(res => {
        const roomName = res.classroom;
        if (!roomCounts[roomName]) {
          roomCounts[roomName] = 0;
        }
        roomCounts[roomName]++;
        
        // Track role data
        if (!roomRoleData[roomName]) {
          roomRoleData[roomName] = { professor: 0, student: 0, admin: 0, unknown: 0 };
        }
        roomRoleData[roomName].professor++;
      });
      
      // Count student reservations by room
      studentReservations.forEach(res => {
        const roomName = res.room;
        if (!roomCounts[roomName]) {
          roomCounts[roomName] = 0;
        }
        roomCounts[roomName]++;
        
        // Track role data
        if (!roomRoleData[roomName]) {
          roomRoleData[roomName] = { professor: 0, student: 0, admin: 0, unknown: 0 };
        }
        roomRoleData[roomName].student++;
      });
      
      // Convert to array and sort
      const popularRoomsArray = Object.entries(roomCounts).map(([room, count]) => ({
        room,
        count,
        percentage: (count / totalReservations) * 100,
        roleData: roomRoleData[room] || { professor: 0, student: 0, admin: 0, unknown: 0 }
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setPopularRooms(popularRoomsArray);
      
      // Calculate most active users
      const userCounts = {};
      
      // Count professor reservations by user
      professorReservations.forEach(res => {
        const userId = res.userId || res.reservedBy;
        if (!userCounts[userId]) {
          userCounts[userId] = { count: 0, role: 'Professor' };
        }
        userCounts[userId].count++;
      });
      
      // Count student reservations by user
      studentReservations.forEach(res => {
        const userId = res.userId || res.reservedBy;
        if (!userCounts[userId]) {
          userCounts[userId] = { count: 0, role: 'Student' };
        }
        userCounts[userId].count++;
      });
      
      // Convert to array and sort
      const activeUsersArray = Object.entries(userCounts).map(([userId, data]) => ({
        userId,
        userName: userId,
        role: data.role,
        count: data.count
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setMostActiveUsers(activeUsersArray);
      
      // Calculate monthly activity
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyStats = months.map(month => {
        const profCount = professorReservations.filter(res => {
          if (!res.date) return false;
          try {
            const date = new Date(res.date);
            return months[date.getMonth()] === month;
          } catch (e) {
            return false;
          }
        }).length;
        
        const studCount = studentReservations.filter(res => {
          if (!res.date) return false;
          try {
            const date = new Date(res.date);
            return months[date.getMonth()] === month;
          } catch (e) {
            return false;
          }
        }).length;
        
        return {
          month,
          professorCount: profCount,
          studentCount: studCount,
          adminCount: 0, // Added adminCount with default 0
          total: profCount + studCount
        };
      });
      
      setMonthlyActivity(monthlyStats);
    } catch (error) {
      console.error("Error in localStorage fallback:", error);
      // If localStorage also fails, set some default data
      setDefaultFallbackData();
    }
  };
  
  // Set default fallback data if both API and localStorage fail
  const setDefaultFallbackData = () => {
    setStats({
      totalReservations: 0,
      approvedReservations: 0,
      pendingReservations: 0,
      rejectedReservations: 0,
      professorReservations: 0,
      studentReservations: 0,
      totalClassrooms: 0,
      totalStudyRooms: 0,
      totalUsers: 0,
      usersByRole: {
        adminCount: 0,
        professorCount: 0,
        studentCount: 0,
        otherCount: 0
      }
    });
    setPopularRooms([]);
    setMostActiveUsers([]);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setMonthlyActivity(months.map(month => ({
      month,
      professorCount: 0,
      studentCount: 0,
      adminCount: 0,
      total: 0
    })));
  };
  
  // Generate CSV report
  const generateCSV = async () => {
    try {
      setExportLoading(true);
      
      // Get CSV data from service
      const csvContent = await ReportService.generateCSVReport();
      
      // Create and download file
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'reservations_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      
      // Fallback: generate CSV from localStorage
      try {
        // Get data from localStorage
        const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
        const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
        
        // Combine all reservations
        const allReservations = [
          ...professorReservations.map(res => ({
            ...res,
            roomName: res.classroom,
            userType: 'Professor'
          })),
          ...studentReservations.map(res => ({
            ...res,
            roomName: res.room,
            userType: 'Student'
          }))
        ];
        
        // Sort by date
        allReservations.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create CSV header
        let csvContent = 'ID,Room,User,User Type,Date,Time,Purpose,Status\n';
        
        // Add rows
        allReservations.forEach(res => {
          csvContent += `${res.id},${res.roomName},${res.userId || res.reservedBy},${res.userType},${res.date},${res.time},${res.purpose || ''},${res.status}\n`;
        });
        
        // Create and download file
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'reservations_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Error in CSV localStorage fallback:", fallbackError);
        alert("Failed to generate CSV report. Please try again later.");
      }
    } finally {
      setExportLoading(false);
    }
  };
  
  // Generate Excel report (using XLSX library)
  const generateExcel = async () => {
    try {
      setExportLoading(true);
      
      // Import SheetJS dynamically
      const XLSX = await import('xlsx').then(module => module.default);
      
      // Get data for Excel report
      const excelData = await ReportService.generateExcelData();
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create worksheet for reservations
      const reservationsWS = XLSX.utils.json_to_sheet(excelData.reservations.map(res => ({
        ID: res.id,
        Room: res.classroom || res.room,
        User: res.reservedBy,
        Role: res.role, // Ensure role is included
        Date: res.date,
        Time: res.time,
        Purpose: res.purpose,
        Status: res.status
      })));
      XLSX.utils.book_append_sheet(wb, reservationsWS, "Reservations");
      
      // Create worksheet for popular rooms with role breakdown
      const popularRoomsWS = XLSX.utils.json_to_sheet(excelData.popularRooms.map(room => ({
        Room: room.room,
        Reservations: room.count,
        "Usage %": room.percentage.toFixed(1),
        "By Professors": room.roleData.professor,
        "By Students": room.roleData.student,
        "By Admins": room.roleData.admin,
        "By Others": room.roleData.unknown
      })));
      XLSX.utils.book_append_sheet(wb, popularRoomsWS, "Popular Rooms");
      
      // Create worksheet for active users
      const activeUsersWS = XLSX.utils.json_to_sheet(excelData.activeUsers.map(user => ({
        User: user.userName,
        Role: user.role,
        Reservations: user.count
      })));
      XLSX.utils.book_append_sheet(wb, activeUsersWS, "Active Users");
      
      // Create worksheet for monthly activity
      const monthlyActivityWS = XLSX.utils.json_to_sheet(excelData.monthlyActivity.map(month => ({
        Month: month.month,
        "Professor Reservations": month.professorCount,
        "Student Reservations": month.studentCount,
        "Admin Reservations": month.adminCount,
        Total: month.total
      })));
      XLSX.utils.book_append_sheet(wb, monthlyActivityWS, "Monthly Activity");
      
      // Create worksheet for users by role
      const userRoleData = excelData.usersByRole;
      const userRoleWS = XLSX.utils.json_to_sheet([{
        "Admin Users": userRoleData.adminCount,
        "Professor Users": userRoleData.professorCount,
        "Student Users": userRoleData.studentCount,
        "Other Users": userRoleData.otherCount,
        "Total Users": userRoleData.totalCount
      }]);
      XLSX.utils.book_append_sheet(wb, userRoleWS, "Users By Role");
      
      // Create summary worksheet
      const summaryData = [
        { Metric: "Total Reservations", Value: excelData.statistics.totalReservations },
        { Metric: "Approved Reservations", Value: excelData.statistics.approvedReservations },
        { Metric: "Pending Reservations", Value: excelData.statistics.pendingReservations },
        { Metric: "Rejected Reservations", Value: excelData.statistics.rejectedReservations },
        { Metric: "Professor Reservations", Value: excelData.statistics.professorReservations },
        { Metric: "Student Reservations", Value: excelData.statistics.studentReservations },
        { Metric: "Admin Reservations", Value: excelData.statistics.adminReservations || 0 },
        { Metric: "Total Classrooms", Value: excelData.statistics.totalClassrooms },
        { Metric: "Total Study Rooms", Value: excelData.statistics.totalStudyRooms },
        { Metric: "Total Users", Value: excelData.statistics.totalUsers },
        { Metric: "Admin Users", Value: excelData.statistics.usersByRole?.adminCount || 0 },
        { Metric: "Professor Users", Value: excelData.statistics.usersByRole?.professorCount || 0 },
        { Metric: "Student Users", Value: excelData.statistics.usersByRole?.studentCount || 0 },
        { Metric: "Other Users", Value: excelData.statistics.usersByRole?.otherCount || 0 }
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");
      
      // Generate Excel file
      XLSX.writeFile(wb, "campus_room_report.xlsx");
    } catch (error) {
      console.error("Error generating Excel report:", error);
      alert("Failed to generate Excel report. Please try again later.");
    } finally {
      setExportLoading(false);
    }
  };
  
  // Export data to PDF format using React component
  const generatePDF = async () => {
    try {
      setExportLoading(true);
      
      // Get data for PDF report
      const pdfData = await ReportService.generatePDFData();
      
      // Set PDF data and show the PDF report modal
      setPDFData(pdfData);
      setShowPDFReport(true);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      alert("Failed to generate PDF report. Please try again later.");
    } finally {
      setExportLoading(false);
    }
  };
  
  // Close PDF report modal
  const closePDFReport = () => {
    setShowPDFReport(false);
    setPDFData(null);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }
  
  // Render with error boundary
  try {
    return (
      <div className="main-content">
        <div className="section-header">
          <h2>System Reports</h2>
          <div className="button-group">
            <button 
              className="btn-secondary"
              onClick={fetchReportData}
              disabled={loading}
            >
              <i className="fas fa-sync-alt"></i> Refresh Data
            </button>
            <button 
              className="btn-primary"
              onClick={generateCSV}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
              ) : (
                <span><i className="fas fa-download"></i> Export CSV Report</span>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Overview Stats */}
        <div className="section">
          <h3 className="sub-section-title">System Overview</h3>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon icon-blue">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="stat-info">
                <h3>Total Reservations</h3>
                <p className="stat-number">{stats.totalReservations}</p>
                <p className="stat-description">
                  {stats.approvedReservations} approved, {stats.pendingReservations} pending
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon icon-green">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>User Reservations</h3>
                <p className="stat-number">{stats.professorReservations} / {stats.studentReservations}</p>
                <p className="stat-description">
                  Professor / Student reservations
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon icon-yellow">
                <i className="fas fa-door-open"></i>
              </div>
              <div className="stat-info">
                <h3>Rooms Available</h3>
                <p className="stat-number">{stats.totalClassrooms + stats.totalStudyRooms}</p>
                <p className="stat-description">
                  {stats.totalClassrooms} classrooms, {stats.totalStudyRooms} study rooms
                </p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon icon-red">
                <i className="fas fa-user-friends"></i>
              </div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.totalUsers}</p>
                <p className="stat-description">
                  {stats.usersByRole?.adminCount || 0} admins, {stats.usersByRole?.professorCount || 0} professors, {stats.usersByRole?.studentCount || 0} students
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Popular Rooms */}
        <div className="section">
          <h3 className="sub-section-title">Most Popular Rooms</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Reservations</th>
                  <th>Usage</th>
                  <th>By Professors</th>
                  <th>By Students</th>
                </tr>
              </thead>
              <tbody>
                {popularRooms.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No data available</td>
                  </tr>
                ) : (
                  popularRooms.map((room, index) => (
                    <tr key={index}>
                      <td>{room.room}</td>
                      <td>{room.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress" 
                            style={{ 
                              width: `${Math.min(room.percentage, 100)}%`,
                              backgroundColor: index === 0 ? '#4a6cf7' : index === 1 ? '#6c70dc' : '#8e82c3' 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td>{room.roleData?.professor || 0}</td>
                      <td>{room.roleData?.student || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Most Active Users */}
        <div className="section">
          <h3 className="sub-section-title">Most Active Users</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Reservations</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {mostActiveUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No data available</td>
                  </tr>
                ) : (
                  mostActiveUsers.map((user, index) => (
                    <tr key={index}>
                      <td>{user.userName}</td>
                      <td>{user.role}</td>
                      <td>{user.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress" 
                            style={{ 
                              width: `${Math.min((user.count / (stats.totalReservations || 1)) * 100, 100)}%`,
                              backgroundColor: index === 0 ? '#28a745' : index === 1 ? '#5cb85c' : '#80c780' 
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Users by Role */}
        <div className="section">
          <h3 className="sub-section-title">Users by Role</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Administrators</td>
                  <td>{stats.usersByRole?.adminCount || 0}</td>
                  <td>
                    {stats.totalUsers ? ((stats.usersByRole?.adminCount || 0) / stats.totalUsers * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td>Professors</td>
                  <td>{stats.usersByRole?.professorCount || 0}</td>
                  <td>
                    {stats.totalUsers ? ((stats.usersByRole?.professorCount || 0) / stats.totalUsers * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td>Students</td>
                  <td>{stats.usersByRole?.studentCount || 0}</td>
                  <td>
                    {stats.totalUsers ? ((stats.usersByRole?.studentCount || 0) / stats.totalUsers * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td>Other</td>
                  <td>{stats.usersByRole?.otherCount || 0}</td>
                  <td>
                    {stats.totalUsers ? ((stats.usersByRole?.otherCount || 0) / stats.totalUsers * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>{stats.totalUsers}</strong></td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Monthly Activity */}
        <div className="section">
          <h3 className="sub-section-title">Monthly Reservation Activity</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Professor Reservations</th>
                  <th>Student Reservations</th>
                  <th>Admin Reservations</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No data available</td>
                  </tr>
                ) : (
                  monthlyActivity.map((month, index) => (
                    <tr key={index}>
                      <td>{month.month}</td>
                      <td>{month.professorCount}</td>
                      <td>{month.studentCount}</td>
                      <td>{month.adminCount || 0}</td>
                      <td>{month.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="section">
          <h3 className="sub-section-title">Data Export Options</h3>
          <div className="export-options">
            <div className="export-card">
              <div className="export-icon">
                <i className="fas fa-file-csv"></i>
              </div>
              <div className="export-info">
                <h4>Full Reservations Report</h4>
                <p>Export all reservation data with details</p>
                <button 
                  className="btn-primary"
                  onClick={generateCSV}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                  ) : (
                    <span>Export CSV</span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="export-card">
              <div className="export-icon">
                <i className="fas fa-file-excel"></i>
              </div>
              <div className="export-info">
                <h4>Monthly Usage Report</h4>
                <p>Export month-by-month usage statistics</p>
                <button 
                  className="btn-primary"
                  onClick={generateExcel}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                  ) : (
                    <span>Export Excel</span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="export-card">
              <div className="export-icon">
                <i className="fas fa-file-pdf"></i>
              </div>
              <div className="export-info">
                <h4>System Status Report</h4>
                <p>Export formatted system status summary</p>
                <button 
                  className="btn-primary"
                  onClick={generatePDF}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                  ) : (
                    <span>Export PDF</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* PDF Report Modal */}
        {showPDFReport && (
          <div className="modal-overlay">
            <div className="modal-content modal-xl">
              <PDFReport data={pdfData} onClose={closePDFReport} />
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Render error:", error);
    return (
      <div className="main-content">
        <div className="alert alert-error">
          <h3>Something went wrong</h3>
          <p>There was an error rendering the reports page. Please try refreshing the browser.</p>
          <p>Error: {error.message}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default AdminReports;