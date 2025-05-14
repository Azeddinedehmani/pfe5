package com.campusroom.service;

import com.campusroom.dto.ClassGroupDTO;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.model.Branch;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.TimetableEntry;
import com.campusroom.model.User;
import com.campusroom.repository.BranchRepository;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.TimetableEntryRepository;
import com.campusroom.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ClassGroupService {
    private static final Logger logger = LoggerFactory.getLogger(ClassGroupService.class);

    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TimetableEntryRepository timetableEntryRepository;
    
    @Autowired
    private BranchRepository branchRepository;
    
    /**
     * Get all class groups
     */
    public List<ClassGroupDTO> getAllClassGroups() {
        List<ClassGroup> classGroups = classGroupRepository.findAll();
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get class group by ID
     */
    public ClassGroupDTO getClassGroupById(Long id) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        return convertToClassGroupDTO(classGroup);
    }
    
    /**
     * Get class groups by professor
     */
    public List<ClassGroupDTO> getClassGroupsByProfessor(Long professorId) {
        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with id: " + professorId));
        
        List<ClassGroup> classGroups = classGroupRepository.findByProfessor(professor);
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get class groups by student
     */
    public List<ClassGroupDTO> getClassGroupsByStudent(Long studentId) {
        List<ClassGroup> classGroups = classGroupRepository.findByStudentId(studentId);
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new class group
     */
    @Transactional
public ClassGroupDTO createClassGroup(ClassGroupDTO classGroupDTO) {
    // Validate time policy for timetable entries if provided
    if (classGroupDTO.getTimetableEntries() != null && !classGroupDTO.getTimetableEntries().isEmpty()) {
        validateTimetableTimePolicy(classGroupDTO.getTimetableEntries());
    }
    ClassGroup classGroup = new ClassGroup();
        
        // Set basic info
        classGroup.setName(classGroupDTO.getName());
        classGroup.setCourseCode(classGroupDTO.getCourseCode());
        classGroup.setDescription(classGroupDTO.getDescription());
        classGroup.setAcademicYear(classGroupDTO.getAcademicYear());
        classGroup.setSemester(classGroupDTO.getSemester());
        
        // Set branch if provided
        if (classGroupDTO.getBranchId() != null) {
            Branch branch = branchRepository.findById(classGroupDTO.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found with id: " + classGroupDTO.getBranchId()));
            classGroup.setBranch(branch);
        }
        
        // Set professor if provided
        if (classGroupDTO.getProfessorId() != null) {
            User professor = userRepository.findById(classGroupDTO.getProfessorId())
                    .orElseThrow(() -> new RuntimeException("Professor not found with id: " + classGroupDTO.getProfessorId()));
            
            if (professor.getRole() != User.Role.PROFESSOR) {
                throw new RuntimeException("User with id " + classGroupDTO.getProfessorId() + " is not a professor");
            }
            
            classGroup.setProfessor(professor);
        }
        
        // Save first to get ID
        ClassGroup savedClassGroup = classGroupRepository.save(classGroup);
        
        // Add timetable entries if provided
        if (classGroupDTO.getTimetableEntries() != null && !classGroupDTO.getTimetableEntries().isEmpty()) {
            for (TimetableEntryDTO entryDTO : classGroupDTO.getTimetableEntries()) {
                TimetableEntry entry = convertToTimetableEntry(entryDTO);
                savedClassGroup.addTimetableEntry(entry);
            }
            savedClassGroup = classGroupRepository.save(savedClassGroup);
            
            // Also update professor's timetable if a professor is assigned
            if (classGroup.getProfessor() != null) {
                syncProfessorTimetable(classGroup.getProfessor(), savedClassGroup);
            }
        }
        
        return convertToClassGroupDTO(savedClassGroup);
    }
    
    /**
     * Update an existing class group
     */
    @Transactional
    public ClassGroupDTO updateClassGroup(Long id, ClassGroupDTO classGroupDTO) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        
        // Store the previous professor to handle timetable sync if professor changed
        User previousProfessor = classGroup.getProfessor();
        
        // Update basic info
        classGroup.setName(classGroupDTO.getName());
        classGroup.setCourseCode(classGroupDTO.getCourseCode());
        classGroup.setDescription(classGroupDTO.getDescription());
        classGroup.setAcademicYear(classGroupDTO.getAcademicYear());
        classGroup.setSemester(classGroupDTO.getSemester());
        
        // Update branch if provided
        if (classGroupDTO.getBranchId() != null) {
            Branch branch = branchRepository.findById(classGroupDTO.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found with id: " + classGroupDTO.getBranchId()));
            classGroup.setBranch(branch);
        } else {
            classGroup.setBranch(null);
        }
        
        // Update professor if provided
        if (classGroupDTO.getProfessorId() != null) {
            User professor = userRepository.findById(classGroupDTO.getProfessorId())
                    .orElseThrow(() -> new RuntimeException("Professor not found with id: " + classGroupDTO.getProfessorId()));
            
            if (professor.getRole() != User.Role.PROFESSOR) {
                throw new RuntimeException("User with id " + classGroupDTO.getProfessorId() + " is not a professor");
            }
            
            classGroup.setProfessor(professor);
        } else {
            classGroup.setProfessor(null);
        }
        
        // Save the updates
        ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
        
        // If professor has changed, update timetables for both old and new professor
        if (previousProfessor != null && 
            (classGroup.getProfessor() == null || !previousProfessor.getId().equals(classGroup.getProfessor().getId()))) {
            // Remove this class group's entries from previous professor's timetable
            removeClassGroupFromProfessorTimetable(previousProfessor, updatedClassGroup);
        }
        
        // Sync timetable with the new professor if exists
        if (classGroup.getProfessor() != null) {
            syncProfessorTimetable(classGroup.getProfessor(), updatedClassGroup);
        }
        
        return convertToClassGroupDTO(updatedClassGroup);
    }
    
    /**
     * Delete a class group
     */
    @Transactional
    public void deleteClassGroup(Long id) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        
        // Remove this class group's entries from professor's timetable if assigned
        if (classGroup.getProfessor() != null) {
            removeClassGroupFromProfessorTimetable(classGroup.getProfessor(), classGroup);
        }
        
        classGroupRepository.deleteById(id);
    }
    
    /**
     * Update timetable entries for a class group
     */
    @Transactional
    public ClassGroupDTO updateClassGroupTimetable(Long classGroupId, List<TimetableEntryDTO> timetableEntries) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
        
        // Validate time policy before checking conflicts
        validateTimetableTimePolicy(timetableEntries);
        
        // Check for timetable conflicts before updating
        ConflictResult conflictResult = checkTimetableConflicts(classGroup, timetableEntries);
        if (conflictResult.hasConflicts()) {
            throw new RuntimeException("Timetable conflicts detected: " + conflictResult.getFormattedMessage());
        }
        
        // Clear existing entries
        classGroup.getTimetableEntries().clear();
        
        // Add new entries
        if (timetableEntries != null) {
            for (TimetableEntryDTO entryDTO : timetableEntries) {
                TimetableEntry entry = convertToTimetableEntry(entryDTO);
                classGroup.addTimetableEntry(entry);
            }
        }
        
        ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
        
        // Also update professor's timetable if a professor is assigned
        if (classGroup.getProfessor() != null) {
            syncProfessorTimetable(classGroup.getProfessor(), updatedClassGroup);
        }
        
        return convertToClassGroupDTO(updatedClassGroup);
    }
    
    /**
     * Get timetable entries for a student based on their class groups
     */
    public List<TimetableEntryDTO> getStudentTimetable(Long studentId) {
        // Get all students from branches instead of directly from class groups
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
                
        List<Branch> branches = branchRepository.findAll().stream()
                .filter(branch -> branch.getStudents() != null && 
                        branch.getStudents().stream().anyMatch(s -> s.getId().equals(studentId)))
                .collect(Collectors.toList());
        
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        // For each branch, get all class groups and their timetable entries
        for (Branch branch : branches) {
            for (ClassGroup classGroup : branch.getClassGroups()) {
                for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                    TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                    // Add class info to entry name for display
                    entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                    timetableEntries.add(entryDTO);
                }
            }
        }
        
        return timetableEntries;
    }
    
    /**
     * Get timetable entries for a professor based on their assigned class groups
     */
    public List<TimetableEntryDTO> getProfessorTimetable(Long professorId) {
        List<ClassGroup> classGroups = classGroupRepository.findByProfessorId(professorId);
        
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        for (ClassGroup classGroup : classGroups) {
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                // Add class info to entry name for display
                entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                timetableEntries.add(entryDTO);
            }
        }
        
        return timetableEntries;
    }
    
    // ... [rest of the file remains unchanged] ...

    /**
     * Class to hold conflict check results with more detailed information
     */
    public class ConflictResult {
        private Map<String, List<UserDTO>> conflicts = new HashMap<>();
        private boolean hasProfessorConflict = false;
        private boolean hasStudentConflict = false;
        private boolean hasClassroomConflict = false;
        
        public boolean hasConflicts() {
            return !conflicts.isEmpty();
        }
        
        public String getFormattedMessage() {
            StringBuilder message = new StringBuilder();
            
            if (hasClassroomConflict) {
                message.append("CLASSROOM CONFLICT: The requested hall is already booked during this time.\n");
            }
            
            if (hasProfessorConflict) {
                message.append("PROFESSOR CONFLICT: The assigned professor has a schedule conflict during this time.\n");
            }
            
            if (hasStudentConflict) {
                message.append("STUDENT CONFLICT: One or more students have schedule conflicts during this time.\n");
            }
            
            message.append(formatConflictDetails(conflicts));
            return message.toString();
        }
        
        public Map<String, List<UserDTO>> getConflicts() {
            return conflicts;
        }
        
        public void addConflict(String timeSlot, UserDTO user) {
            if (!conflicts.containsKey(timeSlot)) {
                conflicts.put(timeSlot, new ArrayList<>());
            }
            
            // Only add the user if not already in the list
            if (conflicts.get(timeSlot).stream().noneMatch(u -> u.getId().equals(user.getId()))) {
                conflicts.get(timeSlot).add(user);
                
                // Mark the type of conflict
                if ("PROFESSOR".equals(user.getRole())) {
                    hasProfessorConflict = true;
                } else if ("STUDENT".equals(user.getRole())) {
                    hasStudentConflict = true;
                } else if ("CLASSROOM".equals(user.getRole())) {
                    hasClassroomConflict = true;
                }
            }
        }
    }

    /**
     * Check for timetable conflicts with improved reporting
     * @return ConflictResult with detailed information about any conflicts
     */
    public ConflictResult checkTimetableConflicts(ClassGroup classGroup, List<TimetableEntryDTO> newTimetableEntries) {
        ConflictResult result = new ConflictResult();
        
        if (newTimetableEntries == null || newTimetableEntries.isEmpty()) {
            return result;
        }
        
        // Check professor conflicts if one is assigned
        if (classGroup.getProfessor() != null) {
            User professor = classGroup.getProfessor();
            checkProfessorConflicts(professor, newTimetableEntries, classGroup.getId(), result);
        }
        
        // Check student conflicts for students in the same branch
        if (classGroup.getBranch() != null && classGroup.getBranch().getStudents() != null) {
            for (User student : classGroup.getBranch().getStudents()) {
                checkStudentConflicts(student, newTimetableEntries, classGroup.getId(), result);
            }
        }
        
        // Check classroom conflicts for each unique location
        Set<String> locations = newTimetableEntries.stream()
                .map(TimetableEntryDTO::getLocation)
                .filter(loc -> loc != null && !loc.isEmpty())
                .collect(Collectors.toSet());
        
        for (String location : locations) {
            checkClassroomConflicts(location, newTimetableEntries, classGroup.getId(), result);
        }
        
        logger.info("Conflict check result: {}", result.hasConflicts() ? "Has conflicts" : "No conflicts");
        if (result.hasConflicts()) {
            logger.info("Conflict details: {}", result.getFormattedMessage());
        }
        
        return result;
    }

    /**
     * Check for conflicts with a single timetable entry with improved reporting
     * This is used for real-time conflict checking in the UI
     */
    public Map<String, Object> checkSingleEntryConflicts(Long classGroupId, TimetableEntryDTO entryToCheck) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
        
        ConflictResult result = new ConflictResult();
        
        // Create a list with just this entry for checking
        List<TimetableEntryDTO> entriesToCheck = new ArrayList<>();
        entriesToCheck.add(entryToCheck);
        
        // Check professor conflicts if one is assigned
        if (classGroup.getProfessor() != null) {
            User professor = classGroup.getProfessor();
            checkProfessorConflicts(professor, entriesToCheck, classGroupId, result);
        }
        
        // Check student conflicts for students in the same branch
        if (classGroup.getBranch() != null && classGroup.getBranch().getStudents() != null) {
            for (User student : classGroup.getBranch().getStudents()) {
                checkStudentConflicts(student, entriesToCheck, classGroupId, result);
            }
        }
        
        // Check classroom conflicts if location is provided
        if (entryToCheck.getLocation() != null && !entryToCheck.getLocation().isEmpty()) {
            checkClassroomConflicts(entryToCheck.getLocation(), entriesToCheck, classGroupId, result);
        }
        
        // Log conflict details for debugging
        logger.info("Single entry conflict check for classGroupId={}, day={}, time={}-{}, location={}",
            classGroupId, entryToCheck.getDay(), entryToCheck.getStartTime(), entryToCheck.getEndTime(), entryToCheck.getLocation());
        logger.info("Conflict result: {}", result.hasConflicts() ? "Has conflicts" : "No conflicts");
        
        // Create response map with detailed conflict information
        Map<String, Object> response = new HashMap<>();
        response.put("hasConflict", result.hasConflicts());
        
        if (result.hasConflicts()) {
            response.put("conflictType", getConflictTypes(result));
            response.put("message", result.getFormattedMessage());
            
            // Collect all affected users
            List<UserDTO> affectedUsers = new ArrayList<>();
            for (List<UserDTO> users : result.getConflicts().values()) {
                affectedUsers.addAll(users);
            }
            response.put("affectedUsers", affectedUsers);
            
            // Add suggestions for alternative times if there are conflicts
            List<Map<String, String>> alternatives = generateAlternatives(entryToCheck);
            response.put("alternatives", alternatives);
        } else {
            response.put("message", "No conflicts detected for this time slot.");
        }
        
        return response;
    }
    
    // ... [rest of the file with helper methods remains unchanged] ...
    
    // Helper method to convert ClassGroup entity to DTO
    private ClassGroupDTO convertToClassGroupDTO(ClassGroup classGroup) {
        ClassGroupDTO dto = new ClassGroupDTO();
        dto.setId(classGroup.getId());
        dto.setName(classGroup.getName());
        dto.setCourseCode(classGroup.getCourseCode());
        dto.setDescription(classGroup.getDescription());
        dto.setAcademicYear(classGroup.getAcademicYear());
        dto.setSemester(classGroup.getSemester());
        
        if (classGroup.getBranch() != null) {
            dto.setBranchId(classGroup.getBranch().getId());
            dto.setBranchName(classGroup.getBranch().getName());
        }
        
        if (classGroup.getProfessor() != null) {
            dto.setProfessorId(classGroup.getProfessor().getId());
            dto.setProfessorName(classGroup.getProfessor().getFirstName() + " " + classGroup.getProfessor().getLastName());
        }
        
        // Convert timetable entries
        if (classGroup.getTimetableEntries() != null) {
            List<TimetableEntryDTO> entryDTOs = classGroup.getTimetableEntries().stream()
                    .map(this::convertToTimetableEntryDTO)
                    .collect(Collectors.toList());
            dto.setTimetableEntries(entryDTOs);
        }
        
        // Format last updated date
        if (classGroup.getUpdatedAt() != null) {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            dto.setLastUpdated(dateFormat.format(classGroup.getUpdatedAt()));
        }
        
        return dto;
    }
    
    // Helper method to convert User entity to UserDTO
    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus())
                .build();
    }
    
    // Helper method to convert TimetableEntry entity to DTO
    private TimetableEntryDTO convertToTimetableEntryDTO(TimetableEntry entry) {
        return TimetableEntryDTO.builder()
                .id(entry.getId())
                .day(entry.getDay())
                .name(entry.getName())
                .instructor(entry.getInstructor())
                .location(entry.getLocation())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .color(entry.getColor())
                .type(entry.getType())
                .build();
    }
    
    // Helper method to convert TimetableEntryDTO to entity
    private TimetableEntry convertToTimetableEntry(TimetableEntryDTO dto) {
        TimetableEntry entry = new TimetableEntry();
        if (dto.getId() != null) {
            entry.setId(dto.getId());
        }
        entry.setDay(dto.getDay());
        entry.setName(dto.getName());
        entry.setInstructor(dto.getInstructor());
        entry.setLocation(dto.getLocation() != null ? dto.getLocation().trim() : null);
        entry.setStartTime(dto.getStartTime());
        entry.setEndTime(dto.getEndTime());
        entry.setColor(dto.getColor() != null ? dto.getColor() : "#6366f1");
        entry.setType(dto.getType() != null ? dto.getType() : "Lecture");
        return entry;
    }
    
    // ... [rest of the file remains unchanged] ...

    // Helper function implementations (retain all existing methods)
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
    
    private String getNextDay(String day) {
        List<String> days = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
        int currentIndex = days.indexOf(day);
        int nextIndex = (currentIndex + 1) % days.size();
        return days.get(nextIndex);
    }
    
    private List<String> getConflictTypes(ConflictResult result) {
        List<String> types = new ArrayList<>();
        
        // Check for each type of conflict
        boolean hasProfessorConflict = result.getConflicts().values().stream()
                .flatMap(List::stream)
                .anyMatch(user -> "PROFESSOR".equals(user.getRole()));
        
        boolean hasStudentConflict = result.getConflicts().values().stream()
                .flatMap(List::stream)
                .anyMatch(user -> "STUDENT".equals(user.getRole()));
        
        boolean hasClassroomConflict = result.getConflicts().values().stream()
                .flatMap(List::stream)
                .anyMatch(user -> "CLASSROOM".equals(user.getRole()));
        
        if (hasProfessorConflict) types.add("PROFESSOR");
        if (hasStudentConflict) types.add("STUDENT");
        if (hasClassroomConflict) types.add("CLASSROOM");
        
        return types;
    }
    
    private String formatConflictDetails(Map<String, List<UserDTO>> conflicts) {
        StringBuilder message = new StringBuilder("The following time slots have conflicts:\n");
        
        for (Map.Entry<String, List<UserDTO>> entry : conflicts.entrySet()) {
            message.append("- ").append(entry.getKey()).append(": ");
            
            List<UserDTO> users = entry.getValue();
            List<String> professorNames = new ArrayList<>();
            List<String> studentNames = new ArrayList<>();
            List<String> classroomNames = new ArrayList<>();
            
            for (UserDTO user : users) {
                String name = user.getFirstName() + " " + user.getLastName();
                if ("PROFESSOR".equals(user.getRole())) {
                    professorNames.add("Professor " + name);
                } else if ("CLASSROOM".equals(user.getRole())) {
                    classroomNames.add("Classroom " + user.getLastName() + " is already booked");
                } else {
                    studentNames.add(name);
                }
            }
            
            if (!classroomNames.isEmpty()) {
                message.append("Classrooms: ").append(String.join(", ", classroomNames)).append("; ");
            }
            
            if (!professorNames.isEmpty()) {
                message.append("Professors: ").append(String.join(", ", professorNames)).append("; ");
            }
            
            if (!studentNames.isEmpty()) {
                message.append("Students: ");
                if (studentNames.size() <= 3) {
                    message.append(String.join(", ", studentNames));
                } else {
                    // If more than 3 students have conflicts, just show the count
                    message.append(studentNames.size()).append(" students");
                }
            }
            
            message.append("\n");
        }
        
        return message.toString();
    }
    
    // Add other helper methods as required by the checkTimetableConflicts method
    private void checkProfessorConflicts(User professor, List<TimetableEntryDTO> newEntries, 
                                        Long currentClassGroupId, ConflictResult result) {
        // Get all class groups taught by this professor
        List<ClassGroup> professorClassGroups = classGroupRepository.findByProfessor(professor);
        
        // Filter out the current class group
        professorClassGroups = professorClassGroups.stream()
                .filter(cg -> !cg.getId().equals(currentClassGroupId))
                .collect(Collectors.toList());
        
        // Get all timetable entries from these class groups
        List<TimetableEntry> existingEntries = new ArrayList<>();
        for (ClassGroup cg : professorClassGroups) {
            existingEntries.addAll(cg.getTimetableEntries());
        }
        
        // Also include any personal entries from the professor
        if (professor.getTimetableEntries() != null) {
            existingEntries.addAll(professor.getTimetableEntries().stream()
                    .filter(entry -> !entry.getName().startsWith(classGroupRepository.findById(currentClassGroupId)
                            .map(ClassGroup::getCourseCode).orElse("") + ":"))
                    .collect(Collectors.toList()));
        }
        
        // Check each new entry against existing entries
        for (TimetableEntryDTO newEntry : newEntries) {
            for (TimetableEntry existingEntry : existingEntries) {
                if (hasTimeConflict(newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime(),
                        existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime())) {
                    
                    String conflictKey = String.format("%s (%s - %s)",
                            newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime());
                    
                    UserDTO professorDTO = convertToUserDTO(professor);
                    
                    // Add to conflict result
                    result.addConflict(conflictKey, professorDTO);
                    
                    // Log the conflict for debugging
                    logger.info("Professor conflict detected: {} with existing entry in {} at {}-{}", 
                        professor.getFirstName() + " " + professor.getLastName(),
                        existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime());
                }
            }
        }
    }
    
    private void checkStudentConflicts(User student, List<TimetableEntryDTO> newEntries, 
                                      Long currentClassGroupId, ConflictResult result) {
        // Find other class groups from the same branch
        Branch studentBranch = null;
        for (Branch branch : branchRepository.findAll()) {
            if (branch.getStudents() != null && 
                branch.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId()))) {
                studentBranch = branch;
                break;
            }
        }
        
        if (studentBranch == null) {
            return; // Student not in any branch
        }
        
        // Get all class groups in the student's branch
        List<ClassGroup> branchClassGroups = studentBranch.getClassGroups();
        if (branchClassGroups == null) {
            branchClassGroups = new ArrayList<>();
        }
        
        // Filter out the current class group
        branchClassGroups = branchClassGroups.stream()
                .filter(cg -> !cg.getId().equals(currentClassGroupId))
                .collect(Collectors.toList());
        
        // Get all timetable entries from these class groups
        List<TimetableEntry> existingEntries = new ArrayList<>();
        for (ClassGroup cg : branchClassGroups) {
            existingEntries.addAll(cg.getTimetableEntries());
        }
        
        // Check each new entry against existing entries
        for (TimetableEntryDTO newEntry : newEntries) {
            for (TimetableEntry existingEntry : existingEntries) {
                if (hasTimeConflict(newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime(),
                        existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime())) {
                    
                    String conflictKey = String.format("%s (%s - %s)",
                            newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime());
                    
                    UserDTO studentDTO = convertToUserDTO(student);
                    
                    // Add to conflict result
                    result.addConflict(conflictKey, studentDTO);
                    
                    // Log the conflict for debugging
                    logger.info("Student conflict detected: {} with existing entry in {} at {}-{}", 
                        student.getFirstName() + " " + student.getLastName(),
                        existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime());
                }
            }
        }
    }
    
    private void checkClassroomConflicts(String location, List<TimetableEntryDTO> newEntries, 
                                        Long currentClassGroupId, ConflictResult result) {
        if (location == null || location.isEmpty()) {
            return; // Skip check if no location provided
        }
        
        logger.info("Checking classroom conflicts for location: {}", location);
        
        // Get all class groups
        List<ClassGroup> allClassGroups = classGroupRepository.findAll();
        
        // Filter out the current class group
        allClassGroups = allClassGroups.stream()
                .filter(cg -> !cg.getId().equals(currentClassGroupId))
                .collect(Collectors.toList());
        
        // Get all timetable entries from these class groups that use the same location
        List<TimetableEntry> existingEntries = new ArrayList<>();
        for (ClassGroup cg : allClassGroups) {
            if (cg.getTimetableEntries() != null) {
                List<TimetableEntry> matchingEntries = cg.getTimetableEntries().stream()
                        .filter(entry -> {
                            // Use case-sensitive, trimmed exact matching for location
                            boolean matches = location.trim().equals(entry.getLocation() != null ? entry.getLocation().trim() : "");
                            if (matches) {
                                logger.info("Found matching location in class group: {} ({})", 
                                    cg.getName(), cg.getId());
                            }
                            return matches;
                        })
                        .collect(Collectors.toList());
                
                existingEntries.addAll(matchingEntries);
            }
        }
        
        logger.info("Found {} existing entries with the same location", existingEntries.size());
        
        // Check each new entry against existing entries
        for (TimetableEntryDTO newEntry : newEntries) {
            // Skip if this entry doesn't use the specified location
            if (!location.trim().equals(newEntry.getLocation() != null ? newEntry.getLocation().trim() : "")) {
                continue;
            }
            
            for (TimetableEntry existingEntry : existingEntries) {
                if (hasTimeConflict(newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime(),
                        existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime())) {
                    
                    String conflictKey = String.format("%s (%s - %s)",
                            newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime());
                    
                    // Create a special "Classroom" UserDTO to indicate a classroom conflict
                    UserDTO classroomDTO = UserDTO.builder()
                            .id(-1L) // Special ID for classroom
                            .firstName("Classroom")
                            .lastName(location)
                            .email("N/A")
                            .role("CLASSROOM") // Special role to distinguish from students/professors
                            .build();
                    
                    // Add to conflict result
                    result.addConflict(conflictKey, classroomDTO);
                    
                    // Log the conflict for debugging
                    logger.info("Classroom conflict detected for location {} on {} at {}-{}", 
                        location, existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime());
                }
            }
        }
    }
    
    private boolean hasTimeConflict(String day1, String startTime1, String endTime1,
                                  String day2, String startTime2, String endTime2) {
        // First check if the days are the same
        if (!day1.equals(day2)) {
            return false;
        }
        
        // Convert times to minutes for easier comparison
        int start1 = convertTimeToMinutes(startTime1);
        int end1 = convertTimeToMinutes(endTime1);
        int start2 = convertTimeToMinutes(startTime2);
        int end2 = convertTimeToMinutes(endTime2);
        
        // Check for overlap: 
        // If one time slot ends before or at the same time the other starts, they don't overlap
        // Otherwise, they do overlap
        return !(end1 <= start2 || end2 <= start1);
    }
    
    private int convertTimeToMinutes(String time) {
        String[] parts = time.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        return hours * 60 + minutes;
    }
    
    /**
     * Synchronize a professor's timetable with their class groups
     */
    @Transactional
    private void syncProfessorTimetable(User professor, ClassGroup classGroup) {
        // Ensure the class group has a timetable
        if (classGroup.getTimetableEntries() == null || classGroup.getTimetableEntries().isEmpty()) {
            return;
        }
        
        // Create entries to add to the professor's timetable
        List<TimetableEntry> entriesToAdd = new ArrayList<>();
        for (TimetableEntry entry : classGroup.getTimetableEntries()) {
            TimetableEntry professorEntry = new TimetableEntry();
            professorEntry.setDay(entry.getDay());
            professorEntry.setName(classGroup.getCourseCode() + ": " + entry.getName());
            professorEntry.setInstructor(entry.getInstructor() != null ? entry.getInstructor() : "");
            professorEntry.setLocation(entry.getLocation());
            professorEntry.setStartTime(entry.getStartTime());
            professorEntry.setEndTime(entry.getEndTime());
            professorEntry.setColor(entry.getColor());
            professorEntry.setType(entry.getType());
            entriesToAdd.add(professorEntry);
        }
        
        // Update professor's timetable
        if (professor.getTimetableEntries() == null) {
            professor.setTimetableEntries(new ArrayList<>());
        }
        
        // First remove any entries that might be from this class group
        professor.getTimetableEntries().removeIf(entry -> 
            entry.getName() != null && entry.getName().startsWith(classGroup.getCourseCode() + ":"));
        
        // Then add the new entries
        for (TimetableEntry entry : entriesToAdd) {
            professor.addTimetableEntry(entry);
        }
        
        // Save the professor
        userRepository.save(professor);
    }
    
    /**
     * Remove entries from a professor's timetable that are associated with a specific class group
     */
    @Transactional
    private void removeClassGroupFromProfessorTimetable(User professor, ClassGroup classGroup) {
        if (professor.getTimetableEntries() == null) {
            return;
        }
        
        // Filter out entries that start with this class group's code
        professor.getTimetableEntries().removeIf(entry -> 
            entry.getName() != null && entry.getName().startsWith(classGroup.getCourseCode() + ":"));
        
        // Save the professor
        userRepository.save(professor);
    }
    
    /**
     * Validates that class times adhere to policy (whole hours only, 1-2 hour duration)
     * @param timetableEntries List of entries to validate
     * @throws RuntimeException if any entry violates time policy
     */
   /**
 * Validates that class times adhere to policy:
 * - Whole hours only (minutes = 00)
 * - 1-2 hour duration
 * - Time between 8 AM and 6 PM
 * 
 * @param timetableEntries List of entries to validate
 * @throws RuntimeException if any entry violates time policy
 */
private void validateTimetableTimePolicy(List<TimetableEntryDTO> timetableEntries) {
    if (timetableEntries == null || timetableEntries.isEmpty()) {
        return;
    }
    
    for (TimetableEntryDTO entry : timetableEntries) {
        // Skip validation if either time is missing
        if (entry.getStartTime() == null || entry.getEndTime() == null) {
            continue;
        }
        
        // Validate that times are on the hour (minutes = 00)
        if (!isWholeHourTime(entry.getStartTime())) {
            throw new RuntimeException("Start time must be on the hour (e.g., 9:00, 10:00): " + entry.getStartTime());
        }
        
        if (!isWholeHourTime(entry.getEndTime())) {
            throw new RuntimeException("End time must be on the hour (e.g., 9:00, 10:00): " + entry.getEndTime());
        }
        
        // INSÉRER ICI: Validation de la plage horaire 8h-18h
        // Validate that times are within the allowed range (8 AM to 6 PM)
        int startHour = Integer.parseInt(entry.getStartTime().split(":")[0]);
        int endHour = Integer.parseInt(entry.getEndTime().split(":")[0]);
        
        if (startHour < 8 || startHour >= 18) {
            throw new RuntimeException("Start time must be between 8:00 AM and 5:00 PM: " + entry.getStartTime());
        }
        
        if (endHour < 9 || endHour > 18) {
            throw new RuntimeException("End time must be between 9:00 AM and 6:00 PM: " + entry.getEndTime());
        }
        
        // Validate duration is exactly 1 or 2 hours
        int startMinutes = convertTimeToMinutes(entry.getStartTime());
        int endMinutes = convertTimeToMinutes(entry.getEndTime());
        int durationMinutes = endMinutes - startMinutes;
        
        if (durationMinutes != 60 && durationMinutes != 120) {
            throw new RuntimeException("Class duration must be exactly 1 or 2 hours (got " + (durationMinutes / 60.0) + " hours)");
        }
    }
}
/**
     * Check if a time is a whole hour (minutes = 00)
     */
    private boolean isWholeHourTime(String time) {
        try {
            String[] parts = time.split(":");
            return parts.length == 2 && Integer.parseInt(parts[1]) == 0;
        } catch (Exception e) {
            return false;
        }
    }
}