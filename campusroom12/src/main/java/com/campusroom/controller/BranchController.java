// src/main/java/com/campusroom/controller/BranchController.java
package com.campusroom.controller;

import com.campusroom.dto.BranchDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.BranchService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/branches")
@PreAuthorize("hasRole('ADMIN')")
public class BranchController {

    @Autowired
    private BranchService branchService;
    
    @Autowired
    private UserManagementService userManagementService;
    
    @GetMapping
    public ResponseEntity<List<BranchDTO>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getBranchById(id));
    }
    
    @PostMapping
    public ResponseEntity<BranchDTO> createBranch(@RequestBody BranchDTO branchDTO) {
        return ResponseEntity.ok(branchService.createBranch(branchDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BranchDTO> updateBranch(
            @PathVariable Long id, 
            @RequestBody BranchDTO branchDTO) {
        return ResponseEntity.ok(branchService.updateBranch(id, branchDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
    
    /**
     * Add a student to a branch
     */
    @PostMapping("/{branchId}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchDTO> addStudentToBranch(
            @PathVariable Long branchId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(branchService.addStudentToBranch(branchId, studentId));
    }

    /**
     * Remove a student from a branch
     */
    @DeleteMapping("/{branchId}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchDTO> removeStudentFromBranch(
            @PathVariable Long branchId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(branchService.removeStudentFromBranch(branchId, studentId));
    }

    /**
     * Get students in a branch
     */
    @GetMapping("/{branchId}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<List<UserDTO>> getBranchStudents(@PathVariable Long branchId) {
        // Get the branch with its students
        BranchDTO branch = branchService.getBranchById(branchId);
        
        // Return the students list
        return ResponseEntity.ok(branch.getStudents());
    }

    /**
     * Get available students not in any branch
     */
    @GetMapping("/{branchId}/available-students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAvailableStudents(@PathVariable Long branchId) {
        // Get all students
        List<UserDTO> allStudents = userManagementService.getUsersByRole("STUDENT");
        
        // Get all students who are already in any branch
        List<Long> branchStudentIds = new ArrayList<>();
        
        // Check all branches for students
        for (BranchDTO branch : branchService.getAllBranches()) {
            if (branch.getStudents() != null) {
                branchStudentIds.addAll(branch.getStudents().stream()
                        .map(UserDTO::getId)
                        .collect(Collectors.toList()));
            }
        }
        
        // Filter out students already in branches
        List<UserDTO> availableStudents = allStudents.stream()
                .filter(student -> !branchStudentIds.contains(student.getId()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(availableStudents);
    }
}