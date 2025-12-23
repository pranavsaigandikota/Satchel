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
        String name = jwt.getClaimAsString("name");
        String nickname = jwt.getClaimAsString("nickname");

        // Choose best display name available
        String displayName = (name != null) ? name : ((nickname != null) ? nickname : email);

        // Fallback for email if not present
        if (email == null) {
            email = sub + "@premzone.auth0";
        }

        // Try to find by email first
        Optional<AppUser> existingUser = appUserRepository.findByUsername(sub); // storing sub as username for
                                                                                // uniqueness

        AppUser user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = new AppUser();
            user.setUsername(sub); // Use Auth0 ID as username to guarantee uniqueness
            user.setCreatedAt(LocalDateTime.now());
            user.setPassword("{noop}oauth2user"); // Dummy password
        }

        // Always update details
        user.setEmail(email);
        user.setDisplayName(displayName);

        return appUserRepository.save(user);
    }
}
