"use client";

import { useState, useEffect } from "react";
import { X, AtSign, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { validateUsernameFormat } from "@/lib/users";

// All text in this component is hardcoded English per spec —
// Google auth UI is English-only regardless of site locale.

const COUNTRIES = ["JP", "US", "DE", "GB", "FR", "KR", "CN", "AU", "CA", "IT", "RU", "Other"];

type UsernameStatus = "idle" | "valid" | "taken" | "short" | "long" | "invalid_chars";

function usernameStatusMsg(status: UsernameStatus, username: string): string | null {
  switch (status) {
    case "valid":         return `@${username} is available`;
    case "taken":         return `@${username} is already taken`;
    case "short":         return "Username must be at least 3 characters";
    case "long":          return "Username must be 20 characters or fewer";
    case "invalid_chars": return "Only lowercase letters, numbers, _ and - are allowed";
    default:              return null;
  }
}

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signIn, isUsernameAvailable } = useAuth();
  const [step,    setStep]    = useState<"initial" | "form">("initial");
  const [name,    setName]    = useState("");
  const [handle,  setHandle]  = useState("");
  const [country, setCountry] = useState("JP");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  useEffect(() => {
    if (isLoginModalOpen) {
      setStep("initial");
      setName("");
      setHandle("");
      setCountry("JP");
      setUsernameStatus("idle");
    }
  }, [isLoginModalOpen]);

  // Live username validation
  useEffect(() => {
    if (!handle) { setUsernameStatus("idle"); return; }
    const fmt = validateUsernameFormat(handle);
    if (fmt !== "ok") { setUsernameStatus(fmt); return; }
    setUsernameStatus(isUsernameAvailable(handle) ? "valid" : "taken");
  }, [handle, isUsernameAvailable]);

  if (!isLoginModalOpen) return null;

  const canSubmit = name.trim() && usernameStatus === "valid";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    signIn(name.trim(), handle, country);
  }

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
        {/* Close */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        {/* Logo + title */}
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

        {step === "initial" ? (
          <button
            onClick={() => setStep("form")}
            className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0" }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Demo notice */}
            <p
              className="text-xs text-center px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-muted)", color: "var(--text-muted)" }}
            >
              Demo mode — enter your profile details to get started.
            </p>

            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanaka Gunpla"
                autoFocus
                maxLength={40}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              />
            </div>

            {/* @Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Username
              </label>
              <div className="relative">
                <AtSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="your_handle"
                  maxLength={20}
                  className="w-full pl-8 pr-9 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: `1px solid ${usernameStatus === "valid" ? "#34d399" : usernameStatus !== "idle" ? "#f87171" : "var(--border-subtle)"}`,
                    color: "var(--text-primary)",
                  }}
                />
                {usernameStatus === "valid" && (
                  <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#34d399" }} />
                )}
                {usernameStatus !== "idle" && usernameStatus !== "valid" && (
                  <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#f87171" }} />
                )}
              </div>
              {usernameStatus !== "idle" && (
                <p
                  className="text-xs"
                  style={{ color: usernameStatus === "valid" ? "#34d399" : "#f87171", fontFamily: "var(--font-mono)" }}
                >
                  {usernameStatusMsg(usernameStatus, handle)}
                </p>
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                3–20 chars · a–z, 0–9, _ or -
              </p>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              Start Using Modelers Hub
            </button>
          </form>
        )}

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
