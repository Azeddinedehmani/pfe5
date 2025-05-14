import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoomReservation from './RoomReservation';
import StudentMyReservations from './StudentMyReservations';
import Profile from '../common/Profile';
import NotificationPanel from '../common/NotificationPanel';
import NotificationService from '../../services/NotificationService';

import StudentTimetable from './StudentTimetable';

import '../../styles/dashboard.css';
import '../../styles/notifications.css';

// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Mock data - in a real app, these would come from an API
  const [myReservations, setMyReservations] = useState([
    {
      id: '2001',
      room: 'Study Room 202',
      date: '2025-03-26',
      time: '14:00 - 16:00',
      purpose: 'Group Study',
      status: 'Pending'
    },
    {
      id: '2002',
      room: 'Computer Lab 105',
      date: '2025-03-28',
      time: '10:00 - 12:00',
      purpose: 'Project Work',
      status: 'Approved'
    }
  ]);

  const [studyRooms, setStudyRooms] = useState([
    {
      id: 'SR101',
      name: 'Study Room 101',
      type: 'study',
      capacity: 6,
      features: ['Whiteboard', 'Wi-Fi'],
      availableTimes: '8AM - 9PM',
      image: '/images/study-room.jpg'
    },
    {
      id: 'CL105',
      name: 'Computer Lab 105',
      type: 'computer',
      capacity: 25,
      features: ['Computers', 'Projector'],
      availableTimes: '10AM - 6PM',
      image: '/images/computer-lab.jpg'
    },
    {
      id: 'CR203',
      name: 'Classroom 203',
      type: 'classroom',
      capacity: 40,
      features: ['Projector', 'Audio System'],
      availableTimes: '5PM - 10PM',
      image: '/images/classroom.jpg'
    }
  ]);
  
  const [todayClasses, setTodayClasses] = useState([
    {
      id: 'CL001',
      name: 'CS 101: Intro to Programming',
      time: '9:00 - 10:30 AM',
      location: 'Room 101',
      instructor: 'Professor Johnson'
    },
    {
      id: 'CL002',
      name: 'MATH 201: Calculus II',
      time: '1:00 - 2:30 PM',
      location: 'Room 203',
      instructor: 'Professor Wilson'
    },
    {
      id: 'CL003',
      name: 'Study Group',
      time: '3:30 - 4:30 PM',
      location: 'Library',
      participants: 5
    }
  ]);

  // Initialize state with localStorage on component mount
  useEffect(() => {
    const storedReservations = localStorage.getItem('studentReservations');
    if (storedReservations) {
      setMyReservations(JSON.parse(storedReservations));
    } else {
      // Save initial reservations if none in localStorage
      localStorage.setItem('studentReservations', JSON.stringify(myReservations));
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
    localStorage.setItem('studentReservations', JSON.stringify(myReservations));
  }, [myReservations]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const viewReservation = (id) => {
    const reservation = myReservations.find(r => r.id === id);
    if (reservation) {
      alert(`Viewing reservation: ${reservation.room} on ${reservation.date} at ${reservation.time} for ${reservation.purpose}`);
    }
  };

  const cancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservations = myReservations.filter(r => r.id !== id);
      setMyReservations(updatedReservations);
      alert('Reservation cancelled successfully.');
    }
  };

  // Filter rooms based on criteria
  const filterRooms = (date, time, type) => {
    let filteredRooms = [...studyRooms];
    
    if (type) {
      filteredRooms = filteredRooms.filter(room => room.type === type);
    }
    
    return filteredRooms;
  };

  // Open reservation modal for a specific room
  const openReservationModal = (room) => {
    setSelectedRoom(room);
    setShowReserveModal(true);
  };

  // Create a new reservation
  const createReservation = (formData) => {
    const { roomName, date, time, purpose } = formData;
    
    // Create a new reservation object
    const newReservation = {
      id: `RES${Date.now()}`,
      room: roomName,
      date: date,
      time: time,
      purpose: purpose,
      status: 'Pending'
    };
    
    // Add to reservations array
    setMyReservations([...myReservations, newReservation]);
    
    // Close the modal
    setShowReserveModal(false);
    
    // Show success message
    alert(`Reservation request submitted for ${roomName} on ${date} at ${time}. Pending approval.`);
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, {currentUser?.firstName || 'Student'}!</h2>
        <p>Reserve study rooms and manage your academic schedule here.</p>
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
          icon="fas fa-clock"
          title="Study Hours This Week"
          value="14"
          color="green"
        />
        <StatCard
          icon="fas fa-history"
          title="Total Reservations"
          value={myReservations.length}
          color="yellow"
        />
        <StatCard
          icon="fas fa-calendar-day"
          title="Classes Today"
          value={todayClasses.length}
          color="red"
        />
      </div>
      
      {/* Upcoming Reservations Section */}
      <div className="section">
        <div className="section-header">
          <h2>My Upcoming Reservations</h2>
          <Link to="/student/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
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
                  <td>{reservation.room}</td>
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
      
      {/* Today's Classes Section */}
      <div className="section">
        <div className="section-header">
          <h2>Today's Classes</h2>
          <Link to="/student/schedule" className="view-all-link">
            View Full Schedule <i className="fas fa-chevron-right"></i>
          </Link>
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
                {classItem.instructor && (
                  <p className="class-instructor">
                    <i className="fas fa-user"></i> {classItem.instructor}
                  </p>
                )}
                {classItem.participants && (
                  <p className="class-participants">
                    <i className="fas fa-users"></i> {classItem.participants} Participants
                  </p>
                )}
              </div>
              <div className="class-actions">
                <button className="btn-small">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Available Study Spaces Section */}
      <div className="section">
        <div className="section-header">
          <h2>Available Study Spaces</h2>
          <Link to="/student/reserve" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="filter-date">Date</label>
            <input type="date" id="filter-date" name="filterDate" />
          </div>
          <div className="form-group">
            <label htmlFor="filter-time">Time</label>
            <select id="filter-time" name="filterTime">
              <option value="">Any Time</option>
              <option value="morning">Morning (8AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 5PM)</option>
              <option value="evening">Evening (5PM - 10PM)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="filter-type">Room Type</label>
            <select id="filter-type" name="filterType">
              <option value="">Any Type</option>
              <option value="study">Study Room</option>
              <option value="computer">Computer Lab</option>
              <option value="classroom">Classroom</option>
            </select>
          </div>
          <button 
            id="filter-btn" 
            className="btn-primary"
            onClick={() => {
              const date = document.getElementById('filter-date').value;
              const time = document.getElementById('filter-time').value;
              const type = document.getElementById('filter-type').value;
              filterRooms(date, time, type);
            }}
          >
            Search
          </button>
        </div>
        
        <div className="rooms-grid" id="available-rooms">
          {studyRooms.map(room => (
            <div className="room-card" key={room.id}>
              <div 
                className="room-image" 
                style={{ backgroundImage: `url(${room.image})` }}
              >
                <span className="status-badge status-available">Available</span>
              </div>
              <div className="room-details">
                <h3>{room.name}</h3>
                <p><i className="fas fa-users"></i> Capacity: {room.capacity} people</p>
                <p><i className="fas fa-list"></i> Features: {Array.isArray(room.features) ? room.features.join(', ') : room.features}</p>
                <p><i className="fas fa-clock"></i> Available: {room.availableTimes}</p>
              </div>
              <button 
                className="btn-primary reserve-btn"
                onClick={() => openReservationModal(room)}
              >
                Reserve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Sidebar navigation links
  const navLinks = [
    { to: '/student', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/student/reserve', icon: 'fas fa-calendar-plus', text: 'Reserve Study Room' },
    { to: '/student/reservations', icon: 'fas fa-calendar-check', text: 'My Reservations' },
    { to: '/student/timetable', icon: 'fas fa-calendar-week', text: 'Emploi du temps', exact: false },
    { to: '/student/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Student"
        notificationCount={notificationCount}
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>Student Dashboard</h1>
          <div className="header-actions">
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                <i className="fas fa-bell"></i>
                {notificationCount > 0 && (
                  <span className="notification-count">{notificationCount}</span>
                )}
              </button>
            </div>
            <div className="user-info">
              <span className="role-badge">Student</span>
              <span>{currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="student" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reserve" element={<RoomReservation rooms={studyRooms} onReserve={openReservationModal} />} />
          <Route path="/reservations" element={<StudentMyReservations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/timetable" element={<StudentTimetable />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
      
      {/* Room Reservation Modal */}
      <Modal 
        show={showReserveModal} 
        onClose={() => setShowReserveModal(false)}
        title="Reserve Room"
      >
        {selectedRoom && (
          <form 
            id="student-reserve-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = {
                roomName: selectedRoom.name,
                date: e.target.date.value,
                time: `${e.target.startTime.value} - ${e.target.endTime.value}`,
                purpose: e.target.purpose.value
              };
              createReservation(formData);
            }}
          >
            <input type="hidden" name="selectedRoom" value={selectedRoom.name} />
            <div className="form-group">
              <label htmlFor="reservation-date">Date</label>
              <input type="date" id="reservation-date" name="date" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-time">Start Time</label>
                <input type="time" id="start-time" name="startTime" required />
              </div>
              <div className="form-group">
                <label htmlFor="end-time">End Time</label>
                <input type="time" id="end-time" name="endTime" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="purpose">Purpose</label>
              <select id="purpose" name="purpose" required>
                <option value="">Select Purpose</option>
                <option value="Individual Study">Individual Study</option>
                <option value="Group Study">Group Study</option>
                <option value="Project Work">Project Work</option>
                <option value="Meeting">Meeting</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="number-of-people">Number of People</label>
              <input type="number" id="number-of-people" name="numberOfPeople" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="additional-notes">Additional Notes</label>
              <textarea id="additional-notes" name="notes" rows="3"></textarea>
            </div>
            <button type="submit" className="btn-primary">Submit Reservation</button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboard;