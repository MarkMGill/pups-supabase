import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/AppButton";
import { formatAge, formatPrice } from "../../../lib/format";
import { useCartStore } from "../../../store/cart";
import { usePuppyStore } from "../../../store/puppies";

export default function PuppyDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const puppy = usePuppyStore((state) => state.getPuppyById)(String(params.id ?? ""));
  const addPuppy = useCartStore((state) => state.addPuppy);

  const fallbackPuppy = useMemo(
    () => puppy ?? null,
    [puppy],
  );

  if (!fallbackPuppy) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Puppy not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={{ uri: fallbackPuppy.imageUrl }} style={styles.image} />
      <View style={styles.card}>
        <Text style={styles.name}>{fallbackPuppy.name}</Text>
        <Text style={styles.breed}>{fallbackPuppy.breed}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatAge(fallbackPuppy.ageMonths)}</Text>
          <Text style={styles.price}>{formatPrice(fallbackPuppy.priceCents)}</Text>
        </View>
        <Text style={styles.health}>Health: {fallbackPuppy.health}</Text>
        <Text style={styles.description}>{fallbackPuppy.description}</Text>
        <AppButton title="Add to cart" onPress={() => addPuppy(fallbackPuppy)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  image: {
    width: "100%",
    height: 320,
    borderRadius: 28,
    backgroundColor: "#0f172a",
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 12,
  },
  name: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
  },
  breed: {
    color: "#cbd5e1",
    fontSize: 17,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: "#94a3b8",
    fontSize: 15,
  },
  price: {
    color: "#efb82d",
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 24,
  },
  health: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111f",
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
  },
});