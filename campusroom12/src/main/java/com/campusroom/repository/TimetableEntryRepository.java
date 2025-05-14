package com.campusroom.repository;

import com.campusroom.model.TimetableEntry;
import com.campusroom.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableEntryRepository extends JpaRepository<TimetableEntry, Long> {
    
    /**
     * Find timetable entries by user ID - improved query for better performance
     */
    @Query("SELECT t FROM TimetableEntry t JOIN User u ON t.id IN (SELECT te.id FROM u.timetableEntries te) WHERE u.id = :userId")
    List<TimetableEntry> findByUserId(@Param("userId") Long userId);
    
    /**
     * Alternative method that might be more efficient depending on the database schema
     */
    @Query("SELECT t FROM User u JOIN u.timetableEntries t WHERE u.id = :userId")
    List<TimetableEntry> findTimetableEntriesByUserId(@Param("userId") Long userId);
    
    /**
     * Count timetable entries for a user
     */
    @Query("SELECT COUNT(t) FROM User u JOIN u.timetableEntries t WHERE u.id = :userId")
    long countTimetableEntriesByUserId(@Param("userId") Long userId);
}