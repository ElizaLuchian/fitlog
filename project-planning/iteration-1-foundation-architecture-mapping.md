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





