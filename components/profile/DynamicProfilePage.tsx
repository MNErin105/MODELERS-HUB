"use client";

import { useMemo } from "react";
import { Loader2, FlaskConical } from "lucide-react";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import { useApp } from "@/lib/context/AppContext";
import { posts as dummyPosts } from "@/lib/dummy-data";
import ProfilePageClient from "./ProfilePageClient";

// ── Dev bypass ────────────────────────────────────────────────────────────────
// Set DEV_BYPASS_AUTH=false in lib/dev.ts to restore the real auth flow.
import { DEV_BYPASS_AUTH, DEMO_AUTH_USER, DEMO_AUTHOR, DEMO_POSTS } from "@/lib/dev";

export default function DynamicProfilePage() {
  const { user, loading, openLoginModal, signOut } = useAuth();
  // userPosts contains ONLY posts created by the current session user (AppContext).
  // Never mix in dummyPosts here — that would show other users' work on this page.
  const { userPosts } = useApp();

  // allPosts is used ONLY by the Liked / Bookmarks tabs (need the full catalogue
  // to look up which posts the user has liked or saved).
  const allPosts = useMemo(() => [...userPosts, ...dummyPosts], [userPosts]);

  // ── Loading / SSR shell ───────────────────────────────────────────────────
  if (typeof window === "undefined" || loading) {
    return (
      <div className="flex items-center justify-center" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  // DEV_BYPASS_AUTH=true  → skip gate, show demo profile
  // DEV_BYPASS_AUTH=false → show login prompt (production behaviour)
  if (!user && !DEV_BYPASS_AUTH) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          Sign in to view your page.
        </p>
        <button
          onClick={openLoginModal}
          className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  // ── Resolve real user vs. dev demo ────────────────────────────────────────
  const isDevDemo = !user && DEV_BYPASS_AUTH;

  // myPosts: ONLY the current user's own posts
  //   • Demo  → DEMO_POSTS (all have author.id === "demo")
  //   • Real  → userPosts  (added via addPost, always author.id === "self")
  //   Supabase future: supabase.from("posts").eq("user_id", session.user.id)
  const myPosts = isDevDemo ? DEMO_POSTS : userPosts;

  const effectiveUser = user ?? DEMO_AUTH_USER;
  const author        = isDevDemo ? DEMO_AUTHOR : authUserToAuthor(user!);
  const totalLikes    = myPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves    = myPosts.reduce((acc, p) => acc + p.saveCount, 0);

  return (
    <>
      {isDevDemo && <DevBanner />}

      <ProfilePageClient
        author={author}
        authorPosts={myPosts}
        totalLikes={totalLikes}
        totalSaves={totalSaves}
        isOwnProfile
        username={effectiveUser.username}
        allPosts={allPosts}
        onSignOut={isDevDemo ? undefined : signOut}
      />
    </>
  );
}

// ── Dev banner ────────────────────────────────────────────────────────────────

function DevBanner() {
  return (
    <div
      className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold"
      style={{
        background: "#92400e",
        color: "#fef3c7",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.05em",
      }}
    >
      <FlaskConical size={13} />
      DEV MODE — demo data · set DEV_BYPASS_AUTH=false in lib/dev.ts to restore auth
    </div>
  );
}
