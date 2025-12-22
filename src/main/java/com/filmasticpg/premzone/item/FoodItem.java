package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "food_item")
public class FoodItem extends ExpirableItem {
    public FoodItem() {
    }
}
