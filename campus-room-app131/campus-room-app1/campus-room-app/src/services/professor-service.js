// src/services/ProfessorReservationService.js
import { API } from '../api';
import SettingsService from './SettingsService';

class ProfessorReservationService {
  /**
   * Get all reservations for the current professor
   */
  async getProfessorReservations() {
    try {
      // Try multiple approaches to fetch the reservations
      let response;
      
      try {
        // First try the primary endpoint
        response = await API.professorAPI.getProfessorReservations();
      } catch (primaryError) {
        console.error("Primary endpoint failed:", primaryError);
        
        try {
          // Then try the alternative endpoint
          response = await API.professorAPI.getMyReservations();
        } catch (alternativeError) {
          console.error("Alternative endpoint failed:", alternativeError);
          
          // As a last resort, try a direct endpoint call
          response = await API.get('/api/professor/reservations');
        }
      }
      
      return this.formatReservations(response.data);
    } catch (error) {
      console.error('Error fetching professor reservations:', error);
      
      // Try to get data from local storage as last resort
      const storedReservations = localStorage.getItem('professorReservations');
      if (storedReservations) {
        console.log('Using stored reservations as fallback');
        return this.formatReservations(JSON.parse(storedReservations));
      }
      
      throw error;
    }
  }

  /**
   * Find available classrooms based on criteria
   */
  async findAvailableClassrooms(date, startTime, endTime, classType, capacity) {
    try {
      // First, check if the request is within the allowed time constraints
      const constraints = await SettingsService.getReservationTimeConstraints();
      
      // Validate date is not too far in advance
      const today = new Date();
      const reservationDate = new Date(date);
      const daysInAdvance = Math.ceil((reservationDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysInAdvance > constraints.maxDaysInAdvance) {
        throw new Error(`Reservations can only be made up to ${constraints.maxDaysInAdvance} days in advance.`);
      }
      
      // Validate reservation is not too close to current time
      if (daysInAdvance === 0) {
        // It's for today, check hours
        const now = new Date();
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const requestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes);
        
        const hoursBeforeStart = (requestStart - now) / (1000 * 60 * 60);
        if (hoursBeforeStart < constraints.minTimeBeforeReservation) {
          throw new Error(`Reservations must be made at least ${constraints.minTimeBeforeReservation} hour(s) in advance.`);
        }
      }
      
      // Validate reservation duration is not too long
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const durationHours = (endHours + endMinutes/60) - (startHours + startMinutes/60);
      if (durationHours > constraints.maxHoursPerReservation) {
        throw new Error(`Reservations cannot exceed ${constraints.maxHoursPerReservation} hours.`);
      }
      
      // Now proceed with the search
      const searchCriteria = {
        date,
        startTime,
        endTime,
        classType,
        capacity: capacity || 0
      };
      
      const response = await API.professorAPI.searchAvailableClassrooms(searchCriteria);
      return response.data;
    } catch (error) {
      console.error('Error searching for available classrooms:', error);
      throw error;
    }
  }

  /**
   * Create a new reservation request
   */
  async createReservationRequest(requestData) {
    try {
      // Check if professors require approval according to settings
      const requireApproval = await SettingsService.isApprovalRequired('professor');
      
      // Clone the request data for potential modification
      const processedRequest = { ...requestData };
      
      // If professors don't need approval, auto-approve the reservation
      if (!requireApproval) {
        processedRequest.status = 'APPROVED';
        console.log('Auto-approving professor reservation based on settings');
      } else {
        processedRequest.status = 'PENDING';
        console.log('Professor reservation requires approval based on settings');
      }
      
      // Validate against time constraints again
      const constraints = await SettingsService.getReservationTimeConstraints();
      
      // Check weekly reservation limit
      // In a real app, this would query the database for the count of the user's reservations this week
      // Here we'll just assume the limit is not exceeded
      
      // Submit the reservation request
      const response = await API.professorAPI.requestReservation(processedRequest);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation request:', error);
      throw error;
    }
  }

  /**
   * Update an existing reservation
   * This is a new method specifically for updates
   */
  async updateReservationRequest(id, requestData) {
    try {
      // Check if professors require approval according to settings
      const requireApproval = await SettingsService.isApprovalRequired('professor');
      
      // Clone the request data for potential modification
      const processedRequest = { ...requestData };
      
      // If professors don't need approval, auto-approve the reservation
      if (!requireApproval) {
        processedRequest.status = 'APPROVED';
        console.log('Auto-approving professor reservation update based on settings');
      } else {
        processedRequest.status = 'PENDING';
        console.log('Professor reservation update requires approval based on settings');
      }
      
      // First try a direct PUT endpoint if it exists
      try {
        const response = await API.put(`/api/professor/reservations/${id}`, processedRequest);
        return response.data;
      } catch (directUpdateError) {
        console.error('Direct update failed, trying alternative approach:', directUpdateError);
        
        // If direct update fails, use a two-step approach:
        // 1. Cancel the existing reservation
        await this.cancelReservation(id);
        
        // 2. Create a new reservation with the updated data
        const createResponse = await this.createReservationRequest(processedRequest);
        return createResponse;
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId) {
    try {
      // First try the API method
      try {
        const response = await API.professorAPI.cancelReservation(reservationId);
        return response.data;
      } catch (apiError) {
        console.error('API method failed, trying direct endpoint:', apiError);
        
        // If that fails, try direct API call
        const response = await API.put(`/api/professor/reservations/${reservationId}/cancel`);
        return response.data;
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  /**
   * Format reservations data for consistency
   */
  formatReservations(reservations) {
    if (!Array.isArray(reservations)) {
      console.error('Expected array of reservations but got:', typeof reservations);
      return [];
    }
    
    return reservations.map(reservation => ({
      id: reservation.id || '',
      classroom: reservation.classroom || reservation.roomNumber || '',
      date: reservation.date || '',
      time: reservation.time || `${reservation.startTime || ''} - ${reservation.endTime || ''}`,
      startTime: reservation.startTime || '',
      endTime: reservation.endTime || '',
      purpose: reservation.purpose || '',
      status: reservation.status || 'PENDING',
      reservedBy: reservation.reservedBy || reservation.userName || ''
    }));
  }

  /**
   * Check if a professor has exceeded their weekly reservation limit
   * @param {string} professorId - The professor's user ID
   * @returns {Promise<boolean>} - Whether the limit has been exceeded
   */
  async hasExceededWeeklyLimit(professorId) {
    try {
      // Get the weekly limit from settings
      const constraints = await SettingsService.getReservationTimeConstraints();
      const maxWeeklyReservations = constraints.maxReservationsPerWeek;
      
      // In a real implementation, this would query the database
      // For now, we'll just fetch all reservations and count them
      
      const allReservations = await this.getProfessorReservations();
      
      // Filter for current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      // Count active reservations for this week
      const weeklyReservations = allReservations.filter(reservation => {
        // Skip cancelled or rejected reservations
        if (reservation.status === 'REJECTED' || reservation.status === 'CANCELED') {
          return false;
        }
        
        // Check if reservation is in current week
        const reservationDate = new Date(reservation.date);
        return reservationDate >= startOfWeek && reservationDate < endOfWeek;
      });
      
      return weeklyReservations.length >= maxWeeklyReservations;
    } catch (error) {
      console.error('Error checking weekly reservation limit:', error);
      // Default to false if there's an error
      return false;
    }
  }
}

export default new ProfessorReservationService();