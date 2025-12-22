package com.filmasticpg.premzone.item;

import jakarta.persistence.*;

@Entity
@Table(name = "medical_item")
public class MedicalItem extends ExpirableItem {
    public MedicalItem() {
    }
}
