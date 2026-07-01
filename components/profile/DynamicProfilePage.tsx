"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import { getPostsByUserId, getPostsByIds } from "@/lib/supabase/queries";
import { fetchPinnedPostIds, addPin, removePin } from "@/lib/pins";
import { getFeaturedPostId } from "@/lib/featured";
import { useApp } from "@/lib/context/AppContext";
import ProfilePageClient from "./ProfilePageClient";
import type { Post } from "@/lib/types";

export default function DynamicProfilePage() {
  const router = useRouter();
  const { user, loading, signOut, updateAvatar } = useAuth();
  const { likedIds, savedIds } = useApp();
  const [ownPosts,     setOwnPosts]     = useState<Post[]>([]);
  const [likedPosts,   setLikedPosts]   = useState<Post[]>([]);
  const [savedPosts,   setSavedPosts]   = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [pinnedPostIds, setPinnedPostIds] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [featuredPostId, setFeaturedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const ids = [...likedIds];
    if (ids.length === 0) { setLikedPosts([]); return; }
    getPostsByIds(ids).then(setLikedPosts);
  }, [likedIds, user]);

  useEffect(() => {
    if (!user) return;
    const ids = [...savedIds];
    if (ids.length === 0) { setSavedPosts([]); return; }
    getPostsByIds(ids).then(setSavedPosts);
  }, [savedIds, user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getPostsByUserId(user.id),
      fetchPinnedPostIds(user.id),
    ]).then(([owned, pinIds]) => {
      setOwnPosts(owned);
      setPinnedPostIds(pinIds);
      setPostsLoading(false);
    }).catch(() => {
      setPostsLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    getFeaturedPostId(user.id).then(setFeaturedPostId).catch(() => {});
  }, [user?.id]);

  if (loading || !user || postsLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  async function handleTogglePin(postId: string) {
    if (!user) return;
    const isPinned = pinnedPostIds.includes(postId);
    if (isPinned) {
      await removePin(user.id, postId);
      setPinnedPostIds((prev) => prev.filter((id) => id !== postId));
    } else {
      const err = await addPin(user.id, postId);
      if (err) {
        setPinError(err);
        setTimeout(() => setPinError(null), 3000);
      } else {
        setPinnedPostIds((prev) => [...prev, postId]);
      }
    }
  }

  const author     = authUserToAuthor(user);
  const totalLikes = ownPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves = ownPosts.reduce((acc, p) => acc + p.saveCount, 0);
  const featuredThumbnailUrl = featuredPostId
    ? ownPosts.find((p) => p.id === featuredPostId)?.thumbnailUrl
    : undefined;

  return (
    <ProfilePageClient
      author={author}
      authorPosts={ownPosts}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
      isOwnProfile
      username={user.username}
      likedPosts={likedPosts}
      savedPosts={savedPosts}
      featuredThumbnailUrl={featuredThumbnailUrl}
      featuredPostId={featuredPostId ?? undefined}
      onFeaturedChange={(id) => setFeaturedPostId(id)}
      onSignOut={signOut}
      onUpdateAvatar={updateAvatar}
      pinnedPostIds={pinnedPostIds}
      onTogglePin={handleTogglePin}
      pinError={pinError}
    />
  );
}
