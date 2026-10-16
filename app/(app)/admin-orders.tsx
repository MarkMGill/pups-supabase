import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { loadAdminOrders, type AdminOrder } from "../../lib/adminOrders";
import { formatOrderAmount, orderStatusLabel } from "../../lib/orderHistory";
import { useAuthStore } from "../../store/auth";

/** Admin overview: buyer details and grouped purchases, with no payment actions yet. */
export default function AdminOrdersScreen() {
  // An account change reloads the list and verifies admin membership again.
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incrementing revision reruns the loading effect for pull-to-refresh and Try again.
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  // Unlike an effect that runs only on mount, useFocusEffect also runs when the
  // buyer returns to this screen. useCallback keeps it stable between renders.
  useFocusEffect(useCallback(() => {
    let active = true;
    // Clear old results before loading, including results from a previous account.
    setOrders([]);
    setLoading(true);
    setError(null);
    void loadAdminOrders().then((data) => { if (active) setOrders(data); })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Unable to load orders."); })
      .finally(() => { if (active) setLoading(false); });
    // Ignore late responses after leaving the screen, switching accounts, or starting
    // another refresh. This prevents stale requests from replacing newer results.
    return () => { active = false; };
  }, [user?.id, revision]));

  // FlatList renders one card per grouped checkout. Loading, error, and empty
  // states are separate so a failed query is not presented as "No orders yet."
  // Pending rows also include abandoned checkouts; this screen does not retry payment.
  return (
    <FlatList style={styles.screen} contentContainerStyle={styles.content}
      data={orders} keyExtractor={(order) => order.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#efb82d" />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.title}>Admin orders</Text>
        <Text style={styles.text}>All buyers' purchases and payment statuses. Pull down to refresh.</Text>
        {error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><AppButton title="Try again" onPress={refresh} disabled={loading} /></> : null}
      </View>}
      ListEmptyComponent={loading ? <ActivityIndicator color="#efb82d" /> : !error ? <Text style={styles.text}>No orders yet. Orders appear when a buyer starts checkout.</Text> : null}
      renderItem={({ item: order }) => <View style={styles.card}>
        <Text style={styles.date}>{order.buyerName}</Text>
        {order.buyerEmail ? <Text selectable style={styles.text}>{order.buyerEmail}</Text> : null}
        <Text selectable style={styles.note}>Order: {order.id}</Text>
        {order.paymentIntentId ? <Text selectable style={styles.note}>Payment: {order.paymentIntentId}</Text> : null}
        <View style={styles.row}>
          <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</Text>
          <Text style={[styles.status, order.status === "paid" && styles.paid]}>{orderStatusLabel(order.status)}</Text>
        </View>
        {order.items.map((item) => <View key={item.id} style={styles.row}>
          <Text style={styles.item}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</Text>
          <Text style={styles.text}>{formatOrderAmount(item.amountCents, order.currency)}</Text>
        </View>)}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.date}>Total</Text>
          <Text style={styles.total}>{formatOrderAmount(order.amountCents, order.currency)}</Text>
        </View>
        {order.status === "pending" ? <Text style={styles.note}>Payment is not confirmed. Unfinished checkouts also appear as pending.</Text> : null}
      </View>} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 16, paddingBottom: 40, gap: 16, flexGrow: 1 },
  header: { gap: 12, marginBottom: 16 },
  title: { color: "#f8fafc", fontSize: 28, fontWeight: "800" },
  text: { color: "#cbd5e1", fontSize: 15, lineHeight: 22 },
  error: { color: "#fca5a5", lineHeight: 22 },
  card: { backgroundColor: "#0f172a", padding: 18, gap: 14, borderWidth: 1, borderColor: "#1f2937", borderRadius: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  date: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
  status: { color: "#efb82d", fontSize: 13, fontWeight: "700" },
  paid: { color: "#86efac" },
  item: { color: "#f8fafc", fontSize: 16, flexShrink: 1 },
  totalRow: { borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 12 },
  total: { color: "#efb82d", fontSize: 20, fontWeight: "800" },
  note: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
});
