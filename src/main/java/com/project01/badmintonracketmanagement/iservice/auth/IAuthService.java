package com.project01.badmintonracketmanagement.iservice.auth;

import com.project01.badmintonracketmanagement.dto.auth.AuthResponse;
import com.project01.badmintonracketmanagement.dto.auth.ForgotPasswordRequest;
import com.project01.badmintonracketmanagement.dto.auth.LoginRequest;
import com.project01.badmintonracketmanagement.dto.auth.RegisterRequest;
import com.project01.badmintonracketmanagement.dto.auth.ResetPasswordRequest;

public interface IAuthService {

    /**
     * Register a new user account
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticate user with username or email and password
     */
    AuthResponse login(LoginRequest request);

    /**
     * Request password reset token
     */
    String forgotPassword(ForgotPasswordRequest request);

    /**
     * Reset password with valid token
     */
    void resetPassword(ResetPasswordRequest request);

    /**
     * Invalidate current token and logout
     */
    void logout(String bearerToken);
}
