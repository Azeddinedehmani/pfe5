package com.campusroom.service;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.Classroom;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
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
public class ProfessorReservationService {

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
    private SystemSettingsProvider settingsProvider;
    
    @Autowired
    private ClassroomAvailabilityService availabilityService;
    
    private SystemSettingsDTO currentSettings;
    
    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        this.currentSettings = event.getSettings();
        System.out.println("ProfessorReservationService: Settings updated");
    }

    /**
     * Récupère les réservations du professeur connecté
     */
    public List<ReservationDTO> getProfessorReservations() {
        User currentUser = getCurrentUser();
        System.out.println("Récupération des réservations pour le professeur: " + currentUser.getEmail());

        return reservationRepository.findByUser(currentUser).stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }
    /**
     * Recherche des salles disponibles selon les critères
     */
 public List<ClassroomDTO> findAvailableClassrooms(String dateStr, String startTime, String endTime,
            String classType, int capacity) {
        System.out.println("Recherche de salles disponibles avec les critères:");
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

            System.out.println("Salles correspondant aux critères de base: " + matchingClassrooms.size());

            // Filtrer les salles disponibles en utilisant le service centralisé
            List<Classroom> availableClassrooms = matchingClassrooms.stream()
                    .filter(classroom -> availabilityService.isClassroomAvailable(
                        classroom.getId(), date, startTime, endTime))
                    .collect(Collectors.toList());

            System.out.println("Salles disponibles après filtrage des conflits: " + availableClassrooms.size());

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

     @Transactional
    public ReservationDTO createReservationRequest(ReservationRequestDTO requestDTO) {
        System.out.println("Creating reservation request: " + requestDTO);

        // Ensure settings are loaded
        if (currentSettings == null) {
            currentSettings = settingsProvider.getSettings();
        }

        try {
            User currentUser = getCurrentUser();
            Classroom classroom = classroomRepository.findById(requestDTO.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + requestDTO.getClassroomId()));

            // Convert the date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date date = dateFormat.parse(requestDTO.getDate());

            // Validate based on settings
            validateReservationRequest(requestDTO, date);

            // Check for conflicts using the centralized availability service
            if (!availabilityService.isClassroomAvailable(classroom.getId(), date, 
                                                      requestDTO.getStartTime(), requestDTO.getEndTime())) {
                throw new RuntimeException("This classroom is no longer available for this time slot");
            }

            // Create the reservation with UUID
            Reservation reservation = new Reservation();
            reservation.setId(UUID.randomUUID().toString());
            reservation.setUser(currentUser);
            reservation.setClassroom(classroom);
            reservation.setDate(date);
            reservation.setStartTime(requestDTO.getStartTime());
            reservation.setEndTime(requestDTO.getEndTime());
            reservation.setPurpose(requestDTO.getPurpose());
            reservation.setNotes(requestDTO.getNotes());
            
            // Set status based on settings - auto-approve or pending
            if (currentUser.getRole() == User.Role.PROFESSOR && !currentSettings.isProfessorRequireApproval()) {
                reservation.setStatus("APPROVED");
            } else {
                reservation.setStatus("PENDING");
            }

            Reservation savedReservation = reservationRepository.save(reservation);
            System.out.println("Reservation created successfully: " + savedReservation.getId());

            // Create admin notification for pending reservations
            if ("PENDING".equals(savedReservation.getStatus())) {
                createAdminNotification(savedReservation);
                
                // Send email to admins if notifications are enabled
                if (currentSettings.isEmailNotifications() && 
                    currentSettings.isReservationCreated()) {
                    List<User> admins = userRepository.findByRole(User.Role.ADMIN);
                    reservationEmailService.notifyAdminsAboutNewReservation(savedReservation, admins);
                }
            }

            return convertToReservationDTO(savedReservation);

        } catch (ParseException e) {
            System.err.println("Date conversion error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Invalid date format: " + requestDTO.getDate());
        }
    }
    // Similar validation method as in StudentReservationService
    private void validateReservationRequest(ReservationRequestDTO requestDTO, Date requestDate) {
        // Similar validation logic using currentSettings
    }
    
    /**
     * Modifie une demande de réservation existante
     * Nouvelle méthode ajoutée pour permettre la modification
     */
    @Transactional
    public ReservationDTO editReservationRequest(String id, ReservationRequestDTO requestDTO) {
        System.out.println("Modification d'une demande de réservation: " + id);
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
            createAdminUpdateNotification(updatedReservation);
            
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

        // Vérifier que la réservation appartient bien au professeur connecté
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

        // Vérifier que le statut est PENDING ou APPROVED
        if (!"PENDING".equals(reservation.getStatus()) && !"APPROVED".equals(reservation.getStatus())) {
            throw new RuntimeException("Impossible d'annuler une réservation de statut " + reservation.getStatus());
        }

        // Mettre à jour le statut
        reservation.setStatus("CANCELED");
        Reservation updatedReservation = reservationRepository.save(reservation);
        System.out.println("Réservation annulée avec succès: " + updatedReservation.getId());

        // Créer une notification pour les administrateurs
        createCancellationNotification(updatedReservation);

        return convertToReservationDTO(updatedReservation);
    }

    /**
     * Vérifie s'il y a des réservations en conflit pour une salle donnée
     */
    private boolean hasConflictingReservation(Classroom classroom, Date date, String startTime, String endTime) {
        // Validation de base d'abord
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        // Vérifier si la plage horaire est invalide
        if (requestEndMinutes <= requestStartMinutes) {
            throw new RuntimeException("Invalid time range: end time must be after start time");
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
     * demande
     */
    private void createAdminNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Nouvelle demande de réservation");
            notification.setMessage("Le professeur " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a demandé à réserver la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-plus");
            notification.setIconColor("blue");

            notificationRepository.save(notification);
        }
    }
    
    /**
     * Crée une notification pour les administrateurs concernant une mise à jour
     * d'une demande de réservation
     */
    private void createAdminUpdateNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Demande de réservation modifiée");
            notification.setMessage("Le professeur " + reservation.getUser().getFirstName() + " "
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
     */
    private void createCancellationNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Réservation annulée");
            notification.setMessage("Le professeur " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a annulé sa réservation pour la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("red");

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