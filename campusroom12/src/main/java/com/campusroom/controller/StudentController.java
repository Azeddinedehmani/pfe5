package com.campusroom.controller;

import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.service.RoomService;
import com.campusroom.service.StudentReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur spécifique pour les fonctionnalités étudiantes
 */
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    @Autowired
    private RoomService roomService;
    
    @Autowired
    private StudentReservationService studentReservationService;
    
 
    /**
     * Endpoint pour récupérer l'historique des réservations de l'étudiant
     */
    @GetMapping("/my-reservations")
    public ResponseEntity<List<ReservationDTO>> getMyReservations() {
        System.out.println("GET /api/student/my-reservations - StudentController");
        try {
            List<ReservationDTO> reservations = studentReservationService.getStudentReservations();
            System.out.println("Retourne " + reservations.size() + " réservations pour l'étudiant");
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des réservations: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Endpoint pour annuler une réservation
     */
    @PutMapping("/reservations/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable String id) {
        System.out.println("PUT /api/student/reservations/" + id + "/cancel - StudentController");
        try {
            ReservationDTO canceledReservation = studentReservationService.cancelReservation(id);
            System.out.println("Réservation annulée avec succès: " + canceledReservation);
            return ResponseEntity.ok(canceledReservation);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'annulation de la réservation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}