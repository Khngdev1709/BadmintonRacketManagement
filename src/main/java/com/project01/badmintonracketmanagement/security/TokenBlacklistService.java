package com.project01.badmintonracketmanagement.security;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Map<String, Date> blacklist = new ConcurrentHashMap<>();

    public void blacklistToken(String token, Date expiryDate) {
        if (token != null && expiryDate != null) {
            blacklist.put(token, expiryDate);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        Date expiryDate = blacklist.get(token);
        if (expiryDate == null) {
            return false;
        }
        // If expired, clean it up
        if (expiryDate.before(new Date())) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }
}
