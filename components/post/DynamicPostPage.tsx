"use client";

import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/context/AppContext";
import PostDetailClient from "./PostDetailClient";

type Props = { id: string };

export default function DynamicPostPage({ id }: Props) {
  const t          = useTranslations("newPost");
  const tc         = useTranslations("category");
  const { userPosts } = useApp();
  const post = userPosts.find((p) => p.id === id);

  if (typeof window === "undefined") {
    return <PostShell />;
  }

  if (!post) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <div className="max-w-[1440px] mx-auto px-6 py-16 flex flex-col items-center gap-6">
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            {t("notFound")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm hover:opacity-80"
            style={{ color: "var(--accent-primary)" }}
          >
            <ChevronLeft size={16} /> {tc("backToArchive")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PostDetailClient
      post={post}
      buildSteps={post.buildSteps ?? []}
      comments={[]}
    />
  );
}

function PostShell() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
    >
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}
