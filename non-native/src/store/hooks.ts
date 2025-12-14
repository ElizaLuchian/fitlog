import { useSyncExternalStore, useEffect } from "react";
import { Alert } from "react-native";
import { store, type WardrobeState } from "./hybridStore";
import type { ClothingItem } from "@models/ClothingItem";
import type { Outfit } from "@models/Outfit";
import type { RepositoryError } from "./repository";
import type { ServerError } from "./serverRepository";

// Internal hook to get the current state (observer pattern)
function useWardrobeState(): WardrobeState {
  return useSyncExternalStore(
    listener => store.subscribe(listener),
    () => store.getState()
  );
}

// Helper to show errors to user
function showError(error: RepositoryError | ServerError) {
  // Check if it's a network error
  const isNetworkError = 'isNetworkError' in error && error.isNetworkError;
  
  Alert.alert(
    isNetworkError ? "Offline" : "Error",
    isNetworkError 
      ? "You're offline. Your changes will be synced when connection is restored."
      : `${error.message}${error.details ? `\n\n${error.details}` : ""}`,
    [{ text: "OK" }]
  );
}

/**
 * Hook for Wardrobe operations with async support and error handling.
 * - Uses observer pattern to listen for state changes
 * - Handles persistence errors and presents them to the user
 * - All CRUD operations are async and run in separate threads
 */
export function useWardrobe() {
  const state = useWardrobeState();

  // Initialize store on first mount
  useEffect(() => {
    const initStore = async () => {
      await store.initialize();
    };
    initStore();
  }, []);

  return {
    items: state.items,
    isLoading: state.isLoading,
    isSyncing: state.isSyncing,
    isOnline: state.isOnline,
    queuedOperations: state.queuedOperations,
    error: state.error,
    addItem: async (item: Omit<ClothingItem, "id">) => {
      const result = await store.addItem(item as ClothingItem);
      if (result.error) {
        showError(result.error);
      }
      return result;
    },
    updateClothingItem: async (
      id: number,
      name: string,
      category: ClothingItem["category"],
      color: string,
      brand: string,
      size: string,
      material: string,
      notes: string
    ) => {
      const result = await store.updateClothingItem(id, name, category, color, brand, size, material, notes);
      if (result.error) {
        showError(result.error);
      }
      return result;
    },
    deleteItem: async (id: number) => {
      const result = await store.deleteItem(id);
      if (result.error) {
        showError(result.error);
      }
      return result;
    },
    getOutfitsContainingItem: (itemId: number) => store.getOutfitsContainingItemArray(itemId),
    getOutfitsContainingItemCount: (itemId: number) => store.getOutfitsContainingItem(itemId)
  };
}

/**
 * Hook for Outfits operations with async support and error handling.
 * - Uses observer pattern to listen for state changes
 * - Handles persistence errors and presents them to the user
 * - All CRUD operations are async and run in separate threads
 */
export function useOutfits() {
  const state = useWardrobeState();

  // Initialize store on first mount
  useEffect(() => {
    const initStore = async () => {
      await store.initialize();
    };
    initStore();
  }, []);

  return {
    outfits: state.outfits,
    isLoading: state.isLoading,
    isSyncing: state.isSyncing,
    isOnline: state.isOnline,
    queuedOperations: state.queuedOperations,
    error: state.error,
    addOutfit: async (outfit: Omit<Outfit, "outfitId">) => {
      const result = await store.addOutfit(outfit as Outfit);
      if (result.error) {
        showError(result.error);
      }
      return result;
    },
    updateOutfit: async (
      id: number,
      occasion: string,
      aestheticStyle: string,
      notes: string
    ) => {
      const result = await store.updateOutfit(id, occasion, aestheticStyle, notes);
      if (result.error) {
        showError(result.error);
      }
      return result;
    },
    deleteOutfit: async (id: number) => {
      const result = await store.deleteOutfit(id);
      if (result.error) {
        showError(result.error);
      }
      return result;
    }
  };
}

// Legacy hook for backward compatibility (can be removed later)
export function useWardrobeViewModel() {
  const wardrobe = useWardrobe();
  const outfits = useOutfits();

  return {
    items: wardrobe.items,
    outfits: outfits.outfits,
    isLoading: wardrobe.isLoading || outfits.isLoading,
    isSyncing: wardrobe.isSyncing || outfits.isSyncing,
    isOnline: wardrobe.isOnline,
    queuedOperations: wardrobe.queuedOperations,
    error: wardrobe.error || outfits.error,
    addItem: wardrobe.addItem,
    updateClothingItem: wardrobe.updateClothingItem,
    deleteItem: wardrobe.deleteItem,
    addOutfit: outfits.addOutfit,
    updateOutfit: outfits.updateOutfit,
    deleteOutfit: outfits.deleteOutfit,
    getOutfitsContainingItem: wardrobe.getOutfitsContainingItem
  };
}


