package com.example.charging_station_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Integer id;
    private String customerName;
    private Integer stars;
    private String comment;
    private LocalDateTime createdAt;
    private String targetName; 
    private String targetAddress;
}
