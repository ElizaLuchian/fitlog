package com.example.fitlognative.ui.wardrobe;

import android.content.Intent;
import android.os.Bundle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.example.fitlognative.data.Store;
import com.example.fitlognative.databinding.ActivityClothingItemDetailBinding;
import com.example.fitlognative.model.ClothingItem;

public class ClothingItemDetailsActivity extends AppCompatActivity {

    public static final String EXTRA_ITEM = "extra_item";
    public static final int RESULT_UPDATED = 2001;
    public static final int RESULT_DELETED = 2002;
    public static final String EXTRA_DELETED_ID = "extra_deleted_id";

    private ActivityClothingItemDetailBinding binding;
    private ClothingItem item;

    private final ActivityResultLauncher<Intent> editLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == RESULT_UPDATED && result.getData() != null) {
                    ClothingItem updated = result.getData().getParcelableExtra(EXTRA_ITEM);
                    if (updated != null) {
                        item = updated;
                        fillUI();
                    }
                }
            });

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityClothingItemDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        item = getIntent().getParcelableExtra(EXTRA_ITEM);
        if (item == null) finish();

        fillUI();

        binding.btnEdit.setOnClickListener(v -> {
            Intent i = new Intent(this, EditClothingItemActivity.class);
            i.putExtra(EXTRA_ITEM, item);
            editLauncher.launch(i);
        });

        binding.btnDelete.setOnClickListener(v -> confirmDelete());
    }

    private void confirmDelete() {
        new AlertDialog.Builder(this)
                .setTitle("Delete Item")
                .setMessage("Are you sure you want to delete this item?")
                .setPositiveButton("Delete", (dialog, which) -> {
                    int deletedId = Store.get().deleteItem(item.getId());
                    Intent out = new Intent();
                    out.putExtra(EXTRA_DELETED_ID, deletedId);
                    setResult(RESULT_DELETED, out);
                    finish();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void fillUI() {
        binding.tvName.setText(item.getName());
        binding.tvCategory.setText("Category: " + item.getCategory());
        binding.tvColor.setText("Color: " + item.getColor());
        binding.tvBrand.setText("Brand: " + item.getBrand());
        binding.tvSize.setText("Size: " + item.getSize());
        binding.tvMaterial.setText("Material: " + item.getMaterial());
        binding.tvNotes.setText(item.getNotes().isEmpty() ? "No notes" : item.getNotes());
    }
}
