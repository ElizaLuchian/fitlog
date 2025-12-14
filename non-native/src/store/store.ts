import { type ClothingItem } from "@models/ClothingItem";
import { type Outfit } from "@models/Outfit";
import { repository, type RepositoryError } from "./repository";

export interface WardrobeState {
  items: ClothingItem[];
  outfits: Outfit[];
  isLoading: boolean;
  error: RepositoryError | null;
}

type StoreListener = (state: WardrobeState) => void;

const initialState: WardrobeState = {
  items: [],
  outfits: [],
  isLoading: true,
  error: null
};

/**
 * Store with observer/LiveData pattern and repository integration.
 * - Values are retrieved once and reused while the application is alive
 * - A separate repository is used for persistence
 * - Values are retrieved in a separate thread/coroutine (via AsyncStorage)
 * - Observer mechanism is used to listen for changes
 * - Errors are handled, presented to user, and logged
 */
class Store {
  private state: WardrobeState = initialState;
  private listeners: StoreListener[] = [];
  private isInitialized = false;

  /**
   * Initialize store by loading data from repository.
   * This runs in a separate thread via AsyncStorage.
   * Uses observer pattern to notify listeners of changes.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("[Store] Initializing...");
    
    // Initialize repository first
    const repoError = await repository.initialize();
    if (repoError) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: repoError
      };
      this.notify();
      return;
    }

    // Load all data from repository (retrieved once and reused)
    const [itemsResult, outfitsResult] = await Promise.all([
      repository.getAllItems(),
      repository.getAllOutfits()
    ]);

    // Handle errors
    if (itemsResult.error || outfitsResult.error) {
      const error = itemsResult.error || outfitsResult.error;
      console.error("[Store] Failed to load data:", error);
      this.state = {
        items: itemsResult.items,
        outfits: outfitsResult.outfits,
        isLoading: false,
        error: error || null
      };
      this.notify();
      return;
    }

    // Success - data loaded and will be reused
    console.log(`[Store] Loaded ${itemsResult.items.length} items and ${outfitsResult.outfits.length} outfits`);
    this.state = {
      items: itemsResult.items,
      outfits: outfitsResult.outfits,
      isLoading: false,
      error: null
    };
    this.isInitialized = true;
    this.notify();
  }

  /**
   * Subscribe to state changes (Observer/LiveData pattern).
   * Listeners are notified whenever state changes.
   */
  subscribe(listener: StoreListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all observers of state changes.
   */
  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Getter methods
  getState(): WardrobeState {
    return this.state;
  }

  getClothingItems(): ClothingItem[] {
    return this.state.items;
  }

  getOutfits(): Outfit[] {
    return this.state.outfits;
  }

  /**
   * CREATE — Only the created element is added in the DB.
   * The ID is managed by the DB/app. The user is not aware of the internal ID.
   * If we have persistence errors, messages are handled, presented to user, and logged.
   */
  async addItem(item: ClothingItem): Promise<{ item: ClothingItem | null; error: RepositoryError | null }> {
    // Get next ID from repository
    const id = await repository.getNextItemId();
    const newItem: ClothingItem = { ...item, id };

    // Save to repository
    const { success, error } = await repository.saveItem(newItem);

    if (!success || error) {
      console.error("[Store] Failed to add item:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { item: null, error };
    }

    // Update in-memory state (reuse loaded data)
    this.state = {
      ...this.state,
      items: [newItem, ...this.state.items],
      error: null
    };
    this.notify();
    console.log(`[Store] Item added with ID: ${id}`);
    return { item: newItem, error: null };
  }

  /**
   * UPDATE — The DB element is reused (not deleted and then a new one is added).
   * The ID remains the same.
   * If we have persistence errors, messages are handled, presented to user, and logged.
   */
  async updateClothingItem(
    id: number,
    name: string,
    category: ClothingItem["category"],
    color: string,
    brand: string,
    size: string,
    material: string,
    notes: string
  ): Promise<{ item: ClothingItem | null; error: RepositoryError | null }> {
    const item = this.state.items.find(i => i.id === id);
    if (!item) {
      const error: RepositoryError = {
        operation: "update",
        message: `Item with ID ${id} not found in memory`
      };
      console.error("[Store] Update failed:", error);
      return { item: null, error };
    }

    // Reuse element with same ID
    const updated: ClothingItem = {
      ...item,
      name,
      category,
      color,
      brand,
      size,
      material,
      notes
      // Photo is not editable per requirements
    };

    // Update in repository
    const { success, error } = await repository.updateItem(updated);

    if (!success || error) {
      console.error("[Store] Failed to update item:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { item: null, error };
    }

    // Update in-memory state
    this.state = {
      ...this.state,
      items: this.state.items.map(i => (i.id === id ? updated : i)),
      error: null
    };
    this.notify();
    console.log(`[Store] Item updated with ID: ${id}`);
    return { item: updated, error: null };
  }

  /**
   * DELETE — Only the ID of the removed element is used to delete.
   * The element is properly identified.
   * If we have persistence errors, messages are logged and presented to user.
   * Also deletes any outfits that contain this item (cascading delete).
   */
  async deleteItem(id: number): Promise<{ deletedId: number; error: RepositoryError | null }> {
    // First, find and delete all outfits that contain this item
    const outfitsToDelete: number[] = [];
    for (const outfit of this.state.outfits) {
      if (outfit.items && outfit.items.includes(id)) {
        outfitsToDelete.push(outfit.outfitId);
      }
    }

    // Delete the outfits (cascading delete)
    for (const outfitId of outfitsToDelete) {
      await this.deleteOutfit(outfitId);
    }

    // Delete from repository using only the ID
    const { success, error } = await repository.deleteItem(id);

    if (!success || error) {
      console.error("[Store] Failed to delete item:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { deletedId: -1, error };
    }

    // Update in-memory state
    this.state = {
      ...this.state,
      items: this.state.items.filter(i => i.id !== id),
      error: null
    };
    this.notify();
    console.log(`[Store] Item deleted with ID: ${id}`);
    return { deletedId: id, error: null };
  }

  // Helper method to get count of outfits that contain a specific item
  getOutfitsContainingItem(itemId: number): number {
    let count = 0;
    for (const outfit of this.state.outfits) {
      if (outfit.items && outfit.items.includes(itemId)) {
        count++;
      }
    }
    return count;
  }

  // Helper method to get outfits array that contain a specific item (for React components)
  getOutfitsContainingItemArray(itemId: number): Outfit[] {
    return this.state.outfits.filter(
      o => o.items && o.items.includes(itemId)
    );
  }

  // Outfit CRUD operations
  /**
   * CREATE — Only the created element is added in the DB.
   * The ID is managed by the DB/app.
   */
  async addOutfit(outfit: Outfit): Promise<{ outfit: Outfit | null; error: RepositoryError | null }> {
    // Get next ID from repository
    const outfitId = await repository.getNextOutfitId();
    const newOutfit: Outfit = { ...outfit, outfitId };

    // Save to repository
    const { success, error } = await repository.saveOutfit(newOutfit);

    if (!success || error) {
      console.error("[Store] Failed to add outfit:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { outfit: null, error };
    }

    // Update in-memory state
    this.state = {
      ...this.state,
      outfits: [newOutfit, ...this.state.outfits],
      error: null
    };
    this.notify();
    console.log(`[Store] Outfit added with ID: ${outfitId}`);
    return { outfit: newOutfit, error: null };
  }

  /**
   * UPDATE — The DB element is reused. The ID remains the same.
   */
  async updateOutfit(
    id: number,
    occasion: string,
    aestheticStyle: string,
    notes: string
  ): Promise<{ outfit: Outfit | null; error: RepositoryError | null }> {
    const outfit = this.state.outfits.find(o => o.outfitId === id);
    if (!outfit) {
      const error: RepositoryError = {
        operation: "update",
        message: `Outfit with ID ${id} not found in memory`
      };
      console.error("[Store] Update failed:", error);
      return { outfit: null, error };
    }

    // Reuse element with same ID
    const updated: Outfit = {
      ...outfit,
      occasion,
      aestheticStyleType: aestheticStyle,
      notes
    };

    // Update in repository
    const { success, error } = await repository.updateOutfit(updated);

    if (!success || error) {
      console.error("[Store] Failed to update outfit:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { outfit: null, error };
    }

    // Update in-memory state
    this.state = {
      ...this.state,
      outfits: this.state.outfits.map(o => (o.outfitId === id ? updated : o)),
      error: null
    };
    this.notify();
    console.log(`[Store] Outfit updated with ID: ${id}`);
    return { outfit: updated, error: null };
  }

  /**
   * DELETE — Only the ID of the removed element is used to delete.
   */
  async deleteOutfit(id: number): Promise<{ deletedId: number; error: RepositoryError | null }> {
    // Delete from repository using only the ID
    const { success, error } = await repository.deleteOutfit(id);

    if (!success || error) {
      console.error("[Store] Failed to delete outfit:", error);
      this.state = {
        ...this.state,
        error
      };
      this.notify();
      return { deletedId: -1, error };
    }

    // Update in-memory state
    this.state = {
      ...this.state,
      outfits: this.state.outfits.filter(o => o.outfitId !== id),
      error: null
    };
    this.notify();
    console.log(`[Store] Outfit deleted with ID: ${id}`);
    return { deletedId: id, error: null };
  }
}

export const store = new Store();


