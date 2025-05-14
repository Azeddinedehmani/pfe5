package com.campusroom.service;

import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.SystemSettings;
import com.campusroom.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.context.event.ContextRefreshedEvent;

@Service
public class SystemSettingsProvider {

    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    private SystemSettingsDTO cachedSettings;
    
    // Event class for settings changes
    public static class SettingsChangedEvent {
        private final SystemSettingsDTO settings;
        
        public SettingsChangedEvent(SystemSettingsDTO settings) {
            this.settings = settings;
        }
        
        public SystemSettingsDTO getSettings() {
            return settings;
        }
    }
    
    @EventListener(ContextRefreshedEvent.class)
    public void onApplicationStart() {
        // Load settings on application startup
        refreshSettings();
    }
    
    public SystemSettingsDTO getSettings() {
        if (cachedSettings == null) {
            refreshSettings();
        }
        return cachedSettings;
    }
    
    public void refreshSettings() {
        SystemSettings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    // Create default settings if none exist
                    SystemSettings defaultSettings = new SystemSettings();
                    defaultSettings.setSystemName("Campus Room");
                    defaultSettings.setTagline("Smart Classroom Management System");
                    defaultSettings.setContactEmail("admin@campusroom.edu");
                    defaultSettings.setSupportPhone("(555) 123-4567");
                    defaultSettings.setAutoApproveAdmin(true);
                    defaultSettings.setAutoApproveProfessor(false);
                    defaultSettings.setAutoApproveStudent(false);
                    defaultSettings.setEmailNotifications(true);
                    defaultSettings.setNotificationReservationCreated(true);
                    defaultSettings.setNotificationReservationApproved(true);
                    defaultSettings.setNotificationReservationRejected(true);
                    defaultSettings.setNotificationNewUser(true);
                    defaultSettings.setNotificationSystemUpdates(true);
                    defaultSettings.setNotificationDailyDigest(false);
                    defaultSettings.setMaxDaysInAdvance(30);
                    defaultSettings.setMinTimeBeforeReservation(1);
                    defaultSettings.setMaxHoursPerReservation(4);
                    defaultSettings.setMaxReservationsPerWeek(5);
                    defaultSettings.setStudentRequireApproval(true);
                    defaultSettings.setProfessorRequireApproval(false);
                    defaultSettings.setShowAvailabilityCalendar(true);
                    return settingsRepository.save(defaultSettings);
                });
        
        // Convert to DTO
        cachedSettings = convertToDTO(settings);
    }
    
    public void publishSettingsChangedEvent(SystemSettingsDTO settings) {
        this.cachedSettings = settings;
        eventPublisher.publishEvent(new SettingsChangedEvent(settings));
    }
    
    private SystemSettingsDTO convertToDTO(SystemSettings settings) {
        return SystemSettingsDTO.builder()
                .systemName(settings.getSystemName())
                .tagline(settings.getTagline())
                .contactEmail(settings.getContactEmail())
                .supportPhone(settings.getSupportPhone())
                .autoApproveAdmin(settings.isAutoApproveAdmin())
                .autoApproveProfessor(settings.isAutoApproveProfessor())
                .autoApproveStudent(settings.isAutoApproveStudent())
                .emailNotifications(settings.isEmailNotifications())
                .reservationCreated(settings.isNotificationReservationCreated())
                .reservationApproved(settings.isNotificationReservationApproved())
                .reservationRejected(settings.isNotificationReservationRejected())
                .newUserRegistered(settings.isNotificationNewUser())
                .systemUpdates(settings.isNotificationSystemUpdates())
                .dailyDigest(settings.isNotificationDailyDigest())
                .maxDaysInAdvance(settings.getMaxDaysInAdvance())
                .minTimeBeforeReservation(settings.getMinTimeBeforeReservation())
                .maxHoursPerReservation(settings.getMaxHoursPerReservation())
                .maxReservationsPerWeek(settings.getMaxReservationsPerWeek())
                .studentRequireApproval(settings.isStudentRequireApproval())
                .professorRequireApproval(settings.isProfessorRequireApproval())
                .showAvailabilityCalendar(settings.isShowAvailabilityCalendar())
                .build();
    }
}