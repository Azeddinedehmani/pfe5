import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../api';
import '../../styles/dashboard.css';

const ClassSchedule = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [viewMode, setViewMode] = useState('day');
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Fetch class data from API
  useEffect(() => {
    const fetchClassSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get timetable data from API
        let response;
        try {
          // First try professor-specific endpoint
          response = await API.get('/api/professor/timetable');
        } catch (err) {
          console.log('Professor timetable endpoint failed, trying general endpoint');
          response = await API.timetableAPI.getMyTimetable();
        }
        
        if (response && response.data) {
          // Process the data
          const processedClasses = processClassData(response.data);
          setClasses(processedClasses);
          setFilteredClasses(processedClasses);
          console.log('Classes data processed successfully:', processedClasses);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching class schedule:', err);
        setError('Failed to load class schedule. Please try again later.');
        setLoading(false);
        
        // Fallback to mock data in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock data as fallback during development');
          const mockData = getMockClassData();
          setClasses(mockData);
          setFilteredClasses(mockData);
        }
      }
    };
    
    fetchClassSchedule();
  }, []);
  
  // Process timetable data into the format needed for class schedule
  const processClassData = (timetableData) => {
    let processedClasses = [];
    
    // If data is already an array of classes
    if (Array.isArray(timetableData)) {
      processedClasses = timetableData.map(entry => ({
        id: entry.id || `class-${Math.random().toString(36).substr(2, 9)}`,
        name: entry.name,
        time: `${entry.startTime} - ${entry.endTime}`,
        location: entry.location,
        day: entry.day,
        type: entry.type,
        students: entry.students || (entry.type === 'Lecture' ? 35 : 20), // Estimate
        info: entry.instructor ? `Assistant: ${entry.instructor}` : undefined
      }));
    } 
    // If data is grouped by day (object with day keys)
    else if (timetableData && typeof timetableData === 'object') {
      // Check if it has day keys like "Monday", "Tuesday", etc.
      const hasDayKeys = Object.keys(timetableData).some(key => daysOfWeek.includes(key));
      
      if (hasDayKeys) {
        // Process each day's entries
        daysOfWeek.forEach(day => {
          if (Array.isArray(timetableData[day])) {
            const dayClasses = timetableData[day].map(entry => ({
              id: entry.id || `class-${Math.random().toString(36).substr(2, 9)}`,
              name: entry.name,
              time: `${entry.startTime} - ${entry.endTime}`,
              location: entry.location,
              day: day,
              type: entry.type,
              students: entry.students || (entry.type === 'Lecture' ? 35 : 20), // Estimate
              info: entry.instructor ? `Assistant: ${entry.instructor}` : undefined
            }));
            
            processedClasses = [...processedClasses, ...dayClasses];
          }
        });
      }
    }
    
    return processedClasses;
  };
  
  // Mock data for fallback
  const getMockClassData = () => {
    return [
      { id: 'M1', name: 'PHYS 101: Introduction to Physics', time: '9:00 - 10:30 AM', location: 'Room 101', day: 'Monday', students: 35 },
      { id: 'M2', name: 'PHYS 301: Advanced Mechanics', time: '2:00 - 3:30 PM', location: 'Room 203', day: 'Monday', students: 22 },
      { id: 'T1', name: 'PHYS 201: Electromagnetism', time: '11:00 AM - 12:30 PM', location: 'Lab 305', day: 'Tuesday', students: 28 },
      { id: 'W1', name: 'PHYS 101: Introduction to Physics', time: '9:00 - 10:30 AM', location: 'Room 101', day: 'Wednesday', students: 35 },
      { id: 'W2', name: 'Faculty Meeting', time: '1:00 - 3:00 PM', location: 'Conference Room 105', day: 'Wednesday', info: 'Department Planning' },
      { id: 'Th1', name: 'PHYS 201: Electromagnetism', time: '11:00 AM - 12:30 PM', location: 'Lab 305', day: 'Thursday', students: 28 },
      { id: 'Th2', name: 'Office Hours', time: '2:00 - 4:00 PM', location: 'Office 240', day: 'Thursday', info: 'Student Consultations' },
      { id: 'F1', name: 'PHYS 301: Advanced Mechanics', time: '2:00 - 3:30 PM', location: 'Room 203', day: 'Friday', students: 22 },
      { id: 'F2', name: 'Research Group Meeting', time: '4:00 - 5:00 PM', location: 'Lab 310', day: 'Friday', info: 'Project Updates' }
    ];
  };
  
  // Mock data for week view
  const getWeekSchedule = () => {
    // Create an object with day keys
    const weekData = {};
    
    // Initialize empty arrays for each day
    daysOfWeek.forEach(day => {
      weekData[day] = [];
    });
    
    // Populate with filtered classes
    filteredClasses.forEach(classItem => {
      const day = classItem.day;
      if (weekData[day]) {
        weekData[day].push(classItem);
      }
    });
    
    return weekData;
  };
  
  // Filter classes by date
  const handleFilterChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      // Convert date to day of week
      const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const filtered = classes.filter(classItem => classItem.day === day);
      setFilteredClasses(filtered);
    } else {
      // Reset to all classes
      setFilteredClasses(classes);
    }
  };
  
  // Get today's day name
  const getTodayDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  // Load today's classes when first opening the page
  useEffect(() => {
    if (classes.length > 0) {
      const today = getTodayDayName();
      const todayClasses = classes.filter(classItem => classItem.day === today);
      setFilteredClasses(todayClasses.length > 0 ? todayClasses : classes);
    }
  }, [classes]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading class schedule...</p>
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
  
  // Week schedule data
  const weekSchedule = getWeekSchedule();
  
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
                  onChange={handleFilterChange}
                />
              </div>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedDate('');
                  // Show today's classes
                  const today = getTodayDayName();
                  const todayClasses = classes.filter(classItem => classItem.day === today);
                  setFilteredClasses(todayClasses.length > 0 ? todayClasses : classes);
                }}
              >
                Reset
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
                      {classItem.students && (
                        <p className="class-info">
                          <i className="fas fa-users"></i> {classItem.students} Students
                        </p>
                      )}
                      {classItem.info && (
                        <p className="class-info">
                          <i className="fas fa-clipboard-list"></i> {classItem.info}
                        </p>
                      )}
                    </div>
                    <div className="class-actions">
                      <button className="btn-small">View Details</button>
                      {classItem.students && (
                        <button className="btn-small">Class Materials</button>
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
                  <div className="day-header">{day}</div>
                  <div className="day-classes">
                    {weekSchedule[day].length === 0 ? (
                      <div className="no-classes">No Classes</div>
                    ) : (
                      weekSchedule[day].map(classItem => (
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
    </div>
  );
};

export default ClassSchedule;