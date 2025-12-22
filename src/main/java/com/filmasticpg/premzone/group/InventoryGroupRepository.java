package com.filmasticpg.premzone.group;

import com.filmasticpg.premzone.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryGroupRepository extends JpaRepository<InventoryGroup, Long> {
    // Critical for "Join Group" feature
    Optional<InventoryGroup> findByJoinCode(String joinCode);

    List<InventoryGroup> findByMembersContaining(AppUser member);
}