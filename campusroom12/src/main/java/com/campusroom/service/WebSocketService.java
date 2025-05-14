package com.campusroom.service;

import com.campusroom.dto.SystemSettingsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        SystemSettingsDTO settings = event.getSettings();
        // Broadcast settings to all connected clients
        messagingTemplate.convertAndSend("/topic/settings", settings);
    }
}