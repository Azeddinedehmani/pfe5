package com.campusroom.controller;

import com.campusroom.dto.DemandDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;
    
    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        System.out.println("GET /api/reservations");
        return ResponseEntity.ok(reservationService.getAllReservations());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByStatus(@PathVariable String status) {
        System.out.println("GET /api/reservations/status/" + status);
        return ResponseEntity.ok(reservationService.getReservationsByStatus(status));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<DemandDTO>> getPendingDemands() {
        System.out.println("GET /api/reservations/pending");
        return ResponseEntity.ok(reservationService.getPendingDemands());
    }
    
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReservationDTO> approveReservation(@PathVariable String id) {
        System.out.println("PUT /api/reservations/" + id + "/approve");
        return ResponseEntity.ok(reservationService.approveReservation(id));
    }
    
   @PutMapping("/{id}/reject")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ReservationDTO> rejectReservation(
        @PathVariable String id,
        @RequestBody(required = false) Map<String, String> requestBody) {
    System.out.println("PUT /api/reservations/" + id + "/reject");
    
    // Extract rejection reason if provided
    String reason = requestBody != null ? requestBody.get("reason") : null;
    
    return ResponseEntity.ok(reservationService.rejectReservation(id, reason));
}
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable String id) {
        System.out.println("PUT /api/reservations/" + id + "/cancel");
        return ResponseEntity.ok(reservationService.cancelReservation(id));
    }
}