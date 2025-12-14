package com.example.fitlognative.ui.wardrobe;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.fitlognative.R;
import com.example.fitlognative.model.ClothingItem;

import java.io.File;

import java.util.ArrayList;
import java.util.List;

public class ClothingAdapter extends RecyclerView.Adapter<ClothingAdapter.VH> {

    private final List<ClothingItem> data = new ArrayList<>();
    private final ActivityResultLauncher<Intent> detailsLauncher;

    public ClothingAdapter(ActivityResultLauncher<Intent> detailsLauncher) {
        this.detailsLauncher = detailsLauncher;
    }

    public void setData(List<ClothingItem> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    public void addOne(ClothingItem item) {
        data.add(0, item);
        notifyItemInserted(0);
    }

    public void updateOne(ClothingItem updated) {
        int index = -1;
        for (int i = 0; i < data.size(); i++) {
            if (data.get(i).getId() == updated.getId()) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            data.set(index, updated);
            notifyItemChanged(index);
        }
    }

    public void removeOne(int id) {
        int index = -1;
        for (int i = 0; i < data.size(); i++) {
            if (data.get(i).getId() == id) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            data.remove(index);
            notifyItemRemoved(index);
        }
    }


    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_clothing, parent, false);
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
        
        h.itemView.setOnClickListener(v -> {
            Intent i = new Intent(v.getContext(), ItemDetailsActivity.class);
            i.putExtra(ItemDetailsActivity.EXTRA_ITEM, it);
            detailsLauncher.launch(i);
        });
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final ImageView thumb;
        final TextView title;
        final TextView subtitle;

        VH(@NonNull View itemView) {
            super(itemView);
            thumb = itemView.findViewById(R.id.image);
            title = itemView.findViewById(R.id.title);
            subtitle = itemView.findViewById(R.id.subtitle);
        }
    }
}
