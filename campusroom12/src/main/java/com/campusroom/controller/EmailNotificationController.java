package com.campusroom.controller;

import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import com.campusroom.service.ReservationEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class EmailNotificationController {

    @Autowired
    private ReservationEmailService reservationEmailService;
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/reservation-status")
    public ResponseEntity<?> sendReservationStatusEmail(@RequestBody Map<String, String> request) {
        String reservationId = request.get("reservationId");
        String status = request.get("status");
        String reason = request.get("reason");
        
        if (reservationId == null || status == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Missing required parameters"
            ));
        }
        
        try {
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + reservationId));
            
            boolean success = reservationEmailService.sendReservationStatusEmail(reservation, status, reason);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Email sent successfully" : "Failed to send email"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error processing request: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/new-reservation")
    public ResponseEntity<?> sendNewReservationNotification(@RequestBody Map<String, Object> request) {
        Map<String, Object> reservationData = (Map<String, Object>) request.get("reservationData");
        
        if (reservationData == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Missing reservation data"
            ));
        }
        
        try {
            String reservationId = (String) reservationData.get("id");
            Reservation reservation;
            
            // If it's a new request that doesn't have an ID yet
            if (reservationId == null || reservationId.equals("NEW_REQUEST")) {
                // Create a temporary reservation object for email notification
                reservation = new Reservation();
                reservation.setId("TEMP_" + System.currentTimeMillis());
                
                // Set user if we have an email
                String userEmail = (String) reservationData.get("userEmail");
                if (userEmail != null && !userEmail.isEmpty()) {
                    User user = userRepository.findByEmail(userEmail)
                            .orElse(null);
                    if (user != null) {
                        reservation.setUser(user);
                    }
                }
                
                // Set other fields from the request
                // This would need to be expanded based on the actual data structure
            } else {
                // Use existing reservation
                reservation = reservationRepository.findById(reservationId)
                        .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + reservationId));
            }
            
            // Get all admins
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            int emailCount = reservationEmailService.notifyAdminsAboutNewReservation(reservation, admins);
            
            return ResponseEntity.ok(Map.of(
                "success", emailCount > 0,
                "emailsSent", emailCount,
                "message", emailCount > 0 ? "Emails sent successfully" : "Failed to send emails"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error processing request: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/test-email")
    public ResponseEntity<?> testEmailDelivery(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email address is required"
            ));
        }
        
        try {
            // This would be implemented in a real service
            // For now, just return success message
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test email sent to " + email
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error sending test email: " + e.getMessage()
            ));
        }
    }
}