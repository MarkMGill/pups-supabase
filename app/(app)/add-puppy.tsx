import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppButton } from "../../components/AppButton";
import { addPuppy, isPuppyAdmin, validatePuppyDraft, type PuppyDraft } from "../../lib/puppyAdmin";
import { useAuthStore } from "../../store/auth";
import { usePuppyStore } from "../../store/puppies";

const emptyDraft: PuppyDraft = { name: "", breed: "", age: "", price: "", description: "", health: "good" };

export default function AddPuppyScreen() {
  const user = useAuthStore((state) => state.user);
  const loadPuppies = usePuppyStore((state) => state.loadPuppies);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [draft, setDraft] = useState<PuppyDraft>(emptyDraft);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setChecking(true);
    setAllowed(false);
    void isPuppyAdmin().then((value) => { if (active) setAllowed(value); })
      .catch(() => { if (active) setMessage("Unable to check admin access. Confirm the admin migration has been applied and try again."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [user?.id]);

  async function choosePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, base64: true });
      if (!result.canceled) {
        setPhoto(result.assets[0]);
        setMessage(null);
      }
    } catch {
      setMessage("Unable to open your photos. Check photo access and try again.");
    }
  }

  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setMessage(null);
    try {
      validatePuppyDraft(draft);
      if (!photo) throw new Error("Choose a puppy photo.");
      await addPuppy(draft, photo);
      setDraft(emptyDraft);
      setPhoto(null);
      setMessage("Puppy added successfully. It is now in the catalog.");
      void loadPuppies();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save puppy.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (checking || !allowed) {
    return <View style={styles.content}><Text style={styles.label}>{checking ? "Checking admin access..." : message ?? "Sign in with an authorized admin account to add puppies."}</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add a puppy</Text>
      {([
        ["name", "Name"], ["breed", "Breed"], ["age", "Age (months)"],
        ["price", "Price (USD)"], ["description", "Description"],
      ] as const).map(([field, label]) => (
        <View key={field} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput accessibilityLabel={label} value={draft[field]} editable={!saving}
            onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))}
            keyboardType={field === "age" ? "number-pad" : field === "price" ? "decimal-pad" : "default"}
            multiline={field === "description"} style={styles.input} />
        </View>
      ))}
      <Text style={styles.label}>Health</Text>
      <View style={styles.health}>
        {(["good", "bad"] as const).map((health) => (
          <AppButton key={health} title={`${draft.health === health ? "Selected: " : ""}${health === "good" ? "Good" : "Bad"}`}
            variant={draft.health === health ? "primary" : "ghost"} disabled={saving}
            onPress={() => setDraft((current) => ({ ...current, health }))} />
        ))}
      </View>
      <Text style={styles.label}>Photo (JPEG, PNG, or WebP, up to 5 MB)</Text>
      {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="Selected puppy photo" /> : null}
      <AppButton title={photo ? "Change photo" : "Choose photo"} onPress={() => void choosePhoto()} disabled={saving} variant="ghost" />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.label}>{message}</Text> : null}
      <AppButton title={saving ? "Saving puppy..." : "Save puppy"} onPress={() => void save()} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, backgroundColor: "#07111f", flexGrow: 1 },
  title: { color: "#f8fafc", fontSize: 28, fontWeight: "800" },
  label: { color: "#cbd5e1", fontSize: 15, lineHeight: 22 },
  field: { gap: 6 },
  input: { color: "#f8fafc", backgroundColor: "#111827", borderColor: "#334155", borderWidth: 1, borderRadius: 12, padding: 14 },
  health: { flexDirection: "row", gap: 12 },
  photo: { width: "100%", height: 240, borderRadius: 16, resizeMode: "cover" },
});
