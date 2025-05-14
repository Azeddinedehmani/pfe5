package com.campusroom.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReservationDTO {
    private String id;
    private String classroom;
    private String reservedBy;
    private String role;
    private String date;
    private String time;
    private String status;
    private String purpose;
    
    // Only keep one constructor
    public ReservationDTO(String id, String classroom, String reservedBy, String role, String date, String time, 
                         String status, String purpose) {
        this.id = id;
        this.classroom = classroom;
        this.reservedBy = reservedBy;
        this.role = role;
        this.date = date;
        this.time = time;
        this.status = status;
        this.purpose = purpose;
    }
    
    public static ReservationDTOBuilder builder() {
        return new ReservationDTOBuilder();
    }

    // Fixed implementation - return the actual field value instead of throwing exception
    public String getReservedBy() {
        return this.reservedBy;
    }

    // Fixed implementation - return the actual field value instead of throwing exception
    public String getStatus() {
        return this.status;
    }
    
    public static class ReservationDTOBuilder {
        private String id;
        private String classroom;
        private String reservedBy;
        private String role;
        private String date;
        private String time;
        private String status;
        private String purpose;
        
        ReservationDTOBuilder() {
        }
        
        public ReservationDTOBuilder id(String id) {
            this.id = id;
            return this;
        }
        
        public ReservationDTOBuilder classroom(String classroom) {
            this.classroom = classroom;
            return this;
        }
        
        public ReservationDTOBuilder reservedBy(String reservedBy) {
            this.reservedBy = reservedBy;
            return this;
        }
        
        public ReservationDTOBuilder role(String role) {
            this.role = role;
            return this;
        }
        
        public ReservationDTOBuilder date(String date) {
            this.date = date;
            return this;
        }
        
        public ReservationDTOBuilder time(String time) {
            this.time = time;
            return this;
        }
        
        public ReservationDTOBuilder status(String status) {
            this.status = status;
            return this;
        }
        
        public ReservationDTOBuilder purpose(String purpose) {
            this.purpose = purpose;
            return this;
        }
        
        public ReservationDTO build() {
            return new ReservationDTO(id, classroom, reservedBy, role, date, time, status, purpose);
        }
    }
}