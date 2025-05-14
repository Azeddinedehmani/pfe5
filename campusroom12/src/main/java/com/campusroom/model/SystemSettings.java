package com.campusroom.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "system_settings")
public class SystemSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String systemName;
    private String tagline;
    private String contactEmail;
    private String supportPhone;
    
    private boolean autoApproveAdmin;
    private boolean autoApproveProfessor;
    private boolean autoApproveStudent;
    
    @Column(name = "email_notifications")
    private boolean emailNotifications;
    
    @Column(name = "notification_reservation_created")
    private boolean notificationReservationCreated;
    
    @Column(name = "notification_reservation_approved")
    private boolean notificationReservationApproved;
    
    @Column(name = "notification_reservation_rejected")
    private boolean notificationReservationRejected;
    
    @Column(name = "notification_new_user")
    private boolean notificationNewUser;
    
    @Column(name = "notification_system_updates")
    private boolean notificationSystemUpdates;
    
    @Column(name = "notification_daily_digest")
    private boolean notificationDailyDigest;
    
    @Column(name = "max_days_in_advance")
    private int maxDaysInAdvance;
    
    @Column(name = "min_time_before_reservation")
    private int minTimeBeforeReservation;
    
    @Column(name = "max_hours_per_reservation")
    private int maxHoursPerReservation;
    
    @Column(name = "max_reservations_per_week")
    private int maxReservationsPerWeek;
    
    @Column(name = "student_require_approval")
    private boolean studentRequireApproval;
    
    @Column(name = "professor_require_approval")
    private boolean professorRequireApproval;
    
    @Column(name = "show_availability_calendar")
    private boolean showAvailabilityCalendar;
    
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getSupportPhone() {
        return supportPhone;
    }

    public void setSupportPhone(String supportPhone) {
        this.supportPhone = supportPhone;
    }

    public boolean isAutoApproveAdmin() {
        return autoApproveAdmin;
    }

    public void setAutoApproveAdmin(boolean autoApproveAdmin) {
        this.autoApproveAdmin = autoApproveAdmin;
    }

    public boolean isAutoApproveProfessor() {
        return autoApproveProfessor;
    }

    public void setAutoApproveProfessor(boolean autoApproveProfessor) {
        this.autoApproveProfessor = autoApproveProfessor;
    }

    public boolean isAutoApproveStudent() {
        return autoApproveStudent;
    }

    public void setAutoApproveStudent(boolean autoApproveStudent) {
        this.autoApproveStudent = autoApproveStudent;
    }

    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public boolean isNotificationReservationCreated() {
        return notificationReservationCreated;
    }

    public void setNotificationReservationCreated(boolean notificationReservationCreated) {
        this.notificationReservationCreated = notificationReservationCreated;
    }

    public boolean isNotificationReservationApproved() {
        return notificationReservationApproved;
    }

    public void setNotificationReservationApproved(boolean notificationReservationApproved) {
        this.notificationReservationApproved = notificationReservationApproved;
    }

    public boolean isNotificationReservationRejected() {
        return notificationReservationRejected;
    }

    public void setNotificationReservationRejected(boolean notificationReservationRejected) {
        this.notificationReservationRejected = notificationReservationRejected;
    }

    public boolean isNotificationNewUser() {
        return notificationNewUser;
    }

    public void setNotificationNewUser(boolean notificationNewUser) {
        this.notificationNewUser = notificationNewUser;
    }

    public boolean isNotificationSystemUpdates() {
        return notificationSystemUpdates;
    }

    public void setNotificationSystemUpdates(boolean notificationSystemUpdates) {
        this.notificationSystemUpdates = notificationSystemUpdates;
    }

    public boolean isNotificationDailyDigest() {
        return notificationDailyDigest;
    }

    public void setNotificationDailyDigest(boolean notificationDailyDigest) {
        this.notificationDailyDigest = notificationDailyDigest;
    }

    public int getMaxDaysInAdvance() {
        return maxDaysInAdvance;
    }

    public void setMaxDaysInAdvance(int maxDaysInAdvance) {
        this.maxDaysInAdvance = maxDaysInAdvance;
    }

    public int getMinTimeBeforeReservation() {
        return minTimeBeforeReservation;
    }

    public void setMinTimeBeforeReservation(int minTimeBeforeReservation) {
        this.minTimeBeforeReservation = minTimeBeforeReservation;
    }

    public int getMaxHoursPerReservation() {
        return maxHoursPerReservation;
    }

    public void setMaxHoursPerReservation(int maxHoursPerReservation) {
        this.maxHoursPerReservation = maxHoursPerReservation;
    }

    public int getMaxReservationsPerWeek() {
        return maxReservationsPerWeek;
    }

    public void setMaxReservationsPerWeek(int maxReservationsPerWeek) {
        this.maxReservationsPerWeek = maxReservationsPerWeek;
    }

    public boolean isStudentRequireApproval() {
        return studentRequireApproval;
    }

    public void setStudentRequireApproval(boolean studentRequireApproval) {
        this.studentRequireApproval = studentRequireApproval;
    }

    public boolean isProfessorRequireApproval() {
        return professorRequireApproval;
    }

    public void setProfessorRequireApproval(boolean professorRequireApproval) {
        this.professorRequireApproval = professorRequireApproval;
    }

    public boolean isShowAvailabilityCalendar() {
        return showAvailabilityCalendar;
    }

    public void setShowAvailabilityCalendar(boolean showAvailabilityCalendar) {
        this.showAvailabilityCalendar = showAvailabilityCalendar;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
    
}