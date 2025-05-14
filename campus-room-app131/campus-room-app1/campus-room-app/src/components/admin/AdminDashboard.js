import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationService from '../../services/NotificationService';
import NotificationPanel from '../common/NotificationPanel';
import '../../styles/dashboard.css';
import '../../styles/notifications.css';


// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import ReservationsList from './ReservationsList';
import UserManagement from './UserManagement';
import AdminClassrooms from './AdminClassrooms';
import AdminDemands from './AdminDemands';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import Profile from '../common/Profile';
import ClassGroupManagement from './ClassGroupManagement'; // Import the new component

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingNotificationCount, setPendingNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Fetch notification count on component mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        // Get unread notifications count
        const count = await NotificationService.getUnreadCount();
        setPendingNotificationCount(count);

        // Optionally set up polling to update the count periodically
        const interval = setInterval(async () => {
          const updatedCount = await NotificationService.getUnreadCount();
          setPendingNotificationCount(updatedCount);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error fetching notification count:", error);
        // In case of error, you could set a fallback value based on pendingDemands
        setPendingNotificationCount(pendingDemands.length);
      }
    };

    fetchNotificationCount();
  }, []);

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // If opening notifications, mark them as read
    if (!showNotifications) {
      markNotificationsAsRead();
    }
  };
  
  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setPendingNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };
  
  // Mock data - in a real app, these would come from an API
  const [stats, setStats] = useState({
    totalClassrooms: 24,
    activeReservations: 18,
    pendingDemands: 7,
    totalUsers: 156,
    totalClassGroups: 3 // Added new stat for class groups
  });
  
  const [recentReservations, setRecentReservations] = useState([
    {
      id: 'RES1001',
      classroom: 'Room 101',
      reservedBy: 'Professor Smith',
      role: 'Professor',
      date: 'Mar 25, 2025',
      time: '10:00 - 12:00',
      status: 'Approved'
    },
    {
      id: 'RES1002',
      classroom: 'Room 203',
      reservedBy: 'John Doe',
      role: 'Student',
      date: 'Mar 26, 2025',
      time: '14:00 - 16:00',
      status: 'Pending'
    },
    {
      id: 'RES1003',
      classroom: 'Lab 305',
      reservedBy: 'Professor Johnson',
      role: 'Professor',
      date: 'Mar 27, 2025',
      time: '09:00 - 11:00',
      status: 'Approved'
    }
  ]);
  
  const [pendingDemands, setPendingDemands] = useState([
    {
      id: 'DEM1001',
      classroom: 'Room 203',
      requestedBy: 'John Doe',
      role: 'Student',
      date: 'Mar 26, 2025',
      time: '14:00 - 16:00',
      purpose: 'Group Study'
    },
    {
      id: 'DEM1002',
      classroom: 'Room 105',
      requestedBy: 'Jane Smith',
      role: 'Student',
      date: 'Mar 28, 2025',
      time: '10:00 - 12:00',
      purpose: 'Project Meeting'
    },
    {
      id: 'DEM1003',
      classroom: 'Lab 201',
      requestedBy: 'Professor Davis',
      role: 'Professor',
      date: 'Apr 1, 2025',
      time: '13:00 - 15:00',
      purpose: 'Extra Lab Session'
    }
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const approveReservation = (id) => {
    // In a real app, this would call an API to update the database
    const updatedReservations = recentReservations.map(reservation => {
      if (reservation.id === id) {
        return { ...reservation, status: 'Approved' };
      }
      return reservation;
    });
    
    setRecentReservations(updatedReservations);
    
    // Also update pending demands
    const updatedDemands = pendingDemands.filter(demand => demand.id !== id);
    setPendingDemands(updatedDemands);
    
    // Update notification count after approval
    setPendingNotificationCount(prev => Math.max(0, prev - 1));
    
    alert('Reservation approved successfully.');
  };

  const rejectReservation = (id) => {
    if (window.confirm('Are you sure you want to reject this reservation?')) {
      // Remove from recent reservations if exists
      const updatedReservations = recentReservations.filter(
        reservation => reservation.id !== id
      );
      setRecentReservations(updatedReservations);
      
      // Remove from pending demands if exists
      const updatedDemands = pendingDemands.filter(demand => demand.id !== id);
      setPendingDemands(updatedDemands);
      
      // Update notification count after rejection
      setPendingNotificationCount(prev => Math.max(0, prev - 1));
      
      alert('Reservation rejected successfully.');
    }
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Stats Overview */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-chalkboard"
          title="Total Classrooms"
          value={stats.totalClassrooms}
          color="blue"
          description="8 classrooms, 10 labs, 6 lecture halls"
        />
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={stats.activeReservations}
          color="green"
          description="12 by professors, 6 by students"
        />
        <StatCard
          icon="fas fa-bell"
          title="Pending Demands"
          value={stats.pendingDemands}
          color="yellow"
          description="Requires your approval"
        />
        <StatCard
          icon="fas fa-users"
          title="Total Users"
          value={stats.totalUsers}
          color="red"
          description="42 professors, 114 students"
        />
        <StatCard
          icon="fas fa-graduation-cap"
          title="Class Groups"
          value={stats.totalClassGroups}
          color="purple"
          description="Active course groups"
        />
      </div>
      
      {/* Recent Reservations */}
      <div className="section">
        <div className="section-header">
          <h2>Recent Reservations</h2>
          <Link to="/admin/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Classroom</th>
                <th>Reserved By</th>
                <th>Role</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td>{reservation.classroom}</td>
                  <td>{reservation.reservedBy}</td>
                  <td>{reservation.role}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>
                    <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table btn-view">
                        View
                      </button>
                      {reservation.status === 'Pending' && (
                        <>
                          <button 
                            className="btn-table btn-edit"
                            onClick={() => approveReservation(reservation.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn-table btn-delete"
                            onClick={() => rejectReservation(reservation.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {reservation.status === 'Approved' && (
                        <button 
                          className="btn-table btn-delete"
                          onClick={() => rejectReservation(reservation.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pending Demands */}
      <div className="section">
        <div className="section-header">
          <h2>Pending Approval Demands</h2>
          <Link to="/admin/demands" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Classroom</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDemands.map(demand => (
                <tr key={demand.id}>
                  <td>{demand.id}</td>
                  <td>{demand.classroom}</td>
                  <td>{demand.requestedBy}</td>
                  <td>{demand.role}</td>
                  <td>{demand.date}</td>
                  <td>{demand.time}</td>
                  <td>{demand.purpose}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table btn-view">
                        View
                      </button>
                      <button 
                        className="btn-table btn-edit"
                        onClick={() => approveReservation(demand.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-table btn-delete"
                        onClick={() => rejectReservation(demand.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Sidebar navigation links - updated to include Class Groups
  const navLinks = [
    { to: '/admin', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/admin/classrooms', icon: 'fas fa-chalkboard', text: 'Classrooms' },
    { to: '/admin/reservations', icon: 'fas fa-calendar-check', text: 'Reservations' },
    { to: '/admin/demands', icon: 'fas fa-bell', text: 'Demands' },
    { to: '/admin/users', icon: 'fas fa-users', text: 'Users' },
    { to: '/admin/class-groups', icon: 'fas fa-graduation-cap', text: 'Class Groups' }, // Added new link
    { to: '/admin/reports', icon: 'fas fa-chart-bar', text: 'Reports' },
    { to: '/admin/settings', icon: 'fas fa-cog', text: 'Settings' },
    { to: '/admin/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Admin"
        notificationCount={pendingNotificationCount}  // Pass the count to SideNav
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                <i className="fas fa-bell"></i>
                {pendingNotificationCount > 0 && (
                  <span className="header-notification-count">{pendingNotificationCount}</span>
                )}
              </button>
            </div>
            <button className="action-button">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="admin" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reservations" element={<ReservationsList reservations={recentReservations} notificationCount={pendingNotificationCount} />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/classrooms" element={<AdminClassrooms />} />
          <Route path="/demands" element={<AdminDemands />} />
          <Route path="/class-groups" element={<ClassGroupManagement />} /> {/* New route */}
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/reports" element={<AdminReports />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;