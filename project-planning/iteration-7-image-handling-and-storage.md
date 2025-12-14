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





