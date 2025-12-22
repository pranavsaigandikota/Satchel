package com.filmasticpg.premzone.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    // Critical for Login (Spring Security)
    Optional<AppUser> findByUsername(String username);

    // Critical for Registration checks
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}