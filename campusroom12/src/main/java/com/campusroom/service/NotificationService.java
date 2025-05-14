package com.campusroom.service;

import com.campusroom.dto.NotificationDTO;
import com.campusroom.model.Notification;
import com.campusroom.model.User;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get all notifications for the current user
     */
    public List<NotificationDTO> getCurrentUserNotifications() {
        User currentUser = getCurrentUser();
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(currentUser);
        
        return notifications.stream()
                .map(this::convertToNotificationDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unread notifications for the current user
     */
    public List<NotificationDTO> getUnreadNotifications() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadFalse(currentUser);
        
        return unreadNotifications.stream()
                .map(this::convertToNotificationDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get count of unread notifications
     */
    public int getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByUserAndReadFalse(currentUser).size();
    }
    
    /**
     * Mark a notification as read
     */
    @Transactional
    public NotificationDTO markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        
        // Security check to ensure the notification belongs to the current user
        User currentUser = getCurrentUser();
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not authorized to access this notification");
        }
        
        notification.setRead(true);
        Notification savedNotification = notificationRepository.save(notification);
        
        return convertToNotificationDTO(savedNotification);
    }
    
    /**
     * Mark all notifications of the current user as read
     */
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadFalse(currentUser);
        
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
    
    /**
     * Create a notification for a specific user
     */
    @Transactional
    public NotificationDTO createNotification(Long userId, String title, String message, 
                                           String iconClass, String iconColor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass(iconClass != null ? iconClass : "fas fa-bell");
        notification.setIconColor(iconColor != null ? iconColor : "blue");
        
        Notification savedNotification = notificationRepository.save(notification);
        
        return convertToNotificationDTO(savedNotification);
    }
    
    /**
     * Create a notification for the current user
     */
    @Transactional
    public NotificationDTO createCurrentUserNotification(String title, String message,
                                                      String iconClass, String iconColor) {
        User currentUser = getCurrentUser();
        
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setUser(currentUser);
        notification.setRead(false);
        notification.setIconClass(iconClass != null ? iconClass : "fas fa-bell");
        notification.setIconColor(iconColor != null ? iconColor : "blue");
        
        Notification savedNotification = notificationRepository.save(notification);
        
        return convertToNotificationDTO(savedNotification);
    }
    
    /**
     * Create a notification for all users with a specific role
     */
    @Transactional
    public List<NotificationDTO> createRoleNotification(User.Role role, String title, String message,
                                                    String iconClass, String iconColor) {
        List<User> users = userRepository.findByRole(role);
        
        return users.stream()
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setTitle(title);
                    notification.setMessage(message);
                    notification.setUser(user);
                    notification.setRead(false);
                    notification.setIconClass(iconClass != null ? iconClass : "fas fa-bell");
                    notification.setIconColor(iconColor != null ? iconColor : "blue");
                    
                    return notificationRepository.save(notification);
                })
                .map(this::convertToNotificationDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get the current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
    
    /**
     * Convert Notification entity to DTO
     */
    private NotificationDTO convertToNotificationDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .read(notification.isRead())
                .iconClass(notification.getIconClass())
                .iconColor(notification.getIconColor())
                .timeAgo(getTimeAgo(notification.getCreatedAt()))
                .build();
    }
    
    private String getTimeAgo(Date date) {
        long minutes = Duration.between(date.toInstant(), Instant.now()).toMinutes();
        
        if (minutes < 60) {
            return minutes + " minutes ago";
        } else if (minutes < 1440) { // less than 24 hours
            return (minutes / 60) + " hours ago";
        } else {
            return (minutes / 1440) + " days ago";
        }
    }
}