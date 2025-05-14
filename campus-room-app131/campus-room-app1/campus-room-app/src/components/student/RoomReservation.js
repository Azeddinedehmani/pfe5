import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import API from '../../api';
import ReservationEmailService from '../../services/ReservationEmailService';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const StudentClassroomReservation = ({ fullPage = false }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const isEditMode = queryParams.get('edit') === 'true';
  
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    startTime: '',
    endTime: '',
    classType: '',
    capacity: '',
    purpose: '',
    notes: '',
    classroomId: '',
    isEdit: false // Flag for edit mode
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'search'
  const [fetchError, setFetchError] = useState(null);

  // Load all classrooms when component mounts
  useEffect(() => {
    fetchAllClassrooms();
    
    // Process any queued emails that couldn't be sent previously
    const processQueuedEmails = async () => {
      try {
        const result = await ReservationEmailService.processEmailQueue();
        if (result.success > 0) {
          console.log(`Processed ${result.success} queued emails`);
        }
      } catch (error) {
        console.error('Error processing email queue:', error);
      }
    };
    
    processQueuedEmails();
    
    // Check if we're in edit mode and load reservation data
    if (isEditMode) {
      loadReservationForEditing();
    }
  }, [isEditMode]);

  const validateTimeRange = () => {
    if (!formData.startTime || !formData.endTime) return true;
    
    const startTime = formData.startTime;
    const endTime = formData.endTime;
    
    // Convert to minutes since midnight
    const getMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = getMinutes(startTime);
    const endMinutes = getMinutes(endTime);
    
    // Validate time range (8:00 - 18:00)
    const min = getMinutes('08:00');
    const max = getMinutes('18:00');
    
    if (startMinutes < min || endMinutes > max) {
      setMessage({
        text: 'Reservation times must be between 8:00 and 18:00',
        type: 'error'
      });
      return false;
    }
    
    // Ensure end time is after start time
    if (endMinutes <= startMinutes) {
      setMessage({
        text: 'End time must be after start time',
        type: 'error'
      });
      return false;
    }
    
    return true;
  };

  // Function to load reservation data for editing
  const loadReservationForEditing = () => {
    try {
      const editingReservation = localStorage.getItem('editingReservation');
      if (!editingReservation) {
        console.error('No reservation data found for editing');
        setMessage({ text: 'No reservation data found for editing', type: 'error' });
        return;
      }
      
      const reservationData = JSON.parse(editingReservation);
      console.log('Loaded reservation data for editing:', reservationData);
      
      // Set form data with the reservation values
      setFormData({
        id: reservationData.id || '',
        date: reservationData.date || '',
        startTime: reservationData.startTime || '',
        endTime: reservationData.endTime || '',
        classType: reservationData.classType || '',
        capacity: reservationData.capacity || '10', // Default capacity if none provided
        purpose: reservationData.purpose || '',
        notes: reservationData.notes || '',
        classroomId: reservationData.classroomId || '',
        isEdit: true // Flag this as an edit operation
      });
      
      // Set view mode to search to show the form
      setViewMode('search');
      
      // Find the classroom from the stored information and set it as selected
      if (reservationData.classroomId) {
        // We'll set the selected classroom when fetchAllClassrooms completes
        // The effect that depends on allClassrooms will handle this
      } else if (reservationData.classroom) {
        // If we only have the classroom name, we'll try to find it by name after loading
        console.log('Will search for classroom by name:', reservationData.classroom);
      }
    } catch (error) {
      console.error('Error loading reservation data for editing:', error);
      setMessage({ text: 'Error loading reservation data for editing', type: 'error' });
    }
  };
  
  // Effect to set the selected classroom after all classrooms are loaded in edit mode
  useEffect(() => {
    if (isEditMode && allClassrooms.length > 0) {
      const editingReservation = JSON.parse(localStorage.getItem('editingReservation') || '{}');
      
      // Try to find the classroom either by ID or by name
      let classroom = null;
      
      if (editingReservation.classroomId) {
        classroom = allClassrooms.find(c => c.id === editingReservation.classroomId);
      }
      
      if (!classroom && editingReservation.classroom) {
        classroom = allClassrooms.find(c => 
          c.roomNumber === editingReservation.classroom || 
          c.name === editingReservation.classroom
        );
      }
      
      if (classroom) {
        console.log('Found classroom for editing:', classroom);
        setSelectedClassroom(classroom);
        
        // Update the formData with the classroom ID if it wasn't set
        if (!formData.classroomId) {
          setFormData(prev => ({
            ...prev,
            classroomId: classroom.id
          }));
        }
      } else {
        console.warn('Could not find matching classroom for editing');
      }
    }
  }, [allClassrooms, isEditMode, formData.classroomId]);

  // Create fallback methods if API is not properly defined
useEffect(() => {
  if (!API.studentAPI) {
    console.error('studentAPI is undefined, creating fallback methods');
    // Create fallback methods
    API.studentAPI = {
      searchAvailableClassrooms: (criteria) => API.post('/api/student/classroom-reservations/search', criteria),
      requestClassroomReservation: (data) => API.post('/api/student/classroom-reservations/request', data),
      editClassroomReservation: (id, data) => API.put(`/api/student/classroom-reservations/${id}`, data),
      cancelReservation: (id) => API.put(`/api/student/reservations/${id}/cancel`),
      getMyReservations: () => API.get('/api/student/my-reservations')
    };
  }
}, []);

  // Function to fetch all classrooms using the API service
  const fetchAllClassrooms = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      // Try multiple possible endpoints in case one fails
      let response;
      try {
        response = await API.get('/api/rooms/classrooms');
      } catch (err) {
        console.error('Error using primary endpoint:', err);
        // Direct fallback with fetch
        try {
          response = await API.get('/api/classrooms');
        } catch (secondErr) {
          console.error('Error using secondary endpoint:', secondErr);
          // Final fallback
          response = await fetch('/public-classrooms').then(res => res.json()).then(data => ({ data }));
        }
      }
      
      const data = response.data;
      console.log('Classrooms data fetched:', data);
      setAllClassrooms(data);
      
      if (data.length === 0) {
        setMessage({ 
          text: 'No classrooms available at the moment.', 
          type: 'warning' 
        });
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      setFetchError(error.message || 'An error occurred while loading classrooms');
      setMessage({ 
        text: 'An error occurred while loading classrooms', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    setSearchResults([]);
    setSelectedClassroom(null);
    setSearchPerformed(true);
    setViewMode('search');
  
    try {
      // Validate inputs
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.capacity) {
        setMessage({ text: 'Please fill in all required fields', type: 'error' });
        setIsLoading(false);
        return;
      }
  
      // Add the validation check here
      if (!validateTimeRange()) {
        setIsLoading(false);
        return;
      }
  
      // Convert capacity to number
      const capacityNum = parseInt(formData.capacity, 10);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        setMessage({ text: 'Capacity must be a positive number', type: 'error' });
        setIsLoading(false);
        return;
      }
  
      // Create search request object
      const searchRequest = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        classType: formData.classType || '',
        capacity: capacityNum
      };
      
      console.log('Searching available classrooms with request:', searchRequest);
      
      // Modified: Use the student API for searching
      let response;
      try {
        // First try student-specific endpoint
        response = await API.studentAPI.searchAvailableClassrooms(searchRequest);
      } catch (err) {
        console.error('Error using student API for search:', err);
        
        try {
          // Try general room search endpoint as fallback
          response = await API.post('/api/rooms/search', searchRequest);
        } catch (fallbackErr) {
          console.error('Error using fallback search:', fallbackErr);
          
          // Last resort: use professor API but filter client-side
          console.log('Using professor API as last resort');
          const profResponse = await API.post('/api/professor/reservations/search', searchRequest);
          response = profResponse;
        }
      }
      
      const data = response.data;
      console.log('Search results:', data);
      
      setSearchResults(data);
      
      if (data.length === 0) {
        setMessage({ text: 'No classrooms match your criteria', type: 'warning' });
      } else {
        setMessage({ text: `${data.length} available classrooms found`, type: 'success' });
      }
    } catch (error) {
      console.error('Error searching classrooms:', error);
      setMessage({ text: 'An error occurred during search: ' + (error.response?.data?.message || error.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
    
    // Update form with classroom ID
    setFormData(prev => ({
      ...prev,
      classroomId: classroom.id
    }));
  };

  const handleSubmitReservation = async () => {
    if (!selectedClassroom && !formData.classroomId) {
      setMessage({ text: 'Please select a classroom', type: 'error' });
      return;
    }
  
    if (!formData.purpose) {
      setMessage({ text: 'Please provide a purpose for the reservation', type: 'error' });
      return;
    }
  
    // Add the validation check here
    if (!validateTimeRange()) {
      return;
    }
  
    setIsLoading(true);
    setMessage({ text: '', type: '' });
  
    try {
      // Verify token is present
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setMessage({ text: 'You must be logged in to perform this action', type: 'error' });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
  
      // Create request object in format expected by backend
      const requestBody = {
        classroomId: formData.classroomId || selectedClassroom.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        notes: formData.notes || "", 
        classType: formData.classType || selectedClassroom.type,
        capacity: parseInt(formData.capacity, 10) || selectedClassroom.capacity
      };
  
      // Modified: Use the student API for reservations
      if (formData.isEdit && formData.id) {
        // For updating existing reservation
        requestBody.id = formData.id;
        console.log('Updating existing reservation:', requestBody);
        
        try {
          // Try to use student API for updates
          const response = await API.studentAPI.editClassroomReservation(formData.id, requestBody);
          console.log('Update reservation success response:', response.data);
        } catch (updateErr) {
          console.error('Direct update failed, attempting alternative method:', updateErr);
          
          // If direct update fails, first cancel the existing reservation
          await API.studentAPI.cancelReservation(formData.id);
          console.log('Successfully cancelled old reservation before replacement');
          
          // Then create a new reservation with the updated details
          const response = await API.studentAPI.requestClassroomReservation(requestBody);
          console.log('Created replacement reservation:', response.data);
        }
      } else {
        // For new reservations
        console.log('Creating new classroom reservation for student:', requestBody);
        
        // KEY CHANGE: Use requestClassroomReservation instead of requestReservation
        const response = await API.studentAPI.requestClassroomReservation(requestBody);
        console.log('Create reservation success response:', response.data);
  
        // Send email notification to admin for new reservations only (not updates)
        try {
          const reservationData = {
            id: response.data?.reservation?.id || response.data?.id || 'NEW_REQUEST',
            room: selectedClassroom.roomNumber,
            reservedBy: currentUser?.name || 'Student',
            role: 'STUDENT',
            date: formData.date,
            time: `${formData.startTime} - ${formData.endTime}`,
            purpose: formData.purpose,
            notes: formData.notes || "",
            userEmail: currentUser?.email || ''
          };
          
          await ReservationEmailService.notifyAdminAboutNewRequest(reservationData);
          console.log('Admin notification email sent successfully');
        } catch (emailError) {
          console.error('Error sending admin notification email:', emailError);
          // Continue process even if email fails
        }
      }
  
      // Clean up localStorage if we were editing
      if (isEditMode) {
        localStorage.removeItem('editingReservation');
      }
  
      // Reset form and show success message
      setFormData({
        id: '',
        date: '',
        startTime: '',
        endTime: '',
        classType: '',
        capacity: '',
        purpose: '',
        notes: '',
        isEdit: false
      });
      setSearchResults([]);
      setSelectedClassroom(null);
      setSearchPerformed(false);
      setViewMode('all');
      
      const actionType = isEditMode ? 'updated' : 'submitted';
      setMessage({ 
        text: `Your reservation request has been ${actionType} successfully and is pending approval. A confirmation email will be sent once the request is processed.`, 
        type: 'success' 
      });
      
      // Redirect back to reservations page after a short delay
      setTimeout(() => {
        navigate('/student/reservations');
      }, 3000);
    } catch (error) {
      console.error('Error submitting reservation:', error);
      
      if (error.response && error.response.status === 401) {
        // The interceptor will handle the redirect
        setMessage({ 
          text: 'Your session has expired. You will be redirected to the login page...', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: error.response?.data?.message || error.message || 'An error occurred while submitting the request', 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Functions to change view
  const showAllClassrooms = () => {
    setViewMode('all');
    setSearchPerformed(false);
    setSelectedClassroom(null);
  };

  const showSearchForm = () => {
    setViewMode('search');
  };

  // Function to refresh classrooms
  const handleRefresh = () => {
    fetchAllClassrooms();
  };

  // Render search form
  const renderSearchForm = () => {
    return (
      <form id="reserve-classroom-form" onSubmit={handleSearch}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reservation-date">Date <span className="required">*</span></label>
            <input 
              type="date" 
              id="reservation-date" 
              name="date" 
              value={formData.date}
              onChange={handleChange}
              required 
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>
          <div className="form-group">
            <label htmlFor="start-time">Start Time <span className="required">*</span></label>
            <input 
              type="time" 
              id="start-time" 
              name="startTime" 
              value={formData.startTime}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="end-time">End Time <span className="required">*</span></label>
            <input 
              type="time" 
              id="end-time" 
              name="endTime" 
              value={formData.endTime}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="class-type">Room Type</label>
            <select 
              id="class-type" 
              name="classType" 
              value={formData.classType}
              onChange={handleChange}
            >
              <option value="">All Types</option>
              <option value="Lecture Hall">Lecture Hall</option>
              <option value="Classroom">Classroom</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Conference Room">Conference Room</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="capacity-needed">Minimum Capacity <span className="required">*</span></label>
            <input 
              type="number" 
              id="capacity-needed" 
              name="capacity" 
              min="1" 
              value={formData.capacity}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search Available Classrooms'}
        </button>
      </form>
    );
  };

  const renderSearchResults = () => {
    if (!searchPerformed) return null;
    
    return (
      <div className="search-results-container">
        <h3>Available Classrooms</h3>
        
        {searchResults.length === 0 ? (
          <p>No available classrooms match your criteria. Please modify your search.</p>
        ) : (
          <div className="classroom-grid">
            {searchResults.map(classroom => (
              <div 
                key={classroom.id} 
                className={`classroom-card ${selectedClassroom && selectedClassroom.id === classroom.id ? 'selected' : ''}`}
                onClick={() => handleSelectClassroom(classroom)}
              >
                {/* Classroom image */}
                <div className="classroom-image">
                  <img 
                    src={classroom.image || '/images/classroom-default.jpg'} 
                    alt={classroom.roomNumber}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/classroom-default.jpg';
                    }}
                  />
                </div>
                <h4>{classroom.roomNumber}</h4>
                <p><strong>Type:</strong> {classroom.type}</p>
                <p><strong>Capacity:</strong> {classroom.capacity} people</p>
                {classroom.features && classroom.features.length > 0 && (
                  <div className="features">
                    <p><strong>Features:</strong></p>
                    <ul>
                      {classroom.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAllClassrooms = () => {
    return (
      <div className="all-classrooms-container">
        <h3>
          All Available Classrooms
          <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </h3>
        
        {isLoading ? (
          <p>Loading classrooms...</p>
        ) : allClassrooms.length === 0 ? (
          <div>
            <p>No classrooms available at the moment.</p>
            {fetchError && <p style={{color: 'red'}}>Error: {fetchError}</p>}
            <button onClick={handleRefresh} className="btn-secondary">Try Again</button>
          </div>
        ) : (
          <div className="classroom-grid">
            {allClassrooms.map(classroom => (
              <div 
                key={classroom.id} 
                className={`classroom-card ${selectedClassroom && selectedClassroom.id === classroom.id ? 'selected' : ''}`}
                onClick={() => handleSelectClassroom(classroom)}
              >
                {/* Classroom image */}
                <div className="classroom-image">
                  <img 
                    src={classroom.image || '/images/classroom-default.jpg'} 
                    alt={classroom.roomNumber}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/classroom-default.jpg';
                    }}
                  />
                </div>
                <h4>{classroom.roomNumber}</h4>
                <p><strong>Type:</strong> {classroom.type}</p>
                <p><strong>Capacity:</strong> {classroom.capacity} people</p>
                {classroom.features && classroom.features.length > 0 && (
                  <div className="features">
                    <p><strong>Features:</strong></p>
                    <ul>
                      {classroom.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReservationForm = () => {
    if (!selectedClassroom) return null;
    
    return (
      <div className="reservation-details-container">
        <h3>{isEditMode ? 'Edit Reservation' : 'Finalize Reservation'}</h3>
        <div className="selected-classroom-info">
          {/* Selected classroom image */}
          <div className="selected-classroom-image">
            <img 
              src={selectedClassroom.image || '/images/classroom-default.jpg'} 
              alt={selectedClassroom.roomNumber}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/classroom-default.jpg';
              }}
            />
          </div>
          <h4>Selected Classroom: {selectedClassroom.roomNumber}</h4>
          <p>Type: {selectedClassroom.type} | Capacity: {selectedClassroom.capacity} people</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="reservation-date">Date <span className="required">*</span></label>
          <input 
            type="date" 
            id="reservation-date" 
            name="date" 
            value={formData.date}
            onChange={handleChange}
            required 
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start-time">Start Time <span className="required">*</span></label>
            <input 
              type="time" 
              id="start-time" 
              name="startTime" 
              value={formData.startTime}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="end-time">End Time <span className="required">*</span></label>
            <input 
              type="time" 
              id="end-time" 
              name="endTime" 
              value={formData.endTime}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="purpose">Reservation Purpose <span className="required">*</span></label>
          <input 
            type="text" 
            id="purpose" 
            name="purpose" 
            placeholder="e.g., Class, Lab, Meeting, Exam..." 
            value={formData.purpose}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="additional-notes">Additional Notes</label>
          <textarea 
            id="additional-notes" 
            name="notes" 
            rows="3"
            placeholder="Additional information..."
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>
        
        <div className="form-info-box">
          <p><strong>Note:</strong> Once submitted, an administrator will review your request. 
          You will receive an email notification when your request is approved or rejected.</p>
        </div>
        
        <button 
          type="button" 
          className="btn-primary" 
          onClick={handleSubmitReservation}
          disabled={isLoading || !formData.purpose || !formData.date || !formData.startTime || !formData.endTime}
        >
          {isLoading ? 'Submitting...' : isEditMode ? 'Update Reservation Request' : 'Submit Reservation Request'}
        </button>
      </div>
    );
  };

  return (
    <div className={fullPage ? "main-content" : "reservation-form-container"}>
      {fullPage && (
        <div className="section-header">
          <h2>{isEditMode ? 'Edit Classroom Reservation' : 'Reserve a Classroom'}</h2>
          <p>{isEditMode ? 'Modify your reservation request' : 'Search and reserve a classroom that meets your needs'}</p>
        </div>
      )}
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="view-toggle">
        <button 
          className={`tab-button ${viewMode === 'all' ? 'active' : ''}`} 
          onClick={showAllClassrooms}
        >
          All Classrooms
        </button>
        <button 
          className={`tab-button ${viewMode === 'search' ? 'active' : ''}`} 
          onClick={showSearchForm}
        >
          Search by Criteria
        </button>
      </div>
      
      {viewMode === 'search' ? (
        <>
          {renderSearchForm()}
          {renderSearchResults()}
        </>
      ) : (
        renderAllClassrooms()
      )}
      
      {selectedClassroom && renderReservationForm()}
    </div>
  );
};

export default StudentClassroomReservation;