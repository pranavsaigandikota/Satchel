package com.filmasticpg.premzone.item;

import com.filmasticpg.premzone.group.InventoryGroup;
import com.filmasticpg.premzone.user.AppUser;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "inventory_item")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @Column(nullable = false)
    protected String name;

    protected Integer quantity;

    protected BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    protected Category category;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "items" })
    protected InventoryGroup inventoryGroup;

    @ManyToOne
    @JoinColumn(name = "created_by")
    protected AppUser createdBy;

    public InventoryItem() {
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public InventoryGroup getInventoryGroup() {
        return inventoryGroup;
    }

    public void setInventoryGroup(InventoryGroup inventoryGroup) {
        this.inventoryGroup = inventoryGroup;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(AppUser createdBy) {
        this.createdBy = createdBy;
    }
}
