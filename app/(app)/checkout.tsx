import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";

import { AppButton } from "../../components/AppButton";
import { formatPrice } from "../../lib/format";
import { createPaymentSheet } from "../../lib/stripe";
import { stripePublishableKey } from "../../lib/config";
import { withPaymentTimeout } from "../../lib/paymentTimeout";
import { useAuthStore } from "../../store/auth";
import { useCartStore } from "../../store/cart";

export default function CheckoutScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const addPuppy = useCartStore((state) => state.addPuppy);
  const removePuppy = useCartStore((state) => state.removePuppy);
  const totalCents = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity * item.puppy.priceCents, 0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState("Preparing payment...");

  const handleCheckout = async () => {
    if (isSubmitting) return;
    if (!stripePublishableKey) {
      setMessage("Stripe checkout is not configured. Add the Stripe publishable key and restart Expo.");
      return;
    }
    if (totalCents <= 0) {
      setMessage("Add a puppy to the cart before checking out.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setProgress("Preparing payment...");

    try {
      const paymentSheet = await createPaymentSheet(totalCents, user?.email);
      setProgress("Loading payment form...");
      const { error: initError } = await withPaymentTimeout(initPaymentSheet({
        merchantDisplayName: "Puppy Store",
        paymentIntentClientSecret: paymentSheet.paymentIntentClientSecret,
      }), "Loading the Stripe payment form timed out. Restart the app and try again.");

      if (initError) {
        throw new Error(initError.message);
      }

      setProgress("Complete payment in Stripe...");
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      clearCart();
      setMessage("Payment completed. Your order is ready for fulfillment.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Your order</Text>
        {items.length === 0 ? <Text style={styles.empty}>Your cart is empty.</Text> : null}

        {items.map((item) => (
          <View key={item.puppy.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.itemName}>{item.puppy.name}</Text>
              <Text style={styles.itemMeta}>{item.quantity} x {formatPrice(item.puppy.priceCents)}</Text>
              <View style={styles.quantityControls}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${item.puppy.name} quantity`} disabled={isSubmitting} onPress={() => { removePuppy(item.puppy.id); setMessage(null); }} style={styles.quantityButton}>
                  <Text style={styles.quantityText}>−</Text>
                </Pressable>
                <Text style={styles.itemMeta}>{item.quantity}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${item.puppy.name} quantity`} disabled={isSubmitting} onPress={() => { addPuppy(item.puppy); setMessage(null); }} style={styles.quantityButton}>
                  <Text style={styles.quantityText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(item.quantity * item.puppy.priceCents)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
        </View>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <AppButton title={isSubmitting ? progress : "Pay with Stripe"} onPress={() => void handleCheckout()} disabled={isSubmitting || items.length === 0} />
      {isSubmitting ? <ActivityIndicator color="#efb82d" /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quantityControls: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 },
  quantityButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#243041", alignItems: "center", justifyContent: "center" },
  quantityText: { color: "#f8fafc", fontSize: 22 },
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 14,
  },
  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
  },
  empty: {
    color: "#94a3b8",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  itemName: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  itemMeta: {
    color: "#94a3b8",
    marginTop: 4,
  },
  itemTotal: {
    color: "#efb82d",
    fontWeight: "800",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalLabel: {
    color: "#cbd5e1",
    fontSize: 16,
  },
  totalValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  message: {
    color: "#cbd5e1",
    lineHeight: 22,
  },
});
