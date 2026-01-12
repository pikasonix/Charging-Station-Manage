package com.example.charging_station_management.service.impl;

import com.example.charging_station_management.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("=== START sendPasswordResetEmail ===");
        log.info("fromEmail: {}", fromEmail);
        log.info("toEmail: {}", toEmail);
        log.info("frontendUrl: {}", frontendUrl);
        
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("Email is not configured (spring.mail.username is blank). Skipping send.");
            throw new RuntimeException("Chức năng gửi email chưa được cấu hình trên server.");
        }
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            log.info("Reset URL: {}", resetUrl);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Đặt lại mật khẩu - Charging Station Management");
            message.setText(
                    "Xin chào,\n\n" +
                            "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu:\n\n" +
                            resetUrl + "\n\n" +
                            "Liên kết này sẽ hết hạn sau 1 giờ.\n\n" +
                            "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n" +
                            "Trân trọng,\n" +
                            "Charging Station Management Team"
            );

            log.info("Sending email...");
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("FAILED to send password reset email to: {}", toEmail, e);
            log.error("Error type: {}", e.getClass().getName());
            log.error("Error message: {}", e.getMessage());
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau.");
        }
    }
}