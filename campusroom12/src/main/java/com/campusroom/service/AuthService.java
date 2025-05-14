package com.campusroom.service;

import com.campusroom.dto.*;
import com.campusroom.model.User;
import com.campusroom.repository.UserRepository;
import com.campusroom.security.JwtUtils;
import com.campusroom.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SystemSettingsProvider settingsProvider;
    
    private SystemSettingsDTO currentSettings;
    
    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        this.currentSettings = event.getSettings();
        logger.info("AuthService: Settings updated");
    }
    
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
    try {
        // Add this block at the start of the method before authentication
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getStatus() != null && user.getStatus().equals("inactive")) {
                return AuthResponse.builder()
                        .success(false)
                        .message("Votre compte n'est pas activé. Veuillez contacter l'administrateur.")
                        .build();
            }
        }
        
        // Continue with the existing code...
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(), 
                loginRequest.getPassword()
            )
        );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            Object principal = authentication.getPrincipal();
            logger.info("Principal class: {}", principal.getClass().getName());
            
            if (principal instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) principal;
                String jwt = jwtUtils.generateToken(userDetails);
                
                return AuthResponse.builder()
                        .token(jwt)
                        .id(userDetails.getId())
                        .firstName(userDetails.getFirstName())
                        .lastName(userDetails.getLastName())
                        .email(userDetails.getEmail())
                        .role(userDetails.getRole())
                        .success(true)
                        .build();
            } else {
                logger.warn("Principal type: {}", principal.getClass().getName());
                return AuthResponse.builder()
                        .success(false)
                        .message("Authentication error: Unknown user type")
                        .build();
            }
        } catch (BadCredentialsException e) {
            logger.error("Bad credentials: {}", e.getMessage());
            return AuthResponse.builder()
                    .success(false)
                    .message("Email ou mot de passe incorrect")
                    .build();
        } catch (Exception e) {
            logger.error("Authentication error", e);
            return AuthResponse.builder()
                    .success(false)
                    .message("Erreur d'authentification: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        logger.info("Registering user: {}", registerRequest.getEmail());
        
        // Ensure settings are loaded
        if (currentSettings == null) {
            currentSettings = settingsProvider.getSettings();
        }
        
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            logger.info("User already exists with email: {}", registerRequest.getEmail());
            return AuthResponse.builder()
                    .success(false)
                    .message("A user with this email already exists")
                    .build();
        }
        
        try {
            User user = new User();
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            
            String roleStr = registerRequest.getRole().toUpperCase();
            logger.info("Role received: {}", roleStr);
            
            try {
                User.Role userRole = User.Role.valueOf(roleStr);
                user.setRole(userRole);
                
                // Auto-approve based on settings
                if ((userRole == User.Role.ADMIN && currentSettings.isAutoApproveAdmin()) ||
                    (userRole == User.Role.PROFESSOR && currentSettings.isAutoApproveProfessor()) ||
                    (userRole == User.Role.STUDENT && currentSettings.isAutoApproveStudent())) {
                    user.setStatus("active");
                } else {
                    user.setStatus("inactive"); // Needs admin approval
                }
            } catch (IllegalArgumentException e) {
                logger.error("Invalid role: {}", roleStr);
                return AuthResponse.builder()
                        .success(false)
                        .message("Invalid role: " + registerRequest.getRole())
                        .build();
            }
            
            logger.info("Saving user: {}", user);
            userRepository.save(user);
            logger.info("User saved successfully!");
            
            // Send notification email to admins if enabled
            if (currentSettings.isEmailNotifications() && 
                currentSettings.isNewUserRegistered()) {
                notifyAdminsAboutNewUser(user);
            }
            
            return AuthResponse.builder()
                    .success(true)
                    .message("User registered successfully")
                    .build();
        } catch (Exception e) {
            logger.error("Error registering user: {}", e.getMessage(), e);
            return AuthResponse.builder()
                    .success(false)
                    .message("An error occurred during registration: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Notify admins about new user registration
     */
    private void notifyAdminsAboutNewUser(User newUser) {
        // Implementation to email admins about new user
    }
    @Transactional
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    // Générer un token unique
                    String token = UUID.randomUUID().toString();
                    
                    // Sauvegarder le token et sa date d'expiration
                    user.setResetToken(token);
                    user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 heure
                    userRepository.save(user);
                    
                    // Essayer d'envoyer un email
                    boolean emailSent = false;
                    try {
                        emailSent = emailService.sendPasswordResetEmail(user.getEmail(), token);
                    } catch (Exception e) {
                        logger.error("Failed to send email: {}", e.getMessage(), e);
                    }
                    
                    if (emailSent) {
                        return AuthResponse.builder()
                                .success(true)
                                .message("Un lien de réinitialisation a été envoyé à votre adresse email")
                                .build();
                    } else {
                        // Solution de secours : retourner directement le token
                        return AuthResponse.builder()
                                .success(true)
                                .message("Utilisez ce token pour réinitialiser votre mot de passe: " + token)
                                .build();
                    }
                })
                .orElse(AuthResponse.builder()
                        .success(false)
                        .message("Aucun compte trouvé avec cet email")
                        .build());
    }

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Les mots de passe ne correspondent pas")
                    .build();
        }
        
        return userRepository.findByResetToken(request.getToken())
                .map(user -> {
                    // Vérifier si le token a expiré
                    if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().before(new Date())) {
                        return AuthResponse.builder()
                                .success(false)
                                .message("Le token a expiré")
                                .build();
                    }
                    
                    // Mettre à jour le mot de passe et supprimer le token
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                    user.setResetToken(null);
                    user.setResetTokenExpiry(null);
                    userRepository.save(user);
                    
                    return AuthResponse.builder()
                            .success(true)
                            .message("Mot de passe réinitialisé avec succès")
                            .build();
                })
                .orElse(AuthResponse.builder()
                        .success(false)
                        .message("Token invalide")
                        .build());
    }
    
    @Transactional
    public AuthResponse resetPasswordForAllUsers() {
        try {
            List<User> allUsers = userRepository.findAll();
            int count = 0;
            int emailSentCount = 0;
            
            for (User user : allUsers) {
                String token = UUID.randomUUID().toString();
                user.setResetToken(token);
                user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 heure
                userRepository.save(user);
                count++;
                
                // Essayer d'envoyer un email
                try {
                    boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), token);
                    if (sent) {
                        emailSentCount++;
                    }
                } catch (Exception e) {
                    logger.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
                }
            }
            
            return AuthResponse.builder()
                    .success(true)
                    .message("Des liens de réinitialisation ont été envoyés à " + emailSentCount + 
                             " utilisateurs sur " + count + ". " +
                             (count > emailSentCount ? "Certains emails n'ont pas pu être envoyés." : ""))
                    .build();
        } catch (Exception e) {
            logger.error("Failed to reset passwords for all users", e);
            return AuthResponse.builder()
                    .success(false)
                    .message("Échec de la réinitialisation des mots de passe : " + e.getMessage())
                    .build();
        }
    }
    
    @Transactional
public AuthResponse changeUserStatus(Long userId, String status) {
    return userRepository.findById(userId)
            .map(user -> {
                user.setStatus(status);
                userRepository.save(user);
                
                String message = status.equals("active") 
                    ? "L'utilisateur a été activé avec succès" 
                    : "L'utilisateur a été désactivé avec succès";
                
                return AuthResponse.builder()
                        .success(true)
                        .message(message)
                        .build();
            })
            .orElse(AuthResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build());
}
    
    
}