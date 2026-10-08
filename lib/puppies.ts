import { supabase } from "./supabase";
import type { Puppy } from "../types";

export const seedPuppies: Puppy[] = [
  {
    id: "goldie",
    name: "Goldie",
    breed: "Golden Retriever",
    ageMonths: 4,
    priceCents: 180000,
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80",
    description: "A calm, affectionate puppy who loves fetch, soft blankets, and family time.",
    health: "good",
  },
  {
    id: "milo",
    name: "Milo",
    breed: "French Bulldog",
    ageMonths: 5,
    priceCents: 220000,
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=80",
    description: "Playful, compact, and perfect for apartment life with a big personality.",
    health: "good",
  },
  {
    id: "poppy",
    name: "Poppy",
    breed: "Corgi",
    ageMonths: 3,
    priceCents: 195000,
    imageUrl: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80",
    description: "A bright little herder with a big grin and nonstop curiosity.",
    health: "good",
  },
];

function mapPuppy(row: Record<string, unknown>): Puppy {
  const priceCents = Number(row.price_cents ?? row.price ?? 0);
  const ageMonths = Number(row.age_months ?? row.ageMonths ?? 0);

  return {
    id: String(row.id),
    name: String(row.name ?? "Unknown Puppy"),
    breed: String(row.breed ?? "Mixed Breed"),
    ageMonths,
    priceCents,
    imageUrl: String(row.image_url ?? row.imageUrl ?? ""),
    description: String(row.description ?? ""),
    health: String(row.health ?? "good"),
  };
}

export async function loadPuppies(): Promise<Puppy[]> {
  if (supabase) {
    const { data, error } = await supabase.from("puppies").select("*").order("created_at", {
      ascending: false,
    });

    if (!error && data && data.length > 0) {
      return data.map((row) => mapPuppy(row as Record<string, unknown>));
    }
  }

  return seedPuppies;
}