package com.campusroom.dto;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AvailabilityDTO {
    private String classroomId;
    private String date;
    private List<TimeSlotDTO> timeSlots;
    
    // Constructeur unique
    public AvailabilityDTO(String classroomId, String date, List<TimeSlotDTO> timeSlots) {
        this.classroomId = classroomId;
        this.date = date;
        this.timeSlots = timeSlots;
    }
    
    // Méthode builder explicite
    public static AvailabilityDTOBuilder builder() {
        return new AvailabilityDTOBuilder();
    }
    
    // Classe builder explicite
    public static class AvailabilityDTOBuilder {
        private String classroomId;
        private String date;
        private List<TimeSlotDTO> timeSlots;
        
        public AvailabilityDTOBuilder classroomId(String classroomId) {
            this.classroomId = classroomId;
            return this;
        }
        
        public AvailabilityDTOBuilder date(String date) {
            this.date = date;
            return this;
        }
        
        public AvailabilityDTOBuilder timeSlots(List<TimeSlotDTO> timeSlots) {
            this.timeSlots = timeSlots;
            return this;
        }
        
        public AvailabilityDTO build() {
            return new AvailabilityDTO(classroomId, date, timeSlots);
        }
    }
    
    // Getter explicite
    public List<TimeSlotDTO> getTimeSlots() {
        return this.timeSlots;
    }
    
    @Data
    @NoArgsConstructor
    public static class TimeSlotDTO {
        private String startTime;
        private String endTime;
        private boolean available;
        private String reservedBy;
        
        // Constructeur unique
        public TimeSlotDTO(String startTime, String endTime, boolean available, String reservedBy) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.available = available;
            this.reservedBy = reservedBy;
        }
        
        // Méthode builder explicite pour TimeSlotDTO
        public static TimeSlotDTOBuilder builder() {
            return new TimeSlotDTOBuilder();
        }
        
        // Classe builder explicite pour TimeSlotDTO
        public static class TimeSlotDTOBuilder {
            private String startTime;
            private String endTime;
            private boolean available;
            private String reservedBy;
            
            public TimeSlotDTOBuilder startTime(String startTime) {
                this.startTime = startTime;
                return this;
            }
            
            public TimeSlotDTOBuilder endTime(String endTime) {
                this.endTime = endTime;
                return this;
            }
            
            public TimeSlotDTOBuilder available(boolean available) {
                this.available = available;
                return this;
            }
            
            public TimeSlotDTOBuilder reservedBy(String reservedBy) {
                this.reservedBy = reservedBy;
                return this;
            }
            
            public TimeSlotDTO build() {
                return new TimeSlotDTO(startTime, endTime, available, reservedBy);
            }
        }
        
        // Getters explicites
        public String getStartTime() {
            return this.startTime;
        }
        
        public String getEndTime() {
            return this.endTime;
        }
        
        public boolean isAvailable() {
            return this.available;
        }
        
        public String getReservedBy() {
            return this.reservedBy;
        }
    }
}