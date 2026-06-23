"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady]                   = useState(false);
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [done, setDone]                     = useState(false);

  useEffect(() => {
    // The Supabase client reads the #access_token fragment on load.
    // onAuthStateChange fires PASSWORD_RECOVERY once the token is exchanged.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the page is loaded with an existing session (already exchanged), also accept it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("パスワードは8文字以上で入力してください"); return; }
    if (password !== confirmPassword) { setError("パスワードが一致しません"); return; }
    setError(null);
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message ?? "パスワードの更新に失敗しました");
      setLoading(false);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 2500);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-bold tracking-widest mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            MODELERS HUB
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            新しいパスワードを設定
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm font-semibold text-center" style={{ color: "var(--text-primary)" }}>
              パスワードを更新しました
            </p>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              まもなくトップページへ移動します…
            </p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              リセットリンクを確認しています…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="新しいパスワード（8文字以上）"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border:     "1px solid var(--border-subtle)",
                  color:      "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワード（確認）"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border:     "1px solid var(--border-subtle)",
                  color:      "var(--text-primary)",
                }}
              />
            </div>

            {error && (
              <p
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              パスワードを更新する
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
