import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { RootNavigation } from "@navigation/RootNavigation";

export default function App() {
  return (
    <View style={styles.container}>
      <RootNavigation />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});


