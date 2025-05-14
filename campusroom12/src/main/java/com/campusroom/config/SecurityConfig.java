package com.campusroom.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import com.campusroom.security.JwtAuthenticationEntryPoint;
import com.campusroom.security.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      // Update the requestMatchers in the SecurityConfig.java file as follows:

http
    .csrf(csrf -> csrf.disable())
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .headers(headers -> headers
        .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED))
        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'self'; img-src 'self' data:; script-src 'self'"))
        .frameOptions(frame -> frame.sameOrigin())
        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
    )
    .authorizeHttpRequests(auth -> 
        auth.requestMatchers("/auth/**").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight requests
            .requestMatchers("/actuator/**").permitAll()
            .requestMatchers("/public-classrooms").permitAll()
            .requestMatchers("/classrooms").permitAll()
            .requestMatchers("/api/classrooms").permitAll()
            .requestMatchers("/rooms/study-rooms").permitAll()
            .requestMatchers("/rooms/study-rooms/**").permitAll()
            .requestMatchers("/api/rooms/study-rooms").permitAll()
            .requestMatchers("/api/rooms/study-rooms/**").permitAll()
            .requestMatchers("/api/timetable/public/**").permitAll()
            .requestMatchers("/api/timetable/my-timetable").authenticated()
             .requestMatchers("/profile").authenticated()
             .requestMatchers("/profile/**").authenticated() 
             .requestMatchers("/users/profile/**").authenticated()
                // Add these new paths:
        .requestMatchers("/api/student/reservations/search").hasRole("STUDENT")
        .requestMatchers("/api/student/reservations/request").hasRole("STUDENT")
        .requestMatchers("/api/student/reservations/**").hasRole("STUDENT")
        
        // If you want to use general reservation endpoints
        .requestMatchers("/api/reservations/request").authenticated()
        .requestMatchers("/api/reservations/search").authenticated()
        .requestMatchers("/api/reservations/**").authenticated()
        
                // Add these new classroom reservation endpoints:
        .requestMatchers("/api/student/classroom-reservations/search").hasRole("STUDENT")
        .requestMatchers("/api/student/classroom-reservations/request").hasRole("STUDENT")
        .requestMatchers("/api/student/classroom-reservations/**").hasRole("STUDENT")
        
            // Fix: Add exact path mapping for /api/profile
            .requestMatchers("/api/profile").authenticated()
            // Keep the wildcard pattern for sub-paths of /api/profile/
            .requestMatchers("/api/profile/**").authenticated()
            .requestMatchers("/api/users/profile/**").authenticated()
                  .requestMatchers("/settings").permitAll()  // Added this line to allow public access to settings
                .requestMatchers("/api/settings").permitAll()  // Added this line to allow public access to API settings
                .requestMatchers("/api/settings/**").permitAll() // Also allow nested endpoints
                .requestMatchers("/ws/**").permitAll()  // WebSocket endpoint
            .anyRequest().authenticated()
    );
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    // Le reste du code reste inchangé
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowCredentials(true);
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}