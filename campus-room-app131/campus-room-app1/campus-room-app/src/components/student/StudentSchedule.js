import React, { useState } from 'react';

import '../../styles/student-schedule.css'
const StudentSchedule = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState('day');
  
  // Mock data for class schedule
  const classSchedule = {
    'Monday': [
      { id: 'C1', name: 'CS 101: Intro to Programming', time: '9:00 - 10:30 AM', location: 'Room 101', instructor: 'Professor Johnson' },
      { id: 'C2', name: 'MATH 201: Calculus II', time: '1:00 - 2:30 PM', location: 'Room 203', instructor: 'Professor Wilson' }
    ],
    'Tuesday': [
      { id: 'C3', name: 'PHYS 101: Physics I', time: '11:00 AM - 12:30 PM', location: 'Lab 305', instructor: 'Professor Smith' }
    ],
    'Wednesday': [
      { id: 'C4', name: 'CS 101: Intro to Programming', time: '9:00 - 10:30 AM', location: 'Room 101', instructor: 'Professor Johnson' },
      { id: 'C5', name: 'Study Group', time: '3:30 - 4:30 PM', location: 'Library', participants: 5 }
    ],
    'Thursday': [
      { id: 'C6', name: 'PHYS 101: Physics I', time: '11:00 AM - 12:30 PM', location: 'Lab 305', instructor: 'Professor Smith' }
    ],
    'Friday': [
      { id: 'C7', name: 'MATH 201: Calculus II', time: '1:00 - 2:30 PM', location: 'Room 203', instructor: 'Professor Wilson' }
    ],
    'Saturday': [],
    'Sunday': []
  };
  
  // Get today's day of the week
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Default classes to show (today's classes)
  const [filteredClasses, setFilteredClasses] = useState(classSchedule[today] || []);
  
  // Handle date selection
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      // Convert date to day of week
      const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      setFilteredClasses(classSchedule[day] || []);
    } else {
      // Reset to today's classes
      setFilteredClasses(classSchedule[today] || []);
    }
  };
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>Class Schedule</h2>
          <div className="view-toggles">
            <button 
              className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('day')}
            >
              Day View
            </button>
            <button 
              className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('week')}
              style={{ marginLeft: '0.5rem' }}
            >
              Week View
            </button>
          </div>
        </div>
        
        {viewMode === 'day' ? (
          <>
            <div className="filter-container">
              <div className="form-group">
                <label htmlFor="schedule-date">Select Date</label>
                <input 
                  type="date" 
                  id="schedule-date" 
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedDate('');
                  setFilteredClasses(classSchedule[today] || []);
                }}
              >
                Reset to Today
              </button>
            </div>
            
            <div className="today-classes">
              {filteredClasses.length === 0 ? (
                <div className="no-results">
                  <p>No classes scheduled for the selected date.</p>
                </div>
              ) : (
                filteredClasses.map(classItem => (
                  <div className="class-card" key={classItem.id}>
                    <div className="class-time">{classItem.time}</div>
                    <div className="class-details">
                      <h3 className="class-name">{classItem.name}</h3>
                      <p className="class-location">
                        <i className="fas fa-map-marker-alt"></i> {classItem.location}
                      </p>
                      {classItem.instructor && (
                        <p className="class-instructor">
                          <i className="fas fa-user"></i> {classItem.instructor}
                        </p>
                      )}
                      {classItem.participants && (
                        <p className="class-participants">
                          <i className="fas fa-users"></i> {classItem.participants} Participants
                        </p>
                      )}
                    </div>
                    <div className="class-actions">
                      <button className="btn-small">View Materials</button>
                      {classItem.name.includes('Study Group') && (
                        <button className="btn-small">View Group</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="week-schedule">
            <div className="week-grid">
              {daysOfWeek.map(day => (
                <div className="day-column" key={day}>
                  <div className={`day-header ${day === today ? 'today' : ''}`}>
                    {day}
                    {day === today && <span className="today-badge">Today</span>}
                  </div>
                  <div className="day-classes">
                    {classSchedule[day].length === 0 ? (
                      <div className="no-classes">No Classes</div>
                    ) : (
                      classSchedule[day].map(classItem => (
                        <div className="week-class-card" key={classItem.id}>
                          <div className="class-time">{classItem.time}</div>
                          <div className="class-name">{classItem.name}</div>
                          <div className="class-location">{classItem.location}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="section">
        <div className="section-header">
          <h2>Upcoming Assignments</h2>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Assignment</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CS 101</td>
                <td>Programming Assignment 3</td>
                <td>Apr 1, 2025</td>
                <td><span className="status-badge status-pending">Pending</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-table btn-view">View</button>
                    <button className="btn-table btn-edit">Start</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>MATH 201</td>
                <td>Problem Set 4</td>
                <td>Apr 3, 2025</td>
                <td><span className="status-badge status-in-progress">In Progress</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-table btn-view">View</button>
                    <button className="btn-table btn-edit">Continue</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>PHYS 101</td>
                <td>Lab Report 2</td>
                <td>Apr 5, 2025</td>
                <td><span className="status-badge status-pending">Pending</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-table btn-view">View</button>
                    <button className="btn-table btn-edit">Start</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentSchedule;