package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

// Retirer temporairement l'annotation @Data si elle cause des problèmes
// et ajouter manuellement les getters/setters nécessaires
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    private Long id;
    private String title;
    private String message;
    private Date createdAt;
    private boolean read;
    private String iconClass;
    private String iconColor;
    private String timeAgo;
    
    // Setters manuels (pour s'assurer qu'ils sont disponibles)
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    public void setRead(boolean read) {
        this.read = read;
    }
    
    public void setIconClass(String iconClass) {
        this.iconClass = iconClass;
    }
    
    public void setIconColor(String iconColor) {
        this.iconColor = iconColor;
    }
    
    public void setTimeAgo(String timeAgo) {
        this.timeAgo = timeAgo;
    }
    
    // Getters manuels
    public Long getId() {
        return id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    public boolean isRead() {
        return read;
    }
    
    public String getIconClass() {
        return iconClass;
    }
    
    public String getIconColor() {
        return iconColor;
    }
    
    public String getTimeAgo() {
        return timeAgo;
    }
    
    // Implémentation manuelle du builder
    public static NotificationDTOBuilder builder() {
        return new NotificationDTOBuilder();
    }
    
    public static class NotificationDTOBuilder {
        private Long id;
        private String title;
        private String message;
        private Date createdAt;
        private boolean read;
        private String iconClass;
        private String iconColor;
        private String timeAgo;
        
        public NotificationDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public NotificationDTOBuilder title(String title) {
            this.title = title;
            return this;
        }
        
        public NotificationDTOBuilder message(String message) {
            this.message = message;
            return this;
        }
        
        public NotificationDTOBuilder createdAt(Date createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public NotificationDTOBuilder read(boolean read) {
            this.read = read;
            return this;
        }
        
        public NotificationDTOBuilder iconClass(String iconClass) {
            this.iconClass = iconClass;
            return this;
        }
        
        public NotificationDTOBuilder iconColor(String iconColor) {
            this.iconColor = iconColor;
            return this;
        }
        
        public NotificationDTOBuilder timeAgo(String timeAgo) {
            this.timeAgo = timeAgo;
            return this;
        }
        
        public NotificationDTO build() {
            NotificationDTO notificationDTO = new NotificationDTO();
            notificationDTO.setId(this.id);
            notificationDTO.setTitle(this.title);
            notificationDTO.setMessage(this.message);
            notificationDTO.setCreatedAt(this.createdAt);
            notificationDTO.setRead(this.read);
            notificationDTO.setIconClass(this.iconClass);
            notificationDTO.setIconColor(this.iconColor);
            notificationDTO.setTimeAgo(this.timeAgo);
            return notificationDTO;
        }
    }
}