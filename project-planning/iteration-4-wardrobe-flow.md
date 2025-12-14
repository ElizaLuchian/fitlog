## Iteration 4 – Wardrobe Flow (Clothing Items)

### 4.1 Wardrobe List Screen

- **Port `WardrobeFragment`**
  - Implement `WardrobeScreen` that:
    - Uses `useWardrobe()` to fetch clothing items.
    - Shows items in a grid using `ClothingGrid`.
    - Handles tap on an item to navigate to `ItemDetailsScreen`.
    - Includes an "Add Item" FAB/button similar to the existing one.
- **Incremental Updates**
  - Use store methods to support operations equivalent to:
    - `addOne`, `updateOne`, `removeOne` on the adapter.

### 4.2 Add Clothing Item Screen

- **Port `AddClothingItemActivity`**
  - Implement `AddClothingItemScreen` with:
    - A form replicating `activity_add_clothing_item.xml` fields and layout.
    - Input validation using the validation helpers.
    - Integration with image selection (placeholder until Iteration 7).
  - On submit:
    - Validate input.
    - Create a `ClothingItem` object.
    - Call `store.addItem()` (or equivalent context action).
    - Navigate back to Wardrobe, with list updating automatically.

### 4.3 Item Details & Edit Clothing Flows

- **Port `ItemDetailsActivity`**
  - Implement `ItemDetailsScreen` that:
    - Receives the selected item ID via navigation params.
    - Loads item from the store and displays details in a layout matching `activity_item_details.xml`.
    - Offers "Edit" and "Delete" buttons.
- **Port `EditClothingItemActivity`**
  - Implement `EditClothingItemScreen`:
    - Pre-fill form with the selected item’s data.
    - Allow edits and validation.
    - On submit, call `updateClothingItem` and return to details or list as per original behavior.

### 4.4 Delete Clothing Item Workflow

- **Cascading Deletion**
  - Replicate logic:
    - Use `getOutfitsContainingItem` to find dependent outfits.
    - Confirm deletion with a confirmation dialog.
    - If confirmed, call `deleteItem` which also handles removal of dependent outfits.
- **UI Updates**
  - Ensure:
    - Wardrobe list removes the item and shows a snackbar/toast with deletion message.
    - Outfits list reloads (similar to `OutfitsFragment` reloading on `onResume`).





