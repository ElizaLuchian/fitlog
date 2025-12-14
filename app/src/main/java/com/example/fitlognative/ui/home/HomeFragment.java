package com.example.fitlognative.ui.home;

import android.content.Intent;
import android.os.Bundle;
import android.view.*;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.fitlognative.databinding.FragmentHomeBinding;
import com.example.fitlognative.ui.wardrobe.AddClothingItemActivity;
import com.example.fitlognative.ui.outfits.AddOutfitActivity;

public class HomeFragment extends Fragment {
    private FragmentHomeBinding binding;

    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        
        binding.cardAddItem.setOnClickListener(v ->
                startActivity(new Intent(getActivity(), AddClothingItemActivity.class)));
        
        binding.cardLogOutfit.setOnClickListener(v ->
                startActivity(new Intent(getActivity(), AddOutfitActivity.class)));

        return binding.getRoot();
    }
}
