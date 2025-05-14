package com.campusroom.dto;

public class TimetableEntryDTO {
    private Long id;
    private String day;
    private String name;
     private String description;
      private Long subjectId;
    private String subjectName;

    public TimetableEntryDTO(Long id, String day, String name, String description, Long subjectId, String subjectName, String instructor, String location, String startTime, String endTime, String color, String type) {
        this.id = id;
        this.day = day;
        this.name = name;
        this.description = description;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.instructor = instructor;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
        this.type = type;
    }

    
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    private String instructor;
    private String location;
    private String startTime;
    private String endTime;
    private String color;
    private String type;

    // Default constructor
    public TimetableEntryDTO() {
    }

    // Full constructor
    public TimetableEntryDTO(Long id, String day, String name, String instructor, String location,
                         String startTime, String endTime, String color, String type) {
        this.id = id;
        this.day = day;
        this.name = name;
        this.instructor = instructor;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
        this.type = type;
    }

    // Static builder method
    public static Builder builder() {
        return new Builder();
    }

    // Builder class
    public static class Builder {
        private Long id;
        private String day;
        private String name;
        private String instructor;
        private String location;
        private String startTime;
        private String endTime;
        private String color;
        private String type;
        private Long subjectId;
        private String subjectName;
        public Builder id(Long id) {
            this.id = id;
            return this;
        }
 public Builder subjectId(Long subjectId) {
            this.subjectId = subjectId;
            return this;
        }
        
        public Builder subjectName(String subjectName) {
            this.subjectName = subjectName;
            return this;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getDay() {
            return day;
        }

        public void setDay(String day) {
            this.day = day;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getInstructor() {
            return instructor;
        }

        public void setInstructor(String instructor) {
            this.instructor = instructor;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Long getSubjectId() {
            return subjectId;
        }

        public void setSubjectId(Long subjectId) {
            this.subjectId = subjectId;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }
        public Builder day(String day) {
            this.day = day;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder instructor(String instructor) {
            this.instructor = instructor;
            return this;
        }

        public Builder location(String location) {
            this.location = location;
            return this;
        }

        public Builder startTime(String startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(String endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder color(String color) {
            this.color = color;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public TimetableEntryDTO build() {
            return new TimetableEntryDTO(id, day, name, instructor, location, startTime, endTime, color, type);
        }

        public Object description(String description) {
            throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
        }
    }
  public Long getSubjectId() {
        return subjectId;
    }
    
    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }
    
    public String getSubjectName() {
        return subjectName;
    }
    
    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }
    // Getters
    public Long getId() { return id; }
    public String getDay() { return day; }
    public String getName() { return name; }
    public String getInstructor() { return instructor; }
    public String getLocation() { return location; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public String getColor() { return color; }
    public String getType() { return type; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setDay(String day) { this.day = day; }
    public void setName(String name) { this.name = name; }
    public void setInstructor(String instructor) { this.instructor = instructor; }
    public void setLocation(String location) { this.location = location; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public void setColor(String color) { this.color = color; }
    public void setType(String type) { this.type = type; }
}