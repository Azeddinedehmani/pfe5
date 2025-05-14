package com.campusroom.dto;

import java.util.Date;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DemandDTO {

    private String id;
    private String classroom;
    private String reservedBy;  // Changed from requestedBy to match ReservationService conversion
    private String role;
    private String date;
    private String time;
    private String purpose;
    private String notes;       // Added missing field
    private Date createdAt;     // Added missing field

    // Updated constructor with all fields
    public DemandDTO(String id, String classroom, String reservedBy, String role,
            String date, String time, String purpose, String notes, Date createdAt) {
        this.id = id;
        this.classroom = classroom;
        this.reservedBy = reservedBy;
        this.role = role;
        this.date = date;
        this.time = time;
        this.purpose = purpose;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public static DemandDTOBuilder builder() {
        return new DemandDTOBuilder();
    }

    public static class DemandDTOBuilder {

        private String id;
        private String classroom;
        private String reservedBy;
        private String role;
        private String date;
        private String time;
        private String purpose;
        private String notes;
        private Date createdAt;

        DemandDTOBuilder() {
        }

        public DemandDTOBuilder id(String id) {
            this.id = id;
            return this;
        }

        public DemandDTOBuilder classroom(String classroom) {
            this.classroom = classroom;
            return this;
        }

        public DemandDTOBuilder reservedBy(String reservedBy) {
            this.reservedBy = reservedBy;
            return this;
        }

        public DemandDTOBuilder role(String role) {
            this.role = role;
            return this;
        }

        public DemandDTOBuilder date(String date) {
            this.date = date;
            return this;
        }

        public DemandDTOBuilder time(String time) {
            this.time = time;
            return this;
        }

        public DemandDTOBuilder purpose(String purpose) {
            this.purpose = purpose;
            return this;
        }

        public DemandDTOBuilder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public DemandDTOBuilder createdAt(Date createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public DemandDTO build() {
            return new DemandDTO(id, classroom, reservedBy, role, date, time, purpose, notes, createdAt);
        }
    }
}
