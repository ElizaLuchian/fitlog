# Local Database Persistence Implementation

## Overview
This implementation provides local database persistence for the FitLog React Native app using AsyncStorage, which is compatible with Expo Go and persists data across app runs.

## Architecture

### Repository Layer (`src/store/repository.ts`)
- **Separate repository layer** for all data persistence operations
- **AsyncStorage** used for local storage (Expo Go compatible)
- All operations run in **separate threads** via AsyncStorage's async implementation
- Comprehensive **error handling** with logging and user presentation

### Store Layer (`src/store/store.ts`)
- **Observer/LiveData pattern** for state management
- **Subscribes to repository** changes
- Data is **retrieved once** on app start and **reused** in memory
- All CRUD operations delegate to repository
- Errors are **captured, logged, and presented to users**

### Hooks Layer (`src/store/hooks.ts`)
- React hooks that implement the **observer pattern**
- **Async operations** with proper error handling
- User-friendly error alerts via `Alert.alert()`
- Loading states and error states exposed to components

## CRUD Operations

### READ Operation
```typescript
// Values are retrieved once and reused while the application is alive
await repository.getAllItems()
await repository.getAllOutfits()
```
- Retrieves all values in a **separate thread** (via AsyncStorage)
- Data is **loaded once** and stored in memory
- **Observer pattern** ensures UI updates when data changes
- Errors are **handled, logged, and presented to user**

### CREATE Operation
```typescript
// Only the created element is added in the DB
// ID is managed by the DB/app (user not aware of internal ID)
await store.addItem(item)
await store.addOutfit(outfit)
```
- **Only the created element** is added to storage
- **ID is managed** by repository (auto-incrementing)
- User is **not aware** of internal ID
- Persistence errors are **handled, presented to user, and logged**

### UPDATE Operation
```typescript
// The DB element is reused (not deleted and re-added)
// ID remains the same
await store.updateClothingItem(id, name, category, ...)
await store.updateOutfit(id, occasion, aestheticStyle, notes)
```
- **DB element is reused** (not deleted and re-added)
- **ID remains the same** throughout the update
- Element is properly maintained in storage
- Persistence errors are **handled, presented to user, and logged**

### DELETE Operation
```typescript
// Only the ID of the removed element is used to delete
// Element is properly identified
await store.deleteItem(id)
await store.deleteOutfit(id)
```
- **Only the ID** is used to identify and delete the element
- Element is **properly identified** before deletion
- Cascading deletes handled (deleting item deletes related outfits)
- Persistence errors are **logged and presented to user**

## Error Handling

All operations implement comprehensive error handling:

```typescript
interface RepositoryError {
  operation: "read" | "create" | "update" | "delete";
  message: string;
  details?: string;
}
```

Errors are:
1. **Logged** to console with `console.error()`
2. **Captured** in the store state
3. **Presented** to the user via Alert dialogs
4. **Returned** to calling code for additional handling

## Data Persistence

### Storage Keys
- `@wardrobe/items` - All clothing items
- `@wardrobe/outfits` - All outfits
- `@wardrobe/next_item_id` - Auto-increment ID for items
- `@wardrobe/next_outfit_id` - Auto-increment ID for outfits

### Data Format
Data is stored as JSON strings in AsyncStorage:
```typescript
{
  items: ClothingItem[],
  outfits: Outfit[]
}
```

## Usage in Components

### Reading Data
```typescript
const { items, isLoading, error } = useWardrobe();
const { outfits, isLoading, error } = useOutfits();

// Data is automatically loaded and kept in sync
```

### Creating Data
```typescript
const { addItem } = useWardrobe();

const result = await addItem({
  name: "Blue Jeans",
  category: "BOTTOM",
  color: "Blue",
  // ... other fields
});

if (result.error) {
  // Error was already shown to user
  // Handle any additional logic here
}
```

### Updating Data
```typescript
const { updateClothingItem } = useWardrobe();

const result = await updateClothingItem(
  itemId,
  "Updated Name",
  "BOTTOM",
  "Blue",
  "Levi's",
  "M",
  "Denim",
  "Updated notes"
);
```

### Deleting Data
```typescript
const { deleteItem } = useWardrobe();

const result = await deleteItem(itemId);
```

## Testing Persistence

To test that data persists across app restarts:

1. **Add some items** using the app
2. **Close the app completely** (force quit)
3. **Reopen the app**
4. **Verify** that all items are still there

The data should persist because it's stored in AsyncStorage, which is permanent storage on the device.

## Requirements Compliance

✅ **Read operation** is implemented in a list - All values retrieved once and reused

✅ **Separate repository** is used - `repository.ts` layer

✅ **Separate thread/coroutine** - AsyncStorage operations are async

✅ **Observer/LiveData mechanism** - Subscribe pattern in store and hooks

✅ **Retrieve errors handled** - Logged, presented to user

✅ **Create operation** - Only created element added, ID managed by DB/app

✅ **Persistence errors handled** - Logged, presented to user

✅ **Update operation** - DB element reused, ID remains same

✅ **Delete operation** - Only ID used to delete, properly identified

✅ **Local database** - AsyncStorage for Expo Go apps

✅ **Persistence across runs** - Data saved permanently to device storage

## Future Enhancements

- Migration system for schema changes
- Batch operations for better performance
- Offline sync with remote server
- Data export/import functionality
- Data encryption for sensitive information

