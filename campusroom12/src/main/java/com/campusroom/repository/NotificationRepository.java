package com.campusroom.repository;

import com.campusroom.model.Notification;
import com.campusroom.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByUserAndReadFalse(User user);
    List<Notification> findTop10ByOrderByCreatedAtDesc();
}