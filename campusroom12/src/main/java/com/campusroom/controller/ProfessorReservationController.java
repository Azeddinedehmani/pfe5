package com.campusroom.controller;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.service.ProfessorReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/professor/reservations")
@PreAuthorize("hasRole('PROFESSOR')")
public class ProfessorReservationController {
    
    @Autowired
    private ProfessorReservationService professorReservationService;
    
    // Get all reservations for the current professor
    @GetMapping("")
    public ResponseEntity<?> getProfessorReservations() {
        System.out.println("GET /api/professor/reservations");
        try {
            List<ReservationDTO> reservations = professorReservationService.getProfessorReservations();
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            System.err.println("Error retrieving professor reservations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    // Alternative endpoint that does the same as above
    @GetMapping("/my-reservations")
    public ResponseEntity<?> getMyReservations() {
        System.out.println("GET /api/professor/reservations/my-reservations");
        return getProfessorReservations();
    }
    
    // Search for available classrooms
    @PostMapping("/search")
    public ResponseEntity<?> searchAvailableClassrooms(@RequestBody ReservationRequestDTO request) {
        System.out.println("POST /api/professor/reservations/search");
        System.out.println("Search criteria: " + request);
        
        try {
            // Validate request parameters
            if (request.getDate() == null || request.getStartTime() == null || 
                request.getEndTime() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Missing required fields: date, startTime, endTime"
                        ));
            }
            
            // Convert capacity to int (handle the case where it might be a string in the request)
            int capacity = request.getCapacity();
            
            List<ClassroomDTO> availableClassrooms = professorReservationService.findAvailableClassrooms(
                request.getDate(), 
                request.getStartTime(), 
                request.getEndTime(), 
                request.getClassType(), 
                capacity
            );
            
            System.out.println("Available classrooms found: " + availableClassrooms.size());
            return ResponseEntity.ok(availableClassrooms);
        } catch (Exception e) {
            System.err.println("Error searching classrooms: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    // Make a reservation request - the key endpoint we need to fix
    @PostMapping("/request")
    public ResponseEntity<?> requestReservation(@RequestBody ReservationRequestDTO request) {
        System.out.println("POST /api/professor/reservations/request");
        System.out.println("Reservation request: " + request);
        
        try {
            // Validate request - basic validation
            if (request.getClassroomId() == null || request.getDate() == null || 
                request.getStartTime() == null || request.getEndTime() == null ||
                request.getPurpose() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Missing required fields: classroomId, date, startTime, endTime, purpose"
                        ));
            }
            
            // Create the reservation request - it will have PENDING status (set in the service)
            ReservationDTO reservation = professorReservationService.createReservationRequest(request);
            System.out.println("Reservation request created with status: " + reservation.getStatus());
            
            // Return success response with reservation details
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reservation request submitted successfully. It is pending administrator approval.",
                    "reservation", reservation
            ));
        } catch (Exception e) {
            System.err.println("Error creating reservation request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    // Edit an existing reservation - NEW ENDPOINT
    @PutMapping("/{id}")
    public ResponseEntity<?> editReservation(@PathVariable String id, @RequestBody ReservationRequestDTO request) {
        System.out.println("PUT /api/professor/reservations/" + id);
        System.out.println("Edit reservation request: " + request);
        
        try {
            // Validate request
            if (request.getClassroomId() == null || request.getDate() == null || 
                request.getStartTime() == null || request.getEndTime() == null ||
                request.getPurpose() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Missing required fields: classroomId, date, startTime, endTime, purpose"
                        ));
            }
            
            // Update the reservation
            ReservationDTO updatedReservation = professorReservationService.editReservationRequest(id, request);
            System.out.println("Reservation updated with status: " + updatedReservation.getStatus());
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reservation updated successfully. It is pending administrator approval.",
                    "reservation", updatedReservation
            ));
        } catch (Exception e) {
            System.err.println("Error updating reservation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
}