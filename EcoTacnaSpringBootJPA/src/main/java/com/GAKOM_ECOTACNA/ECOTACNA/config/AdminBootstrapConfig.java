package com.GAKOM_ECOTACNA.ECOTACNA.config;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Role;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "ecotacna.bootstrap.enabled", havingValue = "true")
public class AdminBootstrapConfig implements ApplicationRunner {

    @Value("${ecotacna.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${ecotacna.bootstrap.admin.password:}")
    private String adminPassword;

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminBootstrapConfig(UserRepository userRepository, CompanyRepository companyRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException(
                "Bootstrap admin activado, pero faltan ECOTACNA_BOOTSTRAP_ADMIN_EMAIL o ECOTACNA_BOOTSTRAP_ADMIN_PASSWORD."
            );
        }

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .firstName("Administrador")
                    .lastName("Sistema")
                    .role(Role.ADMIN)
                    .company(null)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
        }
    }
}
