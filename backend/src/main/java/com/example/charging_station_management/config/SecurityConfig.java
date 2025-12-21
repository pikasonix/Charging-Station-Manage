package com.example.charging_station_management.config;

import com.example.charging_station_management.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Quan trọng để dùng @PreAuthorize ở Controller
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:8080}")
    private String corsAllowedOrigins;

    private List<String> parseAllowedOrigins() {
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
            return List.of();
        }
        // Support comma and/or whitespace separated env values
        return Arrays.stream(corsAllowedOrigins.split("[,\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed origins are configured via env (CORS_ALLOWED_ORIGINS -> app.cors.allowed-origins)
        configuration.setAllowedOrigins(parseAllowedOrigins());

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Cho phép Options (Preflight request)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Public Auth endpoints (Login/Register)
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()

                        // 3. Authenticated Auth endpoints (Đổi pass, xem profile...)
                        // QUAN TRỌNG: Phải đặt trước wildcard /api/auth/** nếu có
                        .requestMatchers("/api/auth/me", "/api/auth/logout")
                        .permitAll()

                        .requestMatchers(
                                "/api/auth/forgot-password",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password")
                        .permitAll()

                        // 4. PUBLIC Rescue Stations (READ ONLY - no auth required)
                        .requestMatchers(HttpMethod.GET, "/api/admin/rescue-stations/**").permitAll()

                        // 5. ADMIN endpoints (Bảo vệ nghiêm ngặt nhất)
                        // POST/PUT/DELETE rescue-stations vẫn cần ADMIN vì match rule này
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/transactions/**").hasRole("ADMIN")
                        .requestMatchers("/api/stations/admin/**").hasRole("ADMIN")

                        // 5. VENDOR endpoints
                        .requestMatchers(HttpMethod.GET, "/api/stations/**").permitAll()
                        .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "VENDOR")
                        .requestMatchers("/api/vehicles/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/profile/**").authenticated()
                        .requestMatchers("/api/profiles/**").authenticated()
                        .requestMatchers("/api/vendor/**").hasRole("VENDOR")
                        // Create/Update/Delete Station cần quyền Vendor
                        .requestMatchers(HttpMethod.POST, "/api/stations").hasRole("VENDOR")
                        .requestMatchers(HttpMethod.PUT, "/api/stations/**").hasRole("VENDOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/stations/**").hasRole("VENDOR")

                        // 6. CUSTOMER endpoints
                        .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "VENDOR")

                        // 7. PUBLIC GET endpoints (Xem danh sách trạm)
                        .requestMatchers(HttpMethod.GET, "/api/stations/**").permitAll()

                        // 8. Profile endpoints
                        .requestMatchers("/api/profile/**", "/api/profiles/**").authenticated()

                        // 9. Tất cả request còn lại phải đăng nhập
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public GrantedAuthoritiesMapper grantedAuthoritiesMapper() {
        return (authorities) -> authorities.stream()
                .map(authority -> {
                    String role = authority.getAuthority();
                    // Spring Security mặc định cần prefix ROLE_
                    if (!role.startsWith("ROLE_")) {
                        return new SimpleGrantedAuthority("ROLE_" + role);
                    }
                    return authority;
                })
                .collect(Collectors.toList());
    }
}
