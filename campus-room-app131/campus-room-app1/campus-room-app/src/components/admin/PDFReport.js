// src/components/admin/PDFReport.js
import React, { useState, useEffect } from 'react';
import './PDFReportStyles.css'; // Will create this separately

/**
 * Enhanced PDF Report component that properly renders tabular data
 * Designed for printable PDF exports with professional formatting
 */
const PDFReport = ({ data, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize when component mounts
  useEffect(() => {
    try {
      if (!data) {
        throw new Error('No report data provided');
      }
      
      // Validate required data structures
      if (!data.statistics || !data.tables) {
        throw new Error('Invalid report data format');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing PDF report:', error);
      setError(error.message || 'Failed to prepare report');
      setIsLoading(false);
    }
  }, [data]);
  
  // Print the PDF report
  const handlePrint = () => {
    window.print();
  };
  
  // Download as PDF using browser's print functionality
  const handleDownload = () => {
    window.print();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="pdf-report-container loading">
        <div className="loading-spinner"></div>
        <p>Generating report...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="pdf-report-container error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
  // Helper function to render table data
  const renderTable = (tableData, title) => {
    if (!tableData || !tableData.headers || !tableData.rows || tableData.rows.length === 0) {
      return (
        <div className="pdf-table-section">
          <h3>{title}</h3>
          <p>No data available</p>
        </div>
      );
    }
    
    return (
      <div className="pdf-table-section">
        <h3>{title}</h3>
        <div className="table-container">
          <table className="pdf-table">
            <thead>
              <tr>
                {tableData.headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell !== undefined ? cell : 'N/A'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render report content
  return (
    <div className="pdf-report-container">
      <div className="report-actions print-hide">
        <h2>Report Preview</h2>
        <div className="action-buttons">
          <button className="btn-primary" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print
          </button>
          <button className="btn-secondary" onClick={handleDownload}>
            <i className="fas fa-download"></i> Download PDF
          </button>
          <button className="btn-cancel" onClick={onClose}>
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
      
      <div className="pdf-report-content">
        <div className="report-header">
          <h1>{data.title || 'Campus Room Management System Report'}</h1>
          <p className="report-date">Generated on {formatDate(data.generatedAt)}</p>
        </div>
        
        {/* System Overview Statistics */}
        <div className="pdf-summary-section">
          <h2>System Overview</h2>
          <div className="pdf-summary-grid">
            <div className="summary-row">
              <div className="summary-cell">
                <h4>Reservations</h4>
                <p className="stat-large">{data.statistics.totalReservations || 0}</p>
                <p>{data.statistics.approvedReservations || 0} approved, {data.statistics.pendingReservations || 0} pending</p>
              </div>
              <div className="summary-cell">
                <h4>Rooms</h4>
                <p className="stat-large">{(data.statistics.totalClassrooms || 0) + (data.statistics.totalStudyRooms || 0)}</p>
                <p>{data.statistics.totalClassrooms || 0} classrooms, {data.statistics.totalStudyRooms || 0} study rooms</p>
              </div>
              <div className="summary-cell">
                <h4>Users</h4>
                <p className="stat-large">{data.statistics.totalUsers || 0}</p>
                <p>
                  {data.statistics.usersByRole?.professorCount || 0} professors, 
                  {data.statistics.usersByRole?.studentCount || 0} students
                </p>
              </div>
            </div>
            <div className="summary-row">
              <div className="summary-cell">
                <h4>Professor Reservations</h4>
                <p className="stat-medium">{data.statistics.professorReservations || 0}</p>
              </div>
              <div className="summary-cell">
                <h4>Student Reservations</h4>
                <p className="stat-medium">{data.statistics.studentReservations || 0}</p>
              </div>
              <div className="summary-cell">
                <h4>Admin Reservations</h4>
                <p className="stat-medium">{data.statistics.adminReservations || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users by Role Table */}
        {renderTable(data.tables.usersByRole, "Users by Role")}
        
        {/* Popular Rooms Table */}
        {renderTable(data.tables.popularRooms, "Most Popular Rooms")}
        
        {/* Monthly Activity Table */}
        {renderTable(data.tables.monthlyActivity, "Monthly Reservation Activity")}
        
        {/* Active Users Table */}
        {renderTable(data.tables.activeUsers, "Most Active Users")}
        
        {/* Recent Reservations Table */}
        {renderTable(data.tables.reservations, "Recent Reservations")}
        
        <div className="report-footer">
          <p>Campus Room - Classroom Management System Report</p>
          <p>Generated on {formatDate(data.generatedAt)}</p>
          <p>Page <span className="page-number"></span></p>
        </div>
      </div>
    </div>
  );
};

export default PDFReport;