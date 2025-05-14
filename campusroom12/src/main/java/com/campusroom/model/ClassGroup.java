package com.campusroom.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "class_groups")
public class ClassGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @ManyToOne
@JoinColumn(name = "branch_id")
private Branch branch;

    
    @Column(nullable = false)
    private String courseCode;
    
    private String description;
    
    @Column(name = "academic_year")
    private String academicYear;
    
    @Column(name = "semester")
    private String semester;
    
    // Many-to-many relationship with students
    @ManyToMany
    @JoinTable(
        name = "class_group_students",
        joinColumns = @JoinColumn(name = "class_group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> students = new ArrayList<>();
    
    // Professor teaching this class
    @ManyToOne
    @JoinColumn(name = "professor_id")
    private User professor;
    
    // Class timetable entries
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "class_group_id")
    private List<TimetableEntry> timetableEntries = new ArrayList<>();
    
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    // Helper method to add a student to the class
    public void addStudent(User student) {
        if (student.getRole() == User.Role.STUDENT && !students.contains(student)) {
            students.add(student);
        }
    }
    
    // Helper method to remove a student from the class
    public void removeStudent(User student) {
        students.remove(student);
    }
    
    // Helper method to add a timetable entry
    public void addTimetableEntry(TimetableEntry entry) {
        timetableEntries.add(entry);
    }
    
    // Helper method to remove a timetable entry
    public void removeTimetableEntry(TimetableEntry entry) {
        timetableEntries.remove(entry);
    }

    public ClassGroup(Long id, String name, String courseCode, String description, String academicYear, String semester, User professor, Date createdAt, Date updatedAt) {
        this.id = id;
        this.name = name;
        this.courseCode = courseCode;
        this.description = description;
        this.academicYear = academicYear;
        this.semester = semester;
        this.professor = professor;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public List<User> getStudents() {
        return students;
    }

    public void setStudents(List<User> students) {
        this.students = students;
    }

    public User getProfessor() {
        return professor;
    }

    public void setProfessor(User professor) {
        this.professor = professor;
    }

    public List<TimetableEntry> getTimetableEntries() {
        return timetableEntries;
    }

    public void setTimetableEntries(List<TimetableEntry> timetableEntries) {
        this.timetableEntries = timetableEntries;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Add getter and setter
public Branch getBranch() {
    return branch;
}

public void setBranch(Branch branch) {
    this.branch = branch;
}
}