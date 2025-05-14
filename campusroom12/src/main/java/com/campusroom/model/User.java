package com.campusroom.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(max = 120)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 20)
    private String status;
    
    @Column(length = 100)
    private String department;
    
    @Column(length = 20)
    private String phone;

    @Column(nullable = true)
    private String resetToken;

    @Column(nullable = true)
    private Date resetTokenExpiry;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_login")
    private Date lastLogin;
    
    // New fields for student timetable data
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "user_id")
    private List<TimetableEntry> timetableEntries = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    public void setProfileImageUrl(String imageUrl) {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    public enum Role {
        ADMIN, PROFESSOR, STUDENT
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

    public String getResetToken() {
        return resetToken;
    }

    public Date getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public String getStatus() {
        return status;
    }

    public Date getLastLogin() {
        return lastLogin;
    }
    
    public List<TimetableEntry> getTimetableEntries() {
        return timetableEntries;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public String getPhone() {
        return phone;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public void setResetTokenExpiry(Date resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }
    
    public void setTimetableEntries(List<TimetableEntry> timetableEntries) {
        this.timetableEntries = timetableEntries;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    // Helper method to add a timetable entry
    public void addTimetableEntry(TimetableEntry entry) {
        timetableEntries.add(entry);
    }
    
    // Helper method to remove a timetable entry
    public void removeTimetableEntry(TimetableEntry entry) {
        timetableEntries.remove(entry);
    }
}