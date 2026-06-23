"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, User, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { searchProfiles, searchPostsQuick } from "@/lib/supabase/queries";
import type { QuickUser, QuickPost } from "@/lib/supabase/queries";
import UserAvatar from "@/components/ui/UserAvatar";

// ── Dropdown items ────────────────────────────────────────────────────────────

function UserItem({ user, onClick }: { user: QuickUser; onClick: () => void }) {
  return (
    <Link
      href={`/profile/${user.id}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 transition-opacity hover:opacity-70"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div
        className="relative w-8 h-8 rounded-full overflow-hidden shrink-0"
        style={{ border: "1px solid var(--border-subtle)" }}
      >
        <UserAvatar src={user.avatarUrl} alt={user.name} fill />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {user.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          @{user.username}
          {user.country && <span className="ml-2 opacity-60">· {user.country}</span>}
        </p>
      </div>
    </Link>
  );
}

function PostItem({ post, onClick }: { post: QuickPost; onClick: () => void }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 transition-opacity hover:opacity-70"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {post.thumbnailUrl ? (
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <Layers size={14} style={{ color: "var(--text-muted)" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {post.title}
        </p>
        {post.kit && (
          <p className="text-xs truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {post.kit}
          </p>
        )}
      </div>
      <span
        className="text-xs shrink-0 px-1.5 py-0.5 rounded"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {post.category}
      </span>
    </Link>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5"
      style={{ background: "var(--bg-overlay)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      {icon}
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SearchBar() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslations("search");

  const [value,       setValue]       = useState(searchParams.get("q") ?? "");
  const [focused,     setFocused]     = useState(false);
  const [userResults, setUserResults] = useState<QuickUser[]>([]);
  const [postResults, setPostResults] = useState<QuickPost[]>([]);

  const mounted    = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── URL push (drives HomeContent post filter) ─────────────────────────────
  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      router.push(q ? `/?${params.toString()}` : "/");
    },
    [router],
  );

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timer = setTimeout(() => push(value), 300);
    return () => clearTimeout(timer);
  }, [value, push]);

  // ── Typeahead DB search (drives dropdown) ─────────────────────────────────
  useEffect(() => {
    const q = value.trim();
    if (!q) { setUserResults([]); setPostResults([]); return; }
    const timer = setTimeout(async () => {
      const [users, posts] = await Promise.all([
        searchProfiles(q, 5),
        searchPostsQuick(q, 3),
      ]);
      setUserResults(users);
      setPostResults(posts);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults   = userResults.length > 0 || postResults.length > 0;
  const showDropdown = focused && hasResults;

  function handleSelect() { setFocused(false); }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div
        className="relative flex items-center w-full rounded-lg overflow-hidden"
        style={{
          background:    "var(--bg-tertiary)",
          border:        `1px solid ${focused ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          transition:    "border-color 0.15s",
        }}
      >
        <Search
          className="absolute left-3 shrink-0"
          size={16}
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setFocused(false); (e.target as HTMLInputElement).blur(); }
          }}
          placeholder={t("placeholder")}
          className="w-full bg-transparent py-2 pl-9 pr-4 text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          aria-label={t("ariaLabel")}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-[150]"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {/* People section */}
          {userResults.length > 0 && (
            <>
              <SectionHeader icon={<User size={11} style={{ color: "var(--text-muted)" }} />} label="People" />
              {userResults.map((u) => (
                <UserItem key={u.id} user={u} onClick={handleSelect} />
              ))}
            </>
          )}

          {/* Works section */}
          {postResults.length > 0 && (
            <>
              <SectionHeader icon={<Layers size={11} style={{ color: "var(--text-muted)" }} />} label="Works" />
              {postResults.map((p) => (
                <PostItem key={p.id} post={p} onClick={handleSelect} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
