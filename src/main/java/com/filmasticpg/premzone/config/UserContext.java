package com.filmasticpg.premzone.config;

import com.filmasticpg.premzone.user.AppUser;
import com.filmasticpg.premzone.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class UserContext {

    @Autowired
    private UserService userService;

    public AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            // Fallback for non-authenticated requests (should be blocked by SecurityConfig
            // anyway, but safe for tests/startup)
            // Or throw exception if we want to be strict
            throw new RuntimeException("No authenticated user found");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        return userService.syncUser(jwt);
    }
}
