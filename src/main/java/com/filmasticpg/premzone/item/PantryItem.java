package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "pantry_item")
public class PantryItem extends ExpirableItem {
    public PantryItem() {
    }
}
