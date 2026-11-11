package com.project01.badmintonracketmanagement.security;

import com.project01.badmintonracketmanagement.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetTokenService {

    private static final long EXPIRATION_MINUTES = 15;

    public record TokenInfo(String email, LocalDateTime expiryTime) {}

    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    public String createResetToken(String email) {
        String token = UUID.randomUUID().toString().replace("-", "");
        tokenStore.put(token, new TokenInfo(email, LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES)));
        return token;
    }

    public String validateAndGetEmail(String token) {
        TokenInfo tokenInfo = tokenStore.get(token);
        if (tokenInfo == null) {
            throw new BadRequestException("Invalid or non-existent reset token");
        }
        if (tokenInfo.expiryTime().isBefore(LocalDateTime.now())) {
            tokenStore.remove(token);
            throw new BadRequestException("Reset token has expired. Please request a new one");
        }
        return tokenInfo.email();
    }

    public void removeToken(String token) {
        tokenStore.remove(token);
    }
}
