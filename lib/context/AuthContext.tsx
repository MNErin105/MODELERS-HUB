"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Author } from "@/lib/types";
import { DUMMY_TAKEN_USERNAMES } from "@/lib/users";

export type AuthUser = {
  id: string;
  username: string;  // unique @handle
  name: string;
  email: string;
  avatarUrl: string;
  country: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signIn: (name: string, username: string, country: string) => void;
  signOut: () => void;
  isUsernameAvailable: (username: string) => boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  signIn: () => {},
  signOut: () => {},
  isUsernameAvailable: () => true,
});

const STORAGE_KEY  = "mh-auth-user";
const TAKEN_KEY    = "mh-taken-usernames";

function getRegisteredUsernames(): Set<string> {
  try {
    const stored: string[] = JSON.parse(localStorage.getItem(TAKEN_KEY) || "[]");
    return new Set(stored.map((u) => u.toLowerCase()));
  } catch {
    return new Set();
  }
}

function registerUsername(username: string) {
  try {
    const existing = getRegisteredUsernames();
    existing.add(username.toLowerCase());
    localStorage.setItem(TAKEN_KEY, JSON.stringify([...existing]));
  } catch {}
}

function unregisterUsername(username: string) {
  try {
    const existing = getRegisteredUsernames();
    existing.delete(username.toLowerCase());
    localStorage.setItem(TAKEN_KEY, JSON.stringify([...existing]));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        // Migrate old sessions that lack username
        if (!parsed.username) parsed.username = parsed.id ?? "user";
        setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const openLoginModal  = useCallback(() => setIsLoginModalOpen(true),  []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const isUsernameAvailable = useCallback((username: string): boolean => {
    const lower = username.toLowerCase();
    if (DUMMY_TAKEN_USERNAMES.has(lower)) return false;
    if (getRegisteredUsernames().has(lower)) return false;
    return true;
  }, []);

  const signIn = useCallback((name: string, username: string, country: string) => {
    const lower  = username.toLowerCase();
    const seed   = encodeURIComponent(`${lower}-mh`);
    const newUser: AuthUser = {
      id:        "self",
      username:  lower,
      name,
      email:     `${lower}@modelers.hub`,
      avatarUrl: `https://picsum.photos/seed/${seed}/64/64`,
      country,
    };
    setUser(newUser);
    registerUsername(lower);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser)); } catch {}
    setIsLoginModalOpen(false);
  }, []);

  const signOut = useCallback(() => {
    if (user?.username) unregisterUsername(user.username);
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, isLoginModalOpen,
      openLoginModal, closeLoginModal, signIn, signOut, isUsernameAvailable,
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
    bio:            "",
    followersCount: 0,
    followingCount: 0,
  };
}
