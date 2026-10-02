import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StripeProvider } from "@stripe/stripe-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { stripePublishableKey } from "../lib/config";

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b1220" },
        headerTintColor: "#f8fafc",
        contentStyle: { backgroundColor: "#07111f" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const content = <AppStack />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {stripePublishableKey ? <StripeProvider publishableKey={stripePublishableKey}>{content}</StripeProvider> : content}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}