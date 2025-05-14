import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ClassroomReservation from './ClassroomReservation';
import ClassSchedule from './ClassSchedule';
import ProfessorTimetable from './ProfessorTimetable';
import MyReservations from './MyReservations';
import NotificationService from '../../services/NotificationService';
import NotificationPanel from '../common/NotificationPanel';
import '../../styles/dashboard.css';
import '../../styles/notifications.css';
import Profile from '../common/Profile';

// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';

const ProfessorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // Mock data - in a real app, these would come from an API or database
  const [myReservations, setMyReservations] = useState([
    {
      id: '1001',
      classroom: 'Room 101',
      date: '2025-03-25',
      time: '10:00 - 12:00',
      purpose: 'Physics 101 Lecture',
      status: 'Approved'
    },
    {
      id: '1003',
      classroom: 'Lab 305',
      date: '2025-03-27',
      time: '09:00 - 11:00',
      purpose: 'Chemistry Lab Session',
      status: 'Approved'
    },
    {
      id: '1004',
      classroom: 'Room 201',
      date: '2025-03-29',
      time: '14:00 - 16:00',
      purpose: 'Office Hours',
      status: 'Pending'
    }
  ]);

  const [availableClassrooms, setAvailableClassrooms] = useState([
    {
      id: 'C001',
      roomNumber: 'Room 101',
      type: 'Lecture Hall',
      capacity: 120,
      features: ['Projector', 'Whiteboard', 'Audio System']
    },
    {
      id: 'C002',
      roomNumber: 'Room 203',
      type: 'Classroom',
      capacity: 40,
      features: ['Projector', 'Whiteboard']
    },
    {
      id: 'C003',
      roomNumber: 'Lab 305',
      type: 'Computer Lab',
      capacity: 30,
      features: ['Computers', 'Projector', 'Whiteboard']
    }
  ]);
  
  const [todayClasses, setTodayClasses] = useState([
    {
      id: 'CL001',
      name: 'PHYS 101: Introduction to Physics',
      time: '9:00 - 10:30 AM',
      location: 'Room 101',
      students: 35
    },
    {
      id: 'CL002',
      name: 'PHYS 301: Advanced Mechanics',
      time: '11:00 AM - 12:30 PM',
      location: 'Room 203',
      students: 22
    },
    {
      id: 'CL003',
      name: 'Faculty Meeting',
      time: '2:00 - 4:00 PM',
      location: 'Conference Room 105',
      info: 'Department Planning'
    }
  ]);

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (currentUser.role !== 'professor') {
      logout();
      navigate('/');
      alert('You do not have permission to access the professor dashboard.');
    }
  }, [currentUser, navigate, logout]);
  
  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    
    switch (path) {
      case 'dashboard':
        setPageTitle('Dashboard');
        break;
      case 'reservations':
        setPageTitle('Reservations');
        break;
      case 'schedule':
        setPageTitle('Class Schedule');
        break;
      case 'timetable':
        setPageTitle('Timetable');
        break;
      case 'reserve':
        setPageTitle('Reserve Classroom');
        break;
      case 'profile':
        setPageTitle('Profile');
        break;
      default:
        setPageTitle('Dashboard');
    }
  }, [location]);

  // Initialize state with localStorage on component mount
  useEffect(() => {
    const storedReservations = localStorage.getItem('professorReservations');
    if (storedReservations) {
      setMyReservations(JSON.parse(storedReservations));
    } else {
      // Save initial reservations if none in localStorage
      localStorage.setItem('professorReservations', JSON.stringify(myReservations));
    }

    // Fetch notification count
    fetchNotificationCount();

    // Set up interval to refresh notification count periodically
    const interval = setInterval(fetchNotificationCount, 60000); // every minute
    
    return () => clearInterval(interval);
  }, []);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // If opening notifications, mark them as read
    if (!showNotifications) {
      markNotificationsAsRead();
    }
  };
  
  // Toggle sidebar menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Save reservations to localStorage when they change
  useEffect(() => {
    localStorage.setItem('professorReservations', JSON.stringify(myReservations));
  }, [myReservations]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const viewReservation = (id) => {
    const reservation = myReservations.find(r => r.id === id);
    if (reservation) {
      alert(`Viewing reservation: ${reservation.classroom} on ${reservation.date} at ${reservation.time} for ${reservation.purpose}`);
    }
  };

  const cancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservations = myReservations.filter(r => r.id !== id);
      setMyReservations(updatedReservations);
      alert('Reservation cancelled successfully.');
    }
  };

  // Function to handle reservation form submission
  const handleReservationSearch = (formData) => {
    const { date, startTime, endTime, classType, capacity } = formData;
    
    // Filter classrooms based on type and capacity
    const filteredRooms = availableClassrooms.filter(classroom => {
      return classroom.type === classType && classroom.capacity >= parseInt(capacity);
    });
    
    setReservations(filteredRooms);
    setShowModal(true);
  };

  // Function to make a reservation
  const makeReservation = (classroomId, date, time, purpose) => {
    const classroom = availableClassrooms.find(c => c.id === classroomId);
    if (!classroom) return;
    
    const newReservation = {
      id: `RES${Date.now()}`,
      classroom: classroom.roomNumber,
      date,
      time,
      purpose,
      status: 'Pending'
    };
    
    setMyReservations([...myReservations, newReservation]);
    setShowModal(false);
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, {currentUser?.firstName || 'Professor'}!</h2>
        <p>Manage your classroom reservations and teaching schedule here.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={myReservations.filter(r => r.status === 'Approved').length}
          color="blue"
        />
        <StatCard
          icon="fas fa-calendar-day"
          title="Upcoming Classes"
          value={todayClasses.length}
          color="green"
        />
        <StatCard
          icon="fas fa-history"
          title="Total Reservations"
          value={myReservations.length}
          color="yellow"
        />
        <StatCard
          icon="fas fa-users"
          title="Students Enrolled"
          value="87"
          color="red"
        />
      </div>
      
      {/* Upcoming Reservations Section */}
      <div className="section">
        <div className="section-header">
          <h2>My Upcoming Reservations</h2>
          <Link to="/professor/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Classroom</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.classroom}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>{reservation.purpose}</td>
                  <td>
                    <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-table btn-view"
                        onClick={() => viewReservation(reservation.id)}
                      >
                        View
                      </button>
                      <button 
                        className="btn-table btn-delete"
                        onClick={() => cancelReservation(reservation.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Today's Schedule Section */}
      <div className="section">
        <div className="section-header">
          <h2>Today's Schedule</h2>
          <div className="section-actions">
            <Link to="/professor/schedule" className="view-all-link">
              View Schedule <i className="fas fa-chevron-right"></i>
            </Link>
            <Link to="/professor/timetable" className="view-all-link">
              View Timetable <i className="fas fa-chevron-right"></i>
            </Link>
          </div>
        </div>
        
        <div className="today-classes">
          {todayClasses.map(classItem => (
            <div className="class-card" key={classItem.id}>
              <div className="class-time">{classItem.time}</div>
              <div className="class-details">
                <h3 className="class-name">{classItem.name}</h3>
                <p className="class-location">
                  <i className="fas fa-map-marker-alt"></i> {classItem.location}
                </p>
                {classItem.students && (
                  <p className="class-info">
                    <i className="fas fa-users"></i> {classItem.students} Students
                  </p>
                )}
                {classItem.info && (
                  <p className="class-info">
                    <i className="fas fa-clipboard-list"></i> {classItem.info}
                  </p>
                )}
              </div>
              <div className="class-actions">
                <button className="btn-small">View Details</button>
                {classItem.students && (
                  <button className="btn-small">Class Materials</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reserve Classroom Section */}
      <div className="section">
        <div className="section-header">
          <h2>Reserve a Classroom</h2>
        </div>
        
        <ClassroomReservation onSubmit={handleReservationSearch} />
      </div>
    </div>
  );

  // Sidebar navigation links
  const navLinks = [
    { to: '/professor', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/professor/reserve', icon: 'fas fa-calendar-plus', text: 'Reserve Classroom' },
    { to: '/professor/reservations', icon: 'fas fa-calendar-check', text: 'My Reservations' },
    { to: '/professor/schedule', icon: 'fas fa-calendar-alt', text: 'Class Schedule' },
    { to: '/professor/timetable', icon: 'fas fa-calendar-week', text: 'Timetable' },
    { to: '/professor/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Professor"
        notificationCount={notificationCount}
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>{pageTitle}</h1>
          <div className="header-actions">
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                <i className="fas fa-bell"></i>
                {notificationCount > 0 && (
                  <span className="header-notification-count">{notificationCount}</span>
                )}
              </button>
            </div>
            <div className="user-info">
              <span className="role-badge">Professor</span>
              <span>{currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="professor" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reserve" element={<ClassroomReservation onSubmit={handleReservationSearch} fullPage={true} />} />
          <Route path="/reservations" element={<MyReservations notificationCount={notificationCount} />} />
          <Route path="/schedule" element={<ClassSchedule classes={todayClasses} />} />
          <Route path="/timetable" element={<ProfessorTimetable />} />
          <Route path="/profile" element={<Profile />} /> 
          {/* Add more routes as needed */}
        </Routes>
      </div>
      
      {/* Available Classrooms Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        title="Available Classrooms"
      >
        <div id="available-classrooms-list">
          {reservations.length === 0 ? (
            <div className="no-results">
              <p>No classrooms matching your criteria are available.</p>
              <p>Try adjusting your search parameters.</p>
            </div>
          ) : (
            reservations.map(classroom => (
              <div className="classroom-item" key={classroom.id}>
                <h3>{classroom.roomNumber} ({classroom.type})</h3>
                <p><strong>Capacity:</strong> {classroom.capacity} students</p>
                <p><strong>Features:</strong> {classroom.features.join(', ')}</p>
                <button 
                  className="btn-primary reserve-btn"
                  onClick={() => makeReservation(
                    classroom.id, 
                    document.getElementById('reservation-date')?.value,
                    `${document.getElementById('start-time')?.value} - ${document.getElementById('end-time')?.value}`,
                    document.getElementById('purpose')?.value
                  )}
                >
                  Reserve this room
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProfessorDashboard;