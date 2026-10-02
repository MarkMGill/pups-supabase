import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
};

export function AppButton({ title, onPress, variant = "primary", disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.text, variant === "ghost" ? styles.ghostText : null]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#efb82d",
  },
  secondary: {
    backgroundColor: "#1f2937",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  ghostText: {
    color: "#e2e8f0",
  },
});