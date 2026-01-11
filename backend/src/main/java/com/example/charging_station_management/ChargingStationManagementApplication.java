package com.example.charging_station_management;

import com.example.charging_station_management.entity.converters.Admin; // Cần class Admin (như đã hướng dẫn tạo ở bước trước)
import com.example.charging_station_management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class ChargingStationManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChargingStationManagementApplication.class, args);
    }

    @PostConstruct
    public void init() {
        // Thiết lập Timezone mặc định cho toàn bộ ứng dụng
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        System.out.println("Spring Boot application running in UTC timezone: " + new Date());
        // Hoặc in ra để kiểm tra: "Asia/Ho_Chi_Minh"
    }

    // --- Thêm đoạn code này để tự tạo Admin ---
    @Bean
    CommandLineRunner createDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Kiểm tra xem admin đã có chưa (theo email)
            String adminEmail = "admin@wayo.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {

                // 2. Nếu chưa có, tạo mới
                System.out.println("----- ĐANG TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH -----");

                Admin admin = Admin.builder()
                        .name("Super Admin")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("123456")) // Mật khẩu là 123456
                        .phone("0909999999")
                        .status(1) // 1 = Active
                        .build();

                userRepository.save(admin);

                System.out.println("----- ĐÃ TẠO XONG: admin@wayo.com / 123456 -----");
            } else {
                System.out.println("----- ADMIN ĐÃ TỒN TẠI, BỎ QUA BƯỚC TẠO -----");
            }
        };
    }
}
