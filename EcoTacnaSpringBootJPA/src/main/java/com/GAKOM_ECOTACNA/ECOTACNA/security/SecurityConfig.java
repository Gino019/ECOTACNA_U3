package com.GAKOM_ECOTACNA.ECOTACNA.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @org.springframework.beans.factory.annotation.Value("${ALLOWED_ORIGINS:http://localhost:5173,http://localhost:8081,http://localhost:3000}")
    private String allowedOrigins;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                    corsConfig.setAllowedOrigins(java.util.Arrays.asList(allowedOrigins.split(",")));
                    corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    corsConfig.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "Accept"));
                    return corsConfig;
                }))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/health/**").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/registration-status/**").permitAll()
                        .requestMatchers("/api/ruc/**").permitAll()
                        .requestMatchers("/api/public/captcha/**").permitAll()
                        .requestMatchers("/api/public/plans", "/api/public/checkout/**", "/api/public/payments/simulated/**", "/api/public/landing-stats").permitAll()
                        .requestMatchers("/", "/index.html", "/dashboard.html", "/css/**", "/js/**", "/uploads/**").permitAll()

                        .requestMatchers("/api/empresa/**").hasRole("GENERADOR")
                        .requestMatchers("/api/recolector/**").hasRole("RECOLECTOR")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
