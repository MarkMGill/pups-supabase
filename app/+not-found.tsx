import { Stack, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This page wandered off.</Text>
        <Text style={styles.subtitle}>Go back to the puppy catalog and keep browsing.</Text>
        <AppButton title="Back to home" onPress={() => router.replace("/(app)/home")} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111f",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});