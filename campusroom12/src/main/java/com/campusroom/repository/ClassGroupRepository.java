package com.campusroom.repository;

import com.campusroom.model.ClassGroup;
import com.campusroom.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    
    // Find classes by professor
    List<ClassGroup> findByProfessor(User professor);
    @Query("SELECT cg FROM ClassGroup cg WHERE cg.professor.id = :professorId")
List<ClassGroup> findByProfessorId(@Param("professorId") Long professorId);
    // Find classes by student
    @Query("SELECT cg FROM ClassGroup cg JOIN cg.students s WHERE s.id = :studentId")
    List<ClassGroup> findByStudentId(@Param("studentId") Long studentId);
    
    // Find classes by academic year and semester
    List<ClassGroup> findByAcademicYearAndSemester(String academicYear, String semester);
    
    // Find classes by course code
    List<ClassGroup> findByCourseCode(String courseCode);
    
    // Count classes by professor
    int countByProfessor(User professor);
}