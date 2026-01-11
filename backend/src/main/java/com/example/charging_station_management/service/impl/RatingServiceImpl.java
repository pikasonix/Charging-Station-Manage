package com.example.charging_station_management.service.impl;

import com.example.charging_station_management.dto.request.RatingRequest;
import com.example.charging_station_management.entity.converters.Customer;
import com.example.charging_station_management.entity.converters.Rating;
import com.example.charging_station_management.entity.enums.TargetType;
import com.example.charging_station_management.repository.CustomerRepository;
import com.example.charging_station_management.repository.RatingRepository;
import com.example.charging_station_management.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public Rating createRating(Integer userId, RatingRequest request) {
        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getSessionId() != null) {
            if (ratingRepository.existsBySessionId(request.getSessionId())) {
                throw new RuntimeException("Bạn đã đánh giá phiên sạc này rồi.");
            }
        }

        Rating rating = new Rating();
        rating.setCustomer(customer);
        rating.setTargetType(request.getTargetType());
        rating.setTargetId(request.getTargetId());
        rating.setStars(request.getStars());
        rating.setComment(request.getComment());
        rating.setSessionId(request.getSessionId());

        return ratingRepository.save(rating);
    }

    @Override
    public Page<Rating> getMyReviews(Integer userId, Pageable pageable) {
        return ratingRepository.findByCustomer_IdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public Page<Rating> getStationReviews(Integer stationId, Pageable pageable) {
        return ratingRepository.findByTargetTypeAndTargetId(TargetType.STATION, stationId, pageable);
    }
}
