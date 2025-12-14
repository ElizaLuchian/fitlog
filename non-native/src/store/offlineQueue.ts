import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ClothingItem } from "@models/ClothingItem";
import { type Outfit } from "@models/Outfit";

const QUEUE_STORAGE_KEY = "@wardrobe/offline_queue";

export type OperationType = "CREATE" | "UPDATE" | "DELETE";
export type EntityType = "ITEM" | "OUTFIT";

export interface QueuedOperation {
  id: string; // Unique operation ID
  type: OperationType;
  entityType: EntityType;
  timestamp: number;
  data: {
    // For CREATE/UPDATE
    entity?: ClothingItem | Outfit;
    // For UPDATE/DELETE
    entityId?: number;
    // For UPDATE
    updateData?: Partial<ClothingItem | Outfit>;
  };
  retryCount: number;
  lastError?: string;
}

/**
 * Offline Operation Queue
 * Stores operations when server is offline and executes them when online.
 * Operations persist even if app is closed.
 */
class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private listeners: Array<() => void> = [];

  /**
   * Initialize queue by loading from storage
   */
  async initialize(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} queued operations`);
      }
    } catch (error) {
      console.error("[OfflineQueue] Failed to load queue:", error);
    }
  }

  /**
   * Add operation to queue
   */
  async enqueue(operation: Omit<QueuedOperation, "id" | "timestamp" | "retryCount">): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(queuedOp);
    await this.saveQueue();
    this.notifyListeners();
    
    console.log(`[OfflineQueue] Enqueued ${queuedOp.type} ${queuedOp.entityType} operation`);
  }

  /**
   * Remove operation from queue
   */
  async dequeue(operationId: string): Promise<void> {
    this.queue = this.queue.filter(op => op.id !== operationId);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get all queued operations
   */
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all queued operations
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log("[OfflineQueue] Queue cleared");
  }

  /**
   * Process queue with executor function
   * Returns number of successfully processed operations
   */
  async processQueue(
    executor: (operation: QueuedOperation) => Promise<boolean>
  ): Promise<number> {
    if (this.isProcessing) {
      console.log("[OfflineQueue] Already processing queue");
      return 0;
    }

    this.isProcessing = true;
    let successCount = 0;

    console.log(`[OfflineQueue] Processing ${this.queue.length} queued operations`);

    // Process operations in order (FIFO)
    const operationsToProcess = [...this.queue];
    
    for (const operation of operationsToProcess) {
      try {
        const success = await executor(operation);
        
        if (success) {
          // Remove from queue on success
          await this.dequeue(operation.id);
          successCount++;
          console.log(`[OfflineQueue] Successfully processed operation ${operation.id}`);
        } else {
          // Increment retry count
          operation.retryCount++;
          await this.saveQueue();
          console.warn(`[OfflineQueue] Failed to process operation ${operation.id}, retry count: ${operation.retryCount}`);
        }
      } catch (error) {
        // Update error info
        operation.lastError = error instanceof Error ? error.message : String(error);
        operation.retryCount++;
        await this.saveQueue();
        console.error(`[OfflineQueue] Error processing operation ${operation.id}:`, error);
      }
    }

    this.isProcessing = false;
    this.notifyListeners();
    
    console.log(`[OfflineQueue] Processed ${successCount}/${operationsToProcess.length} operations`);
    return successCount;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("[OfflineQueue] Failed to save queue:", error);
    }
  }
}

export const offlineQueue = new OfflineQueue();

