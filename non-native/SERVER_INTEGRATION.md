# Server Integration Implementation

## Overview
Complete server integration with offline support, WebSocket real-time updates, and automatic synchronization when connection is restored.

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────┐
│         React Components/Hooks           │
│         (useWardrobe, useOutfits)        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           Hybrid Store                   │
│   - Combines local + server              │
│   - Manages state & observers            │
│   - Handles sync logic                   │
└───────┬──────────────────────┬───────────┘
        │                      │
┌───────▼──────────┐   ┌──────▼────────────┐
│ Local Repository │   │ Server Repository │
│  - AsyncStorage  │   │  - REST API       │
│  - Offline cache │   │  - WebSocket      │
│  - Fast access   │   │  - Offline queue  │
└──────────────────┘   └───────────────────┘
```

### Components

1. **Local Repository** (`src/store/repository.ts`)
   - AsyncStorage for persistent local cache
   - Fast data access
   - Offline fallback

2. **Server Repository** (`src/store/serverRepository.ts`)
   - REST API for CRUD operations
   - WebSocket for real-time updates
   - Network state monitoring
   - Offline operation queue

3. **Offline Queue** (`src/store/offlineQueue.ts`)
   - Persists operations when offline
   - Auto-executes when online
   - Retry mechanism

4. **Hybrid Store** (`src/store/hybridStore.ts`)
   - Combines local + server
   - Observer pattern
   - Smart sync logic

## Requirements Compliance

### ✅ READ Operation
**Requirement:** "All values retrieved only once and reused. WebSocket listens for server changes."

**Implementation:**
- `hybridStore.ts` lines 39-91: Data loaded once on app start
- Local data loaded first for immediate UI (line 59-62)
- Server sync happens in background (line 87)
- `serverRepository.ts` lines 607-704: WebSocket connection for real-time updates
- `hybridStore.ts` lines 154-211: WebSocket message handler updates state in real-time

### ✅ CREATE Operation
**Requirement:** "Only created element sent to server. ID managed by server. User not aware of internal ID."

**Implementation:**
- `serverRepository.ts` lines 182-232: Only element data sent (no ID)
- Server returns created object with server-managed ID (line 222)
- `hybridStore.ts` lines 305-332: Uses server ID when available
- User provides data without ID in hooks

### ✅ UPDATE Operation
**Requirement:** "Server element reused. Not deleted then added. ID remains same."

**Implementation:**
- `serverRepository.ts` lines 239-288: PUT request with full object
- Element updated in-place on server
- `hybridStore.ts` lines 341-379: ID explicitly preserved (line 351)
- Comment states "Reuse element with same ID"

### ✅ DELETE Operation
**Requirement:** "Only ID sent to server. Element properly identified."

**Implementation:**
- `serverRepository.ts` lines 295-339: DELETE request with only ID in URL
- `hybridStore.ts` lines 388-419: Only ID parameter used (line 388)
- Element identified by ID before deletion (line 393-398)

### ✅ Separate Thread/Coroutine
**Requirement:** "All server operations handled in separate thread."

**Implementation:**
- All operations are `async` functions
- JavaScript async/await runs operations asynchronously
- Network calls (fetch, WebSocket) are inherently async
- AsyncStorage operations are async
- `serverRepository.ts` line 808: Explicit async timeout handling

### ✅ Offline Persistence
**Requirement:** "Operations persist even if server offline. Execute when server comes online."

**Implementation:**
- `offlineQueue.ts`: Complete offline queue system
  - Lines 46-59: `enqueue()` - persist operations
  - Lines 92-155: `processQueue()` - execute when online
  - Lines 174-184: Persistent storage via AsyncStorage
- `serverRepository.ts`:
  - Lines 180-232 (CREATE): Queue operation if offline (line 187)
  - Lines 239-288 (UPDATE): Queue operation if offline (line 242)
  - Lines 295-339 (DELETE): Queue operation if offline (line 298)
  - Lines 745-781: Process queue when network restored
  - Lines 58-84: Network monitoring triggers queue processing (line 75)

### ✅ Error Handling
**Requirement:** "Persistence/network errors logged and presented to user."

**Implementation:**
- All operations return error objects
- `serverRepository.ts` line 8: `ServerError` interface with `isNetworkError` flag
- Errors logged via `console.error()` throughout
- `hooks.ts` lines 16-27: User-friendly error presentation
- Network errors trigger offline mode automatically

## Usage

### Configuration

Edit `src/config/api.ts` to set your server URLs:

```typescript
export const API_CONFIG = {
  BASE_URL: "http://your-server.com/api",
  WS_URL: "ws://your-server.com",
  // ... other config
};
```

### Component Usage

```typescript
const { items, isLoading, isSyncing, isOnline, queuedOperations } = useWardrobe();

// Create item (works offline)
const result = await addItem(newItem);

// Update item (works offline)
await updateClothingItem(itemId, ...);

// Delete item (works offline)
await deleteItem(itemId);

// Check sync status
console.log(`${queuedOperations} operations queued`);
console.log(`Online: ${isOnline}`);
```

### Offline Behavior

1. **User goes offline:**
   - Operations saved to offline queue
   - Local cache updated immediately
   - User sees changes instantly
   - Notification: "Offline mode - will sync later"

2. **User comes back online:**
   - Queue automatically processed
   - Server receives all queued operations
   - WebSocket reconnects
   - Real-time updates resume

3. **Sync indicators:**
   - `isOnline`: Network connection status
   - `isSyncing`: Currently syncing with server
   - `queuedOperations`: Number of pending operations

## Server API Requirements

### REST Endpoints

```
GET    /api/items          - Get all items
POST   /api/items          - Create item (returns item with ID)
PUT    /api/items/:id      - Update item
DELETE /api/items/:id      - Delete item

GET    /api/outfits        - Get all outfits
POST   /api/outfits        - Create outfit (returns outfit with ID)
PUT    /api/outfits/:id    - Update outfit
DELETE /api/outfits/:id    - Delete outfit
```

### WebSocket Events

Server should emit these events when data changes:

```javascript
{
  type: "ITEM_CREATED",
  item: { id: 1, name: "...", ... }
}

{
  type: "ITEM_UPDATED",
  item: { id: 1, name: "...", ... }
}

{
  type: "ITEM_DELETED",
  itemId: 1
}

// Similar for outfits: OUTFIT_CREATED, OUTFIT_UPDATED, OUTFIT_DELETED
```

## Testing

### Test Offline Mode

1. **Enable offline mode:**
   - Android: `adb shell svc wifi disable`
   - iOS Simulator: Turn off WiFi
   - Or: Airplane mode on device

2. **Perform operations:**
   - Add items/outfits
   - Edit items/outfits
   - Delete items/outfits

3. **Verify:**
   - Changes appear immediately in UI
   - "Offline" message shown
   - `queuedOperations` increases

4. **Go back online:**
   - Android: `adb shell svc wifi enable`
   - iOS: Turn on WiFi
   - Or: Disable airplane mode

5. **Verify sync:**
   - Queue processes automatically
   - Server receives operations
   - `queuedOperations` decreases to 0

### Test Real-time Updates

1. Have two devices/simulators connected
2. Make change on device A
3. Verify device B receives update via WebSocket
4. Change appears instantly on device B

### Test Server Failure

1. Stop server
2. Perform operations (they queue)
3. Start server
4. Operations sync automatically

## Migration from Local-Only

If you have existing local data:

1. Data remains in local storage
2. First server sync merges local + server data
3. Server becomes source of truth
4. Pending operations (negative IDs) stay local until synced

## Performance

- **Local-first:** Immediate UI updates
- **Background sync:** No blocking operations
- **WebSocket:** Real-time updates without polling
- **Queue batching:** Multiple operations sent efficiently
- **Network resilience:** Auto-reconnect with exponential backoff

## Troubleshooting

### WebSocket Won't Connect

Check:
- Server URL in `api.ts`
- CORS settings on server
- WebSocket server running
- Network firewall rules

### Operations Not Syncing

Check:
- `isOnline` status
- `queuedOperations` count
- Server logs for errors
- Console logs in app

### IDs Mismatch

- Positive IDs = from server
- Negative IDs = pending local operations
- After sync, negative IDs replaced with server IDs

## Production Checklist

- [ ] Update server URLs in `api.ts`
- [ ] Configure proper timeout values
- [ ] Set up server-side WebSocket
- [ ] Implement server REST API
- [ ] Add authentication tokens
- [ ] Enable HTTPS/WSS
- [ ] Test offline scenarios
- [ ] Test sync conflicts
- [ ] Monitor queue size
- [ ] Add retry limits
- [ ] Implement data migration
- [ ] Set up error monitoring (Sentry, etc.)

## Security Considerations

**TODO for Production:**
1. Add authentication (JWT tokens)
2. Encrypt sensitive data
3. Validate server responses
4. Implement rate limiting
5. Add CSRF protection
6. Use HTTPS/WSS only
7. Sanitize user input
8. Add request signing

## Future Enhancements

- Conflict resolution for simultaneous edits
- Partial sync (only changed data)
- Compression for large payloads
- Image sync optimization
- Background sync (when app in background)
- Push notifications for updates
- Offline indicator in UI
- Manual sync button
- Clear cache option

