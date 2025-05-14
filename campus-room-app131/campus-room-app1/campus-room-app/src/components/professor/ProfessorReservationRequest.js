import React, { useState, useEffect } from 'react';
import { professorAPI, roomAPI } from '../../api';
import Modal from '../common/Modal';
import '../../styles/reservation.css';

const ProfessorReservationRequest = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    capacity: 0
  });
  const [reservationDetails, setReservationDetails] = useState({
    classroomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  
  
  // Load all classrooms on component mount
  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true);
        const response = await roomAPI.getAllClassrooms();
        setClassrooms(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading classrooms:", err);
        setError("Failed to load classrooms");
        setLoading(false);
      }
    };
    
    loadClassrooms();
  }, []);

  // Add the validation functions here
// Add this function to validate time selection
const validateTimes = (start, end) => {
  if (!start || !end) return true; // Skip validation if values are empty
  
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);
  
  return endMinutes > startMinutes;
};

// Add this helper function to convert time to minutes
const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':');
  return parseInt(hours) * 60 + parseInt(minutes);
};
  
  // Handle search criteria change
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };
  
  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate search criteria
      if (!searchCriteria.date || !searchCriteria.startTime || !searchCriteria.endTime) {
        setError("Please select date and time");
        setLoading(false);
        return;
      }
      
      // Validate that end time is after start time
      if (!validateTimes(searchCriteria.startTime, searchCriteria.endTime)) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }
      
      // Perform search using API
      const response = await professorAPI.searchAvailableClassrooms(searchCriteria);
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        setError("No available classrooms found for the selected criteria");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error searching for available classrooms:", err);
      setError("Failed to search for available classrooms");
      setLoading(false);
    }
  };
  
  // Select a classroom for reservation
  const selectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
    
    // Populate reservation details
    setReservationDetails({
      classroomId: classroom.id,
      date: searchCriteria.date,
      startTime: searchCriteria.startTime,
      endTime: searchCriteria.endTime,
      purpose: ''
    });
    
    setShowConfirmModal(true);
  };
  
  // Handle reservation details change
  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit reservation request
  const submitReservation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate purpose
      if (!reservationDetails.purpose) {
        setError("Please provide a purpose for your reservation");
        setLoading(false);
        return;
      }
      
      // Send reservation request
      const response = await professorAPI.requestReservation(reservationDetails);
      
      // Close modal and show success message
      setShowConfirmModal(false);
      setSuccess("Reservation request submitted successfully! It will be reviewed by an administrator.");
      
      // Clear search results
      setSearchResults([]);
      
      // Store the new reservation in localStorage
      const storedReservations = localStorage.getItem('professorReservations') || '[]';
      const parsedReservations = JSON.parse(storedReservations);
      
      // Format the new reservation
      const newReservation = {
        id: response.data?.id || `temp-${Date.now()}`,
        classroom: selectedClassroom.roomNumber,
        date: reservationDetails.date,
        startTime: reservationDetails.startTime,
        endTime: reservationDetails.endTime,
        time: `${reservationDetails.startTime} - ${reservationDetails.endTime}`,
        purpose: reservationDetails.purpose,
        status: 'PENDING'
      };
      
      // Add the new reservation to the array
      parsedReservations.push(newReservation);
      
      // Update localStorage
      localStorage.setItem('professorReservations', JSON.stringify(parsedReservations));
      
      setLoading(false);
    } catch (err) {
      console.error("Error submitting reservation request:", err);
      setError("Failed to submit reservation request");
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setSearchCriteria({
      date: '',
      startTime: '',
      endTime: '',
      type: '',
      capacity: 0
    });
    setSearchResults([]);
    setError(null);
    setSuccess(null);
  };
  
  return (
    <div className="reservation-container">
      <div className="reservation-header">
        <h2>Find Available Classrooms</h2>
        <p>Search for available classrooms based on your requirements</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-control"
                value={searchCriteria.date}
                onChange={handleSearchChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <select
                id="startTime"
                name="startTime"
                className="form-control"
                value={searchCriteria.startTime}
                onChange={handleSearchChange}
                required
              >
                <option value="">Select Start Time</option>
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
                <option value="18:00">06:00 PM</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <select
  id="startTime"
  name="startTime"
  className="form-control"
  value={searchCriteria.startTime}
  onChange={handleSearchChange}
  required
>
  <option value="">Select Start Time</option>
  <option value="08:00">08:00</option>
  <option value="09:00">09:00</option>
  <option value="10:00">10:00</option>
  <option value="11:00">11:00</option>
  <option value="12:00">12:00</option>
  <option value="13:00">13:00</option>
  <option value="14:00">14:00</option>
  <option value="15:00">15:00</option>
  <option value="16:00">16:00</option>
  <option value="17:00">17:00</option>
</select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Room Type</label>
              <select
  id="endTime"
  name="endTime"
  className="form-control"
  value={searchCriteria.endTime}
  onChange={handleSearchChange}
  required
>
  <option value="">Select End Time</option>
  <option value="09:00">09:00</option>
  <option value="10:00">10:00</option>
  <option value="11:00">11:00</option>
  <option value="12:00">12:00</option>
  <option value="13:00">13:00</option>
  <option value="14:00">14:00</option>
  <option value="15:00">15:00</option>
  <option value="16:00">16:00</option>
  <option value="17:00">17:00</option>
  <option value="18:00">18:00</option>
</select>
            </div>
            
            <div className="form-group">
              <label htmlFor="capacity">Minimum Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                className="form-control"
                value={searchCriteria.capacity}
                onChange={handleSearchChange}
                min="0"
              />
            </div>
            
            <div className="form-group button-group">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {searchResults.length > 0 && (
        <div className="results-container">
          <h3>Available Classrooms</h3>
          <div className="classroom-grid">
            {searchResults.map(classroom => (
              <div key={classroom.id} className="classroom-card">
                <div className="classroom-card-header">
                  <h4>{classroom.roomNumber}</h4>
                  <span className={`room-type ${classroom.type.replace(/\s+/g, '-').toLowerCase()}`}>
                    {classroom.type}
                  </span>
                </div>
                <div className="classroom-card-body">
                  <p><strong>Capacity:</strong> {classroom.capacity} seats</p>
                  <p>
                    <strong>Features:</strong>{' '}
                    {classroom.features && classroom.features.length > 0
                      ? classroom.features.join(', ')
                      : 'No special features'}
                  </p>
                </div>
                <div className="classroom-card-footer">
                  <button 
                    className="btn-primary"
                    onClick={() => selectClassroom(classroom)}
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Reservation Request"
      >
        {selectedClassroom && (
          <div className="reservation-form">
            <div className="reservation-details">
              <div className="detail-item">
                <span className="detail-label">Classroom:</span>
                <span className="detail-value">{selectedClassroom.roomNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedClassroom.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Capacity:</span>
                <span className="detail-value">{selectedClassroom.capacity} seats</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{reservationDetails.date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{reservationDetails.startTime} - {reservationDetails.endTime}</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="purpose">Purpose of Reservation*</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  className="form-control"
                  value={reservationDetails.purpose}
                  onChange={handleReservationChange}
                  rows="3"
                  placeholder="Please explain the purpose of your reservation"
                  required
                ></textarea>
              </div>
              
              <p className="form-note">
                * Please note that your reservation request will be reviewed by an administrator.
                You will receive a notification once your request is approved or rejected.
              </p>
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  onClick={submitReservation}
                  disabled={loading || !reservationDetails.purpose}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfessorReservationRequest;