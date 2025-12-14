package com.example.fitlognative.ui.outfits;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.fitlognative.R;
import com.example.fitlognative.databinding.ActivityAddOutfitBinding;
import com.example.fitlognative.model.ClothingItem;
import com.example.fitlognative.model.Outfit;
import com.example.fitlognative.data.Store;
import com.google.android.material.card.MaterialCardView;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class AddOutfitActivity extends AppCompatActivity {

    public static final int RESULT_CREATED = 3001;
    public static final String EXTRA_OUTFIT = "extra_outfit";

    private ActivityAddOutfitBinding binding;
    private ClothingItemSelectAdapter adapter;
    private String photoPath = "";
    private Date selectedDate = new Date();

    private static final String[] AESTHETIC_STYLES = {
            "Streetwear", "Minimalist", "Vintage", "Casual", "Formal",
            "Bohemian", "Athletic", "Classic", "Trendy", "Elegant"
    };

    private final ActivityResultLauncher<String> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) {
                    try {
                        // Save image to internal storage
                        photoPath = saveImageToInternalStorage(uri);
                        if (photoPath != null && !photoPath.isEmpty()) {
                            // Display preview
                            binding.photoCard.setVisibility(View.GONE);
                            binding.photoPreview.setVisibility(View.VISIBLE);
                            Bitmap bitmap = BitmapFactory.decodeFile(photoPath);
                            binding.photoPreview.setImageBitmap(bitmap);
                        }
                    } catch (IOException e) {
                        Toast.makeText(this, "Error loading image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        e.printStackTrace();
                    }
                }
            });

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAddOutfitBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        // Setup date picker
        setupDatePicker();

        // Setup item selection RecyclerView
        setupItemSelection();

        // Setup aesthetic style dropdown
        setupAestheticStyleDropdown();

        // Setup photo upload
        binding.photoCard.setOnClickListener(v -> {
            imagePickerLauncher.launch("image/*");
        });

        // Save button
        binding.btnSave.setOnClickListener(v -> {
            if (!validate()) return;

            String occasion = binding.inputOccasion.getText().toString().trim();
            String aestheticStyle = binding.inputAestheticStyle.getText().toString().trim();
            String notes = binding.inputNotes.getText().toString().trim();

            List<Integer> selectedItemIds = adapter.getSelectedItemIds();

            // Format date
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
            String dateString = dateFormat.format(selectedDate);

            Outfit outfit = new Outfit(0, 1, selectedItemIds, occasion, aestheticStyle, photoPath, notes, dateString);
            Outfit created = Store.get().addOutfit(outfit);

            Intent out = new Intent();
            out.putExtra(EXTRA_OUTFIT, created);
            setResult(RESULT_CREATED, out);
            finish();
        });
    }

    private void setupDatePicker() {
        // Set initial date
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
        binding.tvDate.setText(dateFormat.format(selectedDate));

        binding.dateCard.setOnClickListener(v -> {
            // Show date picker dialog
            java.util.Calendar calendar = java.util.Calendar.getInstance();
            calendar.setTime(selectedDate);
            int year = calendar.get(java.util.Calendar.YEAR);
            int month = calendar.get(java.util.Calendar.MONTH);
            int day = calendar.get(java.util.Calendar.DAY_OF_MONTH);

            DatePickerDialog datePickerDialog = new DatePickerDialog(this,
                    (view, selectedYear, selectedMonth, selectedDay) -> {
                        calendar.set(selectedYear, selectedMonth, selectedDay);
                        selectedDate = calendar.getTime();
                        SimpleDateFormat df = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
                        binding.tvDate.setText(df.format(selectedDate));
                    }, year, month, day);
            datePickerDialog.show();
        });
    }

    private void setupItemSelection() {
        adapter = new ClothingItemSelectAdapter(selectedCount -> {
            // Update selected count text
            String countText = "(" + selectedCount + " selected)";
            binding.tvSelectedCount.setText(countText);
        });

        RecyclerView rvItems = binding.rvItems;
        rvItems.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        rvItems.setAdapter(adapter);

        // Load clothing items from Store
        List<ClothingItem> items = Store.get().getClothingItems();
        
        // Show/hide "No items available" message based on whether there are items
        if (items == null || items.isEmpty()) {
            binding.rvItems.setVisibility(android.view.View.GONE);
            binding.tvNoItemsAvailable.setVisibility(android.view.View.VISIBLE);
            binding.tvSelectedCount.setVisibility(android.view.View.GONE);
        } else {
            binding.rvItems.setVisibility(android.view.View.VISIBLE);
            binding.tvNoItemsAvailable.setVisibility(android.view.View.GONE);
            binding.tvSelectedCount.setVisibility(android.view.View.VISIBLE);
            adapter.setData(items);
        }
    }

    private void setupAestheticStyleDropdown() {
        ArrayAdapter<String> styleAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_dropdown_item_1line, AESTHETIC_STYLES);
        binding.inputAestheticStyle.setAdapter(styleAdapter);
        binding.inputAestheticStyle.setThreshold(0);
        binding.inputAestheticStyle.setOnItemClickListener((parent, view, position, id) -> {
            String selected = (String) parent.getItemAtPosition(position);
            binding.inputAestheticStyle.setText(selected, false);
        });

        binding.inputAestheticStyle.setOnClickListener(v -> {
            binding.inputAestheticStyle.showDropDown();
        });

        binding.inputAestheticStyle.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                binding.inputAestheticStyle.showDropDown();
            }
        });
    }

    private String saveImageToInternalStorage(Uri uri) throws IOException {
        InputStream inputStream = getContentResolver().openInputStream(uri);
        if (inputStream == null) return "";

        File directory = new File(getFilesDir(), "images");
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = "outfit_" + System.currentTimeMillis() + ".jpg";
        File file = new File(directory, fileName);

        FileOutputStream outputStream = new FileOutputStream(file);
        byte[] buffer = new byte[1024];
        int length;
        while ((length = inputStream.read(buffer)) > 0) {
            outputStream.write(buffer, 0, length);
        }
        outputStream.close();
        inputStream.close();

        return file.getAbsolutePath();
    }

    private boolean validate() {
        boolean ok = true;
        
        // Validate Items: at least 1 item must be selected
        ok &= validateItems();
        
        // Validate Occasion: required, 2-100 characters
        ok &= validateOccasion();
        
        // Validate Aesthetic Style: required, must be from valid list
        ok &= validateAestheticStyle();
        
        // Date is always set (defaults to today), so no validation needed
        
        return ok;
    }

    private boolean validateItems() {
        List<Integer> selectedItemIds = adapter.getSelectedItemIds();
        if (selectedItemIds == null || selectedItemIds.isEmpty()) {
            Toast.makeText(this, "Please select at least one clothing item", Toast.LENGTH_SHORT).show();
            binding.rvItems.post(() -> {
                binding.rvItems.requestFocus();
            });
            return false;
        }
        // Validate that selected items actually exist in the store
        List<ClothingItem> allItems = Store.get().getClothingItems();
        for (Integer itemId : selectedItemIds) {
            boolean itemExists = false;
            for (ClothingItem item : allItems) {
                if (item.getId() == itemId) {
                    itemExists = true;
                    break;
                }
            }
            if (!itemExists) {
                Toast.makeText(this, "One or more selected items no longer exist", Toast.LENGTH_SHORT).show();
                return false;
            }
        }
        return true;
    }

    private boolean validateOccasion() {
        String occasion = binding.inputOccasion.getText().toString().trim();
        // Occasion is required
        if (occasion.isEmpty()) {
            Toast.makeText(this, "Occasion is required", Toast.LENGTH_SHORT).show();
            binding.inputOccasion.requestFocus();
            return false;
        }
        if (occasion.length() < 2) {
            Toast.makeText(this, "Occasion must be at least 2 characters", Toast.LENGTH_SHORT).show();
            binding.inputOccasion.requestFocus();
            return false;
        }
        if (occasion.length() > 100) {
            Toast.makeText(this, "Occasion must be less than 100 characters", Toast.LENGTH_SHORT).show();
            binding.inputOccasion.requestFocus();
            return false;
        }
        return true;
    }

    private boolean validateAestheticStyle() {
        String aestheticStyle = binding.inputAestheticStyle.getText().toString().trim();
        // Aesthetic style is required
        if (aestheticStyle.isEmpty()) {
            Toast.makeText(this, "Aesthetic style is required", Toast.LENGTH_SHORT).show();
            binding.inputAestheticStyle.requestFocus();
            return false;
        }
        // Check if aesthetic style is from valid list
        boolean isValid = false;
        for (String validStyle : AESTHETIC_STYLES) {
            if (validStyle.equals(aestheticStyle)) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            Toast.makeText(this, "Please select a valid aesthetic style", Toast.LENGTH_SHORT).show();
            binding.inputAestheticStyle.requestFocus();
            return false;
        }
        return true;
    }
}
