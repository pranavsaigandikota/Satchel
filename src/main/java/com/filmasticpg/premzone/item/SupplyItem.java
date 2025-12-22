package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "supply_item")
public class SupplyItem extends ConditionBasedItem {
    public SupplyItem() {
    }
}
