"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Post } from "@/lib/types";
import TagBadge from "@/components/ui/TagBadge";
import SaveButton from "@/components/ui/SaveButton";
import LikeButton from "@/components/ui/LikeButton";
import FollowButton from "@/components/ui/FollowButton";
import ImageLightbox from "@/components/ui/ImageLightbox";
import UserAvatar from "@/components/ui/UserAvatar";
import { categorySlug } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { translateTag } from "@/lib/tagTranslations";

type Props = { post: Post };

export default function WorksTab({ post }: Props) {
  const t = useTranslations("post");
  const locale = useLocale();
  const { user } = useAuth();
  const isAuthor = !!user && user.id === post.author.id;

  const [activeIdx, setActiveIdx]       = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = post.images[activeIdx];

  if (post.images.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 flex items-center justify-center rounded-xl" style={{ aspectRatio: "4/3", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No images</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* ── Left: Gallery ─────────────────────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <div
          className="relative w-full rounded-xl overflow-hidden"
          onClick={() => setLightboxOpen(true)}
          style={{ background: "var(--bg-overlay)", cursor: "zoom-in" }}
        >
          <Image
            key={active.url}
            src={active.url}
            alt={active.caption}
            width={800}
            height={600}
            loading="eager"
            preload={activeIdx === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="w-full h-auto block"
          />
          {/* Caption */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-2 text-sm"
            style={{ background: "rgba(10,10,11,0.7)", color: "var(--text-secondary)" }}
          >
            {active.caption}
          </div>
          {/* Counter badge */}
          <div
            className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-mono"
            style={{ background: "rgba(10,10,11,0.7)", color: "var(--text-muted)" }}
          >
            {activeIdx + 1} / {post.images.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {post.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="relative shrink-0 rounded-lg overflow-hidden transition-all"
              style={{
                width: 72, height: 72,
                border: `2px solid ${i === activeIdx ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                background: "var(--bg-overlay)",
              }}
              aria-label={`View ${img.caption}`}
            >
              <Image
                src={img.url}
                alt={img.caption}
                fill
                loading="lazy"
                sizes="72px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Metadata ───────────────────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Category */}
        <Link
          href={`/category/${categorySlug(post.category)}`}
          className="inline-block w-fit px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80"
          style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
        >
          {post.category}
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {post.title}
        </h1>

        {/* Author row + Follow */}
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
              <UserAvatar src={post.author.avatarUrl} alt={post.author.name} fill />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:underline" style={{ color: "var(--text-primary)" }}>
                {post.author.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {post.author.country}
              </p>
            </div>
          </Link>
          <div className="ml-auto">
            <FollowButton authorId={post.author.id} followersCount={post.author.followersCount} />
          </div>
        </div>

        {/* Description */}
        <div
          className="p-4 rounded-xl text-sm leading-relaxed"
          style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {post.description}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} label={translateTag(tag, locale)} size="md" />
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div
          className="flex items-center gap-1 p-2 rounded-xl"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
        >
          <SaveButton postId={post.id} count={post.saveCount} />
          <LikeButton postId={post.id} count={post.likeCount} />
          <div className="ml-auto flex items-center gap-3">
            {isAuthor && (
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-tertiary)",
                  border:     "1px solid var(--border-subtle)",
                  color:      "var(--text-secondary)",
                }}
              >
                <Pencil size={12} />
                {t("edit")}
              </Link>
            )}
            <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Build metadata */}
        <BuildMetaCard label="Kit" value={post.kit} mono />
        <BuildMetaCard label="Paints" chips={post.paints} chipColor="var(--accent-muted)" chipText="var(--accent-primary)" />
        <BuildMetaCard label="Tools" chips={post.tools} chipColor="var(--bg-tertiary)" chipText="var(--text-secondary)" />
        <BuildMetaCard label="Techniques" chips={post.techniques} chipColor="var(--color-tag)" chipText="var(--color-tag-text)" />
      </div>
    </div>

    {lightboxOpen && (
      <ImageLightbox
        images={post.images}
        initialIndex={activeIdx}
        onClose={() => setLightboxOpen(false)}
      />
    )}
    </>
  );
}

function BuildMetaCard({
  label, value, chips, mono, chipColor, chipText,
}: {
  label: string; value?: string; chips?: string[];
  mono?: boolean; chipColor?: string; chipText?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      {value && (
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : undefined }}>
          {value}
        </p>
      )}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className="inline-block px-2.5 py-1 rounded text-xs font-medium"
              style={{ background: chipColor, color: chipText }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
