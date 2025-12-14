package com.example.fitlognative.ui.outfits;

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
import com.example.fitlognative.model.Outfit;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class OutfitAdapter extends RecyclerView.Adapter<OutfitAdapter.VH> {

    private final List<Outfit> data = new ArrayList<>();
    private final ActivityResultLauncher<Intent> detailsLauncher;

    public OutfitAdapter(ActivityResultLauncher<Intent> detailsLauncher) {
        this.detailsLauncher = detailsLauncher;
    }

    public void setData(List<Outfit> outfits) {
        data.clear();
        if (outfits != null) data.addAll(outfits);
        notifyDataSetChanged();
    }

    public void addOne(Outfit outfit) {
        data.add(0, outfit);
        notifyItemInserted(0);
    }

    public void updateOne(Outfit updated) {
        int index = -1;
        for (int i = 0; i < data.size(); i++) {
            if (data.get(i).getOutfitId() == updated.getOutfitId()) {
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
            if (data.get(i).getOutfitId() == id) {
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
                .inflate(R.layout.item_outfit, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Outfit outfit = data.get(position);
        
        // Format date
        String dateText = formatDate(outfit.getCreatedAt());
        h.date.setText(dateText);
        
        // Set occasion tag (use occasion if available, otherwise aesthetic style)
        String tagText = outfit.getOccasion() != null && !outfit.getOccasion().isEmpty()
                ? outfit.getOccasion()
                : (outfit.getAestheticStyleType() != null && !outfit.getAestheticStyleType().isEmpty()
                    ? outfit.getAestheticStyleType() : "Casual");
        h.styleTag.setText(tagText);
        
        // Load and display image
        if (outfit.getPhoto() != null && !outfit.getPhoto().isEmpty()) {
            File imageFile = new File(outfit.getPhoto());
            if (imageFile.exists()) {
                Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
                if (bitmap != null) {
                    h.image.setImageBitmap(bitmap);
                } else {
                    h.image.setImageResource(R.drawable.ic_shirt);
                }
            } else {
                h.image.setImageResource(R.drawable.ic_shirt);
            }
        } else {
            h.image.setImageResource(R.drawable.ic_shirt);
        }
        
        h.itemView.setOnClickListener(v -> {
            Intent i = new Intent(v.getContext(), OutfitDetailsActivity.class);
            i.putExtra(OutfitDetailsActivity.EXTRA_OUTFIT, outfit);
            detailsLauncher.launch(i);
        });
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

    @Override
    public int getItemCount() {
        return data.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final ImageView image;
        final TextView date;
        final TextView styleTag;

        VH(@NonNull View itemView) {
            super(itemView);
            image = itemView.findViewById(R.id.image);
            date = itemView.findViewById(R.id.tvDate);
            styleTag = itemView.findViewById(R.id.tvStyleTag);
        }
    }
}

