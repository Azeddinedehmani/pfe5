import React, { useState, useEffect } from 'react';
import { API } from '../../api';
import '../../styles/dashboard.css';

const ClassGroupManagement = () => {
  // Original states
  const [branches, setBranches] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedClassGroup, setSelectedClassGroup] = useState(null);
  const [expandedBranches, setExpandedBranches] = useState({});
  
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBranchStudentsModal, setShowBranchStudentsModal] = useState(false);
  const [selectedBranchForStudents, setSelectedBranchForStudents] = useState(null);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [professors, setProfessors] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // New states for classroom management
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const [isSearchingClassrooms, setIsSearchingClassrooms] = useState(false);
  const [classroomSearchDate, setClassroomSearchDate] = useState('');
  const [classroomSearchStartTime, setClassroomSearchStartTime] = useState('');
  const [classroomSearchEndTime, setClassroomSearchEndTime] = useState('');
  
  // Conflict checking states
  const [isPotentialConflictChecking, setIsPotentialConflictChecking] = useState(false);
  const [potentialConflict, setPotentialConflict] = useState(null);
  const [conflictCheckTimeout, setConflictCheckTimeout] = useState(null);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState([]);
  
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    description: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    description: '',
    academicYear: '',
    semester: '',
    professorId: '',
    branchId: '',
    classroomId: '', // Add classroomId to the form data
    meetingDays: [], // Add for multiple meeting days
    startTime: '',  // Add startTime
    endTime: '',    // Add endTime
    location: ''    // Add location field
  });
  
  // Timetable states
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [newTimetableEntry, setNewTimetableEntry] = useState({
    day: 'Monday',
    name: '',
    instructor: '',
    location: '',
    startTime: '',
    endTime: '',
    color: '#6366f1',
    type: 'Lecture'
  });
  
  // Days of the week for timetable
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Class types
  const classTypes = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Workshop'];
  
  // Available colors
  const availableColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#0ea5e9' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Pink', value: '#ec4899' }
  ];
  
  // Academic years (current year - 1 to current year + 3)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = -1; i <= 3; i++) {
    const startYear = currentYear + i;
    academicYears.push(`${startYear}-${startYear + 1}`);
  }
  
  // Semesters
  const semesters = ['Fall', 'Spring', 'Summer'];
  
  // Time slots - only include whole hours (not half hours)
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    // Only add whole hours
    const formattedHour = hour.toString().padStart(2, '0');
    timeSlots.push(`${formattedHour}:00`);
  }

  // Function to validate if a time is on a whole hour (e.g., 9:00, 10:00, not 9:30)
  const isWholeHourTime = (time) => {
    if (!time) return false;
    const [hours, minutes] = time.split(':').map(Number);
    return minutes === 0; // Only allow times where minutes is 0
  };

 // Updated time validation function to enforce hourly boundaries
const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { valid: false, message: "Start and end times are required" };
  }
  
  // Check if both times are on whole hours
  if (!isWholeHourTime(startTime)) {
    return { valid: false, message: "Start time must be on the hour (e.g., 9:00, 10:00)" };
  }
  
  if (!isWholeHourTime(endTime)) {
    return { valid: false, message: "End time must be on the hour (e.g., 9:00, 10:00)" };
  }
  
  // Check if times are within allowed range (8 AM to 6 PM)
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  if (startHour < 8 || startHour >= 18) {
    return { 
      valid: false, 
      message: "Start time must be between 8:00 AM and 5:00 PM" 
    };
  }
  
  if (endHour < 9 || endHour > 18) {
    return { 
      valid: false, 
      message: "End time must be between 9:00 AM and 6:00 PM" 
    };
  }
  
  // Check if end time is after start time
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);
  
  if (endMinutes <= startMinutes) {
    return { valid: false, message: "End time must be after start time" };
  }
  
  // Check if the duration is exactly 1 or 2 hours
  const durationHours = (endMinutes - startMinutes) / 60;
  if (durationHours !== 1 && durationHours !== 2) {
    return { 
      valid: false, 
      message: "Class duration must be exactly 1 or 2 hours (e.g., 9:00-10:00 or 9:00-11:00)" 
    };
  }
  
  return { valid: true };
};

  // Add some additional CSS for the collapsible branches and centered text
  React.useEffect(() => {
    // Add these styles to the existing dashboard.css
    const style = document.createElement('style');
    style.textContent = `
      /* Original styles kept */
      .branch-header.collapsible {
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .branch-header.collapsible:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }
      
      .branch-header-content {
        display: flex;
        align-items: center;
      }
      
      .branch-class-count {
        margin-left: 10px;
        font-size: 0.9rem;
        color: #666;
      }
      
      .text-center {
        text-align: center;
      }
      
      .mr-2 {
        margin-right: 8px;
      }

      .btn-retry {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .btn-retry:hover {
        background-color: #e5e7eb;
      }

      .btn-retry i {
        font-size: 14px;
      }

      .alert-error {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* New styles for classroom selection */
      .classrooms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      
      .classroom-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        position: relative;
        transition: all 0.2s;
        cursor: pointer;
      }
      
      .classroom-card:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .classroom-card.selected {
        border-color: #10b981;
        background-color: rgba(16, 185, 129, 0.1);
      }
      
      .classroom-image {
        height: 120px;
        width: 100%;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      
      .classroom-name {
        font-weight: 600;
        margin-bottom: 4px;
        font-size: 1.1rem;
      }
      
      .classroom-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.9rem;
        color: #4b5563;
      }
      
      .classroom-detail {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .classroom-detail i {
        width: 16px;
        text-align: center;
        color: #6366f1;
      }
      
      .classroom-features {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .classroom-feature {
        background-color: #f3f4f6;
        font-size: 0.8rem;
        padding: 2px 8px;
        border-radius: 4px;
      }
      
      .room-selection-header {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .searching-classrooms {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        gap: 10px;
        color: #6366f1;
      }
      
      .meeting-days-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      
      .day-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        background-color: #f3f4f6;
        border-radius: 4px;
        padding: 4px 12px;
        transition: all 0.2s;
      }
      
      .day-checkbox.selected {
        background-color: #6366f1;
        color: white;
      }
      
      .day-checkbox input {
        display: none;
      }
      
      /* Classroom search form styles */
      .classroom-search-form {
        margin-bottom: 20px;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }

      .classroom-search-info {
        font-size: 0.9rem;
        color: #6b7280;
        margin-bottom: 12px;
      }

      .classroom-search-info i {
        color: #3b82f6;
        margin-right: 6px;
      }

      .search-button-container {
        display: flex;
        align-items: flex-end;
      }

      .select-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 0.9rem;
        padding: 8px;
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
      }
      
      .conflict-warning {
        margin: 15px 0;
        padding: 10px 15px;
        border-radius: 6px;
        border-left: 4px solid #f59e0b;
        background-color: #fff7ed;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .conflict-warning i {
        color: #f59e0b;
        font-size: 1.2rem;
        margin-top: 2px;
      }

      .conflict-warning.classroom-conflict {
        border-left-color: #ef4444;
        background-color: #fee2e2;
      }

      .conflict-warning.classroom-conflict i {
        color: #ef4444;
      }

      .conflict-warning.professor-conflict {
        border-left-color: #8b5cf6;
        background-color: #ede9fe;
      }

      .conflict-warning.professor-conflict i {
        color: #8b5cf6;
      }

      .conflict-warning.student-conflict {
        border-left-color: #3b82f6;
        background-color: #dbeafe;
      }

      .conflict-warning.student-conflict i {
        color: #3b82f6;
      }
      
      .conflict-warning.time-format-conflict {
        border-left-color: #3b82f6;
        background-color: #eff6ff;
      }
      
      .conflict-warning.time-format-conflict i {
        color: #3b82f6;
      }
      
      /* Style for time input fields to visually show restrictions */
      input[type="time"].whole-hour-only {
        border-left: 4px solid #6366f1;
      }
      
      .time-input-helper {
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 4px;
      }
      
      .time-input-helper i {
        margin-right: 4px;
        color: #6366f1;
      }

      .affected-users-list {
        margin-top: 8px;
        font-size: 0.9rem;
      }

      .classroom-conflict-text, 
      .professor-conflict-text, 
      .student-conflict-text {
        margin-bottom: 4px;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .classroom-conflict-text {
        background-color: rgba(239, 68, 68, 0.1);
      }

      .professor-conflict-text {
        background-color: rgba(139, 92, 246, 0.1);
      }

      .student-conflict-text {
        background-color: rgba(59, 130, 246, 0.1);
      }

      .alternatives-container {
        margin: 15px 0;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        background-color: #f9fafb;
      }

      .alternatives-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #4b5563;
        margin-bottom: 10px;
      }

      .alternatives-title i {
        color: #f59e0b;
      }

      .alternatives-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .alternative-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 0.9rem;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
      }

      .alternative-button:hover {
        background-color: #f3f4f6;
        border-color: #d1d5db;
      }

      .alternative-button i {
        color: #6366f1;
      }

      .checking-conflicts {
        margin: 10px 0;
        padding: 8px 12px;
        background-color: #f3f4f6;
        color: #4b5563;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checking-conflicts i {
        color: #6366f1;
      }

      .conflict-button-info {
        margin-top: 8px;
        font-size: 0.9rem;
        color: #4b5563;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .conflict-button-info i {
        color: #f59e0b;
      }

      .timetable-conflicts {
        padding: 12px;
        background-color: #fee2e2;
        border-radius: 6px;
        color: #b91c1c;
      }

      .timetable-conflicts ul {
        margin: 10px 0;
        padding-left: 20px;
      }

      .timetable-conflicts li {
        margin-bottom: 4px;
      }
      
      .branch-note {
        margin-top: 20px;
        padding: 15px;
        background-color: #f9fafb;
        border-radius: 6px;
        border-left: 4px solid #3b82f6;
      }
      
      .branch-note h4 {
        margin-top: 0;
        color: #3b82f6;
      }
    `;
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch branches and class groups on component mount
  useEffect(() => {
    fetchBranches();
    fetchClassGroups();
    fetchProfessors();
  }, []);
  
// Enhanced ConflictWarning component with improved conflict type detection
const ConflictWarning = ({ conflict }) => {
  if (!conflict || !conflict.hasConflict) return null;
  
  // Get conflict types
  const conflictTypes = conflict.conflictType || [];
  
  // Check specific conflict types
  const hasClassroomConflict = conflictTypes.includes("CLASSROOM") ||
    (conflict.affectedUsers && conflict.affectedUsers.some(user => user.role === "CLASSROOM"));
    
  const hasProfessorConflict = conflictTypes.includes("PROFESSOR") ||
    (conflict.affectedUsers && conflict.affectedUsers.some(user => user.role === "PROFESSOR"));
    
  const hasStudentConflict = conflictTypes.includes("STUDENT") ||
    (conflict.affectedUsers && conflict.affectedUsers.some(user => user.role === "STUDENT"));
    
  const hasTimeFormatConflict = conflictTypes.includes("TIME_FORMAT");
  
  // Get classroom names if there are classroom conflicts
  const classroomNames = hasClassroomConflict && conflict.affectedUsers ? 
    conflict.affectedUsers
      .filter(user => user.role === "CLASSROOM")
      .map(user => user.lastName) : [];
  
  return (
    <div className={`conflict-warning 
      ${hasClassroomConflict ? 'classroom-conflict' : ''} 
      ${hasProfessorConflict ? 'professor-conflict' : ''} 
      ${hasStudentConflict ? 'student-conflict' : ''}
      ${hasTimeFormatConflict ? 'time-format-conflict' : ''}`}>
      <i className="fas fa-exclamation-triangle"></i>
      <div>
        <span>{conflict.message}</span>
        {conflict.affectedUsers && (
          <div className="affected-users-list">
            {hasClassroomConflict && (
              <div className="classroom-conflict-text">
                <strong>Classroom Conflict:</strong> The classroom{classroomNames.length > 1 ? 's' : ''} ({classroomNames.join(', ')}) {classroomNames.length > 1 ? 'are' : 'is'} already booked during this time.
              </div>
            )}
            {hasProfessorConflict && (
              <div className="professor-conflict-text">
                <strong>Professor Conflict:</strong> The professor has another class during this time.
              </div>
            )}
            {hasStudentConflict && (
              <div className="student-conflict-text">
                <strong>Student Conflict:</strong> One or more students have classes during this time.
              </div>
              )}
              <small>
                Affected: 
                {conflict.affectedUsers
                  .filter(user => user.role !== "CLASSROOM") // Filter out classrooms from general user list
                  .map((user, index) => (
                    <span key={user.id}>
                      {index > 0 ? ', ' : ' '}
                      {user.role === 'PROFESSOR' ? 'Prof. ' : ''}
                      {user.firstName} {user.lastName}
                    </span>
                  ))}
              </small>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Enhanced Alternative Time Suggestions component
  const AlternativeSuggestions = ({ alternatives, onSelectAlternative }) => {
    if (!alternatives || alternatives.length === 0) return null;
    
    return (
      <div className="alternatives-container">
        <div className="alternatives-title">
          <i className="fas fa-lightbulb"></i>
          Suggested alternatives to avoid conflicts:
        </div>
        <div className="alternatives-list">
          {alternatives.map((alt, index) => (
            <button 
              key={index} 
              className="alternative-button"
              onClick={() => onSelectAlternative(alt)}
            >
              <i className="fas fa-clock"></i>
              {alt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };
    
    // Classroom Selection Component
    const ClassroomSelector = ({ classrooms, selectedId, onSelect }) => {
      if (!classrooms || classrooms.length === 0) {
        return (
          <div className="no-classrooms-message">
            <p>No classrooms available for the selected time. Please try a different date or time.</p>
          </div>
        );
      }
      
      return (
        <div className="classrooms-grid">
          {classrooms.map(classroom => (
            <div 
              key={classroom.id} 
              className={`classroom-card ${selectedId === classroom.id ? 'selected' : ''}`}
              onClick={() => onSelect(classroom)}
            >
              <img 
                src={classroom.image || '/images/classroom-default.jpg'} 
                alt={classroom.roomNumber} 
                className="classroom-image"
              />
              <div className="classroom-name">{classroom.roomNumber}</div>
              <div className="classroom-details">
                <div className="classroom-detail">
                  <i className="fas fa-door-open"></i>
                  <span>{classroom.type}</span>
                </div>
                <div className="classroom-detail">
                  <i className="fas fa-users"></i>
                  <span>Capacity: {classroom.capacity}</span>
                </div>
              </div>
              <div className="classroom-features">
                {classroom.features && Array.isArray(classroom.features) && 
                  classroom.features.map((feature, index) => (
                    <span key={index} className="classroom-feature">{feature}</span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      );
    };
    
    // Classroom Search Form Component
    const ClassroomSearchForm = ({ onSearch }) => {
      const today = new Date().toISOString().split('T')[0];
      
      const handleSubmit = (e) => {
        e.preventDefault();
        if (classroomSearchDate && classroomSearchStartTime && classroomSearchEndTime) {
          // Validate time format first
          const timeValidation = validateTimeRange(classroomSearchStartTime, classroomSearchEndTime);
          if (!timeValidation.valid) {
            setError(timeValidation.message);
            return;
          }
          
          onSearch(classroomSearchDate, classroomSearchStartTime, classroomSearchEndTime);
        } else {
          setError('Please provide date, start time, and end time to search for available classrooms.');
        }
      };
      
      return (
        <div className="classroom-search-form">
          <h4>Search Available Classrooms</h4>
          <p className="classroom-search-info">
            <i className="fas fa-info-circle"></i> Find classrooms available at a specific date and time
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchDate">Date</label>
                <input
                  type="date"
                  id="searchDate"
                  value={classroomSearchDate}
                  onChange={(e) => setClassroomSearchDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="searchStartTime">Start Time</label>
                <input
                  type="time"
                  id="searchStartTime"
                  className="whole-hour-only"
                  value={classroomSearchStartTime}
                  onChange={(e) => setClassroomSearchStartTime(e.target.value)}
                  required
                  step="3600" // Only allow whole hours
                />
                <div className="time-input-helper">
                  <i className="fas fa-info-circle"></i> Must be on the hour (e.g., 9:00)
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="searchEndTime">End Time</label>
                <input
                  type="time"
                  id="searchEndTime"
                  className="whole-hour-only"
                  value={classroomSearchEndTime}
                  onChange={(e) => setClassroomSearchEndTime(e.target.value)}
                  required
                  step="3600" // Only allow whole hours
                />
                <div className="time-input-helper">
                  <i className="fas fa-info-circle"></i> Must be 1-2 hours after start time
                </div>
              </div>
              
              <div className="form-group search-button-container">
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={isSearchingClassrooms}
                >
                  {isSearchingClassrooms ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Searching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search"></i> Search Classrooms
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      );
    };
    
    // Helper function to convert time to minutes for comparison
    const convertTimeToMinutes = (time) => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Check for potential conflicts before adding a timetable entry
    const checkForPotentialConflicts = async (newEntry) => {
      if (!selectedClassGroup || !newEntry.day || !newEntry.startTime || !newEntry.endTime) {
        return null; // Not enough info to check
      }
      
      try {
        // First validate the time format
        const timeValidation = validateTimeRange(newEntry.startTime, newEntry.endTime);
        if (!timeValidation.valid) {
          return {
            hasConflict: true,
            message: timeValidation.message,
            conflictType: ["TIME_FORMAT"]
          };
        }
        
        // Check if the entry conflicts with any existing entries in the current timetable
        const localConflict = timetableEntries.some(entry => 
          entry.day === newEntry.day &&
          ((convertTimeToMinutes(entry.startTime) < convertTimeToMinutes(newEntry.endTime) &&
            convertTimeToMinutes(entry.endTime) > convertTimeToMinutes(newEntry.startTime)))
        );
        
        if (localConflict) {
          return {
            hasConflict: true,
            message: "This time slot conflicts with another entry in the current timetable.",
            conflictType: ["LOCAL"]
          };
        }
        
        // Make an API call to check if this time would create conflicts with students or professor
        // IMPORTANT: Include the location in the API call to properly check for hall conflicts
        const response = await API.post(`/api/class-groups/${selectedClassGroup.id}/check-conflicts`, {
          day: newEntry.day,
          startTime: newEntry.startTime,
          endTime: newEntry.endTime,
          location: newEntry.location // Include location to check for classroom conflicts
        });
        
        // For debugging
        console.log('Conflict check response:', response.data);
        
        // Process alternative suggestions if they exist
        if (response.data.hasConflict && response.data.alternatives) {
          // Filter alternatives to ensure they also meet the time validation (whole hours only)
          const validAlternatives = response.data.alternatives.filter(alt => {
            return isWholeHourTime(alt.startTime) && 
                   isWholeHourTime(alt.endTime) && 
                   (convertTimeToMinutes(alt.endTime) - convertTimeToMinutes(alt.startTime)) % 60 === 0;
          });
          
          setAlternativeSuggestions(validAlternatives);
        } else {
          setAlternativeSuggestions([]);
        }
        
        return response.data;
      } catch (err) {
        console.error('Error checking for conflicts:', err);
        return null;
      }
    };
    
    // Apply an alternative suggestion
    const applyAlternativeSuggestion = (alternative) => {
      setNewTimetableEntry({
        ...newTimetableEntry,
        day: alternative.day,
        startTime: alternative.startTime,
        endTime: alternative.endTime
      });
      
      // Clear conflict after applying alternative
      setPotentialConflict(null);
      setAlternativeSuggestions([]);
    };
    
    // Fetch branches
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await API.get('/api/branches');
        setBranches(response.data);
        
        // Initialize expanded state for each branch
        const expandedState = {};
        response.data.forEach(branch => {
          expandedState[branch.id] = false;
        });
        setExpandedBranches(expandedState);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch class groups
    const fetchClassGroups = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await API.get('/api/class-groups');
        setClassGroups(response.data);
      } catch (err) {
        console.error('Error fetching class groups:', err);
        setError('Failed to load class groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch professors for dropdown
    const fetchProfessors = async () => {
      try {
        const response = await API.userAPI.getUsersByRole('PROFESSOR');
        setProfessors(response.data);
      } catch (err) {
        console.error('Error fetching professors:', err);
      }
    };
    
    // Fetch all classrooms
    const fetchAllClassrooms = async () => {
      setIsLoadingClassrooms(true);
      try {
        const response = await API.get('/api/rooms/classrooms');
        setAvailableClassrooms(response.data);
        return response.data;
      } catch (err) {
        console.error('Error fetching classrooms:', err);
        // Try from local storage as fallback
        try {
          const storedClassrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
          setAvailableClassrooms(storedClassrooms);
          return storedClassrooms;
        } catch (e) {
          console.error('Failed to get classrooms from localStorage:', e);
          setAvailableClassrooms([]);
          return [];
        }
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    
    // Search for classrooms available at a specific time
    const searchAvailableClassrooms = async (date, startTime, endTime) => {
      if (!date || !startTime || !endTime) {
        setError('Please provide date, start time, and end time to search.');
        return;
      }
      
      // Validate that times are on whole hours and duration is 1-2 hours
      const timeValidation = validateTimeRange(startTime, endTime);
      if (!timeValidation.valid) {
        setError(timeValidation.message);
        return;
      }
      
      setIsSearchingClassrooms(true);
      setError(null);
      
      try {
        // Call the API to search for available rooms
        const response = await API.get('/api/rooms/search', {
          params: {
            date,
            startTime,
            endTime,
            type: '', // Leave empty to get all types
            minCapacity: 0 // Default to any capacity
          }
        });
        
        setAvailableClassrooms(response.data);
        
        if (response.data.length === 0) {
          setMessage({
            text: 'No classrooms available for the selected time slot.',
            type: 'warning'
          });
        } else {
          setMessage({
            text: `Found ${response.data.length} available classrooms.`,
            type: 'success'
          });
        }
      } catch (err) {
        console.error('Error searching for available classrooms:', err);
        setError('Failed to search for available classrooms. Showing all classrooms instead.');
        
        // Fallback to getting all classrooms
        await fetchAllClassrooms();
      } finally {
        setIsSearchingClassrooms(false);
      }
    };
    
    // Open branch students modal
    const openBranchStudentsModal = async (branch) => {
      setLoading(true);
      setError(null);
      setRetryCount(0);
      
      try {
        // Set the selected branch
        setSelectedBranchForStudents(branch);
        
        // Try to load branch students
        try {
          const studentsResponse = await API.get(`/api/branches/${branch.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            setSelectedStudents(studentsResponse.data);
          } else {
            console.warn('No students data received');
            setSelectedStudents([]);
          }
        } catch (studentErr) {
          console.error('Error fetching branch students:', studentErr);
          setError('Failed to load student data. Please try again.');
          setSelectedStudents([]);
        }
        
        // Try to load available students
        try {
          const availableResponse = await API.get(`/api/branches/${branch.id}/available-students`);
          if (availableResponse && availableResponse.data) {
            setAvailableStudents(availableResponse.data);
          } else {
            console.warn('No available students data received');
            setAvailableStudents([]);
          }
        } catch (availableErr) {
          console.error('Error fetching available students:', availableErr);
          setAvailableStudents([]);
        }
        
        // Show the modal
        setShowBranchStudentsModal(true);
      } catch (err) {
        console.error('Error opening branch students modal:', err);
        setError('Failed to load student data. Please try again.');
        setShowBranchStudentsModal(true);
      } finally {
        setLoading(false);
      }
    };
  
    // Add student to branch
    const addStudentToBranch = async (studentId) => {
      setLoading(true);
      setError(null);
      
      try {
        // Optimistic UI update
        const studentToAdd = availableStudents.find(s => s.id === studentId);
        
        if (studentToAdd) {
          // Add to selected students immediately
          setSelectedStudents(prev => [...prev, studentToAdd]);
          
          // Remove from available students immediately
          setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
          
          // Update selected branch with new student count
          setSelectedBranchForStudents(prev => ({
            ...prev,
            studentCount: (prev.studentCount || 0) + 1
          }));
          
          // Update branches list with the updated student count
          setBranches(prevBranches => 
            prevBranches.map(b => 
              b.id === selectedBranchForStudents.id 
                ? { ...b, studentCount: (b.studentCount || 0) + 1 }
                : b
            )
          );
        }
        
        // Make the actual API call
        const response = await API.post(`/api/branches/${selectedBranchForStudents.id}/students/${studentId}`);
        
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        
        // Update with server data
        setSelectedBranchForStudents(response.data);
        
        // Update students list if provided in response
        if (response.data.students && Array.isArray(response.data.students)) {
          setSelectedStudents(response.data.students);
        }
        
        // Refresh available students
        const availableResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/available-students`);
        if (availableResponse && availableResponse.data) {
          setAvailableStudents(availableResponse.data);
        }
        
        setMessage({
          text: 'Student added to branch successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error adding student to branch:', err);
        setError('Failed to add student: ' + (err.response?.data?.message || 'Unknown error'));
        
        // Revert optimistic updates on error
        try {
          // Refresh data from server
          const branchResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}`);
          setSelectedBranchForStudents(branchResponse.data);
          
          const studentsResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            setSelectedStudents(studentsResponse.data);
          }
          
          const availableResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/available-students`);
          if (availableResponse && availableResponse.data) {
            setAvailableStudents(availableResponse.data);
          }
        } catch (fetchErr) {
          console.error('Error refreshing data after failed add:', fetchErr);
        }
      } finally {
        setLoading(false);
      }
    };
  
    // Remove student from branch
    const removeStudentFromBranch = async (studentId) => {
      if (!window.confirm('Are you sure you want to remove this student from the branch?')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Optimistic UI update
        const studentToRemove = selectedStudents.find(s => s.id === studentId);
        
        if (studentToRemove) {
          // Remove from selected students immediately
          setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
          
          // Update selected branch with new student count
          setSelectedBranchForStudents(prev => ({
            ...prev,
            studentCount: Math.max((prev.studentCount || 0) - 1, 0)
          }));
          
          // Update branches list with the updated student count
          setBranches(prevBranches => 
            prevBranches.map(b => 
              b.id === selectedBranchForStudents.id 
                ? { ...b, studentCount: Math.max((b.studentCount || 0) - 1, 0) }
                : b
            )
          );
          
          // Add the removed student to the available students list
          setAvailableStudents(prev => [...prev, studentToRemove]);
        }
        
        // Make the actual API call
        const response = await API.delete(`/api/branches/${selectedBranchForStudents.id}/students/${studentId}`);
        
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        
        // Update with server data
        setSelectedBranchForStudents(response.data);
        
        // Update students list if provided in response
        if (response.data.students && Array.isArray(response.data.students)) {
          setSelectedStudents(response.data.students);
        }
        
        // Refresh available students
        const availableResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/available-students`);
        if (availableResponse && availableResponse.data) {
          setAvailableStudents(availableResponse.data);
        }
        
        setMessage({
          text: 'Student removed from branch successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error removing student from branch:', err);
        setError('Failed to remove student: ' + (err.response?.data?.message || 'Unknown error'));
        
        // Revert optimistic updates on error
        try {
          // Refresh data from server
          const branchResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}`);
          setSelectedBranchForStudents(branchResponse.data);
          
          const studentsResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            setSelectedStudents(studentsResponse.data);
          }
          
          const availableResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/available-students`);
          if (availableResponse && availableResponse.data) {
            setAvailableStudents(availableResponse.data);
          }
        } catch (fetchErr) {
          console.error('Error refreshing data after failed remove:', fetchErr);
        }
      } finally {
        setLoading(false);
      }
    };
  
    // Retry loading students function for branch
    const retryLoadBranchStudents = async () => {
      if (!selectedBranchForStudents) return;
      
      setLoading(true);
      setError(null);
      setRetryCount(prev => prev + 1);
      
      try {
        // Load branch students
        const studentsResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/students`, { 
          timeout: 10000 // Increased timeout for retry
        });
        
        if (studentsResponse && studentsResponse.data) {
          setSelectedStudents(studentsResponse.data);
        }
        
        // Load available students
        const availableResponse = await API.get(`/api/branches/${selectedBranchForStudents.id}/available-students`);
        if (availableResponse && availableResponse.data) {
          setAvailableStudents(availableResponse.data);
        }
        
        setMessage({
          text: 'Student data loaded successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error reloading student data:', err);
        setError('Failed to load student data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    // Toggle branch expansion
    const toggleBranchExpansion = (branchId) => {
      setExpandedBranches({
        ...expandedBranches,
        [branchId]: !expandedBranches[branchId]
      });
    };
  
    // Handle branch form change
    const handleBranchFormChange = (e) => {
      const { name, value } = e.target;
      setBranchFormData({
        ...branchFormData,
        [name]: value
      });
    };
    
    // Handle class group form change
    const handleFormChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
      
      // If this is a time-related change, reset the classroom selection
      if (name === 'startTime' || name === 'endTime') {
        setFormData({
          ...formData,
          [name]: value,
          classroomId: ''
        });
      }
    };
    
    // Handle meeting day checkbox change
    const handleMeetingDayChange = (day) => {
      const currentMeetingDays = [...formData.meetingDays];
      
      if (currentMeetingDays.includes(day)) {
        // Remove the day if already selected
        const updatedDays = currentMeetingDays.filter(d => d !== day);
        setFormData({
          ...formData,
          meetingDays: updatedDays
        });
      } else {
        // Add the day if not already selected
        setFormData({
          ...formData,
          meetingDays: [...currentMeetingDays, day]
        });
      }
    };
    
    // Handle timetable entry change with conflict checking
    const handleTimetableEntryChange = async (e) => {
      const { name, value } = e.target;
      const updatedEntry = {
        ...newTimetableEntry,
        [name]: value
      };
      
      // Clear alternative suggestions when entry changes
      setAlternativeSuggestions([]);
      
      setNewTimetableEntry(updatedEntry);
      
      // Validate time ranges when time inputs change
      if (name === 'startTime' || name === 'endTime') {
        const timeValidation = validateTimeRange(
          name === 'startTime' ? value : updatedEntry.startTime,
          name === 'endTime' ? value : updatedEntry.endTime
        );
        
        if (!timeValidation.valid && updatedEntry.startTime && updatedEntry.endTime) {
          setPotentialConflict({
            hasConflict: true,
            message: timeValidation.message,
            conflictType: ["TIME_FORMAT"]
          });
          return;
        }
      }
      
      // If we have enough data to check for conflicts
      if (updatedEntry.day && updatedEntry.startTime && updatedEntry.endTime && 
          updatedEntry.startTime !== updatedEntry.endTime) {
        
        // First validate the time format
        const timeValidation = validateTimeRange(updatedEntry.startTime, updatedEntry.endTime);
        if (!timeValidation.valid) {
          setPotentialConflict({
            hasConflict: true,
            message: timeValidation.message,
            conflictType: ["TIME_FORMAT"]
          });
          return;
        }
        
        // Show checking indicator
        setIsPotentialConflictChecking(true);
        
        // Debounce the conflict check to avoid too many API calls
        if (conflictCheckTimeout) {
          clearTimeout(conflictCheckTimeout);
        }
        
        setConflictCheckTimeout(setTimeout(async () => {
          const conflictResult = await checkForPotentialConflicts(updatedEntry);
          setPotentialConflict(conflictResult);
          setIsPotentialConflictChecking(false);
          
          // Log conflict result for debugging
          if (conflictResult && conflictResult.hasConflict) {
            console.log(`Conflict detected: ${conflictResult.message}`);
            console.log('Conflict types:', conflictResult.conflictType);
            console.log('Affected users:', conflictResult.affectedUsers);
          }
        }, 500));
      } else {
        // Clear potential conflict if we don't have enough data
        setPotentialConflict(null);
      }
    };
    
    // Select a branch
    const selectBranch = (branch) => {
      setSelectedBranch(branch);
    };
    
    // Select a class group
    const selectClassGroup = (classGroup) => {
      setSelectedClassGroup(classGroup);
      
      // Load timetable entries for this class group
      if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
        setTimetableEntries(classGroup.timetableEntries);
        console.log('Loaded timetable entries from class group:', classGroup.timetableEntries);
      } else {
        console.log('No timetable entries found in class group data');
        setTimetableEntries([]);
      }
    };
    
    // Open add branch modal
    const openAddBranchModal = () => {
      setBranchFormData({
        name: '',
        description: ''
      });
      setShowAddBranchModal(true);
    };
    
    // Open edit branch modal
    const openEditBranchModal = (branch) => {
      setBranchFormData({
        name: branch.name,
        description: branch.description || ''
      });
      setSelectedBranch(branch);
      setShowEditBranchModal(true);
    };
    
    // Open add class group modal
    const openAddModal = (branch = null) => {
      // Reset form and state variables
      setFormData({
        name: '',
        courseCode: '',
        description: '',
        academicYear: academicYears[1], // Default to current academic year
        semester: 'Summer', // Default to Summer as requested
        professorId: '',
        branchId: branch ? branch.id : '',
        classroomId: '',  // Reset classroomId
        meetingDays: [],  // Reset meeting days
        startTime: '',    // Reset start time
        endTime: '',      // Reset end time
        location: ''      // Reset location
      });
      
      if (branch) {
        setSelectedBranch(branch);
      }
      
      setShowAddModal(true);
    };
    
    // Open edit class group modal
    const openEditModal = (classGroup) => {
      setFormData({
        name: classGroup.name,
        courseCode: classGroup.courseCode,
        description: classGroup.description || '',
        academicYear: classGroup.academicYear,
        semester: classGroup.semester,
        professorId: classGroup.professorId || '',
        branchId: classGroup.branchId || '',
        classroomId: '',  // Will be set later if available
        meetingDays: [],  // Will be populated from timetable entries if available
        startTime: '',    // Will be populated from first timetable entry if available
        endTime: '',      // Will be populated from first timetable entry if available
        location: classGroup.location || ''  // Load location if available
      });
      
      // Extract meeting days, times, and location from timetable if available
      if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
        const meetingDays = [...new Set(classGroup.timetableEntries.map(entry => entry.day))];
        
        // Find the primary time slot (using the first entry)
        const firstEntry = classGroup.timetableEntries[0];
        const primaryStartTime = firstEntry.startTime;
        const primaryEndTime = firstEntry.endTime;
        
        // Set location from first entry if available
        const location = firstEntry.location || classGroup.location || '';
        
        // Update form data with extracted information
        setFormData(prev => ({
          ...prev,
          meetingDays,
          startTime: primaryStartTime,
          endTime: primaryEndTime,
          location
        }));
      }
      
      setSelectedClassGroup(classGroup);
      setShowEditModal(true);
    };
    
    // Open timetable modal with enhanced timetable loading
    const openTimetableModal = async (classGroup) => {
      setLoading(true);
      
      try {
        // Load all classrooms for the dropdown
        await fetchAllClassrooms();
        
        // Reset classroom search states
        setClassroomSearchDate('');
        setClassroomSearchStartTime('');
        setClassroomSearchEndTime('');
        
        // Try to get the most up-to-date class group data from the API
        const response = await API.get(`/api/class-groups/${classGroup.id}`);
        let updatedClassGroup = response.data;
        
        // If API doesn't return timetable entries or they're empty, try to get them from our state
        if (!updatedClassGroup.timetableEntries || updatedClassGroup.timetableEntries.length === 0) {
          const existingClassGroup = classGroups.find(cg => cg.id === classGroup.id);
          
          if (existingClassGroup && existingClassGroup.timetableEntries && existingClassGroup.timetableEntries.length > 0) {
            console.log('Using timetable entries from state:', existingClassGroup.timetableEntries);
            updatedClassGroup.timetableEntries = existingClassGroup.timetableEntries;
          } else if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
            console.log('Using timetable entries from passed class group:', classGroup.timetableEntries);
            updatedClassGroup.timetableEntries = classGroup.timetableEntries;
          }
        } else {
          console.log('Using timetable entries from API response:', updatedClassGroup.timetableEntries);
        }
        
        // Set the selected class group
        setSelectedClassGroup(updatedClassGroup);
        
        // Set timetable entries explicitly
        if (updatedClassGroup.timetableEntries && updatedClassGroup.timetableEntries.length > 0) {
          setTimetableEntries(updatedClassGroup.timetableEntries);
        } else {
          console.warn('No timetable entries found for class group');
          setTimetableEntries([]);
        }
        
        // Reset timetable entry form and potential conflicts
        setNewTimetableEntry({
          day: 'Monday',
          name: '',
          instructor: '',
          location: '',
          startTime: '',
          endTime: '',
          color: '#6366f1',
          type: 'Lecture'
        });
        setPotentialConflict(null);
        setAlternativeSuggestions([]);
        
        // Show the modal
        setShowTimetableModal(true);
      } catch (err) {
        console.error('Error opening timetable modal:', err);
        setError('Failed to load class group timetable. Please try again.');
        
        // Fallback to using the provided class group
        setSelectedClassGroup(classGroup);
        if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
          setTimetableEntries(classGroup.timetableEntries);
        } else {
          setTimetableEntries([]);
        }
        
        // Still show the modal even if there was an error
        setShowTimetableModal(true);
      } finally {
        setLoading(false);
      }
    };
    
    // Populate classroom search from timetable entry
    const populateSearchFromTimetableEntry = () => {
      if (newTimetableEntry.startTime && newTimetableEntry.endTime) {
        // Get today's date for the search
        const today = new Date().toISOString().split('T')[0];
        
        setClassroomSearchDate(today);
        setClassroomSearchStartTime(newTimetableEntry.startTime);
        setClassroomSearchEndTime(newTimetableEntry.endTime);
      }
    };
    
    // Add a branch
    const addBranch = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        const response = await API.post('/api/branches', branchFormData);
        
        // Add to state
        const newBranch = response.data;
        setBranches([...branches, newBranch]);
        
        // Set expansion state for the new branch
        setExpandedBranches({
          ...expandedBranches,
          [newBranch.id]: false
        });
        
        // Close modal and reset form
        setShowAddBranchModal(false);
        setBranchFormData({
          name: '',
          description: ''
        });
        
        setMessage({
          text: 'Branch created successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error creating branch:', err);
        setError('Failed to create branch: ' + (err.response?.data?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    // Update a branch
    const updateBranch = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        const response = await API.put(`/api/branches/${selectedBranch.id}`, branchFormData);
        
        // Update in state
        setBranches(branches.map(b => 
          b.id === selectedBranch.id ? response.data : b
        ));
        
        // Close modal and reset form
        setShowEditBranchModal(false);
        
        setMessage({
          text: 'Branch updated successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error updating branch:', err);
        setError('Failed to update branch: ' + (err.response?.data?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    // Delete a branch
    const deleteBranch = async (id) => {
      if (!window.confirm('Are you sure you want to delete this branch? This will not delete the class groups inside it.')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        await API.delete(`/api/branches/${id}`);
        
        // Remove from state
        setBranches(branches.filter(b => b.id !== id));
        
        // Update class groups to remove branch reference
        await fetchClassGroups();
        
        setMessage({
          text: 'Branch deleted successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError('Failed to delete branch: ' + (err.response?.data?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    // Add a class group
    const addClassGroup = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        // Validate that a classroom is selected if startTime and endTime are provided
        if (formData.startTime && formData.endTime && !formData.location) {
          setError('Please select a classroom for the scheduled class time.');
          setLoading(false);
          return;
        }
        
        // Validate time format if provided
        if (formData.startTime && formData.endTime) {
          const timeValidation = validateTimeRange(formData.startTime, formData.endTime);
          if (!timeValidation.valid) {
            setError(timeValidation.message);
            setLoading(false);
            return;
          }
        }
        
        // Create timetable entries from meeting days and times if provided
        const timetableEntries = [];
        if (formData.meetingDays.length > 0 && formData.startTime && formData.endTime) {
          formData.meetingDays.forEach(day => {
            timetableEntries.push({
              day,
              name: formData.courseCode + ' Class',
              instructor: '', // Will be filled with professor name later
              location: formData.location,
              startTime: formData.startTime,
              endTime: formData.endTime,
              color: '#6366f1',
              type: 'Lecture'
            });
          });
        }
        
        // Prepare payload
        const payload = {
          ...formData,
          timetableEntries
        };
        
        const response = await API.post('/api/class-groups', payload);
        
        // Add to state
        setClassGroups([...classGroups, response.data]);
        
        // Close modal and reset form
        setShowAddModal(false);
        setFormData({
          name: '',
          courseCode: '',
          description: '',
          academicYear: '',
          semester: '',
          professorId: '',
          branchId: '',
          classroomId: '',
          meetingDays: [],
          startTime: '',
          endTime: '',
          location: ''
        });
        
        // Refresh branches to update the class group lists
        if (formData.branchId) {
          await fetchBranches();
        }
        
        setMessage({
          text: 'Class group created successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error creating class group:', err);
        setError('Failed to create class group: ' + (err.response?.data?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    // Update a class group
    const updateClassGroup = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        // Validate that a classroom is selected if startTime and endTime are provided
        if (formData.startTime && formData.endTime && !formData.location) {
          setError('Please select a classroom for the scheduled class time.');
          setLoading(false);
          return;
        }
        
        // Validate time format if provided
        if (formData.startTime && formData.endTime) {
          const timeValidation = validateTimeRange(formData.startTime, formData.endTime);
          if (!timeValidation.valid) {
            setError(timeValidation.message);
            setLoading(false);
            return;
          }
        }
        
        // Update timetable entries based on meeting days and times if provided
        let updatedTimetableEntries = [...timetableEntries];
        
        // If new meeting schedule information is provided, update timetable entries
        if (formData.meetingDays.length > 0 && formData.startTime && formData.endTime) {
          // Keep entries that are not for regular class meetings (e.g., exams, special sessions)
          const specialEntries = timetableEntries.filter(entry => 
            entry.type !== 'Lecture' || !entry.name.includes(formData.courseCode)
          );
          
          // Create new entries for the regular class meetings
          const newRegularEntries = formData.meetingDays.map(day => ({
            day,
            name: formData.courseCode + ' Class',
            instructor: '', // Will be filled with professor name
            location: formData.location,
            startTime: formData.startTime,
            endTime: formData.endTime,
            color: '#6366f1',
            type: 'Lecture'
          }));
          
          // Combine special entries with new regular entries
          updatedTimetableEntries = [...specialEntries, ...newRegularEntries];
        }
        
        // Prepare payload
        const payload = {
          ...formData,
          timetableEntries: updatedTimetableEntries
        };
        
        const response = await API.put(`/api/class-groups/${selectedClassGroup.id}`, payload);
        
        // Update in state
        setClassGroups(classGroups.map(cg => 
          cg.id === selectedClassGroup.id ? response.data : cg
        ));
        
        // Close modal and reset form
        setShowEditModal(false);
        
        // Refresh branches to update the class group lists
        await fetchBranches();
        
        setMessage({
          text: 'Class group updated successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error updating class group:', err);
        setError('Failed to update class group: ' + (err.response?.data?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    // Delete a class group
    const deleteClassGroup = async (id) => {
      if (!window.confirm('Are you sure you want to delete this class group?')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      try {
        await API.delete(`/api/class-groups/${id}`);
        
        // Remove from state
        setClassGroups(classGroups.filter(cg => cg.id !== id));
        
        // Refresh branches to update the class group lists
        await fetchBranches();
        
        setMessage({
          text: 'Class group deleted successfully',
          type: 'success'
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Add timetable entry
    const addTimetableEntry = () => {
      // Validate form
      if (!newTimetableEntry.name || !newTimetableEntry.startTime || !newTimetableEntry.endTime || !newTimetableEntry.location) {
        setError('Please fill in all required fields for the timetable entry, including a location.');
        return;
      }
      
      // Validate time format
      const timeValidation = validateTimeRange(newTimetableEntry.startTime, newTimetableEntry.endTime);
      if (!timeValidation.valid) {
        setError(timeValidation.message);
        return;
      }
      
      // Don't add if there's a conflict
      if (potentialConflict && potentialConflict.hasConflict) {
        setError('Please resolve the time conflict before adding this entry');
        return;
      }
      
      // Add entry to list
      setTimetableEntries([...timetableEntries, { ...newTimetableEntry }]);
      
      // Clear form
      setNewTimetableEntry({
        day: 'Monday',
        name: '',
        instructor: '',
        location: '',
        startTime: '',
        endTime: '',
        color: '#6366f1',
        type: 'Lecture'
      });
      
      // Clear conflict check state
      setPotentialConflict(null);
      setAlternativeSuggestions([]);
    };
    
    // Component to show current time usage with conflict highlighting
    const TimetableVisualization = ({ classGroup, timetableEntries, currentTimeSlot }) => {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // Time slots - only include whole hours between 8 AM and 6 PM
const timeSlots = [];
for (let hour = 8; hour < 18; hour++) {
  // Only add whole hours
  const formattedHour = hour.toString().padStart(2, '0');
  timeSlots.push(`${formattedHour}:00`);
}
      
      // Organize timetable entries by day
      const entriesByDay = {};
      daysOfWeek.forEach(day => {
        entriesByDay[day] = [];
      });
      
      if (timetableEntries && timetableEntries.length > 0) {
        timetableEntries.forEach(entry => {
          if (entriesByDay[entry.day]) {
            entriesByDay[entry.day].push(entry);
          }
        });
      }
      
      // Helper function to check if a time slot has a conflict with the current time slot
      const hasConflict = (entry) => {
        if (!currentTimeSlot || !currentTimeSlot.day || !currentTimeSlot.startTime || !currentTimeSlot.endTime) {
          return false;
        }
        
        if (entry.day !== currentTimeSlot.day) {
          return false;
        }
        
        const entryStart = convertTimeToMinutes(entry.startTime);
        const entryEnd = convertTimeToMinutes(entry.endTime);
        const currentStart = convertTimeToMinutes(currentTimeSlot.startTime);
        const currentEnd = convertTimeToMinutes(currentTimeSlot.endTime);
        
        return !(entryEnd <= currentStart || currentEnd <= entryStart);
      };
      
      // Helper function to calculate position and height based on time
      const getEntryStyle = (entry) => {
        const startParts = entry.startTime.split(':');
        const endParts = entry.endTime.split(':');
        
        const startHour = parseInt(startParts[0]);
        const startMinute = parseInt(startParts[1]);
        const endHour = parseInt(endParts[0]);
        const endMinute = parseInt(endParts[1]);
        
        const startPosition = (startHour - 8) * 60 + startMinute;
        const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
        
        const isInConflict = hasConflict(entry);
        
        const baseStyle = {
          top: `${startPosition / 10}px`,
          height: `${duration / 10}px`,
          backgroundColor: entry.color || '#6366f1',
        };
        
        // Add visual indicators for conflicts
        if (isInConflict) {
          return {
            ...baseStyle,
            boxShadow: '0 0 0 2px #f56565, 0 0 8px rgba(239, 68, 68, 0.5)',
            animation: 'pulse-conflict 2s infinite'
          };
        }
        
        return baseStyle;
      };
      
      return (
        <div className="timetable-visualization">
          <div className="timetable-header">
            <div className="time-column">
              <div className="time-header">Time</div>
              {timeSlots.map(time => (
                <div key={time} className="time-slot">{time}</div>
              ))}
            </div>
            
            {daysOfWeek.map(day => (
              <div key={day} className="day-column">
                <div className="day-header">{day}</div>
                <div className="day-content">
                  {entriesByDay[day].map((entry, index) => (
                    <div
                      key={index}
                      className={`timetable-entry ${hasConflict(entry) ? 'has-conflict' : ''}`}
                      style={getEntryStyle(entry)}
                    >
                      {hasConflict(entry) && (
                        <div className="conflict-indicator">
                          <i className="fas fa-exclamation"></i>
                        </div>
                      )}
                      <div className="entry-content">
                        <div className="entry-name">{entry.name}</div>
                        <div className="entry-time">
                          {entry.startTime} - {entry.endTime}
                        </div>
                        {entry.location && (
                          <div className="entry-location">{entry.location}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Remove timetable entry
    const removeTimetableEntry = (index) => {
      setTimetableEntries(timetableEntries.filter((_, i) => i !== index));
    };
    
    // Format conflict errors for better display
    const formatTimetableConflictError = (errorMessage) => {
      console.log('Formatting error message:', errorMessage);
      
      // Check if the message contains our specific conflict indicators
      if (errorMessage.includes('CLASSROOM CONFLICT') ||
          errorMessage.includes('PROFESSOR CONFLICT') ||
          errorMessage.includes('STUDENT CONFLICT')) {
        
        // Format the HTML for the error message
        return (
          <div className="timetable-conflicts">
            <p><strong>Cannot save timetable due to scheduling conflicts:</strong></p>
            <ul>
              {errorMessage.split('\n').filter(line => line.trim().length > 0).map((line, index) => {
                // Apply specific formatting based on conflict type
                let className = '';
                if (line.includes('CLASSROOM CONFLICT')) className = 'classroom-conflict-text';
                if (line.includes('PROFESSOR CONFLICT')) className = 'professor-conflict-text';
                if (line.includes('STUDENT CONFLICT')) className = 'student-conflict-text';
                
                return (
                  <li key={index} className={className}>
                    {line.replace('CLASSROOM CONFLICT: ', '')
                         .replace('PROFESSOR CONFLICT: ', '')
                         .replace('STUDENT CONFLICT: ', '')}
                  </li>
                );
              })}
            </ul>
            <p>Please adjust the timetable to resolve these conflicts.</p>
          </div>
        );
      }
      
      // Check for time validation error messages
      if (errorMessage.includes('Start time must be on the hour') ||
          errorMessage.includes('End time must be on the hour') ||
          errorMessage.includes('Class duration must be exactly')) {
        
        return (
          <div className="timetable-conflicts">
            <p><strong>Time validation error:</strong></p>
            <ul>
              <li className="time-format-conflict">{errorMessage}</li>
            </ul>
            <p>Please adjust the timetable to follow the time format rules:</p>
            <ul>
              <li>Times must be on whole hours (e.g., 9:00, 10:00)</li>
              <li>Class duration must be exactly 1 or 2 hours</li>
            </ul>
          </div>
        );
      }
      
      // If it's not in the expected format, use the old formatter
      const conflictPrefix = 'Timetable conflicts detected: ';
      
      if (errorMessage.startsWith(conflictPrefix)) {
        // Extract the conflict details
        const conflictDetails = errorMessage.substring(conflictPrefix.length);
        
        // Format the HTML for the error message
        return (
          <div className="timetable-conflicts">
            <p><strong>Cannot save timetable due to scheduling conflicts:</strong></p>
            <ul>
              {conflictDetails.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
                <li key={index}>{line.startsWith('- ') ? line.substring(2) : line}</li>
              ))}
            </ul>
            <p>Please adjust the timetable to resolve these conflicts.</p>
          </div>
        );
      }
      
      // If it's not in any expected format, return the original message
      return errorMessage;
    };
  
    // Save timetable changes with improved error handling and logging
    const saveTimetable = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Saving timetable entries:", timetableEntries);
        
        // Check if all entries follow the time validation rules
        for (const entry of timetableEntries) {
          const timeValidation = validateTimeRange(entry.startTime, entry.endTime);
          if (!timeValidation.valid) {
            throw new Error(timeValidation.message);
          }
        }
        
        const response = await API.put(
          `/api/class-groups/${selectedClassGroup.id}/timetable`, 
          timetableEntries
        );
        
        // Get the updated class group from the response
        const updatedClassGroup = response.data;
        
        // Make sure the timetable entries are preserved
        if (!updatedClassGroup.timetableEntries || updatedClassGroup.timetableEntries.length === 0) {
          // If API response doesn't include timetable entries, add them from our current state
          updatedClassGroup.timetableEntries = [...timetableEntries];
        }
        
        // Update the class group in the classGroups state with preserved timetable entries
        setClassGroups(classGroups.map(cg => 
          cg.id === selectedClassGroup.id ? {
            ...updatedClassGroup,
            timetableEntries: updatedClassGroup.timetableEntries || timetableEntries
          } : cg
        ));
        
        // Update selected class group with the updated data including timetable entries
        setSelectedClassGroup({
          ...updatedClassGroup,
          timetableEntries: updatedClassGroup.timetableEntries || timetableEntries
        });
        
        // Ensure branches are updated with the latest class group data
        fetchBranches();
        
        // Close modal after successful update
        setShowTimetableModal(false);
        
        setMessage({
          text: 'Class timetable updated successfully',
          type: 'success'
        });
        
        console.log('Timetable saved successfully. Entries:', timetableEntries);
      } catch (err) {
        console.error('Error updating timetable:', err);
        console.log('Error response:', err.response?.data);
        
        // Extract the error message and format it for better display
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update timetable';
        
        // Format and set the error message
        setError(formatTimetableConflictError(errorMessage));
      } finally {
        setLoading(false);
      }
    };
  
    // Show loading state
    if (loading && branches.length === 0 && classGroups.length === 0) {
      return (
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="main-content">
        <div className="section">
          <div className="section-header">
            <h2>Branches and Class Groups Management</h2>
            <button 
              className="btn-primary"
              onClick={openAddBranchModal}
              disabled={loading}
              >
              <i className="fas fa-plus"></i> Create New Branch
            </button>
          </div>
          
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}
          
          {error && !showBranchStudentsModal && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {/* Branches and Classes Structure */}
          <div className="branches-container">
            {branches.length === 0 ? (
              <div className="no-data-message">
                <p>No branches found. Create a branch to organize your class groups.</p>
              </div>
            ) : (
              branches.map(branch => (
                <div key={branch.id} className="branch-card">
                  <div 
                    className="branch-header collapsible"
                    onClick={() => toggleBranchExpansion(branch.id)}
                  >
                    <div className="branch-header-content">
                      <i className={`fas fa-chevron-${expandedBranches[branch.id] ? 'down' : 'right'} mr-2`}></i>
                      <h3>{branch.name}</h3>
                      <span className="branch-class-count">
                        ({branch.classGroups ? branch.classGroups.length : 0} classes, {branch.studentCount || 0} students)
                      </span>
                    </div>
                    <div className="branch-actions">
                      <button 
                        className="btn-table btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditBranchModal(branch);
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-table btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBranch(branch.id);
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button 
                        className="btn-table btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBranchStudentsModal(branch);
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-users"></i> Manage Students
                      </button>
                      <button 
                        className="btn-table btn-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddModal(branch);
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-plus"></i> Add Class
                      </button>
                    </div>
                  </div>
                  <p className="branch-description">{branch.description || 'No description provided.'}</p>
                  
                  {expandedBranches[branch.id] && (
                    <div className="branch-classes">
                      {branch.classGroups && branch.classGroups.length > 0 ? (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Course Code</th>
                              <th>Name</th>
                              <th>Semester</th>
                              <th>Professor</th>
                              <th>Location</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {branch.classGroups.map(classGroup => (
                              <tr key={classGroup.id}>
                                <td>{classGroup.courseCode}</td>
                                <td>{classGroup.name}</td>
                                <td>{classGroup.semester} {classGroup.academicYear}</td>
                                <td>{classGroup.professorName || 'Not assigned'}</td>
                                <td>{classGroup.location || 'Not assigned'}</td>
                                <td>
                                  <div className="table-actions">
                                    <button 
                                      className="btn-table btn-view"
                                      onClick={() => selectClassGroup(classGroup)}
                                      disabled={loading}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn-table btn-edit"
                                      onClick={() => openEditModal(classGroup)}
                                      disabled={loading}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      className="btn-table btn-view"
                                      onClick={() => openTimetableModal(classGroup)}
                                      disabled={loading}
                                    >
                                      <i className="fas fa-calendar"></i>
                                    </button>
                                    <button 
                                      className="btn-table btn-delete"
                                      onClick={() => deleteClassGroup(classGroup.id)}
                                      disabled={loading}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-classes-message">No class groups in this branch. Add a class group to get started.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Add Branch Modal */}
        {showAddBranchModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Branch</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowAddBranchModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
                <form onSubmit={addBranch}>
                  <div className="form-group">
                    <label htmlFor="name">Branch Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={branchFormData.name}
                      onChange={handleBranchFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                      id="description" 
                      name="description"
                      value={branchFormData.description}
                      onChange={handleBranchFormChange}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Branch'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Branch Modal */}
        {showEditBranchModal && selectedBranch && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Branch</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowEditBranchModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
                <form onSubmit={updateBranch}>
                  <div className="form-group">
                    <label htmlFor="name">Branch Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={branchFormData.name}
                      onChange={handleBranchFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                      id="description" 
                      name="description"
                      value={branchFormData.description}
                      onChange={handleBranchFormChange}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Branch'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Class Group Modal */}
        {showAddModal && (
          <div className="modal">
            <div className="modal-content modal-lg">
              <div className="modal-header">
                <h2>Create New Class Group{selectedBranch ? ` in ${selectedBranch.name}` : ''}</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowAddModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
                <form onSubmit={addClassGroup}>
                  <div className="form-group">
                    <label htmlFor="courseCode">Course Code *</label>
                    <input 
                      type="text" 
                      id="courseCode" 
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="name">Class Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="academicYear">Academic Year *</label>
                      <select 
                        id="academicYear" 
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleFormChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="semester">Semester *</label>
                      <select 
                        id="semester" 
                        name="semester"
                        value={formData.semester}
                        onChange={handleFormChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(semester => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="professorId">Professor</label>
                    <select 
                      id="professorId" 
                      name="professorId"
                      value={formData.professorId}
                      onChange={handleFormChange}
                      disabled={loading}
                    >
                      <option value="">Select Professor</option>
                      {professors.map(professor => (
                        <option key={professor.id} value={professor.id}>
                          {professor.firstName} {professor.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {!selectedBranch && (
                    <div className="form-group">
                      <label htmlFor="branchId">Branch</label>
                      <select 
                        id="branchId" 
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleFormChange}
                        disabled={loading}
                      >
                        <option value="">Unassigned</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Class Group'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Class Group Modal */}
        {showEditModal && selectedClassGroup && (
          <div className="modal">
            <div className="modal-content modal-lg">
              <div className="modal-header">
                <h2>Edit Class Group</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowEditModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
                <form onSubmit={updateClassGroup}>
                  <div className="form-group">
                    <label htmlFor="courseCode">Course Code *</label>
                    <input 
                      type="text" 
                      id="courseCode" 
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="name">Class Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="academicYear">Academic Year *</label>
                      <select 
                        id="academicYear" 
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleFormChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="semester">Semester *</label>
                      <select 
                        id="semester" 
                        name="semester"
                        value={formData.semester}
                        onChange={handleFormChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(semester => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="professorId">Professor</label>
                    <select 
                      id="professorId" 
                      name="professorId"
                      value={formData.professorId}
                      onChange={handleFormChange}
                      disabled={loading}
                    >
                      <option value="">Select Professor</option>
                      {professors.map(professor => (
                        <option key={professor.id} value={professor.id}>
                          {professor.firstName} {professor.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="branchId">Branch</label>
                    <select 
                      id="branchId" 
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleFormChange}
                      disabled={loading}
                    >
                      <option value="">Unassigned</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Class Group'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Branch Students Modal */}
        {showBranchStudentsModal && selectedBranchForStudents && (
          <div className="modal">
            <div className="modal-content modal-lg">
              <div className="modal-header">
                <h2>Manage Students - {selectedBranchForStudents.name} Branch</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowBranchStudentsModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
                {/* Show error with retry button */}
                {error && (
                  <div className="alert alert-error">
                    <span>{error}</span>
                    <button 
                      className="btn-retry"
                      onClick={retryLoadBranchStudents}
                      disabled={loading}
                    >
                      <i className="fas fa-sync-alt"></i> Retry
                    </button>
                  </div>
                )}
                
                <div className="student-management-container">
                  <div className="student-list-section">
                    <h3>Current Students ({selectedStudents.length})</h3>
                    {loading ? (
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading students...</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudents.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center">
                                {error ? 'Could not load students' : 'No students in this branch yet'}
                              </td>
                            </tr>
                          ) : (
                            selectedStudents.map(student => (
                              <tr key={student.id}>
                                <td>{student.id}</td>
                                <td>{student.firstName} {student.lastName}</td>
                                <td>{student.email}</td>
                                <td>
                                  <button 
                                    className="btn-table btn-delete"
                                    onClick={() => removeStudentFromBranch(student.id)}
                                    disabled={loading}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div className="available-students-section">
                    <h3>Available Students ({availableStudents.length})</h3>
                    {loading ? (
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading available students...</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableStudents.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center">
                                {error ? 'Could not load available students' : 'No more students available to add'}
                              </td>
                            </tr>
                          ) : (
                            availableStudents.map(student => (
                              <tr key={student.id}>
                                <td>{student.id}</td>
                                <td>{student.firstName} {student.lastName}</td>
                                <td>{student.email}</td>
                                <td>
                                  <button 
                                    className="btn-table btn-edit"
                                    onClick={() => addStudentToBranch(student.id)}
                                    disabled={loading}
                                  >
                                    Add to Branch
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
                
                <div className="branch-note">
                  <h4>Important Note</h4>
                  <p>
                    <strong>Note:</strong> Students can only be assigned to one branch at a time. 
                    If a student is already in another branch, they won't appear in the available students list.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowBranchStudentsModal(false)}
                  disabled={loading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Manage Timetable Modal */}
        {showTimetableModal && selectedClassGroup && (
          <div className="modal">
            <div className="modal-content modal-lg">
              <div className="modal-header">
                <h2>Manage Class Timetable - {selectedClassGroup.courseCode}: {selectedClassGroup.name}</h2>
                <span 
                  className="close-modal"
                  onClick={() => !loading && setShowTimetableModal(false)}
                >
                  &times;
                </span>
              </div>
              <div className="modal-body">
               
  
                <div className="timetable-section">
                  <h3>Add Timetable Entry</h3>
                  
                  <div className="timetable-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="day">Day</label>
                        <select
                          id="day"
                          name="day"
                          value={newTimetableEntry.day}
                          onChange={handleTimetableEntryChange}
                          disabled={loading}
                        >
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="type">Type</label>
                        <select
                          id="type"
                          name="type"
                          value={newTimetableEntry.type}
                          onChange={handleTimetableEntryChange}
                          disabled={loading}
                        >
                          {classTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="color">Color</label>
                        <select
                          id="color"
                          name="color"
                          value={newTimetableEntry.color}
                          onChange={handleTimetableEntryChange}
                          disabled={loading}
                          style={{ backgroundColor: newTimetableEntry.color, color: '#fff' }}
                        >
                          {availableColors.map(color => (
                            <option 
                              key={color.value} 
                              value={color.value}
                              style={{ backgroundColor: color.value, color: '#fff' }}
                            >
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="name">Activity Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="e.g. Introduction to Programming"
                        value={newTimetableEntry.name}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="instructor">Instructor</label>
                        <input
                         type="text"
                         id="instructor"
                         name="instructor"
                         placeholder="e.g. Professor Johnson"
                         value={newTimetableEntry.instructor}
                         onChange={handleTimetableEntryChange}
                         disabled={loading}
                       />
                     </div>
                     <div className="form-group">
                       <label htmlFor="location">Location *</label>
                       {isLoadingClassrooms ? (
                         <div className="select-loading">
                           <i className="fas fa-spinner fa-spin"></i> Loading classrooms...
                         </div>
                       ) : (
                         <select
                           id="location"
                           name="location"
                           value={newTimetableEntry.location}
                           onChange={handleTimetableEntryChange}
                           disabled={loading}
                           required
                         >
                           <option value="">Select a classroom</option>
                           {availableClassrooms.map(classroom => (
                             <option key={classroom.id} value={classroom.roomNumber}>
                               {classroom.roomNumber} - {classroom.type} (Capacity: {classroom.capacity})
                             </option>
                           ))}
                         </select>
                       )}
                     </div>
                   </div>
                   
                   <div className="form-row">
                     <div className="form-group">
                       <label htmlFor="startTime">Start Time *</label>
                       <input
                         type="time"
                         id="startTime"
                         name="startTime"
                         className="whole-hour-only"
                         value={newTimetableEntry.startTime}
                         onChange={handleTimetableEntryChange}
                         disabled={loading}
                         required
                         step="3600" // Only allow whole hours
                       />
                      <div className="time-input-helper">
  <i className="fas fa-info-circle"></i> Must be on the hour between 8:00 AM and 5:00 PM
</div>
                     </div>
                     <div className="form-group">
                       <label htmlFor="endTime">End Time *</label>
                       <input
                         type="time"
                         id="endTime"
                         name="endTime"
                         className="whole-hour-only"
                         value={newTimetableEntry.endTime}
                         onChange={handleTimetableEntryChange}
                         disabled={loading}
                         required
                         step="3600" // Only allow whole hours
                       />
                       <div className="time-input-helper">
  <i className="fas fa-info-circle"></i> Must be between 9:00 AM and 6:00 PM (1-2 hours after start time)
</div>
                     </div>
                   </div>
                   
                   {/* Show conflict checking status or warnings */}
                   {isPotentialConflictChecking && (
                     <div className="checking-conflicts">
                       <i className="fas fa-sync fa-spin"></i> Checking for scheduling conflicts...
                     </div>
                   )}
                   
                   {/* Show conflict warning if detected */}
                   <ConflictWarning conflict={potentialConflict} />
                   
                   {/* Show alternative time suggestions */}
                   <AlternativeSuggestions 
                     alternatives={alternativeSuggestions} 
                     onSelectAlternative={applyAlternativeSuggestion} 
                   />
                   
                   <button 
                     type="button" 
                     className="btn-secondary"
                     onClick={addTimetableEntry}
                     disabled={loading || (potentialConflict && potentialConflict.hasConflict) || !newTimetableEntry.location}
                   >
                     <i className="fas fa-plus"></i> Add Timetable Entry
                   </button>
                   
                   {potentialConflict && potentialConflict.hasConflict && (
                     <div className="conflict-button-info">
                       <i className="fas fa-info-circle"></i> Please adjust the time or select an alternative to resolve conflicts before adding
                     </div>
                   )}
                   
                   {!newTimetableEntry.location && (
                     <div className="conflict-button-info">
                       <i className="fas fa-info-circle"></i> Please select a location for this class entry
                     </div>
                   )}
                 </div>
                 
                 <h3>Current Timetable</h3>
                 {timetableEntries.length === 0 ? (
                   <p>No timetable entries yet</p>
                 ) : (
                   <div>
                     <table className="data-table">
                       <thead>
                         <tr>
                           <th>Day</th>
                           <th>Time</th>
                           <th>Activity</th>
                           <th>Type</th>
                           <th>Location</th>
                           <th>Instructor</th>
                           <th>Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {timetableEntries.map((entry, index) => (
                           <tr key={index} style={{ borderLeft: `4px solid ${entry.color}` }}>
                             <td>{entry.day}</td>
                             <td>{entry.startTime} - {entry.endTime}</td>
                             <td>{entry.name}</td>
                             <td>{entry.type}</td>
                             <td>{entry.location || 'N/A'}</td>
                             <td>{entry.instructor || 'N/A'}</td>
                             <td>
                               <button 
                                 className="btn-table btn-delete"
                                 onClick={() => removeTimetableEntry(index)}
                                 disabled={loading}
                               >
                                 <i className="fas fa-trash"></i>
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
             </div>
             <div className="modal-footer">
               <button
                 className="btn-secondary"
                 onClick={() => setShowTimetableModal(false)}
                 disabled={loading}
               >
                 Cancel
               </button>
               <button
                 className="btn-primary"
                 onClick={saveTimetable}
                 disabled={loading}
               >
                 {loading ? 'Saving...' : 'Save Timetable'}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
  };
  
  export default ClassGroupManagement;