package com.campusroom.service;

import com.campusroom.dto.DemandDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private ReservationEmailService reservationEmailService;
    
    @Autowired
    private SystemSettingsProvider settingsProvider;
    
    private SystemSettingsDTO currentSettings;
    
    // Initialize settings on application startup
    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        this.currentSettings = event.getSettings();
        System.out.println("ReservationService: Settings updated");
    }

    /**
     * Get all reservations
     */
    public List<ReservationDTO> getAllReservations() {
        System.out.println("ReservationService: getAllReservations");
        List<Reservation> reservations = reservationRepository.findAll();

        return reservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get reservations by status
     */
    public List<ReservationDTO> getReservationsByStatus(String status) {
        System.out.println("ReservationService: getReservationsByStatus(" + status + ")");
        List<Reservation> reservations = reservationRepository.findByStatus(status);

        return reservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent reservations
     */
    public List<ReservationDTO> getRecentReservations() {
        System.out.println("ReservationService: getRecentReservations");
        List<Reservation> recentReservations = reservationRepository.findTop10ByOrderByCreatedAtDesc();

        return recentReservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }
   
    /**
     * Get pending demands
     */
    public List<DemandDTO> getPendingDemands() {
        System.out.println("ReservationService: getPendingDemands");
        List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING");

        return pendingReservations.stream()
                .map(this::convertToDemandDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending demands with filters
     */
    public List<DemandDTO> getPendingDemands(String role, String date) {
        System.out.println("ReservationService: getPendingDemands with filters");
        List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING");
        
        // Apply filters if provided
        if (role != null && !role.isEmpty()) {
            pendingReservations = pendingReservations.stream()
                .filter(r -> r.getUser().getRole().name().equalsIgnoreCase(role))
                .collect(Collectors.toList());
        }
        
        // Filter by date if provided (month)
        if (date != null && !date.isEmpty()) {
            // Implementation would depend on how you want to filter by date
            // This is a simple example assuming date is a month name or number
            pendingReservations = pendingReservations.stream()
                .filter(r -> {
                    SimpleDateFormat monthFormat = new SimpleDateFormat("MM");
                    String reservationMonth = monthFormat.format(r.getDate());
                    return reservationMonth.equals(date);
                })
                .collect(Collectors.toList());
        }

        return pendingReservations.stream()
                .map(this::convertToDemandDTO)
                .collect(Collectors.toList());
    }
    

   @Transactional
    public ReservationDTO approveReservation(String id) {
        System.out.println("ReservationService: approveReservation(" + id + ")");

        // Ensure settings are loaded
        if (currentSettings == null) {
            currentSettings = settingsProvider.getSettings();
        }

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        if (!"PENDING".equals(reservation.getStatus())) {
            throw new RuntimeException("Can only approve pending reservations");
        }

        reservation.setStatus("APPROVED");
        Reservation updatedReservation = reservationRepository.save(reservation);

        // Create notification for the user
        createApprovalNotification(updatedReservation);
        
        // Send email notification only if enabled in settings
        if (currentSettings.isEmailNotifications() && 
            currentSettings.isReservationApproved()) {
            boolean emailSent = reservationEmailService.sendReservationStatusEmail(updatedReservation, "APPROVED", null);
            System.out.println("Approval email sent: " + emailSent);
        }

        return convertToReservationDTO(updatedReservation);
    }

    @Transactional
    public ReservationDTO rejectReservation(String id, String reason) {
        System.out.println("ReservationService: rejectReservation(" + id + ")");

        // Ensure settings are loaded
        if (currentSettings == null) {
            currentSettings = settingsProvider.getSettings();
        }

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        if (!"PENDING".equals(reservation.getStatus())) {
            throw new RuntimeException("Can only reject pending reservations");
        }

        reservation.setStatus("REJECTED");
        // Save reason if provided
        if (reason != null && !reason.isEmpty()) {
            reservation.setNotes(reason);  // Use the notes field to store rejection reason
        }
        Reservation updatedReservation = reservationRepository.save(reservation);

        // Create notification for the user
        createRejectionNotification(updatedReservation);
        
        // Send email notification only if enabled in settings
        if (currentSettings.isEmailNotifications() && 
            currentSettings.isReservationRejected()) {
            boolean emailSent = reservationEmailService.sendReservationStatusEmail(updatedReservation, "REJECTED", reason);
            System.out.println("Rejection email sent: " + emailSent);
        }

        return convertToReservationDTO(updatedReservation);
    }

    /**
     * Cancel a reservation (can be done by user or admin)
     */
    @Transactional
    public ReservationDTO cancelReservation(String id) {
        System.out.println("ReservationService: cancelReservation(" + id + ")");

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Only pending or approved reservations can be canceled
        if (!("PENDING".equals(reservation.getStatus()) || "APPROVED".equals(reservation.getStatus()))) {
            throw new RuntimeException("Only pending or approved reservations can be canceled");
        }

        reservation.setStatus("CANCELED");
        Reservation updatedReservation = reservationRepository.save(reservation);

        // Create notification for admins
        createCancellationNotification(updatedReservation);
        
        // Create notification for the user
        createUserCancellationNotification(updatedReservation);
        
        // Send cancellation email to the user
        boolean emailSent = reservationEmailService.sendCancellationEmail(updatedReservation);
        System.out.println("Cancellation email sent: " + emailSent);

        return convertToReservationDTO(updatedReservation);
    }

    /**
     * Create a notification for the user when their reservation is approved
     */
    private void createApprovalNotification(Reservation reservation) {
        User user = reservation.getUser();

        Notification notification = new Notification();
        notification.setTitle("Reservation Approved");
       notification.setMessage("Your reservation request for "
        + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
        + " on " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
        + " from " + reservation.getStartTime() + " to " + reservation.getEndTime()
        + " has been approved.");
        notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass("fas fa-check-circle");
        notification.setIconColor("green");

        notificationRepository.save(notification);
    }

    /**
     * Create a notification for the user when their reservation is rejected
     */
    private void createRejectionNotification(Reservation reservation) {
        User user = reservation.getUser();

        Notification notification = new Notification();
        notification.setTitle("Reservation Rejected");
       notification.setMessage("Your reservation request for "
        + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
        + " on " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
        + " from " + reservation.getStartTime() + " to " + reservation.getEndTime()
        + " has been rejected."
        + (reservation.getNotes() != null && !reservation.getNotes().isEmpty() ? 
            " Reason: " + reservation.getNotes() : "")); notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass("fas fa-times-circle");
        notification.setIconColor("red");

        notificationRepository.save(notification);
    }

    /**
     * Create a notification for admins when a user cancels their reservation
     */
    private void createCancellationNotification(Reservation reservation) {
        // Find all admins
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Reservation Cancelled");
            notification.setMessage(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName()
        + " has cancelled their reservation for "
        + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
        + " on " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
        + " from " + reservation.getStartTime() + " to " + reservation.getEndTime() + "."); notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("orange");

            notificationRepository.save(notification);
        }
    }
    
    /**
     * Create a notification for the user when their reservation is cancelled
     */
    private void createUserCancellationNotification(Reservation reservation) {
        User user = reservation.getUser();

        Notification notification = new Notification();
        notification.setTitle("Reservation Cancelled");
        notification.setMessage("Your reservation for "
        + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
        + " on " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
        + " from " + reservation.getStartTime() + " to " + reservation.getEndTime()
        + " has been cancelled.");
        notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass("fas fa-calendar-times");
        notification.setIconColor("orange");

        notificationRepository.save(notification);
    }

    /**
     * Convert Reservation entity to ReservationDTO
     */
   private ReservationDTO convertToReservationDTO(Reservation reservation) {
    String roomName = reservation.getClassroom() != null
            ? reservation.getClassroom().getRoomNumber() : "N/A";

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
     * Convert Reservation entity to DemandDTO
     * Used for pending requests display in admin dashboard
     */
   private DemandDTO convertToDemandDTO(Reservation reservation) {
    String roomName = reservation.getClassroom() != null
            ? reservation.getClassroom().getRoomNumber() : "N/A";

    return DemandDTO.builder()
            .id(reservation.getId())
            .classroom(roomName)
            .reservedBy(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName())
            .role(reservation.getUser().getRole().name())
            .date(new SimpleDateFormat("yyyy-MM-dd").format(reservation.getDate()))
            .time(reservation.getStartTime() + " - " + reservation.getEndTime())
            .purpose(reservation.getPurpose())
            .notes(reservation.getNotes())
            .createdAt(reservation.getCreatedAt())
            .build();
}
}