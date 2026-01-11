package com.example.charging_station_management.service;

import com.example.charging_station_management.dto.request.RatingRequest;
import com.example.charging_station_management.entity.converters.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RatingService {
    Rating createRating(Integer userId, RatingRequest request);

    Page<Rating> getMyReviews(Integer userId, Pageable pageable);

    Page<Rating> getStationReviews(Integer stationId, Pageable pageable);
}
