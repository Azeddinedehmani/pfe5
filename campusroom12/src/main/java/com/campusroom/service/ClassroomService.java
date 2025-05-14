package com.campusroom.service;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.model.Classroom;
import com.campusroom.model.Reservation;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassroomService {

    @Autowired
    private ClassroomRepository classroomRepository;
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    /**
     * Get all classrooms
     */
    public List<ClassroomDTO> getAllClassrooms() {
        System.out.println("ClassroomService: getAllClassrooms");
        List<Classroom> classrooms = classroomRepository.findAll();
        System.out.println("Trouvé " + classrooms.size() + " salles de classe");
        
        return classrooms.stream()
                .map(this::convertToClassroomDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Find classrooms available based on criteria
     */
    public List<ClassroomDTO> findAvailableClassrooms(String dateStr, String startTime, 
                                                    String endTime, String classType, int capacity) {
        System.out.println("ClassroomService: findAvailableClassrooms");
        System.out.println("Critères: Date=" + dateStr + ", Heure=" + startTime + "-" + endTime 
                + ", Type=" + classType + ", Capacité=" + capacity);
        
        try {
            // Parse date
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
            Date date = formatter.parse(dateStr);
            
            // Get all classrooms matching type and capacity
            List<Classroom> matchingClassrooms;
            if (classType != null && !classType.isEmpty()) {
                // If specific type is requested
                matchingClassrooms = classroomRepository.findByTypeAndCapacityGreaterThanEqual(
                        classType, capacity);
            } else {
                // If no specific type (all types)
                matchingClassrooms = classroomRepository.findByCapacityGreaterThanEqual(capacity);
            }
            
            System.out.println("Salles correspondantes: " + matchingClassrooms.size());
            
            // Get all approved reservations for the given date
            List<Reservation> existingReservations = reservationRepository.findByDateAndStatusNot(
                    date, "CANCELED");
            
            System.out.println("Réservations existantes à cette date: " + existingReservations.size());
            
            // Filter out classrooms that are already booked during the requested time
            List<Classroom> availableClassrooms = matchingClassrooms.stream()
                    .filter(classroom -> isClassroomAvailable(classroom, existingReservations, startTime, endTime))
                    .collect(Collectors.toList());
            
            System.out.println("Salles disponibles: " + availableClassrooms.size());
            
            return availableClassrooms.stream()
                    .map(this::convertToClassroomDTO)
                    .collect(Collectors.toList());
        } catch (ParseException e) {
            System.err.println("Erreur de format de date: " + e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Erreur lors de la recherche de salles disponibles: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la recherche de salles disponibles: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if a classroom is available during the requested time slot
     */
    private boolean isClassroomAvailable(Classroom classroom, List<Reservation> reservations, 
                                        String requestedStartTime, String requestedEndTime) {
        // Check if classroom is booked in any reservation during the requested time
        for (Reservation reservation : reservations) {
            // Skip reservations for other classrooms
            if (reservation.getClassroom() == null || !reservation.getClassroom().getId().equals(classroom.getId())) {
                continue;
            }
            
            // Check if times overlap
            if (doTimesOverlap(reservation.getStartTime(), reservation.getEndTime(), 
                              requestedStartTime, requestedEndTime)) {
                return false; // Classroom is not available
            }
        }
        
        return true; // Classroom is available
    }
    
    /**
     * Check if two time slots overlap
     */
    private boolean doTimesOverlap(String existingStart, String existingEnd, 
                                  String requestedStart, String requestedEnd) {
        // Simple string comparison works for 24-hour format times like "14:00"
        return !(requestedEnd.compareTo(existingStart) <= 0 || requestedStart.compareTo(existingEnd) >= 0);
    }
    
    /**
     * Convert Classroom entity to ClassroomDTO
     */
   private ClassroomDTO convertToClassroomDTO(Classroom classroom) {
    ClassroomDTO dto = ClassroomDTO.builder()
            .id(classroom.getId())
            .roomNumber(classroom.getRoomNumber())
            .type(classroom.getType())
            .capacity(classroom.getCapacity())
            .features(classroom.getFeatures())
            .image(classroom.getImage()) // Inclure l'image dans le DTO
            .build();
    
    return dto;
}
}