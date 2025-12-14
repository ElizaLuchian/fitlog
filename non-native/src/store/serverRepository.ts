import { type ClothingItem } from "@models/ClothingItem";
import { type Outfit } from "@models/Outfit";
import { API_CONFIG, getBaseUrl, getWebSocketUrl } from "@config/api";
import { offlineQueue, type QueuedOperation } from "./offlineQueue";
import NetInfo from "@react-native-community/netinfo";

export interface ServerError {
  operation: "read" | "create" | "update" | "delete" | "sync";
  message: string;
  details?: string;
  isNetworkError: boolean;
}

type WebSocketListener = (data: any) => void;

/**
 * Server Repository
 * Handles all server communication with REST API and WebSocket.
 * All operations run in separate threads (async).
 * Operations persist when offline and execute when server comes back online.
 * 
 * Requirements:
 * - READ: Values retrieved once, websocket listens for server changes
 * - CREATE: Only created element sent to server, ID managed by server
 * - UPDATE: Server element reused, ID remains same
 * - DELETE: Only ID sent to server, element properly identified
 * - Offline support: Operations queued and executed when online
 */
class ServerRepository {
  private wsConnection: WebSocket | null = null;
  private wsListeners: WebSocketListener[] = [];
  private wsReconnectAttempts = 0;
  private wsReconnectTimeout: NodeJS.Timeout | null = null;
  private isOnline = true;
  private isInitialized = false;

  /**
   * Initialize repository
   * Sets up network monitoring and websocket connection
   */
  async initialize(): Promise<ServerError | null> {
    if (this.isInitialized) {
      return null;
    }

    try {
      // Initialize offline queue
      await offlineQueue.initialize();

      // Monitor network connectivity
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected === true;
        
        console.log(`[ServerRepository] Network ${this.isOnline ? "connected" : "disconnected"}`);
        
        // When coming back online, process queued operations
        if (!wasOnline && this.isOnline) {
          console.log("[ServerRepository] Back online, processing queued operations");
          this.processOfflineQueue();
        }
        
        // Manage WebSocket connection based on network state
        if (this.isOnline) {
          this.connectWebSocket();
        } else {
          this.disconnectWebSocket();
        }
      });

      // Check initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected === true;

      // Connect WebSocket if online
      if (this.isOnline) {
        this.connectWebSocket();
      }

      this.isInitialized = true;
      console.log("[ServerRepository] Initialized");
      return null;
    } catch (error) {
      const err: ServerError = {
        operation: "read",
        message: "Failed to initialize server repository",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: false
      };
      console.error("[ServerRepository] Initialization error:", err);
      return err;
    }
  }

  /**
   * READ - Get all clothing items from server
   * All values retrieved once (on app start or manual refresh)
   */
  async getAllItems(): Promise<{ items: ClothingItem[]; error: ServerError | null }> {
    if (!this.isOnline) {
      // Return empty when offline - local data will be used
      return { items: [], error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.ITEMS}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const items: ClothingItem[] = await response.json();
      console.log(`[ServerRepository] Retrieved ${items.length} items from server`);
      return { items, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "read",
        message: "Failed to retrieve items from server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Read items error:", err);
      return { items: [], error: err };
    }
  }

  /**
   * READ - Get all outfits from server
   */
  async getAllOutfits(): Promise<{ outfits: Outfit[]; error: ServerError | null }> {
    if (!this.isOnline) {
      return { outfits: [], error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.OUTFITS}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const outfits: Outfit[] = await response.json();
      console.log(`[ServerRepository] Retrieved ${outfits.length} outfits from server`);
      return { outfits, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "read",
        message: "Failed to retrieve outfits from server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Read outfits error:", err);
      return { outfits: [], error: err };
    }
  }

  /**
   * CREATE - Save new clothing item to server
   * Only the created element is sent. ID is managed by server.
   * If offline, operation is queued.
   */
  async saveItem(item: Omit<ClothingItem, "id">): Promise<{ item: ClothingItem | null; error: ServerError | null }> {
    if (!this.isOnline) {
      // Queue operation for later
      await offlineQueue.enqueue({
        type: "CREATE",
        entityType: "ITEM",
        data: { entity: item as ClothingItem }
      });
      
      // Return temporary item with negative ID (will be replaced when synced)
      const tempItem: ClothingItem = {
        ...item,
        id: -Date.now() // Temporary negative ID
      };
      console.log("[ServerRepository] Queued item creation (offline)");
      return { item: tempItem, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.ITEMS}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const createdItem: ClothingItem = await response.json();
      console.log(`[ServerRepository] Item created with server ID: ${createdItem.id}`);
      return { item: createdItem, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "create",
        message: "Failed to save item to server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Create item error:", err);
      
      // Queue for retry if network error
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "CREATE",
          entityType: "ITEM",
          data: { entity: item as ClothingItem }
        });
      }
      
      return { item: null, error: err };
    }
  }

  /**
   * UPDATE - Update existing item on server
   * Server element is reused, ID remains the same.
   * If offline, operation is queued.
   */
  async updateItem(item: ClothingItem): Promise<{ success: boolean; error: ServerError | null }> {
    if (!this.isOnline) {
      // Queue operation
      await offlineQueue.enqueue({
        type: "UPDATE",
        entityType: "ITEM",
        data: { entityId: item.id, updateData: item }
      });
      console.log("[ServerRepository] Queued item update (offline)");
      return { success: true, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.ITEM_BY_ID(item.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ServerRepository] Item updated with ID: ${item.id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "update",
        message: "Failed to update item on server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Update item error:", err);
      
      // Queue for retry if network error
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "UPDATE",
          entityType: "ITEM",
          data: { entityId: item.id, updateData: item }
        });
      }
      
      return { success: false, error: err };
    }
  }

  /**
   * DELETE - Delete item from server
   * Only the ID is sent. Element is properly identified.
   * If offline, operation is queued.
   */
  async deleteItem(id: number): Promise<{ success: boolean; error: ServerError | null }> {
    if (!this.isOnline) {
      // Queue operation
      await offlineQueue.enqueue({
        type: "DELETE",
        entityType: "ITEM",
        data: { entityId: id }
      });
      console.log("[ServerRepository] Queued item deletion (offline)");
      return { success: true, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.ITEM_BY_ID(id)}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ServerRepository] Item deleted with ID: ${id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "delete",
        message: "Failed to delete item from server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Delete item error:", err);
      
      // Queue for retry if network error
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "DELETE",
          entityType: "ITEM",
          data: { entityId: id }
        });
      }
      
      return { success: false, error: err };
    }
  }

  /**
   * CREATE - Save new outfit to server
   */
  async saveOutfit(outfit: Omit<Outfit, "outfitId">): Promise<{ outfit: Outfit | null; error: ServerError | null }> {
    if (!this.isOnline) {
      await offlineQueue.enqueue({
        type: "CREATE",
        entityType: "OUTFIT",
        data: { entity: outfit as Outfit }
      });
      
      const tempOutfit: Outfit = {
        ...outfit,
        outfitId: -Date.now()
      };
      console.log("[ServerRepository] Queued outfit creation (offline)");
      return { outfit: tempOutfit, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.OUTFITS}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(outfit)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const createdOutfit: Outfit = await response.json();
      console.log(`[ServerRepository] Outfit created with server ID: ${createdOutfit.outfitId}`);
      return { outfit: createdOutfit, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "create",
        message: "Failed to save outfit to server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Create outfit error:", err);
      
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "CREATE",
          entityType: "OUTFIT",
          data: { entity: outfit as Outfit }
        });
      }
      
      return { outfit: null, error: err };
    }
  }

  /**
   * UPDATE - Update existing outfit on server
   */
  async updateOutfit(outfit: Outfit): Promise<{ success: boolean; error: ServerError | null }> {
    if (!this.isOnline) {
      await offlineQueue.enqueue({
        type: "UPDATE",
        entityType: "OUTFIT",
        data: { entityId: outfit.outfitId, updateData: outfit }
      });
      console.log("[ServerRepository] Queued outfit update (offline)");
      return { success: true, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.OUTFIT_BY_ID(outfit.outfitId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(outfit)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ServerRepository] Outfit updated with ID: ${outfit.outfitId}`);
      return { success: true, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "update",
        message: "Failed to update outfit on server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Update outfit error:", err);
      
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "UPDATE",
          entityType: "OUTFIT",
          data: { entityId: outfit.outfitId, updateData: outfit }
        });
      }
      
      return { success: false, error: err };
    }
  }

  /**
   * DELETE - Delete outfit from server
   */
  async deleteOutfit(id: number): Promise<{ success: boolean; error: ServerError | null }> {
    if (!this.isOnline) {
      await offlineQueue.enqueue({
        type: "DELETE",
        entityType: "OUTFIT",
        data: { entityId: id }
      });
      console.log("[ServerRepository] Queued outfit deletion (offline)");
      return { success: true, error: null };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${getBaseUrl()}${API_CONFIG.ENDPOINTS.OUTFIT_BY_ID(id)}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[ServerRepository] Outfit deleted with ID: ${id}`);
      return { success: true, error: null };
    } catch (error) {
      const err: ServerError = {
        operation: "delete",
        message: "Failed to delete outfit from server",
        details: error instanceof Error ? error.message : String(error),
        isNetworkError: this.isNetworkError(error)
      };
      console.error("[ServerRepository] Delete outfit error:", err);
      
      if (err.isNetworkError) {
        await offlineQueue.enqueue({
          type: "DELETE",
          entityType: "OUTFIT",
          data: { entityId: id }
        });
      }
      
      return { success: false, error: err };
    }
  }

  /**
   * WebSocket - Connect to server for real-time updates
   * Used to listen for server changes
   */
  private connectWebSocket(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      console.log("[ServerRepository] WebSocket already connected");
      return;
    }

    try {
      console.log("[ServerRepository] Connecting WebSocket...");
      this.wsConnection = new WebSocket(getWebSocketUrl());

      this.wsConnection.onopen = () => {
        console.log("[ServerRepository] WebSocket connected");
        this.wsReconnectAttempts = 0;
        
        // Clear any pending reconnect timeout
        if (this.wsReconnectTimeout) {
          clearTimeout(this.wsReconnectTimeout);
          this.wsReconnectTimeout = null;
        }
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[ServerRepository] WebSocket message received:", data.type);
          
          // Notify all listeners
          for (const listener of this.wsListeners) {
            listener(data);
          }
        } catch (error) {
          console.error("[ServerRepository] Failed to parse WebSocket message:", error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error("[ServerRepository] WebSocket error:", error);
      };

      this.wsConnection.onclose = () => {
        console.log("[ServerRepository] WebSocket disconnected");
        this.wsConnection = null;
        
        // Attempt to reconnect if online
        if (this.isOnline && this.wsReconnectAttempts < API_CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
          this.wsReconnectAttempts++;
          const delay = API_CONFIG.WS_RECONNECT_DELAY * this.wsReconnectAttempts;
          
          console.log(`[ServerRepository] Reconnecting WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
          
          this.wsReconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, delay);
        }
      };
    } catch (error) {
      console.error("[ServerRepository] Failed to create WebSocket connection:", error);
    }
  }

  /**
   * WebSocket - Disconnect
   */
  private disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = null;
    }
  }

  /**
   * Subscribe to WebSocket updates
   */
  subscribeToUpdates(listener: WebSocketListener): () => void {
    this.wsListeners.push(listener);
    return () => {
      this.wsListeners = this.wsListeners.filter(l => l !== listener);
    };
  }

  /**
   * Process offline queue
   * Executes queued operations when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    await offlineQueue.processQueue(async (operation: QueuedOperation) => {
      try {
        if (operation.entityType === "ITEM") {
          return await this.processItemOperation(operation);
        } else {
          return await this.processOutfitOperation(operation);
        }
      } catch (error) {
        console.error("[ServerRepository] Failed to process queued operation:", error);
        return false;
      }
    });
  }

  /**
   * Process queued item operation
   */
  private async processItemOperation(operation: QueuedOperation): Promise<boolean> {
    const { type, data } = operation;
    
    switch (type) {
      case "CREATE": {
        if (!data.entity) return false;
        const result = await this.saveItem(data.entity as Omit<ClothingItem, "id">);
        return result.item !== null;
      }
      case "UPDATE": {
        if (!data.updateData) return false;
        const result = await this.updateItem(data.updateData as ClothingItem);
        return result.success;
      }
      case "DELETE": {
        if (!data.entityId) return false;
        const result = await this.deleteItem(data.entityId);
        return result.success;
      }
      default:
        return false;
    }
  }

  /**
   * Process queued outfit operation
   */
  private async processOutfitOperation(operation: QueuedOperation): Promise<boolean> {
    const { type, data } = operation;
    
    switch (type) {
      case "CREATE": {
        if (!data.entity) return false;
        const result = await this.saveOutfit(data.entity as Omit<Outfit, "outfitId">);
        return result.outfit !== null;
      }
      case "UPDATE": {
        if (!data.updateData) return false;
        const result = await this.updateOutfit(data.updateData as Outfit);
        return result.success;
      }
      case "DELETE": {
        if (!data.entityId) return false;
        const result = await this.deleteOutfit(data.entityId);
        return result.success;
      }
      default:
        return false;
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError ||
      error?.message?.includes("network") ||
      error?.message?.includes("fetch") ||
      error?.message?.includes("timeout") ||
      error?.message?.includes("abort")
    );
  }

  /**
   * Get network status
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Get number of queued operations
   */
  getQueuedOperationsCount(): number {
    return offlineQueue.getQueueSize();
  }
}

export const serverRepository = new ServerRepository();

