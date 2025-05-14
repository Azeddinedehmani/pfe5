package com.campusroom.controller;

import com.campusroom.dto.ClassGroupDTO;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.ClassGroupService;
import com.campusroom.service.UserManagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/class-groups")
public class ClassGroupController {
    private static final Logger logger = LoggerFactory.getLogger(ClassGroupController.class);

    @Autowired
    private ClassGroupService classGroupService;
    
    @Autowired
    private UserManagementService userManagementService;
    
    /**
     * Get all class groups (admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClassGroupDTO>> getAllClassGroups() {
        return ResponseEntity.ok(classGroupService.getAllClassGroups());
    }
    
    /**
     * Get a specific class group by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<ClassGroupDTO> getClassGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(classGroupService.getClassGroupById(id));
    }
    
    /**
     * Get class groups by professor ID
     */
    @GetMapping("/professor/{professorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<List<ClassGroupDTO>> getClassGroupsByProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(classGroupService.getClassGroupsByProfessor(professorId));
    }
    
    /**
     * Get class groups for a student
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'STUDENT')")
    public ResponseEntity<List<ClassGroupDTO>> getClassGroupsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.getClassGroupsByStudent(studentId));
    }
    
    /**
     * Create a new class group (admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> createClassGroup(@RequestBody ClassGroupDTO classGroupDTO) {
        return ResponseEntity.ok(classGroupService.createClassGroup(classGroupDTO));
    }
    
    /**
     * Update a class group (admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> updateClassGroup(
            @PathVariable Long id, 
            @RequestBody ClassGroupDTO classGroupDTO) {
        return ResponseEntity.ok(classGroupService.updateClassGroup(id, classGroupDTO));
    }
    
    /**
     * Delete a class group (admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteClassGroup(@PathVariable Long id) {
        classGroupService.deleteClassGroup(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
    
    /**
     * Update timetable entries for a class group
     */
    @PutMapping("/{classGroupId}/timetable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<ClassGroupDTO> updateClassGroupTimetable(
            @PathVariable Long classGroupId,
            @RequestBody List<TimetableEntryDTO> timetableEntries) {
        return ResponseEntity.ok(classGroupService.updateClassGroupTimetable(classGroupId, timetableEntries));
    }
    
    /**
     * Get timetable entries for a student based on their class groups
     */
    @GetMapping("/student/{studentId}/timetable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'STUDENT')")
    public ResponseEntity<List<TimetableEntryDTO>> getStudentTimetable(@PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.getStudentTimetable(studentId));
    }
    
    /**
     * Check for conflicts with a single timetable entry (for real-time conflict checking)
     */
    @PostMapping("/{classGroupId}/check-conflicts")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<Map<String, Object>> checkTimetableConflicts(
            @PathVariable Long classGroupId,
            @RequestBody TimetableEntryDTO entryToCheck) {
        logger.info("Checking conflicts for classGroupId={}, day={}, time={}-{}, location={}",
            classGroupId, entryToCheck.getDay(), entryToCheck.getStartTime(), 
            entryToCheck.getEndTime(), entryToCheck.getLocation());
        
        Map<String, Object> response = classGroupService.checkSingleEntryConflicts(classGroupId, entryToCheck);
        
        // Log the conflict result
        boolean hasConflict = (boolean) response.getOrDefault("hasConflict", false);
        logger.info("Conflict check result: {}", hasConflict ? "Has conflicts" : "No conflicts");
        
        if (hasConflict) {
            @SuppressWarnings("unchecked")
            List<String> conflictTypes = (List<String>) response.getOrDefault("conflictType", new ArrayList<String>());
            logger.info("Conflict types: {}", conflictTypes);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Helper method to generate alternative time suggestions
     */
    private List<Map<String, String>> generateAlternatives(TimetableEntryDTO entry) {
        List<Map<String, String>> alternatives = new ArrayList<>();
        
        // Parse the current time
        String[] startParts = entry.getStartTime().split(":");
        int startHour = Integer.parseInt(startParts[0]);
        int startMinute = Integer.parseInt(startParts[1]);
        
        String[] endParts = entry.getEndTime().split(":");
        int endHour = Integer.parseInt(endParts[0]);
        int endMinute = Integer.parseInt(endParts[1]);
        
        // Calculate duration in minutes
        int duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        // Generate alternative times (30 min later, 60 min later, and next day same time)
        
        // 30 minutes later
        Map<String, String> alt1 = generateAlternativeTime(entry.getDay(), startHour, startMinute, duration, 30);
        alternatives.add(alt1);
        
        // 60 minutes later
        Map<String, String> alt2 = generateAlternativeTime(entry.getDay(), startHour, startMinute, duration, 60);
        alternatives.add(alt2);
        
        // Next day same time
        String nextDay = getNextDay(entry.getDay());
        Map<String, String> alt3 = new HashMap<>();
        alt3.put("day", nextDay);
        alt3.put("startTime", entry.getStartTime());
        alt3.put("endTime", entry.getEndTime());
        alt3.put("label", nextDay + " at " + entry.getStartTime());
        alternatives.add(alt3);
        
        return alternatives;
    }
    
    /**
     * Helper method to generate a specific alternative time
     */
    private Map<String, String> generateAlternativeTime(String day, int startHour, int startMinute, int duration, int offsetMinutes) {
        // Calculate new start time
        int newStartMinutes = startHour * 60 + startMinute + offsetMinutes;
        int newStartHour = newStartMinutes / 60;
        int newStartMinute = newStartMinutes % 60;
        
        // Calculate new end time
        int newEndMinutes = newStartMinutes + duration;
        int newEndHour = newEndMinutes / 60;
        int newEndMinute = newEndMinutes % 60;
        
        // Format times
        String newStartTime = String.format("%02d:%02d", newStartHour, newStartMinute);
        String newEndTime = String.format("%02d:%02d", newEndHour, newEndMinute);
        
        // Create result
        Map<String, String> result = new HashMap<>();
        result.put("day", day);
        result.put("startTime", newStartTime);
        result.put("endTime", newEndTime);
        result.put("label", day + " at " + newStartTime);
        
        return result;
    }
    
    /**
     * Helper method to get the next day of the week
     */
    private String getNextDay(String day) {
        List<String> days = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
        int currentIndex = days.indexOf(day);
        int nextIndex = (currentIndex + 1) % days.size();
        return days.get(nextIndex);
    }
}