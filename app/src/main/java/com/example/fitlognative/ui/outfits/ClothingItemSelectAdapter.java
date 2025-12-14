package com.example.fitlognative.ui.outfits;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.example.fitlognative.R;
import com.example.fitlognative.model.ClothingItem;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ClothingItemSelectAdapter extends RecyclerView.Adapter<ClothingItemSelectAdapter.VH> {

    private final List<ClothingItem> data = new ArrayList<>();
    private final Set<Integer> selectedIds = new HashSet<>();
    private OnSelectionChangeListener listener;

    public interface OnSelectionChangeListener {
        void onSelectionChanged(int selectedCount);
    }

    public ClothingItemSelectAdapter(OnSelectionChangeListener listener) {
        this.listener = listener;
    }

    public void setData(List<ClothingItem> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_clothing_select, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        ClothingItem it = data.get(position);
        h.title.setText(it.getName());
        h.subtitle.setText(it.getCategory());

        // Load image from photo path if available
        if (it.getPhoto() != null && !it.getPhoto().isEmpty()) {
            File imageFile = new File(it.getPhoto());
            if (imageFile.exists()) {
                Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
                if (bitmap != null) {
                    h.thumb.setImageBitmap(bitmap);
                } else {
                    h.thumb.setImageResource(R.drawable.ic_shirt);
                }
            } else {
                h.thumb.setImageResource(R.drawable.ic_shirt);
            }
        } else {
            h.thumb.setImageResource(R.drawable.ic_shirt);
        }

        // Show/hide selection indicator
        boolean isSelected = selectedIds.contains(it.getId());
        h.selectionIndicator.setVisibility(isSelected ? View.VISIBLE : View.GONE);

        // Handle click
        h.itemView.setOnClickListener(v -> {
            if (selectedIds.contains(it.getId())) {
                selectedIds.remove(it.getId());
            } else {
                selectedIds.add(it.getId());
            }
            notifyItemChanged(position);
            if (listener != null) {
                listener.onSelectionChanged(selectedIds.size());
            }
        });
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public List<Integer> getSelectedItemIds() {
        return new ArrayList<>(selectedIds);
    }

    static class VH extends RecyclerView.ViewHolder {
        final ImageView thumb;
        final TextView title;
        final TextView subtitle;
        final View selectionIndicator;

        VH(@NonNull View itemView) {
            super(itemView);
            thumb = itemView.findViewById(R.id.image);
            title = itemView.findViewById(R.id.title);
            subtitle = itemView.findViewById(R.id.subtitle);
            selectionIndicator = itemView.findViewById(R.id.selectionIndicator);
        }
    }
}

