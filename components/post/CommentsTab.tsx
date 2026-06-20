"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/lib/types";
import { ChevronDown, ChevronUp, MessageSquare, Send, LogIn, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";
import { supabase } from "@/lib/supabase";
import { fetchComments } from "@/lib/supabase/queries";

type Props = { postId: string };

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ReplyThread({ comment }: { comment: Comment }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("post");

  return (
    <div>
      <div className="flex gap-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5">
          <UserAvatar src={comment.author.avatarUrl} alt={comment.author.name} fill />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {comment.author.name}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {comment.author.country} · {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
            {comment.content}
          </p>

          {comment.replies.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 mt-2 text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-primary)" }}
            >
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {open ? t("comments.hide") : t("comments.view", { count: comment.replies.length })}
              {" "}{comment.replies.length === 1 ? t("comments.reply") : t("comments.replies")}
            </button>
          )}
        </div>
      </div>

      {open && comment.replies.length > 0 && (
        <div className="ml-12 mt-3 flex flex-col gap-3 pl-4" style={{ borderLeft: "2px solid var(--border-subtle)" }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5">
                <UserAvatar src={reply.author.avatarUrl} alt={reply.author.name} fill />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {reply.author.name}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)", fontSize: "10px" }}
                  >
                    {t("comments.authorBadge")}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsTab({ postId }: Props) {
  const t = useTranslations("post");
  const { user, openLoginModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(postId).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, content: newComment.trim() })
      .select("id, content, created_at")
      .single();

    if (!error && data) {
      const added: Comment = {
        id:        data.id as string,
        content:   data.content as string,
        replies:   [],
        createdAt: data.created_at as string,
        author: {
          id:             user.id,
          name:           user.name,
          avatarUrl:      user.avatarUrl,
          country:        user.country,
          bio:            user.bio,
          followersCount: 0,
          followingCount: 0,
        },
      };
      setComments((prev) => [...prev, added]);
      setNewComment("");
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <MessageSquare size={18} style={{ color: "var(--accent-primary)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("comments.count", { count: comments.length })}
        </h2>
      </div>

      {/* Comment form */}
      <div className="mb-8">
        {user ? (
          <form onSubmit={handleSubmit}>
            <div
              className="flex gap-3 p-4 rounded-xl"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                <UserAvatar src={user.avatarUrl} alt={user.name} fill />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t("comments.placeholder")}
                  rows={3}
                  className="w-full bg-transparent text-sm resize-none outline-none"
                  style={{ color: "var(--text-primary)" }}
                  aria-label={t("comments.ariaLabel")}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {t("comments.post")}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-3 py-6 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border-muted)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("comments.loginPrompt")}
            </p>
            <button
              onClick={openLoginModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              <LogIn size={14} /> {t("comments.loginButton")}
            </button>
          </div>
        )}
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ color: "var(--text-muted)" }}>{t("comments.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <ReplyThread comment={comment} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
