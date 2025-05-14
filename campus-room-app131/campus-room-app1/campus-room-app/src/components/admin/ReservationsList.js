import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import API from '../../api';
import ReservationEmailService from '../../services/ReservationEmailService';
import Modal from '../common/Modal';

const ReservationsList = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    status: '',
    role: '',
    date: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch all reservations on component mount
  useEffect(() => {
    fetchReservations();
    
    // Check for any queued emails that need to be sent
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
  }, []);

  // Fetch reservations from API
  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try the admin endpoint
      let response;
      try {
        response = await API.get('/api/admin/dashboard/recent-reservations');
      } catch (err) {
        console.log("Falling back to regular reservations endpoint");
        response = await API.get('/api/reservations');
      }
      
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Loaded reservations:", response.data);
      
      setReservations(response.data);
      setFilteredReservations(response.data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError("Failed to load reservations. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

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
    // Filter based on criteria
    let filtered = [...reservations];
    
    if (filterCriteria.status) {
      filtered = filtered.filter(
        reservation => reservation.status.toLowerCase() === filterCriteria.status.toLowerCase()
      );
    }
    
    if (filterCriteria.role) {
      filtered = filtered.filter(
        reservation => reservation.role.toLowerCase() === filterCriteria.role.toLowerCase()
      );
    }
    
    if (filterCriteria.date) {
      // Extract month from date (assuming date format is yyyy-MM-dd)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      filtered = filtered.filter(reservation => {
        if (!reservation.date) return false;
        
        const reservationMonth = new Date(reservation.date).getMonth();
        return months[reservationMonth] === filterCriteria.date;
      });
    }
    
    setFilteredReservations(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({
      status: '',
      role: '',
      date: ''
    });
    setFilteredReservations(reservations);
  };

  // View reservation details
  const viewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  // Approve a reservation
  const approveReservation = async (id) => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      // Try admin endpoint first, fall back to regular endpoint
      let response;
      try {
        response = await API.put(`/api/admin/approve-reservation/${id}`);
      } catch (err) {
        console.log("Falling back to reservations approve endpoint");
        response = await API.put(`/api/reservations/${id}/approve`);
      }
      
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Reservation approved:", response.data);
      
      // Send email notification to user
      const approvedReservation = reservations.find(res => res.id === id);
      if (approvedReservation) {
        try {
          await ReservationEmailService.notifyUserAboutStatusUpdate(
            approvedReservation, 
            'APPROVED'
          );
          console.log("Approval notification email sent to user");
        } catch (emailError) {
          console.error("Error sending approval email:", emailError);
        }
      }
      
      // Update local state
      const updatedReservations = reservations.map(res => 
        res.id === id ? { ...res, status: 'APPROVED' } : res
      );
      
      setReservations(updatedReservations);
      setFilteredReservations(
        filteredReservations.map(res => res.id === id ? { ...res, status: 'APPROVED' } : res)
      );
      
      // Close modal if open
      if (showDetailModal && selectedReservation && selectedReservation.id === id) {
        setShowDetailModal(false);
      }
      
      alert("Reservation approved successfully");
    } catch (err) {
      console.error("Error approving reservation:", err);
      alert("Failed to approve reservation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = (reservation) => {
    setSelectedReservation(reservation);
    setRejectReason('');
    setShowRejectModal(true);
    
    // Close detail modal if open
    if (showDetailModal) {
      setShowDetailModal(false);
    }
  };

  // Handle reject reason input change
  const handleRejectReasonChange = (e) => {
    setRejectReason(e.target.value);
  };

  // Reject a reservation
  const rejectReservation = async () => {
    if (!selectedReservation || !selectedReservation.id) return;
    
    // Validate rejection reason
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Try admin endpoint first, fall back to regular endpoint
      let response;
      try {
        response = await API.put(`/api/admin/reject-reservation/${selectedReservation.id}`, { reason: rejectReason });
      } catch (err) {
        console.log("Falling back to reservations reject endpoint");
        response = await API.put(`/api/reservations/${selectedReservation.id}/reject`, { reason: rejectReason });
      }
      
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Reservation rejected:", response.data);
      
      // Send email notification to user with rejection reason
      try {
        await ReservationEmailService.notifyUserAboutStatusUpdate(
          selectedReservation, 
          'REJECTED',
          rejectReason
        );
        console.log("Rejection notification email sent to user");
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
      
      // Update local state
      const updatedReservations = reservations.map(res => 
        res.id === selectedReservation.id ? { ...res, status: 'REJECTED' } : res
      );
      
      setReservations(updatedReservations);
      setFilteredReservations(
        filteredReservations.map(res => 
          res.id === selectedReservation.id ? { ...res, status: 'REJECTED' } : res
        )
      );
      
      // Close reject modal
      setShowRejectModal(false);
      
      alert("Reservation rejected successfully");
    } catch (err) {
      console.error("Error rejecting reservation:", err);
      alert("Failed to reject reservation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a reservation
  const cancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    setIsLoading(true);
    
    try {
      // Try admin endpoint first, fall back to regular endpoint
      let response;
      try {
        const response = await API.put(`/api/reservations/${id}/cancel`);
        
        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }
        
        console.log("Reservation cancelled:", response.data);
        
        // Update local state
        const updatedReservations = reservations.map(res => 
          res.id === id ? { ...res, status: 'CANCELED' } : res
        );
        
        setReservations(updatedReservations);
        setFilteredReservations(
          filteredReservations.map(res => res.id === id ? { ...res, status: 'CANCELED' } : res)
        );
        
        // Close modal if open
        if (showDetailModal && selectedReservation && selectedReservation.id === id) {
          setShowDetailModal(false);
        }
        
        alert("Reservation cancelled successfully");
      } catch (err) {
        console.error("Error cancelling reservation:", err);
        alert("Failed to cancel reservation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>All Reservations</h2>
          <button 
            className="btn-refresh"
            onClick={fetchReservations}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select 
              id="status" 
              name="status"
              value={filterCriteria.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="role">User Role</label>
            <select 
              id="role" 
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
            >
              <option value="">All Roles</option>
              <option value="professor">Professor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date">Month</label>
            <select 
              id="date" 
              name="date"
              value={filterCriteria.date}
              onChange={handleFilterChange}
            >
              <option value="">All Dates</option>
              <option value="Jan">January</option>
              <option value="Feb">February</option>
              <option value="Mar">March</option>
              <option value="Apr">April</option>
              <option value="May">May</option>
              <option value="Jun">June</option>
              <option value="Jul">July</option>
              <option value="Aug">August</option>
              <option value="Sep">September</option>
              <option value="Oct">October</option>
              <option value="Nov">November</option>
              <option value="Dec">December</option>
            </select>
          </div>
          <button 
            className="btn-primary"
            onClick={applyFilters}
            disabled={isLoading}
          >
            Apply Filters
          </button>
          <button 
            className="btn-secondary"
            onClick={resetFilters}
            disabled={isLoading}
          >
            Reset
          </button>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">Loading reservations...</div>
        ) : (
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
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">No reservations found</td>
                  </tr>
                ) : (
                  filteredReservations.map(reservation => (
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
                          <button 
                            className="btn-table btn-view"
                            onClick={() => viewReservation(reservation)}
                          >
                            View
                          </button>
                          {reservation.status === 'PENDING' && (
                            <>
                              <button 
                                className="btn-table btn-edit"
                                onClick={() => approveReservation(reservation.id)}
                                disabled={isLoading}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn-table btn-delete"
                                onClick={() => openRejectModal(reservation)}
                                disabled={isLoading}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {reservation.status === 'APPROVED' && (
                            <button 
                              className="btn-table btn-delete"
                              onClick={() => cancelReservation(reservation.id)}
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reservation Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Reservation Details"
      >
        {selectedReservation && (
          <div className="reservation-details">
            <div className="detail-item">
              <span className="detail-label">Reservation ID</span>
              <span className="detail-value">{selectedReservation.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Classroom/Room</span>
              <span className="detail-value">{selectedReservation.classroom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reserved By</span>
              <span className="detail-value">{selectedReservation.reservedBy}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                <span className="role-badge">
                  {selectedReservation.role ? selectedReservation.role.charAt(0).toUpperCase() + selectedReservation.role.slice(1).toLowerCase() : 'N/A'}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(selectedReservation.date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time</span>
              <span className="detail-value">{selectedReservation.time}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Purpose</span>
              <span className="detail-value">{selectedReservation.purpose}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`status-badge status-${selectedReservation.status.toLowerCase()}`}>
                  {selectedReservation.status}
                </span>
              </span>
            </div>
            
            <div className="modal-actions">
              {selectedReservation.status === 'PENDING' && (
                <>
                  <button 
                    className="btn-primary mr-3"
                    onClick={() => approveReservation(selectedReservation.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Approve Reservation'}
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => openRejectModal(selectedReservation)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Reject Reservation'}
                  </button>
                </>
              )}
              {selectedReservation.status === 'APPROVED' && (
                <button 
                  className="btn-danger"
                  onClick={() => cancelReservation(selectedReservation.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Cancel Reservation'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        show={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Reservation"
      >
        {selectedReservation && (
          <div className="reject-reservation-form">
            <p>
              You are about to reject the reservation request for 
              <strong> {selectedReservation.classroom}</strong> by 
              <strong> {selectedReservation.reservedBy}</strong> on 
              <strong> {formatDate(selectedReservation.date)}</strong>.
            </p>
            
            <div className="form-group">
              <label htmlFor="reject-reason">
                Please provide a reason for rejection <span className="required">*</span>
              </label>
              <textarea
                id="reject-reason"
                name="rejectReason"
                value={rejectReason}
                onChange={handleRejectReasonChange}
                rows="4"
                placeholder="E.g., Room already reserved for maintenance, Required resources unavailable..."
                required
              ></textarea>
              <small className="form-hint">
                This reason will be included in the notification email sent to the user.
              </small>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary mr-3"
                onClick={() => setShowRejectModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={rejectReservation}
                disabled={isLoading || !rejectReason.trim()}
              >
                {isLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReservationsList;