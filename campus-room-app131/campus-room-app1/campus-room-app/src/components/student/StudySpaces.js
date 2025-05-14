import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';

const StudySpaces = () => {
  const { currentUser } = useAuth();
  const [studyRooms, setStudyRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    date: '',
    time: '',
    type: '',
    capacity: ''
  });
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reservationForm, setReservationForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfPeople: '',
    notes: ''
  });
  
  // Initialize study rooms from localStorage
  useEffect(() => {
    const loadStudyRooms = () => {
      const storedRooms = localStorage.getItem('studyRooms');
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms);
        setStudyRooms(rooms);
        setFilteredRooms(rooms);
      } else {
        // Default study rooms if none in localStorage
        const defaultRooms = [
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
        ];
        setStudyRooms(defaultRooms);
        setFilteredRooms(defaultRooms);
        localStorage.setItem('studyRooms', JSON.stringify(defaultRooms));
      }
    };
    
    loadStudyRooms();
  }, []);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...studyRooms];
    
    if (filterCriteria.type) {
      filtered = filtered.filter(room => room.type === filterCriteria.type);
    }
    
    if (filterCriteria.capacity) {
      filtered = filtered.filter(room => room.capacity >= parseInt(filterCriteria.capacity));
    }
    
    // More complex filtering logic would be implemented in a real app
    // For example, checking availability based on date and time
    
    setFilteredRooms(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({
      date: '',
      time: '',
      type: '',
      capacity: ''
    });
    setFilteredRooms(studyRooms);
  };

  // Open reservation modal
  const openReservationModal = (room) => {
    setSelectedRoom(room);
    setReservationForm({
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      numberOfPeople: '',
      notes: ''
    });
    setShowReserveModal(true);
  };

  // Handle reservation form input
  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit reservation
  const submitReservation = (e) => {
    e.preventDefault();
    
    // Create reservation object
    const newReservation = {
      id: `SR${Date.now()}`,
      room: selectedRoom.name,
      date: reservationForm.date,
      time: `${reservationForm.startTime} - ${reservationForm.endTime}`,
      purpose: reservationForm.purpose,
      status: 'Pending',
      userId: currentUser.email,
      userRole: 'student'
    };
    
    // Save to localStorage
    const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
    studentReservations.push(newReservation);
    localStorage.setItem('studentReservations', JSON.stringify(studentReservations));
    
    // Close modal and show confirmation
    setShowReserveModal(false);
    alert(`Reservation request submitted for ${selectedRoom.name} on ${reservationForm.date} at ${reservationForm.startTime} - ${reservationForm.endTime}. Pending approval.`);
  };

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>Available Study Spaces</h2>
        </div>
        
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input 
              type="date" 
              id="date" 
              name="date"
              value={filterCriteria.date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Time</label>
            <select 
              id="time" 
              name="time"
              value={filterCriteria.time}
              onChange={handleFilterChange}
            >
              <option value="">Any Time</option>
              <option value="morning">Morning (8AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 5PM)</option>
              <option value="evening">Evening (5PM - 10PM)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="type">Room Type</label>
            <select 
              id="type" 
              name="type"
              value={filterCriteria.type}
              onChange={handleFilterChange}
            >
              <option value="">Any Type</option>
              <option value="study">Study Room</option>
              <option value="computer">Computer Lab</option>
              <option value="classroom">Classroom</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Min. Capacity</label>
            <input 
              type="number" 
              id="capacity" 
              name="capacity"
              min="1"
              value={filterCriteria.capacity}
              onChange={handleFilterChange}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={applyFilters}
          >
            Search
          </button>
          <button 
            className="btn-secondary"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
        
        <div className="rooms-grid">
          {filteredRooms.length === 0 ? (
            <div className="no-results">
              <p>No study spaces matching your criteria are available.</p>
              <p>Try adjusting your search parameters.</p>
            </div>
          ) : (
            filteredRooms.map(room => (
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
                  <p><i className="fas fa-list"></i> Features: {room.features.join(', ')}</p>
                  <p><i className="fas fa-clock"></i> Available: {room.availableTimes}</p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => openReservationModal(room)}
                >
                  Reserve
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Reservation Modal */}
      <Modal 
        show={showReserveModal} 
        onClose={() => setShowReserveModal(false)}
        title={`Reserve ${selectedRoom?.name || 'Study Space'}`}
      >
        <form onSubmit={submitReservation}>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input 
              type="date" 
              id="date" 
              name="date"
              value={reservationForm.date}
              onChange={handleReservationChange}
              required 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input 
                type="time" 
                id="startTime" 
                name="startTime"
                value={reservationForm.startTime}
                onChange={handleReservationChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input 
                type="time" 
                id="endTime" 
                name="endTime"
                value={reservationForm.endTime}
                onChange={handleReservationChange}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <select 
              id="purpose" 
              name="purpose"
              value={reservationForm.purpose}
              onChange={handleReservationChange}
              required
            >
              <option value="">Select Purpose</option>
              <option value="Individual Study">Individual Study</option>
              <option value="Group Study">Group Study</option>
              <option value="Project Work">Project Work</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="numberOfPeople">Number of People</label>
            <input 
              type="number" 
              id="numberOfPeople" 
              name="numberOfPeople"
              min="1"
              value={reservationForm.numberOfPeople}
              onChange={handleReservationChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea 
              id="notes" 
              name="notes"
              rows="3"
              value={reservationForm.notes}
              onChange={handleReservationChange}
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">Submit Reservation</button>
        </form>
      </Modal>
    </div>
  );
};

export default StudySpaces;