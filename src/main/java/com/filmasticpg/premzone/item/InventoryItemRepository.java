package com.filmasticpg.premzone.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByInventoryGroupId(Long groupId);

    List<InventoryItem> findByNameContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(String name,
            String categoryName);
}
