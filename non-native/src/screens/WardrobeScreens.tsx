import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useWardrobe } from "@store/hooks";
import type { ClothingItem } from "@models/ClothingItem";
import type { WardrobeStackParamList } from "@navigation/types";
import {
  CATEGORIES,
  VALID_SIZES,
  validateClothingItemForm,
  type ClothingItemFormData
} from "@utils/validation";

type NavigationProp = NativeStackNavigationProp<WardrobeStackParamList>;

// WardrobeScreen - Main wardrobe list with search
export function WardrobeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { items } = useWardrobe();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);

  // Ensure items are synced when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Force a re-render by updating filtered items
      if (searchQuery.trim() === "") {
        setFilteredItems(items);
      } else {
        const query = searchQuery.toLowerCase().trim();
        setFilteredItems(
          items.filter(
            item => item.name && item.name.toLowerCase().includes(query)
          )
        );
      }
    }, [items, searchQuery])
  );

  // Update filtered items when items or search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems([...items]); // Create new array to ensure re-render
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredItems(
        items.filter(
          item => item.name && item.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, items]);

  const itemCount = items.length; // Show total items, not filtered

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.subtitle}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} in your collection
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Grid of Items */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <ClothingItemCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.gridContent,
          filteredItems.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No items found" : "No items in your wardrobe"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ClothingItemCard({ item }: { item: ClothingItem }) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        navigation.navigate("ItemDetailsScreen", { itemId: item.id.toString() });
      }}
    >
      {item.photo ? (
        <Image 
          source={{ uri: item.photo }} 
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <MaterialIcons name="checkroom" size={32} color="#CCCCCC" />
        </View>
      )}
      <Text style={styles.cardName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.cardCategory} numberOfLines={1}>
        {item.category}
      </Text>
    </Pressable>
  );
}

// AddClothingItemScreen - Full form to add a clothing item
export function AddClothingItemScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addItem } = useWardrobe();
  const [photoUri, setPhotoUri] = useState<string>("");
  const [formData, setFormData] = useState<ClothingItemFormData>({
    name: "",
    category: "",
    color: "",
    brand: "",
    size: "",
    material: "",
    notes: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClothingItemFormData, string>>>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const validation = validateClothingItemForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      const newItem: Omit<ClothingItem, "id"> = {
        name: formData.name.trim(),
        category: formData.category.trim() as ClothingItem["category"],
        color: formData.color.trim(),
        brand: formData.brand.trim(),
        size: formData.size.trim().toUpperCase(),
        material: formData.material.trim(),
        photo: photoUri,
        notes: formData.notes.trim()
      };

      const createdItem = addItem(newItem);
      console.log("Item saved successfully:", createdItem);
      console.log("Item ID:", createdItem.id);
      console.log("Item name:", createdItem.name);
      
      Alert.alert("Success", "Clothing item added successfully!");
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Failed to save item. Please try again.");
    }
  };

  const updateField = (field: keyof ClothingItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ScrollView style={styles.addScreenContainer} contentContainerStyle={styles.addScreenContent}>
      {/* Photo Upload Section */}
      <Text style={styles.fieldLabel}>Photo</Text>
      {photoUri ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <Pressable style={styles.changePhotoButton} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.photoCard} onPress={pickImage}>
          <View style={styles.photoCardContent}>
            <View style={styles.cameraIconContainer}>
              <MaterialIcons name="camera-alt" size={32} color="#E91E63" />
            </View>
            <Text style={styles.photoCardText}>Add Photo</Text>
            <Text style={styles.photoCardSubtext}>Tap to upload</Text>
          </View>
        </Pressable>
      )}

      {/* Name Field */}
      <Text style={styles.fieldLabel}>Name *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="e.g., Blue Denim Jacket"
          value={formData.name}
          onChangeText={value => updateField("name", value)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Category Field */}
      <Text style={styles.fieldLabel}>Category *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[styles.input, styles.dropdownInput, errors.category && styles.inputError]}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.category && styles.placeholderText]}>
            {formData.category || "Select category"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showCategoryDropdown && (
          <View style={styles.dropdown}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("category", cat);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Color Field */}
      <Text style={styles.fieldLabel}>Color *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.color && styles.inputError]}
          placeholder="e.g., Navy Blue"
          value={formData.color}
          onChangeText={value => updateField("color", value)}
        />
        {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
      </View>

      {/* Brand Field */}
      <Text style={styles.fieldLabel}>Brand *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.brand && styles.inputError]}
          placeholder="e.g., Levi's"
          value={formData.brand}
          onChangeText={value => updateField("brand", value)}
        />
        {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
      </View>

      {/* Size Field */}
      <Text style={styles.fieldLabel}>Size *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[styles.input, styles.dropdownInput, errors.size && styles.inputError]}
          onPress={() => setShowSizeDropdown(!showSizeDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.size && styles.placeholderText]}>
            {formData.size || "e.g., XS, S, M, L, XL, XXL"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showSizeDropdown && (
          <View style={styles.dropdown}>
            {VALID_SIZES.map(size => (
              <Pressable
                key={size}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("size", size);
                  setShowSizeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{size}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.size && <Text style={styles.errorText}>{errors.size}</Text>}
      </View>

      {/* Material Field */}
      <Text style={styles.fieldLabel}>Material *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.material && styles.inputError]}
          placeholder="e.g., Cotton, Leather, Denim"
          value={formData.material}
          onChangeText={value => updateField("material", value)}
        />
        {errors.material && <Text style={styles.errorText}>{errors.material}</Text>}
      </View>

      {/* Notes Field */}
      <Text style={styles.fieldLabel}>Notes</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
          placeholder="e.g., Dry clean only, worn for interviews"
          value={formData.notes}
          onChangeText={value => updateField("notes", value)}
          multiline
          numberOfLines={3}
        />
        {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Item</Text>
      </Pressable>
    </ScrollView>
  );
}

// EditClothingItemScreen - Edit existing clothing item
export function EditClothingItemScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { itemId } = route.params as { itemId: string };
  const { items, updateClothingItem } = useWardrobe();
  
  const item = items.find(i => i.id.toString() === itemId);

  // If item not found, go back
  if (!item) {
    React.useEffect(() => {
      navigation.goBack();
    }, []);
    return null;
  }

  const [photoUri, setPhotoUri] = useState<string>(item.photo || "");
  const [formData, setFormData] = useState<ClothingItemFormData>({
    name: item.name,
    category: item.category,
    color: item.color,
    brand: item.brand,
    size: item.size,
    material: item.material,
    notes: item.notes || ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClothingItemFormData, string>>>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const validation = validateClothingItemForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      const updatedItem = updateClothingItem(
        item.id,
        formData.name.trim(),
        formData.category.trim() as ClothingItem["category"],
        formData.color.trim(),
        formData.brand.trim(),
        formData.size.trim().toUpperCase(),
        formData.material.trim(),
        formData.notes.trim()
      );

      if (updatedItem) {
        console.log("Item updated successfully:", updatedItem);
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update item. Please try again.");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item. Please try again.");
    }
  };

  const updateField = (field: keyof ClothingItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ScrollView style={styles.addScreenContainer} contentContainerStyle={styles.addScreenContent}>
      {/* Photo Upload Section */}
      <Text style={styles.fieldLabel}>Photo</Text>
      {photoUri ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <Pressable style={styles.changePhotoButton} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.photoCard} onPress={pickImage}>
          <View style={styles.photoCardContent}>
            <View style={styles.cameraIconContainer}>
              <MaterialIcons name="camera-alt" size={32} color="#E91E63" />
            </View>
            <Text style={styles.photoCardText}>Add Photo</Text>
            <Text style={styles.photoCardSubtext}>Tap to upload</Text>
          </View>
        </Pressable>
      )}

      {/* Name Field */}
      <Text style={styles.fieldLabel}>Name *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="e.g., Blue Denim Jacket"
          value={formData.name}
          onChangeText={value => updateField("name", value)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Category Field */}
      <Text style={styles.fieldLabel}>Category *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[styles.input, styles.dropdownInput, errors.category && styles.inputError]}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.category && styles.placeholderText]}>
            {formData.category || "Select category"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showCategoryDropdown && (
          <View style={styles.dropdown}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("category", cat);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Color Field */}
      <Text style={styles.fieldLabel}>Color *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.color && styles.inputError]}
          placeholder="e.g., Navy Blue"
          value={formData.color}
          onChangeText={value => updateField("color", value)}
        />
        {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
      </View>

      {/* Brand Field */}
      <Text style={styles.fieldLabel}>Brand *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.brand && styles.inputError]}
          placeholder="e.g., Levi's"
          value={formData.brand}
          onChangeText={value => updateField("brand", value)}
        />
        {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
      </View>

      {/* Size Field */}
      <Text style={styles.fieldLabel}>Size *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[styles.input, styles.dropdownInput, errors.size && styles.inputError]}
          onPress={() => setShowSizeDropdown(!showSizeDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.size && styles.placeholderText]}>
            {formData.size || "e.g., XS, S, M, L, XL, XXL"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showSizeDropdown && (
          <View style={styles.dropdown}>
            {VALID_SIZES.map(size => (
              <Pressable
                key={size}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("size", size);
                  setShowSizeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{size}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.size && <Text style={styles.errorText}>{errors.size}</Text>}
      </View>

      {/* Material Field */}
      <Text style={styles.fieldLabel}>Material *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.material && styles.inputError]}
          placeholder="e.g., Cotton, Leather, Denim"
          value={formData.material}
          onChangeText={value => updateField("material", value)}
        />
        {errors.material && <Text style={styles.errorText}>{errors.material}</Text>}
      </View>

      {/* Notes Field */}
      <Text style={styles.fieldLabel}>Notes</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
          placeholder="e.g., Dry clean only, worn for interviews"
          value={formData.notes}
          onChangeText={value => updateField("notes", value)}
          multiline
          numberOfLines={3}
        />
        {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
      </View>

      {/* Update Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Update Item</Text>
      </Pressable>
    </ScrollView>
  );
}

export function ItemDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { itemId } = route.params as { itemId: string };
  const { items, deleteItem } = useWardrobe();
  
  const item = items.find(i => i.id.toString() === itemId);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Item not found</Text>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate("EditClothingItemScreen", { itemId: itemId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Item?",
      "This will permanently remove it from your wardrobe.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteItem(item.id);
            Alert.alert("Success", "Item deleted successfully!");
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.detailsContent}>
      {/* Photo */}
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.detailsImage} resizeMode="cover" />
      ) : (
        <View style={styles.detailsImagePlaceholder}>
          <MaterialIcons name="checkroom" size={64} color="#CCCCCC" />
        </View>
      )}

      {/* Item Name */}
      <Text style={styles.detailsName}>{item.name}</Text>

      {/* Category */}
      <Text style={styles.detailsCategory}>{item.category}</Text>

      {/* Details Cards */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsLabel}>Color</Text>
        <Text style={styles.detailsValue}>{item.color}</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsLabel}>Brand</Text>
        <Text style={styles.detailsValue}>{item.brand}</Text>
      </View>

      {item.size && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Size</Text>
          <Text style={styles.detailsValue}>{item.size}</Text>
        </View>
      )}

      {item.material && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Material</Text>
          <Text style={styles.detailsValue}>{item.material}</Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Notes</Text>
          <Text style={styles.detailsValue}>{item.notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <Pressable style={styles.editButton} onPress={handleEdit}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.editButtonText}>Edit Item</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <MaterialIcons name="delete" size={20} color="#E91E63" />
        <Text style={styles.deleteButtonText}>Delete Item</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16
  },
  header: {
    marginTop: 24,
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: "#666666"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000"
  },
  gridContent: {
    paddingTop: 8,
    paddingBottom: 8
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 0
  },
  emptyContainer: {
    flex: 1
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  cardImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#F5F5F5"
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    padding: 8,
    paddingBottom: 4
  },
  cardCategory: {
    fontSize: 12,
    color: "#666666",
    paddingHorizontal: 8,
    paddingBottom: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 16,
    color: "#666666"
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8
  },
  // Add Clothing Item Screen Styles
  addScreenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  addScreenContent: {
    padding: 20
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8
  },
  photoCard: {
    width: "100%",
    height: 200,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  photoCardContent: {
    alignItems: "center"
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFE0E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8
  },
  photoCardText: {
    fontSize: 16,
    color: "#000000",
    marginTop: 8
  },
  photoCardSubtext: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4
  },
  photoPreviewContainer: {
    marginBottom: 24
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8
  },
  changePhotoButton: {
    alignSelf: "flex-start"
  },
  changePhotoText: {
    fontSize: 14,
    color: "#E91E63",
    fontWeight: "600"
  },
  inputContainer: {
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF"
  },
  inputError: {
    borderColor: "#E91E63"
  },
  dropdownInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dropdownText: {
    fontSize: 16,
    color: "#000000"
  },
  placeholderText: {
    color: "#999999"
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5"
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000000"
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  errorText: {
    fontSize: 12,
    color: "#E91E63",
    marginTop: 4
  },
  saveButton: {
    backgroundColor: "#E91E63",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  // Item Details Screen Styles
  detailsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  detailsContent: {
    paddingBottom: 32
  },
  detailsImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#F5F5F5"
  },
  detailsImagePlaceholder: {
    width: "100%",
    height: 400,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  detailsName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 24,
    marginHorizontal: 20
  },
  detailsCategory: {
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
    marginHorizontal: 20,
    marginBottom: 16
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12
  },
  detailsLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4
  },
  detailsValue: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500"
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    gap: 8
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E91E63",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8
  },
  deleteButtonText: {
    color: "#E91E63",
    fontSize: 16,
    fontWeight: "600"
  }
});
