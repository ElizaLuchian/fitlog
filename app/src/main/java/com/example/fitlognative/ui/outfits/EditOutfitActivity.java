package com.example.fitlognative.ui.outfits;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.fitlognative.R;
import com.example.fitlognative.databinding.ActivityEditOutfitBinding;
import com.example.fitlognative.data.Store;
import com.example.fitlognative.model.Outfit;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class EditOutfitActivity extends AppCompatActivity {

    public static final int RESULT_UPDATED = 3002;

    private ActivityEditOutfitBinding binding;
    private Outfit outfit;
    private static final String[] AESTHETIC_STYLES = {
            "Streetwear", "Minimalist", "Vintage", "Casual", "Formal",
            "Bohemian", "Athletic", "Classic", "Trendy", "Elegant"
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditOutfitBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        outfit = (Outfit) getIntent().getSerializableExtra(OutfitDetailsActivity.EXTRA_OUTFIT);
        if (outfit == null) {
            finish();
            return;
        }

        // Setup aesthetic style dropdown
        ArrayAdapter<String> styleAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_dropdown_item_1line, AESTHETIC_STYLES);
        binding.aestheticStyleDropdown.setAdapter(styleAdapter);
        binding.aestheticStyleDropdown.setThreshold(0); // Show dropdown immediately when clicked
        binding.aestheticStyleDropdown.setOnItemClickListener((parent, view, position, id) -> {
            String selected = (String) parent.getItemAtPosition(position);
            binding.aestheticStyleDropdown.setText(selected, false);
            binding.inputAestheticStyle.setError(null);
        });
        
        // Allow clicking on the dropdown to show options immediately
        binding.aestheticStyleDropdown.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                binding.aestheticStyleDropdown.showDropDown();
            }
        });
        
        // Also allow clicking to show dropdown
        binding.aestheticStyleDropdown.setOnClickListener(v -> {
            binding.aestheticStyleDropdown.showDropDown();
        });

        // Display outfit image and date (non-editable)
        fillDisplayFields();

        // Pre-fill editable fields: occasion, aesthetic style, and notes
        if (outfit.getOccasion() != null) {
            binding.inputOccasion.setText(outfit.getOccasion());
        }
        if (outfit.getAestheticStyleType() != null) {
            binding.aestheticStyleDropdown.setText(outfit.getAestheticStyleType(), false);
        }
        if (outfit.getNotes() != null) {
            binding.inputNotes.setText(outfit.getNotes());
        }

        binding.btnSave.setOnClickListener(v -> {
            if (!validate()) return;

            // Update editable fields: occasion, aesthetic style, and notes
            String occasion = binding.inputOccasion.getText().toString().trim();
            String aestheticStyle = binding.aestheticStyleDropdown.getText().toString().trim();
            String notes = binding.inputNotes.getText().toString().trim();

            Outfit updated = Store.get().updateOutfit(outfit.getOutfitId(), occasion, aestheticStyle, notes);

            Intent out = new Intent();
            out.putExtra("updated_outfit", updated);
            setResult(RESULT_UPDATED, out);
            finish();
        });

        binding.btnDelete.setOnClickListener(v -> showDeleteDialog());
    }

    private void fillDisplayFields() {
        // Display date (non-editable)
        String dateText = formatDate(outfit.getCreatedAt());
        binding.tvDate.setText(dateText);

        // Load and display outfit photo
        if (outfit.getPhoto() != null && !outfit.getPhoto().isEmpty()) {
            File imageFile = new File(outfit.getPhoto());
            if (imageFile.exists()) {
                Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
                if (bitmap != null) {
                    binding.outfitImage.setImageBitmap(bitmap);
                } else {
                    binding.outfitImage.setImageResource(R.drawable.ic_shirt);
                }
            } else {
                binding.outfitImage.setImageResource(R.drawable.ic_shirt);
            }
        } else {
            binding.outfitImage.setImageResource(R.drawable.ic_shirt);
        }
    }

    private String formatDate(String dateString) {
        if (dateString == null || dateString.isEmpty()) {
            return "Today";
        }

        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
            Date date = inputFormat.parse(dateString);
            if (date == null) return dateString;

            Calendar today = Calendar.getInstance();
            Calendar dateCal = Calendar.getInstance();
            dateCal.setTime(date);

            Calendar yesterday = Calendar.getInstance();
            yesterday.add(Calendar.DAY_OF_YEAR, -1);

            if (isSameDay(dateCal, today)) {
                return "Today, " + formatDateShort(date);
            } else if (isSameDay(dateCal, yesterday)) {
                return "Yesterday, " + formatDateShort(date);
            } else {
                return formatDateWithMonth(date);
            }
        } catch (ParseException e) {
            return dateString;
        }
    }

    private boolean isSameDay(Calendar cal1, Calendar cal2) {
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    private String formatDateShort(Date date) {
        SimpleDateFormat format = new SimpleDateFormat("MMM dd", Locale.getDefault());
        return format.format(date);
    }

    private String formatDateWithMonth(Date date) {
        SimpleDateFormat format = new SimpleDateFormat("MMM dd, yyyy", Locale.getDefault());
        return format.format(date);
    }

    private boolean validate() {
        boolean ok = true;
        // Validate all editable fields
        ok &= validateOccasion();
        ok &= validateAestheticStyle();
        return ok;
    }

    private boolean validateOccasion() {
        String occasion = binding.inputOccasion.getText().toString().trim();
        // Occasion is required
        if (occasion.isEmpty()) {
            binding.inputOccasionLayout.setError("Occasion is required");
            return false;
        }
        if (occasion.length() < 2) {
            binding.inputOccasionLayout.setError("Occasion must be at least 2 characters");
            return false;
        }
        if (occasion.length() > 100) {
            binding.inputOccasionLayout.setError("Occasion must be less than 100 characters");
            return false;
        }
        binding.inputOccasionLayout.setError(null);
        return true;
    }

    private boolean validateAestheticStyle() {
        String aestheticStyle = binding.aestheticStyleDropdown.getText().toString().trim();
        // Aesthetic style is required
        if (aestheticStyle.isEmpty()) {
            binding.inputAestheticStyle.setError("Aesthetic style is required");
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
            binding.inputAestheticStyle.setError("Please select a valid aesthetic style");
            return false;
        }
        binding.inputAestheticStyle.setError(null);
        return true;
    }

    private void showDeleteDialog() {
        new AlertDialog.Builder(this)
                .setTitle("Delete Outfit?")
                .setMessage("This will permanently remove it from your outfit history.")
                .setPositiveButton("Delete", (d, w) -> {
                    int deletedId = Store.get().deleteOutfit(outfit.getOutfitId());
                    if (deletedId != -1) {
                        Intent out = new Intent();
                        out.putExtra(OutfitDetailsActivity.EXTRA_DELETED_ID, deletedId);
                        setResult(OutfitDetailsActivity.RESULT_DELETED, out);
                        finish();
                    } else {
                        Toast.makeText(this, "Failed to delete outfit", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
