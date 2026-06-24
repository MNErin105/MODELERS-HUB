"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, AlertCircle, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { Post } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORY_TO_DB } from "@/lib/supabase/queries";
import { buildSuggestions } from "@/lib/tagTranslations";
import ImageUploadZone from "./ImageUploadZone";
import ImagePreviewGrid, { UploadedImage } from "./ImagePreviewGrid";
import TagInput from "./TagInput";
import PaintTagInput from "./PaintTagInput";

// ── Suggested tag values (English — stored in DB) ─────────────────────────────
const TOOL_VALUES = [
  "Airbrush", "Hand-brushed", "Decals", "Pla-plate", "Photo-etch",
  "LED integration", "Soldering",
];
const TECHNIQUE_VALUES = [
  "Weathering", "Chipping", "Drybrushing", "Panel Lining", "Salt weathering",
  "Hair spray technique", "Oil dot filtering", "Pin wash", "NMM", "OSL",
  "Zenithal priming", "Pre-shading", "Post-shading", "Scribing", "Masking",
];

function uid() { return Math.random().toString(36).slice(2, 10); }

function fileExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "jpg";
}

// Extract the storage path segment from a Supabase public URL.
// URL shape: .../storage/v1/object/public/post-images/{path}
function storagePathFromUrl(url: string): string | null {
  const marker = "/post-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2
          className="text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
          style={{ color: accent ? "var(--accent-primary)" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {label}{required && <span style={{ color: "var(--accent-primary)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "#f87171" }}>
      <AlertCircle size={12} /> {msg}
    </p>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors";
const inputStyle = {
  background: "var(--bg-secondary)",
  border:     "1px solid var(--border-subtle)",
  color:      "var(--text-primary)",
};

// ── Main form ─────────────────────────────────────────────────────────────────
export default function EditPostForm({ post }: { post: Post }) {
  const t      = useTranslations("newPost");
  const tc     = useTranslations("category");
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  const toolSuggestions      = useMemo(() => buildSuggestions(TOOL_VALUES,      locale), [locale]);
  const techniqueSuggestions = useMemo(() => buildSuggestions(TECHNIQUE_VALUES, locale), [locale]);

  // ── Pre-fill from existing post ─────────────────────────────────────────────
  const [title,       setTitle]       = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [category,    setCategory]    = useState<Category>(post.category);
  const [kit,         setKit]         = useState(post.kit);
  const [paints,      setPaints]      = useState<string[]>(post.paints);
  const [tools,       setTools]       = useState<string[]>(post.tools);
  const [techniques,  setTechniques]  = useState<string[]>(post.techniques);
  const [tags,        setTags]        = useState<string[]>(post.tags);

  // Existing images: use the storage URL itself as the stable id
  const [coverImages, setCoverImages] = useState<UploadedImage[]>(() =>
    post.images.map((img) => ({
      id:      img.url,
      url:     img.url,
      caption: img.caption,
    })),
  );

  // Track which image ids are pre-existing (already in storage)
  const existingImageIds = useRef(new Set(post.images.map((img) => img.url)));
  // New files added during this edit session
  const coverFileMap = useRef(new Map<string, File>());

  // Form state
  const [submitting,         setSubmitting]         = useState(false);
  const [submitError,        setSubmitError]        = useState<string | null>(null);
  const [errors,             setErrors]             = useState<Record<string, string>>({});
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [deleteError,        setDeleteError]        = useState<string | null>(null);

  // ── Image handlers ──────────────────────────────────────────────────────────
  const addCoverImages = useCallback((files: File[]) => {
    const newPreviews = files.map((file) => {
      const id      = uid();
      const preview: UploadedImage = { id, url: URL.createObjectURL(file), caption: "" };
      coverFileMap.current.set(id, file);
      return preview;
    });
    setCoverImages((prev) => [...prev, ...newPreviews].slice(0, 20));
  }, []);

  const reorderImages = useCallback((imgs: UploadedImage[]) => setCoverImages(imgs), []);
  const deleteImage   = useCallback((id: string) => {
    coverFileMap.current.delete(id);
    setCoverImages((p) => p.filter((i) => i.id !== id));
  }, []);
  const updateCaption = useCallback((id: string, cap: string) =>
    setCoverImages((p) => p.map((i) => i.id === id ? { ...i, caption: cap } : i)), []);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim())            e.title       = t("errors.title");
    if (!description.trim())      e.description = t("errors.description");
    if (coverImages.length === 0) e.images      = t("errors.images");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const postId = post.id;

      // 1. UPDATE posts row
      const { error: postError } = await supabase
        .from("posts")
        .update({
          title:       title.trim(),
          description: description.trim(),
          category:    CATEGORY_TO_DB[category] ?? "other",
          kit_name:    kit.trim() || null,
        })
        .eq("id", postId);

      if (postError) throw new Error(postError.message ?? "Failed to update post.");

      // 2. Resolve final image list (upload new, keep existing)
      type FinalImg = { url: string; caption: string };
      const finalImages: FinalImg[] = [];

      for (let i = 0; i < coverImages.length; i++) {
        const img = coverImages[i];

        if (existingImageIds.current.has(img.id)) {
          finalImages.push({ url: img.url, caption: img.caption });
        } else {
          const file = coverFileMap.current.get(img.id);
          if (!file) continue;
          const path = `${user.id}/${postId}-edit-${uid()}.${fileExt(file)}`;
          const { error: upErr } = await supabase.storage
            .from("post-images")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw new Error(upErr.message ?? "Image upload failed.");
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
          finalImages.push({ url: urlData.publicUrl, caption: img.caption });
        }
      }

      // 3. Replace post_images
      await supabase.from("post_images").delete().eq("post_id", postId);
      if (finalImages.length > 0) {
        await supabase.from("post_images").insert(
          finalImages.map((img, i) => ({
            post_id:    postId,
            image_url:  img.url,
            caption:    img.caption || null,
            sort_order: i,
          })),
        );
      }

      // 4. Replace post_tags
      await supabase.from("post_tags").delete().eq("post_id", postId);
      for (const tagName of tags) {
        const normalized = tagName.trim();
        if (!normalized) continue;
        await supabase
          .from("tags")
          .upsert({ name: normalized }, { onConflict: "name", ignoreDuplicates: true });
        const { data: tagRow } = await supabase
          .from("tags")
          .select("id")
          .eq("name", normalized)
          .single();
        if (tagRow?.id) {
          await supabase.from("post_tags").insert({ post_id: postId, tag_id: tagRow.id });
        }
      }

      // 5. Replace post_paints
      await supabase.from("post_paints").delete().eq("post_id", postId);
      if (paints.length > 0) {
        await supabase.from("post_paints").insert(
          paints.map((name) => ({ post_id: postId, paint_name: name })),
        );
      }

      // 6. Replace post_tools
      await supabase.from("post_tools").delete().eq("post_id", postId);
      if (tools.length > 0) {
        await supabase.from("post_tools").insert(
          tools.map((name) => ({ post_id: postId, tool_name: name })),
        );
      }

      // 7. Replace post_techniques
      await supabase.from("post_techniques").delete().eq("post_id", postId);
      if (techniques.length > 0) {
        await supabase.from("post_techniques").insert(
          techniques.map((name) => ({ post_id: postId, technique_name: name })),
        );
      }

      router.push(`/posts/${postId}`);
      router.refresh();
    } catch (err) {
      console.error("[EditPostForm] submit error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save changes.");
      setSubmitting(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const postId = post.id;

      // 1. Collect all storage paths: cover images + build journal images
      const coverUrls = post.images.map((img) => img.url);

      const { data: journalRows } = await supabase
        .from("build_journal_entries")
        .select("image_url")
        .eq("post_id", postId)
        .not("image_url", "is", null);

      const journalUrls = (journalRows ?? [])
        .map((r) => r.image_url as string)
        .filter(Boolean);

      const storagePaths = [...coverUrls, ...journalUrls]
        .map(storagePathFromUrl)
        .filter((p): p is string => !!p);

      // 2. Delete from Storage (best-effort — don't throw if some files are missing)
      if (storagePaths.length > 0) {
        await supabase.storage.from("post-images").remove(storagePaths);
      }

      // 3. Delete the post — all related rows cascade automatically:
      //    post_images, post_tags, post_paints, build_journal_entries,
      //    comments, likes, bookmarks all have ON DELETE CASCADE
      const { error: deleteErr } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (deleteErr) throw new Error(deleteErr.message ?? "Failed to delete post.");

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("[EditPostForm] delete error:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete post.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Unauthorized guard ───────────────────────────────────────────────────────
  if (user && user.id !== post.author.id) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>この投稿を編集する権限がありません。</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-10">
          <Link
            href={`/posts/${post.id}`}
            className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={16} /> {t("back")}
          </Link>
          <h1
            className="text-4xl font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            EDIT POST
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">

          {/* ── Images ───────────────────────────────────────────────────── */}
          <Section title={t("sections.photos")} accent>
            <ImageUploadZone onFilesAdded={addCoverImages} currentCount={coverImages.length} max={20} />
            <ImagePreviewGrid
              images={coverImages}
              onReorder={reorderImages}
              onDelete={deleteImage}
              onCaptionChange={updateCaption}
            />
            {errors.images && <FieldError msg={errors.images} />}
            {coverImages.length > 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {t("imageOrderHint")}
              </p>
            )}
          </Section>

          {/* ── Core info ────────────────────────────────────────────────── */}
          <Section title={t("sections.about")}>
            <Field label={t("fields.title")} required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("placeholders.title")}
                maxLength={120}
                className={inputCls}
                style={inputStyle}
              />
              {errors.title && <FieldError msg={errors.title} />}
            </Field>

            <Field label={t("fields.description")} required>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("placeholders.description")}
                rows={4}
                className={inputCls}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
              />
              {errors.description && <FieldError msg={errors.description} />}
            </Field>

            <Field label={t("fields.category")} required>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: category === cat ? "var(--accent-primary)" : "var(--bg-secondary)",
                      color:      category === cat ? "var(--bg-primary)"     : "var(--text-secondary)",
                      border:     `1px solid ${category === cat ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <span>{CATEGORY_META[cat].icon}</span>
                    {tc(`names.${cat.replace(/\s+/g, "_")}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("fields.kit")}>
              <input
                type="text"
                value={kit}
                onChange={(e) => setKit(e.target.value)}
                placeholder={t("placeholders.kit")}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </Section>

          {/* ── Materials ────────────────────────────────────────────────── */}
          <Section title={t("sections.materials")}>
            <PaintTagInput label={t("fields.paints")} value={paints} onChange={setPaints} placeholder={t("placeholders.paints")} />
            <TagInput label={t("fields.tools")}      value={tools}      onChange={setTools}      placeholder={t("placeholders.tools")}      suggestions={toolSuggestions} />
            <TagInput label={t("fields.techniques")} value={techniques} onChange={setTechniques} placeholder={t("placeholders.techniques")} suggestions={techniqueSuggestions} />
          </Section>

          {/* ── Tags ─────────────────────────────────────────────────────── */}
          <Section title={t("sections.tags")}>
            <TagInput
              label={t("fields.tags")}
              value={tags}
              onChange={setTags}
              placeholder={t("placeholders.tags")}
              max={15}
            />
          </Section>

          {submitError && (
            <p className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={14} /> {submitError}
            </p>
          )}

          {deleteError && (
            <p className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={14} /> {deleteError}
            </p>
          )}

          {/* ── Bottom action bar ────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between gap-4 pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            {/* Left: Cancel + Delete */}
            <div className="flex items-center gap-3">
              <Link
                href={`/posts/${post.id}`}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-secondary)",
                  color:      "var(--text-secondary)",
                  border:     "1px solid var(--border-subtle)",
                }}
              >
                {t("cancel")}
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color:      "#f87171",
                  border:     "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <Trash2 size={14} />
                {t("deletePost")}
              </button>
            </div>

            {/* Right: Save */}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "var(--accent-primary)",
                color:      "var(--bg-primary)",
                opacity:    submitting ? 0.6 : 1,
              }}
            >
              <Save size={15} />
              {submitting ? t("submitting") : "Save Changes"}
            </button>
          </div>

        </form>
      </div>

      {/* ── Delete confirmation dialog ──────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false); }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Close */}
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity disabled:pointer-events-none"
              aria-label="Close"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>

            {/* Icon + title */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <Trash2 size={22} style={{ color: "#f87171" }} />
              </div>
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {t("deleteConfirmBody")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: "var(--bg-tertiary)",
                  color:      "var(--text-secondary)",
                  border:     "1px solid var(--border-subtle)",
                }}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {deleting ? (
                  <>{t("deleting")}</>
                ) : (
                  <><Trash2 size={14} /> {t("deleteConfirm")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
