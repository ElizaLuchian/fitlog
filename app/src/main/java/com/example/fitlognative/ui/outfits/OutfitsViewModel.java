package com.example.fitlognative.ui.outfits;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.fitlognative.data.Store;
import com.example.fitlognative.model.Outfit;

import java.util.List;

public class OutfitsViewModel extends ViewModel {
    private final MutableLiveData<List<Outfit>> outfits = new MutableLiveData<>();

    public OutfitsViewModel() {
        loadOutfits();
    }

    public LiveData<List<Outfit>> getOutfits() {
        return outfits;
    }

    public void loadOutfits() {
        outfits.setValue(Store.get().getOutfits());
    }

    public void addOutfit(Outfit outfit) {
        List<Outfit> current = outfits.getValue();
        if (current != null) {
            current.add(0, outfit);
            outfits.setValue(current);
        }
    }

    public void updateOutfit(Outfit outfit) {
        List<Outfit> current = outfits.getValue();
        if (current != null) {
            for (int i = 0; i < current.size(); i++) {
                if (current.get(i).getOutfitId() == outfit.getOutfitId()) {
                    current.set(i, outfit);
                    break;
                }
            }
            outfits.setValue(current);
        }
    }

    public void removeOutfit(int id) {
        List<Outfit> current = outfits.getValue();
        if (current != null) {
            current.removeIf(outfit -> outfit.getOutfitId() == id);
            outfits.setValue(current);
        }
    }
}

