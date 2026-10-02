import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { PuppyCard } from "../../components/PuppyCard";
import { useAuthStore } from "../../store/auth";
import { useCartStore } from "../../store/cart";
import { usePuppyStore } from "../../store/puppies";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const puppies = usePuppyStore((state) => state.puppies);
  const isLoading = usePuppyStore((state) => state.isLoading);
  const error = usePuppyStore((state) => state.error);
  const loadPuppies = usePuppyStore((state) => state.loadPuppies);
  const addPuppy = useCartStore((state) => state.addPuppy);
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  useEffect(() => {
    void loadPuppies();
  }, [loadPuppies]);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.kicker}>Welcome{user ? `, ${user.name}` : ""}</Text>
          <Text style={styles.title}>Find your next best friend.</Text>
          <Text style={styles.subtitle}>Browse puppies, open details, and keep the checkout flow ready for Stripe payment sheet integration.</Text>
        </View>

        <View style={styles.actions}>
          <AppButton title={`Checkout (${itemCount})`} onPress={() => router.push("/(app)/checkout")} />
          <AppButton title="Sign out" onPress={() => void signOut()} variant="ghost" />
        </View>
      </View>

      {isLoading ? <ActivityIndicator color="#efb82d" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={puppies}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadPuppies()} tintColor="#efb82d" />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PuppyCard
            puppy={item}
            onPress={() => router.push({ pathname: "/(app)/puppies/[id]", params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
    paddingHorizontal: 16,
  },
  hero: {
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  heroText: {
    gap: 8,
  },
  kicker: {
    color: "#efb82d",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 23,
  },
  actions: {
    gap: 10,
  },
  list: {
    paddingBottom: 36,
  },
  error: {
    color: "#fca5a5",
    marginBottom: 12,
  },
});