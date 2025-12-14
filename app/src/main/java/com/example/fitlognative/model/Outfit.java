package com.example.fitlognative.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class Outfit implements Serializable {
    private int outfitId;
    private int userId;
    private List<Integer> items; // References to ClothingItem IDs
    private String occasion;
    private String aestheticStyleType;
    private String photo;
    private String notes;
    private String createdAt;

    public Outfit() {
        this.items = new ArrayList<>();
    }

    public Outfit(int outfitId, int userId, List<Integer> items, String occasion,
                   String aestheticStyleType, String photo, String notes, String createdAt) {
        this.outfitId = outfitId;
        this.userId = userId;
        this.items = items != null ? items : new ArrayList<>();
        this.occasion = occasion;
        this.aestheticStyleType = aestheticStyleType;
        this.photo = photo;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public int getOutfitId() {
        return outfitId;
    }

    public void setOutfitId(int outfitId) {
        this.outfitId = outfitId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public List<Integer> getItems() {
        return items;
    }

    public void setItems(List<Integer> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String occasion) {
        this.occasion = occasion;
    }

    public String getAestheticStyleType() {
        return aestheticStyleType;
    }

    public void setAestheticStyleType(String aestheticStyleType) {
        this.aestheticStyleType = aestheticStyleType;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}

