package com.example.charging_station_management.repository;

import com.example.charging_station_management.entity.converters.Rating;
import com.example.charging_station_management.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Integer> {
    Page<Rating> findByTargetTypeAndTargetId(TargetType targetType, Integer targetId, Pageable pageable);

    boolean existsBySessionId(Integer sessionId);
    
    Page<Rating> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId, Pageable pageable);
}
