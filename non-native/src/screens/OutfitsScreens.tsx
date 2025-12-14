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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useOutfits } from "@store/hooks";
import { useWardrobe } from "@store/hooks";
import type { OutfitsStackParamList } from "@navigation/types";
import type { ClothingItem } from "@models/ClothingItem";
import {
  validateOutfitForm,
  AESTHETIC_STYLES,
  type OutfitFormData,
  type OutfitValidationErrors
} from "@utils/validation";

type NavigationProp = NativeStackNavigationProp<OutfitsStackParamList>;

// Helper function to format date like "Today, Oct 17", "Yesterday, Oct 16", or "Oct 15, 2025"
function formatOutfitDate(dateString: string): string {
  if (!dateString || dateString.trim() === "") {
    return "Today";
  }

  try {
    // Try to parse different date formats
    let date: Date;
    
    // Try MM/DD/YYYY format first
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString; // Return original if parsing fails
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const isToday = dateOnly.getTime() === today.getTime();
    const isYesterday = dateOnly.getTime() === yesterday.getTime();

    if (isToday) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `Today, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    } else if (isYesterday) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `Yesterday, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
  } catch (error) {
    return dateString;
  }
}

export function OutfitsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { outfits } = useOutfits();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOutfits, setFilteredOutfits] = useState(outfits);

  // Update filtered outfits when outfits or search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOutfits([...outfits]);
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredOutfits(
        outfits.filter(
          outfit =>
            (outfit.occasion && outfit.occasion.toLowerCase().includes(query)) ||
            (outfit.aestheticStyleType && outfit.aestheticStyleType.toLowerCase().includes(query)) ||
            (outfit.notes && outfit.notes.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, outfits]);

  const outfitCount = outfits.length;

  const handleOutfitPress = (outfit: import("@models/Outfit").Outfit) => {
    navigation.navigate("OutfitDetailsScreen", { outfitId: outfit.outfitId.toString() });
  };

  return (
    <View style={styles.outfitsContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <Text style={styles.subtitle}>
          {outfitCount} outfit{outfitCount !== 1 ? "s" : ""} logged
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search outfits..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Outfit List */}
      <FlatList
        data={filteredOutfits}
        renderItem={({ item }) => (
          <OutfitCard
            outfit={item}
            onPress={() => handleOutfitPress(item)}
          />
        )}
        keyExtractor={(item) => item.outfitId.toString()}
        contentContainerStyle={[
          styles.listContent,
          filteredOutfits.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No outfits found" : "No outfits logged"}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Go to Home to add your first outfit
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

function OutfitCard({
  outfit,
  onPress
}: {
  outfit: import("@models/Outfit").Outfit;
  onPress: () => void;
}) {
  const dateText = formatOutfitDate(outfit.createdAt || "");
  const tagText = outfit.occasion || outfit.aestheticStyleType || "Casual";

  return (
    <Pressable style={styles.outfitCard} onPress={onPress}>
      {outfit.photo ? (
        <Image source={{ uri: outfit.photo }} style={styles.outfitImage} />
      ) : (
        <View style={styles.outfitImagePlaceholder}>
          <MaterialIcons name="checkroom" size={32} color="#CCCCCC" />
        </View>
      )}
      <View style={styles.outfitDetails}>
        <Text style={styles.outfitDate}>{dateText}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{tagText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function AddOutfitScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addOutfit } = useOutfits();
  const { items } = useWardrobe();
  const [photoUri, setPhotoUri] = useState<string>("");
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    }),
    selectedItemIds: [] as number[],
    occasion: "",
    aestheticStyle: "",
    notes: ""
  });
  const [errors, setErrors] = useState<OutfitValidationErrors>({});
  const [showAestheticDropdown, setShowAestheticDropdown] = useState(false);

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

  const handleItemToggle = (itemId: number) => {
    const newSelectedIds = formData.selectedItemIds.includes(itemId)
      ? formData.selectedItemIds.filter(id => id !== itemId)
      : [...formData.selectedItemIds, itemId];
    setFormData({ ...formData, selectedItemIds: newSelectedIds });
    if (errors.items) {
      const newErrors = { ...errors };
      delete newErrors.items;
      setErrors(newErrors);
    }
  };

  const handleSave = () => {
    const allItemIds = items.map(item => item.id);
    const validation = validateOutfitForm(
      {
        itemIds: formData.selectedItemIds,
        occasion: formData.occasion,
        aestheticStyle: formData.aestheticStyle,
        notes: formData.notes
      },
      allItemIds
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      // Format date to match expected format (YYYY-MM-DD or keep as is)
      const dateString = formData.date;

      const newOutfit: Omit<import("@models/Outfit").Outfit, "outfitId"> = {
        userId: 1,
        items: formData.selectedItemIds,
        occasion: formData.occasion.trim(),
        aestheticStyleType: formData.aestheticStyle.trim(),
        photo: photoUri,
        notes: formData.notes.trim(),
        createdAt: dateString
      };

      addOutfit(newOutfit);
      Alert.alert("Success", "Outfit logged successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving outfit:", error);
      Alert.alert("Error", "Failed to save outfit. Please try again.");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof OutfitValidationErrors]) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof OutfitValidationErrors];
      setErrors(newErrors);
    }
  };

  return (
    <ScrollView style={styles.addScreenContainer} contentContainerStyle={styles.addScreenContent}>
      {/* Date Field */}
      <Text style={styles.fieldLabel}>Date</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={formData.date}
          onChangeText={value => updateField("date", value)}
          placeholder="MM/DD/YYYY"
        />
      </View>

      {/* Select Items Section */}
      <Text style={styles.fieldLabel}>
        Select Items ({formData.selectedItemIds.length} selected)
      </Text>
      {items.length === 0 ? (
        <View style={styles.emptyItemsContainer}>
          <MaterialIcons name="checkroom" size={48} color="#CCCCCC" />
          <Text style={styles.emptyItemsText}>No clothing items available</Text>
          <Text style={styles.emptyItemsSubtext}>
            Add items to your wardrobe first
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.itemsScrollView}
          contentContainerStyle={styles.itemsScrollContent}
        >
          {items.map(item => {
            const isSelected = formData.selectedItemIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.itemCard,
                  isSelected && styles.itemCardSelected
                ]}
                onPress={() => handleItemToggle(item.id)}
              >
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.itemCardImage} />
                ) : (
                  <View style={styles.itemCardImagePlaceholder}>
                    <MaterialIcons name="checkroom" size={32} color="#CCCCCC" />
                  </View>
                )}
                <View style={styles.itemCardContent}>
                  <Text style={styles.itemCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCardCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}

      {/* Occasion Field */}
      <Text style={styles.fieldLabel}>Occasion *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.occasion && styles.inputError]}
          placeholder="e.g., Work, Date, Party"
          value={formData.occasion}
          onChangeText={value => updateField("occasion", value)}
        />
        {errors.occasion && <Text style={styles.errorText}>{errors.occasion}</Text>}
      </View>

      {/* Aesthetic Style Field */}
      <Text style={styles.fieldLabel}>Aesthetic Style *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[
            styles.input,
            styles.dropdownInput,
            errors.aestheticStyle && styles.inputError
          ]}
          onPress={() => setShowAestheticDropdown(!showAestheticDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.aestheticStyle && styles.placeholderText]}>
            {formData.aestheticStyle || "Select style"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showAestheticDropdown && (
          <View style={styles.dropdown}>
            {AESTHETIC_STYLES.map(style => (
              <Pressable
                key={style}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("aestheticStyle", style);
                  setShowAestheticDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{style}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.aestheticStyle && <Text style={styles.errorText}>{errors.aestheticStyle}</Text>}
      </View>

      {/* Outfit Photo (Optional) */}
      <Text style={styles.fieldLabel}>Outfit Photo (Optional)</Text>
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

      {/* Notes Field */}
      <Text style={styles.fieldLabel}>Notes (Optional)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter notes"
          value={formData.notes}
          onChangeText={value => updateField("notes", value)}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Outfit</Text>
      </Pressable>
    </ScrollView>
  );
}

export function EditOutfitScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { outfitId } = route.params as { outfitId: string };
  const { outfits, updateOutfit } = useOutfits();
  const { items } = useWardrobe();
  
  const outfit = outfits.find(o => o.outfitId.toString() === outfitId);

  // If outfit not found, go back
  if (!outfit) {
    React.useEffect(() => {
      navigation.goBack();
    }, []);
    return null;
  }

  const [photoUri, setPhotoUri] = useState<string>(outfit.photo || "");
  const [formData, setFormData] = useState({
    date: outfit.createdAt || new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    }),
    selectedItemIds: outfit.items || [],
    occasion: outfit.occasion || "",
    aestheticStyle: outfit.aestheticStyleType || "",
    notes: outfit.notes || ""
  });
  const [errors, setErrors] = useState<OutfitValidationErrors>({});
  const [showAestheticDropdown, setShowAestheticDropdown] = useState(false);

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

  const handleItemToggle = (itemId: number) => {
    const newSelectedIds = formData.selectedItemIds.includes(itemId)
      ? formData.selectedItemIds.filter(id => id !== itemId)
      : [...formData.selectedItemIds, itemId];
    setFormData({ ...formData, selectedItemIds: newSelectedIds });
    if (errors.items) {
      const newErrors = { ...errors };
      delete newErrors.items;
      setErrors(newErrors);
    }
  };

  const handleSave = () => {
    const allItemIds = items.map(item => item.id);
    const validation = validateOutfitForm(
      {
        itemIds: formData.selectedItemIds,
        occasion: formData.occasion,
        aestheticStyle: formData.aestheticStyle,
        notes: formData.notes
      },
      allItemIds
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      const updatedOutfit = updateOutfit(
        outfit.outfitId,
        formData.occasion.trim(),
        formData.aestheticStyle.trim(),
        formData.notes.trim()
      );

      if (updatedOutfit) {
        console.log("Outfit updated successfully:", updatedOutfit);
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update outfit. Please try again.");
      }
    } catch (error) {
      console.error("Error updating outfit:", error);
      Alert.alert("Error", "Failed to update outfit. Please try again.");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof OutfitValidationErrors]) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof OutfitValidationErrors];
      setErrors(newErrors);
    }
  };

  return (
    <ScrollView style={styles.addScreenContainer} contentContainerStyle={styles.addScreenContent}>
      {/* Date Field (Display only) */}
      <Text style={styles.fieldLabel}>Date</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formData.date}
          editable={false}
        />
        <Text style={styles.helperText}>Date cannot be changed</Text>
      </View>

      {/* Select Items Section (Display only) */}
      <Text style={styles.fieldLabel}>
        Selected Items ({formData.selectedItemIds.length} items)
      </Text>
      <View style={styles.inputContainer}>
        <View style={styles.disabledSection}>
          <MaterialIcons name="info-outline" size={20} color="#666666" />
          <Text style={styles.disabledText}>Items cannot be changed after creation</Text>
        </View>
      </View>
      {formData.selectedItemIds.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.itemsScrollView}
          contentContainerStyle={styles.itemsScrollContent}
        >
          {items
            .filter(item => formData.selectedItemIds.includes(item.id))
            .map(item => (
              <View key={item.id} style={[styles.itemCard, styles.itemCardDisabled]}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.itemCardImage} />
                ) : (
                  <View style={styles.itemCardImagePlaceholder}>
                    <MaterialIcons name="checkroom" size={32} color="#CCCCCC" />
                  </View>
                )}
                <View style={styles.itemCardContent}>
                  <Text style={styles.itemCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCardCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
              </View>
            ))}
        </ScrollView>
      )}

      {/* Occasion Field */}
      <Text style={styles.fieldLabel}>Occasion *</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.occasion && styles.inputError]}
          placeholder="e.g., Work, Date, Party"
          value={formData.occasion}
          onChangeText={value => updateField("occasion", value)}
        />
        {errors.occasion && <Text style={styles.errorText}>{errors.occasion}</Text>}
      </View>

      {/* Aesthetic Style Field */}
      <Text style={styles.fieldLabel}>Aesthetic Style *</Text>
      <View style={styles.inputContainer}>
        <Pressable
          style={[
            styles.input,
            styles.dropdownInput,
            errors.aestheticStyle && styles.inputError
          ]}
          onPress={() => setShowAestheticDropdown(!showAestheticDropdown)}
        >
          <Text style={[styles.dropdownText, !formData.aestheticStyle && styles.placeholderText]}>
            {formData.aestheticStyle || "Select style"}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
        </Pressable>
        {showAestheticDropdown && (
          <View style={styles.dropdown}>
            {AESTHETIC_STYLES.map(style => (
              <Pressable
                key={style}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("aestheticStyle", style);
                  setShowAestheticDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{style}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.aestheticStyle && <Text style={styles.errorText}>{errors.aestheticStyle}</Text>}
      </View>

      {/* Outfit Photo (Display only) */}
      <Text style={styles.fieldLabel}>Outfit Photo</Text>
      {photoUri ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <Text style={styles.helperText}>Photo cannot be changed</Text>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <View style={styles.disabledSection}>
            <MaterialIcons name="photo" size={20} color="#666666" />
            <Text style={styles.disabledText}>No photo</Text>
          </View>
        </View>
      )}

      {/* Notes Field */}
      <Text style={styles.fieldLabel}>Notes (Optional)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter notes"
          value={formData.notes}
          onChangeText={value => updateField("notes", value)}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Update Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Update Outfit</Text>
      </Pressable>
    </ScrollView>
  );
}

export function OutfitDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { outfitId } = route.params as { outfitId: string };
  const { outfits, deleteOutfit } = useOutfits();
  const { items } = useWardrobe();

  const outfit = outfits.find(o => o.outfitId.toString() === outfitId);

  if (!outfit) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Outfit not found</Text>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate("EditOutfitScreen", { outfitId: outfitId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Outfit?",
      "This will permanently remove it from your outfit history.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteOutfit(outfit.outfitId);
            Alert.alert("Success", "Outfit deleted successfully!");
            navigation.goBack();
          }
        }
      ]
    );
  };

  const dateText = formatOutfitDate(outfit.createdAt || "");
  const tagText = outfit.occasion || outfit.aestheticStyleType || "Casual";

  // Get the actual clothing items
  const outfitItems = items.filter(item => outfit.items.includes(item.id));

  return (
    <ScrollView style={styles.outfitDetailsContainer} contentContainerStyle={styles.outfitDetailsContent}>
      {/* Photo */}
      {outfit.photo ? (
        <Image source={{ uri: outfit.photo }} style={styles.outfitDetailsImage} resizeMode="cover" />
      ) : (
        <View style={styles.outfitDetailsImagePlaceholder}>
          <MaterialIcons name="event" size={64} color="#CCCCCC" />
        </View>
      )}

      {/* Date */}
      <Text style={styles.outfitDetailsDate}>{dateText}</Text>

      {/* Tag */}
      <View style={styles.outfitDetailsTagContainer}>
        <Text style={styles.outfitDetailsTagText}>{tagText}</Text>
      </View>

      {/* Occasion */}
      {outfit.occasion && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Occasion</Text>
          <Text style={styles.detailsValue}>{outfit.occasion}</Text>
        </View>
      )}

      {/* Aesthetic Style */}
      {outfit.aestheticStyleType && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Aesthetic Style</Text>
          <Text style={styles.detailsValue}>{outfit.aestheticStyleType}</Text>
        </View>
      )}

      {/* Notes */}
      {outfit.notes && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>Notes</Text>
          <Text style={styles.detailsValue}>{outfit.notes}</Text>
        </View>
      )}

      {/* Clothing Items */}
      {outfitItems.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsSectionTitle}>
            Clothing Items ({outfitItems.length})
          </Text>
          <View style={styles.itemsGrid}>
            {outfitItems.map(item => (
              <View key={item.id} style={styles.itemMiniCard}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.itemMiniImage} />
                ) : (
                  <View style={styles.itemMiniImagePlaceholder}>
                    <MaterialIcons name="checkroom" size={24} color="#CCCCCC" />
                  </View>
                )}
                <Text style={styles.itemMiniName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemMiniCategory} numberOfLines={1}>{item.category}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <Pressable style={styles.editButton} onPress={handleEdit}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.editButtonText}>Edit Outfit</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <MaterialIcons name="delete" size={20} color="#E91E63" />
        <Text style={styles.deleteButtonText}>Delete Outfit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8
  },
  // Outfits Screen Styles
  outfitsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16
  },
  header: {
    marginTop: 24,
    marginBottom: 16
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4
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
  listContent: {
    paddingBottom: 80 // Space for FAB
  },
  emptyContainer: {
    flex: 1
  },
  outfitCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  outfitImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F5F5F5"
  },
  outfitImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  outfitDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center"
  },
  outfitDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8
  },
  tagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF"
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
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8
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
  // Add Outfit Screen Styles
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
  errorText: {
    fontSize: 12,
    color: "#E91E63",
    marginTop: 4
  },
  // Items Selection Styles
  itemsScrollView: {
    marginBottom: 8
  },
  itemsScrollContent: {
    paddingVertical: 8
  },
  itemCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    position: "relative"
  },
  itemCardSelected: {
    borderColor: "#E91E63"
  },
  itemCardImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F5F5"
  },
  itemCardImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  itemCardContent: {
    padding: 8
  },
  itemCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4
  },
  itemCardCategory: {
    fontSize: 12,
    color: "#666666"
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center"
  },
  emptyItemsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 8
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    marginTop: 12
  },
  emptyItemsSubtext: {
    fontSize: 14,
    color: "#999999",
    marginTop: 4
  },
  // Photo Styles
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
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
  // Outfit Details Screen Styles
  outfitDetailsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  outfitDetailsContent: {
    paddingBottom: 32
  },
  outfitDetailsImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#F5F5F5"
  },
  outfitDetailsImagePlaceholder: {
    width: "100%",
    height: 400,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  outfitDetailsDate: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginTop: 24,
    marginHorizontal: 20
  },
  outfitDetailsTagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16
  },
  outfitDetailsTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF"
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
  itemsSection: {
    marginTop: 16,
    marginHorizontal: 20
  },
  itemsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  itemMiniCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden"
  },
  itemMiniImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F5F5"
  },
  itemMiniImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  itemMiniName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    padding: 8,
    paddingBottom: 4
  },
  itemMiniCategory: {
    fontSize: 12,
    color: "#666666",
    paddingHorizontal: 8,
    paddingBottom: 8
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
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#999999"
  },
  disabledSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    gap: 8
  },
  disabledText: {
    fontSize: 14,
    color: "#666666"
  },
  helperText: {
    fontSize: 12,
    color: "#999999",
    marginTop: 4
  },
  itemCardDisabled: {
    opacity: 0.7
  }
});


