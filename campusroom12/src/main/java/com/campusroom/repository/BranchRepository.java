// src/main/java/com/campusroom/repository/BranchRepository.java
package com.campusroom.repository;

import com.campusroom.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
}