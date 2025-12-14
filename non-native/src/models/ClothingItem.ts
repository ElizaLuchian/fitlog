export type ClothingCategory = "Tops" | "Bottoms" | "Outerwear" | "Footwear" | "Accessories";

export interface ClothingItem {
  id: number;
  name: string;
  category: ClothingCategory;
  color: string;
  brand: string;
  size: string;
  material: string;
  photo: string; // Image URI or local file path
  notes: string;
}


