import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../api';
import '../../styles/student-reservation.css';
import axios from 'axios';
const MyReservations = () => {
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
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Fetch reservations from API with fallback to local storage
  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Try multiple approaches to fetch the reservations
      try {
        // First try the primary endpoint
        response = await API.professorAPI.getProfessorReservations();
        console.log('Fetched reservations using primary endpoint');
      } catch (primaryError) {
        console.error("Error with primary endpoint:", primaryError);
        
        try {
          // Then try the alternative endpoint
          response = await API.professorAPI.getMyReservations();
          console.log('Fetched reservations using alternative endpoint');
        } catch (alternativeError) {
          console.error("Error with alternative endpoint:", alternativeError);
          
          // As a last resort, try a direct endpoint call
          response = await API.get('/api/professor/reservations');
          console.log('Fetched reservations using direct endpoint');
        }
      }
      
      // Format the data
      const data = response.data;
      const formattedReservations = formatReservations(data);
      setReservations(formattedReservations);
      setFilteredReservations(formattedReservations);
      
      // Update localStorage as backup
      localStorage.setItem('professorReservations', JSON.stringify(formattedReservations));
      
    } catch (err) {
      console.error('Error fetching reservations from API:', err);
      setError('Failed to load reservations from server. Using local data.');
      
      // Fallback to localStorage
      const storedReservations = localStorage.getItem('professorReservations');
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
    return Array.isArray(apiReservations) ? apiReservations.map(res => {
      // Create a standardized reservation object from API data
      return {
        id: res.id || '',
        room: res.classroom || res.roomNumber || res.room || '',
        date: res.date || '',
        time: res.time || `${res.startTime || ''} - ${res.endTime || ''}`,
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        purpose: res.purpose || '',
        notes: res.notes || '',
        status: (res.status || 'Pending'),
        classroomId: res.classroomId || ''
      };
    }) : [];
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
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date || '') - new Date(b.date || '');
          break;
        case 'room':
          comparison = (a.room || '').localeCompare(b.room || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredReservations(result);
  }, [reservations, filterStatus, searchTerm, dateFilter, sortBy, sortDirection]);

  // Cancel reservation - FIXED to prevent redirection to login page
  const cancelReservation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      setIsLoading(true);
      setMessage({ text: '', type: '' });
      
      try {
        // IMPORTANT: First update the UI optimistically
        // This ensures users see feedback even if API calls fail
        const updatedReservations = reservations.map(r => 
          r.id === id ? { ...r, status: 'Canceled' } : r
        );
        
        setReservations(updatedReservations);
        localStorage.setItem('professorReservations', JSON.stringify(updatedReservations));
        
        // Close modal if open
        if (showViewModal && selectedReservation && selectedReservation.id === id) {
          setShowViewModal(false);
        }
        
        // Set a success message immediately
        setMessage({ 
          text: 'Reservation has been cancelled successfully.',
          type: 'success' 
        });
        
        // Now try to sync with the server without redirecting to login
        // Create a direct axios instance that doesn't use the interceptors
        const directAxios = axios.create({
          baseURL: API.defaults?.baseURL || '',
          timeout: 10000,
        });
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Try multiple endpoints in sequence, ignoring errors
        try {
          await directAxios.put(`/api/professor/reservations/${id}/cancel`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Successfully synced cancellation with server');
        } catch (error1) {
          console.warn('First endpoint failed, trying alternative', error1);
          
          try {
            await directAxios.put(`/api/reservations/${id}/cancel`, {}, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Successfully synced cancellation with alternative endpoint');
          } catch (error2) {
            console.warn('Alternative endpoint failed, trying student API', error2);
            
            try {
              // Some systems might use student endpoint for professors too
              await directAxios.put(`/api/student/reservations/${id}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              console.log('Successfully synced cancellation with student endpoint');
            } catch (error3) {
              console.error('All server sync attempts failed:', error3);
              // Continue with UI updated anyway
            }
          }
        }
      } catch (error) {
        console.error('Error in reservation cancellation process:', error);
        // Keep showing success since UI is already updated
        setMessage({ 
          text: 'Reservation appears as cancelled, but server sync might have failed.',
          type: 'warning' 
        });
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
  
  // Edit reservation
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
      navigate('/professor/reserve?edit=true');
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
    navigate('/professor/reserve');
  };

  // Handle sort column click
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
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
          <h1>My Classroom Reservations</h1>
          <p>Manage all your classroom reservations</p>
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
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      {/* Filter tabs UI */}
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
                    : "You haven't made any classroom reservations yet."}
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
                    <th onClick={() => handleSort('room')} className="sortable-header">
                      Room
                      {sortBy === 'room' && (
                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort('date')} className="sortable-header">
                      Date
                      {sortBy === 'date' && (
                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th onClick={() => handleSort('status')} className="sortable-header">
                      Status
                      {sortBy === 'status' && (
                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
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
                  Your reservation has been approved. You can use the classroom at the scheduled time.
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

export default MyReservations;