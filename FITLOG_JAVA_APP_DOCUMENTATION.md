# FitLog Native - Java Android Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Project Structure](#architecture--project-structure)
3. [Data Layer](#data-layer)
4. [Model Layer](#model-layer)
5. [UI Layer](#ui-layer)
6. [Navigation System](#navigation-system)
7. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
8. [Data Flow & Communication](#data-flow--communication)
9. [Key Android Concepts Used](#key-android-concepts-used)
10. [How Everything Binds Together](#how-everything-binds-together)

---

## Overview

**FitLog Native** is a wardrobe and outfit management Android application built with Java. It allows users to:

- **Manage their wardrobe**: Add, view, edit, and delete clothing items with details like name, category, color, brand, size, material, and photos.
- **Log outfits**: Create outfit combinations from wardrobe items, associate them with occasions and aesthetic styles, and track when they were worn.
- **Search and filter**: Find clothing items and outfits using search functionality.

The app follows a clean architecture with separation of concerns between the data layer, model layer, and UI layer.

---

## Architecture & Project Structure

```
com.example.fitlognative/
├── data/
│   └── Store.java                    # Singleton data store (in-memory database)
├── model/
│   ├── ClothingItem.java             # Clothing item data model
│   └── Outfit.java                   # Outfit data model
└── ui/
    ├── MainActivity.java             # Main activity with navigation
    ├── home/
    │   └── HomeFragment.java         # Home screen
    ├── wardrobe/
    │   ├── WardrobeFragment.java     # Wardrobe list screen
    │   ├── WardrobeViewModel.java    # ViewModel for wardrobe
    │   ├── ClothingAdapter.java      # RecyclerView adapter for wardrobe grid
    │   ├── ClothingItemAdapter.java  # Alternative adapter (legacy)
    │   ├── AddClothingItemActivity.java    # Add new clothing item
    │   ├── ItemDetailsActivity.java        # View clothing item details
    │   └── EditClothingItemActivity.java   # Edit clothing item
    └── outfits/
        ├── OutfitsFragment.java      # Outfits list screen
        ├── OutfitsViewModel.java     # ViewModel for outfits
        ├── OutfitAdapter.java        # RecyclerView adapter for outfits list
        ├── ClothingItemSelectAdapter.java  # Adapter for selecting items in outfit
        ├── AddOutfitActivity.java    # Add new outfit
        ├── OutfitDetailsActivity.java      # View outfit details
        └── EditOutfitActivity.java   # Edit outfit
```

---

## Data Layer

### Store.java - The Singleton Data Store

The `Store` class is the heart of data management in FitLog. It implements the **Singleton Pattern** to ensure a single source of truth for all data throughout the application.

#### Key Concepts:

**1. Singleton Pattern**
```java
private static Store instance;

public static Store get() {
    if (instance == null) instance = new Store();
    return instance;
}
```
- The singleton ensures that all Activities and Fragments access the same data instance.
- `Store.get()` is called anywhere in the app to retrieve the shared instance.

**2. In-Memory Storage**
```java
private final List<ClothingItem> clothingItems = new ArrayList<>();
private final List<Outfit> outfits = new ArrayList<>();
private int nextId = 1;
private int nextOutfitId = 1;
```
- Data is stored in `ArrayList` collections in memory.
- Auto-incrementing IDs ensure each item has a unique identifier.
- Note: Data is lost when the app is closed (no persistence to database).

**3. CRUD Operations for Clothing Items**

| Operation | Method | Description |
|-----------|--------|-------------|
| **CREATE** | `addItem(ClothingItem item)` | Assigns ID, adds to beginning of list, returns created item |
| **READ** | `getClothingItems()` | Returns the full list of clothing items |
| **UPDATE** | `updateClothingItem(id, name, category, ...)` | Finds item by ID and updates all fields (except photo) |
| **DELETE** | `deleteItem(int id)` | Removes item and **cascade deletes** any outfits containing it |

**4. CRUD Operations for Outfits**

| Operation | Method | Description |
|-----------|--------|-------------|
| **CREATE** | `addOutfit(Outfit outfit)` | Assigns ID, adds to beginning of list, returns created outfit |
| **READ** | `getOutfits()` | Returns the full list of outfits |
| **UPDATE** | `updateOutfit(id, occasion, aestheticStyle, notes)` | Updates editable fields only |
| **DELETE** | `deleteOutfit(int id)` | Removes outfit from list |

**5. Cascade Delete Logic**
```java
public int deleteItem(int id) {
    // First, find and delete all outfits that contain this item
    List<Integer> outfitsToDelete = new ArrayList<>();
    for (Outfit outfit : outfits) {
        if (outfit.getItems() != null && outfit.getItems().contains(id)) {
            outfitsToDelete.add(outfit.getOutfitId());
        }
    }
    // Delete the outfits
    for (Integer outfitId : outfitsToDelete) {
        deleteOutfit(outfitId);
    }
    // Then delete the item...
}
```
When a clothing item is deleted, any outfit that references that item is automatically deleted. This maintains referential integrity.

**6. Helper Method**
```java
public int getOutfitsContainingItem(int itemId)
```
Returns the count of outfits that contain a specific clothing item. Used to display warnings before deletion.

---

## Model Layer

### ClothingItem.java

Represents a single clothing item in the wardrobe.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique identifier (auto-assigned by Store) |
| `name` | String | Name of the item (e.g., "Blue Denim Jacket") |
| `category` | String | Category: Tops, Bottoms, Outerwear, Footwear, Accessories |
| `color` | String | Color of the item |
| `brand` | String | Brand name |
| `size` | String | Size: XS, S, M, L, XL, XXL |
| `material` | String | Material composition |
| `photo` | String | File path to the stored image |
| `notes` | String | Optional additional notes |

**Key Implementation Details:**
- Implements `Serializable` to allow passing between Activities via `Intent.putExtra()`.
- Two constructors: one with photo, one without (defaults photo to empty string).
- Standard getters and setters for all fields.

### Outfit.java

Represents a logged outfit composed of multiple clothing items.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `outfitId` | int | Unique identifier |
| `userId` | int | User ID (prepared for multi-user, currently always 1) |
| `items` | List\<Integer\> | List of clothing item IDs that make up this outfit |
| `occasion` | String | When/where the outfit was worn |
| `aestheticStyleType` | String | Style category (Streetwear, Minimalist, etc.) |
| `photo` | String | File path to outfit photo |
| `notes` | String | Optional notes |
| `createdAt` | String | Date in dd/MM/yyyy format |

**Key Design Decision:**
- Outfits store **references** (IDs) to clothing items, not copies.
- This means if a clothing item is deleted, the outfit references become invalid (hence the cascade delete).

---

## UI Layer

### MainActivity.java - The Navigation Host

The main entry point of the application. It sets up the navigation framework.

**Key Responsibilities:**

1. **View Binding Setup**
```java
binding = ActivityMainBinding.inflate(getLayoutInflater());
setContentView(binding.getRoot());
```
Uses Android's View Binding feature for type-safe view access.

2. **Navigation Setup**
```java
NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
    .findFragmentById(R.id.nav_host_fragment);
NavController navController = navHostFragment.getNavController();
NavigationUI.setupWithNavController(binding.bottomNavigationView, navController);
```
- `NavHostFragment` is a container that hosts navigation destinations (fragments).
- `NavController` manages navigation between fragments.
- `NavigationUI.setupWithNavController()` connects the bottom navigation bar to the navigation graph.

**Layout Structure (activity_main.xml):**
```
┌─────────────────────────────────┐
│                                 │
│     NavHostFragment             │
│     (Contains fragments)        │
│                                 │
├─────────────────────────────────┤
│  Home  │  Wardrobe  │  Outfits  │  ← BottomNavigationView
└─────────────────────────────────┘
```

---

## Navigation System

### Navigation Graph (nav_graph.xml)

Defines the three main destinations:

```xml
<navigation app:startDestination="@id/homeFragment">
    <fragment android:id="@+id/homeFragment" 
              android:name="com.example.fitlognative.ui.home.HomeFragment"/>
    <fragment android:id="@+id/wardrobeFragment" 
              android:name="com.example.fitlognative.ui.wardrobe.WardrobeFragment"/>
    <fragment android:id="@+id/outfitsFragment" 
              android:name="com.example.fitlognative.ui.outfits.OutfitsFragment"/>
</navigation>
```

- **startDestination**: HomeFragment is shown when the app opens.
- Fragment IDs match the menu item IDs in `bottom_nav_menu.xml` for automatic navigation.

### Bottom Navigation Menu (bottom_nav_menu.xml)

```xml
<menu>
    <item android:id="@+id/homeFragment" android:title="Home" android:icon="@drawable/ic_home"/>
    <item android:id="@+id/wardrobeFragment" android:title="Wardrobe" android:icon="@drawable/ic_shirt"/>
    <item android:id="@+id/outfitsFragment" android:title="Outfits" android:icon="@drawable/ic_calendar"/>
</menu>
```

The IDs must match the fragment IDs in the navigation graph for `NavigationUI` to work correctly.

---

## Screen-by-Screen Breakdown

### 1. Home Screen (HomeFragment.java)

**Purpose:** Central hub with quick actions.

**Functionality:**
- Two action cards: "Add Item" and "Log Outfit"
- Each card navigates to the respective "Add" activity

**Code Flow:**
```java
binding.cardAddItem.setOnClickListener(v ->
    startActivity(new Intent(getActivity(), AddClothingItemActivity.class)));

binding.cardLogOutfit.setOnClickListener(v ->
    startActivity(new Intent(getActivity(), AddOutfitActivity.class)));
```

**Key Concept - Explicit Intents:**
The app uses explicit intents (specifying the exact Activity class) to navigate to other screens.

---

### 2. Wardrobe Screen (WardrobeFragment.java)

**Purpose:** Display and manage clothing items.

**Components:**
- Search input field
- RecyclerView in grid layout (2 columns)
- Item count subtitle

**Key Features:**

#### a) MVVM Architecture
```java
viewModel = new ViewModelProvider(this).get(WardrobeViewModel.class);
viewModel.getClothingItems().observe(getViewLifecycleOwner(), items -> { ... });
```
- Uses `ViewModel` to survive configuration changes (like screen rotation).
- Observes `LiveData` for reactive UI updates.

#### b) Activity Result Launchers
```java
private final ActivityResultLauncher<Intent> addLauncher =
    registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> { ... });

private final ActivityResultLauncher<Intent> detailsLauncher =
    registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), r -> { ... });
```
Modern replacement for `startActivityForResult()`. Handles results from:
- `AddClothingItemActivity` → Receives newly created item
- `ItemDetailsActivity` → Receives updated item or deletion confirmation

#### c) Incremental Updates
Instead of rebuilding the entire list when an item is added/updated/deleted:
```java
adapter.addOne(created);      // Insert at position 0
adapter.updateOne(updated);   // Update specific position
adapter.removeOne(deletedId); // Remove specific position
```
This provides smooth animations and better performance.

#### d) Search/Filter Functionality
```java
private void filterItems(String query) {
    List<ClothingItem> filtered;
    if (query == null || query.trim().isEmpty()) {
        filtered = new ArrayList<>(allItems);
    } else {
        String searchQuery = query.toLowerCase().trim();
        filtered = new ArrayList<>();
        for (ClothingItem item : allItems) {
            if (item.getName() != null && item.getName().toLowerCase().contains(searchQuery)) {
                filtered.add(item);
            }
        }
    }
    adapter.setData(filtered);
}
```
Filters by item name as the user types.

#### e) Skip Observer Pattern
```java
private boolean skipNextObserverUpdate = false;
```
When the fragment updates data incrementally (after add/edit/delete), it sets this flag to prevent the LiveData observer from triggering a full list rebuild.

---

### 3. WardrobeViewModel.java

**Purpose:** Manage wardrobe data with lifecycle awareness.

**Key Methods:**

```java
public void loadItems() {
    clothingItems.setValue(Store.get().getClothingItems());
}

public void addItem(ClothingItem item) {
    List<ClothingItem> current = clothingItems.getValue();
    if (current != null) {
        current.add(0, item);
        clothingItems.setValue(current);  // Triggers observers
    }
}
```

**LiveData Pattern:**
- `MutableLiveData` is exposed as read-only `LiveData` to observers.
- When `setValue()` is called, all observers are notified.
- The Fragment observes and updates the UI accordingly.

---

### 4. ClothingAdapter.java

**Purpose:** Bind clothing items to RecyclerView.

**RecyclerView Adapter Pattern:**
```java
@Override
public VH onCreateViewHolder(ViewGroup parent, int viewType) {
    View v = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_clothing, parent, false);
    return new VH(v);
}

@Override
public void onBindViewHolder(VH h, int position) {
    ClothingItem it = data.get(position);
    h.title.setText(it.getName());
    h.subtitle.setText(it.getCategory());
    // Load image...
}
```

**ViewHolder Pattern:**
```java
static class VH extends RecyclerView.ViewHolder {
    final ImageView thumb;
    final TextView title;
    final TextView subtitle;

    VH(View itemView) {
        super(itemView);
        thumb = itemView.findViewById(R.id.image);
        title = itemView.findViewById(R.id.title);
        subtitle = itemView.findViewById(R.id.subtitle);
    }
}
```
Caches view references for performance.

**Image Loading:**
```java
if (it.getPhoto() != null && !it.getPhoto().isEmpty()) {
    File imageFile = new File(it.getPhoto());
    if (imageFile.exists()) {
        Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
        h.thumb.setImageBitmap(bitmap);
    }
}
```
Loads images from internal storage paths.

---

### 5. AddClothingItemActivity.java

**Purpose:** Form to create a new clothing item.

**Key Features:**

#### a) Image Picker with ActivityResultLauncher
```java
private final ActivityResultLauncher<String> imagePickerLauncher =
    registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
        if (uri != null) {
            photoPath = saveImageToInternalStorage(uri);
            // Display preview...
        }
    });

// Launch with:
imagePickerLauncher.launch("image/*");
```

#### b) Image Storage
```java
private String saveImageToInternalStorage(Uri imageUri) throws IOException {
    InputStream inputStream = getContentResolver().openInputStream(imageUri);
    File directory = new File(getFilesDir(), "images");
    if (!directory.exists()) directory.mkdirs();
    
    String fileName = "photo_" + System.currentTimeMillis() + ".jpg";
    File file = new File(directory, fileName);
    
    // Copy stream to file...
    return file.getAbsolutePath();
}
```
- Images are saved to the app's internal storage (`/data/data/com.example.fitlognative/files/images/`).
- Unique filename using timestamp prevents collisions.
- Returns the absolute path for later retrieval.

#### c) Dropdown with AutoCompleteTextView
```java
private static final String[] CATEGORIES = {"Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"};

ArrayAdapter<String> categoryAdapter = new ArrayAdapter<>(this,
    android.R.layout.simple_dropdown_item_1line, CATEGORIES);
binding.categoryDropdown.setAdapter(categoryAdapter);
binding.categoryDropdown.setThreshold(0);  // Show immediately on focus
```

#### d) Comprehensive Validation
```java
private boolean validate() {
    boolean ok = true;
    ok &= validateName();      // Required, 2-100 chars
    ok &= validateCategory();  // Required, from valid list
    ok &= validateColor();     // Required, 2-50 chars
    ok &= validateBrand();     // Required, 2-50 chars
    ok &= validateSize();      // Required, from XS-XXL
    ok &= validateMaterial();  // Required, 2-100 chars
    ok &= validateNotes();     // Optional, max 500 chars
    return ok;
}
```

#### e) Return Result to Caller
```java
ClothingItem created = Store.get().addItem(item);
Intent out = new Intent();
out.putExtra(EXTRA_ITEM, created);
setResult(RESULT_CREATED, out);
finish();
```
The created item is passed back to WardrobeFragment via the Intent.

---

### 6. ItemDetailsActivity.java

**Purpose:** View clothing item details with edit/delete options.

**Key Features:**

#### a) Receive Data via Intent
```java
item = (ClothingItem) getIntent().getSerializableExtra(EXTRA_ITEM);
```

#### b) Display All Fields
```java
private void fillUI() {
    binding.tvName.setText(item.getName());
    binding.tvCategory.setText(item.getCategory());
    binding.tvColor.setText(item.getColor() != null ? item.getColor() : "");
    // ... other fields
    
    // Load and display image from file path
    if (item.getPhoto() != null && !item.getPhoto().isEmpty()) {
        File imageFile = new File(item.getPhoto());
        if (imageFile.exists()) {
            Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
            binding.itemImage.setImageBitmap(bitmap);
        }
    }
}
```

#### c) Delete Confirmation Dialog
```java
private void showDeleteDialog() {
    int outfitsCount = store.getOutfitsContainingItem(item.id);
    String message = "This will permanently remove it from your wardrobe.";
    if (outfitsCount > 0) {
        message += "\n\n" + outfitsCount + " outfit(s) containing this item will also be deleted.";
    }
    
    new AlertDialog.Builder(this)
        .setTitle("Delete Item?")
        .setMessage(message)
        .setPositiveButton("Delete", (d, w) -> { /* perform delete */ })
        .setNegativeButton("Cancel", null)
        .show();
}
```
Shows a warning if outfits will be cascade-deleted.

---

### 7. EditClothingItemActivity.java

**Purpose:** Edit existing clothing item.

**Key Differences from Add:**
- Pre-fills all fields with existing data
- Photo cannot be changed (display-only)
- Updates existing record instead of creating new

```java
ClothingItem updated = Store.get().updateClothingItem(
    item.getId(),
    binding.inputName.getText().toString().trim(),
    binding.categoryDropdown.getText().toString().trim(),
    // ... other fields
);
```

---

### 8. Outfits Screen (OutfitsFragment.java)

**Purpose:** Display and manage outfits.

**Similar Pattern to WardrobeFragment:**
- Uses `OutfitsViewModel` with `LiveData`
- `ActivityResultLauncher` for add/details
- Search functionality filters by occasion and aesthetic style
- Incremental updates with skip observer pattern

**Additional Feature - onResume Reload:**
```java
@Override
public void onResume() {
    super.onResume();
    viewModel.loadOutfits();
}
```
Reloads outfits when fragment becomes visible. This handles cases where outfits were deleted via cascade from item deletion in another screen.

---

### 9. AddOutfitActivity.java

**Purpose:** Create a new outfit.

**Unique Features:**

#### a) Date Picker
```java
private void setupDatePicker() {
    binding.dateCard.setOnClickListener(v -> {
        DatePickerDialog datePickerDialog = new DatePickerDialog(this,
            (view, year, month, day) -> {
                calendar.set(year, month, day);
                selectedDate = calendar.getTime();
                binding.tvDate.setText(df.format(selectedDate));
            }, year, month, day);
        datePickerDialog.show();
    });
}
```

#### b) Clothing Item Selection
Uses `ClothingItemSelectAdapter` with horizontal RecyclerView:
```java
adapter = new ClothingItemSelectAdapter(selectedCount -> {
    String countText = "(" + selectedCount + " selected)";
    binding.tvSelectedCount.setText(countText);
});
rvItems.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
```

#### c) Aesthetic Style Dropdown
```java
private static final String[] AESTHETIC_STYLES = {
    "Streetwear", "Minimalist", "Vintage", "Casual", "Formal",
    "Bohemian", "Athletic", "Classic", "Trendy", "Elegant"
};
```

---

### 10. ClothingItemSelectAdapter.java

**Purpose:** Allow multi-selection of clothing items for outfit creation.

**Selection Management:**
```java
private final Set<Integer> selectedIds = new HashSet<>();

h.itemView.setOnClickListener(v -> {
    if (selectedIds.contains(it.getId())) {
        selectedIds.remove(it.getId());
    } else {
        selectedIds.add(it.getId());
    }
    notifyItemChanged(position);
    listener.onSelectionChanged(selectedIds.size());
});
```

**Visual Feedback:**
```java
boolean isSelected = selectedIds.contains(it.getId());
h.selectionIndicator.setVisibility(isSelected ? View.VISIBLE : View.GONE);
```
Shows/hides a selection indicator overlay.

---

### 11. OutfitAdapter.java

**Purpose:** Display outfits in a list.

**Smart Date Formatting:**
```java
private String formatDate(String dateString) {
    // Parse the stored date...
    if (isSameDay(dateCal, today)) {
        return "Today, " + formatDateShort(date);
    } else if (isSameDay(dateCal, yesterday)) {
        return "Yesterday, " + formatDateShort(date);
    } else {
        return formatDateWithMonth(date);
    }
}
```
Displays "Today", "Yesterday", or full date based on context.

---

### 12. OutfitDetailsActivity.java

**Purpose:** View outfit details.

**Similar to ItemDetailsActivity:**
- Displays outfit image, date, style tag, occasion, notes
- Edit and Delete buttons
- Cascade-aware deletion (but outfits don't cascade to anything)

---

### 13. EditOutfitActivity.java

**Purpose:** Edit outfit metadata.

**Editable Fields:**
- Occasion
- Aesthetic Style
- Notes

**Non-Editable (Display Only):**
- Date
- Photo
- Clothing items

---

## Data Flow & Communication

### 1. Adding a Clothing Item

```
HomeFragment                    AddClothingItemActivity              Store
     │                                    │                            │
     │──── startActivity() ──────────────>│                            │
     │                                    │                            │
     │                                    │ (user fills form)          │
     │                                    │                            │
     │                                    │──── addItem() ────────────>│
     │                                    │<─── created item ──────────│
     │                                    │                            │
     │<──── RESULT_CREATED + item ────────│                            │
     │                                    │                            │
WardrobeFragment                          │                            │
     │                                    │                            │
     │ (receives via addLauncher)         │                            │
     │ adapter.addOne(created)            │                            │
     │ viewModel.addItem(created)         │                            │
```

### 2. Viewing and Editing an Item

```
WardrobeFragment          ItemDetailsActivity        EditClothingItemActivity        Store
     │                           │                            │                        │
     │── launch(item) ──────────>│                            │                        │
     │                           │                            │                        │
     │                           │── launch(item) ───────────>│                        │
     │                           │                            │                        │
     │                           │                            │── updateItem() ───────>│
     │                           │                            │<── updated item ───────│
     │                           │                            │                        │
     │                           │<─── RESULT_UPDATED ────────│                        │
     │                           │                            │                        │
     │<── RESULT_UPDATED ────────│                            │                        │
     │                           │                            │                        │
     │ adapter.updateOne()       │                            │                        │
```

### 3. Deleting an Item (with Cascade)

```
ItemDetailsActivity              Store
     │                             │
     │── getOutfitsContainingItem()──>│
     │<── count: 2 ────────────────│
     │                             │
     │ (show warning: "2 outfits will be deleted")
     │ (user confirms)             │
     │                             │
     │── deleteItem() ────────────>│
     │                             │── deleteOutfit(1)
     │                             │── deleteOutfit(2)
     │                             │── remove item
     │<── deleted id ──────────────│
     │                             │
     │ setResult(RESULT_DELETED)   │
     │ finish()                    │
```

---

## Key Android Concepts Used

### 1. View Binding
```gradle
buildFeatures {
    viewBinding = true
}
```
- Auto-generates binding classes from XML layouts
- Type-safe access to views (no `findViewById()`)
- Null-safe (views that might not exist are nullable)

### 2. Navigation Component
- `NavHostFragment`: Container for navigation destinations
- `NavController`: Manages navigation actions
- `NavigationUI`: Connects UI components (bottom nav) to navigation

### 3. ViewModel + LiveData (MVVM)
- `ViewModel`: Survives configuration changes, holds UI-related data
- `LiveData`: Observable data holder, lifecycle-aware
- Pattern separates UI logic from data management

### 4. Activity Result API
- `registerForActivityResult()`: Modern replacement for `onActivityResult()`
- Type-safe contracts: `StartActivityForResult`, `GetContent`
- Cleaner handling of results from other activities

### 5. RecyclerView Pattern
- `Adapter`: Binds data to views
- `ViewHolder`: Caches view references
- `LayoutManager`: Handles layout (Linear, Grid)
- Efficient view recycling for large lists

### 6. Serializable
- Models implement `Serializable` for Intent extras
- Allows passing complex objects between Activities

### 7. AlertDialog
- Standard Android dialog for confirmations
- Builder pattern for configuration

### 8. Snackbar
- Material Design feedback component
- Brief messages at bottom of screen

---

## How Everything Binds Together

### Application Lifecycle

1. **App Launch**: `MainActivity` is started (defined as launcher in AndroidManifest.xml)
2. **Navigation Setup**: `NavHostFragment` loads `nav_graph.xml`, starts at `HomeFragment`
3. **Bottom Nav**: Clicking tabs triggers `NavController` to swap fragments
4. **Data Access**: All screens access `Store.get()` singleton for data operations

### Fragment Lifecycle Integration

```
Fragment Created
     │
     ▼
onCreateView()
     │
     ├── Initialize ViewModel
     ├── Setup RecyclerView
     ├── Register ActivityResultLaunchers
     └── Observe LiveData
     │
     ▼
Fragment Visible
     │
     ├── User interacts with list
     ├── Launches detail/add Activities
     └── Receives results via launchers
     │
     ▼
onResume() (for OutfitsFragment)
     │
     └── Reload data (handle external changes)
```

### Data Synchronization Strategy

1. **Optimistic Updates**: When an item is created/updated/deleted, the fragment immediately updates its local adapter without waiting for a full reload.

2. **Skip Observer Pattern**: After an incremental update, the fragment sets `skipNextObserverUpdate = true` to prevent the LiveData observer from triggering a redundant full rebuild.

3. **Resume Reload**: `OutfitsFragment` reloads data in `onResume()` to catch cascade deletions that happened while it was not visible.

### Image Management Flow

```
User selects image
     │
     ▼
ActivityResultLauncher receives URI
     │
     ▼
saveImageToInternalStorage()
     │
     ├── Create /images/ directory if needed
     ├── Generate unique filename with timestamp
     ├── Copy stream data to file
     └── Return absolute file path
     │
     ▼
Path stored in model (ClothingItem.photo or Outfit.photo)
     │
     ▼
Adapter loads image: BitmapFactory.decodeFile(path)
```

### Result Communication Pattern

Activities communicate results using a consistent pattern:

| Result Code | Meaning | Data Passed |
|-------------|---------|-------------|
| `RESULT_CREATED` | New item/outfit created | Full object via Serializable |
| `RESULT_UPDATED` | Existing item/outfit modified | Updated object |
| `RESULT_DELETED` | Item/outfit was deleted | Deleted ID, cascade count |

---

## Dependencies

From `build.gradle.kts`:

| Dependency | Purpose |
|------------|---------|
| `appcompat` | Backward-compatible Android features |
| `material` | Material Design components |
| `constraintlayout` | Flexible layouts |
| `cardview` | Card UI component |
| `navigation-fragment/ui` | Jetpack Navigation |
| `lifecycle-viewmodel/livedata` | MVVM architecture |
| `fragment` | Fragment support |

---

## Permissions

From `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```
Required for accessing user's image gallery.

---

## Summary

FitLog Native is a well-structured Android application that demonstrates:

1. **Clean Architecture**: Separation between data (Store), models, and UI layers
2. **Modern Android Patterns**: ViewModel, LiveData, View Binding, Navigation Component
3. **Efficient UI Updates**: Incremental adapter updates with skip-observer optimization
4. **Robust Data Management**: Singleton store with cascade delete support
5. **Comprehensive Validation**: Client-side form validation with user feedback
6. **Image Handling**: Internal storage for photos with proper file management

The app provides a complete CRUD experience for both clothing items and outfits, with careful attention to maintaining data consistency and providing smooth user interactions.

