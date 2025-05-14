package com.campusroom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    // Méthodes d'accès explicites
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}