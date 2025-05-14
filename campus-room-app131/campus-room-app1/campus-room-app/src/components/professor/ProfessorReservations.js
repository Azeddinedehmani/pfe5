import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../api';
import Table from '../common/Table';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';

const ProfessorReservations = () => {
  const { currentUser } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load reservations from API and fallback to localStorage
  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API first
        const response = await API.professorAPI.getMyReservations();
        console.log('API response:', response.data);
        setMyReservations(response.data);
        
        // Update localStorage with fresh data
        localStorage.setItem('professorReservations', JSON.stringify(response.data));
      } catch (err) {
        console.error('Error fetching reservations from API:', err);
        setError('Could not load reservations from server. Using local data.');
        
        // Fallback to localStorage
        const storedReservations = localStorage.getItem('professorReservations');
        if (storedReservations) {
          const reservations = JSON.parse(storedReservations);
          // Filter for current user if needed
          const userReservations = currentUser 
            ? reservations.filter(r => r.userId === currentUser.email)
            : reservations;
          
          setMyReservations(userReservations);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadReservations();
  }, [currentUser]);
  
  // Handle view reservation details
  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };
  
  // Handle cancel reservation
  const handleCancelReservation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        // Call API to cancel reservation
        await API.professorAPI.cancelReservation(id);
        
        // Update local state - mark as cancelled instead of removing
        const updatedReservations = myReservations.map(r => 
          r.id === id ? { ...r, status: 'CANCELLED' } : r
        );
        setMyReservations(updatedReservations);
        
        // Update localStorage
        const allReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
        const updatedAllReservations = allReservations.map(r => 
          r.id === id ? { ...r, status: 'CANCELLED' } : r
        );
        localStorage.setItem('professorReservations', JSON.stringify(updatedAllReservations));
        
        alert('Reservation cancelled successfully.');
      } catch (err) {
        console.error('Error cancelling reservation:', err);
        alert('Failed to cancel reservation. Please try again.');
      }
    }
  };
  
  // Define table columns
  const columns = [
    { header: 'Classroom', key: 'classroom' },
    { header: 'Date', key: 'date' },
    { 
      header: 'Time', 
      key: 'time',
      render: (time, reservation) => time || `${reservation.startTime} - ${reservation.endTime}`
    },
    { header: 'Purpose', key: 'purpose' },
    { 
      header: 'Status', 
      key: 'status',
      render: (status) => (
        <span className={`status-badge status-${status.toLowerCase()}`}>
          {status}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (id, reservation) => (
        <div className="table-actions">
          <button 
            className="btn-table btn-view"
            onClick={() => handleViewReservation(reservation)}
          >
            View
          </button>
          {reservation.status !== 'CANCELLED' && (
            <button 
              className="btn-table btn-delete"
              onClick={() => handleCancelReservation(id)}
            >
              Cancel
            </button>
          )}
        </div>
      )
    }
  ];
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>My Reservations</h2>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading reservations...</p>
          </div>
        ) : (
          <Table 
            columns={columns}
            data={myReservations}
            emptyMessage="You don't have any reservations yet"
          />
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
              <span className="detail-label">Classroom</span>
              <span className="detail-value">{selectedReservation.classroom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{selectedReservation.date}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time</span>
              <span className="detail-value">{selectedReservation.time || `${selectedReservation.startTime} - ${selectedReservation.endTime}`}</span>
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
            
            {(selectedReservation.status === 'Pending' || selectedReservation.status === 'PENDING') && (
              <div className="detail-note">
                <p>This reservation is waiting for approval from the administrator.</p>
              </div>
            )}
            
            {(selectedReservation.status === 'Approved' || selectedReservation.status === 'APPROVED') && (
              <div className="detail-instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Arrive 10 minutes before your scheduled time</li>
                  <li>Use your ID card to access the room</li>
                  <li>Report any issues to facility management</li>
                  <li>Leave the room in a clean condition</li>
                </ol>
              </div>
            )}
            
            <div className="modal-actions">
              {selectedReservation.status !== 'CANCELLED' && (
                <button 
                  className="btn-danger"
                  onClick={() => {
                    handleCancelReservation(selectedReservation.id);
                    setShowDetailModal(false);
                  }}
                >
                  Cancel Reservation
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfessorReservations;