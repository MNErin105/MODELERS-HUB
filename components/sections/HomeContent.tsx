"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { Category, Post, Story } from "@/lib/types";
import { POSTS_PAGE_SIZE, STORIES_ENABLED } from "@/lib/constants";
import { useAuth } from "@/lib/context/AuthContext";
import { searchUsers, UserProfile } from "@/lib/users";
import { useCategoryOrder } from "@/lib/hooks/useCategoryOrder";
import PopularSection from "./PopularSection";
import NewArrivalsSection from "./NewArrivalsSection";
import AllCategoryRankings from "./AllCategoryRankings";
import WorkGrid from "@/components/ui/WorkGrid";
import CategoryFilter from "@/components/ui/CategoryFilter";
import CategoryOrderModal from "@/components/ui/CategoryOrderModal";
import StoryBar from "@/components/story/StoryBar";
import StoryViewer from "@/components/story/StoryViewer";
import StoryCreateModal from "@/components/story/StoryCreateModal";

// ── People card ───────────────────────────────────────────────────────────────

function PeopleCard({ user }: { user: UserProfile }) {
  const href = `/profile/${user.username}`;
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
          <UserAvatar src={user.avatarUrl} alt={user.name} fill />
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

type Props = { initialPosts: Post[] };

export default function HomeContent({ initialPosts }: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [posts] = useState<Post[]>(initialPosts);
  const { user } = useAuth();

  // Category order (persisted to localStorage)
  const { order: categoryOrder, saveOrder, resetOrder } = useCategoryOrder();
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Stories state
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);
  const [viewerStories, setViewerStories] = useState<Story[] | null>(null);
  const [viewerStart, setViewerStart] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selfProfile = useMemo<UserProfile | null>(() => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      country: user.country,
      bio: user.bio,
      followersCount: 0,
    };
  }, [user]);

  const matchingUsers = useMemo(
    () => (query.trim() ? searchUsers(query, selfProfile ? [selfProfile] : []) : []),
    [query, selfProfile]
  );

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory) result = result.filter((p) => p.categories.includes(activeCategory!));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.kit.toLowerCase().includes(q) ||
          p.categories.some((c) => c.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeCategory, query, posts]);

  const isFiltered = !!query.trim() || activeCategory !== null;

  // Filtered/search results pagination — same PAGE_SIZE/slice/Prev-Next pattern
  // as NewArrivalsSection / PopularSection.
  const [filteredPage, setFilteredPage] = useState(0);
  useEffect(() => { setFilteredPage(0); }, [activeCategory, query]);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PAGE_SIZE));
  const safeFilteredPage   = Math.min(filteredPage, filteredTotalPages - 1);
  const pagedFilteredPosts = filteredPosts.slice(
    safeFilteredPage * POSTS_PAGE_SIZE,
    (safeFilteredPage + 1) * POSTS_PAGE_SIZE,
  );

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Story bar — feature-flagged off for now (see lib/constants.ts) */}
      {STORIES_ENABLED && (
        <StoryBar
          refreshKey={storyRefreshKey}
          onStoryClick={(stories, startIndex) => { setViewerStories(stories); setViewerStart(startIndex); }}
          onAddStory={() => setShowCreateModal(true)}
        />
      )}

      {/* Category filter */}
      <div className="py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <CategoryFilter
          active={activeCategory}
          onChange={setActiveCategory}
          order={categoryOrder}
          onReorderClick={() => setShowOrderModal(true)}
        />
      </div>

      {isFiltered ? (
        <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
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

          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {filteredPosts.length} {filteredPosts.length !== 1 ? "results" : "result"}
            {query && <> for &ldquo;{query}&rdquo;</>}
            {activeCategory && (
              <> in <strong style={{ color: "var(--accent-primary)" }}>{activeCategory}</strong></>
            )}
          </p>
          <WorkGrid posts={pagedFilteredPosts} />

          {filteredTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setFilteredPage((p) => Math.max(0, p - 1))}
                disabled={safeFilteredPage === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
                style={{
                  background: "var(--bg-secondary)",
                  color:      "var(--text-secondary)",
                  border:     "1px solid var(--border-subtle)",
                }}
              >
                <ChevronLeft size={15} /> Prev
              </button>

              <span
                className="text-sm tabular-nums select-none"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: "4rem", textAlign: "center" }}
              >
                {safeFilteredPage + 1} / {filteredTotalPages}
              </span>

              <button
                onClick={() => setFilteredPage((p) => Math.min(filteredTotalPages - 1, p + 1))}
                disabled={safeFilteredPage === filteredTotalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
                style={{
                  background: "var(--bg-secondary)",
                  color:      "var(--text-secondary)",
                  border:     "1px solid var(--border-subtle)",
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>No posts yet.</p>
          <Link
            href="/posts/new"
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            Be the first to post
          </Link>
        </div>
      ) : (
        <>
          <NewArrivalsSection posts={posts} categories={categoryOrder} onReorderClick={() => setShowOrderModal(true)} />
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <PopularSection posts={posts} categories={categoryOrder} onReorderClick={() => setShowOrderModal(true)} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <AllCategoryRankings posts={posts} />
          </div>
        </>
      )}

      {/* Category order modal */}
      {showOrderModal && (
        <CategoryOrderModal
          order={categoryOrder}
          onSave={saveOrder}
          onReset={resetOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Story Viewer — feature-flagged off for now (see lib/constants.ts) */}
      {STORIES_ENABLED && viewerStories && (
        <StoryViewer
          stories={viewerStories}
          startIndex={viewerStart}
          onClose={() => setViewerStories(null)}
          onDeleted={(id) => {
            setViewerStories((prev) => {
              if (!prev) return null;
              const next = prev.filter((s) => s.id !== id);
              return next.length > 0 ? next : null;
            });
            setStoryRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Story Create Modal — feature-flagged off for now (see lib/constants.ts) */}
      {STORIES_ENABLED && showCreateModal && (
        <StoryCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setStoryRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
