package com.example.fitlognative.ui.outfits;

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
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.fitlognative.R;
import com.example.fitlognative.databinding.FragmentOutfitsBinding;
import com.example.fitlognative.model.Outfit;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.List;

public class OutfitsFragment extends Fragment {
    private FragmentOutfitsBinding binding;
    private OutfitAdapter adapter;
    private OutfitsViewModel viewModel;
    private List<Outfit> allOutfits = new ArrayList<>(); // Store all outfits for filtering
    private boolean isInitialLoad = true; // Track if this is the first load
    private boolean skipNextObserverUpdate = false; // Skip observer update when we've handled it incrementally

    // receive ONLY the created outfit and insert it (no full rebuild)
    private final ActivityResultLauncher<Intent> addLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> {
                if (r.getResultCode() == AddOutfitActivity.RESULT_CREATED && r.getData() != null) {
                    Outfit created = (Outfit) r.getData().getSerializableExtra(AddOutfitActivity.EXTRA_OUTFIT);
                    if (created != null) {
                        // Directly add to allOutfits and apply filter incrementally
                        allOutfits.add(0, created);
                        String currentQuery = binding.searchInput.getText().toString();
                        if (matchesFilter(created, currentQuery)) {
                            adapter.addOne(created);
                            updateSubtitle();
                        }
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.addOutfit(created);
                    }
                }
            });

    // receive ONLY the updated outfit and update it (no full rebuild)
    private final ActivityResultLauncher<Intent> detailsLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> {
                if (r.getResultCode() == OutfitDetailsActivity.RESULT_UPDATED && r.getData() != null) {
                    Outfit updated = (Outfit) r.getData().getSerializableExtra(OutfitDetailsActivity.EXTRA_OUTFIT);
                    if (updated != null) {
                        // Update in allOutfits
                        for (int i = 0; i < allOutfits.size(); i++) {
                            if (allOutfits.get(i).getOutfitId() == updated.getOutfitId()) {
                                allOutfits.set(i, updated);
                                break;
                            }
                        }
                        // Update in adapter if currently displayed
                        String currentQuery = binding.searchInput.getText().toString();
                        if (matchesFilter(updated, currentQuery)) {
                            adapter.updateOne(updated);
                            updateSubtitle();
                        } else {
                            // Outfit no longer matches filter, remove it
                            adapter.removeOne(updated.getOutfitId());
                            updateSubtitle();
                        }
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.updateOutfit(updated);
                    }
                } else if (r.getResultCode() == OutfitDetailsActivity.RESULT_DELETED && r.getData() != null) {
                    int deletedId = r.getData().getIntExtra(OutfitDetailsActivity.EXTRA_DELETED_ID, -1);
                    if (deletedId != -1) {
                        // Remove from allOutfits
                        allOutfits.removeIf(outfit -> outfit.getOutfitId() == deletedId);
                        // Remove from adapter incrementally
                        adapter.removeOne(deletedId);
                        updateSubtitle();
                        // Update ViewModel after incremental update to prevent full rebuild
                        skipNextObserverUpdate = true;
                        viewModel.removeOutfit(deletedId);
                        // Show styled confirmation message
                        showDeletionMessage("Outfit deleted successfully");
                    }
                }
            });

    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentOutfitsBinding.inflate(inflater, container, false);

        viewModel = new ViewModelProvider(this).get(OutfitsViewModel.class);

        adapter = new OutfitAdapter(detailsLauncher);
        binding.recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recycler.setAdapter(adapter);

        // Observe LiveData from ViewModel - only for initial load and external changes
        viewModel.getOutfits().observe(getViewLifecycleOwner(), outfits -> {
            // Skip update if we've already handled it incrementally
            if (skipNextObserverUpdate) {
                skipNextObserverUpdate = false;
                return;
            }
            
            if (isInitialLoad) {
                // Initial load - use setData
                allOutfits.clear();
                if (outfits != null) {
                    allOutfits.addAll(outfits);
                }
                filterOutfits(binding.searchInput.getText().toString());
                isInitialLoad = false;
            } else {
                // External change (e.g., from another fragment) - update allOutfits and re-filter
                allOutfits.clear();
                if (outfits != null) {
                    allOutfits.addAll(outfits);
                }
                filterOutfits(binding.searchInput.getText().toString());
            }
        });
        
        // Setup search functionality
        binding.searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterOutfits(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        return binding.getRoot();
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Reload outfits when fragment becomes visible (in case outfits were deleted from item deletion)
        viewModel.loadOutfits();
    }

    // This method can be called from HomeFragment when Add Outfit button is clicked
    public void openAddOutfit() {
        addLauncher.launch(new Intent(requireContext(), AddOutfitActivity.class));
    }

    private boolean matchesFilter(Outfit outfit, String query) {
        if (query == null || query.trim().isEmpty()) {
            return true;
        }
        String searchQuery = query.toLowerCase().trim();
        // Search in occasion
        if (outfit.getOccasion() != null && outfit.getOccasion().toLowerCase().contains(searchQuery)) {
            return true;
        }
        // Search in aesthetic style
        if (outfit.getAestheticStyleType() != null && 
            outfit.getAestheticStyleType().toLowerCase().contains(searchQuery)) {
            return true;
        }
        return false;
    }

    private void filterOutfits(String query) {
        List<Outfit> filtered;
        if (query == null || query.trim().isEmpty()) {
            filtered = new ArrayList<>(allOutfits);
        } else {
            String searchQuery = query.toLowerCase().trim();
            filtered = new ArrayList<>();
            for (Outfit outfit : allOutfits) {
                if (matchesFilter(outfit, query)) {
                    filtered.add(outfit);
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
        String countText = count + " outfit" + (count != 1 ? "s" : "") + " logged";
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
