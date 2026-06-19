"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import { searchUsers, DUMMY_USER_PROFILES, UserProfile } from "@/lib/users";

function UserDropdownItem({ user, onClick }: { user: UserProfile; onClick: () => void }) {
  const href = user.id === "self" ? "/profile/self" : `/profile/${user.id}`;
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-80"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div
        className="relative w-9 h-9 rounded-full overflow-hidden shrink-0"
        style={{ border: "1px solid var(--border-subtle)" }}
      >
        <Image
          src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/36/36`}
          alt={user.name}
          fill
          className="object-cover"
          sizes="36px"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {user.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          @{user.username}
          {user.country && (
            <span className="ml-2 opacity-60">· {user.country}</span>
          )}
        </p>
      </div>
      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {user.followersCount.toLocaleString()} followers
      </span>
    </Link>
  );
}

export default function SearchBar() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslations("search");
  const { user }     = useAuth();

  const [value,   setValue]   = useState(searchParams.get("q") ?? "");
  const [focused, setFocused] = useState(false);
  const mounted   = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // All users: dummies + current auth user (if any)
  const allUsers = useMemo<UserProfile[]>(() => {
    if (!user) return DUMMY_USER_PROFILES;
    const selfProfile: UserProfile = {
      id:             "self",
      username:       user.username,
      name:           user.name,
      avatarUrl:      user.avatarUrl,
      country:        user.country,
      bio:            "",
      followersCount: 0,
    };
    return [selfProfile, ...DUMMY_USER_PROFILES];
  }, [user]);

  const userResults = useMemo(
    () => (value.trim() ? searchUsers(value, user ? [{ id: "self", username: user.username, name: user.name, avatarUrl: user.avatarUrl, country: user.country, bio: "", followersCount: 0 }] : []).slice(0, 5) : []),
    [value, user]
  );

  const showDropdown = focused && userResults.length > 0;

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      router.push(q ? `/?${params.toString()}` : "/");
    },
    [router]
  );

  // Debounced URL push for post search
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timer = setTimeout(() => push(value), 300);
    return () => clearTimeout(timer);
  }, [value, push]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect() {
    setFocused(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div
        className="relative flex items-center w-full rounded-lg overflow-hidden"
        style={{ background: "var(--bg-tertiary)", border: `1px solid ${focused ? "var(--accent-primary)" : "var(--border-subtle)"}`, transition: "border-color 0.15s" }}
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
          onKeyDown={(e) => { if (e.key === "Escape") { setFocused(false); (e.target as HTMLInputElement).blur(); } }}
          placeholder={t("placeholder")}
          className="w-full bg-transparent py-2 pl-9 pr-4 text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          aria-label={t("ariaLabel")}
          autoComplete="off"
        />
      </div>

      {/* Typeahead dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-[150]"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
            <Users size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              People
            </span>
          </div>

          {userResults.map((u) => (
            <UserDropdownItem key={u.id} user={u} onClick={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
