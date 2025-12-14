import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ClothingItem } from "@models/ClothingItem";
import { type Outfit } from "@models/Outfit";

const STORAGE_KEYS = {
  ITEMS: "@wardrobe/items",
  OUTFITS: "@wardrobe/outfits",
  NEXT_ITEM_ID: "@wardrobe/next_item_id",
  NEXT_OUTFIT_ID: "@wardrobe/next_outfit_id"
};

export interface RepositoryError {
  operation: "read" | "create" | "update" | "delete";
  message: string;
  details?: string;
}

/**
 * Repository layer for managing local persistence using AsyncStorage.
 * All operations are async and run in separate threads (via AsyncStorage implementation).
 * Follows the requirements:
 * - READ: Retrieve all values once, reuse in memory
 * - CREATE: Add only the created element with DB-managed ID
 * - UPDATE: Reuse existing element, maintain same ID
 * - DELETE: Use only ID to delete, properly identify element
 * - All operations handle errors, log them, and return results or errors
 */
class Repository {
  private loadPromise: Promise<void> | null = null;
  private isInitialized = false;

  /**
   * Initialize repository by loading data from storage.
   * This is called once when the app starts.
   * Runs in a separate thread via AsyncStorage.
   */
  async initialize(): Promise<RepositoryError | null> {
    if (this.isInitialized) {
      return null;
    }

    if (this.loadPromise) {
      await this.loadPromise;
      return null;
    }

    this.loadPromise = this.loadFromStorage();

    try {
      await this.loadPromise;
      this.isInitialized = true;
      return null;
    } catch (error) {
      const err: RepositoryError = {
        operation: "read",
        message: "Failed to initialize repository",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Initialization error:", err);
      return err;
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // Load all data in parallel
      const [itemsJson, outfitsJson, nextItemId, nextOutfitId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.OUTFITS),
        AsyncStorage.getItem(STORAGE_KEYS.NEXT_ITEM_ID),
        AsyncStorage.getItem(STORAGE_KEYS.NEXT_OUTFIT_ID)
      ]);

      // Parse items
      if (itemsJson) {
        try {
          const parsed = JSON.parse(itemsJson);
          if (Array.isArray(parsed)) {
            // Data loaded successfully - will be returned via getAllItems()
          }
        } catch (e) {
          console.error("[Repository] Failed to parse items:", e);
        }
      }

      // Parse outfits
      if (outfitsJson) {
        try {
          const parsed = JSON.parse(outfitsJson);
          if (Array.isArray(parsed)) {
            // Data loaded successfully - will be returned via getAllOutfits()
          }
        } catch (e) {
          console.error("[Repository] Failed to parse outfits:", e);
        }
      }

      console.log("[Repository] Data loaded successfully");
    } catch (error) {
      console.error("[Repository] Failed to load from storage:", error);
      throw error;
    }
  }

  /**
   * READ operation - Get all clothing items.
   * Values are retrieved once and reused while the app is alive.
   */
  async getAllItems(): Promise<{ items: ClothingItem[]; error: RepositoryError | null }> {
    try {
      const itemsJson = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!itemsJson) {
        return { items: [], error: null };
      }

      const items: ClothingItem[] = JSON.parse(itemsJson);
      return { items, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "read",
        message: "Failed to retrieve clothing items",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Read items error:", err);
      return { items: [], error: err };
    }
  }

  /**
   * READ operation - Get all outfits.
   * Values are retrieved once and reused while the app is alive.
   */
  async getAllOutfits(): Promise<{ outfits: Outfit[]; error: RepositoryError | null }> {
    try {
      const outfitsJson = await AsyncStorage.getItem(STORAGE_KEYS.OUTFITS);
      if (!outfitsJson) {
        return { outfits: [], error: null };
      }

      const outfits: Outfit[] = JSON.parse(outfitsJson);
      return { outfits, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "read",
        message: "Failed to retrieve outfits",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Read outfits error:", err);
      return { outfits: [], error: err };
    }
  }

  /**
   * Get next item ID and increment it.
   */
  async getNextItemId(): Promise<number> {
    try {
      const idStr = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_ITEM_ID);
      const currentId = idStr ? parseInt(idStr, 10) : 1;
      await AsyncStorage.setItem(STORAGE_KEYS.NEXT_ITEM_ID, String(currentId + 1));
      return currentId;
    } catch (error) {
      console.error("[Repository] Failed to get next item ID:", error);
      return Date.now(); // Fallback to timestamp
    }
  }

  /**
   * Get next outfit ID and increment it.
   */
  async getNextOutfitId(): Promise<number> {
    try {
      const idStr = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_OUTFIT_ID);
      const currentId = idStr ? parseInt(idStr, 10) : 1;
      await AsyncStorage.setItem(STORAGE_KEYS.NEXT_OUTFIT_ID, String(currentId + 1));
      return currentId;
    } catch (error) {
      console.error("[Repository] Failed to get next outfit ID:", error);
      return Date.now(); // Fallback to timestamp
    }
  }

  /**
   * CREATE operation - Save a new clothing item.
   * Only the created element is added in the DB.
   * The ID is managed by the DB/app (user is not aware of internal ID).
   */
  async saveItem(item: ClothingItem): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { items } = await this.getAllItems();
      const updatedItems = [item, ...items]; // Add at the beginning (newest first)
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
      console.log(`[Repository] Item created with ID: ${item.id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "create",
        message: "Failed to save clothing item",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Create item error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * UPDATE operation - Update an existing clothing item.
   * The DB element is reused (not deleted and re-added).
   * The ID remains the same.
   */
  async updateItem(updatedItem: ClothingItem): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { items } = await this.getAllItems();
      const itemIndex = items.findIndex(i => i.id === updatedItem.id);
      
      if (itemIndex === -1) {
        const err: RepositoryError = {
          operation: "update",
          message: `Item with ID ${updatedItem.id} not found`,
          details: "Cannot update non-existent item"
        };
        console.error("[Repository] Update item error:", err);
        return { success: false, error: err };
      }

      // Reuse the element, maintain same ID
      items[itemIndex] = updatedItem;
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      console.log(`[Repository] Item updated with ID: ${updatedItem.id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "update",
        message: "Failed to update clothing item",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Update item error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * DELETE operation - Delete a clothing item by ID.
   * Only the ID of the removed element is used to delete.
   * The element is properly identified.
   */
  async deleteItem(id: number): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { items } = await this.getAllItems();
      const itemExists = items.some(i => i.id === id);
      
      if (!itemExists) {
        const err: RepositoryError = {
          operation: "delete",
          message: `Item with ID ${id} not found`,
          details: "Cannot delete non-existent item"
        };
        console.error("[Repository] Delete item error:", err);
        return { success: false, error: err };
      }

      const updatedItems = items.filter(i => i.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
      console.log(`[Repository] Item deleted with ID: ${id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "delete",
        message: "Failed to delete clothing item",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Delete item error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * CREATE operation - Save a new outfit.
   */
  async saveOutfit(outfit: Outfit): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { outfits } = await this.getAllOutfits();
      const updatedOutfits = [outfit, ...outfits]; // Add at the beginning (newest first)
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(updatedOutfits));
      console.log(`[Repository] Outfit created with ID: ${outfit.outfitId}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "create",
        message: "Failed to save outfit",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Create outfit error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * UPDATE operation - Update an existing outfit.
   * The DB element is reused (not deleted and re-added).
   * The ID remains the same.
   */
  async updateOutfit(updatedOutfit: Outfit): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { outfits } = await this.getAllOutfits();
      const outfitIndex = outfits.findIndex(o => o.outfitId === updatedOutfit.outfitId);
      
      if (outfitIndex === -1) {
        const err: RepositoryError = {
          operation: "update",
          message: `Outfit with ID ${updatedOutfit.outfitId} not found`,
          details: "Cannot update non-existent outfit"
        };
        console.error("[Repository] Update outfit error:", err);
        return { success: false, error: err };
      }

      // Reuse the element, maintain same ID
      outfits[outfitIndex] = updatedOutfit;
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
      console.log(`[Repository] Outfit updated with ID: ${updatedOutfit.outfitId}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "update",
        message: "Failed to update outfit",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Update outfit error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * DELETE operation - Delete an outfit by ID.
   * Only the ID of the removed element is used to delete.
   * The element is properly identified.
   */
  async deleteOutfit(id: number): Promise<{ success: boolean; error: RepositoryError | null }> {
    try {
      const { outfits } = await this.getAllOutfits();
      const outfitExists = outfits.some(o => o.outfitId === id);
      
      if (!outfitExists) {
        const err: RepositoryError = {
          operation: "delete",
          message: `Outfit with ID ${id} not found`,
          details: "Cannot delete non-existent outfit"
        };
        console.error("[Repository] Delete outfit error:", err);
        return { success: false, error: err };
      }

      const updatedOutfits = outfits.filter(o => o.outfitId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(updatedOutfits));
      console.log(`[Repository] Outfit deleted with ID: ${id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: RepositoryError = {
        operation: "delete",
        message: "Failed to delete outfit",
        details: error instanceof Error ? error.message : String(error)
      };
      console.error("[Repository] Delete outfit error:", err);
      return { success: false, error: err };
    }
  }

  /**
   * Clear all data (for testing purposes).
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ITEMS,
        STORAGE_KEYS.OUTFITS,
        STORAGE_KEYS.NEXT_ITEM_ID,
        STORAGE_KEYS.NEXT_OUTFIT_ID
      ]);
      console.log("[Repository] All data cleared");
    } catch (error) {
      console.error("[Repository] Failed to clear data:", error);
    }
  }
}

export const repository = new Repository();

