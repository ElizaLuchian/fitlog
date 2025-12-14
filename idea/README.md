# 🧥 FitLog — Personal Fashion Wardrobe Tracker

**FitLog** is a minimalist mobile app that helps users organize and track their wardrobe.  
You can log every clothing item you own, group them into outfits, helping you stay organized and get more creative and inspired by outfits you created in the past.
There’s no need to sign up or log in, each user is automatically identified by their device.  

The app works offline, allowing you to browse your wardrobe and plan outfits anytime.  
When you reconnect, all changes sync seamlessly with the server.

---

## 2️⃣ Domain Details

Three entities are persisted: **User**, **ClothingItem**, and **Outfit**.

---

### 👤 Entity — User

Represents the owner of the wardrobe on a given device.  
There is no login or signup, each user is identified by a unique device identifier.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | int | Unique device identifier (auto-generated UUID on first launch) |
| `createdAt` | DateTime | When the user record was created |

> 📝 All wardrobe and outfit records are linked to a single `userId`.

---

### 👚 Entity — ClothingItem

Represents an individual fashion piece in the user's wardrobe.

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | INT | Unique identifier for each clothing piece |
| `userId` | int | Device-based user ID that owns this item |
| `name` | string | Item name (e.g., "Blue Denim Jacket") |
| `category` | string | Type of clothing (e.g., Top, Bottom, Outerwear, Footwear) |
| `color` | string | Color description (e.g., Navy Blue, Cream White) |
| `brand` | string | Clothing brand or designer name |
| `size` | string | Size information (e.g., S, M, L, 32) |
| `material` | string | Main fabric (e.g., Cotton, Leather, Denim) |
| `photo` | string | Image URI or local file path for the clothing photo |
| `notes` | string | Optional remarks (e.g., “Dry clean only”, “Worn for interviews”) |
| `createdAt` | DateTime | Record creation timestamp |

---

### 🧾 Entity — Outfit

Records what the user wore on a specific day; links to one or more ClothingItems.

| Field | Type | Description |
|-------|------|-------------|
| `outfitId` | INT | Unique ID for each outfit log |
| `userId` | int | Device-based user ID that owns this outfit log |
| `items` | Array of INT | References to ClothingItem IDs used in the outfit |
| `occasion` | string | Optional context (e.g., "Work", "Date", "Party") |
| `aestheticStyleType` | string | Fashion aesthetic (e.g., “Streetwear”, “Minimalist”, “Vintage”) |
| `photo` | string | Optional photo URI of the outfit |
| `notes` | string | Remarks about comfort, compliments, or improvements |
| `createdAt` | DateTime | When the log entry was created |

---

## 3️⃣ CRUD Details

### ClothingItem

- **Create:**  
  Add a new clothing item by entering `name`, `category`, `color`, `size`, and `brand`. Optional: `material`, `photo`, `notes`.  
  The record is tagged with the current `userId`.

- **Read:**  
  View all items owned by the current user.  
  Filter by category, color, or brand, or search by name.

- **Update:**  
  Only the following fields can be edited:  
  `brand`, `size`, `color`, `material`.  
  Changes are stored locally and synced when online.

- **Delete:**  
  Remove an item after confirmation (e.g., donated or sold).  
  The deletion is queued if offline.

---

### Outfit

- **Create:**  
  Create a new outfit by selecting existing clothing items, and optionally including `occasion`, `aestheticStyleType`, `photo`, and `notes`.

- **Read:**  
  View outfits in a timeline or gallery view.  
  Search or filter by `occasion`, `aestheticStyleType`, or included items.

- **Update:**  
  Only `occasion` and `notes` can be edited after creation.

- **Delete:**  
  Delete an outfit after confirmation.  
  Removed records are synced once reconnected.

> 🔐 All CRUD operations are scoped by `userId` (device identifier) to keep user data private and isolated.

---

## 4️⃣ App Pages

The FitLog mobile app has **three main pages**:

### 1️⃣ Additions Page
A shared screen for creating new wardrobe items or outfit logs.  
- Toggle or tab selector for “➕ Add Clothing Item” or “➕ Log Outfit”.  
- Each form includes input fields as described under CRUD Create.  
- After submission, the item or outfit appears in the corresponding preview page.

### 2️⃣ Wardrobe Preview Page
Displays all clothing items owned by the user.  
- Grid or list view with item photos, names, and categories.  
- Tap an item to view details or edit its editable fields (`brand`, `size`, `color`, `material`). 

### 3️⃣ Outfit Preview Page
Shows the user’s outfit history.  
- Gallery layout showing outfit photos, and style tags.  
- Tap to view outfit details and edit `occasion` or `notes`.  
---

## 5️⃣ Persistence

FitLog stores data both **locally** and on a **remote server** for sync and backup.

### Local Database
- All data is stored locally and linked to the device’s `userId`.  
- Works fully offline with pending sync states (`pendingCreate`, `pendingUpdate`, `pendingDelete`).

### Server Sync
- Server copy mirrors local data per `userId`.  
- Sync occurs automatically when an internet connection is available.

| Operation | Local | Server |
|------------|--------|--------|
| Create | Insert locally | POST to server |
| Read | Cached read | Optional GET refresh |
| Update | Edit locally | PATCH to server |
| Delete | Mark/remove locally | DELETE on sync |

---

## 6️⃣ Offline Behavior

FitLog is **offline-first**. Users can perform all actions offline, new additions, edits, and deletions are queued for sync.

### Scenarios

- **Create (Offline):** Stored with `pendingCreate`, uploaded when online.  
- **Update (Offline):** Changes saved as `pendingUpdate`.  
- **Delete (Offline):** Marked as `pendingDelete` and removed after sync.  
- **Read (Offline):** Cached wardrobe and outfit data remain viewable.

> 💡 *Tip:* A small “Offline Mode” banner can display pending changes or sync status.

---

## 🧾 Summary

FitLog is a clean, offline-first wardrobe tracker that keeps your fashion world organized.  
Each user is identified by their **device**, no account required.  
With smart syncing, scoped CRUD operations, and a clear three-page structure, FitLog helps you maintain your digital wardrobe effortlessly.


<img width="417" height="900" alt="image" src="https://github.com/user-attachments/assets/f5032318-c3e3-49c6-bed6-be4874391e5d" />
<img width="415" height="890" alt="image" src="https://github.com/user-attachments/assets/7aa4d2e5-df72-4e46-b301-8be77471cfd6" />
<img width="406" height="895" alt="image" src="https://github.com/user-attachments/assets/b2e69ba2-d556-4dd1-98e4-e6772425c896" />
<img width="391" height="895" alt="image" src="https://github.com/user-attachments/assets/5f7b10cb-c2c0-4c62-8c0d-ee9c64d385e3" />
<img width="389" height="904" alt="image" src="https://github.com/user-attachments/assets/edf388c5-8943-4331-ad9a-f9a3bac25f7e" />
<img width="389" height="897" alt="image" src="https://github.com/user-attachments/assets/6ad4816d-3227-4c5a-a6fa-c146fe5658f4" />
<img width="424" height="894" alt="image" src="https://github.com/user-attachments/assets/bc712b46-e5e5-4d74-9d66-ab940f7e8adb" />






