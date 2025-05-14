package com.campusroom.service;

import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.model.Reservation;
import com.campusroom.model.TimetableEntry;
import com.campusroom.model.User;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.TimetableEntryRepository;
import com.campusroom.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TimetableEntryRepository timetableEntryRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
private EntityManager entityManager;
    @Autowired
private ReservationRepository reservationRepository; // Add this at the class level

    
    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get users by role
     */
    public List<UserDTO> getUsersByRole(String role) {
        User.Role userRole = User.Role.valueOf(role.toUpperCase());
        return userRepository.findByRole(userRole).stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get users by status
     */
    public List<UserDTO> getUsersByStatus(String status) {
        return userRepository.findByStatus(status).stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user by ID with timetable entries
     */
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Special handling for student and professor roles to ensure timetable entries are loaded
        if (user.getRole() == User.Role.STUDENT || user.getRole() == User.Role.PROFESSOR) {
            List<TimetableEntry> entries = timetableEntryRepository.findByUserId(id);
            System.out.println("Found " + entries.size() + " timetable entries for user " + id);
            
            // Set the timetable entries if not already set
            if (user.getTimetableEntries() == null || user.getTimetableEntries().isEmpty()) {
                user.setTimetableEntries(entries);
            }
        }
        
        return convertToUserDTO(user);
    }
    
    /**
     * Create a new user
     */
    @Transactional
    public UserDTO createUser(UserDTO userDTO, String password) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }
        
        User user = new User();
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.valueOf(userDTO.getRole().toUpperCase()));
        user.setStatus(userDTO.getStatus());
        
        // Save the user first to get an ID
        User savedUser = userRepository.save(user);
        
        // Add timetable entries if it's a student or a professor
        if ((user.getRole() == User.Role.STUDENT || user.getRole() == User.Role.PROFESSOR) && 
            userDTO.getTimetableEntries() != null) {
            List<TimetableEntry> entries = new ArrayList<>();
            
            for (TimetableEntryDTO entryDTO : userDTO.getTimetableEntries()) {
                TimetableEntry entry = convertToTimetableEntry(entryDTO);
                entries.add(entry);
            }
            
            savedUser.setTimetableEntries(entries);
            savedUser = userRepository.save(savedUser);
            System.out.println("Saved " + entries.size() + " timetable entries for new user " + savedUser.getId());
        }
        
        return convertToUserDTO(savedUser);
    }
    
    /**
     * Update an existing user
     */
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFirstName(userDTO.getFirstName());
                    user.setLastName(userDTO.getLastName());
                    
                    // Vérifier si l'email est déjà pris par un autre utilisateur
                    if (!user.getEmail().equals(userDTO.getEmail()) && 
                            userRepository.existsByEmail(userDTO.getEmail())) {
                        throw new RuntimeException("Email is already taken");
                    }
                    user.setEmail(userDTO.getEmail());
                    
                    user.setRole(User.Role.valueOf(userDTO.getRole().toUpperCase()));
                    user.setStatus(userDTO.getStatus());
                    
                    // Update timetable entries if it's a student or professor
                    if (user.getRole() == User.Role.STUDENT || user.getRole() == User.Role.PROFESSOR) {
                        updateTimetableEntries(user, userDTO.getTimetableEntries());
                    }
                    
                    User updatedUser = userRepository.save(user);
                    return convertToUserDTO(updatedUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    /**
     * Change user status
     */
    @Transactional
    public UserDTO changeUserStatus(Long id, String status) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(status);
                    User updatedUser = userRepository.save(user);
                    return convertToUserDTO(updatedUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
/**
 * Delete a user and their associated reservations
 */
@Transactional
public void deleteUser(Long id) {
    try {
        // Verify if the user exists
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // 1. First delete all reservations associated with the user
        System.out.println("Deleting reservations for user with ID " + id);
        List<Reservation> userReservations = reservationRepository.findByUser(user);
        if (userReservations != null && !userReservations.isEmpty()) {
            System.out.println("Found " + userReservations.size() + " reservations to delete");
            reservationRepository.deleteAll(userReservations);
        }
        
        // 2. Clear the timetable entries list (without trying to delete them)
        if (user.getTimetableEntries() != null) {
            user.getTimetableEntries().clear();
            userRepository.save(user); // Save to clear references
        }
        
        // 3. Temporarily disable foreign key constraints (MySQL solution)
        entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS=0").executeUpdate();
        
        try {
            // 4. Delete the user directly
            userRepository.delete(user);
            System.out.println("User with ID " + id + " deleted successfully");
        } finally {
            // 5. Re-enable foreign key constraints
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS=1").executeUpdate();
        }
    } catch (Exception e) {
        System.err.println("Error deleting user " + id + ": " + e.getMessage());
        e.printStackTrace();
        
        // 6. If all else fails, try logical deletion
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user != null) {
                // Delete reservations even in logical deletion mode
                List<Reservation> userReservations = reservationRepository.findByUser(user);
                if (userReservations != null && !userReservations.isEmpty()) {
                    reservationRepository.deleteAll(userReservations);
                }
                
                user.setStatus("deleted");
                user.setEmail("deleted_" + id + "@example.com");
                userRepository.save(user);
                System.out.println("Logical deletion of user " + id + " completed");
            }
        } catch (Exception ex) {
            System.err.println("Logical deletion also failed: " + ex.getMessage());
        }
        
        throw new RuntimeException("Failed to delete user", e);
    }
}
/**
     * Reset user password
     */
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        userRepository.findById(id)
                .ifPresent(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                });
    }
    
    /**
     * Update user timetable
     */
    @Transactional
    public UserDTO updateTimetable(Long userId, List<TimetableEntryDTO> timetableEntries) {
        return userRepository.findById(userId)
            .map(user -> {
                if (user.getRole() != User.Role.STUDENT && user.getRole() != User.Role.PROFESSOR) {
                    throw new RuntimeException("Timetable can only be updated for students and professors");
                }
                
                System.out.println("Updating timetable for user " + userId + " with " + timetableEntries.size() + " entries");
                updateTimetableEntries(user, timetableEntries);
                User updatedUser = userRepository.save(user);
                return convertToUserDTO(updatedUser);
            })
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }
    
    /**
     * Helper method to update user's timetable entries
     */
    private void updateTimetableEntries(User user, List<TimetableEntryDTO> timetableEntryDTOs) {
        // Ensure we have a non-null list
        if (user.getTimetableEntries() == null) {
            user.setTimetableEntries(new ArrayList<>());
        }
        
        // Clear existing entries
        user.getTimetableEntries().clear();
        
        // Add new entries
        if (timetableEntryDTOs != null) {
            for (TimetableEntryDTO entryDTO : timetableEntryDTOs) {
                TimetableEntry entry = convertToTimetableEntry(entryDTO);
                user.addTimetableEntry(entry);
            }
            System.out.println("Added " + timetableEntryDTOs.size() + " timetable entries to user");
        }
    }
    
    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertToUserDTO(User user) {
        List<TimetableEntryDTO> timetableEntryDTOs = new ArrayList<>();
        
        if (user.getTimetableEntries() != null) {
            timetableEntryDTOs = user.getTimetableEntries().stream()
                .map(this::convertToTimetableEntryDTO)
                .collect(Collectors.toList());
            System.out.println("Converted " + timetableEntryDTOs.size() + " timetable entries for user DTO");
        }
        
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .timetableEntries(timetableEntryDTOs)
                .build();
    }
    
    /**
     * Convert TimetableEntry entity to TimetableEntryDTO
     */
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
    
    /**
     * Convert TimetableEntryDTO to TimetableEntry entity
     */
    private TimetableEntry convertToTimetableEntry(TimetableEntryDTO dto) {
        TimetableEntry entry = new TimetableEntry();
        if (dto.getId() != null) {
            entry.setId(dto.getId());
        }
        entry.setDay(dto.getDay());
        entry.setName(dto.getName());
        entry.setInstructor(dto.getInstructor());
        entry.setLocation(dto.getLocation());
        entry.setStartTime(dto.getStartTime());
        entry.setEndTime(dto.getEndTime());
        entry.setColor(dto.getColor() != null ? dto.getColor() : "#6366f1"); // Default color
        entry.setType(dto.getType() != null ? dto.getType() : "Lecture"); // Default type
        return entry;
    }
}