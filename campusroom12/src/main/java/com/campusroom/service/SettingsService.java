package com.campusroom.service;

import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.SystemSettings;
import com.campusroom.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    @Autowired
    private SystemSettingsProvider settingsProvider;
    
    public SystemSettingsDTO getSystemSettings() {
        return settingsProvider.getSettings();
    }
    
    @Transactional
    public SystemSettingsDTO updateSystemSettings(SystemSettingsDTO settingsDTO) {
        SystemSettings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(SystemSettings::new);
        
        // Update general settings
        settings.setSystemName(settingsDTO.getSystemName());
        settings.setTagline(settingsDTO.getTagline());
        settings.setContactEmail(settingsDTO.getContactEmail());
        settings.setSupportPhone(settingsDTO.getSupportPhone());
        settings.setAutoApproveAdmin(settingsDTO.isAutoApproveAdmin());
        settings.setAutoApproveProfessor(settingsDTO.isAutoApproveProfessor());
        settings.setAutoApproveStudent(settingsDTO.isAutoApproveStudent());
        
        // Update notification settings
        settings.setEmailNotifications(settingsDTO.isEmailNotifications());
        settings.setNotificationReservationCreated(settingsDTO.isReservationCreated());
        settings.setNotificationReservationApproved(settingsDTO.isReservationApproved());
        settings.setNotificationReservationRejected(settingsDTO.isReservationRejected());
        settings.setNotificationNewUser(settingsDTO.isNewUserRegistered());
        settings.setNotificationSystemUpdates(settingsDTO.isSystemUpdates());
        settings.setNotificationDailyDigest(settingsDTO.isDailyDigest());
        
        // Update reservation settings
        settings.setMaxDaysInAdvance(settingsDTO.getMaxDaysInAdvance());
        settings.setMinTimeBeforeReservation(settingsDTO.getMinTimeBeforeReservation());
        settings.setMaxHoursPerReservation(settingsDTO.getMaxHoursPerReservation());
        settings.setMaxReservationsPerWeek(settingsDTO.getMaxReservationsPerWeek());
        settings.setStudentRequireApproval(settingsDTO.isStudentRequireApproval());
        settings.setProfessorRequireApproval(settingsDTO.isProfessorRequireApproval());
        settings.setShowAvailabilityCalendar(settingsDTO.isShowAvailabilityCalendar());
        
        SystemSettings savedSettings = settingsRepository.save(settings);
        SystemSettingsDTO updatedSettings = convertToDTO(savedSettings);
        
        // Publish event to notify other components
        settingsProvider.publishSettingsChangedEvent(updatedSettings);
        
        return updatedSettings;
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