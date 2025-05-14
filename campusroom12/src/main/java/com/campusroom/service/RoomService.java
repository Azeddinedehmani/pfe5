package com.campusroom.service;

import com.campusroom.dto.AvailabilityDTO;
import com.campusroom.dto.ClassroomDTO;
import com.campusroom.model.Classroom;

import com.campusroom.model.Reservation;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    @Autowired
    private ClassroomRepository classroomRepository;
    
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    /**
     * Liste standard des créneaux horaires possibles
     */
    private static final String[] DEFAULT_TIME_SLOTS = {
        "08:00-09:30", "09:45-11:15", "11:30-13:00", 
        "13:30-15:00", "15:15-16:45", "17:00-18:30"
    };
    
    // Méthodes pour les salles de classe
    public List<ClassroomDTO> getAllClassrooms() {
        System.out.println("Service: getAllClassrooms");
        List<Classroom> classrooms = classroomRepository.findAll();
        System.out.println("Trouvé " + classrooms.size() + " salles de classe");
        return classrooms.stream()
                .map(this::convertToClassroomDTO)
                .collect(Collectors.toList());
    }
    
    public ClassroomDTO getClassroomById(String id) {
        System.out.println("Service: getClassroomById(" + id + ")");
        return classroomRepository.findById(id)
                .map(this::convertToClassroomDTO)
                .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + id));
    }
    
    @Transactional
public ClassroomDTO createClassroom(ClassroomDTO classroomDTO) {
    System.out.println("Service: createClassroom");
    System.out.println("Données reçues: " + classroomDTO);
    
    try {
        Classroom classroom = new Classroom();
        
        // Générer ID si non fourni
        if (classroomDTO.getId() == null || classroomDTO.getId().isEmpty()) {
            classroom.setId("C" + System.currentTimeMillis() % 10000);
            System.out.println("ID généré: " + classroom.getId());
        } else {
            classroom.setId(classroomDTO.getId());
            System.out.println("ID utilisé: " + classroom.getId());
        }
        
        classroom.setRoomNumber(classroomDTO.getRoomNumber());
        classroom.setType(classroomDTO.getType());
        classroom.setCapacity(classroomDTO.getCapacity());
        classroom.setFeatures(classroomDTO.getFeatures());
        
        // Définir l'image - utiliser une image par défaut si non fournie
        if (classroomDTO.getImage() == null || classroomDTO.getImage().isEmpty()) {
            classroom.setImage("/images/classroom-default.jpg");
        } else {
            classroom.setImage(classroomDTO.getImage());
        }
        
        System.out.println("Sauvegarde de la salle: " + classroom);
        Classroom savedClassroom = classroomRepository.save(classroom);
        System.out.println("Salle sauvegardée: " + savedClassroom);
        
        return convertToClassroomDTO(savedClassroom);
    } catch (Exception e) {
        System.err.println("Erreur lors de la création de la salle: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Erreur lors de la création de la salle: " + e.getMessage(), e);
    }
}
    
   @Transactional
public ClassroomDTO updateClassroom(String id, ClassroomDTO classroomDTO) {
    System.out.println("Service: updateClassroom(" + id + ")");
    System.out.println("Données reçues: " + classroomDTO);
    
    try {
        return classroomRepository.findById(id)
            .map(classroom -> {
                classroom.setRoomNumber(classroomDTO.getRoomNumber());
                classroom.setType(classroomDTO.getType());
                classroom.setCapacity(classroomDTO.getCapacity());
                classroom.setFeatures(classroomDTO.getFeatures());
                
                // Mettre à jour l'image seulement si fournie
                if (classroomDTO.getImage() != null && !classroomDTO.getImage().isEmpty()) {
                    classroom.setImage(classroomDTO.getImage());
                }
                
                System.out.println("Mise à jour de la salle: " + classroom);
                Classroom updatedClassroom = classroomRepository.save(classroom);
                System.out.println("Salle mise à jour: " + updatedClassroom);
                
                return convertToClassroomDTO(updatedClassroom);
            })
            .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + id));
    } catch (Exception e) {
        System.err.println("Erreur lors de la mise à jour de la salle: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Erreur lors de la mise à jour de la salle: " + e.getMessage(), e);
    }
}
    @Transactional
    public void deleteClassroom(String id) {
        System.out.println("Service: deleteClassroom(" + id + ")");
        
        try {
            if (!classroomRepository.existsById(id)) {
                throw new RuntimeException("Classroom not found with id: " + id);
            }
            classroomRepository.deleteById(id);
            System.out.println("Salle supprimée avec succès: " + id);
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression de la salle: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la suppression de la salle: " + e.getMessage(), e);
        }
    }
    
    /**
     * Vérifie la disponibilité d'une salle spécifique à une date donnée
     */
    public AvailabilityDTO checkClassroomAvailability(String classroomId, Date date) {
        System.out.println("Service: checkClassroomAvailability(" + classroomId + ", " + date + ")");
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + classroomId));
        
        // Récupérer toutes les réservations pour cette salle à cette date
        List<Reservation> reservations = reservationRepository.findByClassroomAndDateAndStatusIn(
                classroom, date, Arrays.asList("APPROVED", "PENDING"));
        
        // Formater la date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String formattedDate = dateFormat.format(date);
        
        // Construire les créneaux horaires avec leur disponibilité
        List<AvailabilityDTO.TimeSlotDTO> timeSlots = new ArrayList<>();
        
        for (String slot : DEFAULT_TIME_SLOTS) {
            String[] times = slot.split("-");
            String startTime = times[0];
            String endTime = times[1];
            
            boolean isAvailable = true;
            String reservedBy = null;
            
            // Vérifier si ce créneau est déjà réservé
            for (Reservation res : reservations) {
                if (hasTimeOverlap(startTime, endTime, res.getStartTime(), res.getEndTime())) {
                    isAvailable = false;
                    reservedBy = res.getUser().getFirstName() + " " + res.getUser().getLastName();
                    break;
                }
            }
            
            // Utiliser le builder pattern pour plus de clarté
            AvailabilityDTO.TimeSlotDTO timeSlotDTO = AvailabilityDTO.TimeSlotDTO.builder()
                .startTime(startTime)
                .endTime(endTime)
                .available(isAvailable)
                .reservedBy(reservedBy)
                .build();
                
            timeSlots.add(timeSlotDTO);
        }
        
        // Utiliser le builder pattern pour construire l'objet AvailabilityDTO
        return AvailabilityDTO.builder()
                .classroomId(classroomId)
                .date(formattedDate)
                .timeSlots(timeSlots)
                .build();
    }
    
    /**
     * Recherche des salles disponibles en fonction des critères
     */
    public List<ClassroomDTO> findAvailableRooms(Date date, String startTime, String endTime, 
                                               String type, int minCapacity) {
        System.out.println("Service: findAvailableRooms");
        System.out.println("Critères: date=" + date + ", horaire=" + startTime + "-" + endTime + 
                          ", type=" + type + ", capacité min=" + minCapacity);
                          
        // Trouver toutes les salles qui correspondent au type et à la capacité
        List<Classroom> classrooms;
        
        if (type != null && !type.isEmpty()) {
            classrooms = classroomRepository.findByTypeAndCapacityGreaterThanEqual(type, minCapacity);
        } else {
            classrooms = classroomRepository.findByCapacityGreaterThanEqual(minCapacity);
        }
        
        // Filtrer les salles qui sont disponibles pour cette plage horaire
        List<Classroom> availableClassrooms = classrooms.stream()
                .filter(classroom -> isRoomAvailable(classroom, date, startTime, endTime))
                .collect(Collectors.toList());
        
        // Convertir en DTOs
        return availableClassrooms.stream()
                .map(this::convertToClassroomDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtient les plages horaires disponibles pour une salle spécifique à une date donnée
     */
    public List<String> getAvailableTimeSlots(String classroomId, Date date) {
        System.out.println("Service: getAvailableTimeSlots(" + classroomId + ", " + date + ")");
        AvailabilityDTO availability = checkClassroomAvailability(classroomId, date);
        
        // Extraire uniquement les créneaux disponibles
        return availability.getTimeSlots().stream()
            .filter(AvailabilityDTO.TimeSlotDTO::isAvailable)
            .map(slot -> slot.getStartTime() + "-" + slot.getEndTime())
            .collect(Collectors.toList());
    }
    
    /**
     * Vérifie si une salle est disponible pour une plage horaire spécifique
     */
    public boolean isRoomAvailable(String classroomId, Date date, String startTime, String endTime) {
        System.out.println("Service: isRoomAvailable(" + classroomId + ", " + date + ", " + startTime + "-" + endTime + ")");
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + classroomId));
        
        return isRoomAvailable(classroom, date, startTime, endTime);
    }
    
    /**
     * Vérifie si une salle est disponible pour une plage horaire spécifique (version avec objet Classroom)
     */
    private boolean isRoomAvailable(Classroom classroom, Date date, String startTime, String endTime) {
        // Récupérer toutes les réservations pour cette salle à cette date
        List<Reservation> reservations = reservationRepository.findByClassroomAndDateAndStatusIn(
                classroom, date, Arrays.asList("APPROVED", "PENDING"));
        
        // Vérifier s'il y a des réservations qui se chevauchent avec la plage horaire demandée
        return reservations.stream()
                .noneMatch(res -> hasTimeOverlap(startTime, endTime, res.getStartTime(), res.getEndTime()));
    }
    
    /**
     * Vérifie si deux plages horaires se chevauchent
     */
    private boolean hasTimeOverlap(String start1, String end1, String start2, String end2) {
        // Convertir les heures en minutes pour faciliter la comparaison
        int start1Minutes = convertTimeToMinutes(start1);
        int end1Minutes = convertTimeToMinutes(end1);
        int start2Minutes = convertTimeToMinutes(start2);
        int end2Minutes = convertTimeToMinutes(end2);
        
        // Vérifier s'il y a chevauchement
        return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
    }
    
    /**
     * Convertit une heure au format "HH:mm" en minutes depuis minuit
     */
    private int convertTimeToMinutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
    
    // Méthodes auxiliaires pour convertir entre entités et DTOs
   private ClassroomDTO convertToClassroomDTO(Classroom classroom) {
    ClassroomDTO dto = ClassroomDTO.builder()
            .id(classroom.getId())
            .roomNumber(classroom.getRoomNumber())
            .type(classroom.getType())
            .capacity(classroom.getCapacity())
            .features(classroom.getFeatures())
            .image(classroom.getImage()) // Inclure l'image dans le DTO
            .build();
    
    System.out.println("Conversion entité vers DTO: " + dto);
    return dto;
}
   
}