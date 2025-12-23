package com.filmasticpg.premzone.item;

import com.filmasticpg.premzone.group.InventoryGroup;
import com.filmasticpg.premzone.group.InventoryGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryGroupRepository inventoryGroupRepository;

    @Autowired
    public InventoryItemService(InventoryItemRepository inventoryItemRepository,
            CategoryRepository categoryRepository,
            InventoryGroupRepository inventoryGroupRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryGroupRepository = inventoryGroupRepository;
    }

    public List<InventoryItem> getItemsByGroup(@org.springframework.lang.NonNull Long groupId) {
        if (groupId == null)
            throw new IllegalArgumentException("Group ID cannot be null");
        return inventoryItemRepository.findByInventoryGroupId(groupId);
    }

    public List<InventoryItem> globalSearch(String query) {
        return inventoryItemRepository.findByNameContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(query, query);
    }

    @Transactional
    public void deleteItem(@org.springframework.lang.NonNull Long id) {
        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        inventoryItemRepository.deleteById(id);
    }

    @Transactional
    public InventoryItem updateItem(@org.springframework.lang.NonNull Long id, InventoryItem updatedItem,
            String categoryName) {
        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        InventoryItem existingItem = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        updatedItem.setId(id);
        updatedItem.setInventoryGroup(existingItem.getInventoryGroup());

        Category category = categoryRepository.findByName(categoryName).orElseGet(() -> {
            Category newCat = new Category();
            newCat.setName(categoryName);
            return categoryRepository.save(newCat);
        });

        updatedItem.setCategory(category);
        return inventoryItemRepository.save(updatedItem);
    }

    @Transactional
    public InventoryItem addItem(@org.springframework.lang.NonNull Long groupId, InventoryItem item,
            String categoryName) {
        if (groupId == null)
            throw new IllegalArgumentException("Group ID cannot be null");
        InventoryGroup group = inventoryGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        item.setInventoryGroup(group);

        // Hybrid Category Logic:
        // 1. Try to find existing category (Global or Group-specific?? For now global
        // name match)
        Category category = categoryRepository.findByName(categoryName).orElseGet(() -> {
            // 2. Not found, create new Custom Category
            Category newCat = new Category();
            newCat.setName(categoryName);
            // The original logic for new categories included setting standard and group,
            // but the provided edit simplifies this.
            // newCat.setStandard(false);
            // newCat.setInventoryGroup(group); // Custom to this group
            return categoryRepository.save(newCat);
        });

        item.setCategory(category);
        return inventoryItemRepository.save(item);
    }

    @Transactional
    public void reduceItemQuantity(@org.springframework.lang.NonNull Long id, int amount) {
        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        if (amount <= 0)
            throw new IllegalArgumentException("Amount must be positive");

        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (item.getQuantity() == null) {
            inventoryItemRepository.delete(item);
            return;
        }

        int newQty = item.getQuantity() - amount;
        if (newQty <= 0) {
            inventoryItemRepository.delete(item);
        } else {
            item.setQuantity(newQty);
            inventoryItemRepository.save(item);
        }
    }
}
