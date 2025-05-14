// src/main/java/com/campusroom/service/BranchService.java
package com.campusroom.service;

import com.campusroom.dto.BranchDTO;
import com.campusroom.dto.ClassGroupDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.model.Branch;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.User;
import com.campusroom.repository.BranchRepository;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;
    
    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get all branches with their class groups
     */
    public List<BranchDTO> getAllBranches() {
        List<Branch> branches = branchRepository.findAll();
        return branches.stream()
                .map(this::convertToBranchDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get branch by ID
     */
    public BranchDTO getBranchById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        return convertToBranchDTO(branch);
    }
    
    /**
     * Create a new branch
     */
    @Transactional
    public BranchDTO createBranch(BranchDTO branchDTO) {
        Branch branch = new Branch();
        branch.setName(branchDTO.getName());
        branch.setDescription(branchDTO.getDescription());
        
        Branch savedBranch = branchRepository.save(branch);
        return convertToBranchDTO(savedBranch);
    }
    
    /**
     * Update an existing branch
     */
    @Transactional
    public BranchDTO updateBranch(Long id, BranchDTO branchDTO) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        
        branch.setName(branchDTO.getName());
        branch.setDescription(branchDTO.getDescription());
        
        Branch updatedBranch = branchRepository.save(branch);
        return convertToBranchDTO(updatedBranch);
    }
    
    /**
     * Delete a branch
     */
    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        
        // Remove branch reference from all class groups
        for (ClassGroup classGroup : branch.getClassGroups()) {
            classGroup.setBranch(null);
            classGroupRepository.save(classGroup);
        }
        
        branchRepository.deleteById(id);
    }
    
    /**
     * Add a student to a branch
     */
    @Transactional
    public BranchDTO addStudentToBranch(Long branchId, Long studentId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + branchId));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("User with id " + studentId + " is not a student");
        }
        
        // Check if student is already in any branch
        boolean studentInOtherBranch = false;
        for (Branch otherBranch : branchRepository.findAll()) {
            if (!otherBranch.getId().equals(branchId) && 
                otherBranch.getStudents() != null &&
                otherBranch.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
                studentInOtherBranch = true;
                break;
            }
        }
        
        if (studentInOtherBranch) {
            throw new RuntimeException("Student is already assigned to another branch");
        }
        
        // Add student to branch
        if (branch.getStudents() == null) {
            branch.setStudents(new ArrayList<>());
        }
        branch.getStudents().add(student);
        Branch updatedBranch = branchRepository.save(branch);
        
        return convertToBranchDTO(updatedBranch);
    }

    /**
     * Remove a student from a branch
     */
    @Transactional
    public BranchDTO removeStudentFromBranch(Long branchId, Long studentId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + branchId));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        
        if (branch.getStudents() != null) {
            branch.getStudents().removeIf(s -> s.getId().equals(studentId));
        }
        
        Branch updatedBranch = branchRepository.save(branch);
        
        return convertToBranchDTO(updatedBranch);
    }
    
    // Helper method to convert Branch entity to DTO
    private BranchDTO convertToBranchDTO(Branch branch) {
        List<ClassGroupDTO> classGroupDTOs = branch.getClassGroups().stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
        
        List<UserDTO> studentDTOs = new ArrayList<>();
        if (branch.getStudents() != null) {
            studentDTOs = branch.getStudents().stream()
                    .map(this::convertToUserDTO)
                    .collect(Collectors.toList());
        }
        
        BranchDTO dto = new BranchDTO();
        dto.setId(branch.getId());
        dto.setName(branch.getName());
        dto.setDescription(branch.getDescription());
        dto.setClassGroups(classGroupDTOs);
        dto.setStudents(studentDTOs);
        dto.setStudentCount(studentDTOs.size());
        
        // Format last updated date
        if (branch.getUpdatedAt() != null) {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            dto.setLastUpdated(dateFormat.format(branch.getUpdatedAt()));
        }
        
        return dto;
    }
    
    // Helper method to convert ClassGroup entity to DTO (simplified)
    private ClassGroupDTO convertToClassGroupDTO(ClassGroup classGroup) {
        ClassGroupDTO dto = new ClassGroupDTO();
        dto.setId(classGroup.getId());
        dto.setName(classGroup.getName());
        dto.setCourseCode(classGroup.getCourseCode());
        dto.setDescription(classGroup.getDescription());
        dto.setAcademicYear(classGroup.getAcademicYear());
        dto.setSemester(classGroup.getSemester());
        
        if (classGroup.getProfessor() != null) {
            dto.setProfessorId(classGroup.getProfessor().getId());
            dto.setProfessorName(classGroup.getProfessor().getFirstName() + " " + classGroup.getProfessor().getLastName());
        }
        
        return dto;
    }
    
    // Helper method to convert User entity to UserDTO
    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus())
                .build();
    }
}