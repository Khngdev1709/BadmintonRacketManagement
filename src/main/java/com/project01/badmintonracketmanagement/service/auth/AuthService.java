package com.project01.badmintonracketmanagement.service.auth;

import com.project01.badmintonracketmanagement.dto.auth.AuthResponse;
import com.project01.badmintonracketmanagement.dto.auth.ForgotPasswordRequest;
import com.project01.badmintonracketmanagement.dto.auth.LoginRequest;
import com.project01.badmintonracketmanagement.dto.auth.RegisterRequest;
import com.project01.badmintonracketmanagement.dto.auth.ResetPasswordRequest;
import com.project01.badmintonracketmanagement.dto.auth.UserResponse;
import com.project01.badmintonracketmanagement.entity.Role;
import com.project01.badmintonracketmanagement.entity.User;
import com.project01.badmintonracketmanagement.exception.BadRequestException;
import com.project01.badmintonracketmanagement.exception.ResourceNotFoundException;
import com.project01.badmintonracketmanagement.iservice.auth.IAuthService;
import com.project01.badmintonracketmanagement.repository.auth.RoleRepository;
import com.project01.badmintonracketmanagement.repository.auth.UserRepository;
import com.project01.badmintonracketmanagement.security.JwtTokenProvider;
import com.project01.badmintonracketmanagement.security.PasswordResetTokenService;
import com.project01.badmintonracketmanagement.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final PasswordResetTokenService passwordResetTokenService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing registration for username: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists in the system");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use by another account");
        }

        String targetRoleName = StringUtils.hasText(request.getRoleName())
                ? request.getRoleName().trim().toUpperCase()
                : "CUSTOMER";

        Role role = findOrCreateRole(targetRoleName);

        User user = User.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .role(role)
                .build();

        user = userRepository.save(user);
        log.info("Registration successful for user ID: {}, Username: {}", user.getId(), user.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername().trim(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Processing login for: {}", request.getUsernameOrEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail().trim(), request.getUsernameOrEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        log.info("Login successful for user: {}", user.getUsername());

        return AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Forgot password requested for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String resetToken = passwordResetTokenService.createResetToken(user.getEmail());
        log.info("Reset token generated for user: {}", user.getUsername());

        return resetToken;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset with token");

        String email = passwordResetTokenService.validateAndGetEmail(request.getToken().trim());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for token"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenService.removeToken(request.getToken().trim());
        log.info("Password reset successfully for email: {}", email);
    }

    @Override
    public void logout(String bearerToken) {
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            String jwt = bearerToken.substring(7);
            if (tokenProvider.validateToken(jwt)) {
                Date expirationDate = tokenProvider.getExpirationDateFromJwt(jwt);
                tokenBlacklistService.blacklistToken(jwt, expirationDate);
                log.info("Token blacklisted successfully");
            }
        }
        SecurityContextHolder.clearContext();
    }

    private Role findOrCreateRole(String roleName) {
        String cleanName = roleName != null ? roleName.replace("ROLE_", "").trim() : "Customer";
        return roleRepository.findByNameIgnoreCase(cleanName)
                .or(() -> roleRepository.findByNameIgnoreCase("ROLE_" + cleanName))
                .or(() -> roleRepository.findByNameIgnoreCase("Customer"))
                .orElseGet(() -> {
                    log.info("Role '{}' does not exist in DB, creating new role", cleanName);
                    Role newRole = Role.builder()
                            .name(cleanName)
                            .build();
                    return roleRepository.save(newRole);
                });
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .build();
    }
}
