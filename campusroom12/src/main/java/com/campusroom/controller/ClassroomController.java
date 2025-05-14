package com.campusroom.controller;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * Contrôleur pour l'affichage des salles dans l'interface utilisateur
 * Exposant les endpoints avec et sans préfixe /api pour compatibilité
 */
@RestController
public class ClassroomController {

    @Autowired
    private RoomService roomService;
    
    /**
     * Endpoint avec préfixe /api
     */
    @GetMapping("/api/classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassroomsWithApi() {
        System.out.println("GET /api/classrooms - ClassroomController");
        try {
            List<ClassroomDTO> classrooms = roomService.getAllClassrooms();
            System.out.println("Retourne " + classrooms.size() + " salles de classe");
            return ResponseEntity.ok(classrooms);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des salles: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Endpoint sans préfixe /api pour compatibilité
     */
    @GetMapping("/classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassrooms() {
        System.out.println("GET /classrooms - ClassroomController");
        try {
            List<ClassroomDTO> classrooms = roomService.getAllClassrooms();
            System.out.println("Retourne " + classrooms.size() + " salles de classe (sans préfixe /api)");
            return ResponseEntity.ok(classrooms);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des salles: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}