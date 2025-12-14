package com.example.fitlognative.ui.wardrobe;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.fitlognative.R;
import com.example.fitlognative.data.Store;
import com.example.fitlognative.databinding.ActivityItemDetailsBinding;
import com.example.fitlognative.model.ClothingItem;

import java.io.File;

public class ItemDetailsActivity extends AppCompatActivity {

    public static final String EXTRA_ITEM = "extra_item";
    public static final String EXTRA_DELETED_ID = "extra_deleted_id";
    public static final String EXTRA_DELETED_OUTFITS_COUNT = "extra_deleted_outfits_count";
    public static final int RESULT_UPDATED = 2001;
    public static final int RESULT_DELETED = 2002;

    private ClothingItem item;
    private ActivityItemDetailsBinding binding;

    private final ActivityResultLauncher<Intent> editLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == EditClothingItemActivity.RESULT_UPDATED && result.getData() != null) {
                    ClothingItem updated = (ClothingItem) result.getData().getSerializableExtra("updated_item");
                    if (updated != null) {
                        this.item = updated;
                        fillUI();

                        Intent out = new Intent();
                        out.putExtra(EXTRA_ITEM, updated);
                        setResult(RESULT_UPDATED, out);
                    }
                } else if (result.getResultCode() == RESULT_DELETED && result.getData() != null) {
                    // Handle deletion from EditClothingItemActivity - pass it through to WardrobeFragment
                    int deletedId = result.getData().getIntExtra(EXTRA_DELETED_ID, -1);
                    int deletedOutfitsCount = result.getData().getIntExtra(EXTRA_DELETED_OUTFITS_COUNT, 0);
                    if (deletedId != -1) {
                        Intent out = new Intent();
                        out.putExtra(EXTRA_DELETED_ID, deletedId);
                        out.putExtra(EXTRA_DELETED_OUTFITS_COUNT, deletedOutfitsCount);
                        setResult(RESULT_DELETED, out);
                        finish();
                    }
                }
            });

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityItemDetailsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Setup toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        item = (ClothingItem) getIntent().getSerializableExtra(EXTRA_ITEM);
        if (item == null) {
            finish();
            return;
        }

        fillUI();

        binding.btnEdit.setOnClickListener(v -> {
            try {
                Intent i = new Intent(this, EditClothingItemActivity.class);
                i.putExtra(EXTRA_ITEM, item);
                editLauncher.launch(i);
            } catch (Exception e) {
                e.printStackTrace();
                android.util.Log.e("ItemDetails", "Error launching edit activity", e);
            }
        });

        binding.btnDelete.setOnClickListener(v -> showDeleteDialog());
    }

    private void fillUI() {
        binding.tvName.setText(item.getName());
        binding.tvCategory.setText(item.getCategory());
        binding.tvColor.setText(item.getColor() != null ? item.getColor() : "");
        binding.tvBrand.setText(item.getBrand() != null ? item.getBrand() : "");
        binding.tvSize.setText(item.getSize() != null ? item.getSize() : "");
        binding.tvMaterial.setText(item.getMaterial() != null ? item.getMaterial() : "");
        binding.tvNotes.setText(item.getNotes() != null && !item.getNotes().isEmpty() ? item.getNotes() : "No notes");
        
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
                        out.putExtra(EXTRA_DELETED_ID, deletedId);
                        out.putExtra(EXTRA_DELETED_OUTFITS_COUNT, outfitsCount);
                        setResult(RESULT_DELETED, out);
                        finish();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
