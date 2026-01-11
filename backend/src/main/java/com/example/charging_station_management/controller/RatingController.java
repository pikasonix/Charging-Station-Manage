package com.example.charging_station_management.controller;

import com.example.charging_station_management.dto.request.RatingRequest;
import com.example.charging_station_management.entity.converters.Rating;
import com.example.charging_station_management.service.RatingService;
import com.example.charging_station_management.utils.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final com.example.charging_station_management.repository.StationRepository stationRepository;

    @PostMapping
    public ResponseEntity<?> createRating(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody RatingRequest request) {
        try {
            Rating rating = ratingService.createRating(userDetails.getId(), request);
            
            com.example.charging_station_management.entity.converters.Station station = null;
            if (rating.getTargetType() == com.example.charging_station_management.entity.enums.TargetType.STATION) {
                 station = stationRepository.findById(rating.getTargetId()).orElse(null);
            }

            com.example.charging_station_management.dto.response.ReviewResponse response = com.example.charging_station_management.dto.response.ReviewResponse.builder()
                .id(rating.getId())
                .customerName(rating.getCustomer().getName())
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .targetName(station != null ? station.getName() : "Unknown Station")
                .targetAddress(station != null ? station.getLocation().getAddressDetail() : "")
                .build();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @GetMapping("/my-reviews")
    public ResponseEntity<Page<com.example.charging_station_management.dto.response.ReviewResponse>> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        Page<Rating> reviews = ratingService.getMyReviews(userDetails.getId(), pageable);
        
        Page<com.example.charging_station_management.dto.response.ReviewResponse> responsePage = reviews.map(rating -> {
            com.example.charging_station_management.entity.converters.Station station = null;
            if (rating.getTargetType() == com.example.charging_station_management.entity.enums.TargetType.STATION) {
                 station = stationRepository.findById(rating.getTargetId()).orElse(null);
            }
            return com.example.charging_station_management.dto.response.ReviewResponse.builder()
                .id(rating.getId())
                .customerName(rating.getCustomer().getName())
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .targetName(station != null ? station.getName() : "Unknown Station")
                .targetAddress(station != null ? station.getLocation().getAddressDetail() : "")
                .build();
        });

        return ResponseEntity.ok(responsePage);
    }
}
