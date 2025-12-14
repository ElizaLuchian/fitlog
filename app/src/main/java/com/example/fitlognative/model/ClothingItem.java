package com.example.fitlognative.model;

import android.os.Parcelable;

import java.io.Serializable;

public class ClothingItem implements Serializable {
    public int id;
    private String name;
    private String category;
    private String color;
    private String brand;

    private String size;
    private String material;
    private String photo; // Image URI or local file path

    private String notes;


    public void setId(int id) {
        this.id = id;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public ClothingItem(int id, String name, String category, String color, String brand, String size, String material, String notes) {
        this(id, name, category, color, brand, size, material, "", notes);
    }

    public ClothingItem(int id, String name, String category, String color, String brand, String size, String material, String photo, String notes) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.color = color;
        this.brand = brand;
        this.size = size;
        this.material = material;
        this.photo = photo;
        this.notes = notes;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getColor() { return color; }
    public String getBrand() { return brand; }

    public void setName(String name) { this.name = name; }
    public void setCategory(String category) { this.category = category; }
    public void setColor(String color) { this.color = color; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }
}
