package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "electronic_item")
public class ElectronicItem extends ConditionBasedItem {
    public ElectronicItem() {
    }
}
