"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AppState = {
  likedIds: Set<string>;
  savedIds: Set<string>;
  followedIds: Set<string>;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (authorId: string) => void;
};

const AppContext = createContext<AppState>({
  likedIds: new Set(),
  savedIds: new Set(),
  followedIds: new Set(),
  toggleLike: () => {},
  toggleSave: () => {},
  toggleFollow: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setLikedIds(new Set(JSON.parse(localStorage.getItem("mh-liked") || "[]")));
      setSavedIds(new Set(JSON.parse(localStorage.getItem("mh-saved") || "[]")));
      setFollowedIds(new Set(JSON.parse(localStorage.getItem("mh-followed") || "[]")));
    } catch {}
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      try { localStorage.setItem("mh-liked", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      try { localStorage.setItem("mh-saved", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const toggleFollow = useCallback((authorId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(authorId) ? next.delete(authorId) : next.add(authorId);
      try { localStorage.setItem("mh-followed", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{ likedIds, savedIds, followedIds, toggleLike, toggleSave, toggleFollow }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
