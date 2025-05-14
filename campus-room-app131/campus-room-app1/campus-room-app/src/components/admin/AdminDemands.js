import React, { useState, useEffect } from 'react';
import Table from '../common/Table';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';
import API from '../../api';
import ReservationEmailService from '../../services/ReservationEmailService';

const AdminDemands = () => {
  const [pendingDemands, setPendingDemands] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filterCriteria, setFilterCriteria] = useState({
    role: '',
    date: ''
  });
  
  // Load pending demands on component mount
  useEffect(() => {
    fetchPendingDemands();
    
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
  
  // Fetch pending demands from the API
  const fetchPendingDemands = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // First try admin endpoint, fall back to regular endpoint if needed
      let response;
      try {
        response = await API.get('/api/admin/dashboard/pending-demands');
      } catch (err) {
        console.log("Falling back to reservations/pending endpoint");
        response = await API.get('/api/reservations/pending');
      }
      
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Loaded pending demands:", response.data);
      
      // Apply filters if specified
      let filteredDemands = response.data;
      if (filterCriteria.role) {
        filteredDemands = filteredDemands.filter(
          demand => demand.role.toUpperCase() === filterCriteria.role
        );
      }
      
      if (filterCriteria.date) {
        const month = getMonthFromString(filterCriteria.date);
        filteredDemands = filteredDemands.filter(demand => {
          if (!demand.date) return false;
          const demandDate = new Date(demand.date);
          return demandDate.getMonth() === month;
        });
      }
      
      setPendingDemands(filteredDemands);
      
      if (filteredDemands.length === 0) {
        setMessage({ text: 'No pending demands found', type: 'info' });
      }
    } catch (error) {
      console.error("Error fetching pending demands:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to load pending demands', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to convert month name to number
  const getMonthFromString = (monthStr) => {
    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return months[monthStr];
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
    fetchPendingDemands();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({
      role: '',
      date: ''
    });
    
    // Fetch demands with reset filters
    fetchPendingDemands();
  };
  
  // Handle view demand details
  const handleViewDemand = (demand) => {
    setSelectedDemand(demand);
    setShowDetailModal(true);
  };
  
  // Handle approve demand
  const handleApproveDemand = async (id) => {
    if (!id) {
      setMessage({ text: 'Invalid demand ID', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      // Try admin endpoint first, then fall back to regular endpoint
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
      const approvedDemand = pendingDemands.find(demand => demand.id === id);
      if (approvedDemand) {
        try {
          await ReservationEmailService.notifyUserAboutStatusUpdate(
            approvedDemand, 
            'APPROVED'
          );
          console.log("Approval notification email sent to user");
        } catch (emailError) {
          console.error("Error sending approval email:", emailError);
          // Continue with the process even if email fails
        }
      }
      
      // Remove the approved demand from the list
      setPendingDemands(pendingDemands.filter(demand => demand.id !== id));
      
      setMessage({ text: 'Demand approved successfully', type: 'success' });
      
      // Close modal if open
      if (showDetailModal && selectedDemand && selectedDemand.id === id) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error approving demand:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to approve demand', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open reject modal with confirmation
  const openRejectModal = (demand) => {
    setSelectedDemand(demand);
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
  
  // Handle reject demand with reason
  const handleRejectDemand = async () => {
    if (!selectedDemand || !selectedDemand.id) {
      setMessage({ text: 'Invalid demand selected', type: 'error' });
      return;
    }
    
    // Validate rejection reason
    if (!rejectReason.trim()) {
      setMessage({ 
        text: 'Please provide a reason for rejection', 
        type: 'error' 
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Try admin endpoint first, then fall back to regular endpoint
      let response;
      try {
        response = await API.put(`/api/admin/reject-reservation/${selectedDemand.id}`, { reason: rejectReason });
      } catch (err) {
        console.log("Falling back to reservations reject endpoint");
        response = await API.put(`/api/reservations/${selectedDemand.id}/reject`, { reason: rejectReason });
      }
      
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Reservation rejected:", response.data);
      
      // Send email notification to user with rejection reason
      try {
        await ReservationEmailService.notifyUserAboutStatusUpdate(
          selectedDemand, 
          'REJECTED',
          rejectReason
        );
        console.log("Rejection notification email sent to user");
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
        // Continue with the process even if email fails
      }
      
      // Remove the rejected demand from the list
      setPendingDemands(pendingDemands.filter(demand => demand.id !== selectedDemand.id));
      
      setMessage({ text: 'Demand rejected successfully', type: 'success' });
      
      // Close reject modal
      setShowRejectModal(false);
    } catch (error) {
      console.error("Error rejecting demand:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to reject demand', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Define table columns
  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Classroom/Room', key: 'classroom' },
    { header: 'Requested By', key: 'reservedBy' },
    { 
      header: 'Role', 
      key: 'role',
      render: (role) => (
        <span className="role-badge">
          {role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'N/A'}
        </span>
      )
    },
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Purpose', key: 'purpose' },
    {
      header: 'Actions',
      key: 'id',
      render: (id, demand) => (
        <div className="table-actions">
          <button 
            className="btn-table btn-view"
            onClick={() => handleViewDemand(demand)}
          >
            View
          </button>
          <button 
            className="btn-table btn-edit"
            onClick={() => handleApproveDemand(id)}
            disabled={isLoading}
          >
            Approve
          </button>
          <button 
            className="btn-table btn-delete"
            onClick={() => openRejectModal(demand)}
            disabled={isLoading}
          >
            Reject
          </button>
        </div>
      )
    }
  ];
  
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
          <h2>Pending Approval Demands</h2>
          <button 
            className="btn-refresh"
            onClick={fetchPendingDemands}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="role">User Role</label>
            <select 
              id="role" 
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
            >
              <option value="">All Roles</option>
              <option value="PROFESSOR">Professor</option>
              <option value="STUDENT">Student</option>
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
          <div className="loading-indicator">Loading demands...</div>
        ) : (
          <Table 
            columns={columns}
            data={pendingDemands}
            emptyMessage="No pending demands found"
          />
        )}
      </div>
      
      {/* Demand Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Demand Details"
      >
        {selectedDemand && (
          <div className="reservation-details">
            <div className="detail-item">
              <span className="detail-label">Demand ID</span>
              <span className="detail-value">{selectedDemand.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Classroom/Room</span>
              <span className="detail-value">{selectedDemand.classroom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Requested By</span>
              <span className="detail-value">{selectedDemand.reservedBy}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                <span className="role-badge">
                  {selectedDemand.role ? selectedDemand.role.charAt(0).toUpperCase() + selectedDemand.role.slice(1).toLowerCase() : 'N/A'}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(selectedDemand.date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time</span>
              <span className="detail-value">{selectedDemand.time}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Purpose</span>
              <span className="detail-value">{selectedDemand.purpose}</span>
            </div>
            {selectedDemand.notes && (
              <div className="detail-item">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{selectedDemand.notes}</span>
              </div>
            )}
            {selectedDemand.createdAt && (
              <div className="detail-item">
                <span className="detail-label">Requested On</span>
                <span className="detail-value">
                  {new Date(selectedDemand.createdAt).toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="btn-primary mr-3"
                onClick={() => handleApproveDemand(selectedDemand.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Approve Demand'}
              </button>
              <button 
                className="btn-danger"
                onClick={() => openRejectModal(selectedDemand)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Reject Demand'}
              </button>
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
        {selectedDemand && (
          <div className="reject-reservation-form">
            <p>
              You are about to reject the reservation request for 
              <strong> {selectedDemand.classroom}</strong> by 
              <strong> {selectedDemand.reservedBy}</strong> on 
              <strong> {formatDate(selectedDemand.date)}</strong>.
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
                onClick={handleRejectDemand}
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

export default AdminDemands;