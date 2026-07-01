"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AppState = {
  likedIds:    Set<string>;
  savedIds:    Set<string>;
  followedIds: Set<string>;
  toggleLike:   (postId: string) => Promise<void>;
  toggleSave:   (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => Promise<void>;
};

const AppContext = createContext<AppState>({
  likedIds:    new Set(),
  savedIds:    new Set(),
  followedIds: new Set(),
  toggleLike:   async () => {},
  toggleSave:   async () => {},
  toggleFollow: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set());
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        setCurrentUserId(null);
        setLikedIds(new Set());
        setSavedIds(new Set());
        setFollowedIds(new Set());
        return;
      }
      const uid = session.user.id;
      setCurrentUserId(uid);
      // NOTE: Supabase queries can hang indefinitely. Always use Promise.race +
      // timeout and finally/catch to release state — same pattern as AuthContext.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AppContext fetch timeout")), 5000)
      );
      try {
        const [{ data: likedData }, { data: savedData }, { data: followedData }] =
          await Promise.race([
            Promise.all([
              supabase.from("likes").select("post_id").eq("user_id", uid),
              supabase.from("bookmarks").select("post_id").eq("user_id", uid),
              supabase.from("follows").select("following_id").eq("follower_id", uid),
            ]),
            timeout,
          ]);
        setLikedIds(new Set((likedData ?? []).map((l) => l.post_id as string)));
        setSavedIds(new Set((savedData ?? []).map((b) => b.post_id as string)));
        setFollowedIds(new Set((followedData ?? []).map((f) => f.following_id as string)));
      } catch (err) {
        console.error("[AppContext] likes/bookmarks/follows fetch failed or timed out:", err);
        setLikedIds(new Set());
        setSavedIds(new Set());
        setFollowedIds(new Set());
      }
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

  const toggleFollow = useCallback(async (authorId: string) => {
    if (!currentUserId) return;
    const isFollowed = followedIds.has(authorId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      isFollowed ? next.delete(authorId) : next.add(authorId);
      return next;
    });
    if (isFollowed) {
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: authorId });
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: authorId });
    }
  }, [currentUserId, followedIds]);

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
