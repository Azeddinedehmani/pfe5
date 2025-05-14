import React, { useState, useEffect } from 'react';
import SettingsService from '../../services/SettingsService';
import '../../styles/dashboard.css';

const AdminSettings = () => {
  // States for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // System settings state
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Campus Room',
    tagline: 'Smart Classroom Management System',
    contactEmail: 'admin@campusroom.edu',
    supportPhone: '(555) 123-4567',
    autoApproveAdmin: true,
    autoApproveProfessor: false,
    autoApproveStudent: false
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    reservationCreated: true,
    reservationApproved: true,
    reservationRejected: true,
    newUserRegistered: true,
    systemUpdates: true,
    dailyDigest: false
  });
  
  // Reservation settings state
  const [reservationSettings, setReservationSettings] = useState({
    maxDaysInAdvance: 30,
    minTimeBeforeReservation: 1,
    maxHoursPerReservation: 4,
    maxReservationsPerWeek: 5,
    studentRequireApproval: true,
    professorRequireApproval: false,
    showAvailabilityCalendar: true
  });
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching settings...');
        // Use our SettingsService instead of direct API call
        const settings = await SettingsService.getSettings(true); // Force refresh
        console.log('Settings loaded:', settings);
        
        // Update all three state groups
        setGeneralSettings({
          systemName: settings.systemName,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
          supportPhone: settings.supportPhone,
          autoApproveAdmin: settings.autoApproveAdmin,
          autoApproveProfessor: settings.autoApproveProfessor,
          autoApproveStudent: settings.autoApproveStudent
        });
        
        setNotificationSettings({
          emailNotifications: settings.emailNotifications,
          reservationCreated: settings.reservationCreated,
          reservationApproved: settings.reservationApproved,
          reservationRejected: settings.reservationRejected,
          newUserRegistered: settings.newUserRegistered,
          systemUpdates: settings.systemUpdates,
          dailyDigest: settings.dailyDigest
        });
        
        setReservationSettings({
          maxDaysInAdvance: settings.maxDaysInAdvance,
          minTimeBeforeReservation: settings.minTimeBeforeReservation,
          maxHoursPerReservation: settings.maxHoursPerReservation,
          maxReservationsPerWeek: settings.maxReservationsPerWeek,
          studentRequireApproval: settings.studentRequireApproval,
          professorRequireApproval: settings.professorRequireApproval,
          showAvailabilityCalendar: settings.showAvailabilityCalendar
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings. Please check your connection and try again.');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle general settings changes
  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle notification settings changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  // Handle reservation settings changes
  const handleReservationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReservationSettings({
      ...reservationSettings,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value)
    });
  };
  
  // Save settings to the backend API
  const saveSettings = async () => {
    try {
      setSaveStatus('saving');
      
      // Combine all settings objects into one that matches the DTO structure
      const combinedSettings = {
        ...generalSettings,
        ...notificationSettings,
        ...reservationSettings
      };
      
      console.log('Saving settings:', combinedSettings);
      
      // Use our SettingsService instead of direct API call
      const updatedSettings = await SettingsService.updateSettings(combinedSettings);
      console.log('Settings saved successfully:', updatedSettings);
      
      // Show success message
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000); // Clear error message after 5 seconds
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="main-content">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      <div className="section-header">
        <h2>System Settings</h2>
        <button 
          className="btn-primary"
          onClick={saveSettings}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <span>Saving...</span>
          ) : (
            <span><i className="fas fa-save"></i> Save All Settings</span>
          )}
        </button>
      </div>
      
      {saveStatus === 'success' && (
        <div className="alert alert-success">
          Settings saved successfully!
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="alert alert-danger">
          Failed to save settings. Please try again.
        </div>
      )}
      
      {/* General Settings */}
      <div className="section">
        <h3 className="sub-section-title">General Settings</h3>
        <form className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="systemName">System Name</label>
              <input 
                type="text" 
                id="systemName" 
                name="systemName"
                value={generalSettings.systemName}
                onChange={handleGeneralChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tagline">Tagline</label>
              <input 
                type="text" 
                id="tagline" 
                name="tagline"
                value={generalSettings.tagline}
                onChange={handleGeneralChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input 
                type="email" 
                id="contactEmail" 
                name="contactEmail"
                value={generalSettings.contactEmail}
                onChange={handleGeneralChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="supportPhone">Support Phone</label>
              <input 
                type="text" 
                id="supportPhone" 
                name="supportPhone"
                value={generalSettings.supportPhone}
                onChange={handleGeneralChange}
              />
            </div>
          </div>
          
          <div className="form-group checkbox-group">
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="autoApproveAdmin" 
                name="autoApproveAdmin"
                checked={generalSettings.autoApproveAdmin}
                onChange={handleGeneralChange}
              />
              <label htmlFor="autoApproveAdmin">Auto-approve Admin reservations</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="autoApproveProfessor" 
                name="autoApproveProfessor"
                checked={generalSettings.autoApproveProfessor}
                onChange={handleGeneralChange}
              />
              <label htmlFor="autoApproveProfessor">Auto-approve Professor reservations</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="autoApproveStudent" 
                name="autoApproveStudent"
                checked={generalSettings.autoApproveStudent}
                onChange={handleGeneralChange}
              />
              <label htmlFor="autoApproveStudent">Auto-approve Student reservations</label>
            </div>
          </div>
        </form>
      </div>
      
      {/* Notification Settings */}
      <div className="section">
        <h3 className="sub-section-title">Notification Settings</h3>
        <form className="settings-form">
          <div className="form-group checkbox-group">
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="emailNotifications" 
                name="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationChange}
              />
              <label htmlFor="emailNotifications">Enable email notifications</label>
            </div>
            
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="reservationCreated" 
                name="reservationCreated"
                checked={notificationSettings.reservationCreated}
                onChange={handleNotificationChange}
                disabled={!notificationSettings.emailNotifications}
              />
              <label htmlFor="reservationCreated" className={!notificationSettings.emailNotifications ? 'disabled-label' : ''}>
                Notify on reservation creation
              </label>
            </div>
            
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="reservationApproved" 
                name="reservationApproved"
                checked={notificationSettings.reservationApproved}
                onChange={handleNotificationChange}
                disabled={!notificationSettings.emailNotifications}
              />
              <label htmlFor="reservationApproved" className={!notificationSettings.emailNotifications ? 'disabled-label' : ''}>
                Notify on reservation approval
              </label>
            </div>
            
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="reservationRejected" 
                name="reservationRejected"
                checked={notificationSettings.reservationRejected}
                onChange={handleNotificationChange}
                disabled={!notificationSettings.emailNotifications}
              />
              <label htmlFor="reservationRejected" className={!notificationSettings.emailNotifications ? 'disabled-label' : ''}>
                Notify on reservation rejection
              </label>
            </div>
            
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="newUserRegistered" 
                name="newUserRegistered"
                checked={notificationSettings.newUserRegistered}
                onChange={handleNotificationChange}
                disabled={!notificationSettings.emailNotifications}
                />
                <label htmlFor="systemUpdates" className={!notificationSettings.emailNotifications ? 'disabled-label' : ''}>
                  Notify on system updates
                </label>
              </div>
              
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="dailyDigest" 
                  name="dailyDigest"
                  checked={notificationSettings.dailyDigest}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.emailNotifications}
                />
                <label htmlFor="dailyDigest" className={!notificationSettings.emailNotifications ? 'disabled-label' : ''}>
                  Send daily activity digest
                </label>
              </div>
            </div>
          </form>
        </div>
        
        {/* Reservation Settings */}
        <div className="section">
          <h3 className="sub-section-title">Reservation Settings</h3>
          <form className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxDaysInAdvance">Max Days in Advance</label>
                <input 
                  type="number" 
                  id="maxDaysInAdvance" 
                  name="maxDaysInAdvance"
                  min="1"
                  max="365"
                  value={reservationSettings.maxDaysInAdvance}
                  onChange={handleReservationChange}
                />
                <small>Maximum days in advance for making reservations</small>
              </div>
              <div className="form-group">
                <label htmlFor="minTimeBeforeReservation">Min Hours Before</label>
                <input 
                  type="number" 
                  id="minTimeBeforeReservation" 
                  name="minTimeBeforeReservation"
                  min="0"
                  max="72"
                  value={reservationSettings.minTimeBeforeReservation}
                  onChange={handleReservationChange}
                />
                <small>Minimum hours before reservation can be made</small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxHoursPerReservation">Max Hours Per Reservation</label>
                <input 
                  type="number" 
                  id="maxHoursPerReservation" 
                  name="maxHoursPerReservation"
                  min="1"
                  max="24"
                  value={reservationSettings.maxHoursPerReservation}
                  onChange={handleReservationChange}
                />
                <small>Maximum hours per single reservation</small>
              </div>
              <div className="form-group">
                <label htmlFor="maxReservationsPerWeek">Max Reservations Per Week</label>
                <input 
                  type="number" 
                  id="maxReservationsPerWeek" 
                  name="maxReservationsPerWeek"
                  min="1"
                  max="21"
                  value={reservationSettings.maxReservationsPerWeek}
                  onChange={handleReservationChange}
                />
                <small>Maximum reservations per user per week</small>
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="studentRequireApproval" 
                  name="studentRequireApproval"
                  checked={reservationSettings.studentRequireApproval}
                  onChange={handleReservationChange}
                />
                <label htmlFor="studentRequireApproval">Student reservations require approval</label>
              </div>
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="professorRequireApproval" 
                  name="professorRequireApproval"
                  checked={reservationSettings.professorRequireApproval}
                  onChange={handleReservationChange}
                />
                <label htmlFor="professorRequireApproval">Professor reservations require approval</label>
              </div>
              <div className="checkbox-item">
                <input 
                  type="checkbox" 
                  id="showAvailabilityCalendar" 
                  name="showAvailabilityCalendar"
                  checked={reservationSettings.showAvailabilityCalendar}
                  onChange={handleReservationChange}
                />
                <label htmlFor="showAvailabilityCalendar">Show availability calendar to users</label>
              </div>
            </div>
          </form>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-primary"
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save All Settings'}
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.location.reload()}
            disabled={saveStatus === 'saving'}
          >
            Reset Changes
          </button>
        </div>
      </div>
    );
  };
  
  export default AdminSettings;