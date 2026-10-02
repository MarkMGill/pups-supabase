import { create } from "zustand";

import { loadPuppies } from "../lib/puppies";
import type { Puppy } from "../types";

type PuppyState = {
  puppies: Puppy[];
  isLoading: boolean;
  error: string | null;
  loadPuppies: () => Promise<void>;
  getPuppyById: (id: string) => Puppy | undefined;
};

export const usePuppyStore = create<PuppyState>((set, get) => ({
  puppies: [],
  isLoading: false,
  error: null,
  loadPuppies: async () => {
    set({ isLoading: true, error: null });

    try {
      const puppies = await loadPuppies();
      set({ puppies, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load puppies.", isLoading: false });
    }
  },
  getPuppyById: (id) => get().puppies.find((puppy) => puppy.id === id),
}));