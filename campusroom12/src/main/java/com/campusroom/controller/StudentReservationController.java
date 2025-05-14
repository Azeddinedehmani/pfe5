package com.campusroom.controller;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.service.StudentReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/classroom-reservations") // Changed base path to avoid conflicts
@PreAuthorize("hasRole('STUDENT')")
public class StudentReservationController {
    
    @Autowired
    private StudentReservationService studentReservationService;
    
    /**
     * Endpoint pour rechercher des salles de classe disponibles
     */
    @PostMapping("/search")
    public ResponseEntity<?> searchAvailableClassrooms(@RequestBody ReservationRequestDTO request) {
        System.out.println("POST /api/student/classroom-reservations/search");
        System.out.println("Critères de recherche: " + request);
        
        try {
            // Valider les paramètres de la requête
            if (request.getDate() == null || request.getStartTime() == null || 
                request.getEndTime() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Champs obligatoires manquants: date, startTime, endTime"
                        ));
            }
            
            // Convertir la capacité en int
            int capacity = request.getCapacity();
            
            List<ClassroomDTO> availableClassrooms = studentReservationService.findAvailableClassrooms(
                request.getDate(), 
                request.getStartTime(), 
                request.getEndTime(), 
                request.getClassType(), 
                capacity
            );
            
            System.out.println("Salles disponibles trouvées pour l'étudiant: " + availableClassrooms.size());
            return ResponseEntity.ok(availableClassrooms);
        } catch (Exception e) {
            System.err.println("Erreur lors de la recherche des salles pour l'étudiant: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    /**
     * Endpoint pour demander une réservation de salle de classe
     */
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
            // Créer la demande de réservation (statut PENDING défini dans le service)
            ReservationDTO reservation = studentReservationService.createClassroomReservation(request);
            System.out.println("Réservation de salle de classe pour étudiant créée avec statut: " + reservation.getStatus());
            
            // Retourner la réponse
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Demande de réservation soumise avec succès. Elle est en attente d'approbation administrateur.",
                    "reservation", reservation
            ));
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de la demande de réservation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    /**
     * Endpoint pour modifier une réservation existante
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> editReservation(@PathVariable String id, @RequestBody ReservationRequestDTO request) {
        System.out.println("PUT /api/student/classroom-reservations/" + id);
        System.out.println("Modification de réservation pour étudiant: " + request);
        
        try {
            // Valider la requête
            if (request.getClassroomId() == null || request.getDate() == null || 
                request.getStartTime() == null || request.getEndTime() == null ||
                request.getPurpose() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Champs obligatoires manquants: classroomId, date, startTime, endTime, purpose"
                        ));
            }
            
            // Mettre à jour la réservation
            ReservationDTO updatedReservation = studentReservationService.editClassroomReservation(id, request);
            System.out.println("Réservation étudiant mise à jour avec statut: " + updatedReservation.getStatus());
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Réservation mise à jour avec succès. Elle est en attente d'approbation administrateur.",
                    "reservation", updatedReservation
            ));
        } catch (Exception e) {
            System.err.println("Erreur lors de la mise à jour de la réservation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
}