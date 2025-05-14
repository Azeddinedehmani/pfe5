package com.campusroom.repository;

import com.campusroom.model.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    Boolean existsByEmail(String email);
    
    List<User> findByRole(User.Role role);
    List<User> findByStatus(String status);
    int countByRole(User.Role role);
    int countByStatus(String status);
    Optional<User> findByResetToken(String resetToken);
}