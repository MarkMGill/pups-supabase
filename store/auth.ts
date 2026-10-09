import { create } from "zustand";

import { supabase } from "../lib/supabase";
import type { AppUser } from "../types";

type AuthState = {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

function buildLocalUser(email: string, name?: string): AppUser {
  const prefix = email.split("@")[0] || "puppy-lover";

  return {
    id: `${prefix}-${Date.now()}`,
    email,
    name: name?.trim() || prefix,
  };
}

function mapSupabaseUser(id: string, email: string, fallbackName?: string): AppUser {
  return { id, email, name: fallbackName?.trim() || email.split("@")[0] };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  signIn: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          set({ user: mapSupabaseUser(data.user.id, data.user.email ?? email, data.user.user_metadata?.name), isLoading: false });
          return;
        }
      }

      set({ user: buildLocalUser(email), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to sign in.", isLoading: false });
    }
  },
  register: async (email, password, name) => {
    set({ isLoading: true, error: null });

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.session) {
          set({ error: "Check your email to confirm your account, then sign in.", isLoading: false });
          return;
        }
        if (data.user) {
          set({ user: mapSupabaseUser(data.user.id, data.user.email ?? email, name), isLoading: false });
          return;
        }
      }

      set({ user: buildLocalUser(email, name), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to create your account.", isLoading: false });
    }
  },
  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw new Error(error.message);
        }
      }

      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to sign out.", isLoading: false });
    }
  },
}));
