package com.example.fitlognative.data;

import com.example.fitlognative.model.ClothingItem;
import com.example.fitlognative.model.Outfit;
import java.util.ArrayList;
import java.util.List;

public class Store {

    private static Store instance;
    private final List<ClothingItem> clothingItems = new ArrayList<>();
    private final List<Outfit> outfits = new ArrayList<>();
    private int nextId = 1;
    private int nextOutfitId = 1;

    private Store() { }

    public static Store get() {
        if (instance == null) instance = new Store();
        return instance;
    }

    public List<ClothingItem> getClothingItems() {
        return clothingItems;
    }

    // CREATE — returns the created object
    public ClothingItem addItem(ClothingItem item) {
        item.id = nextId++;
        clothingItems.add(0, item);
        return item;
    }

    // UPDATE — return only updated item (required for grading)
    public ClothingItem updateClothingItem(int id,
                                           String name,
                                           String category,
                                           String color,
                                           String brand,
                                           String size,
                                           String material,
                                           String notes) {
        for (ClothingItem item : clothingItems) {
            if (item.getId() == id) {
                item.setName(name);
                item.setCategory(category);
                item.setColor(color);
                item.setBrand(brand);
                item.setSize(size);
                item.setMaterial(material);
                item.setNotes(notes);
                // Photo is not editable per requirements
                return item;
            }
        }
        return null;
    }


    // DELETE — returns only id
    // Also deletes any outfits that contain this item
    public int deleteItem(int id) {
        // First, find and delete all outfits that contain this item
        List<Integer> outfitsToDelete = new ArrayList<>();
        for (Outfit outfit : outfits) {
            if (outfit.getItems() != null && outfit.getItems().contains(id)) {
                outfitsToDelete.add(outfit.getOutfitId());
            }
        }
        // Delete the outfits
        for (Integer outfitId : outfitsToDelete) {
            deleteOutfit(outfitId);
        }
        
        // Then delete the item
        for (int i = 0; i < clothingItems.size(); i++) {
            if (clothingItems.get(i).getId() == id) {
                clothingItems.remove(i);
                return id;
            }
        }
        return -1;
    }
    
    // Helper method to get count of outfits that contain a specific item
    public int getOutfitsContainingItem(int itemId) {
        int count = 0;
        for (Outfit outfit : outfits) {
            if (outfit.getItems() != null && outfit.getItems().contains(itemId)) {
                count++;
            }
        }
        return count;
    }

    // Outfit CRUD operations
    public List<Outfit> getOutfits() {
        return outfits;
    }

    // CREATE — returns the created outfit
    public Outfit addOutfit(Outfit outfit) {
        outfit.setOutfitId(nextOutfitId++);
        outfits.add(0, outfit);
        return outfit;
    }

    // UPDATE — return only updated outfit (occasion, aesthetic style, and notes can be edited)
    public Outfit updateOutfit(int id, String occasion, String aestheticStyle, String notes) {
        for (Outfit outfit : outfits) {
            if (outfit.getOutfitId() == id) {
                outfit.setOccasion(occasion);
                outfit.setAestheticStyleType(aestheticStyle);
                outfit.setNotes(notes);
                return outfit;
            }
        }
        return null;
    }

    // DELETE — returns only id
    public int deleteOutfit(int id) {
        for (int i = 0; i < outfits.size(); i++) {
            if (outfits.get(i).getOutfitId() == id) {
                outfits.remove(i);
                return id;
            }
        }
        return -1;
    }
}
