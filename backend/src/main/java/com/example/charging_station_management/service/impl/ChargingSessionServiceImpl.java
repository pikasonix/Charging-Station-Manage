package com.example.charging_station_management.service.impl;

import com.example.charging_station_management.dto.request.ChargingSessionFilterRequest;
import com.example.charging_station_management.dto.response.ChargingSessionDetailResponse;
import com.example.charging_station_management.entity.converters.*;
import com.example.charging_station_management.repository.ChargingSessionRepository;
import com.example.charging_station_management.service.ChargingSessionService;
import com.example.charging_station_management.entity.enums.SessionStatus;
import com.example.charging_station_management.repository.specification.ChargingSessionSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class ChargingSessionServiceImpl implements ChargingSessionService {

    private final ChargingSessionRepository chargingSessionRepository;
    // Added dependencies
    private final com.example.charging_station_management.repository.ChargingConnectorRepository connectorRepository;
    private final com.example.charging_station_management.repository.ElectricVehicleRepository vehicleRepository;

    // Constants


    // Removed hardcoded PRICE_PER_KWH

    @Override
    public Page<ChargingSessionDetailResponse> getAllChargingSessions(
            ChargingSessionFilterRequest filterRequest,
            Pageable pageable) {

        Specification<ChargingSession> spec = Specification.where(null);

        if (filterRequest != null) {
            spec = spec
                    .and(ChargingSessionSpecification.withCustomerId(filterRequest.getCustomerId()))
                    .and(ChargingSessionSpecification.withVendorId(filterRequest.getVendorId()))
                    .and(ChargingSessionSpecification.withStationId(filterRequest.getStationId()))
                    .and(ChargingSessionSpecification.withStatus(filterRequest.getStatus()))
                    .and(ChargingSessionSpecification.withStatusIn(filterRequest.getStatuses()))
                    .and(ChargingSessionSpecification.withStartTimeBetween(
                            filterRequest.getStartTimeFrom(),
                            filterRequest.getStartTimeTo()))
                    .and(ChargingSessionSpecification.withEndTimeBetween(
                            filterRequest.getEndTimeFrom(),
                            filterRequest.getEndTimeTo()))
                    .and(ChargingSessionSpecification.withCustomerNameLike(filterRequest.getCustomerName()))
                    .and(ChargingSessionSpecification.withStationNameLike(filterRequest.getStationName()))
                    .and(ChargingSessionSpecification.withLicensePlateLike(filterRequest.getLicensePlate()));
        }

        Page<ChargingSession> sessions = chargingSessionRepository.findAll(spec, pageable);

        return sessions.map(this::convertToDetailResponse);
    }

    @Override
    public ChargingSessionDetailResponse getChargingSessionById(Integer sessionId) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Charging session not found with id: " + sessionId));

        return convertToDetailResponse(session);
    }

    private ChargingSessionDetailResponse convertToDetailResponse(ChargingSession session) {
        // Extract customer info - Customer extends User
        Customer customer = session.getElectricVehicle() != null ? session.getElectricVehicle().getCustomer() : null;

        // Extract other entities
        ElectricVehicle vehicle = session.getElectricVehicle();
        ChargingConnector connector = session.getChargingConnector();
        ChargingPole pole = connector != null ? connector.getPole() : null;
        Station station = pole != null ? pole.getStation() : null;
        Location location = station != null ? station.getLocation() : null;
        Vendor vendor = station != null ? station.getVendor() : null;
        Transaction transaction = session.getTransaction();

        ChargingSessionDetailResponse.builder()
                // Session info
                .sessionId(session.getId())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime());
        // Calculate provisional values for CHARGING sessions if DB values are empty
        java.math.BigDecimal energyKwh = session.getEnergyKwh();
        java.math.BigDecimal cost = session.getCost();

        if (session.getStatus() == SessionStatus.CHARGING && session.getStartTime() != null) {
            boolean hasDbValues = (energyKwh != null && energyKwh.compareTo(java.math.BigDecimal.ZERO) > 0)
                    || (cost != null && cost.compareTo(java.math.BigDecimal.ZERO) > 0);

            if (!hasDbValues) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.Duration duration = java.time.Duration.between(session.getStartTime(), now);
                long minutes = duration.toMinutes();
                if (minutes < 1) minutes = 1;

                // Dynamic Power Calculation
                java.math.BigDecimal powerKw = java.math.BigDecimal.valueOf(11); // Default 11kW
                if (session.getChargingConnector() != null && session.getChargingConnector().getMaxPower() != null) {
                    powerKw = session.getChargingConnector().getMaxPower();
                }

                java.math.BigDecimal hours = java.math.BigDecimal.valueOf(minutes)
                        .divide(java.math.BigDecimal.valueOf(60), 4, java.math.RoundingMode.HALF_UP);
                energyKwh = powerKw.multiply(hours).setScale(2, java.math.RoundingMode.HALF_UP);

                // Dynamic Price Lookup
                java.math.BigDecimal pricePerKwh = getApplicablePrice(session.getChargingConnector());
                cost = energyKwh.multiply(pricePerKwh);
            }
        }

        return ChargingSessionDetailResponse.builder()
                // Session info
                .sessionId(session.getId())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .energyKwh(energyKwh)
                .cost(cost)
                .status(session.getStatus() != null ? session.getStatus() : null)

                // Customer info (Customer IS-A User)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getName() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .customerPhone(customer != null ? customer.getPhone() : null)

                // Vehicle info
                .vehicleId(vehicle != null ? vehicle.getId() : null)
                .licensePlate(vehicle != null ? vehicle.getLicensePlate() : null)
                .vehicleBrand(vehicle != null ? vehicle.getBrand() : null)
                .vehicleModel(vehicle != null ? vehicle.getModel() : null)
                .vehicleType(vehicle != null ? vehicle.getVehicleType() : null)
                .vehicleConnectorType(vehicle != null ? vehicle.getConnectorType() : null)
                .batteryCapacity(vehicle != null ? vehicle.getBatteryCapacity() : null)

                // Station info
                .stationId(station != null ? station.getId() : null)
                .stationName(station != null ? station.getName() : null)
                .stationProvince(location != null ? location.getProvince() : null)
                .stationAddress(location != null ? location.getAddressDetail() : null)
                .vendorName(vendor != null ? vendor.getName() : null)

                // Charging pole info
                .poleId(pole != null ? pole.getId() : null)
                .poleManufacturer(pole != null ? pole.getManufacturer() : null)
                .poleMaxPower(pole != null ? pole.getMaxPower() : null)

                // Connector info
                .connectorId(connector != null ? connector.getId() : null)
                .connectorType(connector != null ? connector.getConnectorType() : null)
                .connectorMaxPower(connector != null ? connector.getMaxPower() : null)
                .connectorStatus(connector != null ? connector.getStatus() : null)

                // Transaction info
                .transactionId(transaction != null ? transaction.getId() : null)
                .paymentMethod(transaction != null && transaction.getPaymentMethod() != null
                        ? transaction.getPaymentMethod().toString()
                        : null)
                .paymentStatus(transaction != null && transaction.getPaymentStatus() != null
                        ? transaction.getPaymentStatus().toString()
                        : null)
                .paymentTime(transaction != null ? transaction.getPaymentTime() : null)
                .build();
    }

    // --- Local Implementation ---

    @Override
    @Transactional
    public ChargingSessionDetailResponse startSession(Integer userId, Integer connectorId, Integer vehicleId) {
        log.info("User {} requesting start session on connector {} with vehicle {}", userId, connectorId, vehicleId);

        // 1. Check User
        if (userId == null)
            throw new RuntimeException("User ID is required");

        // Check if user already has an active session
        ChargingSession activeSession = getCurrentSessionEntity(userId); // Use helper method
        if (activeSession != null) {
            throw new RuntimeException(
                    "Bạn đang có một phiên sạc đang diễn ra. Vui lòng kết thúc nó trước khi bắt đầu phiên mới.");
        }

        // 2. Check Connector
        com.example.charging_station_management.entity.converters.ChargingConnector connector = connectorRepository
                .findById(connectorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đầu sạc với ID: " + connectorId));

        if (connector.getStatus() != com.example.charging_station_management.entity.enums.ConnectorStatus.AVAILABLE) {
            throw new RuntimeException("Đầu sạc này đang bận hoặc bảo trì.");
        }

        // Check if connector has a valid price configured
        java.math.BigDecimal applicablePrice = getApplicablePrice(connector);
        if (applicablePrice.compareTo(java.math.BigDecimal.ZERO) == 0) {
            throw new RuntimeException("Chân sạc này chưa được cấu hình giá, không thể sạc.");
        }

        // 3. Check Vehicle
        com.example.charging_station_management.entity.converters.ElectricVehicle vehicle = vehicleRepository
                .findByIdAndCustomerId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Xe không tồn tại hoặc không thuộc về bạn."));

        // 4. Create Session
        ChargingSession session = new ChargingSession();
        session.setChargingConnector(connector);
        session.setElectricVehicle(vehicle);
        session.setStartTime(java.time.LocalDateTime.now());
        session.setStatus(SessionStatus.CHARGING);
        session.setEnergyKwh(java.math.BigDecimal.ZERO);
        session.setCost(java.math.BigDecimal.ZERO);

        // 5. Update Connector
        connector.setStatus(com.example.charging_station_management.entity.enums.ConnectorStatus.INUSE);
        connectorRepository.save(connector);
        ChargingSession savedSession = chargingSessionRepository.save(session);
        return convertToDetailResponse(savedSession);
    }

    @Override
    @Transactional
    public ChargingSessionDetailResponse stopSession(Integer userId, Integer sessionId) {
        log.info("User {} requesting stop session {}", userId, sessionId);

        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Phiên sạc không tồn tại"));

        // 1. Validate Owner
        if (session.getElectricVehicle().getCustomer().getId() != userId) {
            throw new RuntimeException("Bạn không có quyền dừng phiên sạc này.");
        }

        if (session.getStatus() != SessionStatus.CHARGING) {
            throw new RuntimeException("Phiên sạc này đã kết thúc hoặc chưa bắt đầu.");
        }

        // 2. Calculate
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        session.setEndTime(now);

        java.time.Duration duration = java.time.Duration.between(session.getStartTime(), now);
        long minutes = duration.toMinutes();
        if (minutes < 1)
            minutes = 1;

        // Dynamic Power Calculation (match getCurrentSession logic)
        java.math.BigDecimal powerKw = java.math.BigDecimal.valueOf(11); // Default 11kW
        if (session.getChargingConnector() != null && session.getChargingConnector().getMaxPower() != null) {
            powerKw = session.getChargingConnector().getMaxPower();
        }

        java.math.BigDecimal hours = java.math.BigDecimal.valueOf(minutes).divide(java.math.BigDecimal.valueOf(60), 4,
                java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal energy = powerKw.multiply(hours).setScale(2, java.math.RoundingMode.HALF_UP);
        
        // Dynamic Price Lookup
        java.math.BigDecimal pricePerKwh = getApplicablePrice(session.getChargingConnector());
        java.math.BigDecimal cost = energy.multiply(pricePerKwh);

        session.setEnergyKwh(energy);
        session.setCost(cost);
        session.setStatus(SessionStatus.COMPLETED);

        // 3. Free Connector
        com.example.charging_station_management.entity.converters.ChargingConnector connector = session
                .getChargingConnector();
        connector.setStatus(com.example.charging_station_management.entity.enums.ConnectorStatus.AVAILABLE);
        connectorRepository.save(connector);

        ChargingSession savedSession = chargingSessionRepository.save(session);
        return convertToDetailResponse(savedSession);
    }

    @Override
    public ChargingSessionDetailResponse getCurrentSession(Integer userId) {
        ChargingSession currentSession = getCurrentSessionEntity(userId);
        if (currentSession != null) {
            return convertToDetailResponse(currentSession);
        }
        return null;
    }

    private ChargingSession getCurrentSessionEntity(Integer userId) {
        // Updated implementation: Get the latest ACTIVE session to support multiple
        // sessions
        // Returns the most recently started session that is still CHARGING
        java.util.List<ChargingSession> activeSessions = chargingSessionRepository
                .findByElectricVehicle_Customer_IdAndStatusOrderByStartTimeDesc(userId, SessionStatus.CHARGING);

        if (!activeSessions.isEmpty()) {
            ChargingSession currentSession = activeSessions.get(0);

            // Logic priority:
            // 1. If DB has values (simulated by external tool or real hardware), use them.
            // 2. If DB is 0 (default), calculate provisional based on time.

            boolean hasDbValues = (currentSession.getEnergyKwh() != null
                    && currentSession.getEnergyKwh().compareTo(java.math.BigDecimal.ZERO) > 0)
                    || (currentSession.getCost() != null
                            && currentSession.getCost().compareTo(java.math.BigDecimal.ZERO) > 0);

            if (!hasDbValues) {
                // Calculate provisional values for display
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (currentSession.getStartTime() != null) {
                    java.time.Duration duration = java.time.Duration.between(currentSession.getStartTime(), now);
                    long minutes = duration.toMinutes();

                    if (minutes < 1)
                        minutes = 1;

                    // Dynamic Power Calculation
                    java.math.BigDecimal powerKw = java.math.BigDecimal.valueOf(11); // Default 11kW
                    if (currentSession.getChargingConnector() != null
                            && currentSession.getChargingConnector().getMaxPower() != null) {
                        powerKw = currentSession.getChargingConnector().getMaxPower();
                    }

                    // Energy = Power (kW) * Time (hours)
                    // Time (hours) = minutes / 60
                    java.math.BigDecimal hours = java.math.BigDecimal.valueOf(minutes)
                            .divide(java.math.BigDecimal.valueOf(60), 4, java.math.RoundingMode.HALF_UP);
                    java.math.BigDecimal energy = powerKw.multiply(hours).setScale(2, java.math.RoundingMode.HALF_UP);

                    // Dynamic Price Lookup
                    java.math.BigDecimal pricePerKwh = getApplicablePrice(currentSession.getChargingConnector());
                    java.math.BigDecimal cost = energy.multiply(pricePerKwh);

                    currentSession.setEnergyKwh(energy);
                    currentSession.setCost(cost);
                }
            }

            return currentSession;
        }
        return null;
    }

    @Override
    public Page<ChargingSession> getSessionHistory(Integer userId, Pageable pageable) {
        return chargingSessionRepository.findByElectricVehicle_Customer_IdOrderByStartTimeDesc(userId, pageable);
    }

    @Override
    public java.util.List<ChargingSessionDetailResponse> getActiveSessions(Integer userId) {
        java.util.List<ChargingSession> activeSessions = chargingSessionRepository
                .findByElectricVehicle_Customer_IdAndStatusOrderByStartTimeDesc(userId, SessionStatus.CHARGING);

        java.util.List<ChargingSessionDetailResponse> responseList = new java.util.ArrayList<>();

        for (ChargingSession session : activeSessions) {
            boolean hasDbValues = (session.getEnergyKwh() != null
                    && session.getEnergyKwh().compareTo(java.math.BigDecimal.ZERO) > 0)
                    || (session.getCost() != null && session.getCost().compareTo(java.math.BigDecimal.ZERO) > 0);

            if (!hasDbValues && session.getStartTime() != null) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.Duration duration = java.time.Duration.between(session.getStartTime(), now);
                long minutes = duration.toMinutes();

                if (minutes < 1)
                    minutes = 1;

                // Dynamic Power Calculation
                java.math.BigDecimal powerKw = java.math.BigDecimal.valueOf(11); // Default 11kW
                if (session.getChargingConnector() != null && session.getChargingConnector().getMaxPower() != null) {
                    powerKw = session.getChargingConnector().getMaxPower();
                }

                java.math.BigDecimal hours = java.math.BigDecimal.valueOf(minutes)
                        .divide(java.math.BigDecimal.valueOf(60), 4, java.math.RoundingMode.HALF_UP);
                java.math.BigDecimal energy = powerKw.multiply(hours).setScale(2, java.math.RoundingMode.HALF_UP);
                
                // Dynamic Price Lookup
                java.math.BigDecimal pricePerKwh = getApplicablePrice(session.getChargingConnector());
                java.math.BigDecimal cost = energy.multiply(pricePerKwh);

                session.setEnergyKwh(energy);
                session.setCost(cost);
            }
            responseList.add(convertToDetailResponse(session));
        }
        return responseList;
    }

    /**
     * Finds the applicable price for the given connector based on current time.
     * Searches in the associated ChargingPole's price list.
     */
    private java.math.BigDecimal getApplicablePrice(ChargingConnector connector) {
        if (connector == null || connector.getPole() == null) {
            return java.math.BigDecimal.ZERO; // Default if no info
        }

        java.util.List<Price> prices = connector.getPole().getPrices();
        if (prices == null || prices.isEmpty()) {
            return java.math.BigDecimal.ZERO; // or default system price
        }
        
        // Sort prices by effectiveFrom DESC to prioritize latest price configuration
        prices.sort((p1, p2) -> {
            if (p1.getEffectiveFrom() == null) return 1;
            if (p2.getEffectiveFrom() == null) return -1;
            return p2.getEffectiveFrom().compareTo(p1.getEffectiveFrom());
        });

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalTime currentTime = now.toLocalTime();
        java.time.LocalDate currentDate = now.toLocalDate();

        for (Price price : prices) {
            // Filter: Only consider CHARGING prices
            if (price.getName() != com.example.charging_station_management.entity.enums.PriceName.CHARGING) {
                continue;
            }

            // Check Date Range (EffectiveFrom <= Today <= EffectiveTo)
            boolean isDateValid = !currentDate.isBefore(price.getEffectiveFrom())
                    && (price.getEffectiveTo() == null || !currentDate.isAfter(price.getEffectiveTo()));

            if (isDateValid) {
                // Check Time Range (StartTime <= Now <= EndTime)
                // Assuming start <= end for same day logic. If overlap midnight, logic needs complexity,
                // but usually Time of Use is within day bounds or split.
                boolean isTimeValid = !currentTime.isBefore(price.getStartTime())
                        && !currentTime.isAfter(price.getEndTime());

                if (isTimeValid) {
                    return price.getPrice();
                }
            }
        }

        // Fallback: If no time-specific price found, maybe pick first or return 0
        // Ideally logged or default.
        return prices.get(0).getPrice(); // Return first price as fallback
    }
}
