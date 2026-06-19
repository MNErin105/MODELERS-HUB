"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { PlusSquare, Bell, Menu, X, LogOut, User, Heart, MessageSquare, UserPlus, Info, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/ui/SearchBar";
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

// ── Locale toggle ─────────────────────────────────────────────────────────────

function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex items-center gap-1 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
      <button
        onClick={() => setLocale("en")}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === "en" ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: locale === "en" ? 600 : 400 }}
        aria-label="Switch to English"
      >EN</button>
      <span style={{ color: "var(--border-muted)" }}>|</span>
      <button
        onClick={() => setLocale("ja")}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === "ja" ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: locale === "ja" ? 600 : 400 }}
        aria-label="Switch to Japanese"
      >JP</button>
    </div>
  );
}

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
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent-primary)" }}
          >
            <CheckCheck size={12} /> {t("markAllRead")}
          </button>
        )}
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
        href="/profile/self"
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

// ── Mobile menu ───────────────────────────────────────────────────────────────

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, openLoginModal, signOut } = useAuth();
  const t = useTranslations("nav");

  return (
    <div
      className="absolute left-0 right-0 top-full shadow-2xl z-[90]"
      style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col gap-4">
        <SearchBar />

        <div className="flex flex-col gap-1">
          <Link
            href="/posts/new"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-fit"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            <PlusSquare size={15} /> {t("newPost")}
          </Link>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden" style={{ border: "2px solid var(--accent-muted)" }}>
                  <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" sizes="32px" unoptimized />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                  <Link href="/mypage" onClick={onClose} className="text-xs hover:opacity-80" style={{ color: "var(--accent-primary)" }}>
                    {AUTH_LABELS.myPage}
                  </Link>
                </div>
              </div>
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-1.5 text-sm hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                <LogOut size={14} /> {AUTH_LABELS.signOut}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { openLoginModal(); onClose(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-fit"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
            >
              {AUTH_LABELS.signIn}
            </button>
          )}
          <div className="mt-3">
            <LocaleToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main header inner ─────────────────────────────────────────────────────────

function HeaderInner() {
  const { user, loading, openLoginModal } = useAuth();
  const { unreadCount } = useNotifications();
  const t = useTranslations("nav");

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const closeMenu  = useCallback(() => setMenuOpen(false),  []);

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
            width={90}
            height={75}
            className="w-[90px] h-auto object-contain transition-all hover:opacity-90 hover:scale-[1.02] cursor-pointer select-none"
          />
        </Link>

        {/* Search (hidden on mobile — shown in mobile menu) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 shrink-0">

          {/* Desktop: Post + locale toggle + auth */}
          {!loading && (
            <>
              {/* Post button — desktop */}
              <Link
                href="/posts/new"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                aria-label={t("newPost")}
              >
                <PlusSquare size={15} />
                <span>{t("newPost")}</span>
              </Link>

              {/* Locale toggle — desktop only */}
              <div className="hidden md:flex">
                <LocaleToggle />
              </div>

              {/* Notification bell */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label="Notifications"
                    className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-xs flex items-center justify-center font-bold px-1"
                        style={{ background: "var(--color-like)", color: "#fff", fontSize: "10px" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && <NotificationDropdown onClose={closeNotif} />}
                </div>
              )}

              {/* Auth: logged in → profile icon; logged out → Sign in button */}
              {user ? (
                <div className="hidden md:block">
                  <ProfileAvatarButton user={user} />
                </div>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {AUTH_LABELS.signIn}
                </button>
              )}
            </>
          )}

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
      {menuOpen && <MobileMenu onClose={closeMenu} />}
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
