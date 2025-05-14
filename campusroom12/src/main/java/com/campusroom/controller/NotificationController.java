package com.campusroom.controller;

import com.campusroom.dto.NotificationDTO;
import com.campusroom.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getCurrentUserNotifications() {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications());
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications());
    }
    
    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount() {
        int count = notificationService.getUnreadCount();
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Boolean>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(Map.of("success", true));
    }
}