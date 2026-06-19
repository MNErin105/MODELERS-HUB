import { posts } from "./dummy-data";

// ── UserProfile — searchable user record ─────────────────────────────────────

export type UserProfile = {
  id: string;        // matches Author.id (used for /profile/[id] routing)
  username: string;  // unique @handle
  name: string;
  avatarUrl: string;
  country: string;
  bio: string;
  followersCount: number;
};

// ── Username ↔ author ID mapping for the 8 dummy users ───────────────────────

const DUMMY_USERNAME_MAP: Record<string, string> = {
  a1: "tanaka_ryo",
  a2: "chen_weiting",
  a3: "park_jihoon",
  a4: "marcus_webb",
  a5: "yamamoto_k",
  a6: "thomas_m",
  a7: "sophie_l",
  a8: "hiroshi_y",
};

// ── Build dummy user profiles from post authors ───────────────────────────────

const uniqueAuthors = Array.from(
  new Map(posts.map((p) => [p.author.id, p.author])).values()
);

export const DUMMY_USER_PROFILES: UserProfile[] = uniqueAuthors.map((a) => ({
  id:             a.id,
  username:       DUMMY_USERNAME_MAP[a.id] ?? a.id,
  name:           a.name,
  avatarUrl:      a.avatarUrl,
  country:        a.country,
  bio:            a.bio,
  followersCount: a.followersCount,
}));

export const DUMMY_TAKEN_USERNAMES = new Set(
  Object.values(DUMMY_USERNAME_MAP).map((u) => u.toLowerCase())
);

// ── Search ────────────────────────────────────────────────────────────────────

export function searchUsers(query: string, extra: UserProfile[] = []): UserProfile[] {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return [];
  const all = [...DUMMY_USER_PROFILES, ...extra];
  // De-duplicate by id (extra may overlap with dummy list)
  const seen = new Set<string>();
  const unique = all.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
  return unique.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q)
  );
}

// ── Username format validation ────────────────────────────────────────────────

export const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/;

export function validateUsernameFormat(username: string): "ok" | "short" | "long" | "invalid_chars" {
  if (username.length < 3)  return "short";
  if (username.length > 20) return "long";
  if (!USERNAME_REGEX.test(username)) return "invalid_chars";
  return "ok";
}
