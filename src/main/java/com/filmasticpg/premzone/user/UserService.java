package com.filmasticpg.premzone.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private AppUserRepository appUserRepository;

    public AppUser syncUser(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String sub = jwt.getSubject();
        // String nickname = jwt.getClaimAsString("nickname");

        // Fallback for email if not present
        if (email == null) {
            email = sub + "@premzone.auth0";
        }

        // Try to find by email first
        Optional<AppUser> existingUser = appUserRepository.findByUsername(sub); // storing sub as username for
                                                                                // uniqueness
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // If not found by sub, check by email (legacy) or create new
        // Note: We are now consistently using sub as username to ensure uniqueness
        // across Auth0 providers

        AppUser newUser = new AppUser();
        newUser.setUsername(sub); // Use Auth0 ID as username to guarantee uniqueness
        newUser.setEmail(email);
        newUser.setPassword("{noop}oauth2user"); // Dummy password
        newUser.setCreatedAt(LocalDateTime.now());

        return appUserRepository.save(newUser);
    }
}
