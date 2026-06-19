"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import { useApp } from "@/lib/context/AppContext";
import { posts as dummyPosts } from "@/lib/dummy-data";
import ProfilePageClient from "./ProfilePageClient";

export default function DynamicProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { userPosts } = useApp();

  // allPosts is used ONLY by Liked / Bookmarks tabs (need the full catalogue
  // to look up which posts the user has liked or saved).
  const allPosts = useMemo(() => [...userPosts, ...dummyPosts], [userPosts]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  // Show spinner while auth is loading or while redirect is in flight.
  if (loading || !user) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  const author     = authUserToAuthor(user);
  const totalLikes = userPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves = userPosts.reduce((acc, p) => acc + p.saveCount, 0);

  return (
    <ProfilePageClient
      author={author}
      authorPosts={userPosts}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
      isOwnProfile
      username={user.username}
      allPosts={allPosts}
      onSignOut={signOut}
    />
  );
}
