package com.campusroom.service;

import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import java.text.SimpleDateFormat;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ReservationEmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(ReservationEmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private SystemSettingsProvider settingsProvider;
    
    private SystemSettingsDTO currentSettings;
    
    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        this.currentSettings = event.getSettings();
        logger.info("ReservationEmailService: Settings updated");
    }
    
    /**
     * Send an email to a user about their reservation status update
     */
    public boolean sendReservationStatusEmail(Reservation reservation, String status, String reason) {
        // Ensure settings are loaded
        if (currentSettings == null) {
            currentSettings = settingsProvider.getSettings();
        }
        
        // Skip if email notifications are disabled
        if (!currentSettings.isEmailNotifications()) {
            logger.info("Email notifications are disabled in settings");
            return false;
        }

        try {
            User user = reservation.getUser();
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            
            String subject = "";
            String content = "";
            String roomName = reservation.getClassroom() != null ? 
        reservation.getClassroom().getRoomNumber() : "N/A";
            String dateStr = new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate());
            String timeStr = reservation.getStartTime() + " to " + reservation.getEndTime();
            
            // Use system name from settings
            String systemSignature = currentSettings.getSystemName() + " Management System";
            
            if ("APPROVED".equals(status)) {
                subject = "Your Reservation Has Been Approved";
                content = "Hello " + user.getFirstName() + ",\n\n" +
                          "We're pleased to inform you that your reservation request for " + roomName + 
                          " on " + dateStr + " from " + timeStr + " has been approved.\n\n" +
                          "Reservation Details:\n" +
                          "- Room: " + roomName + "\n" +
                          "- Date: " + dateStr + "\n" +
                          "- Time: " + timeStr + "\n" +
                          "- Purpose: " + reservation.getPurpose() + "\n\n" +
                          "Please arrive on time and ensure the room is left in good condition after use.\n\n" +
                          "Best regards,\n" + systemSignature;
            } else if ("REJECTED".equals(status)) {
                subject = "Your Reservation Has Been Declined";
                content = "Hello " + user.getFirstName() + ",\n\n" +
                          "We regret to inform you that your reservation request for " + roomName + 
                          " on " + dateStr + " from " + timeStr + " has been declined.\n\n";
                
                if (reason != null && !reason.isEmpty()) {
                    content += "Reason: " + reason + "\n\n";
                }
                
                content += "You may submit a new request for another time slot or contact the " +
                          "administrator for more information.\n\n" +
                          "Best regards,\n" + systemSignature;
            }
            
            message.setSubject(subject);
            message.setText(content);
            
            logger.info("Sending reservation status email to: {}", user.getEmail());
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", user.getEmail());
            return true;
        } catch (Exception e) {
            logger.error("Error sending reservation status email: {}", e.getMessage(), e);
            return false;
        }
    }
    
    

    /**
     * Send an email to administrators about a new reservation request
     */
    public int notifyAdminsAboutNewReservation(Reservation reservation, List<User> admins) {
        int successCount = 0;
        
        try {
            User requestingUser = reservation.getUser();
            String roomName = reservation.getClassroom() != null ? 
        reservation.getClassroom().getRoomNumber() : "N/A";
            String dateStr = new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate());
            String timeStr = reservation.getStartTime() + " to " + reservation.getEndTime();
            String userRole = requestingUser.getRole().name();
            
            for (User admin : admins) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(admin.getEmail());
                    
                    String subject = "New Reservation Request";
                    String content = "Hello " + admin.getFirstName() + ",\n\n" +
                                     "A new reservation request has been submitted with the following details:\n\n" +
                                     "Requester: " + requestingUser.getFirstName() + " " + requestingUser.getLastName() + " (" + userRole + ")\n" +
                                     "Room: " + roomName + "\n" +
                                     "Date: " + dateStr + "\n" +
                                     "Time: " + timeStr + "\n" +
                                     "Purpose: " + reservation.getPurpose() + "\n" +
                                     "Additional Notes: " + (reservation.getNotes() != null ? reservation.getNotes() : "None") + "\n\n" +
                                     "Please log in to the CampusRoom Management System to review and process this request.\n\n" +
                                     "Best regards,\nCampusRoom Management System";
                    
                    message.setSubject(subject);
                    message.setText(content);
                    
                    logger.info("Sending new reservation notification to admin: {}", admin.getEmail());
                    mailSender.send(message);
                    logger.info("Email sent successfully to admin: {}", admin.getEmail());
                    successCount++;
                } catch (Exception e) {
                    logger.error("Error sending email to admin {}: {}", admin.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error in admin notification process: {}", e.getMessage(), e);
        }
        
        return successCount;
    }
    
    /**
     * Send a notification for reservation cancellation
     */
    public boolean sendCancellationEmail(Reservation reservation) {
        try {
            User user = reservation.getUser();
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            
            String roomName = reservation.getClassroom() != null ? 
        reservation.getClassroom().getRoomNumber() : "N/A";
            String dateStr = new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate());
            String timeStr = reservation.getStartTime() + " to " + reservation.getEndTime();
            
            String subject = "Reservation Cancellation Confirmation";
            String content = "Hello " + user.getFirstName() + ",\n\n" +
                      "This is to confirm that your reservation for " + roomName + 
                      " on " + dateStr + " from " + timeStr + " has been cancelled as requested.\n\n" +
                      "If this was done in error, please submit a new reservation request.\n\n" +
                      "Best regards,\nCampusRoom Management System";
            
            message.setSubject(subject);
            message.setText(content);
            
            logger.info("Sending cancellation confirmation email to: {}", user.getEmail());
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", user.getEmail());
            return true;
        } catch (Exception e) {
            logger.error("Error sending cancellation email: {}", e.getMessage(), e);
            return false;
        }
    }
}