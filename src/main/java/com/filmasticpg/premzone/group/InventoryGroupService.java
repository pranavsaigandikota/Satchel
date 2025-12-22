package com.filmasticpg.premzone.group;

import com.filmasticpg.premzone.user.AppUser;
import com.filmasticpg.premzone.config.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryGroupService {

    private final InventoryGroupRepository inventoryGroupRepository;
    private final UserContext userContext;

    @Autowired
    public InventoryGroupService(InventoryGroupRepository inventoryGroupRepository, UserContext userContext) {
        this.inventoryGroupRepository = inventoryGroupRepository;
        this.userContext = userContext;
    }

    public List<InventoryGroup> getAllGroups() {
        AppUser currentUser = userContext.getCurrentUser();
        return inventoryGroupRepository.findByMembersContaining(currentUser);
    }

    @Transactional
    public InventoryGroup createGroup(String name) {
        InventoryGroup group = new InventoryGroup();
        group.setGroupName(name);
        // Generate a random 6-char join code
        group.setJoinCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());

        AppUser creator = userContext.getCurrentUser();
        group.setCreatedBy(creator);
        group.addMember(creator);

        return inventoryGroupRepository.save(group);
    }

    public InventoryGroup getGroupById(@org.springframework.lang.NonNull Long id) {
        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        return inventoryGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public void deleteGroup(Long groupId, AppUser currentUser) {
        InventoryGroup group = getGroupById(groupId);

        if (group.getCreatedBy().getId().equals(currentUser.getId())) {
            // Owner is deleting -> Delete entire group (Cascade deletes items)
            inventoryGroupRepository.delete(group);
        } else {
            // Member is leaving -> Remove from members list
            if (group.getMembers().contains(currentUser)) {
                group.removeMember(currentUser);
                inventoryGroupRepository.save(group);
            } else {
                throw new RuntimeException("User is not a member of this group");
            }
        }
    }

    @Transactional
    public InventoryGroup joinGroup(String joinCode) {
        // Normalize input
        String normalizedCode = joinCode != null ? joinCode.trim().toUpperCase() : "";

        InventoryGroup group = inventoryGroupRepository.findByJoinCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Group not found with code: " + normalizedCode));

        AppUser currentUser = userContext.getCurrentUser();

        boolean isMember = group.getMembers().stream()
                .anyMatch(member -> member.getId().equals(currentUser.getId()));

        if (!isMember) {
            group.addMember(currentUser);
            // Save and flush to ensure no DB constraint issues immediately (though
            // transactional handles it)
            return inventoryGroupRepository.save(group);
        }

        return group; // User already member, just return group
    }
}
