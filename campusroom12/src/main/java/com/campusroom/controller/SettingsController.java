package com.campusroom.controller;

import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.service.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings") // Remove the redundant /api since it's already in context-path
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;
    
    @GetMapping
    public ResponseEntity<SystemSettingsDTO> getSystemSettings() {
        return ResponseEntity.ok(settingsService.getSystemSettings());
    }
    
    @PutMapping
    public ResponseEntity<SystemSettingsDTO> updateSystemSettings(@RequestBody SystemSettingsDTO settingsDTO) {
        return ResponseEntity.ok(settingsService.updateSystemSettings(settingsDTO));
    }
}