package com.campusroom.controller;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.model.Classroom;
import com.campusroom.repository.ClassroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur simple pour exposer les données des salles
 */
@RestController
public class ClassroomApiController {

    @Autowired
    private ClassroomRepository classroomRepository;
    
    /**
     * Endpoint pour récupérer toutes les salles - utilisé par le frontend
     * Utilise un chemin différent pour éviter les conflits avec ClassroomController
     */
    @GetMapping("/public-classrooms") // Changed from "/classrooms" to avoid conflict
    public List<ClassroomDTO> getAllClassrooms() {
        try {
            System.out.println("ClassroomApiController: GET /public-classrooms");
            List<Classroom> classrooms = classroomRepository.findAll();
            System.out.println("Trouvé " + classrooms.size() + " salles");
            return classrooms.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Erreur dans ClassroomApiController.getAllClassrooms: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    // Helper pour convertir Classroom en ClassroomDTO
    private ClassroomDTO convertToDTO(Classroom classroom) {
    ClassroomDTO dto = new ClassroomDTO();
    dto.setId(classroom.getId());
    dto.setRoomNumber(classroom.getRoomNumber());
    dto.setType(classroom.getType());
    dto.setCapacity(classroom.getCapacity());
    dto.setFeatures(classroom.getFeatures());
    dto.setImage(classroom.getImage()); // Inclure l'image dans le DTO
    return dto;
}
}