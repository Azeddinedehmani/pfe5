/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  /**
   * Format date to readable format (e.g., Mar 25, 2025)
   * @param {string} dateStr - Date string to format
   * @returns {string} Formatted date
   */
  export const formatReadableDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Generate a unique ID with a prefix
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique ID
   */
  export const generateId = (prefix = 'ID') => {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  };
  
  /**
   * Check if two date ranges overlap
   * @param {Object} range1 - First date range {start, end}
   * @param {Object} range2 - Second date range {start, end}
   * @returns {boolean} True if ranges overlap
   */
  export const dateRangesOverlap = (range1, range2) => {
    return range1.start <= range2.end && range2.start <= range1.end;
  };
  
  /**
   * Convert time string (HH:MM) to minutes
   * @param {string} timeStr - Time string (HH:MM)
   * @returns {number} Minutes
   */
  export const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  /**
   * Check if two time ranges overlap
   * @param {Object} range1 - First time range {start, end}
   * @param {Object} range2 - Second time range {start, end}
   * @returns {boolean} True if ranges overlap
   */
  export const timeRangesOverlap = (range1, range2) => {
    const range1Start = timeToMinutes(range1.start);
    const range1End = timeToMinutes(range1.end);
    const range2Start = timeToMinutes(range2.start);
    const range2End = timeToMinutes(range2.end);
    
    return range1Start < range2End && range2Start < range1End;
  };
  
  /**
   * Get current date in YYYY-MM-DD format
   * @returns {string} Current date
   */
  export const getCurrentDate = () => {
    return formatDate(new Date());
  };
  
  /**
   * Capitalize first letter of each word
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  export const capitalizeWords = (str) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  /**
   * Truncate text to a specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  export const truncateText = (text, length = 50) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };