package com.example.fitlognative.ui.wardrobe;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.fitlognative.databinding.ActivityAddClothingItemBinding;
import com.example.fitlognative.model.ClothingItem;
import com.example.fitlognative.data.Store;
import com.google.android.material.textfield.TextInputLayout;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class AddClothingItemActivity extends AppCompatActivity {

    public static final int RESULT_CREATED = 1001;
    public static final String EXTRA_ITEM = "extra_item";

    private ActivityAddClothingItemBinding binding;
    private String photoPath = "";
    private static final String[] CATEGORIES = {"Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"};
    private static final String[] VALID_SIZES = {"XS", "S", "M", "L", "XL", "XXL"};

    private final ActivityResultLauncher<String> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) {
                    try {
                        // Save image to internal storage
                        photoPath = saveImageToInternalStorage(uri);
                        if (photoPath != null && !photoPath.isEmpty()) {
                            // Display preview
                            binding.photoCard.setVisibility(android.view.View.GONE);
                            binding.photoPreview.setVisibility(android.view.View.VISIBLE);
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
        binding = ActivityAddClothingItemBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        // Setup category dropdown
        ArrayAdapter<String> categoryAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_dropdown_item_1line, CATEGORIES);
        binding.categoryDropdown.setAdapter(categoryAdapter);
        binding.categoryDropdown.setThreshold(0); // Show dropdown immediately when clicked
        binding.categoryDropdown.setOnItemClickListener((parent, view, position, id) -> {
            String selected = (String) parent.getItemAtPosition(position);
            binding.categoryDropdown.setText(selected, false);
            binding.inputCategory.setError(null);
        });
        
        // Allow clicking on the dropdown to show options immediately
        binding.categoryDropdown.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                binding.categoryDropdown.showDropDown();
            }
        });
        
        // Also allow clicking to show dropdown
        binding.categoryDropdown.setOnClickListener(v -> {
            binding.categoryDropdown.showDropDown();
        });

        // Photo upload click handler
        binding.photoCard.setOnClickListener(v -> {
            imagePickerLauncher.launch("image/*");
        });
        
        // Also allow clicking on the LinearLayout inside
        View photoCardContent = binding.photoCard.getChildAt(0);
        if (photoCardContent != null) {
            photoCardContent.setOnClickListener(v -> {
                imagePickerLauncher.launch("image/*");
            });
        }

        binding.btnSave.setOnClickListener(v -> {
            if (!validate()) return;

            String name = binding.inputName.getEditText().getText().toString().trim();
            String category = binding.categoryDropdown.getText().toString().trim();
            String color = binding.inputColor.getEditText().getText().toString().trim();
            String brand = binding.inputBrand.getEditText().getText().toString().trim();
            String size = binding.inputSize.getEditText().getText().toString().trim().toUpperCase(); // Convert to uppercase for consistency
            String material = binding.inputMaterial.getEditText().getText().toString().trim();
            String notes = binding.inputNotes.getEditText().getText().toString().trim();

            int id = Store.get().getClothingItems().size() + 1;
            ClothingItem item = new ClothingItem(id, name, category, color, brand, size, material, photoPath, notes);

            ClothingItem created = Store.get().addItem(item);

            Intent out = new Intent();
            out.putExtra(EXTRA_ITEM, created);
            setResult(RESULT_CREATED, out);
            finish();
        });
    }

    private String saveImageToInternalStorage(Uri imageUri) throws IOException {
        InputStream inputStream = getContentResolver().openInputStream(imageUri);
        if (inputStream == null) return "";

        File directory = new File(getFilesDir(), "images");
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = "photo_" + System.currentTimeMillis() + ".jpg";
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
        
        // Validate Name: required, 2-100 characters
        ok &= validateName();
        
        // Validate Category: required, must be from valid list
        ok &= validateCategory();
        
        // Validate Color: required, 2-50 characters
        ok &= validateColor();
        
        // Validate Brand: required, 2-50 characters
        ok &= validateBrand();
        
        // Validate Size: required, must be XS, S, M, L, XL, or XXL
        ok &= validateSize();
        
        // Validate Material: required, 2-100 characters
        ok &= validateMaterial();
        
        // Validate Notes: optional, but if provided, max 500 characters
        ok &= validateNotes();
        
        return ok;
    }

    private boolean validateName() {
        String name = binding.inputName.getEditText().getText().toString().trim();
        if (name.isEmpty()) {
            binding.inputName.setError("Name is required");
            return false;
        }
        if (name.length() < 2) {
            binding.inputName.setError("Name must be at least 2 characters");
            return false;
        }
        if (name.length() > 100) {
            binding.inputName.setError("Name must be less than 100 characters");
            return false;
        }
        binding.inputName.setError(null);
        return true;
    }

    private boolean validateCategory() {
        String category = binding.categoryDropdown.getText().toString().trim();
        if (category.isEmpty()) {
            binding.inputCategory.setError("Category is required");
            return false;
        }
        // Check if category is from valid list
        boolean isValid = false;
        for (String validCategory : CATEGORIES) {
            if (validCategory.equals(category)) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            binding.inputCategory.setError("Please select a valid category");
            return false;
        }
        binding.inputCategory.setError(null);
        return true;
    }

    private boolean validateColor() {
        String color = binding.inputColor.getEditText().getText().toString().trim();
        if (color.isEmpty()) {
            binding.inputColor.setError("Color is required");
            return false;
        }
        if (color.length() < 2) {
            binding.inputColor.setError("Color must be at least 2 characters");
            return false;
        }
        if (color.length() > 50) {
            binding.inputColor.setError("Color must be less than 50 characters");
            return false;
        }
        binding.inputColor.setError(null);
        return true;
    }

    private boolean validateBrand() {
        String brand = binding.inputBrand.getEditText().getText().toString().trim();
        if (brand.isEmpty()) {
            binding.inputBrand.setError("Brand is required");
            return false;
        }
        if (brand.length() < 2) {
            binding.inputBrand.setError("Brand must be at least 2 characters");
            return false;
        }
        if (brand.length() > 50) {
            binding.inputBrand.setError("Brand must be less than 50 characters");
            return false;
        }
        binding.inputBrand.setError(null);
        return true;
    }

    private boolean validateSize() {
        String size = binding.inputSize.getEditText().getText().toString().trim().toUpperCase();
        if (size.isEmpty()) {
            binding.inputSize.setError("Size is required");
            return false;
        }
        // Check if size is from valid list (XS, S, M, L, XL, XXL)
        boolean isValid = false;
        for (String validSize : VALID_SIZES) {
            if (validSize.equals(size)) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            binding.inputSize.setError("Size must be one of: XS, S, M, L, XL, XXL");
            return false;
        }
        binding.inputSize.setError(null);
        return true;
    }

    private boolean validateMaterial() {
        String material = binding.inputMaterial.getEditText().getText().toString().trim();
        // Material is required
        if (material.isEmpty()) {
            binding.inputMaterial.setError("Material is required");
            return false;
        }
        if (material.length() < 2) {
            binding.inputMaterial.setError("Material must be at least 2 characters");
            return false;
        }
        if (material.length() > 100) {
            binding.inputMaterial.setError("Material must be less than 100 characters");
            return false;
        }
        binding.inputMaterial.setError(null);
        return true;
    }

    private boolean validateNotes() {
        String notes = binding.inputNotes.getEditText().getText().toString().trim();
        // Notes is optional, but if provided, validate it
        if (!notes.isEmpty()) {
            if (notes.length() > 500) {
                binding.inputNotes.setError("Notes must be less than 500 characters");
                return false;
            }
        }
        binding.inputNotes.setError(null);
        return true;
    }
}
