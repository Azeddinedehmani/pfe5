import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../api';
import '../../styles/student-reservation.css';

const StudentMyReservations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [dateFilter, setDateFilter] = useState('upcoming');

  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Fetch reservations from API with fallback to local storage
  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to use the API service
      if (API.studentAPI && API.studentAPI.getMyReservations) {
        const response = await API.studentAPI.getMyReservations();
        console.log('Reservations from API:', response.data);
        
        // Format the data if needed
        const formattedReservations = formatReservations(response.data);
        setReservations(formattedReservations);
        setFilteredReservations(formattedReservations);
        
        // Update localStorage as backup
        localStorage.setItem('studentReservations', JSON.stringify(formattedReservations));
      } else {
        // If API method is not available, try direct endpoint
        const response = await API.get('/api/student/my-reservations');
        console.log('Reservations from direct API:', response.data);
        
        // Format the data if needed
        const formattedReservations = formatReservations(response.data);
        setReservations(formattedReservations);
        setFilteredReservations(formattedReservations);
        
        // Update localStorage as backup
        localStorage.setItem('studentReservations', JSON.stringify(formattedReservations));
      }
      
    } catch (err) {
      console.error('Error fetching reservations from API:', err);
      setError('Failed to load reservations from server. Using local data.');
      
      // Fallback to localStorage
      const storedReservations = localStorage.getItem('studentReservations');
      if (storedReservations) {
        const parsedReservations = JSON.parse(storedReservations);
        setReservations(parsedReservations);
        setFilteredReservations(parsedReservations);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format API reservations to consistent format
  const formatReservations = (apiReservations) => {
    return apiReservations.map(res => {
      // Create a standardized reservation object from API data
      return {
        id: res.id || '',
        room: res.classroom || res.room || '',
        date: res.date || '',
        time: res.time || `${res.startTime || ''} - ${res.endTime || ''}`,
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        purpose: res.purpose || '',
        notes: res.notes || '',
        status: res.status || 'Pending',
        classroomId: res.classroomId || ''
      };
    });
  };

  // Apply filters, search, and sort whenever their states change
  useEffect(() => {
    let result = [...reservations];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(r => {
        // Case insensitive status comparison
        return r.status.toLowerCase() === filterStatus.toLowerCase();
      });
    }
    
    // Apply date filter
    if (dateFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.date) >= today);
    } else if (dateFilter === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.date) < today);
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.room && r.room.toLowerCase().includes(searchLower)) ||
        (r.purpose && r.purpose.toLowerCase().includes(searchLower)) ||
        (r.date && r.date.includes(searchLower)) ||
        (r.time && r.time.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredReservations(result);
  }, [reservations, filterStatus, searchTerm, dateFilter]);

  // Cancel reservation
  const cancelReservation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      setIsLoading(true);
      
      try {
        // Try using the API service
        if (API.studentAPI && API.studentAPI.cancelReservation) {
          await API.studentAPI.cancelReservation(id);
        } else {
          // Fallback to direct API call
          await API.put(`/api/student/reservations/${id}/cancel`);
        }
        
        // Update local state
        const updatedReservations = reservations.map(r => 
          r.id === id ? { ...r, status: 'Canceled' } : r
        );
        
        setReservations(updatedReservations);
        
        // Update localStorage
        localStorage.setItem('studentReservations', JSON.stringify(updatedReservations));
        
        // Close modal if open
        if (showViewModal && selectedReservation && selectedReservation.id === id) {
          setShowViewModal(false);
        }
      } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // View reservation details
  const viewReservation = (id) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      setSelectedReservation(reservation);
      setShowViewModal(true);
    }
  };

  // Handle edit reservation
  const handleEditReservation = (reservation) => {
    try {
      // Check if the reservation can be edited
      if (reservation.status.toLowerCase() !== 'pending') {
        alert(`Cannot edit this reservation because its status is ${reservation.status}`);
        return;
      }
      
      // Extract startTime and endTime from the time field if they are not available directly
      let startTime = reservation.startTime;
      let endTime = reservation.endTime;
      
      if ((!startTime || !endTime) && reservation.time) {
        const timeParts = reservation.time.split(' - ');
        if (timeParts.length === 2) {
          startTime = timeParts[0].trim();
          endTime = timeParts[1].trim();
        }
      }
      
      // Prepare a complete reservation object for editing
      const reservationForEdit = {
        id: reservation.id,
        classroom: reservation.room,
        classroomId: reservation.classroomId,
        date: reservation.date,
        startTime: startTime,
        endTime: endTime,
        purpose: reservation.purpose,
        notes: reservation.notes || '',
        status: reservation.status
      };
      
      // Store the reservation data in localStorage for the form to use
      localStorage.setItem('editingReservation', JSON.stringify(reservationForEdit));
      console.log('Saved reservation for editing:', reservationForEdit);
      
      // Navigate to the reservation form
      navigate('/student/reserve?edit=true');
    } catch (error) {
      console.error("Error navigating to edit form:", error);
      alert("Unable to edit reservation. Please try again.");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Handle new reservation button click
  const handleNewReservation = () => {
    navigate('/student/reserve');
  };

  // Get status counts for filter badges
  const getStatusCount = (status) => {
    if (status === 'all') return reservations.length;
    return reservations.filter(r => r.status.toLowerCase() === status.toLowerCase()).length;
  };

  // Helper function to check if a reservation can be canceled
  const canCancelReservation = (status) => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'pending' || normalizedStatus === 'approved';
  };

  // Helper function to check if a reservation can be edited
  const canEditReservation = (status) => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'pending';
  };

  return (
    <div className="main-content">
      <div className="section-header d-flex justify-content-between align-items-center">
        <div>
          <h1>My Study Room Reservations</h1>
          <p>Manage all your study space reservations</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary d-flex align-items-center" 
            onClick={fetchReservations}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt me-2"></i> Refresh
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center" 
            onClick={handleNewReservation}
          >
            <i className="fas fa-plus me-2"></i> New Reservation
          </button>
        </div>
      </div>
      
      {/* Filter tabs UI - matching the professor's interface */}
      <div className="filter-tabs">
        <div className="status-filter-tabs">
          <button 
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All <span className="count-badge">{getStatusCount('all')}</span>
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            <i className="fas fa-check-circle me-1"></i> Approved <span className="count-badge">{getStatusCount('approved')}</span>
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            <i className="fas fa-clock me-1"></i> Pending <span className="count-badge">{getStatusCount('pending')}</span>
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            <i className="fas fa-times-circle me-1"></i> Rejected <span className="count-badge">{getStatusCount('rejected')}</span>
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'canceled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('canceled')}
          >
            <i className="fas fa-ban me-1"></i> Canceled <span className="count-badge">{getStatusCount('canceled')}</span>
          </button>
        </div>

        <div className="search-and-date-filter">
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Search by room, purpose, date or time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          <select 
            className="date-filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All Dates</option>
          </select>
        </div>
      </div>
      
      <div className="table-controls">
        <div className="entries-selector">
          Show 
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          entries
        </div>
        
        <div className="results-count">
          Showing {filteredReservations.length} of {reservations.length} reservations
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading reservations...</p>
        </div>
      ) : error ? (
        <div className="error-alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-primary ms-3" onClick={fetchReservations}>Try Again</button>
        </div>
      ) : (
        <>
          {filteredReservations.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-times"></i>
              </div>
              <h3>No Reservations Found</h3>
              <p>
                {searchTerm 
                  ? "No reservations match your search criteria." 
                  : filterStatus !== 'all' 
                    ? `You don't have any ${filterStatus} reservations.` 
                    : "You haven't made any study room reservations yet."}
              </p>
              {reservations.length === 0 && (
                <button className="btn btn-primary mt-3" onClick={handleNewReservation}>
                  <i className="fas fa-plus me-2"></i> Make Your First Reservation
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="reservation-table">
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
                  {filteredReservations.map(reservation => (
                    <tr key={reservation.id}>
                      <td>{reservation.room}</td>
                      <td>{formatDate(reservation.date)}</td>
                      <td>{reservation.time}</td>
                      <td>
                        <div className="purpose-cell" title={reservation.purpose}>
                          {reservation.purpose}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                          {reservation.status === 'Approved' && <i className="fas fa-check-circle me-1"></i>}
                          {reservation.status === 'Pending' && <i className="fas fa-clock me-1"></i>}
                          {reservation.status === 'Rejected' && <i className="fas fa-times-circle me-1"></i>}
                          {reservation.status === 'Canceled' && <i className="fas fa-ban me-1"></i>}
                          {reservation.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => viewReservation(reservation.id)}
                            title="View details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {canEditReservation(reservation.status) && (
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEditReservation(reservation)}
                              title="Edit reservation"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {canCancelReservation(reservation.status) && (
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => cancelReservation(reservation.id)}
                              title="Cancel reservation"
                              disabled={isLoading}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* View Reservation Modal */}
      {showViewModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Reservation Details</h4>
              <button 
                className="modal-close-btn"
                onClick={() => setShowViewModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-label">Room:</div>
                <div className="detail-value">{selectedReservation.room}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Date:</div>
                <div className="detail-value">{formatDate(selectedReservation.date)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Time:</div>
                <div className="detail-value">{selectedReservation.time}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Purpose:</div>
                <div className="detail-value">{selectedReservation.purpose}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status:</div>
                <div className="detail-value">
                  <span className={`status-badge status-${selectedReservation.status.toLowerCase()}`}>
                    {selectedReservation.status === 'Approved' && <i className="fas fa-check-circle me-1"></i>}
                    {selectedReservation.status === 'Pending' && <i className="fas fa-clock me-1"></i>}
                    {selectedReservation.status === 'Rejected' && <i className="fas fa-times-circle me-1"></i>}
                    {selectedReservation.status === 'Canceled' && <i className="fas fa-ban me-1"></i>}
                    {selectedReservation.status}
                  </span>
                </div>
              </div>
              {selectedReservation.notes && (
                <div className="detail-row">
                  <div className="detail-label">Notes:</div>
                  <div className="detail-value">{selectedReservation.notes}</div>
                </div>
              )}
              
              {selectedReservation.status.toLowerCase() === 'approved' && (
                <div className="status-message success">
                  <i className="fas fa-info-circle me-1"></i>
                  Your reservation has been approved. You can access the room using your student ID card.
                </div>
              )}
              
              {selectedReservation.status.toLowerCase() === 'pending' && (
                <div className="status-message pending">
                  <i className="fas fa-info-circle me-1"></i>
                  Your reservation is currently pending approval. You'll be notified when it's processed.
                </div>
              )}
              
              {selectedReservation.status.toLowerCase() === 'rejected' && (
                <div className="status-message error">
                  <i className="fas fa-info-circle me-1"></i>
                  Your reservation has been rejected. Please try another time or contact administration.
                </div>
              )}
            </div>
            <div className="modal-footer">
              {canEditReservation(selectedReservation.status) && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditReservation(selectedReservation);
                  }}
                >
                  Edit Reservation
                </button>
              )}
              {canCancelReservation(selectedReservation.status) && (
                <button 
                  className="btn btn-danger"
                  onClick={() => cancelReservation(selectedReservation.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Cancel Reservation'}
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyReservations;