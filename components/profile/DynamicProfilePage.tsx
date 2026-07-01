"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import { getPostsByUserId, getPostsByIds } from "@/lib/supabase/queries";
import { fetchPinnedPostIds, addPin, removePin } from "@/lib/pins";
import { getFeaturedData } from "@/lib/featured";
import { useApp } from "@/lib/context/AppContext";
import ProfilePageClient from "./ProfilePageClient";
import type { Post } from "@/lib/types";

export default function DynamicProfilePage() {
  const router = useRouter();
  const { user, loading, signOut, updateAvatar } = useAuth();
  const { likedIds, savedIds } = useApp();
  const [ownPosts,      setOwnPosts]      = useState<Post[]>([]);
  const [likedPosts,    setLikedPosts]    = useState<Post[]>([]);
  const [savedPosts,    setSavedPosts]    = useState<Post[]>([]);
  const [postsLoading,  setPostsLoading]  = useState(true);
  const [pinnedPostIds, setPinnedPostIds] = useState<string[]>([]);
  const [pinError,      setPinError]      = useState<string | null>(null);
  const [featuredPostId,   setFeaturedPostId]   = useState<string | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.replace("/"); }
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

  // NOTE: Supabase queries can hang indefinitely on network issues.
  // Always wrap Promise.all with Promise.race + timeout, and use finally
  // to release loading state — otherwise the spinner loops forever.
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("posts fetch timeout")), 5000)
      );
      try {
        const [owned, pinIds] = await Promise.race([
          Promise.all([
            getPostsByUserId(user.id),
            fetchPinnedPostIds(user.id),
          ]),
          timeout,
        ]);
        setOwnPosts(owned);
        setPinnedPostIds(pinIds);
      } catch (err) {
        console.error("[DynamicProfilePage] posts fetch failed or timed out:", err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  // Featured data — non-blocking, separate effect
  useEffect(() => {
    if (!user) return;
    getFeaturedData(user.id)
      .then(({ postId, imageUrl }) => {
        setFeaturedPostId(postId);
        setFeaturedImageUrl(imageUrl);
      })
      .catch(() => {});
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

  const postThumbnailUrl = featuredPostId
    ? ownPosts.find((p) => p.id === featuredPostId)?.thumbnailUrl
    : undefined;
  const effectiveBgUrl = featuredImageUrl ?? postThumbnailUrl;

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
      featuredThumbnailUrl={effectiveBgUrl}
      featuredPostId={featuredPostId ?? undefined}
      featuredImageUrl={featuredImageUrl ?? undefined}
      onFeaturedChange={(id) => setFeaturedPostId(id)}
      onFeaturedImageChange={(url) => setFeaturedImageUrl(url)}
      onSignOut={signOut}
      onUpdateAvatar={updateAvatar}
      pinnedPostIds={pinnedPostIds}
      onTogglePin={handleTogglePin}
      pinError={pinError}
    />
  );
}
