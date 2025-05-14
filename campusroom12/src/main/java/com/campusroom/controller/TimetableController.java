package com.campusroom.controller;

import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.security.UserDetailsImpl;
import com.campusroom.service.ClassGroupService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    @Autowired
    private UserManagementService userManagementService;
    
    @Autowired
    private ClassGroupService classGroupService;

    /**
     * Get the timetable entries for the current authenticated user
     * Updated to pull from class groups for both students and professors
     * @return List of timetable entries
     */
    @GetMapping("/my-timetable")
    @PreAuthorize("hasAnyRole('STUDENT', 'PROFESSOR')")
    public ResponseEntity<List<TimetableEntryDTO>> getMyTimetable() {
        try {
            // Log the request for debugging
            System.out.println("GET /api/timetable/my-timetable - Retrieving timetable for current user");
            
            // Get the current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
                System.err.println("No valid authentication found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
            
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            String role = userDetails.getRole();
            
            System.out.println("User ID: " + userId + ", Role: " + role);
            
            List<TimetableEntryDTO> timetableEntries;
            
            // For students, get timetable from class groups
            if ("STUDENT".equalsIgnoreCase(role)) {
                timetableEntries = classGroupService.getStudentTimetable(userId);
                System.out.println("Retrieved " + timetableEntries.size() + " timetable entries from class groups for student");
            } 
            // For professors, also get timetable from class groups
            else if ("PROFESSOR".equalsIgnoreCase(role)) {
                timetableEntries = classGroupService.getProfessorTimetable(userId);
                System.out.println("Retrieved " + timetableEntries.size() + " timetable entries from class groups for professor");
            }
            else {
                // For other roles, get directly from user timetable
                timetableEntries = userManagementService.getUserById(userId).getTimetableEntries();
                System.out.println("Retrieved " + (timetableEntries != null ? timetableEntries.size() : 0) + " timetable entries for non-student/professor");
            }
            
            // Return empty list instead of null if no entries
            if (timetableEntries == null) {
                timetableEntries = new ArrayList<>();
            }
            
            return ResponseEntity.ok(timetableEntries);
        } catch (Exception e) {
            System.err.println("Error retrieving timetable: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Export the current user's timetable as an iCal file
     * Updated to export class-based timetable for both students and professors
     * @param format The export format (currently only 'ics' is supported)
     * @return The exported file
     */
    @GetMapping("/my-timetable/export")
    @PreAuthorize("hasAnyRole('STUDENT', 'PROFESSOR')")
    public ResponseEntity<byte[]> exportMyTimetable(@RequestParam(defaultValue = "ics") String format) {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String role = userDetails.getRole();
        
        // Get the user's timetable entries
        List<TimetableEntryDTO> timetableEntries;
        
        // For students, get timetable from class groups
        if ("STUDENT".equalsIgnoreCase(role)) {
            timetableEntries = classGroupService.getStudentTimetable(userId);
        } 
        // For professors, also get timetable from class groups
        else if ("PROFESSOR".equalsIgnoreCase(role)) {
            timetableEntries = classGroupService.getProfessorTimetable(userId);
        }
        else {
            // For other roles, get directly from user timetable
            timetableEntries = userManagementService.getUserById(userId).getTimetableEntries();
        }
        
        if (timetableEntries == null) {
            timetableEntries = new ArrayList<>();
        }
        
        if ("ics".equalsIgnoreCase(format)) {
            // Generate iCal content
            String iCalContent = generateICalContent(timetableEntries);
            
            // Set up headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/calendar"));
            headers.setContentDispositionFormData("attachment", "timetable.ics");
            
            // Return the file
            return new ResponseEntity<>(iCalContent.getBytes(StandardCharsets.UTF_8), headers, HttpStatus.OK);
        } else {
            return ResponseEntity.badRequest().body("Unsupported export format".getBytes());
        }
    }
    
    /**
     * Generate an iCal file from timetable entries
     * @param timetableEntries The list of timetable entries
     * @return The iCal content as a string
     */
    private String generateICalContent(List<TimetableEntryDTO> timetableEntries) {
        StringBuilder iCalContent = new StringBuilder();
        
        // iCal header
        iCalContent.append("BEGIN:VCALENDAR\r\n");
        iCalContent.append("VERSION:2.0\r\n");
        iCalContent.append("PRODID:-//CampusRoom//Timetable//EN\r\n");
        
        // For each timetable entry, create an event
        for (TimetableEntryDTO entry : timetableEntries) {
            // Generate a unique ID for this event
            String eventId = "timetable-" + entry.getId() + "@campusroom.edu";
            
            // Format dates for iCal
            String startDate = formatDateForICS(entry.getDay(), entry.getStartTime());
            String endDate = formatDateForICS(entry.getDay(), entry.getEndTime());
            
            // Add event to iCal
            iCalContent.append("BEGIN:VEVENT\r\n");
            iCalContent.append("UID:").append(eventId).append("\r\n");
            iCalContent.append("DTSTAMP:").append(formatDateForICS(new Date())).append("\r\n");
            iCalContent.append("DTSTART:").append(startDate).append("\r\n");
            iCalContent.append("DTEND:").append(endDate).append("\r\n");
            iCalContent.append("SUMMARY:").append(entry.getName()).append("\r\n");
            iCalContent.append("LOCATION:").append(entry.getLocation()).append("\r\n");
            iCalContent.append("DESCRIPTION:").append(entry.getType()).append(" with ").append(entry.getInstructor()).append("\r\n");
            iCalContent.append("END:VEVENT\r\n");
        }
        
        // iCal footer
        iCalContent.append("END:VCALENDAR\r\n");
        
        return iCalContent.toString();
    }
    
    /**
     * Format a date for iCal (YYYYMMDDTHHmmssZ)
     * @param date The date
     * @return The formatted date
     */
    private String formatDateForICS(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");
        return sdf.format(date);
    }
    
    /**
     * Format a day of week and time for iCal
     * @param dayOfWeek The day of week
     * @param time The time
     * @return The formatted date
     */
    private String formatDateForICS(String dayOfWeek, String time) {
        // Calculate the date for this day of week (in the current week)
        Date now = new Date();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");
        
        // Convert day of week to day offset (0 for Monday, 1 for Tuesday, etc.)
        int dayOffset = 0;
        switch (dayOfWeek.toLowerCase()) {
            case "monday": dayOffset = 0; break;
            case "tuesday": dayOffset = 1; break;
            case "wednesday": dayOffset = 2; break;
            case "thursday": dayOffset = 3; break;
            case "friday": dayOffset = 4; break;
            case "saturday": dayOffset = 5; break;
            case "sunday": dayOffset = 6; break;
        }
        
        // Get current day of week (1 for Monday, 7 for Sunday in ISO 8601)
        Date today = new Date();
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(today);
        int currentDayOfWeek = cal.get(java.util.Calendar.DAY_OF_WEEK);
        // Convert to 0-based with Monday as 0
        currentDayOfWeek = currentDayOfWeek == 1 ? 6 : currentDayOfWeek - 2;
        
        // Calculate days to add to get to the target day
        int daysToAdd = (dayOffset - currentDayOfWeek + 7) % 7;
        
        // Add days to get to the target day
        cal.add(java.util.Calendar.DAY_OF_YEAR, daysToAdd);
        
        // Set time
        String[] timeParts = time.split(":");
        int hour = Integer.parseInt(timeParts[0]);
        int minute = Integer.parseInt(timeParts[1]);
        cal.set(java.util.Calendar.HOUR_OF_DAY, hour);
        cal.set(java.util.Calendar.MINUTE, minute);
        cal.set(java.util.Calendar.SECOND, 0);
        
        return sdf.format(cal.getTime());
    }
}