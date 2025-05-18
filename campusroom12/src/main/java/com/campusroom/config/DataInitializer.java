package com.campusroom.config;

import com.campusroom.model.User;
import com.campusroom.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Only initialize if no users exist
            if (userRepository.count() == 0) {
                log.info("No users found, initializing default users");
                
                // Admin user
                User admin = new User();
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setEmail("admin@example.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                
                // Professor user
                User professor = new User();
                professor.setFirstName("Professor");
                professor.setLastName("Smith");
                professor.setEmail("professor@example.com");
                professor.setPassword(passwordEncoder.encode("prof123"));
                professor.setRole(User.Role.PROFESSOR);
                userRepository.save(professor);
                
                // Student user
                User student = new User();
                student.setFirstName("Student");
                student.setLastName("Jones");
                student.setEmail("student@example.com");
                student.setPassword(passwordEncoder.encode("student123")); // Fixed this line
                student.setRole(User.Role.STUDENT);
                userRepository.save(student);
                
                log.info("Default users created successfully");
            }
        };
    }
}