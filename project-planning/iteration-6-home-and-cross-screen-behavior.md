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





