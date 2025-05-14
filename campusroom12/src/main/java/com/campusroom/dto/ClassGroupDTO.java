package com.campusroom.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassGroupDTO {
    private Long id;
    private String name;
    private Long branchId;
    private String branchName;
    private String courseCode;
    private String description;
    private String academicYear;
    private String semester;
    private Long professorId;
    private String professorName;
    
    @Builder.Default
    private List<UserDTO> students = new ArrayList<>();
    
    @Builder.Default
    private List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
    
    // Additional fields for UI display
    private int studentCount;
    private String lastUpdated;

    public ClassGroupDTO(Long id, String name, String courseCode, String description, String academicYear, String semester, Long professorId, String professorName, int studentCount, String lastUpdated) {
        this.id = id;
        this.name = name;
        this.courseCode = courseCode;
        this.description = description;
        this.academicYear = academicYear;
        this.semester = semester;
        this.professorId = professorId;
        this.professorName = professorName;
        this.studentCount = studentCount;
        this.lastUpdated = lastUpdated;
    }

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

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public void setProfessorId(Long professorId) {
        this.professorId = professorId;
    }

    public String getProfessorName() {
        return professorName;
    }

    public void setProfessorName(String professorName) {
        this.professorName = professorName;
    }

    public List<UserDTO> getStudents() {
        return students;
    }

    public void setStudents(List<UserDTO> students) {
        this.students = students;
    }

    public List<TimetableEntryDTO> getTimetableEntries() {
        return timetableEntries;
    }

    public void setTimetableEntries(List<TimetableEntryDTO> timetableEntries) {
        this.timetableEntries = timetableEntries;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }
}