package com.filmasticpg.premzone.item;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/items")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @Autowired
    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    @GetMapping("/group/{groupId}")
    public List<InventoryItem> getItemsByGroup(@PathVariable Long groupId) {
        return inventoryItemService.getItemsByGroup(groupId);
    }

    @GetMapping("/search")
    public List<InventoryItem> search(@RequestParam String q) {
        return inventoryItemService.globalSearch(q);
    }

    // Creating polymorphic items is complex via JSON.
    // For now, simpler approach: Assume generic 'FoodItem' or similar structure for
    // 'InventoryItem' DTO
    // We will revisit polymorphic deserialization if needed.
    // Simplifying: The user just wants to "add". We'll default to FoodItem for now
    // or generic InventoryItem if not abstract.
    // Wait, InventoryItem is abstract. We MUST instantiate a concrete class.
    // Current Frontend sends: name, category (string), quantity, expiryDate.
    // This looks like FoodItem (Expirable).

    @PostMapping("/group/{groupId}")
    public InventoryItem addItem(@PathVariable Long groupId, @RequestBody Map<String, Object> payload) {
        String type = (String) payload.getOrDefault("type", "Food");
        String name = (String) payload.get("name");
        String catName = (String) payload.get("category");
        Integer quantity = Integer.valueOf(payload.get("quantity").toString());

        InventoryItem item;

        switch (type) {
            case "Electronics":
                ElectronicItem eItem = new ElectronicItem();
                String condition = (String) payload.get("condition");
                if (condition != null) {
                    eItem.setCondition(ItemCondition.valueOf(condition));
                }
                item = eItem;
                break;
            case "Medical":
                MedicalItem mItem = new MedicalItem();
                String mExpiry = (String) payload.get("expiryDate");
                if (mExpiry != null && !mExpiry.isEmpty()) {
                    mItem.setExpiryDate(java.time.LocalDate.parse(mExpiry));
                }
                item = mItem;
                break;
            case "Pantry":
                PantryItem pItem = new PantryItem();
                String pExpiry = (String) payload.get("expiryDate");
                if (pExpiry != null && !pExpiry.isEmpty()) {
                    pItem.setExpiryDate(java.time.LocalDate.parse(pExpiry));
                }
                item = pItem;
                break;
            case "Supply":
                SupplyItem sItem = new SupplyItem();
                String sCondition = (String) payload.get("condition");
                if (sCondition != null) {
                    sItem.setCondition(ItemCondition.valueOf(sCondition));
                }
                item = sItem;
                break;
            case "Food":
            default:
                FoodItem fItem = new FoodItem();
                String fExpiry = (String) payload.get("expiryDate");
                if (fExpiry != null && !fExpiry.isEmpty()) {
                    fItem.setExpiryDate(java.time.LocalDate.parse(fExpiry));
                }
                item = fItem;
                break;
        }

        item.setName(name);
        item.setQuantity(quantity);

        return inventoryItemService.addItem(groupId, item, catName);
    }

    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable Long id) {
        inventoryItemService.deleteItem(id);
    }

    @PutMapping("/{id}")
    public InventoryItem updateItem(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        // Similar logic to create, but we only need to construct the object to pass to
        // service
        // Ideally refactor this construction logic, but for speed duplicating for now.
        String type = (String) payload.getOrDefault("type", "Food");
        String name = (String) payload.get("name");
        String catName = (String) payload.get("category");
        Integer quantity = Integer.valueOf(payload.get("quantity").toString());

        InventoryItem item;
        // ... (Construct item based on type - reused logic)
        switch (type) {
            case "Electronics":
                ElectronicItem eItem = new ElectronicItem();
                String condition = (String) payload.get("condition");
                if (condition != null)
                    eItem.setCondition(ItemCondition.valueOf(condition));
                item = eItem;
                break;
            case "Medical":
                MedicalItem mItem = new MedicalItem();
                String mExpiry = (String) payload.get("expiryDate");
                if (mExpiry != null && !mExpiry.isEmpty())
                    mItem.setExpiryDate(java.time.LocalDate.parse(mExpiry));
                item = mItem;
                break;
            case "Pantry":
                PantryItem pItem = new PantryItem();
                String pExpiry = (String) payload.get("expiryDate");
                if (pExpiry != null && !pExpiry.isEmpty())
                    pItem.setExpiryDate(java.time.LocalDate.parse(pExpiry));
                item = pItem;
                break;
            case "Supply":
                SupplyItem sItem = new SupplyItem();
                String sCondition = (String) payload.get("condition");
                if (sCondition != null)
                    sItem.setCondition(ItemCondition.valueOf(sCondition));
                item = sItem;
                break;
            case "Food":
            default:
                FoodItem fItem = new FoodItem();
                String fExpiry = (String) payload.get("expiryDate");
                if (fExpiry != null && !fExpiry.isEmpty())
                    fItem.setExpiryDate(java.time.LocalDate.parse(fExpiry));
                item = fItem;
                break;
        }
        item.setName(name);
        item.setQuantity(quantity);

        return inventoryItemService.updateItem(id, item, catName);
    }

    @PostMapping("/{id}/reduce")
    public void reduceItemQuantity(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        Integer amount = payload.get("amount");
        if (amount == null) {
            throw new IllegalArgumentException("Amount must be provided");
        }
        inventoryItemService.reduceItemQuantity(id, amount);
    }
}
