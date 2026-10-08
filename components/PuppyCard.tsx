import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { formatAge, formatPrice } from "../lib/format";
import type { Puppy } from "../types";

type Props = {
  puppy: Puppy;
  onPress: () => void;
};

export function PuppyCard({ puppy, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: puppy.imageUrl }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{puppy.name}</Text>
          <Text style={styles.price}>{formatPrice(puppy.priceCents)}</Text>
        </View>
        <Text style={styles.breed}>{puppy.breed}</Text>
        <Text style={styles.health}>Health: {puppy.health}</Text>
        <Text style={styles.meta}>{formatAge(puppy.ageMonths)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#243041",
    marginBottom: 16,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  image: {
    width: "100%",
    height: 220,
    backgroundColor: "#0f172a",
  },
  body: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  name: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  price: {
    color: "#efb82d",
    fontSize: 16,
    fontWeight: "800",
  },
  breed: {
    color: "#cbd5e1",
    fontSize: 15,
  },
  health: {
    color: "#94a3b8",
    fontSize: 13,
  },
  meta: {
    color: "#94a3b8",
    fontSize: 13,
  },
});