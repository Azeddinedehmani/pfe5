package com.campusroom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Date;

/**
 * Data Transfer Object for user profile information with validation
 */
public class ProfileDTO {
    private Long id;
    
    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    private String lastName;
    
    @Email(message = "Email must be valid")
    private String email; // Removed required constraint since it's set in controller
    
    private String role;
    
    @Size(max = 100, message = "Department name must not exceed 100 characters")
    private String department;
    
    // Updated regex to be more permissive for international formats
    @Pattern(regexp = "^$|^[+]?[(]?[0-9]{1,4}[)]?[-\\s./0-9]*$", 
            message = "Phone number format is invalid")
    private String phone;
    
    private Date lastLogin;
    
    // Constructors
    public ProfileDTO() {
    }
    
    public ProfileDTO(Long id, String firstName, String lastName, String email, 
                     String role, String department, String phone, Date lastLogin) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.department = department;
        this.phone = phone;
        this.lastLogin = lastLogin;
    }
    
    // Static builder method
    public static Builder builder() {
        return new Builder();
    }
    
    // Builder class
    public static class Builder {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String department;
        private String phone;
        private Date lastLogin;
        
        public Builder id(Long id) {
            this.id = id;
            return this;
        }
        
        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }
        
        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }
        
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public Builder role(String role) {
            this.role = role;
            return this;
        }
        
        public Builder department(String department) {
            this.department = department;
            return this;
        }
        
        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }
        
        public Builder lastLogin(Date lastLogin) {
            this.lastLogin = lastLogin;
            return this;
        }
        
        public ProfileDTO build() {
            return new ProfileDTO(id, firstName, lastName, email, role, department, phone, lastLogin);
        }
    }
    
    // Getters and Setters
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
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public Date getLastLogin() {
        return lastLogin;
    }
    
    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }
    
    @Override
    public String toString() {
        return "ProfileDTO{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", department='" + department + '\'' +
                ", phone='" + phone + '\'' +
                '}';
    }
}