package com.project01.badmintonracketmanagement.config;

import com.project01.badmintonracketmanagement.entity.Role;
import com.project01.badmintonracketmanagement.entity.User;
import com.project01.badmintonracketmanagement.repository.auth.RoleRepository;
import com.project01.badmintonracketmanagement.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            // Ensure roles exist
            Role adminRole = roleRepository.findByNameIgnoreCase("Admin")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("Admin").build()));
            Role customerRole = roleRepository.findByNameIgnoreCase("Customer")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("Customer").build()));

            // Seed default admin if missing
            if (!userRepository.existsByUsername("admin")) {
                User admin = User.builder()
                        .username("admin")
                        .passwordHash(passwordEncoder.encode("AdminPass123!"))
                        .fullName("Quản Trị Viên Hệ Thống")
                        .email("admin@smashseo.com")
                        .phoneNumber("0788.612.979")
                        .address("409 Huỳnh Văn Bánh, P.11, Q.Phú Nhuận, TP.HCM")
                        .role(adminRole)
                        .build();
                userRepository.save(admin);
                log.info("Seeded default admin user: 'admin'");
            }

            // Seed default customer if missing
            if (!userRepository.existsByUsername("customer")) {
                User customer = User.builder()
                        .username("customer")
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .fullName("Nguyễn Văn Khách Hàng")
                        .email("customer@smashseo.com")
                        .phoneNumber("0908.123.456")
                        .address("158 Hoàng Hoa Thám, P.12, Tân Bình, TP.HCM")
                        .role(customerRole)
                        .build();
                userRepository.save(customer);
                log.info("Seeded default customer user: 'customer'");
            }
        } catch (Exception e) {
            log.warn("DataInitializer skipped or encountered an error: {}", e.getMessage());
        }
    }
}
