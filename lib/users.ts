export type UserProfile = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  country: string;
  bio: string;
  followersCount: number;
};

export function searchUsers(query: string, extra: UserProfile[] = []): UserProfile[] {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return [];
  const seen = new Set<string>();
  return extra.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });
}
