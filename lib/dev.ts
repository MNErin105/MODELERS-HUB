/**
 * Development bypass for authentication.
 *
 * HOW TO DISABLE (when Supabase Auth is ready):
 *   1. Set DEV_BYPASS_AUTH = false
 *   2. Delete this file if no longer needed
 *
 * This file has zero effect on production behaviour when DEV_BYPASS_AUTH is false.
 */

import type { AuthUser } from "./context/AuthContext";
import type { Author, Post } from "./types";
import { posts as dummyPosts } from "./dummy-data";

// ─────────────────────────────────────────────────────────────────────────────
// Toggle this single flag to enable / disable the bypass.
// ─────────────────────────────────────────────────────────────────────────────
export const DEV_BYPASS_AUTH = true;

// ── Demo credentials (replaces real Supabase user) ───────────────────────────

export const DEMO_AUTH_USER: AuthUser = {
  id:        "demo",
  username:  "demo",
  name:      "Demo User",
  email:     "demo@modelers.hub",
  avatarUrl: "https://picsum.photos/seed/demo-modeler-mh/96/96",
  country:   "JP",
};

export const DEMO_AUTHOR: Author = {
  id:             "demo",
  name:           "Demo User",
  avatarUrl:      "https://picsum.photos/seed/demo-modeler-mh/96/96",
  country:        "JP",
  bio:            "Plastic model builder.",
  followersCount: 34,
  followingCount: 18,
};

// ── Demo posts (authorId === DEMO_AUTHOR.id) ──────────────────────────────────
// Reuse dummy post content (images, titles, etc.) but reassign the author so
// that authorId === "demo". This ensures Works/WIP filtering works correctly:
//   authorPosts.filter(p => p.author.id === currentUserId)
//
// When Supabase Auth is integrated, replace with:
//   supabase.from("posts").select("*").eq("user_id", session.user.id)
export const DEMO_POSTS: Post[] = dummyPosts.slice(0, 12).map((p, i) => ({
  ...p,
  id:     `demo-post-${String(i + 1).padStart(2, "0")}`,
  author: DEMO_AUTHOR,
}));
