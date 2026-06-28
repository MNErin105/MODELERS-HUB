"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import { getPostsByUserId, getPostsForHome } from "@/lib/supabase/queries";
import { fetchPinnedPostIds, addPin, removePin } from "@/lib/pins";
import ProfilePageClient from "./ProfilePageClient";
import type { Post } from "@/lib/types";

export default function DynamicProfilePage() {
  const router = useRouter();
  const { user, loading, signOut, updateAvatar } = useAuth();
  const [ownPosts,  setOwnPosts]  = useState<Post[]>([]);
  const [allPosts,  setAllPosts]  = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [pinnedPostIds, setPinnedPostIds] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getPostsByUserId(user.id),
      getPostsForHome(100),
      fetchPinnedPostIds(user.id),
    ]).then(([owned, all, pinIds]) => {
      setOwnPosts(owned);
      setAllPosts(all);
      setPinnedPostIds(pinIds);
      setPostsLoading(false);
    });
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

  return (
    <ProfilePageClient
      author={author}
      authorPosts={ownPosts}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
      isOwnProfile
      username={user.username}
      allPosts={allPosts}
      onSignOut={signOut}
      onUpdateAvatar={updateAvatar}
      pinnedPostIds={pinnedPostIds}
      onTogglePin={handleTogglePin}
      pinError={pinError}
    />
  );
}
