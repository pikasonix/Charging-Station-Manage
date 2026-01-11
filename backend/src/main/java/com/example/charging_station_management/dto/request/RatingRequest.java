package com.example.charging_station_management.dto.request;

import com.example.charging_station_management.entity.enums.TargetType;
import lombok.Data;

@Data
public class RatingRequest {
    private TargetType targetType;
    private Integer targetId;
    private Integer sessionId;
    private Integer stars;
    private String comment;
}
