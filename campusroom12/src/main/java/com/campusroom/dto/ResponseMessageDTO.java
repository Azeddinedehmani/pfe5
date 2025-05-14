package com.campusroom.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ResponseMessageDTO {
    private String message;
    private boolean success;
    
    // Constructeur explicite pour les deux paramètres
    public ResponseMessageDTO(String message, boolean success) {
        this.message = message;
        this.success = success;
    }
    
    // Getters
    public String getMessage() {
        return message;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    // Setters
    public void setMessage(String message) {
        this.message = message;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
}