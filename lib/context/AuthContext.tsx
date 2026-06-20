"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/lib/supabase";
import { Author } from "@/lib/types";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  country: string;
  bio: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateProfile: (data: { name: string; bio: string }) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isLoginModalOpen: false,
  openLoginModal:   () => {},
  closeLoginModal:  () => {},
  signInWithGoogle: async () => {},
  signOut:          async () => {},
  updateAvatar:     async () => {},
  updateProfile:    async () => {},
});

// Deterministic public URL for a user's avatar in Supabase Storage.
// Returns the URL regardless of whether a file exists yet —
// UserAvatar handles the 404 case by showing a default icon.
function getAvatarUrl(userId: string): string {
  const { data } = supabase.storage.from("avatars").getPublicUrl(userId);
  return data.publicUrl;
}

// Build an AuthUser by combining Supabase Auth data with the profiles table.
// Falls back to OAuth metadata when no profiles row exists yet.
async function buildAuthUser(supabaseUser: User): Promise<AuthUser> {
  const meta = supabaseUser.user_metadata as Record<string, string>;
  const email = supabaseUser.email ?? "";
  const username =
    email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 20) ||
    "modeler";
  const base: AuthUser = {
    id:        supabaseUser.id,
    username,
    name:      meta.full_name ?? meta.name ?? "Modeler",
    email,
    avatarUrl: getAvatarUrl(supabaseUser.id),
    country:   "",
    bio:       "",
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", supabaseUser.id)
    .single();

  if (!profile) return base;
  return {
    ...base,
    name:      profile.display_name ?? base.name,
    bio:       profile.bio          ?? "",
    avatarUrl: profile.avatar_url   ?? base.avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                  = useState<AuthUser | null>(null);
  const [loading, setLoading]            = useState(true);
  const [isLoginModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Rely on INITIAL_SESSION for first hydration — avoids a double fetch
    // that would occur if we also called getSession() separately.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!session?.user) { setUser(null); return; }
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
          setUser(await buildAuthUser(session.user));
        }
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openLoginModal  = useCallback(() => setModalOpen(true),  []);
  const closeLoginModal = useCallback(() => setModalOpen(false), []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    if (!user) return;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(user.id, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(user.id);
    const baseUrl = data.publicUrl;
    // Sync to profiles table (base URL without cache-buster)
    await supabase.from("profiles").upsert({
      id:         user.id,
      avatar_url: baseUrl,
      updated_at: new Date().toISOString(),
    });
    // Cache-bust in local state so the browser re-fetches the new image immediately
    setUser((prev) =>
      prev ? { ...prev, avatarUrl: `${baseUrl}?t=${Date.now()}` } : null
    );
  }, [user]);

  const updateProfile = useCallback(async ({ name, bio }: { name: string; bio: string }) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id:           user.id,
      display_name: name.trim(),
      bio:          bio.trim(),
      updated_at:   new Date().toISOString(),
    });
    if (error) throw error;
    setUser((prev) => prev ? { ...prev, name: name.trim(), bio: bio.trim() } : null);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, isLoginModalOpen,
      openLoginModal, closeLoginModal, signInWithGoogle, signOut, updateAvatar, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function authUserToAuthor(user: AuthUser): Author {
  return {
    id:             user.id,
    name:           user.name,
    avatarUrl:      user.avatarUrl,
    country:        user.country,
    bio:            user.bio,
    followersCount: 0,
    followingCount: 0,
  };
}
