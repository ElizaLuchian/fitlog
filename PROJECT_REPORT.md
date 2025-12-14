# FitLogNative Project Report

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Key Android Concepts Explained](#key-android-concepts-explained)
4. [Project Structure](#project-structure)
5. [How Files Are Linked Together](#how-files-are-linked-together)
6. [Component Workflows](#component-workflows)
7. [Data Flow](#data-flow)

---

## Project Overview

**FitLogNative** is an Android mobile application built with Java that helps users manage their wardrobe and create outfit combinations. The app allows users to:

- **Add clothing items** to their wardrobe with details like name, category, color, brand, size, material, and photos
- **Create outfits** by combining multiple clothing items with occasion, aesthetic style, and notes
- **View and manage** their wardrobe and outfit collections
- **Search and filter** items and outfits

The app follows Android's recommended architecture patterns and uses modern Android development practices.

---

## Architecture Overview

This project uses the **MVVM (Model-View-ViewModel)** architecture pattern, which is recommended by Google for Android development. Here's what each component does:

### MVVM Pattern Breakdown

1. **Model** - Represents the data and business logic
   - `ClothingItem.java` - Data model for clothing items
   - `Outfit.java` - Data model for outfits
   - `Store.java` - In-memory data storage (acts as a simple database)

2. **View** - The UI components that users interact with
   - **Activities**: Full-screen UI components (e.g., `MainActivity`, `AddClothingItemActivity`)
   - **Fragments**: Reusable UI components that live inside Activities (e.g., `HomeFragment`, `WardrobeFragment`)
   - **Layout XML files**: Define the visual structure of Activities and Fragments

3. **ViewModel** - Manages UI-related data and survives configuration changes
   - `WardrobeViewModel.java` - Manages clothing items data for the Wardrobe screen
   - `OutfitsViewModel.java` - Manages outfits data for the Outfits screen

### Why MVVM?

- **Separation of Concerns**: UI code is separate from business logic
- **Testability**: ViewModels can be tested independently
- **Lifecycle Awareness**: ViewModels survive screen rotations and configuration changes
- **Data Binding**: LiveData automatically updates the UI when data changes

---

## Key Android Concepts Explained

### 1. Activities vs Fragments

**Activity**: A single, focused thing a user can do. Think of it as a "screen" in your app.
- Example: `MainActivity` is the main screen that hosts the bottom navigation
- Activities are declared in `AndroidManifest.xml`
- Each Activity has a lifecycle (onCreate, onStart, onResume, onPause, onStop, onDestroy)

**Fragment**: A reusable portion of your app's UI. Fragments live inside Activities.
- Example: `WardrobeFragment` displays the list of clothing items
- Fragments are more flexible and can be reused across different Activities
- In this app, `MainActivity` hosts three Fragments: `HomeFragment`, `WardrobeFragment`, and `OutfitsFragment`

### 2. View Binding

**View Binding** is a feature that generates a binding class for each XML layout file, allowing you to access views without using `findViewById()`.

- When you have `activity_main.xml`, Android generates `ActivityMainBinding.java`
- You access views like: `binding.textView.setText("Hello")` instead of `findViewById(R.id.textView)`
- Enabled in `build.gradle.kts` with `viewBinding = true`

### 3. RecyclerView and Adapters

**RecyclerView** is a widget that displays a scrollable list of items efficiently.

**Adapter** is a bridge between your data and the RecyclerView. It:
- Creates view holders for each item
- Binds data to views
- Tells RecyclerView how many items there are

In this project:
- `ClothingAdapter.java` displays clothing items in a grid
- `OutfitAdapter.java` displays outfits in a list
- `ClothingItemSelectAdapter.java` displays selectable clothing items when creating an outfit

### 4. LiveData and Observers

**LiveData** is an observable data holder that is lifecycle-aware (only updates UI when the Activity/Fragment is active).

**Observer Pattern**: The ViewModel holds LiveData, and the Fragment "observes" it. When data changes, the observer is automatically notified.

Example from `WardrobeFragment.java`:
```java
viewModel.getClothingItems().observe(getViewLifecycleOwner(), items -> {
    // This code runs automatically when clothingItems changes
    adapter.setData(items);
});
```

### 5. Navigation Component

The **Navigation Component** manages navigation between different screens in your app.

- `nav_graph.xml` defines all the destinations (Fragments) and how to navigate between them
- `BottomNavigationView` uses the navigation graph to switch between Home, Wardrobe, and Outfits
- `NavController` handles the actual navigation

### 6. ActivityResultLauncher

**ActivityResultLauncher** is a modern way to start an Activity and get a result back.

- Old way: `startActivityForResult()` (deprecated)
- New way: `registerForActivityResult()` with `ActivityResultLauncher`

In this app:
- `WardrobeFragment` launches `AddClothingItemActivity` and receives the created item back
- `ItemDetailsActivity` launches `EditClothingItemActivity` and receives the updated item back

### 7. Intent

**Intent** is a messaging object used to:
- Start Activities: `new Intent(context, AddClothingItemActivity.class)`
- Pass data between Activities: `intent.putExtra("key", data)`
- Receive data: `getIntent().getSerializableExtra("key")`

### 8. Singleton Pattern (Store.java)

**Singleton** ensures only one instance of a class exists.

`Store.java` uses the singleton pattern:
```java
private static Store instance;
public static Store get() {
    if (instance == null) instance = new Store();
    return instance;
}
```

This means `Store.get()` always returns the same instance, so all Activities and Fragments share the same data.

---

## Project Structure

```
FitLogNative/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/fitlognative/
│   │   │   │   ├── data/
│   │   │   │   │   └── Store.java                    # Data storage (singleton)
│   │   │   │   ├── model/
│   │   │   │   │   ├── ClothingItem.java             # Clothing item data model
│   │   │   │   │   └── Outfit.java                   # Outfit data model
│   │   │   │   └── ui/
│   │   │   │       ├── MainActivity.java             # Main activity with bottom nav
│   │   │   │       ├── home/
│   │   │   │       │   └── HomeFragment.java         # Home screen
│   │   │   │       ├── wardrobe/
│   │   │   │       │   ├── WardrobeFragment.java      # Wardrobe list screen
│   │   │   │       │   ├── WardrobeViewModel.java    # ViewModel for wardrobe
│   │   │   │       │   ├── ClothingAdapter.java      # Adapter for clothing grid
│   │   │   │       │   ├── AddClothingItemActivity.java
│   │   │   │       │   ├── EditClothingItemActivity.java
│   │   │   │       │   └── ItemDetailsActivity.java
│   │   │   │       └── outfits/
│   │   │   │           ├── OutfitsFragment.java       # Outfits list screen
│   │   │   │           ├── OutfitsViewModel.java     # ViewModel for outfits
│   │   │   │           ├── OutfitAdapter.java        # Adapter for outfits list
│   │   │   │           ├── ClothingItemSelectAdapter.java
│   │   │   │           ├── AddOutfitActivity.java
│   │   │   │           ├── EditOutfitActivity.java
│   │   │   │           └── OutfitDetailsActivity.java
│   │   │   ├── res/
│   │   │   │   ├── layout/                            # XML layout files
│   │   │   │   ├── navigation/
│   │   │   │   │   └── nav_graph.xml                  # Navigation graph
│   │   │   │   ├── menu/
│   │   │   │   │   └── bottom_nav_menu.xml            # Bottom navigation menu
│   │   │   │   └── values/                            # Colors, strings, themes
│   │   │   └── AndroidManifest.xml                    # App configuration
│   │   └── test/                                      # Unit tests
│   └── build.gradle.kts                              # App dependencies
├── build.gradle.kts                                   # Project-level config
└── settings.gradle.kts                                # Project settings
```

---

## How Files Are Linked Together

### 1. Application Entry Point

**AndroidManifest.xml** → **MainActivity.java**
- `AndroidManifest.xml` declares `MainActivity` as the launcher activity
- When the app starts, Android creates `MainActivity`
- `MainActivity` inflates `activity_main.xml` layout

### 2. Main Activity Setup

**MainActivity.java** → **activity_main.xml** → **nav_graph.xml**
- `MainActivity.onCreate()` inflates `activity_main.xml`
- `activity_main.xml` contains a `NavHostFragment` that references `nav_graph.xml`
- `nav_graph.xml` defines three destinations: `homeFragment`, `wardrobeFragment`, `outfitsFragment`
- `MainActivity` connects `BottomNavigationView` to the `NavController` for navigation

### 3. Navigation Flow

**bottom_nav_menu.xml** → **MainActivity** → **Fragments**
- `bottom_nav_menu.xml` defines three menu items (Home, Wardrobe, Outfits)
- `MainActivity` sets up `BottomNavigationView` with this menu
- When user taps a menu item, `NavController` navigates to the corresponding Fragment

### 4. Fragment → ViewModel → Store Chain

**WardrobeFragment.java** → **WardrobeViewModel.java** → **Store.java**
- `WardrobeFragment` creates a `WardrobeViewModel` instance
- `WardrobeViewModel` loads data from `Store.get().getClothingItems()`
- `WardrobeViewModel` exposes data as `LiveData<List<ClothingItem>>`
- `WardrobeFragment` observes this LiveData and updates the UI

### 5. Fragment → Adapter → Layout

**WardrobeFragment.java** → **ClothingAdapter.java** → **item_clothing.xml**
- `WardrobeFragment` creates a `ClothingAdapter` and sets it on the `RecyclerView`
- `ClothingAdapter` inflates `item_clothing.xml` for each item
- `ClothingAdapter.onBindViewHolder()` populates the views with data

### 6. Activity Launching Flow

**WardrobeFragment** → **AddClothingItemActivity** → **Store** → **WardrobeFragment**
- User action in `WardrobeFragment` (or `HomeFragment`) launches `AddClothingItemActivity`
- `AddClothingItemActivity` collects user input and creates a `ClothingItem`
- `AddClothingItemActivity` saves to `Store.get().addItem(item)`
- `AddClothingItemActivity` returns the item via `ActivityResultLauncher`
- `WardrobeFragment` receives the result and updates the adapter

### 7. Data Model Usage

**ClothingItem.java** and **Outfit.java** are used throughout:
- Passed via Intents: `intent.putExtra("item", clothingItem)`
- Stored in Store: `Store.get().addItem(clothingItem)`
- Displayed in Adapters: `adapter.setData(items)`
- Observed in ViewModels: `LiveData<List<ClothingItem>>`

---

## Component Workflows

### Workflow 1: Adding a Clothing Item

```
1. User taps "Add Item" button in HomeFragment
   ↓
2. HomeFragment launches AddClothingItemActivity via Intent
   ↓
3. AddClothingItemActivity displays form (activity_add_clothing_item.xml)
   ↓
4. User fills form and selects photo
   ↓
5. AddClothingItemActivity validates input
   ↓
6. AddClothingItemActivity creates ClothingItem object
   ↓
7. AddClothingItemActivity saves to Store.get().addItem(item)
   ↓
8. AddClothingItemActivity returns result via setResult()
   ↓
9. WardrobeFragment receives result via ActivityResultLauncher
   ↓
10. WardrobeFragment updates ClothingAdapter with new item
   ↓
11. WardrobeFragment updates WardrobeViewModel
   ↓
12. UI automatically updates (RecyclerView shows new item)
```

**Files Involved:**
- `HomeFragment.java` - Launches activity
- `AddClothingItemActivity.java` - Form handling
- `activity_add_clothing_item.xml` - Form layout
- `Store.java` - Data persistence
- `ClothingItem.java` - Data model
- `WardrobeFragment.java` - Receives result
- `ClothingAdapter.java` - Updates UI
- `WardrobeViewModel.java` - Manages data

### Workflow 2: Viewing and Editing a Clothing Item

```
1. User taps a clothing item in WardrobeFragment
   ↓
2. ClothingAdapter launches ItemDetailsActivity via Intent
   ↓
3. ItemDetailsActivity displays item details (activity_item_details.xml)
   ↓
4. User taps "Edit" button
   ↓
5. ItemDetailsActivity launches EditClothingItemActivity
   ↓
6. EditClothingItemActivity loads item data into form
   ↓
7. User modifies data and saves
   ↓
8. EditClothingItemActivity updates Store.get().updateClothingItem()
   ↓
9. EditClothingItemActivity returns updated item
   ↓
10. ItemDetailsActivity receives result and updates display
   ↓
11. ItemDetailsActivity returns result to WardrobeFragment
   ↓
12. WardrobeFragment updates adapter incrementally
   ↓
13. UI updates to show changes
```

**Files Involved:**
- `ClothingAdapter.java` - Item click handler
- `ItemDetailsActivity.java` - Details display
- `EditClothingItemActivity.java` - Edit form
- `Store.java` - Data update
- `WardrobeFragment.java` - Receives updates

### Workflow 3: Creating an Outfit

```
1. User taps "Log Outfit" in HomeFragment
   ↓
2. HomeFragment launches AddOutfitActivity
   ↓
3. AddOutfitActivity loads all clothing items from Store
   ↓
4. AddOutfitActivity displays items in horizontal RecyclerView
   ↓
5. User selects multiple items using ClothingItemSelectAdapter
   ↓
6. User fills occasion, aesthetic style, date, and photo
   ↓
7. AddOutfitActivity validates input
   ↓
8. AddOutfitActivity creates Outfit with selected item IDs
   ↓
9. AddOutfitActivity saves to Store.get().addOutfit(outfit)
   ↓
10. AddOutfitActivity returns result
   ↓
11. OutfitsFragment receives result via ActivityResultLauncher
   ↓
12. OutfitsFragment updates OutfitAdapter
   ↓
13. UI shows new outfit in list
```

**Files Involved:**
- `HomeFragment.java` - Launches activity
- `AddOutfitActivity.java` - Outfit creation form
- `ClothingItemSelectAdapter.java` - Multi-select adapter
- `Store.java` - Data storage
- `Outfit.java` - Data model
- `OutfitsFragment.java` - Receives result
- `OutfitAdapter.java` - Updates UI

### Workflow 4: Deleting a Clothing Item

```
1. User views item details in ItemDetailsActivity
   ↓
2. User taps "Delete" button
   ↓
3. ItemDetailsActivity shows confirmation dialog
   ↓
4. Store.get().getOutfitsContainingItem() checks for dependent outfits
   ↓
5. User confirms deletion
   ↓
6. Store.get().deleteItem() removes item AND dependent outfits
   ↓
7. ItemDetailsActivity returns deletion result
   ↓
8. WardrobeFragment receives result
   ↓
9. WardrobeFragment removes item from adapter
   ↓
10. WardrobeFragment shows snackbar with deletion message
   ↓
11. If OutfitsFragment is visible, it reloads (onResume)
```

**Files Involved:**
- `ItemDetailsActivity.java` - Delete action
- `Store.java` - Deletion logic (cascading delete)
- `WardrobeFragment.java` - UI update
- `OutfitsFragment.java` - Reload on resume

---

## Data Flow

### Data Storage Architecture

```
┌─────────────────┐
│   Store.java    │  ← Singleton pattern (one instance for entire app)
│  (In-Memory)    │
│                 │
│ - clothingItems │
│ - outfits       │
└─────────────────┘
         ↑
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Wardrobe│ │Outfits│
│ViewModel│ │ViewModel│
└───┬───┘ └──┬────┘
    │        │
    │        │ LiveData
    │        │
┌───▼───┐ ┌──▼────┐
│Wardrobe│ │Outfits│
│Fragment│ │Fragment│
└───┬───┘ └──┬────┘
    │        │
    │        │ Updates
    │        │
┌───▼───┐ ┌──▼────┐
│Clothing│ │Outfit │
│Adapter │ │Adapter│
└────────┘ └───────┘
```

### Key Data Flow Principles

1. **Single Source of Truth**: `Store.java` is the only place where data is stored
2. **Unidirectional Flow**: Data flows from Store → ViewModel → Fragment → Adapter → UI
3. **Reactive Updates**: When Store changes, ViewModel updates LiveData, which automatically notifies Fragments
4. **Incremental Updates**: Adapters support `addOne()`, `updateOne()`, `removeOne()` for efficient UI updates

### Data Persistence

**Important Note**: Currently, `Store.java` uses in-memory storage (ArrayList). This means:
- Data is lost when the app is closed
- Data persists during app usage (screen rotations, navigation)
- To add persistence, you would integrate Room Database or SharedPreferences

---

## Key Design Patterns Used

### 1. Singleton Pattern
- **Store.java**: Ensures one data store instance across the app

### 2. Observer Pattern
- **LiveData + Observer**: Fragments observe ViewModel data changes

### 3. Adapter Pattern
- **RecyclerView.Adapter**: Bridges data and RecyclerView

### 4. MVVM Pattern
- **Separation**: Model (Store, ClothingItem, Outfit), View (Fragments, Activities), ViewModel (WardrobeViewModel, OutfitsViewModel)

### 5. Activity Result Pattern
- **ActivityResultLauncher**: Modern way to handle Activity results

---

## Important Android Concepts in This Project

### 1. Lifecycle Awareness
- ViewModels survive configuration changes (screen rotation)
- Fragments observe LiveData with `getViewLifecycleOwner()` to prevent memory leaks

### 2. View Binding
- All Activities and Fragments use View Binding (`ActivityMainBinding`, `FragmentWardrobeBinding`, etc.)
- No `findViewById()` calls needed

### 3. Navigation Component
- Declarative navigation in `nav_graph.xml`
- Type-safe navigation between Fragments

### 4. Material Design Components
- Uses Material Design widgets (TextInputLayout, CardView, BottomNavigationView)
- Consistent styling and user experience

### 5. Image Handling
- Images are saved to internal storage (`getFilesDir()/images/`)
- File paths are stored as strings in ClothingItem/Outfit
- Bitmaps are loaded on-demand for display

---

## Summary

This FitLogNative project demonstrates a well-structured Android application using:

- **MVVM Architecture** for separation of concerns
- **Navigation Component** for screen navigation
- **LiveData** for reactive data updates
- **RecyclerView** for efficient list/grid displays
- **View Binding** for type-safe view access
- **ActivityResultLauncher** for modern Activity communication
- **Singleton Pattern** for centralized data storage

The app follows Android best practices and provides a solid foundation for understanding mobile app development in Java/Android.

---

## Next Steps for Learning

1. **Add Persistence**: Integrate Room Database to save data permanently
2. **Add Image Loading Library**: Use Glide or Picasso for better image handling
3. **Add Unit Tests**: Test ViewModels and Store logic
4. **Add UI Tests**: Test user workflows with Espresso
5. **Add Error Handling**: Better error messages and validation feedback
6. **Add Animations**: Smooth transitions between screens

---

*Report generated for FitLogNative project analysis*




