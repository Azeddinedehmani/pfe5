package com.campusroom.controller;

import com.campusroom.dto.AuthResponse;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.AuthService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserManagementService userService;
    
    @Autowired
    private AuthService authService;
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<UserDTO>> getUsersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }
    
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody Map<String, Object> userMap) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Handle timetable entries for students and professors
        if ("student".equalsIgnoreCase(userDTO.getRole()) || "professor".equalsIgnoreCase(userDTO.getRole())) {
            List<Map<String, Object>> timetableEntriesMap = (List<Map<String, Object>>) userMap.get("timetableEntries");
            if (timetableEntriesMap != null) {
                List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
                
                for (Map<String, Object> entryMap : timetableEntriesMap) {
                    TimetableEntryDTO entryDTO = new TimetableEntryDTO();
                    entryDTO.setDay((String) entryMap.get("day"));
                    entryDTO.setName((String) entryMap.get("name"));
                    entryDTO.setInstructor((String) entryMap.get("instructor"));
                    entryDTO.setLocation((String) entryMap.get("location"));
                    entryDTO.setStartTime((String) entryMap.get("startTime"));
                    entryDTO.setEndTime((String) entryMap.get("endTime"));
                    entryDTO.setColor((String) entryMap.get("color"));
                    entryDTO.setType((String) entryMap.get("type"));
                    
                    timetableEntries.add(entryDTO);
                }
                
                userDTO.setTimetableEntries(timetableEntries);
            }
        }
        
        String password = (String) userMap.get("password");
        
        return ResponseEntity.ok(userService.createUser(userDTO, password));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userMap) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Handle timetable entries for students and professors
        if ("student".equalsIgnoreCase(userDTO.getRole()) || "professor".equalsIgnoreCase(userDTO.getRole())) {
            List<Map<String, Object>> timetableEntriesMap = (List<Map<String, Object>>) userMap.get("timetableEntries");
            if (timetableEntriesMap != null) {
                List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
                
                for (Map<String, Object> entryMap : timetableEntriesMap) {
                    TimetableEntryDTO entryDTO = new TimetableEntryDTO();
                    entryDTO.setId(entryMap.get("id") != null ? Long.valueOf(entryMap.get("id").toString()) : null);
                    entryDTO.setDay((String) entryMap.get("day"));
                    entryDTO.setName((String) entryMap.get("name"));
                    entryDTO.setInstructor((String) entryMap.get("instructor"));
                    entryDTO.setLocation((String) entryMap.get("location"));
                    entryDTO.setStartTime((String) entryMap.get("startTime"));
                    entryDTO.setEndTime((String) entryMap.get("endTime"));
                    entryDTO.setColor((String) entryMap.get("color"));
                    entryDTO.setType((String) entryMap.get("type"));
                    
                    timetableEntries.add(entryDTO);
                }
                
                userDTO.setTimetableEntries(timetableEntries);
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }
    
  @PutMapping("/{id}/status")
public ResponseEntity<AuthResponse> changeUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
    String status = statusMap.get("status");
    
    if (status == null || (!status.equals("active") && !status.equals("inactive"))) {
        return ResponseEntity.badRequest().body(
            AuthResponse.builder()
                .success(false)
                .message("Invalid status value. Use 'active' or 'inactive'.")
                .build()
        );
    }
    
    // Call the service to update the user status
    AuthResponse response = authService.changeUserStatus(id, status);
    return ResponseEntity.ok(response);
}
    
    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, Boolean>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordMap) {
        String password = passwordMap.get("password");
        userService.resetPassword(id, password);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PutMapping("/{id}/timetable")
    public ResponseEntity<UserDTO> updateTimetable(@PathVariable Long id, @RequestBody List<Map<String, Object>> timetableEntriesMap) {
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        for (Map<String, Object> entryMap : timetableEntriesMap) {
            TimetableEntryDTO entryDTO = new TimetableEntryDTO();
            entryDTO.setId(entryMap.get("id") != null ? Long.valueOf(entryMap.get("id").toString()) : null);
            entryDTO.setDay((String) entryMap.get("day"));
            entryDTO.setName((String) entryMap.get("name"));
            entryDTO.setInstructor((String) entryMap.get("instructor"));
            entryDTO.setLocation((String) entryMap.get("location"));
            entryDTO.setStartTime((String) entryMap.get("startTime"));
            entryDTO.setEndTime((String) entryMap.get("endTime"));
            entryDTO.setColor((String) entryMap.get("color"));
            entryDTO.setType((String) entryMap.get("type"));
            
            timetableEntries.add(entryDTO);
        }
        
        return ResponseEntity.ok(userService.updateTimetable(id, timetableEntries));
    }
    
    @GetMapping("/{id}/timetable")
    public ResponseEntity<List<TimetableEntryDTO>> getUserTimetable(@PathVariable Long id) {
        UserDTO userDTO = userService.getUserById(id);
        return ResponseEntity.ok(userDTO.getTimetableEntries());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
    
}