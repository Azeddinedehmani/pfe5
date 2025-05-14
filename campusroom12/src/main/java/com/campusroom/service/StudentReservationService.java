package com.campusroom.service;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.model.Classroom;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReservationEmailService reservationEmailService;

    @Autowired
    private ClassroomAvailabilityService availabilityService;
    
    /**
     * Récupère les réservations de l'étudiant connecté
     */
    public List<ReservationDTO> getStudentReservations() {
        User currentUser = getCurrentUser();
        System.out.println("Récupération des réservations pour l'étudiant: " + currentUser.getEmail());

        return reservationRepository.findByUser(currentUser).stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Trouve des salles de classe disponibles selon les critères spécifiés
     */
    public List<ClassroomDTO> findAvailableClassrooms(String dateStr, String startTime, String endTime,
            String classType, int capacity) {
        System.out.println("Recherche de salles disponibles pour étudiant avec les critères:");
        System.out.println("Date: " + dateStr + ", Heure: " + startTime + " - " + endTime);
        System.out.println("Type: " + classType + ", Capacité: " + capacity);

        try {
            // Convertir la date string en Date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date date = dateFormat.parse(dateStr);

            // Trouver toutes les salles qui correspondent au type et à la capacité
            List<Classroom> matchingClassrooms = new ArrayList<>();

            if (classType != null && !classType.isEmpty()) {
                // Si un type spécifique est demandé
                matchingClassrooms = classroomRepository.findByTypeAndCapacityGreaterThanEqual(classType, capacity);
            } else {
                // Si aucun type spécifique n'est demandé
                matchingClassrooms = classroomRepository.findByCapacityGreaterThanEqual(capacity);
            }

            System.out.println("Salles correspondant aux critères de base pour étudiant: " + matchingClassrooms.size());

            // Filtrer les salles qui ont des réservations en conflit pour cette plage horaire
            List<Classroom> availableClassrooms = matchingClassrooms.stream()
                    .filter(classroom -> availabilityService.isClassroomAvailable(
                        classroom.getId(), date, startTime, endTime))
                    .collect(Collectors.toList());

            System.out.println("Salles disponibles après filtrage des conflits pour étudiant: " + availableClassrooms.size());

            // Convertir en DTOs et renvoyer
            return availableClassrooms.stream()
                    .map(this::convertToClassroomDTO)
                    .collect(Collectors.toList());

        } catch (ParseException e) {
            System.err.println("Erreur lors de la conversion de la date: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Format de date invalide: " + dateStr);
        }
    }

    /**
     * Crée une demande de réservation de salle de classe pour un étudiant
     */
    @Transactional
    public ReservationDTO createClassroomReservation(ReservationRequestDTO requestDTO) {
        System.out.println("Création d'une demande de réservation de salle de classe pour étudiant: " + requestDTO);

        try {
            User currentUser = getCurrentUser();
            Classroom classroom = classroomRepository.findById(requestDTO.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + requestDTO.getClassroomId()));

            // Convertir la date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date date = dateFormat.parse(requestDTO.getDate());

            // Vérifier qu'il n'y a pas de conflit
            if (!availabilityService.isClassroomAvailable(classroom.getId(), date, 
                                                       requestDTO.getStartTime(), requestDTO.getEndTime())) {
                throw new RuntimeException("Cette salle n'est plus disponible pour cette plage horaire");
            }

            // Rest of your existing method...
            // Create reservation, save, notifications, etc.
            
            // Créer la réservation avec un ID UUID
            Reservation reservation = new Reservation();
            reservation.setId(UUID.randomUUID().toString());
            reservation.setUser(currentUser);
            reservation.setClassroom(classroom);
            reservation.setDate(date);
            reservation.setStartTime(requestDTO.getStartTime());
            reservation.setEndTime(requestDTO.getEndTime());
            reservation.setPurpose(requestDTO.getPurpose());
            reservation.setNotes(requestDTO.getNotes());
            reservation.setStatus("PENDING"); // Statut initial: en attente d'approbation

            Reservation savedReservation = reservationRepository.save(reservation);
            System.out.println("Réservation de salle de classe créée avec succès: " + savedReservation.getId());

            // Créer une notification pour les administrateurs
            createAdminClassroomNotification(savedReservation);
            
            // Envoyer un email aux administrateurs
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            reservationEmailService.notifyAdminsAboutNewReservation(savedReservation, admins);

            return convertToReservationDTO(savedReservation);

        } catch (ParseException e) {
            System.err.println("Erreur lors de la conversion de la date: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Format de date invalide: " + requestDTO.getDate());
        }
    }

    /**
     * Modifie une demande de réservation de salle de classe existante
     */
    @Transactional
    public ReservationDTO editClassroomReservation(String id, ReservationRequestDTO requestDTO) {
        System.out.println("Modification d'une demande de réservation de salle de classe: " + id);
        System.out.println("Nouvelles données: " + requestDTO);
        
        try {
            // Vérifier que l'utilisateur courant est bien le propriétaire de la réservation
            User currentUser = getCurrentUser();
            
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
            
            // Vérifier que c'est bien la réservation de l'utilisateur courant
            if (!reservation.getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette réservation");
            }
            
            // Vérifier que la réservation est encore en statut PENDING
            if (!"PENDING".equals(reservation.getStatus())) {
                throw new RuntimeException("Seules les réservations en attente peuvent être modifiées");
            }
            
            // Vérifier si la salle a changé
            boolean classroomChanged = false;
            Classroom newClassroom = null;
            
            if (requestDTO.getClassroomId() != null && 
                !requestDTO.getClassroomId().equals(reservation.getClassroom().getId())) {
                classroomChanged = true;
                newClassroom = classroomRepository.findById(requestDTO.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + requestDTO.getClassroomId()));
            } else {
                newClassroom = reservation.getClassroom();
            }
            
            // Convertir la date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date date = dateFormat.parse(requestDTO.getDate());
            
            // Vérifier les conflits de réservation pour la nouvelle plage horaire
            if (classroomChanged || 
                !dateFormat.format(reservation.getDate()).equals(requestDTO.getDate()) ||
                !reservation.getStartTime().equals(requestDTO.getStartTime()) ||
                !reservation.getEndTime().equals(requestDTO.getEndTime())) {
                
                if (!availabilityService.isClassroomAvailable(newClassroom.getId(), date, 
                                                          requestDTO.getStartTime(), requestDTO.getEndTime())) {
                    throw new RuntimeException("La salle n'est pas disponible pour cette plage horaire");
                }
            }
            
            // Mettre à jour la réservation avec les nouvelles valeurs
           reservation.setClassroom(newClassroom);
            reservation.setDate(date);
            reservation.setStartTime(requestDTO.getStartTime());
            reservation.setEndTime(requestDTO.getEndTime());
            reservation.setPurpose(requestDTO.getPurpose());
            
            if (requestDTO.getNotes() != null) {
                reservation.setNotes(requestDTO.getNotes());
            }
            
            // Enregistrer les modifications
            Reservation updatedReservation = reservationRepository.save(reservation);
            System.out.println("Réservation mise à jour avec succès: " + updatedReservation.getId());
            
            // Créer une notification pour les administrateurs pour la mise à jour
            createAdminClassroomUpdateNotification(updatedReservation);
            
            return convertToReservationDTO(updatedReservation);
            
        } catch (ParseException e) {
            System.err.println("Erreur lors de la conversion de la date: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Format de date invalide: " + requestDTO.getDate());
        }
    }
    /**
     * Annule une réservation
     */
    @Transactional
    public ReservationDTO cancelReservation(String id) {
        System.out.println("Annulation de la réservation: " + id);

        User currentUser = getCurrentUser();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Vérifier que la réservation appartient bien à l'étudiant connecté
        if (!reservation.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler cette réservation");
        }

        // Vérifier que la réservation peut être annulée (pas déjà terminée)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        String today = sdf.format(new Date());
        try {
            if (reservation.getDate().before(sdf.parse(today))) {
                throw new RuntimeException("Impossible d'annuler une réservation passée");
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }

        // Mettre à jour le statut
        reservation.setStatus("CANCELED");
        Reservation updatedReservation = reservationRepository.save(reservation);
        System.out.println("Réservation annulée avec succès: " + updatedReservation.getId());

        // Créer une notification pour les administrateurs
        createClassroomCancellationNotification(updatedReservation);

        return convertToReservationDTO(updatedReservation);
    }

    /**
     * Vérifie s'il y a des réservations en conflit pour une salle de classe donnée
     */
    private boolean hasConflictingClassroomReservation(Classroom classroom, Date date, String startTime, String endTime) {
        // Validation de base d'abord
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        // Vérifier si la plage horaire est invalide
        if (requestEndMinutes <= requestStartMinutes) {
            throw new RuntimeException("Plage horaire invalide: l'heure de fin doit être après l'heure de début");
        }
        
        // Utiliser le service centralisé de disponibilité
        return !availabilityService.isClassroomAvailable(classroom.getId(), date, startTime, endTime);
    }

    /**
     * Convertit une heure au format "HH:mm" en minutes depuis minuit
     */
    private int convertTimeToMinutes(String time) {
        if (time == null || !time.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")) {
            throw new RuntimeException("Invalid time format: " + time + ". Expected format is HH:MM");
        }
        
        String[] parts = time.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new RuntimeException("Invalid time values: hours must be 0-23, minutes must be 0-59");
        }
        
        return hours * 60 + minutes;
    }
    /**
     * Crée une notification pour les administrateurs concernant une nouvelle
     * demande de réservation d'étudiant pour une salle de classe
     */
    private void createAdminClassroomNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Nouvelle demande de réservation de salle de classe");
            notification.setMessage("L'étudiant " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a demandé à réserver la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-chalkboard");
            notification.setIconColor("blue");

            notificationRepository.save(notification);
        }
    }

    /**
     * Crée une notification pour les administrateurs concernant une mise à jour
     * d'une demande de réservation d'étudiant pour une salle de classe
     */
    private void createAdminClassroomUpdateNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Demande de réservation de salle modifiée");
            notification.setMessage("L'étudiant " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a modifié sa demande de réservation pour la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-edit");
            notification.setIconColor("orange");

            notificationRepository.save(notification);
        }
    }

    /**
     * Crée une notification pour les administrateurs concernant une annulation
     * de réservation d'étudiant pour une salle de classe
     */
    private void createClassroomCancellationNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Réservation de salle de classe annulée");
            notification.setMessage("L'étudiant " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a annulé sa réservation pour la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("orange");

            notificationRepository.save(notification);
        }
    }

    /**
     * Récupère l'utilisateur courant
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    /**
     * Convertit une entité Reservation en DTO
     */
    private ReservationDTO convertToReservationDTO(Reservation reservation) {
        String roomName = reservation.getClassroom() != null
                ? reservation.getClassroom().getRoomNumber()
                : "N/A";
                
        return ReservationDTO.builder()
                .id(reservation.getId())
                .classroom(roomName)
                .reservedBy(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName())
                .role(reservation.getUser().getRole().name())
                .date(new SimpleDateFormat("yyyy-MM-dd").format(reservation.getDate()))
                .time(reservation.getStartTime() + " - " + reservation.getEndTime())
                .status(reservation.getStatus())
                .purpose(reservation.getPurpose())
                .build();
    }
    
    /**
     * Convertit une entité Classroom en DTO
     */
    private ClassroomDTO convertToClassroomDTO(Classroom classroom) {
        return ClassroomDTO.builder()
                .id(classroom.getId())
                .roomNumber(classroom.getRoomNumber())
                .type(classroom.getType())
                .capacity(classroom.getCapacity())
                .features(classroom.getFeatures())
                .image(classroom.getImage())
                .build();
    }
}