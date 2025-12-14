package com.example.fitlognative.ui.wardrobe;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;

import com.example.fitlognative.R;
import com.example.fitlognative.databinding.FragmentWardrobeBinding;
import com.example.fitlognative.model.ClothingItem;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.List;

public class WardrobeFragment extends Fragment {

    private FragmentWardrobeBinding binding;
    private ClothingAdapter adapter;
    private WardrobeViewModel viewModel;
    private List<ClothingItem> allItems = new ArrayList<>(); // Store all items for filtering
    private boolean isInitialLoad = true; // Track if this is the first load
    private boolean skipNextObserverUpdate = false; // Skip observer update when we've handled it incrementally

    // receive ONLY the created item and insert it (no full rebuild)
    private final ActivityResultLauncher<Intent> addLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> {
                if (r.getResultCode() == AddClothingItemActivity.RESULT_CREATED && r.getData() != null) {
                    ClothingItem created = (ClothingItem) r.getData().getSerializableExtra(AddClothingItemActivity.EXTRA_ITEM);
                    if (created != null) {
                        // Directly add to allItems and apply filter incrementally
                        allItems.add(0, created);
                        String currentQuery = binding.searchInput.getText().toString();
                        if (currentQuery == null || currentQuery.trim().isEmpty() || 
                            (created.getName() != null && created.getName().toLowerCase().contains(currentQuery.toLowerCase().trim()))) {
                            adapter.addOne(created);
                            updateSubtitle();
                        }
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.addItem(created);
                    }
                }
            });

    // receive ONLY the updated item and update it (no full rebuild)
    private final ActivityResultLauncher<Intent> detailsLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> {
                if (r.getResultCode() == ItemDetailsActivity.RESULT_UPDATED && r.getData() != null) {
                    ClothingItem updated = (ClothingItem) r.getData().getSerializableExtra(ItemDetailsActivity.EXTRA_ITEM);
                    if (updated != null) {
                        // Update in allItems
                        for (int i = 0; i < allItems.size(); i++) {
                            if (allItems.get(i).getId() == updated.getId()) {
                                allItems.set(i, updated);
                                break;
                            }
                        }
                        // Update in adapter if currently displayed
                        String currentQuery = binding.searchInput.getText().toString();
                        if (currentQuery == null || currentQuery.trim().isEmpty() || 
                            (updated.getName() != null && updated.getName().toLowerCase().contains(currentQuery.toLowerCase().trim()))) {
                            adapter.updateOne(updated);
                            updateSubtitle();
                        } else {
                            // Item no longer matches filter, remove it
                            adapter.removeOne(updated.getId());
                            updateSubtitle();
                        }
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.updateItem(updated);
                    }
                } else if (r.getResultCode() == ItemDetailsActivity.RESULT_DELETED && r.getData() != null) {
                    int deletedId = r.getData().getIntExtra(ItemDetailsActivity.EXTRA_DELETED_ID, -1);
                    int deletedOutfitsCount = r.getData().getIntExtra(ItemDetailsActivity.EXTRA_DELETED_OUTFITS_COUNT, 0);
                    if (deletedId != -1) {
                        // Remove from allItems
                        allItems.removeIf(item -> item.getId() == deletedId);
                        // Remove from adapter incrementally
                        adapter.removeOne(deletedId);
                        updateSubtitle();
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.removeItem(deletedId);
                        // Show styled confirmation message
                        String message = "Item deleted successfully";
                        if (deletedOutfitsCount > 0) {
                            message += " • " + deletedOutfitsCount + " outfit" + 
                                      (deletedOutfitsCount > 1 ? "s" : "") + " also deleted";
                        }
                        showDeletionMessage(message);
                    }
                }
            });

    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentWardrobeBinding.inflate(inflater, container, false);

        viewModel = new ViewModelProvider(this).get(WardrobeViewModel.class);
        
        adapter = new ClothingAdapter(detailsLauncher);
        // Use GridLayoutManager with 2 columns to match the design
        binding.rvClothing.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.rvClothing.setAdapter(adapter);

        // Observe LiveData from ViewModel - only for initial load and external changes
        viewModel.getClothingItems().observe(getViewLifecycleOwner(), items -> {
            // Skip update if we've already handled it incrementally
            if (skipNextObserverUpdate) {
                skipNextObserverUpdate = false;
                return;
            }
            
            if (isInitialLoad) {
                // Initial load - use setData
                allItems.clear();
                if (items != null) {
                    allItems.addAll(items);
                }
                filterItems(binding.searchInput.getText().toString());
                isInitialLoad = false;
            } else {
                // External change (e.g., from another fragment) - update allItems and re-filter
                allItems.clear();
                if (items != null) {
                    allItems.addAll(items);
                }
                filterItems(binding.searchInput.getText().toString());
            }
        });

        // Setup search functionality
        binding.searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterItems(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Note: FAB removed to match design - items are added from Home screen

        return binding.getRoot();
    }

    private void filterItems(String query) {
        List<ClothingItem> filtered;
        if (query == null || query.trim().isEmpty()) {
            filtered = new ArrayList<>(allItems);
        } else {
            String searchQuery = query.toLowerCase().trim();
            filtered = new ArrayList<>();
            for (ClothingItem item : allItems) {
                if (item.getName() != null && item.getName().toLowerCase().contains(searchQuery)) {
                    filtered.add(item);
                }
            }
        }
        
        // Use setData for search filter changes (different filtered set)
        adapter.setData(filtered);
        updateSubtitle(filtered.size());
    }
    
    private void updateSubtitle() {
        updateSubtitle(adapter.getItemCount());
    }
    
    private void updateSubtitle(int count) {
        String countText = count + " item" + (count != 1 ? "s" : "") + " in your collection";
        binding.tvSubtitle.setText(countText);
    }
    
    private void showDeletionMessage(String message) {
        Snackbar snackbar = Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_SHORT);
        View snackbarView = snackbar.getView();
        snackbarView.setBackground(ContextCompat.getDrawable(requireContext(), R.drawable.snackbar_bg));
        snackbarView.setPadding(24, 16, 24, 16);
        snackbar.setActionTextColor(Color.WHITE);
        snackbar.setTextColor(Color.WHITE);
        // Set text size via TextView
        android.widget.TextView textView = snackbarView.findViewById(com.google.android.material.R.id.snackbar_text);
        if (textView != null) {
            textView.setTextSize(14);
        }
        snackbar.show();
    }
}
