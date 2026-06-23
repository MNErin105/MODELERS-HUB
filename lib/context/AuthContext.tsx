"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
  openLoginModal:   () => void;
  closeLoginModal:  () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail:  (email: string, password: string) => Promise<void>;
  signUpWithEmail:  (email: string, password: string) => Promise<void>;
  resetPassword:    (email: string) => Promise<void>;
  signOut:          () => Promise<void>;
  updateAvatar:     (file: File) => Promise<void>;
  updateProfile:    (data: { name: string; bio: string; username: string }) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isLoginModalOpen: false,
  openLoginModal:   () => {},
  closeLoginModal:  () => {},
  signInWithGoogle: async () => {},
  signInWithEmail:  async () => {},
  signUpWithEmail:  async () => {},
  resetPassword:    async () => {},
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
    email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 17) ||
    "user";
  const base: AuthUser = {
    id:        supabaseUser.id,
    username:  username.length >= 3 ? username : username.padEnd(3, "0"),
    name:      meta.full_name ?? meta.name ?? "Modeler",
    email,
    avatarUrl: getAvatarUrl(supabaseUser.id),
    country:   "",
    bio:       "",
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, username")
    .eq("id", supabaseUser.id)
    .single();

  if (!profile) {
    // Trigger may not have fired (user pre-dates the migration).
    // Attempt to create the profiles row now so FK constraints pass.
    await createMissingProfile(supabaseUser.id, base);
    return base;
  }
  return {
    ...base,
    username:  profile.username     ?? base.username,
    name:      profile.display_name ?? base.name,
    bio:       profile.bio          ?? "",
    avatarUrl: profile.avatar_url   ?? base.avatarUrl,
  };
}

// Creates a profiles row for users whose handle_new_user trigger didn't fire.
// Retries up to 10 times with a numeric suffix on username collisions.
async function createMissingProfile(userId: string, base: AuthUser): Promise<void> {
  const baseUname = base.username;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate =
      attempt === 0 ? baseUname : `${baseUname.slice(0, 17)}${attempt}`;
    const { error } = await supabase.from("profiles").insert({
      id:           userId,
      username:     candidate,
      display_name: base.name,
    });
    if (!error) return;
    // 23505 = unique_violation — try next suffix
    if ((error as { code?: string }).code !== "23505") {
      console.error("[createMissingProfile]", error);
      return;
    }
  }
  console.error("[createMissingProfile] Could not find a unique username after 10 attempts.");
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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return;
    const code = (error as { code?: string }).code;
    if (code === "invalid_credentials" || error.message?.includes("Invalid login credentials")) {
      throw new Error("メールアドレスまたはパスワードが正しくありません");
    }
    if (code === "email_not_confirmed") {
      throw new Error("メールアドレスの確認が完了していません。確認メールをご確認ください。");
    }
    throw new Error(error.message ?? "ログインに失敗しました");
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) return;
    const msg = error.message ?? "";
    if (msg.includes("User already registered") || (error as { code?: string }).code === "user_already_exists") {
      throw new Error("このメールアドレスは既に登録されています");
    }
    throw new Error(msg || "登録に失敗しました");
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset`
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message ?? "パスワードリセットメールの送信に失敗しました");
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
    if (error) {
      console.error("[updateAvatar] Storage error:", error);
      throw new Error((error as { message?: string }).message ?? "Failed to upload avatar.");
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(user.id);
    const baseUrl = data.publicUrl;
    // UPDATE only — row exists because buildAuthUser ensures it via createMissingProfile.
    // Avoids conflict with NOT NULL constraints on username / display_name.
    await supabase
      .from("profiles")
      .update({ avatar_url: baseUrl })
      .eq("id", user.id);
    // Cache-bust in local state so the browser re-fetches the new image immediately
    setUser((prev) =>
      prev ? { ...prev, avatarUrl: `${baseUrl}?t=${Date.now()}` } : null
    );
  }, [user]);

  const updateProfile = useCallback(async ({ name, bio, username }: { name: string; bio: string; username: string }) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id:           user.id,
      display_name: name.trim(),
      bio:          bio.trim(),
      username:     username.trim(),
    });
    if (error) {
      console.error("[updateProfile] Supabase error:", error);
      // PostgreSQL unique constraint violation — username already taken
      if ((error as { code?: string }).code === "23505") {
        throw new Error("This username is already taken.");
      }
      // Wrap PostgrestError (plain object) in Error so catch blocks get .message
      throw new Error((error as { message?: string }).message ?? "Failed to update profile.");
    }
    setUser((prev) =>
      prev ? { ...prev, name: name.trim(), bio: bio.trim(), username: username.trim() } : null
    );
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, isLoginModalOpen,
      openLoginModal, closeLoginModal,
      signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword,
      signOut, updateAvatar, updateProfile,
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
