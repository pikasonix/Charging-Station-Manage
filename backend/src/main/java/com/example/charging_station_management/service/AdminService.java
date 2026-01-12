package com.example.charging_station_management.service;

import com.example.charging_station_management.dto.UserDto;
import com.example.charging_station_management.dto.request.DashboardResponse;
import com.example.charging_station_management.dto.request.RegisterRequest;
import com.example.charging_station_management.dto.request.RescueStationRequest;
import com.example.charging_station_management.dto.request.UserFilterRequest;
import com.example.charging_station_management.dto.response.RegisterResponse;
import com.example.charging_station_management.dto.response.StationResponse;
import com.example.charging_station_management.dto.response.ElectricVehicleResponse;
import com.example.charging_station_management.entity.converters.RescueStation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService { 

    // --- USER MANAGEMENT ---
    Page<UserDto> getUsers(UserFilterRequest request);

    void deleteUser(int userId);

    RegisterResponse createUser(RegisterRequest request);

    // --- VENDOR & CUSTOMER DETAILS ---
    Page<StationResponse> getStationsByVendor(Integer vendorId, Pageable pageable);

    Page<ElectricVehicleResponse> getVehiclesByCustomer(Integer customerId, Pageable pageable);

    // --- DASHBOARD ---
    DashboardResponse getDashboardStats();

    // --- RESCUE STATION MANAGEMENT ---

    // 1. Lấy danh sách (Có phân trang & tìm kiếm) -> THAY THẾ CHO
    // getAllRescueStations cũ
    Page<RescueStation> getRescueStations(String keyword, Pageable pageable);

    // 1b. Lấy chi tiết theo ID (Public)
    RescueStation getRescueStationById(Integer id);

    // 2. Thêm mới
    RescueStation createRescueStation(RescueStationRequest request);

    // 3. Cập nhật
    RescueStation updateRescueStation(Integer id, RescueStationRequest request);

    // 4. Xóa
    void deleteRescueStation(Integer id);
}
