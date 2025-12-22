package com.filmasticpg.premzone.item;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "expirable_item")
public abstract class ExpirableItem extends InventoryItem {

    @Column(name = "expiry_date", nullable = true)
    protected LocalDate expiryDate;

    public ExpirableItem() {
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
}
