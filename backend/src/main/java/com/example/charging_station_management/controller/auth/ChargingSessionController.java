package com.example.charging_station_management.controller.auth;

import com.example.charging_station_management.dto.response.ChargingSessionDetailResponse;
import com.example.charging_station_management.entity.converters.ChargingSession;
import com.example.charging_station_management.utils.CustomUserDetails;
import com.example.charging_station_management.service.ChargingSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ChargingSessionController {

    private final ChargingSessionService sessionService;

    @PostMapping("/start")
    public ResponseEntity<?> startSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Integer> request) {
        
        Integer connectorId = request.get("connectorId");
        Integer vehicleId = request.get("vehicleId");

        if (connectorId == null || vehicleId == null) {
            return ResponseEntity.badRequest().body("Connector ID và Vehicle ID là bắt buộc");
        }

        try {
            ChargingSessionDetailResponse session = sessionService.startSession(userDetails.getId(), connectorId, vehicleId);
            return ResponseEntity.ok(session);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/stop/{sessionId}")
    public ResponseEntity<?> stopSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer sessionId) {
        try {
            ChargingSessionDetailResponse session = sessionService.stopSession(userDetails.getId(), sessionId);
            return ResponseEntity.ok(session);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentSession(@AuthenticationPrincipal CustomUserDetails userDetails) {
        ChargingSessionDetailResponse session = sessionService.getCurrentSession(userDetails.getId());
        if (session == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(session);
    }

    @GetMapping("/active")
    public ResponseEntity<java.util.List<ChargingSessionDetailResponse>> getActiveSessions(@AuthenticationPrincipal CustomUserDetails userDetails) {
        java.util.List<ChargingSessionDetailResponse> sessions = sessionService.getActiveSessions(userDetails.getId());
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<ChargingSession>> getSessionHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        Page<ChargingSession> history = sessionService.getSessionHistory(userDetails.getId(), pageable);
        return ResponseEntity.ok(history);
    }
}
