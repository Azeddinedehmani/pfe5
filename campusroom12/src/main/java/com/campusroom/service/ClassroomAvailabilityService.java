package com.campusroom.service;

import com.campusroom.model.Classroom;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.Reservation;
import com.campusroom.model.TimetableEntry;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;

/**
 * Centralized service for checking classroom availability
 * This service prevents double-booking between timetable entries and ad-hoc reservations
 */
@Service
public class ClassroomAvailabilityService {
    private static final Logger logger = LoggerFactory.getLogger(ClassroomAvailabilityService.class);
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    // Cache to store class timetables for better performance
    private Map<String, List<TimetableEntry>> classroomTimetableCache = new HashMap<>();
    
    // Timestamp of when the cache was last refreshed
    private long cacheLastRefreshed = 0;
    
    // Cache timeout in milliseconds (5 minutes)
    private static final long CACHE_TIMEOUT = 5 * 60 * 1000;
    
    /**
     * Check if a classroom is available for a given date and time period
     */
    public boolean isClassroomAvailable(String classroomId, Date date, String startTime, String endTime) {
        logger.info("Checking availability for classroom {}, date {}, time {}-{}", 
                   classroomId, date, startTime, endTime);
        
        try {
            // Check for ad-hoc reservation conflicts
            if (!checkAdHocAvailability(classroomId, date, startTime, endTime)) {
                logger.info("Classroom {} has ad-hoc reservation conflict on {} at {}-{}", 
                           classroomId, date, startTime, endTime);
                return false;
            }
            
            // Check for timetable conflicts
            if (!checkTimetableAvailability(classroomId, date, startTime, endTime)) {
                logger.info("Classroom {} has timetable conflict on {} at {}-{}", 
                           classroomId, date, startTime, endTime);
                return false;
            }
            
            // If we passed both checks, the classroom is available
            return true;
        } catch (Exception e) {
            logger.error("Error checking classroom availability: {}", e.getMessage(), e);
            // In case of any error, return false to be safe (prevent double booking)
            return false;
        }
    }
    
    /**
     * Check for conflicts with existing ad-hoc reservations
     */
    private boolean checkAdHocAvailability(String classroomId, Date date, String startTime, String endTime) {
        // Get reservations with APPROVED or PENDING status
        List<Reservation> existingReservations = reservationRepository.findByClassroomIdAndDateAndStatusIn(
                classroomId, date, Arrays.asList("APPROVED", "PENDING"));
        
        // Convert request times to minutes
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        // Check for any overlap with existing reservations
        for (Reservation reservation : existingReservations) {
            int reservationStartMinutes = convertTimeToMinutes(reservation.getStartTime());
            int reservationEndMinutes = convertTimeToMinutes(reservation.getEndTime());
            
            // If there's an overlap, the classroom is not available
            if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                             reservationStartMinutes, reservationEndMinutes)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check for conflicts with regular timetable entries
     */
    private boolean checkTimetableAvailability(String classroomId, Date date, String startTime, String endTime) {
        // Get the day of week from the date (e.g., "Monday", "Tuesday", etc.)
        String dayOfWeek = getDayOfWeekFromDate(date);
        
        // Refresh the cache if needed
        if (System.currentTimeMillis() - cacheLastRefreshed > CACHE_TIMEOUT) {
            refreshTimetableCache();
        }
        
        // Convert request times to minutes for easier comparison
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        // Get timetable entries for this classroom from cache (or empty list if none)
        List<TimetableEntry> timetableEntries = classroomTimetableCache.getOrDefault(classroomId, Collections.emptyList());
        
        // Check for conflicts with timetable entries
        for (TimetableEntry entry : timetableEntries) {
            // Only check entries for the same day of week
            if (entry.getDay().equalsIgnoreCase(dayOfWeek)) {
                int entryStartMinutes = convertTimeToMinutes(entry.getStartTime());
                int entryEndMinutes = convertTimeToMinutes(entry.getEndTime());
                
                // If there's an overlap, the classroom is not available
                if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                                 entryStartMinutes, entryEndMinutes)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Refresh the timetable cache for better performance
     */
    private void refreshTimetableCache() {
        logger.info("Refreshing timetable cache");
        
        // Clear the existing cache
        classroomTimetableCache.clear();
        
        // Get all class groups with their timetable entries
        List<ClassGroup> allClassGroups = classGroupRepository.findAll();
        
        // Populate the cache
        for (ClassGroup classGroup : allClassGroups) {
            if (classGroup.getTimetableEntries() != null) {
                for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                    if (entry.getLocation() != null && !entry.getLocation().isEmpty()) {
                        String classroomId = entry.getLocation();
                        
                        // Add the entry to the cache
                        if (!classroomTimetableCache.containsKey(classroomId)) {
                            classroomTimetableCache.put(classroomId, new ArrayList<>());
                        }
                        classroomTimetableCache.get(classroomId).add(entry);
                    }
                }
            }
        }
        
        // Update the timestamp
        cacheLastRefreshed = System.currentTimeMillis();
        
        logger.info("Timetable cache refreshed. Cached {} classrooms.", classroomTimetableCache.size());
    }
    
    /**
     * Check if two time periods overlap
     */
    private boolean hasTimeOverlap(int start1, int end1, int start2, int end2) {
        // Two periods overlap if one starts before the other ends and ends after the other starts
        return start1 < end2 && end1 > start2;
    }
    
    /**
     * Convert a time string (HH:mm) to minutes since midnight
     */
    private int convertTimeToMinutes(String time) {
        try {
            String[] parts = time.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            return hours * 60 + minutes;
        } catch (Exception e) {
            logger.error("Invalid time format: {}. Expected HH:mm", time);
            throw new IllegalArgumentException("Invalid time format: " + time);
        }
    }
    
    /**
     * Get the day of week from a Date object
     */
    private String getDayOfWeekFromDate(Date date) {
        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        DayOfWeek dayOfWeek = localDate.getDayOfWeek();
        return dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }
    
    /**
     * Check availability for a specific class group (excluding its own entries)
     * Used by ClassGroupService to avoid false conflicts when updating a group's schedule
     */
    public boolean isClassroomAvailableForClassGroup(String classroomId, Date date, String startTime, 
                                                  String endTime, Long classGroupId) {
        // Check ad-hoc reservations
        if (!checkAdHocAvailability(classroomId, date, startTime, endTime)) {
            return false;
        }
        
        // Check timetable entries, excluding the current class group
        String dayOfWeek = getDayOfWeekFromDate(date);
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        List<ClassGroup> classGroups = classGroupRepository.findAll();
        
        for (ClassGroup classGroup : classGroups) {
            // Skip current class group to avoid false conflicts
            if (classGroup.getId().equals(classGroupId)) {
                continue;
            }
            
            if (classGroup.getTimetableEntries() == null) continue;
            
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                if (entry.getLocation() != null && 
                    entry.getLocation().trim().equals(classroomId) && 
                    entry.getDay().equalsIgnoreCase(dayOfWeek)) {
                    
                    int entryStartMinutes = convertTimeToMinutes(entry.getStartTime());
                    int entryEndMinutes = convertTimeToMinutes(entry.getEndTime());
                    
                    if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, entryStartMinutes, entryEndMinutes)) {
                        return false;  // Conflict found
                    }
                }
            }
        }
        
        return true;  // No conflicts found
    }
    
    /**
     * Clean expired entries from cache
     * This can be called by a scheduled task
     */
    public void cleanCache() {
        classroomTimetableCache.clear();
        cacheLastRefreshed = 0;
        logger.info("Timetable cache cleared");
    }
}