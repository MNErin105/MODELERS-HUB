"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

// 3–20 chars, lowercase a–z / 0–9 / underscore only
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function validateUsername(val: string): string | null {
  if (!val)           return "Username is required.";
  if (val.length < 3) return "At least 3 characters required.";
  if (val.length > 20) return "20 characters maximum.";
  if (!USERNAME_RE.test(val)) return "Lowercase letters, numbers, and _ only.";
  return null;
}

type Props = {
  initialName:     string;
  initialBio:      string;
  initialUsername: string;
  onClose:         () => void;
};

export default function ProfileEditModal({ initialName, initialBio, initialUsername, onClose }: Props) {
  const { updateProfile } = useAuth();

  const [name,          setName]          = useState(initialName);
  const [bio,           setBio]           = useState(initialBio);
  const [username,      setUsername]      = useState(initialUsername);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  function handleUsernameChange(raw: string) {
    // Normalize on the way in: lowercase + strip disallowed chars
    const normalized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalized);
    setUsernameError(validateUsername(normalized));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uErr = validateUsername(username);
    if (uErr) { setUsernameError(uErr); return; }
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim(), username });
      onClose();
    } catch (err) {
      console.error("[ProfileEditModal] save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!name.trim() && !validateUsername(username);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 flex flex-col gap-6"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          aria-label="Close"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Display Name ─────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Display Name <span style={{ color: "var(--accent-primary)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              disabled={saving}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-primary)",
                border:     "1px solid var(--border-subtle)",
                color:      "var(--text-primary)",
              }}
            />
          </div>

          {/* ── Username ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Username <span style={{ color: "var(--accent-primary)" }}>*</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                required
                disabled={saving}
                placeholder="your_handle"
                className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-primary)",
                  border:     `1px solid ${usernameError ? "#f87171" : "var(--border-subtle)"}`,
                  color:      "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
            {usernameError ? (
              <p className="text-xs" style={{ color: "#f87171", fontFamily: "var(--font-mono)" }}>
                {usernameError}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                3–20 chars · a–z · 0–9 · _
              </p>
            )}
          </div>

          {/* ── Bio ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
              disabled={saving}
              placeholder="Tell the community about your builds…"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{
                background: "var(--bg-primary)",
                border:     "1px solid var(--border-subtle)",
                color:      "var(--text-primary)",
                lineHeight: 1.6,
              }}
            />
            <p className="text-right text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {bio.length} / 200
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                background: "var(--bg-tertiary)",
                color:      "var(--text-secondary)",
                border:     "1px solid var(--border-subtle)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
