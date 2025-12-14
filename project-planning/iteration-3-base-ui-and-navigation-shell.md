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





