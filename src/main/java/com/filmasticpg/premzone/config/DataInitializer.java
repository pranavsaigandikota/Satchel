package com.filmasticpg.premzone.config;

import com.filmasticpg.premzone.user.AppUser;
import com.filmasticpg.premzone.user.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(AppUserRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // Admin 1
                AppUser admin = new AppUser();
                admin.setUsername("admin");
                admin.setPassword("admin"); // Plain text for now
                admin.setEmail("admin@example.com");
                admin.setCreatedAt(LocalDateTime.now());
                repository.save(admin);

                // Admin 2
                AppUser admin2 = new AppUser();
                admin2.setUsername("admin2");
                admin2.setPassword("admin2");
                admin2.setEmail("admin2@example.com");
                admin2.setCreatedAt(LocalDateTime.now());
                repository.save(admin2);

                System.out.println("Seeded admin and admin2 users.");
            }
        };
    }
}
