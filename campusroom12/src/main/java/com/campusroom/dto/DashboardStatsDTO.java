package com.campusroom.dto;

import java.util.Objects;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DashboardStatsDTO {
    private int totalClassrooms;
    private int activeReservations;
    private int pendingDemands;
    private int totalUsers;
    private String classroomBreakdown;
    private String reservationBreakdown;
    
    public static DashboardStatsDTOBuilder builder() {
        return new DashboardStatsDTOBuilder();
    }

    public static class DashboardStatsDTOBuilder {
        private int totalClassrooms;
        private int activeReservations;
        private int pendingDemands;
        private int totalUsers;
        private String classroomBreakdown;
        private String reservationBreakdown;

        DashboardStatsDTOBuilder() {
        }

        public DashboardStatsDTOBuilder totalClassrooms(int totalClassrooms) {
            this.totalClassrooms = totalClassrooms;
            return this;
        }

        public DashboardStatsDTOBuilder activeReservations(int activeReservations) {
            this.activeReservations = activeReservations;
            return this;
        }

        public DashboardStatsDTOBuilder pendingDemands(int pendingDemands) {
            this.pendingDemands = pendingDemands;
            return this;
        }

        public DashboardStatsDTOBuilder totalUsers(int totalUsers) {
            this.totalUsers = totalUsers;
            return this;
        }

        public DashboardStatsDTOBuilder classroomBreakdown(String classroomBreakdown) {
            this.classroomBreakdown = classroomBreakdown;
            return this;
        }

        public DashboardStatsDTOBuilder reservationBreakdown(String reservationBreakdown) {
            this.reservationBreakdown = reservationBreakdown;
            return this;
        }

        public DashboardStatsDTO build() {
            return new DashboardStatsDTO(totalClassrooms, activeReservations, pendingDemands, totalUsers, classroomBreakdown, reservationBreakdown);
        }
    }

    public int getTotalClassrooms() {
        return totalClassrooms;
    }
    
    public void setTotalClassrooms(int totalClassrooms) {
        this.totalClassrooms = totalClassrooms;
    }
    
    public int getActiveReservations() {
        return activeReservations;
    }
    
    public void setActiveReservations(int activeReservations) {
        this.activeReservations = activeReservations;
    }
    
    public int getPendingDemands() {
        return pendingDemands;
    }
    
    public void setPendingDemands(int pendingDemands) {
        this.pendingDemands = pendingDemands;
    }
    
    public int getTotalUsers() {
        return totalUsers;
    }
    
    public void setTotalUsers(int totalUsers) {
        this.totalUsers = totalUsers;
    }
    
    public String getClassroomBreakdown() {
        return classroomBreakdown;
    }
    
    public void setClassroomBreakdown(String classroomBreakdown) {
        this.classroomBreakdown = classroomBreakdown;
    }
    
    public String getReservationBreakdown() {
        return reservationBreakdown;
    }
    
    public void setReservationBreakdown(String reservationBreakdown) {
        this.reservationBreakdown = reservationBreakdown;
    }
    
    @Override
    public String toString() {
        return "DashboardStatsDTO{" + "totalClassrooms=" + totalClassrooms + ", activeReservations=" + activeReservations + ", pendingDemands=" + pendingDemands + ", totalUsers=" + totalUsers + ", classroomBreakdown=" + classroomBreakdown + ", reservationBreakdown=" + reservationBreakdown + '}';
    }
    
    @Override
    public int hashCode() {
        int hash = 3;
        return hash;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final DashboardStatsDTO other = (DashboardStatsDTO) obj;
        if (this.totalClassrooms != other.totalClassrooms) {
            return false;
        }
        if (this.activeReservations != other.activeReservations) {
            return false;
        }
        if (this.pendingDemands != other.pendingDemands) {
            return false;
        }
        if (this.totalUsers != other.totalUsers) {
            return false;
        }
        if (!Objects.equals(this.classroomBreakdown, other.classroomBreakdown)) {
            return false;
        }
        return Objects.equals(this.reservationBreakdown, other.reservationBreakdown);
    }
   
    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
    
    public DashboardStatsDTO(int totalClassrooms, int activeReservations, int pendingDemands, int totalUsers, String classroomBreakdown, String reservationBreakdown) {
        this.totalClassrooms = totalClassrooms;
        this.activeReservations = activeReservations;
        this.pendingDemands = pendingDemands;
        this.totalUsers = totalUsers;
        this.classroomBreakdown = classroomBreakdown;
        this.reservationBreakdown = reservationBreakdown;
    }
}