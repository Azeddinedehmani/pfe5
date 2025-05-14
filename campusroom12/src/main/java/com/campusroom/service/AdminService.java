package com.campusroom.service;

import com.campusroom.dto.*;
import com.campusroom.model.*;
import com.campusroom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.text.SimpleDateFormat;

@Service
public class AdminService {

    @Autowired
    private ClassroomRepository classroomRepository;
    
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    public DashboardStatsDTO getDashboardStats() {
      
        int activeReservations = reservationRepository.countByStatus("APPROVED");
        int pendingDemands = reservationRepository.countByStatus("PENDING");
        int totalUsers = (int) userRepository.count();
        
        // Répartition des salles de classe
        int lectureHalls = classroomRepository.countByType("Lecture Hall");
        int regularClassrooms = classroomRepository.countByType("Classroom");
        int computerLabs = classroomRepository.countByType("Computer Lab");
        
        String classroomBreakdown = lectureHalls + " lecture halls, " + 
                                    regularClassrooms + " classrooms, " + 
                                    computerLabs + " labs";
        
        // Répartition des réservations
        int professorReservations = reservationRepository.countByUserRoleAndStatus(User.Role.PROFESSOR, "APPROVED");
        int studentReservations = reservationRepository.countByUserRoleAndStatus(User.Role.STUDENT, "APPROVED");
        
        String reservationBreakdown = professorReservations + " by professors, " + 
                                      studentReservations + " by students";
        
        return DashboardStatsDTO.builder()
             
                .activeReservations(activeReservations)
                .pendingDemands(pendingDemands)
                .totalUsers(totalUsers)
                .classroomBreakdown(classroomBreakdown)
                .reservationBreakdown(reservationBreakdown)
                .build();
    }
    
    /**
     * Get notifications for a specific user
     */
    public List<NotificationDTO> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        
        return notifications.stream()
                .map(this::convertToNotificationDTO)
                .collect(Collectors.toList());
    }
    
    public List<NotificationDTO> getNotifications() {
        List<Notification> notifications = notificationRepository.findTop10ByOrderByCreatedAtDesc();
        return notifications.stream()
                .map(this::convertToNotificationDTO)
                .collect(Collectors.toList());
    }
    
    public ReportDataDTO getReportsData() {
        // Stats de base
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReservations", reservationRepository.count());
        stats.put("approvedReservations", reservationRepository.countByStatus("APPROVED"));
        stats.put("pendingReservations", reservationRepository.countByStatus("PENDING"));
        stats.put("rejectedReservations", reservationRepository.countByStatus("REJECTED"));
        stats.put("professorReservations", reservationRepository.countByUserRoleAndStatus(User.Role.PROFESSOR, "APPROVED"));
        stats.put("studentReservations", reservationRepository.countByUserRoleAndStatus(User.Role.STUDENT, "APPROVED"));
        stats.put("totalClassrooms", classroomRepository.count());

        stats.put("totalUsers", userRepository.count());
        
        // Salles populaires
        List<Object[]> popularClassrooms = reservationRepository.findPopularClassrooms(PageRequest.of(0, 3));
        List<ReportDataDTO.PopularRoomDTO> popularRooms = new ArrayList<>();
        
        long totalReservations = (long) stats.get("totalReservations");
        
        for (Object[] result : popularClassrooms) {
            String room = (String) result[0];
            long count = (long) result[1];
            double percentage = (double) count / totalReservations * 100;
            
            popularRooms.add(ReportDataDTO.PopularRoomDTO.builder()
                    .room(room)
                    .count(count)
                    .percentage(percentage)
                    .build());
        }
        
      
        // Utilisateurs les plus actifs
        List<Object[]> activeUsers = reservationRepository.findMostActiveUsers(PageRequest.of(0, 5));
        List<ReportDataDTO.ActiveUserDTO> mostActiveUsers = new ArrayList<>();
        
        for (Object[] result : activeUsers) {
            Long userId = (Long) result[0];
            long count = (long) result[1];
            
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                mostActiveUsers.add(ReportDataDTO.ActiveUserDTO.builder()
                        .userId(userId.toString())
                        .userName(user.getFirstName() + " " + user.getLastName())
                        .role(user.getRole().name())
                        .count(count)
                        .build());
            }
        }
        
        // Activité mensuelle
        List<Object[]> professorActivity = reservationRepository.countReservationsByMonthAndRole(User.Role.PROFESSOR);
        List<Object[]> studentActivity = reservationRepository.countReservationsByMonthAndRole(User.Role.STUDENT);
        
        Map<Integer, Integer> professorCounts = new HashMap<>();
        for (Object[] result : professorActivity) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            professorCounts.put(month, count.intValue());
        }
        
        Map<Integer, Integer> studentCounts = new HashMap<>();
        for (Object[] result : studentActivity) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            studentCounts.put(month, count.intValue());
        }
        
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<ReportDataDTO.MonthlyActivityDTO> monthlyActivity = new ArrayList<>();
        
        for (int i = 0; i < 12; i++) {
            int monthIndex = i + 1;
            int profCount = professorCounts.getOrDefault(monthIndex, 0);
            int studCount = studentCounts.getOrDefault(monthIndex, 0);
            
            monthlyActivity.add(ReportDataDTO.MonthlyActivityDTO.builder()
                    .month(monthNames[i])
                    .professorCount(profCount)
                    .studentCount(studCount)
                    .total(profCount + studCount)
                    .build());
        }
        
        return ReportDataDTO.builder()
                .statistics(stats)
                .popularRooms(popularRooms)
                .activeUsers(mostActiveUsers)
                .monthlyActivity(monthlyActivity)
                .build();
    }
    
    private NotificationDTO convertToNotificationDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())  
                .title(notification.getTitle())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .read(notification.isRead())
                .iconClass(notification.getIconClass())
                .iconColor(notification.getIconColor())
                .timeAgo(getTimeAgo(notification.getCreatedAt()))
                .build();
    }
    
    private String getTimeAgo(Date date) {
        long minutes = Duration.between(date.toInstant(), Instant.now()).toMinutes();
        
        if (minutes < 60) {
            return minutes + " minutes ago";
        } else if (minutes < 1440) { // moins de 24 heures
            return (minutes / 60) + " hours ago";
        } else {
            return (minutes / 1440) + " days ago";
        }
    }
}