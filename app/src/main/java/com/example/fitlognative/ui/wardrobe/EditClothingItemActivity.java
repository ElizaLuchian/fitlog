package com.example.fitlognative.ui.wardrobe;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.fitlognative.R;
import com.example.fitlognative.databinding.ActivityEditClothingItemBinding;
import com.example.fitlognative.data.Store;
import com.example.fitlognative.model.ClothingItem;

import java.io.File;

public class EditClothingItemActivity extends AppCompatActivity {

    public static final int RESULT_UPDATED = 2001;

    private ActivityEditClothingItemBinding binding;
    private ClothingItem item; // item being edited
    private static final String[] CATEGORIES = {"Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"};

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditClothingItemBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        item = (ClothingItem) getIntent().getSerializableExtra(ItemDetailsActivity.EXTRA_ITEM);
        if (item == null) {
            finish();
            return;
        }

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

        // Display item image
        fillDisplayFields();

        // Pre-fill all editable fields: name, category, brand, size, color, material, notes
        if (item.getName() != null) binding.inputName.setText(item.getName());
        if (item.getCategory() != null) binding.categoryDropdown.setText(item.getCategory(), false);
        if (item.getColor() != null) binding.inputColor.setText(item.getColor());
        if (item.getBrand() != null) binding.inputBrand.setText(item.getBrand());
        if (item.getSize() != null) binding.inputSize.setText(item.getSize());
        if (item.getMaterial() != null) binding.inputMaterial.setText(item.getMaterial());
        if (item.getNotes() != null) binding.inputNotes.setText(item.getNotes());

        binding.btnSave.setOnClickListener(v -> {
            if (!validate()) return;

            // Update all editable fields: name, category, brand, size, color, material, notes
            ClothingItem updated = Store.get().updateClothingItem(
                    item.getId(),
                    binding.inputName.getText().toString().trim(),
                    binding.categoryDropdown.getText().toString().trim(),
                    binding.inputColor.getText().toString().trim(),
                    binding.inputBrand.getText().toString().trim(),
                    binding.inputSize.getText().toString().trim(),
                    binding.inputMaterial.getText().toString().trim(),
                    binding.inputNotes.getText().toString().trim()
            );

            Intent out = new Intent();
            out.putExtra("updated_item", updated);
            setResult(RESULT_UPDATED, out);
            finish();
        });

        binding.btnDelete.setOnClickListener(v -> showDeleteDialog());
    }

    private void fillDisplayFields() {
        // Load and display image
        if (item.getPhoto() != null && !item.getPhoto().isEmpty()) {
            File imageFile = new File(item.getPhoto());
            if (imageFile.exists()) {
                Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
                if (bitmap != null) {
                    binding.itemImage.setImageBitmap(bitmap);
                } else {
                    binding.itemImage.setImageResource(R.drawable.ic_shirt);
                }
            } else {
                binding.itemImage.setImageResource(R.drawable.ic_shirt);
            }
        } else {
            binding.itemImage.setImageResource(R.drawable.ic_shirt);
        }
    }

    private boolean validate() {
        boolean ok = true;
        // Validate all editable fields
        ok &= validateName();
        ok &= validateCategory();
        ok &= required(binding.inputColor);
        ok &= required(binding.inputBrand);
        ok &= required(binding.inputSize);
        ok &= required(binding.inputMaterial);
        return ok;
    }

    private boolean validateName() {
        String name = binding.inputName.getText().toString().trim();
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

    private boolean required(android.widget.EditText et) {
        String v = et.getText().toString().trim();
        if (v.isEmpty()) {
            et.setError("Required");
            return false;
        }
        et.setError(null);
        return true;
    }

    private void showDeleteDialog() {
        Store store = Store.get();
        int outfitsCount = store.getOutfitsContainingItem(item.id);
        String message = "This will permanently remove it from your wardrobe.";
        if (outfitsCount > 0) {
            message += "\n\n" + outfitsCount + " outfit" + (outfitsCount > 1 ? "s" : "") + 
                      " containing this item will also be deleted.";
        }
        
        new AlertDialog.Builder(this)
                .setTitle("Delete Item?")
                .setMessage(message)
                .setPositiveButton("Delete", (d, w) -> {
                    int deletedId = store.deleteItem(item.id);
                    if (deletedId != -1) {
                        Intent out = new Intent();
                        out.putExtra(ItemDetailsActivity.EXTRA_DELETED_ID, deletedId);
                        out.putExtra(ItemDetailsActivity.EXTRA_DELETED_OUTFITS_COUNT, outfitsCount);
                        setResult(ItemDetailsActivity.RESULT_DELETED, out);
                        finish();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
