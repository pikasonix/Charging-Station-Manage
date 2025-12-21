package com.example.charging_station_management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class CorsConfig {

        @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:8080}")
        private String corsAllowedOrigins;

        private List<String> parseAllowedOrigins() {
                if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
                        return List.of();
                }
                return Arrays.stream(corsAllowedOrigins.split("[,\\s]+"))
                                .map(String::trim)
                                .filter(s -> !s.isBlank())
                                .collect(Collectors.toList());
        }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);

        config.setAllowedOrigins(parseAllowedOrigins());

        config.addAllowedHeader("*");

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type"
        ));

        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}