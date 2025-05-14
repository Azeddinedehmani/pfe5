// src/main/java/com/campusroom/dto/BranchDTO.java
package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDTO {
    private Long id;
    private String name;
    private String description;
    private List<ClassGroupDTO> classGroups = new ArrayList<>();
    private List<UserDTO> students = new ArrayList<>();
    private String lastUpdated;
    private int studentCount;
    
    // Explicit getters and setters (in addition to @Data annotation for safety)
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public List<ClassGroupDTO> getClassGroups() {
        return classGroups;
    }
    
    public void setClassGroups(List<ClassGroupDTO> classGroups) {
        this.classGroups = classGroups;
    }
    
    public List<UserDTO> getStudents() {
        return students;
    }
    
    public void setStudents(List<UserDTO> students) {
        this.students = students;
    }
    
    public String getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public int getStudentCount() {
        return studentCount;
    }
    
    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }
    
    // Manual builder implementation as an extra precaution
    public static BranchDTOBuilder builder() {
        return new BranchDTOBuilder();
    }
    
    public static class BranchDTOBuilder {
        private Long id;
        private String name;
        private String description;
        private List<ClassGroupDTO> classGroups = new ArrayList<>();
        private List<UserDTO> students = new ArrayList<>();
        private String lastUpdated;
        private int studentCount;
        
        public BranchDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public BranchDTOBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public BranchDTOBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public BranchDTOBuilder classGroups(List<ClassGroupDTO> classGroups) {
            this.classGroups = classGroups;
            return this;
        }
        
        public BranchDTOBuilder students(List<UserDTO> students) {
            this.students = students;
            return this;
        }
        
        public BranchDTOBuilder lastUpdated(String lastUpdated) {
            this.lastUpdated = lastUpdated;
            return this;
        }
        
        public BranchDTOBuilder studentCount(int studentCount) {
            this.studentCount = studentCount;
            return this;
        }
        
        public BranchDTO build() {
            BranchDTO dto = new BranchDTO();
            dto.setId(this.id);
            dto.setName(this.name);
            dto.setDescription(this.description);
            dto.setClassGroups(this.classGroups);
            dto.setStudents(this.students);
            dto.setLastUpdated(this.lastUpdated);
            dto.setStudentCount(this.studentCount);
            return dto;
        }
    }
}