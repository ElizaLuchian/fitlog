import type { ClothingItem } from "./ClothingItem";

export interface Outfit {
  outfitId: number;
  userId: number;
  items: number[]; // References to ClothingItem IDs
  occasion: string;
  aestheticStyleType: string;
  photo: string;
  notes: string;
  createdAt: string;
}

export interface OutfitWithItems extends Outfit {
  clothingItems: ClothingItem[];
}


