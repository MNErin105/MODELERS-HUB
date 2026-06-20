"use client";

import { X } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

// Auth UI is hardcoded English per spec — Google auth stays English regardless of locale.

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signInWithGoogle } = useAuth();

  if (!isLoginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <h2
            className="text-2xl font-bold tracking-widest mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            MODELERS HUB
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in to share your builds and connect with the community.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0" }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
