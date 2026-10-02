import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b1220" },
        headerTintColor: "#f8fafc",
        contentStyle: { backgroundColor: "#07111f" },
      }}
    >
      <Stack.Screen name="home" options={{ title: "Puppies" }} />
      <Stack.Screen name="puppies/[id]" options={{ title: "Puppy details" }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
    </Stack>
  );
}