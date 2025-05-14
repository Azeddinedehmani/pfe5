package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String message;
    private boolean success;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    
    // Builder pattern manuel (au cas où Lombok ne fonctionne pas)
    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }
    
    public static class AuthResponseBuilder {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String message;
        private boolean success;
        
        public AuthResponseBuilder token(String token) {
            this.token = token;
            return this;
        }
        
        public AuthResponseBuilder type(String type) {
            this.type = type;
            return this;
        }
        
        public AuthResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public AuthResponseBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }
        
        public AuthResponseBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }
        
        public AuthResponseBuilder email(String email) {
            this.email = email;
            return this;
        }
        
        public AuthResponseBuilder role(String role) {
            this.role = role;
            return this;
        }
        
        public AuthResponseBuilder message(String message) {
            this.message = message;
            return this;
        }
        
        public AuthResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }
        
        public AuthResponse build() {
            AuthResponse response = new AuthResponse();
            response.token = this.token;
            response.type = this.type;
            response.id = this.id;
            response.firstName = this.firstName;
            response.lastName = this.lastName;
            response.email = this.email;
            response.role = this.role;
            response.message = this.message;
            response.success = this.success;
            return response;
        }
    }
}