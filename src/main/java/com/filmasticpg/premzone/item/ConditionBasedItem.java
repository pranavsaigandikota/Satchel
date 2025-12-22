package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "condition_item")
public abstract class ConditionBasedItem extends InventoryItem {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    protected ItemCondition condition;

    public ConditionBasedItem() {
    }

    public ItemCondition getCondition() {
        return condition;
    }

    public void setCondition(ItemCondition condition) {
        this.condition = condition;
    }
}
