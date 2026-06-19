"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { posts as dummyPosts } from "@/lib/dummy-data";
import { Category } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/context/AuthContext";
import { searchUsers, UserProfile } from "@/lib/users";
import FeaturedSection from "./FeaturedSection";
import PopularSection from "./PopularSection";
import NewArrivalsSection from "./NewArrivalsSection";
import AllCategoryRankings from "./AllCategoryRankings";
import WorkGrid from "@/components/ui/WorkGrid";
import CategoryFilter from "@/components/ui/CategoryFilter";

type SortMode = "new" | "popular" | "wip" | "finished";

// ── People card ───────────────────────────────────────────────────────────────

function PeopleCard({ user }: { user: UserProfile }) {
  const href = user.id === "self" ? "/profile/self" : `/profile/${user.id}`;
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-4 rounded-xl transition-all hover:opacity-90"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", minWidth: 200, flex: "1 1 200px" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative w-11 h-11 rounded-full overflow-hidden shrink-0"
          style={{ border: "2px solid var(--accent-muted)" }}
        >
          <Image
            src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/44/44`}
            alt={user.name}
            fill
            className="object-cover"
            sizes="44px"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
            @{user.username}
          </p>
        </div>
      </div>
      {user.bio && (
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {user.bio}
        </p>
      )}
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {user.followersCount.toLocaleString()} followers · {user.country}
      </p>
    </Link>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const t = useTranslations("home");

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const { userPosts } = useApp();
  const { user } = useAuth();

  const posts = useMemo(() => [...userPosts, ...dummyPosts], [userPosts]);

  // User search extras (only the auth user adds herself to the pool)
  const selfProfile = useMemo<UserProfile | null>(() => {
    if (!user) return null;
    return { id: "self", username: user.username, name: user.name, avatarUrl: user.avatarUrl, country: user.country, bio: "", followersCount: 0 };
  }, [user]);

  const matchingUsers = useMemo(
    () => (query.trim() ? searchUsers(query, selfProfile ? [selfProfile] : []) : []),
    [query, selfProfile]
  );

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (activeCategory) result = result.filter((p) => p.category === activeCategory);
    if (sortMode === "wip")      result = result.filter((p) => p.buildSteps && p.buildSteps.length > 0);
    if (sortMode === "finished") result = result.filter((p) => !p.buildSteps || p.buildSteps.length === 0);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.kit.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (sortMode === "popular") {
      result = [...result].sort((a, b) => b.weeklyLikeCount - a.weeklyLikeCount);
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [activeCategory, query, sortMode, posts]);

  const isFiltered = !!query.trim() || activeCategory !== null || sortMode !== "new";

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: "new",      label: t("filters.new") },
    { key: "popular",  label: t("filters.popular") },
    { key: "wip",      label: t("filters.wipOnly") },
    { key: "finished", label: t("filters.finishedOnly") },
  ];

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Category filter */}
      <div className="py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* Sort / filter bar */}
      <div
        className="py-2 px-6"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center gap-2">
          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("filters.sortBy")}
          </span>
          <div className="flex gap-1">
            {sortOptions.map((opt) => {
              const active = sortMode === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSortMode(opt.key)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? "var(--accent-primary)" : "transparent",
                    color:      active ? "var(--bg-primary)"     : "var(--text-muted)",
                    border:     active ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isFiltered ? (
        <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">

          {/* People results */}
          {matchingUsers.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} style={{ color: "var(--accent-primary)" }} />
                <h2
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                >
                  People
                </h2>
                <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  ({matchingUsers.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {matchingUsers.map((u) => (
                  <PeopleCard key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}

          {/* Works results */}
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {filteredPosts.length} {filteredPosts.length !== 1 ? "results" : "result"}
            {query && <> for &ldquo;{query}&rdquo;</>}
            {activeCategory && (
              <> in <strong style={{ color: "var(--accent-primary)" }}>{activeCategory}</strong></>
            )}
          </p>
          <WorkGrid posts={filteredPosts} />
        </section>
      ) : (
        <>
          <FeaturedSection posts={posts} />
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <PopularSection posts={posts} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <AllCategoryRankings posts={posts} />
          </div>
          <NewArrivalsSection posts={posts} />
        </>
      )}
    </div>
  );
}
