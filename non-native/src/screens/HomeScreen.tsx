import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootTabParamList } from "@navigation/types";
import { MaterialIcons } from "@expo/vector-icons";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Home">,
  NativeStackNavigationProp<any>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleAddItem = () => {
    navigation.navigate("AddClothingItemScreen" as never);
  };

  const handleLogOutfit = () => {
    navigation.navigate("AddOutfitScreen" as never);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="checkroom" size={32} color="#E91E63" />
          </View>
          <Text style={styles.title}>FitLog</Text>
        </View>
        <Text style={styles.subtitle}>Your personal fashion wardrobe tracker</Text>
      </View>

      {/* Add Clothing Item Card */}
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={handleAddItem}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIconContainer}>
            <MaterialIcons name="checkroom" size={24} color="#E91E63" />
          </View>
          <Text style={styles.cardText}>+ Add Clothing Item</Text>
        </View>
      </Pressable>

      {/* Log Outfit Card */}
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={handleLogOutfit}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIconContainer}>
            <MaterialIcons name="event" size={24} color="#E91E63" />
          </View>
          <Text style={styles.cardText}>+ Log Outfit</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8"
  },
  contentContainer: {
    padding: 20
  },
  header: {
    marginTop: 40,
    marginBottom: 32
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  iconContainer: {
    marginRight: 12
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000"
  },
  subtitle: {
    fontSize: 16,
    color: "#999999",
    marginTop: 4
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 80,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardPressed: {
    opacity: 0.8,
    backgroundColor: "#FAFAFA"
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE0E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16
  },
  cardText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000"
  }
});


