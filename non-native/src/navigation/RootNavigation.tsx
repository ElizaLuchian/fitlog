import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type {
  RootTabParamList,
  WardrobeStackParamList,
  OutfitsStackParamList
} from "./types";
import { HomeScreen } from "@screens/HomeScreen";
import {
  WardrobeScreen,
  AddClothingItemScreen,
  EditClothingItemScreen,
  ItemDetailsScreen
} from "@screens/WardrobeScreens";
import {
  OutfitsScreen,
  AddOutfitScreen,
  EditOutfitScreen,
  OutfitDetailsScreen
} from "@screens/OutfitsScreens";

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator<WardrobeStackParamList>();
const OutfitsStack = createNativeStackNavigator<OutfitsStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#FFFFFF"
        },
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "600"
        }
      }}
    >
      <HomeStack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="AddClothingItemScreen"
        component={AddClothingItemScreen}
        options={({ navigation }) => ({
          title: "Add Clothing Item",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("HomeScreen");
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
      <HomeStack.Screen
        name="AddOutfitScreen"
        component={AddOutfitScreen}
        options={({ navigation }) => ({
          title: "Log Outfit",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("HomeScreen");
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
    </HomeStack.Navigator>
  );
}

function WardrobeStackNavigator() {
  return (
    <WardrobeStack.Navigator
      initialRouteName="WardrobeScreen"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#FFFFFF"
        },
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "600"
        }
      }}
    >
      <WardrobeStack.Screen 
        name="WardrobeScreen" 
        component={WardrobeScreen}
        options={{ headerShown: false }}
      />
      <WardrobeStack.Screen
        name="AddClothingItemScreen"
        component={AddClothingItemScreen}
        options={({ navigation }) => ({
          title: "Add Clothing Item",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // Always navigate to WardrobeScreen to ensure proper navigation flow
                navigation.navigate("WardrobeScreen");
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
      <WardrobeStack.Screen
        name="EditClothingItemScreen"
        component={EditClothingItemScreen}
        options={({ navigation }) => ({
          title: "Edit Clothing Item",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // Go back to previous screen (usually ItemDetailsScreen)
                navigation.goBack();
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
      <WardrobeStack.Screen
        name="ItemDetailsScreen"
        component={ItemDetailsScreen}
        options={{ title: "Item Details" }}
      />
    </WardrobeStack.Navigator>
  );
}

function OutfitsStackNavigator() {
  return (
    <OutfitsStack.Navigator
      initialRouteName="OutfitsScreen"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#FFFFFF"
        },
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "600"
        }
      }}
    >
      <OutfitsStack.Screen 
        name="OutfitsScreen" 
        component={OutfitsScreen}
        options={{ headerShown: false }}
      />
      <OutfitsStack.Screen
        name="AddOutfitScreen"
        component={AddOutfitScreen}
        options={({ navigation }) => ({
          title: "Log Outfit",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // Always navigate to OutfitsScreen to ensure proper navigation flow
                navigation.navigate("OutfitsScreen");
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
      <OutfitsStack.Screen
        name="EditOutfitScreen"
        component={EditOutfitScreen}
        options={({ navigation }) => ({
          title: "Edit Outfit",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // Go back to previous screen (usually OutfitDetailsScreen)
                navigation.goBack();
              }}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          )
        })}
      />
      <OutfitsStack.Screen
        name="OutfitDetailsScreen"
        component={OutfitDetailsScreen}
        options={{ title: "Outfit Details" }}
      />
    </OutfitsStack.Navigator>
  );
}

export function RootNavigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8
          },
          tabBarActiveTintColor: "#E91E63", // red_primary for active tab
          tabBarInactiveTintColor: "#666666", // gray_dark for inactive tab
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500"
          }
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStackNavigator}
          options={({ route }) => ({
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
            tabBarStyle: ((route: RouteProp<RootTabParamList, 'Home'>) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeScreen';
              // Hide tab bar when on add screens
              if (routeName === 'AddClothingItemScreen' || routeName === 'AddOutfitScreen') {
                return { display: 'none' };
              }
              return {
                backgroundColor: "#FFFFFF",
                borderTopWidth: 0,
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: -2
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                height: 60,
                paddingBottom: 8,
                paddingTop: 8
              };
            })(route)
          })}
        />
        <Tab.Screen 
          name="Wardrobe" 
          component={WardrobeStackNavigator}
          options={{
            title: 'Wardrobe',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="checkroom" size={size} color={color} />
            )
          }}
        />
        <Tab.Screen 
          name="Outfits" 
          component={OutfitsStackNavigator}
          options={{
            title: 'Outfits',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="event" size={size} color={color} />
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}


