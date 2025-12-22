package com.filmasticpg.premzone.group;

import com.filmasticpg.premzone.user.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@CrossOrigin(origins = "http://localhost:5173") // Allow local React dev server
public class InventoryGroupController {

    private final InventoryGroupService inventoryGroupService;
    private final com.filmasticpg.premzone.config.UserContext userContext;

    @Autowired
    public InventoryGroupController(InventoryGroupService inventoryGroupService,
            com.filmasticpg.premzone.config.UserContext userContext) {
        this.inventoryGroupService = inventoryGroupService;
        this.userContext = userContext;
    }

    @GetMapping
    public List<InventoryGroup> getAllGroups() {
        return inventoryGroupService.getAllGroups();
    }

    @PostMapping
    public InventoryGroup createGroup(@RequestBody InventoryGroup group) {
        return inventoryGroupService.createGroup(group.getGroupName());
    }

    @GetMapping("/{id}")
    public InventoryGroup getGroup(@PathVariable Long id) {
        return inventoryGroupService.getGroupById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteGroup(@PathVariable Long id) {
        // Resolve current user from header/context
        AppUser currentUser = userContext.getCurrentUser();
        inventoryGroupService.deleteGroup(id, currentUser);
    }

    @PostMapping("/join")
    public InventoryGroup joinGroup(@RequestBody java.util.Map<String, String> payload) {
        String joinCode = payload.get("joinCode");
        return inventoryGroupService.joinGroup(joinCode);
    }
}
