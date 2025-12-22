package com.filmasticpg.premzone.item;

import com.filmasticpg.premzone.group.InventoryGroup;
import jakarta.persistence.*;

/**
 * Represents a category for inventory items.
 * Supports both standard system categories (seeded from Enum) and custom user
 * categories.
 */
@Entity
@Table(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) // Enforce uniqueness for category names
    private String name;

    @Column(name = "is_standard", nullable = false)
    private boolean isStandard;

    // Optional: If a category is specific to a group (Custom Category)
    // If null, it is available globally (Standard Category)
    @ManyToOne
    @JoinColumn(name = "group_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private InventoryGroup inventoryGroup;

    public Category() {
    }

    public Category(String name, boolean isStandard, InventoryGroup inventoryGroup) {
        this.name = name;
        this.isStandard = isStandard;
        this.inventoryGroup = inventoryGroup;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isStandard() {
        return isStandard;
    }

    public void setStandard(boolean standard) {
        isStandard = standard;
    }

    public InventoryGroup getInventoryGroup() {
        return inventoryGroup;
    }

    public void setInventoryGroup(InventoryGroup inventoryGroup) {
        this.inventoryGroup = inventoryGroup;
    }
}
