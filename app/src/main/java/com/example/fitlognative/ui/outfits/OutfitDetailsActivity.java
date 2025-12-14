package com.example.fitlognative.ui.outfits;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.fitlognative.R;
import com.example.fitlognative.data.Store;
import com.example.fitlognative.databinding.ActivityOutfitDetailsBinding;
import com.example.fitlognative.model.Outfit;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class OutfitDetailsActivity extends AppCompatActivity {

    public static final String EXTRA_OUTFIT = "extra_outfit";
    public static final String EXTRA_DELETED_ID = "extra_deleted_id";
    public static final int RESULT_UPDATED = 3001;
    public static final int RESULT_DELETED = 3002;

    private Outfit outfit;
    private ActivityOutfitDetailsBinding binding;

    private final ActivityResultLauncher<Intent> editLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == EditOutfitActivity.RESULT_UPDATED && result.getData() != null) {
                    Outfit updated = (Outfit) result.getData().getSerializableExtra("updated_outfit");
                    if (updated != null) {
                        this.outfit = updated;
                        fillUI();

                        Intent out = new Intent();
                        out.putExtra(EXTRA_OUTFIT, updated);
                        setResult(RESULT_UPDATED, out);
                    }
                } else if (result.getResultCode() == RESULT_DELETED && result.getData() != null) {
                    // Handle deletion from EditOutfitActivity - pass it through to OutfitsFragment
                    int deletedId = result.getData().getIntExtra(EXTRA_DELETED_ID, -1);
                    if (deletedId != -1) {
                        Intent out = new Intent();
                        out.putExtra(EXTRA_DELETED_ID, deletedId);
                        setResult(RESULT_DELETED, out);
                        finish();
                    }
                }
            });

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityOutfitDetailsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        outfit = (Outfit) getIntent().getSerializableExtra(EXTRA_OUTFIT);
        if (outfit == null) {
            finish();
            return;
        }

        fillUI();

        binding.btnEdit.setOnClickListener(v -> {
            Intent i = new Intent(this, EditOutfitActivity.class);
            i.putExtra(EXTRA_OUTFIT, outfit);
            editLauncher.launch(i);
        });

        binding.btnDelete.setOnClickListener(v -> showDeleteDialog());
    }

    private void fillUI() {
        // Format and display date
        String dateText = formatDate(outfit.getCreatedAt());
        binding.tvDate.setText(dateText);
        
        // Display style tag (aesthetic style type)
        if (outfit.getAestheticStyleType() != null && !outfit.getAestheticStyleType().isEmpty()) {
            binding.tvStyleTag.setText(outfit.getAestheticStyleType());
            binding.tvStyleTag.setVisibility(android.view.View.VISIBLE);
        } else {
            // Default to "Casual" if no style is set
            binding.tvStyleTag.setText("Casual");
            binding.tvStyleTag.setVisibility(android.view.View.VISIBLE);
        }
        
        // Display occasion
        if (outfit.getOccasion() != null && !outfit.getOccasion().isEmpty()) {
            binding.tvOccasion.setText(outfit.getOccasion());
        } else {
            binding.tvOccasion.setText("Not specified");
        }
        
        // Display notes
        if (outfit.getNotes() != null && !outfit.getNotes().isEmpty()) {
            binding.tvNotes.setText(outfit.getNotes());
        } else {
            binding.tvNotes.setText("No notes");
        }
        
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

    private void showDeleteDialog() {
        new AlertDialog.Builder(this)
                .setTitle("Delete Outfit?")
                .setMessage("This will permanently remove it from your outfit history.")
                .setPositiveButton("Delete", (d, w) -> {
                    int deletedId = Store.get().deleteOutfit(outfit.getOutfitId());
                    if (deletedId != -1) {
                        Intent out = new Intent();
                        out.putExtra(EXTRA_DELETED_ID, deletedId);
                        setResult(RESULT_DELETED, out);
                        finish();
                    } else {
                        Toast.makeText(this, "Failed to delete outfit", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
