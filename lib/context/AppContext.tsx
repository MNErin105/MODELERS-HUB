"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AppState = {
  likedIds:    Set<string>;
  savedIds:    Set<string>;
  followedIds: Set<string>;
  toggleLike:   (postId: string) => Promise<void>;
  toggleSave:   (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => void;
};

const AppContext = createContext<AppState>({
  likedIds:    new Set(),
  savedIds:    new Set(),
  followedIds: new Set(),
  toggleLike:   async () => {},
  toggleSave:   async () => {},
  toggleFollow: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set());
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Load follows from localStorage (no DB table query needed here)
    try {
      setFollowedIds(new Set(JSON.parse(localStorage.getItem("mh-followed") || "[]")));
    } catch {}

    // Sync liked/saved from Supabase on auth change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        setCurrentUserId(null);
        setLikedIds(new Set());
        setSavedIds(new Set());
        return;
      }
      const uid = session.user.id;
      setCurrentUserId(uid);
      const [{ data: likedData }, { data: savedData }] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", uid),
        supabase.from("bookmarks").select("post_id").eq("user_id", uid),
      ]);
      setLikedIds(new Set((likedData ?? []).map((l) => l.post_id as string)));
      setSavedIds(new Set((savedData ?? []).map((b) => b.post_id as string)));
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    if (!currentUserId) return;
    const isLiked = likedIds.has(postId);
    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    if (isLiked) {
      await supabase.from("likes").delete().match({ post_id: postId, user_id: currentUserId });
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId });
    }
  }, [currentUserId, likedIds]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!currentUserId) return;
    const isSaved = savedIds.has(postId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    if (isSaved) {
      await supabase.from("bookmarks").delete().match({ post_id: postId, user_id: currentUserId });
    } else {
      await supabase.from("bookmarks").insert({ post_id: postId, user_id: currentUserId });
    }
  }, [currentUserId, savedIds]);

  const toggleFollow = useCallback((authorId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(authorId) ? next.delete(authorId) : next.add(authorId);
      try { localStorage.setItem("mh-followed", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      likedIds, savedIds, followedIds,
      toggleLike, toggleSave, toggleFollow,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
