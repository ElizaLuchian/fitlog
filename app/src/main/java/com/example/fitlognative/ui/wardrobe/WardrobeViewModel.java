package com.example.fitlognative.ui.wardrobe;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.fitlognative.data.Store;
import com.example.fitlognative.model.ClothingItem;

import java.util.List;

public class WardrobeViewModel extends ViewModel {
    private final MutableLiveData<List<ClothingItem>> clothingItems = new MutableLiveData<>();

    public WardrobeViewModel() {
        loadItems();
    }

    public LiveData<List<ClothingItem>> getClothingItems() {
        return clothingItems;
    }

    public void loadItems() {
        clothingItems.setValue(Store.get().getClothingItems());
    }

    public void addItem(ClothingItem item) {
        List<ClothingItem> current = clothingItems.getValue();
        if (current != null) {
            current.add(0, item);
            clothingItems.setValue(current);
        }
    }

    public void updateItem(ClothingItem item) {
        List<ClothingItem> current = clothingItems.getValue();
        if (current != null) {
            for (int i = 0; i < current.size(); i++) {
                if (current.get(i).getId() == item.getId()) {
                    current.set(i, item);
                    break;
                }
            }
            clothingItems.setValue(current);
        }
    }

    public void removeItem(int id) {
        List<ClothingItem> current = clothingItems.getValue();
        if (current != null) {
            current.removeIf(item -> item.getId() == id);
            clothingItems.setValue(current);
        }
    }
}

