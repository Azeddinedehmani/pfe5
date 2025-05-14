package com.campusroom.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import com.campusroom.dto.PasswordChangeDTO;
import com.campusroom.dto.ProfileDTO;
import com.campusroom.security.UserDetailsImpl;
import com.campusroom.service.ProfileService;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for profile-related operations with input validation
 */
@RestController
@RequestMapping("/profile") 
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    /**
     * Get current user profile
     * @return Profile data for the current user
     */
    @GetMapping
    public ResponseEntity<?> getUserProfile() {
        try {
            // Get current user from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            ProfileDTO profile = profileService.getUserProfile(userDetails.getId());
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error retrieving profile: " + e.getMessage()
            ));
        }
    }

    /**
     * Update user profile information with validation
     * @param profileDTO Profile data to update
     * @param bindingResult Validation results
     * @return Updated profile
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileDTO profileDTO, BindingResult bindingResult) {
        try {
            // Log incoming profile data for debugging
            System.out.println("Received profile update request: " + profileDTO.getId() 
                + ", firstName: " + profileDTO.getFirstName() 
                + ", lastName: " + profileDTO.getLastName()
                + ", email: " + profileDTO.getEmail()
                + ", phone: " + profileDTO.getPhone());
            
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                // Detailed logging of validation errors
                System.out.println("Validation errors found:");
                for (FieldError error : bindingResult.getFieldErrors()) {
                    System.out.println("  Field '" + error.getField() + "' error: " + error.getDefaultMessage() 
                        + " (rejected value: '" + error.getRejectedValue() + "')");
                }
                
                Map<String, String> errors = bindingResult.getFieldErrors().stream()
                    .collect(Collectors.toMap(
                        FieldError::getField, 
                        FieldError::getDefaultMessage,
                        (existing, replacement) -> existing + ", " + replacement
                    ));
                
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Validation failed",
                    "errors", errors
                ));
            }
            
            // Get current user from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            // Ensure the user is updating their own profile
            if (!userDetails.getId().equals(profileDTO.getId())) {
                System.out.println("User ID mismatch: " + userDetails.getId() + " vs " + profileDTO.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "You can only update your own profile"
                ));
            }
            
            // Add email from authenticated user if not present
            if (profileDTO.getEmail() == null || profileDTO.getEmail().isEmpty()) {
                profileDTO.setEmail(userDetails.getEmail());
                System.out.println("Added missing email from authenticated user: " + userDetails.getEmail());
            }
            
            ProfileDTO updatedProfile = profileService.updateProfile(profileDTO);
            System.out.println("Profile updated successfully for user ID: " + updatedProfile.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile updated successfully",
                "profile", updatedProfile
            ));
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error updating profile: " + e.getMessage()
            ));
        }
    }

    /**
     * Change user password with validation
     * @param passwordChangeDTO Password change request
     * @param bindingResult Validation results
     * @return Success message
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody PasswordChangeDTO passwordChangeDTO, BindingResult bindingResult) {
        try {
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                // Log validation errors
                for (FieldError error : bindingResult.getFieldErrors()) {
                    System.out.println("Password validation error for field '" + error.getField() 
                        + "': " + error.getDefaultMessage());
                }
                
                Map<String, String> errors = bindingResult.getFieldErrors().stream()
                    .collect(Collectors.toMap(
                        FieldError::getField, 
                        FieldError::getDefaultMessage,
                        (existing, replacement) -> existing + ", " + replacement
                    ));
                
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Validation failed",
                    "errors", errors
                ));
            }
            
            // Confirm passwords match
            if (!passwordChangeDTO.getNewPassword().equals(passwordChangeDTO.getConfirmPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "New passwords do not match"
                ));
            }
            
            // Get current user from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            // Call the service to change the password
            boolean success = profileService.changePassword(userDetails.getId(), passwordChangeDTO);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password updated successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to change password"
                ));
            }
        } catch (Exception e) {
            System.err.println("Error changing password: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error changing password: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get information about the currently authenticated user
     * @return User information
     */
    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo() {
        try {
            // Get current user from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", userDetails.getId());
            userInfo.put("firstName", userDetails.getFirstName());
            userInfo.put("lastName", userDetails.getLastName());
            userInfo.put("email", userDetails.getEmail());
            userInfo.put("role", userDetails.getRole());
            
            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error retrieving user info: " + e.getMessage()
            ));
        }
    }
    
}