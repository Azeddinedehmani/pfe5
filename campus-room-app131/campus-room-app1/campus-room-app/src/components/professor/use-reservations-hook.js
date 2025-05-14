import { useState, useEffect } from 'react';
import { API } from '../api';

/**
 * Custom hook to fetch and manage professor reservations
 */
const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch reservations from the API
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.professorAPI.getMyReservations();
      const formattedReservations = formatReservationsData(response.data);
      setReservations(formattedReservations);
      
      // Also store in localStorage for offline/fallback access
      localStorage.setItem('professorReservations', JSON.stringify(formattedReservations));
      
      return formattedReservations;
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Using cached data if available.');
      
      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('professorReservations');
      if (cached) {
        const parsedReservations = JSON.parse(cached);
        setReservations(parsedReservations);
        return parsedReservations;
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel a reservation
  const cancelReservation = async (id) => {
    setLoading(true);
    
    try {
      await API.professorAPI.cancelReservation(id);
      
      // Update local state
      const updatedReservations = reservations.map(reservation => 
        reservation.id === id 
          ? { ...reservation, status: 'CANCELLED' } 
          : reservation
      );
      
      setReservations(updatedReservations);
      localStorage.setItem('professorReservations', JSON.stringify(updatedReservations));
      
      return true;
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('Failed to cancel reservation. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format data consistently
  const formatReservationsData = (data) => {
    return data.map(item => ({
      id: item.id,
      classroom: item.classroom,
      date: item.date,
      time: item.time || `${item.startTime} - ${item.endTime}`,
      startTime: item.startTime,
      endTime: item.endTime,
      purpose: item.purpose,
      status: item.status
    }));
  };

  // Load reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  return {
    reservations,
    loading,
    error,
    fetchReservations,
    cancelReservation
  };
};

export default useReservations;