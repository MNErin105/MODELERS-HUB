"use client";

import { useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";

type Mode = "signin" | "signup" | "reset" | "signup_done" | "reset_done";

export default function LoginModal() {
  const t = useTranslations("auth");
  const {
    isLoginModalOpen, closeLoginModal,
    signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword,
  } = useAuth();

  const [mode, setMode]                       = useState<Mode>("signin");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  function handleClose() {
    closeLoginModal();
    setTimeout(() => { setMode("signin"); setEmail(""); setPassword(""); setConfirmPassword(""); setError(null); }, 300);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError(t("passwordTooShort")); return; }
    if (password !== confirmPassword) { setError(t("passwordMismatch")); return; }
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      setMode("signup_done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setMode("reset_done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const subtitle =
    mode === "signup"      ? t("signupSubtitle")    :
    mode === "reset"       ? t("resetSubtitle")     :
    mode === "signup_done" ? t("signupDoneSubtitle"):
    mode === "reset_done"  ? t("resetDoneSubtitle") :
    t("signinSubtitle");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center">
          <h2
            className="text-2xl font-bold tracking-widest mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            MODELERS HUB
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>

        {/* ── SIGN IN ─────────────────────────────────────────────── */}
        {mode === "signin" && (
          <>
            <div className="flex flex-col gap-2">
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0" }}
              >
                <GoogleIcon />
                {t("signInWithGoogle")}
              </button>
              <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("googlePrivacy")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("or")}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            </div>

            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
              <EmailInput value={email} onChange={setEmail} placeholder={t("emailPlaceholder")} />
              <PasswordInput
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                placeholder={t("passwordPlaceholder")}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-xs hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {t("forgotPassword")}
                </button>
              </div>
              {error && <ErrorBanner message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t("signIn")}
              </button>
            </form>

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              {t("noAccount")}{" "}
              <button
                onClick={() => switchMode("signup")}
                className="hover:underline font-semibold"
                style={{ color: "var(--accent-primary)" }}
              >
                {t("signUp")}
              </button>
            </p>
          </>
        )}

        {/* ── SIGN UP ─────────────────────────────────────────────── */}
        {mode === "signup" && (
          <>
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <EmailInput value={email} onChange={setEmail} placeholder={t("emailPlaceholder")} />
              <PasswordInput
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                placeholder={t("passwordMinPlaceholder")}
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                placeholder={t("confirmPasswordPlaceholder")}
                isConfirm
              />
              {error && <ErrorBanner message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t("createAccount")}
              </button>
            </form>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              {t("alreadyHaveAccount")}{" "}
              <button
                onClick={() => switchMode("signin")}
                className="hover:underline font-semibold"
                style={{ color: "var(--accent-primary)" }}
              >
                {t("signIn")}
              </button>
            </p>
          </>
        )}

        {/* ── PASSWORD RESET ──────────────────────────────────────── */}
        {mode === "reset" && (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("resetDescription")}
            </p>
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <EmailInput value={email} onChange={setEmail} placeholder={t("emailPlaceholder")} />
              {error && <ErrorBanner message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t("sendResetEmail")}
              </button>
            </form>
            <button
              onClick={() => switchMode("signin")}
              className="text-xs text-center hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {t("backToSignInLink")}
            </button>
          </>
        )}

        {/* ── SIGNUP DONE ─────────────────────────────────────────── */}
        {mode === "signup_done" && (
          <>
            <div
              className="rounded-xl p-4 text-sm text-center"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t("signupDoneTitle")}
              </p>
              <p>{t("signupDoneBody", { email })}</p>
            </div>
            <button
              onClick={() => switchMode("signin")}
              className="text-xs text-center hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {t("backToSignInLink")}
            </button>
          </>
        )}

        {/* ── RESET DONE ──────────────────────────────────────────── */}
        {mode === "reset_done" && (
          <>
            <div
              className="rounded-xl p-4 text-sm text-center"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t("resetDoneTitle")}
              </p>
              <p>{t("resetDoneBody", { email })}</p>
            </div>
            <button
              onClick={() => switchMode("signin")}
              className="text-xs text-center hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {t("backToSignInLink")}
            </button>
          </>
        )}

        {/* TOS footer */}
        {(mode === "signin" || mode === "signup") && (
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            {t("terms")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmailInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <input
      type="email"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="email"
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
      style={{
        background: "var(--bg-tertiary)",
        border:     "1px solid var(--border-subtle)",
        color:      "var(--text-primary)",
      }}
    />
  );
}

function PasswordInput({
  value, onChange, show, onToggleShow, placeholder, isConfirm,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  isConfirm?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={isConfirm ? "new-password" : "current-password"}
        className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
        style={{
          background: "var(--bg-tertiary)",
          border:     "1px solid var(--border-subtle)",
          color:      "var(--text-primary)",
        }}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
        aria-label={show ? "Hide password" : "Show password"}
        style={{ color: "var(--text-muted)" }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      className="text-xs px-3 py-2 rounded-lg"
      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      {message}
    </p>
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
