## FitLogNative → React Native Migration Plan

This document describes the multi-iteration migration plan to port **FitLogNative** from a native Android Java app to a **React Native** app while keeping:

- **UI layout** as close as possible to the existing app
- **User flows and behavior** identical
- **Core logic and data structures** equivalent (just translated to JS/TS + RN idioms)

---

## Iteration 1 – Foundation & Architecture Mapping

### 1.1 Tech Stack & Project Setup

- **Decide RN stack**
  - Use React Native (CLI or Expo) with TypeScript.
  - Use **React Navigation** for stacks and bottom tabs.
  - Use a simple and predictable **state management** approach (e.g., Context + Reducer or Zustand/Redux Toolkit) to mimic the existing MVVM pattern.
- **Initialize project**
  - Initialize a new React Native project in the repo.
  - Set up TypeScript, ESLint, and Prettier to keep code consistent.
- **Base folder structure**
  - Create folders such as:
    - `src/models` – data models for `ClothingItem`, `Outfit`, etc.
    - `src/store` – in-memory store and state management.
    - `src/screens` – screen components, each corresponding to Activities/Fragments.
    - `src/components` – smaller reusable UI components.
    - `src/navigation` – navigation configuration (stack + tabs).

### 1.2 Architecture Mapping from Android MVVM to RN

- **Store**
  - Map `Store.java` → a central JS/TS store module acting as a singleton-like object.
  - Expose methods equivalent to `Store.get().addItem`, `updateClothingItem`, `deleteItem`, `addOutfit`, `getOutfitsContainingItem`, etc.
- **ViewModels**
  - Map `WardrobeViewModel` and `OutfitsViewModel` → hooks/selectors that read from the store and drive UI in screens.
  - Replace LiveData + Observer with React state updates (store subscription or context).
- **Views**
  - Map Activities and Fragments:
    - Activities (`MainActivity`, `AddClothingItemActivity`, etc.) → stack screens.
    - Fragments (`HomeFragment`, `WardrobeFragment`, `OutfitsFragment`) → tab/stack screens or nested components.
  - Ensure each Java-based screen has a 1:1 React Native `Screen` component.

### 1.3 Navigation Structure Design

- **Bottom Tabs + Stacks**
  - Map `MainActivity` + `BottomNavigationView` + `nav_graph.xml` into React Navigation:
    - A bottom tab navigator for `Home`, `Wardrobe`, `Outfits`.
    - Stack navigators per tab for things like details and edit screens.
- **Routes & Params**
  - Define navigation routes that correspond to Java Activities/Fragments:
    - `HomeScreen`, `WardrobeScreen`, `OutfitsScreen`
    - `AddClothingItemScreen`, `EditClothingItemScreen`, `ItemDetailsScreen`
    - `AddOutfitScreen`, `EditOutfitScreen`, `OutfitDetailsScreen`
  - Map Intent extras (`putExtra`, `getSerializableExtra`) to typed navigation params.

---

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

---

## Iteration 3 – Base UI & Navigation Shell

### 3.1 Global Layout & Theme

- **Theming**
  - Define a theme file that approximates the existing Material Design styles:
    - Colors, typography, spacings, corner radii, and shadows.
  - Implement reusable components for:
    - Buttons, text inputs, cards, snackbars/toasts, etc.
- **Layout Consistency**
  - Ensure margins, paddings, and general layout density resemble the current Android app design.

### 3.2 Main Navigation Shell

- **Main Screen**
  - Implement `MainScreen` that:
    - Wraps the bottom tab navigator for `Home`, `Wardrobe`, `Outfits`.
    - Configures tab icons/labels similar to `bottom_nav_menu.xml`.
- **Stacks**
  - For each tab, configure a stack:
    - `HomeStack`: Home + any nested screens launched from Home if applicable.
    - `WardrobeStack`: Wardrobe list → Item details → Edit item → etc.
    - `OutfitsStack`: Outfits list → Outfit details → Edit outfit → etc.

### 3.3 Shared List Components

- **RecyclerView → FlatList**
  - Implement `ClothingGrid` using `FlatList` with `numColumns` to approximate grid behavior.
  - Implement `OutfitList` as a vertical `FlatList`.
  - Implement `SelectableClothingHorizontalList` for outfit creation, equivalent to `ClothingItemSelectAdapter` using a horizontal `FlatList`.
- **Reusable Item Components**
  - Create `ClothingCard` and `OutfitCard` components:
    - Match the design and information shown in `item_clothing.xml` and outfit list items.

---

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

---

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

---

## Iteration 6 – Home Screen & Cross-Screen Behavior

### 6.1 Home Screen

- **Port `HomeFragment`**
  - Implement `HomeScreen`:
    - Replicates any overview/summary UI present (recent items/outfits, stats, shortcuts).
    - Provides "Add Item" and "Log Outfit" quick actions.
    - Hooks up these actions to navigation into `AddClothingItemScreen` and `AddOutfitScreen`.

### 6.2 ActivityResultLauncher → Navigation Patterns

- **Replace Activity Results**
  - Convert `ActivityResultLauncher` flows into:
    - Navigation followed by state updates:
      - After add/edit operations, store updates trigger the appropriate list screen to re-render.
  - Ensure:
    - The overall workflows in the report (Add clothing, View/Edit clothing, Create outfit, Delete clothing item) remain exactly the same from the user’s perspective.

---

## Iteration 7 – Image Handling & Storage

### 7.1 Image Selection & Capture

- **Replace Android Intents**
  - Integrate a React Native image picker (or equivalent) to:
    - Choose images from gallery.
    - Optionally capture from camera, if used in the current app.
  - Wire image picking into:
    - `AddClothingItemScreen` and `EditClothingItemScreen`.
    - `AddOutfitScreen` and `EditOutfitScreen`.

### 7.2 File Storage & Loading

- **Mirror `getFilesDir()/images/`**
  - Use a React Native filesystem solution to:
    - Save images locally.
    - Store file paths/URIs as strings in `ClothingItem` and `Outfit` models, similar to Java implementation.
  - Implement lazy loading of images in:
    - Lists (`ClothingGrid`, `OutfitList`).
    - Details screens, only when visible.

---

## Iteration 8 – Polish, Parity Checks & Testing

### 8.1 Visual & Interaction Parity

- **Screen-by-Screen Comparison**
  - Compare each RN screen to its Android counterpart:
    - Layout, spacing, color, typography, icons.
    - Button placements and labels.
  - Tweak styling until the RN app feels like the original.

### 8.2 Error Handling & UX Details

- **Dialogs & Snackbars**
  - Implement:
    - Confirm deletion dialogs.
    - Snackbars/toasts for successful actions and errors (similar text and timing).
- **Validation UX**
  - Ensure:
    - Error messages in forms appear and behave similarly.
    - Required fields and input constraints remain the same.

### 8.3 Testing & Cleanup

- **Unit Tests**
  - Add tests for:
    - Store methods (add/update/delete items and outfits, cascade deletion).
    - Hooks that expose data (`useWardrobe`, `useOutfits`).
- **Integration/Flow Tests**
  - Test critical flows:
    - Add/edit/delete clothing item.
    - Add/edit outfit.
    - Delete clothing item that belongs to outfits.
- **Code Cleanup**
  - Remove any unused components or dead code.
  - Ensure TypeScript types are strict and accurate.
  - Run linting and formatting to keep the codebase clean.

---

## Suggested Execution Order

1. **Iteration 1** – Set up RN project, architecture mapping, and navigation structure.
2. **Iteration 2** – Implement store, state management, and models/validation utilities.
3. **Iteration 3** – Build base UI layout, theme, and navigation shell with shared lists.
4. **Iteration 4** – Port the entire Wardrobe flow.
5. **Iteration 5** – Port the entire Outfits flow.
6. **Iteration 6** – Port Home screen and cross-screen behaviors.
7. **Iteration 7** – Integrate image handling and storage.
8. **Iteration 8** – Polish, validate parity, test, and clean up.

This sequencing allows the new React Native app to become functional progressively while preserving the original app’s logic and user experience at each step.


