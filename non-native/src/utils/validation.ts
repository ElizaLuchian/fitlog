import type { ClothingItem } from "@models/ClothingItem";

// Constants matching Java code
export const CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"] as const;
export const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const AESTHETIC_STYLES = [
  "Streetwear",
  "Minimalist",
  "Vintage",
  "Casual",
  "Formal",
  "Bohemian",
  "Athletic",
  "Classic",
  "Trendy",
  "Elegant"
] as const;

export type ClothingCategory = typeof CATEGORIES[number];
export type ValidSize = typeof VALID_SIZES[number];
export type AestheticStyle = typeof AESTHETIC_STYLES[number];

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Clothing Item Validation
export interface ClothingItemFormData {
  name: string;
  category: string;
  color: string;
  brand: string;
  size: string;
  material: string;
  notes: string;
}

export interface ClothingItemValidationErrors {
  name?: string;
  category?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string;
  notes?: string;
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Name is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: "Name must be less than 100 characters" };
  }
  return { isValid: true };
}

export function validateCategory(category: string): ValidationResult {
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Category is required" };
  }
  if (!CATEGORIES.includes(trimmed as ClothingCategory)) {
    return { isValid: false, error: "Please select a valid category" };
  }
  return { isValid: true };
}

export function validateColor(color: string): ValidationResult {
  const trimmed = color.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Color is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Color must be at least 2 characters" };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: "Color must be less than 50 characters" };
  }
  return { isValid: true };
}

export function validateBrand(brand: string): ValidationResult {
  const trimmed = brand.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Brand is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Brand must be at least 2 characters" };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: "Brand must be less than 50 characters" };
  }
  return { isValid: true };
}

export function validateSize(size: string): ValidationResult {
  const trimmed = size.trim().toUpperCase();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Size is required" };
  }
  if (!VALID_SIZES.includes(trimmed as ValidSize)) {
    return { isValid: false, error: "Size must be one of: XS, S, M, L, XL, XXL" };
  }
  return { isValid: true };
}

export function validateMaterial(material: string): ValidationResult {
  const trimmed = material.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Material is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Material must be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: "Material must be less than 100 characters" };
  }
  return { isValid: true };
}

export function validateNotes(notes: string): ValidationResult {
  const trimmed = notes.trim();
  // Notes is optional, but if provided, validate it
  if (trimmed.length > 500) {
    return { isValid: false, error: "Notes must be less than 500 characters" };
  }
  return { isValid: true };
}

// Validate entire clothing item form
export function validateClothingItemForm(
  data: ClothingItemFormData
): { isValid: boolean; errors: ClothingItemValidationErrors } {
  const errors: ClothingItemValidationErrors = {};

  const nameResult = validateName(data.name);
  if (!nameResult.isValid) errors.name = nameResult.error;

  const categoryResult = validateCategory(data.category);
  if (!categoryResult.isValid) errors.category = categoryResult.error;

  const colorResult = validateColor(data.color);
  if (!colorResult.isValid) errors.color = colorResult.error;

  const brandResult = validateBrand(data.brand);
  if (!brandResult.isValid) errors.brand = brandResult.error;

  const sizeResult = validateSize(data.size);
  if (!sizeResult.isValid) errors.size = sizeResult.error;

  const materialResult = validateMaterial(data.material);
  if (!materialResult.isValid) errors.material = materialResult.error;

  const notesResult = validateNotes(data.notes);
  if (!notesResult.isValid) errors.notes = notesResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Outfit Validation
export interface OutfitFormData {
  itemIds: number[];
  occasion: string;
  aestheticStyle: string;
  notes: string;
}

export interface OutfitValidationErrors {
  items?: string;
  occasion?: string;
  aestheticStyle?: string;
  notes?: string;
}

export function validateOutfitItems(itemIds: number[], allItemIds: number[]): ValidationResult {
  if (!itemIds || itemIds.length === 0) {
    return { isValid: false, error: "Please select at least one clothing item" };
  }
  // Validate that selected items actually exist in the store
  for (const itemId of itemIds) {
    if (!allItemIds.includes(itemId)) {
      return {
        isValid: false,
        error: "One or more selected items no longer exist"
      };
    }
  }
  return { isValid: true };
}

export function validateOccasion(occasion: string): ValidationResult {
  const trimmed = occasion.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Occasion is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Occasion must be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: "Occasion must be less than 100 characters" };
  }
  return { isValid: true };
}

export function validateAestheticStyle(aestheticStyle: string): ValidationResult {
  const trimmed = aestheticStyle.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Aesthetic style is required" };
  }
  if (!AESTHETIC_STYLES.includes(trimmed as AestheticStyle)) {
    return { isValid: false, error: "Please select a valid aesthetic style" };
  }
  return { isValid: true };
}

// Validate entire outfit form
export function validateOutfitForm(
  data: OutfitFormData,
  allItemIds: number[]
): { isValid: boolean; errors: OutfitValidationErrors } {
  const errors: OutfitValidationErrors = {};

  const itemsResult = validateOutfitItems(data.itemIds, allItemIds);
  if (!itemsResult.isValid) errors.items = itemsResult.error;

  const occasionResult = validateOccasion(data.occasion);
  if (!occasionResult.isValid) errors.occasion = occasionResult.error;

  const aestheticStyleResult = validateAestheticStyle(data.aestheticStyle);
  if (!aestheticStyleResult.isValid)
    errors.aestheticStyle = aestheticStyleResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

