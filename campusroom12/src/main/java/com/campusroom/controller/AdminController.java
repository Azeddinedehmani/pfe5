package com.campusroom.controller;

import com.campusroom.dto.*;
import com.campusroom.service.AdminService;
import com.campusroom.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private ReservationService reservationService;
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
    
    @GetMapping("/dashboard/notifications")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        return ResponseEntity.ok(adminService.getNotifications());
    }
    
    @GetMapping("/dashboard/recent-reservations")
    public ResponseEntity<List<ReservationDTO>> getRecentReservations() {
        return ResponseEntity.ok(reservationService.getRecentReservations());
    }
    
    @GetMapping("/dashboard/pending-demands")
    public ResponseEntity<List<DemandDTO>> getPendingDemands() {
        return ResponseEntity.ok(reservationService.getPendingDemands());
    }
    
    @GetMapping("/reports")
    public ResponseEntity<ReportDataDTO> getReportsData() {
        return ResponseEntity.ok(adminService.getReportsData());
    }
    
    @PutMapping("/approve-reservation/{id}")
    public ResponseEntity<?> approveReservation(@PathVariable String id) {
        System.out.println("PUT /api/admin/approve-reservation/" + id);
        try {
            ReservationDTO approvedReservation = reservationService.approveReservation(id);
            return ResponseEntity.ok(approvedReservation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/reject-reservation/{id}")
    public ResponseEntity<?> rejectReservation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> requestBody) {
        System.out.println("PUT /api/admin/reject-reservation/" + id);
        try {
            String reason = requestBody != null ? requestBody.get("reason") : null;
            
            // Validate reason
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Rejection reason is required"
                        ));
            }
            
            ReservationDTO rejectedReservation = reservationService.rejectReservation(id, reason);
            return ResponseEntity.ok(rejectedReservation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    @GetMapping("/user-notifications/{userId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long userId) {
        System.out.println("GET /api/admin/user-notifications/" + userId);
        return ResponseEntity.ok(adminService.getUserNotifications(userId));
    }
    
    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        System.out.println("GET /api/admin/reservations");
        return ResponseEntity.ok(reservationService.getAllReservations());
    }
    
    @GetMapping("/reservations/status/{status}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByStatus(@PathVariable String status) {
        System.out.println("GET /api/admin/reservations/status/" + status);
        return ResponseEntity.ok(reservationService.getReservationsByStatus(status));
    }
}