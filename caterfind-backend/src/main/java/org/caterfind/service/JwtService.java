package org.caterfind.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.caterfind.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.expiration-minutes:60}")
    private long jwtExpirationMinutes;

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("accountStatus", user.getAccountStatus().name());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (jwtExpirationMinutes * 60 * 1000));

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return extractAllClaims(token).getSubject();
        } catch (RuntimeException ex) {
            throw new org.caterfind.exception.InvalidTokenException("Invalid JWT token: " + ex.getMessage(), ex);
        }
    }

    public Long extractUserId(String token) {
        Claims claims = null;
        try {
            claims = extractAllClaims(token);
        } catch (RuntimeException ex) {
            throw new org.caterfind.exception.InvalidTokenException("Invalid JWT token: " + ex.getMessage(), ex);
        }

        Object value = claims.get("userId");
        if (value == null) {
            throw new org.caterfind.exception.InvalidTokenException("JWT token missing userId claim");
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        if (value instanceof Long) {
            return (Long) value;
        }
        throw new org.caterfind.exception.InvalidTokenException("JWT claim 'userId' has unsupported type: " + value.getClass().getName());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public long getExpirationSeconds() {
        return jwtExpirationMinutes * 60;
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (RuntimeException ex) {
            throw new org.caterfind.exception.InvalidTokenException("Failed to parse JWT token: " + ex.getMessage(), ex);
        }
    }

    private Key getSigningKey() {
        byte[] keyBytes = decodeSecret(jwtSecret);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes (256 bits) for HS256");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] decodeSecret(String secret) {
        String normalized = secret == null ? "" : secret.trim();
        if (normalized.isEmpty()) {
            throw new IllegalStateException("JWT secret is missing. Configure security.jwt.secret");
        }

        try {
            return Decoders.BASE64.decode(normalized);
        } catch (RuntimeException ignored) {
            try {
                return Decoders.BASE64URL.decode(normalized);
            } catch (RuntimeException ignoredAgain) {
                return normalized.getBytes(StandardCharsets.UTF_8);
            }
        }
    }
}
