import { generateId } from '../utils/helpers';

/**
 * Reservation Service
 * 
 * In a real application, these functions would call an API.
 * For this demo, we're using localStorage.
 */

// Initialize reservations if not exists
const initializeReservations = () => {
  // Professor reservations
  const storedProfessorReservations = localStorage.getItem('professorReservations');
  if (!storedProfessorReservations) {
    const defaultProfessorReservations = [
      {
        id: 'PR1001',
        classroom: 'Room 101',
        date: '2025-03-25',
        time: '10:00 - 12:00',
        purpose: 'Physics 101 Lecture',
        status: 'Approved',
        userId: 'professor@example.com',
        userRole: 'professor'
      },
      {
        id: 'PR1002',
        classroom: 'Lab 305',
        date: '2025-03-27',
        time: '09:00 - 11:00',
        purpose: 'Chemistry Lab Session',
        status: 'Approved',
        userId: 'professor@example.com',
        userRole: 'professor'
      },
      {
        id: 'PR1003',
        classroom: 'Room 201',
        date: '2025-03-29',
        time: '14:00 - 16:00',
        purpose: 'Office Hours',
        status: 'Pending',
        userId: 'professor@example.com',
        userRole: 'professor'
      }
    ];
    
    localStorage.setItem('professorReservations', JSON.stringify(defaultProfessorReservations));
  }
  
  // Student reservations
  const storedStudentReservations = localStorage.getItem('studentReservations');
  if (!storedStudentReservations) {
    const defaultStudentReservations = [
      {
        id: 'SR2001',
        room: 'Study Room 202',
        date: '2025-03-26',
        time: '14:00 - 16:00',
        purpose: 'Group Study',
        status: 'Pending',
        userId: 'student@example.com',
        userRole: 'student'
      },
      {
        id: 'SR2002',
        room: 'Computer Lab 105',
        date: '2025-03-28',
        time: '10:00 - 12:00',
        purpose: 'Project Work',
        status: 'Approved',
        userId: 'student@example.com',
        userRole: 'student'
      }
    ];
    
    localStorage.setItem('studentReservations', JSON.stringify(defaultStudentReservations));
  }
  
  // Available classrooms
  const storedClassrooms = localStorage.getItem('availableClassrooms');
  if (!storedClassrooms) {
    const defaultClassrooms = [
      {
        id: 'C001',
        roomNumber: 'Room 101',
        type: 'Lecture Hall',
        capacity: 120,
        features: ['Projector', 'Whiteboard', 'Audio System']
      },
      {
        id: 'C002',
        roomNumber: 'Room 203',
        type: 'Classroom',
        capacity: 40,
        features: ['Projector', 'Whiteboard']
      },
      {
        id: 'C003',
        roomNumber: 'Lab 305',
        type: 'Computer Lab',
        capacity: 30,
        features: ['Computers', 'Projector', 'Whiteboard']
      }
    ];
    
    localStorage.setItem('availableClassrooms', JSON.stringify(defaultClassrooms));
  }
  
  // Available study rooms
  const storedStudyRooms = localStorage.getItem('studyRooms');
  if (!storedStudyRooms) {
    const defaultStudyRooms = [
      {
        id: 'SR101',
        name: 'Study Room 101',
        type: 'study',
        capacity: 6,
        features: ['Whiteboard', 'Wi-Fi'],
        availableTimes: '8AM - 9PM',
        image: '/images/study-room.jpg'
      },
      {
        id: 'CL105',
        name: 'Computer Lab 105',
        type: 'computer',
        capacity: 25,
        features: ['Computers', 'Projector'],
        availableTimes: '10AM - 6PM',
        image: '/images/computer-lab.jpg'
      },
      {
        id: 'CR203',
        name: 'Classroom 203',
        type: 'classroom',
        capacity: 40,
        features: ['Projector', 'Audio System'],
        availableTimes: '5PM - 10PM',
        image: '/images/classroom.jpg'
      }
    ];
    
    localStorage.setItem('studyRooms', JSON.stringify(defaultStudyRooms));
  }
};

// Initialize data
initializeReservations();

/**
 * Get all reservations
 * @returns {Array} Array of all reservations
 */
export const getAllReservations = () => {
  const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
  const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
  
  // Combine and format all reservations for admin view
  return [
    ...professorReservations.map(res => ({
      id: res.id,
      classroom: res.classroom,
      reservedBy: `Professor ${res.userId.split('@')[0]}`,
      role: 'Professor',
      date: res.date,
      time: res.time,
      purpose: res.purpose,
      status: res.status
    })),
    ...studentReservations.map(res => ({
      id: res.id,
      classroom: res.room,
      reservedBy: `Student ${res.userId.split('@')[0]}`,
      role: 'Student',
      date: res.date,
      time: res.time,
      purpose: res.purpose,
      status: res.status
    }))
  ];
};

/**
 * Get user reservations
 * @param {string} userId - User email
 * @param {string} userRole - User role
 * @returns {Array} Array of user reservations
 */
export const getUserReservations = (userId, userRole) => {
  if (userRole === 'professor') {
    const reservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
    return reservations.filter(res => res.userId === userId);
  } else if (userRole === 'student') {
    const reservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
    return reservations.filter(res => res.userId === userId);
  }
  
  return [];
};

/**
 * Create a professor reservation
 * @param {Object} reservationData - Reservation data
 * @param {string} userId - User email
 * @returns {Object} Result object { success, reservation, message }
 */
export const createProfessorReservation = (reservationData, userId) => {
  const reservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
  
  // Create new reservation
  const newReservation = {
    id: generateId('PR'),
    userId,
    userRole: 'professor',
    status: 'Pending',
    ...reservationData
  };
  
  // Add to reservations
  reservations.push(newReservation);
  localStorage.setItem('professorReservations', JSON.stringify(reservations));
  
  return { success: true, reservation: newReservation, message: 'Reservation created successfully' };
};

/**
 * Create a student reservation
 * @param {Object} reservationData - Reservation data
 * @param {string} userId - User email
 * @returns {Object} Result object { success, reservation, message }
 */
export const createStudentReservation = (reservationData, userId) => {
  const reservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
  
  // Create new reservation
  const newReservation = {
    id: generateId('SR'),
    userId,
    userRole: 'student',
    status: 'Pending',
    ...reservationData
  };
  
  // Add to reservations
  reservations.push(newReservation);
  localStorage.setItem('studentReservations', JSON.stringify(reservations));
  
  return { success: true, reservation: newReservation, message: 'Reservation created successfully' };
};

/**
 * Update a reservation status
 * @param {string} id - Reservation ID
 * @param {string} status - New status
 * @returns {Object} Result object { success, message }
 */
export const updateReservationStatus = (id, status) => {
  // Check professor reservations
  let professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
  let professorIndex = professorReservations.findIndex(res => res.id === id);
  
  if (professorIndex !== -1) {
    professorReservations[professorIndex].status = status;
    localStorage.setItem('professorReservations', JSON.stringify(professorReservations));
    return { success: true, message: 'Reservation status updated successfully' };
  }
  
  // Check student reservations
  let studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
  let studentIndex = studentReservations.findIndex(res => res.id === id);
  
  if (studentIndex !== -1) {
    studentReservations[studentIndex].status = status;
    localStorage.setItem('studentReservations', JSON.stringify(studentReservations));
    return { success: true, message: 'Reservation status updated successfully' };
  }
  
  return { success: false, message: 'Reservation not found' };
};

/**
 * Delete or cancel a reservation
 * @param {string} id - Reservation ID
 * @returns {Object} Result object { success, message }
 */
export const deleteReservation = (id) => {
  // Check professor reservations
  let professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
  let professorIndex = professorReservations.findIndex(res => res.id === id);
  
  if (professorIndex !== -1) {
    // Instead of removing the reservation, mark it as CANCELED
    professorReservations[professorIndex].status = 'CANCELED';
    localStorage.setItem('professorReservations', JSON.stringify(professorReservations));
    return { success: true, message: 'Reservation cancelled successfully' };
  }
  
  // Check student reservations
  let studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
  let studentIndex = studentReservations.findIndex(res => res.id === id);
  
  if (studentIndex !== -1) {
    // Instead of removing the reservation, mark it as CANCELED
    studentReservations[studentIndex].status = 'CANCELED';
    localStorage.setItem('studentReservations', JSON.stringify(studentReservations));
    return { success: true, message: 'Reservation cancelled successfully' };
  }
  
  return { success: false, message: 'Reservation not found' };
};
/**
 * Get available classrooms
 * @param {Object} filters - Filter criteria
 * @returns {Array} Array of available classrooms
 */
export const getAvailableClassrooms = (filters = {}) => {
  const classrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
  
  // Apply filters
  return classrooms.filter(classroom => {
    // Filter by type
    if (filters.type && classroom.type !== filters.type) {
      return false;
    }
    
    // Filter by capacity
    if (filters.capacity && classroom.capacity < parseInt(filters.capacity)) {
      return false;
    }
    
    // More complex filtering logic would go here in a real app
    // For example, checking if the classroom is already reserved for the time slot
    
    return true;
  });
};

/**
 * Get available study rooms
 * @param {Object} filters - Filter criteria
 * @returns {Array} Array of available study rooms
 */
export const getAvailableStudyRooms = (filters = {}) => {
  const rooms = JSON.parse(localStorage.getItem('studyRooms') || '[]');
  
  // Apply filters
  return rooms.filter(room => {
    // Filter by type
    if (filters.type && room.type !== filters.type) {
      return false;
    }
    
    // Filter by capacity
    if (filters.capacity && room.capacity < parseInt(filters.capacity)) {
      return false;
    }
    
    // More complex filtering logic would go here in a real app
    
    return true;
  });
};

export default {
  getAllReservations,
  getUserReservations,
  createProfessorReservation,
  createStudentReservation,
  updateReservationStatus,
  deleteReservation,
  getAvailableClassrooms,
  getAvailableStudyRooms
};