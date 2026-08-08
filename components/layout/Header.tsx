"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { PlusSquare, Bell, Menu, X, LogOut, User, Heart, MessageSquare, UserPlus, Info, CheckCheck, Trophy, Bug, ChevronDown, Rss } from "lucide-react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/ui/SearchBar";
import LocaleToggle from "@/components/layout/LocaleToggle";
import ProfileAvatarButton from "@/components/layout/ProfileAvatarButton";
import { useAuth } from "@/lib/context/AuthContext";
import { useNotifications, NotificationItem } from "@/lib/context/NotificationContext";
import { useLocale } from "@/lib/context/LocaleContext";

// Auth UI strings are hardcoded English per spec (Google auth elements stay English regardless of locale)
const AUTH_LABELS = {
  signIn:  "Sign in",
  signOut: "Sign out",
  myPage:  "My Page",
} as const;

// ── Notification icon per type ─────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationItem["type"] }) {
  const size = 14;
  if (type === "like")    return <Heart size={size} style={{ color: "var(--color-like)" }} />;
  if (type === "comment") return <MessageSquare size={size} style={{ color: "var(--accent-primary)" }} />;
  if (type === "follow")  return <UserPlus size={size} style={{ color: "#34d399" }} />;
  return <Info size={size} style={{ color: "var(--text-muted)" }} />;
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── Notification dropdown ─────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const t = useTranslations("notification");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-[100]"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {t("title")}
        </span>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-primary)" }}
            >
              <CheckCheck size={12} /> {t("markAllRead")}
            </button>
          )}
          <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 px-4 py-3 transition-colors"
              style={{
                background: n.read ? "transparent" : "var(--accent-muted)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div className="shrink-0 mt-0.5"><NotifIcon type={n.type} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {relativeTime(n.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Avatar dropdown ───────────────────────────────────────────────────────────

function AvatarDropdown({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-2xl z-[100]"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>@{user.username}</p>
      </div>
      <Link
        href="/mypage"
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <User size={14} /> {AUTH_LABELS.myPage}
      </Link>
      <button
        onClick={() => { signOut(); onClose(); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors hover:opacity-80 text-left"
        style={{ color: "var(--text-secondary)" }}
      >
        <LogOut size={14} /> {AUTH_LABELS.signOut}
      </button>
    </div>
  );
}

// ── Post menu (choose between a full work post and a quick post log) ───────────

function PostMenuDropdown({ onClose, locale }: { onClose: () => void; locale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isJa = locale === "ja";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-2xl z-[100]"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <Link
        href="/posts/new"
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <PlusSquare size={14} /> {isJa ? "作品投稿" : "New Work"}
      </Link>
      <Link
        href="/build-logs/new"
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <Rss size={14} /> {isJa ? "制作ログ" : "Build Log"}
      </Link>
    </div>
  );
}

// ── More menu (bug report, etc.) ──────────────────────────────────────────────

const BUG_REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf1994qmHZeqy6zayD5TQ8CoRe0w9Z6-5BeUp1cKziU4_Fohw/viewform";

function MoreMenuDropdown({ onClose, locale }: { onClose: () => void; locale: string }) {
  const { user, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isJa = locale === "ja";

  const closeNotif   = useCallback(() => setNotifOpen(false),   []);
  const closeRanking = useCallback(() => setRankingOpen(false), []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-[100]"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {!loading && user && (
        <div className="relative">
          <button
            onClick={() => setRankingOpen((v) => !v)}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors hover:opacity-80 text-left"
            style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <Trophy size={14} style={{ color: "#f59e0b" }} />
            {isJa ? "月間ランキング" : "Monthly Ranking"}
          </button>
          {rankingOpen && <RankingPopup onClose={closeRanking} locale={locale} />}
        </div>
      )}
      {!loading && user && (
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors hover:opacity-80 text-left"
            style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <Bell size={14} />
            {isJa ? "通知" : "Notifications"}
            {unreadCount > 0 && (
              <span
                className="ml-auto min-w-[16px] h-4 rounded-full text-xs flex items-center justify-center font-bold px-1"
                style={{ background: "var(--color-like)", color: "#fff", fontSize: "10px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationDropdown onClose={closeNotif} />}
        </div>
      )}
      <a
        href={BUG_REPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bug size={14} /> {isJa ? "バグ報告" : "Report a Bug"}
      </a>
    </div>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

function MobileMenu({ onClose, locale }: { onClose: () => void; locale: string }) {
  const { unreadCount } = useNotifications();
  const [rankingOpen, setRankingOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const isJa = locale === "ja";

  return (
    <div
      className="absolute left-0 right-0 top-full shadow-2xl z-[90]"
      style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col gap-4">
        {/* Ranking teaser */}
        <div className="relative">
          <button
            onClick={() => setRankingOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-fit"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <Trophy size={15} style={{ color: "#f59e0b" }} />
            {isJa ? "月間ランキング" : "Monthly Ranking"}
          </button>
          {rankingOpen && <RankingPopup onClose={() => setRankingOpen(false)} locale={locale} />}
        </div>

        {/* Notifications teaser */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-fit"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <Bell size={15} />
            {isJa ? "通知" : "Notifications"}
            {unreadCount > 0 && (
              <span
                className="min-w-[16px] h-4 rounded-full text-xs flex items-center justify-center font-bold px-1"
                style={{ background: "var(--color-like)", color: "#fff", fontSize: "10px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Bug report */}
        <div className="relative">
          <a
            href={BUG_REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-fit"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <Bug size={15} /> {isJa ? "バグ報告" : "Report a Bug"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Ranking popup ─────────────────────────────────────────────────────────────

function RankingPopup({ onClose, locale }: { onClose: () => void; locale: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const isJa = locale === "ja";

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden shadow-2xl z-[100]"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <Trophy size={14} style={{ color: "#f59e0b" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {isJa ? "月間ランキング" : "Monthly Ranking"}
          </span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
          <X size={14} />
        </button>
      </div>
      <div className="px-4 py-5 text-center">
        <Trophy size={32} className="mx-auto mb-3" style={{ color: "#f59e0b" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          MODELERS HUB {isJa ? "月間ランキング" : "Monthly Ranking"}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {isJa
            ? "近日公開予定！各カテゴリ100人超えで解放"
            : "Coming soon! Unlocks when each category reaches 100 users"}
        </p>
      </div>
    </div>
  );
}

// ── Main header inner ─────────────────────────────────────────────────────────

function HeaderInner() {
  const { user, loading, openLoginModal } = useAuth();
  const { unreadCount } = useNotifications();
  const { locale } = useLocale();
  const isJa = locale === "ja";

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [moreMenuOpen,   setMoreMenuOpen]   = useState(false);
  const [postMenuOpen,   setPostMenuOpen]   = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const closeMenu       = useCallback(() => setMenuOpen(false),       []);
  const closeMoreMenu   = useCallback(() => setMoreMenuOpen(false),   []);
  const closePostMenu   = useCallback(() => setPostMenuOpen(false),   []);
  const closeAvatarMenu = useCallback(() => setAvatarMenuOpen(false), []);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "rgba(10,10,11,0.88)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 h-[72px] flex items-center gap-4">

        {/* Brand */}
        <Link href="/" className="shrink-0" aria-label="Modelers Hub home">
          <Image
            src="/images/logo.jpeg"
            alt="Modelers Hub"
            width={72}
            height={60}
            className="w-[72px] h-auto object-contain transition-all hover:opacity-90 hover:scale-[1.02] cursor-pointer select-none"
          />
        </Link>

        {/* Search (hidden on mobile — shown in mobile menu) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 shrink-0">

          {/* Build Logs — icon-only, always visible on both desktop and mobile */}
          <Link
            href="/build-logs"
            aria-label={isJa ? "制作ログを見る" : "View Build Logs"}
            title={isJa ? "制作ログを見る" : "View Build Logs"}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <Rss size={18} />
          </Link>

          {/* Post button — logged-in only, both breakpoints. Toggles a 2-choice
              dropdown (new work vs. build log) instead of navigating directly.
              Icon-only on mobile, where the header has no room for the label. */}
          {!loading && user && (
            <div className="relative flex">
              <button
                onClick={() => setPostMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-2 md:px-4 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                aria-label={isJa ? "投稿する" : "Post"}
              >
                <PlusSquare size={15} />
                <span>{isJa ? "投稿する" : "Post"}</span>
                <ChevronDown size={14} style={{ transform: postMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
              </button>
              {postMenuOpen && <PostMenuDropdown onClose={closePostMenu} locale={locale} />}
            </div>
          )}

          {/* Locale toggle — desktop only; mobile has it in MobileSearchRow */}
          <div className="hidden md:flex">
            <LocaleToggle />
          </div>

          {/* Sign in always visible; avatar (with its account menu) once auth resolves */}
          {!loading && user ? (
            <div className="relative flex">
              <ProfileAvatarButton user={user} onClick={() => setAvatarMenuOpen((v) => !v)} />
              {avatarMenuOpen && <AvatarDropdown onClose={closeAvatarMenu} />}
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {AUTH_LABELS.signIn}
            </button>
          )}

          {/* More menu — desktop only (mobile has its own new-post/notif/bug-report links in MobileMenu) */}
          <div className="relative hidden md:flex">
            <button
              onClick={() => setMoreMenuOpen((v) => !v)}
              aria-label="More"
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              <Menu size={18} />
              {!loading && user && unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-xs flex items-center justify-center font-bold px-1"
                  style={{ background: "var(--color-like)", color: "#fff", fontSize: "10px" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {moreMenuOpen && <MoreMenuDropdown onClose={closeMoreMenu} locale={locale} />}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-full transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && <MobileMenu onClose={closeMenu} locale={locale} />}
    </header>
  );
}

export default function Header() {
  return (
    <Suspense>
      <HeaderInner />
    </Suspense>
  );
}
