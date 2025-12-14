## Iteration 2 – Data Layer & State Management

### 2.1 Implement In-Memory Store

- **Replicate `Store.java`**
  - Implement a `store` module that maintains:
    - `clothingItems` collection
    - `outfits` collection
  - Implement functions equivalent to:
    - `addItem`, `updateClothingItem`, `deleteItem`
    - `addOutfit`, `updateOutfit`, `deleteOutfit`
    - `getOutfitsContainingItem` and other helper methods used in workflows.
- **Singleton-like behavior**
  - Export a single store instance to ensure a single source of truth, similar to the `Store.get()` singleton pattern.

### 2.2 Expose Reactive Data (ViewModel Replacement)

- **State Container**
  - Wrap the store with a global state container:
    - Use React Context + useReducer OR Zustand/Redux for:
      - `wardrobeState` (list of clothing items, loading flags, etc.).
      - `outfitsState` (list of outfits, loading flags, etc.).
  - Provide methods in context/actions that map to Store operations.
- **Hooks & Subscriptions**
  - Implement hooks like:
    - `useWardrobe()` – returns clothing list and actions.
    - `useOutfits()` – returns outfits list and actions.
  - These hooks act as LiveData observers: when the underlying data changes, components re-render automatically.

### 2.3 Models & Validation Utilities

- **Model Definitions**
  - Create TypeScript interfaces or types matching `ClothingItem.java` and `Outfit.java`:
    - Same properties: name, category, color, brand, size, material, photos, etc. for clothing.
    - For outfits: item IDs, occasion, aesthetic style, notes, date, photo, etc.
- **Validation Helpers**
  - Port validation logic from Java Activities into shared JS/TS functions.
  - Ensure form screens call these helpers to match the original validation behavior and error messages.





