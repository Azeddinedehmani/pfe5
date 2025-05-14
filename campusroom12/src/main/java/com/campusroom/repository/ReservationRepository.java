package com.campusroom.repository;

import com.campusroom.model.Classroom;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, String> {
    // Méthodes de base
    List<Reservation> findByStatus(String status);
    int countByStatus(String status);
    
    // Méthodes liées à l'utilisateur
    List<Reservation> findByUser(User user);
    
    // Ajout de la méthode pour rechercher par liste de statuts
    List<Reservation> findByStatusIn(List<String> statuses);
    
    // Ajout de la méthode pour rechercher par classroom et date
    List<Reservation> findByClassroomAndDate(Classroom classroom, Date date);
    
    // Ajout de la méthode pour rechercher par classroom, date et statuts
    List<Reservation> findByClassroomAndDateAndStatusIn(Classroom classroom, Date date, List<String> statuses);
    
    // Nouvelle méthode pour rechercher par ID de salle, date et statuts
    List<Reservation> findByClassroomIdAndDateAndStatusIn(String classroomId, Date date, List<String> statuses);
    
    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId")
    List<Reservation> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.id = :userId AND r.status = :status")
    int countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.id = :userId")
    int countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.date BETWEEN :startDate AND :endDate AND r.status = :status")
    List<Reservation> findByUserIdAndDateBetweenAndStatus(
            @Param("userId") Long userId, 
            @Param("startDate") Date startDate, 
            @Param("endDate") Date endDate, 
            @Param("status") String status);
    
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.id = :userId AND r.date >= CURRENT_DATE AND r.status = 'APPROVED'")
    int countUpcomingByUserId(@Param("userId") Long userId);
    
    // Méthodes liées à la date
    List<Reservation> findByDateAndStatus(Date date, String status);
    
    @Query("SELECT r FROM Reservation r WHERE r.date = :date AND r.status != :statusToExclude")
    List<Reservation> findByDateAndStatusNot(@Param("date") Date date, @Param("statusToExclude") String statusToExclude);
    
    // Méthodes pour statistiques et rapports
    @Query("SELECT r FROM Reservation r WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<Reservation> findTop10ByStatusOrderByCreatedAtDesc(@Param("status") String status, Pageable pageable);
    
    // Méthode pour récupérer les 10 dernières réservations toutes statuts confondus
    List<Reservation> findTop10ByOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.role = :role AND r.status = :status")
    int countByUserRoleAndStatus(@Param("role") User.Role role, @Param("status") String status);
    
    @Query("SELECT r.classroom.roomNumber as room, COUNT(r) as count FROM Reservation r WHERE r.classroom IS NOT NULL GROUP BY r.classroom.roomNumber ORDER BY count DESC")
    List<Object[]> findPopularClassrooms(Pageable pageable);
    
    @Query("SELECT r.user.id as userId, COUNT(r) as count FROM Reservation r GROUP BY r.user.id ORDER BY count DESC")
    List<Object[]> findMostActiveUsers(Pageable pageable);
    
    @Query("SELECT FUNCTION('MONTH', r.date) as month, COUNT(r) as count FROM Reservation r WHERE r.user.role = :role GROUP BY FUNCTION('MONTH', r.date)")
    List<Object[]> countReservationsByMonthAndRole(@Param("role") User.Role role);
    
    public List<Reservation> findByUserAndDateBetweenAndStatusIn(User currentUser, Date weekStart, Date weekEnd, List<String> of);
}