package com.filmasticpg.premzone.chat.repo;

import com.filmasticpg.premzone.chat.model.ChatSession;
import com.filmasticpg.premzone.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUserOrderByCreatedAtDesc(AppUser user);
}
