## Iteration 5 – Outfits Flow

### 5.1 Outfits List Screen

- **Port `OutfitsFragment`**
  - Implement `OutfitsScreen`:
    - Uses `useOutfits()` to retrieve outfits.
    - Displays them using `OutfitList`.
    - On outfit tap, navigate to `OutfitDetailsScreen`.
    - Include action to create a new outfit (button/FAB) analogous to current UI.

### 5.2 Add Outfit Workflow

- **Port `AddOutfitActivity`**
  - Implement `AddOutfitScreen`:
    - Loads all clothing items from store.
    - Uses `SelectableClothingHorizontalList` for multi-select.
    - Captures occasion, aesthetic style, date, notes, and photo.
    - Validates required fields and relationships.
  - On submit:
    - Build an `Outfit` object with selected clothing IDs.
    - Call `addOutfit` in the store/context.
    - Navigate back to `OutfitsScreen`, which updates automatically.

### 5.3 Outfit Details & Edit Outfit Flows

- **Port `OutfitDetailsActivity`**
  - Implement `OutfitDetailsScreen`:
    - Receives an outfit ID via navigation params.
    - Loads outfit and associated clothing items from store.
    - Shows details layout similar to `activity_outfit_details.xml` (if exists).
- **Port `EditOutfitActivity`**
  - Implement `EditOutfitScreen`:
    - Pre-fill all fields and selected clothing.
    - Allow edits and validation, including clothing selection changes.
    - On save, call `updateOutfit` and navigate appropriately while updating list and details.





