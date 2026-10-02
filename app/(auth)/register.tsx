import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { useAuthStore } from "../../store/auth";

export default function RegisterScreen() {
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Join the pack</Text>
        <Text style={styles.title}>Create your account.</Text>
        <Text style={styles.subtitle}>This uses Supabase auth when available and falls back to local demo mode during early setup.</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Name"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            title={isLoading ? "Creating account..." : "Create account"}
            onPress={() => void register(email.trim(), password, name.trim())}
            disabled={isLoading}
          />
        </View>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Sign in.</Text>
        </Pressable>

        <Link href="/(app)/home" asChild>
          <Pressable>
            <Text style={styles.demo}>Skip into the catalog for demo mode.</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#07111f",
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 16,
  },
  kicker: {
    color: "#efb82d",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: "#f8fafc",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    gap: 12,
  },
  input: {
    borderRadius: 16,
    backgroundColor: "#111827",
    color: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#243041",
  },
  error: {
    color: "#fca5a5",
    fontSize: 14,
  },
  link: {
    color: "#93c5fd",
    fontWeight: "600",
  },
  demo: {
    color: "#94a3b8",
    fontSize: 13,
  },
});