// src/main/java/com/campusroom/model/Branch.java
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
@Table(name = "branches")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    // One-to-many relationship with class groups
    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL)
    private List<ClassGroup> classGroups = new ArrayList<>();
    
    // Many-to-many relationship with students
    @ManyToMany
    @JoinTable(
        name = "branch_students",
        joinColumns = @JoinColumn(name = "branch_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> students = new ArrayList<>();
    
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

    // Helper method to add a student to the branch
    public void addStudent(User student) {
        if (student.getRole() == User.Role.STUDENT && !students.contains(student)) {
            students.add(student);
        }
    }

    // Helper method to remove a student from the branch
    public void removeStudent(User student) {
        students.remove(student);
    }

    // Explicit getters and setters
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

    public List<ClassGroup> getClassGroups() {
        return classGroups;
    }

    public void setClassGroups(List<ClassGroup> classGroups) {
        this.classGroups = classGroups;
    }

    public List<User> getStudents() {
        return students;
    }

    public void setStudents(List<User> students) {
        this.students = students;
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
}