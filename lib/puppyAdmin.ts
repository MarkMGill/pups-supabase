import type { ImagePickerAsset } from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

export type PuppyDraft = {
  name: string;
  breed: string;
  age: string;
  price: string;
  description: string;
  health: "good" | "bad";
};

export function validatePuppyDraft(draft: PuppyDraft) {
  if (!draft.name.trim() || !draft.breed.trim() || !draft.description.trim()) {
    throw new Error("Enter a name, breed, and description.");
  }
  if (!/^\d+$/.test(draft.age.trim()) || !Number.isSafeInteger(Number(draft.age)) || Number(draft.age) > 2147483647) {
    throw new Error("Age must be a whole number of months, zero or greater.");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(draft.price.trim())) {
    throw new Error("Enter a price in dollars, with up to two decimal places.");
  }
  const cents = Math.round(Number(draft.price) * 100);
  if (!Number.isSafeInteger(cents) || cents > 2147483647) {
    throw new Error("The price is too large.");
  }
  if (draft.health !== "good" && draft.health !== "bad") throw new Error("Select a health status.");
  return {
    name: draft.name.trim(), breed: draft.breed.trim(), description: draft.description.trim(),
    age_months: Number(draft.age), price_cents: cents, health: draft.health,
  };
}

export async function isPuppyAdmin() {
  if (!supabase) return false;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return false;
  const { data, error } = await supabase.from("puppy_admins")
    .select("user_id").eq("user_id", sessionData.session.user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function addPuppy(draft: PuppyDraft, photo: ImagePickerAsset) {
  const values = validatePuppyDraft(draft);
  if (!supabase) throw new Error("Connect Supabase before adding puppies.");
  if (!await isPuppyAdmin()) throw new Error("Only an admin can add puppies.");
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Please sign in again.");
  const contentType = photo.mimeType ?? ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[photo.uri.split(".").pop()?.toLowerCase() ?? ""];
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[contentType ?? ""];
  if (!extension) throw new Error("Choose a JPEG, PNG, or WebP photo.");
  if (photo.fileSize && photo.fileSize > 5242880) throw new Error("Choose a photo smaller than 5 MB.");
  // The picker supplies base64 on native devices, avoiding React Native Blob uploads.
  const bytes = photo.base64
    ? decode(photo.base64)
    : await (await fetch(photo.uri)).arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 5242880) throw new Error("Choose a photo smaller than 5 MB.");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("puppy-photos")
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
  const { data: image } = supabase.storage.from("puppy-photos").getPublicUrl(path);
  const { error } = await supabase.from("puppies").insert({ ...values, image_url: image.publicUrl });
  if (error) {
    // Only clean up after a definite rejected insert, not an uncertain network result.
    if (error.code && !error.code.startsWith("PGRST")) {
      await supabase.storage.from("puppy-photos").remove([path]).catch(() => undefined);
    }
    throw new Error(`Unable to save puppy: ${error.message}`);
  }
}
