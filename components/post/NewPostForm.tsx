"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";
import { buildSuggestions } from "@/lib/tagTranslations";
import { CATEGORY_META } from "@/lib/types";
import { prepareFile, StoredFile } from "@/lib/imageUtils";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { CATEGORY_TO_DB } from "@/lib/supabase/queries";
import ImageUploadZone from "./ImageUploadZone";
import ImagePreviewGrid, { UploadedImage } from "./ImagePreviewGrid";
import WIPStepEditor, { WIPStep } from "./WIPStepEditor";
import TagInput from "./TagInput";
import PaintTagInput from "./PaintTagInput";

// ── Suggested tag values (stored in DB as English) ───────────────────────────
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

function createPreview(file: File): UploadedImage {
  return { id: uid(), url: URL.createObjectURL(file), caption: "" };
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
export default function NewPostForm() {
  const t      = useTranslations("newPost");
  const tc     = useTranslations("category");
  const ta     = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const { user, openLoginModal } = useAuth();

  const toolSuggestions      = useMemo(() => buildSuggestions(TOOL_VALUES,      locale), [locale]);
  const techniqueSuggestions = useMemo(() => buildSuggestions(TECHNIQUE_VALUES, locale), [locale]);

  // Core fields
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<Category>("Gunpla");
  const [kit,         setKit]         = useState("");

  // Tags / materials
  const [paints,     setPaints]     = useState<string[]>([]);
  const [tools,      setTools]      = useState<string[]>([]);
  const [techniques, setTechniques] = useState<string[]>([]);
  const [tags,       setTags]       = useState<string[]>([]);

  // Images — preview objects in state, StoredFile (ArrayBuffer) in ref map
  const [coverImages, setCoverImages] = useState<UploadedImage[]>([]);
  const coverFileMap = useRef(new Map<string, StoredFile>());

  // WIP
  const [hasWIP,   setHasWIP]   = useState(false);
  const [wipSteps, setWipSteps] = useState<WIPStep[]>([
    { id: uid(), title: "", description: "", images: [] },
  ]);
  const wipFileMap = useRef(new Map<string, StoredFile>());

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors,      setErrors]     = useState<Record<string, string>>({});

  // ── Image handlers ──────────────────────────────────────────────────────────
  const addCoverImages = useCallback(async (files: File[]) => {
    const entries = await Promise.all(
      files.map(async (file) => {
        const { previewUrl, stored } = await prepareFile(file);
        const preview: UploadedImage = { id: uid(), url: previewUrl, caption: "" };
        coverFileMap.current.set(preview.id, stored);
        return preview;
      }),
    );
    setCoverImages((prev) => [...prev, ...entries].slice(0, 20));
  }, []);

  const reorderImages  = useCallback((imgs: UploadedImage[]) => setCoverImages(imgs), []);
  const deleteImage    = useCallback((id: string) => {
    coverFileMap.current.delete(id);
    setCoverImages((p) => p.filter((i) => i.id !== id));
  }, []);
  const updateCaption  = useCallback((id: string, cap: string) =>
    setCoverImages((p) => p.map((i) => i.id === id ? { ...i, caption: cap } : i)), []);

  // ── WIP handlers ────────────────────────────────────────────────────────────
  function addStep() { setWipSteps((p) => [...p, { id: uid(), title: "", description: "", images: [] }]); }
  function removeStep(id: string) { setWipSteps((p) => p.filter((s) => s.id !== id)); }

  function updateStepField(id: string, field: "title" | "description", value: string) {
    setWipSteps((p) => p.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  async function addStepImages(stepId: string, files: File[]) {
    const entries = await Promise.all(
      files.map(async (file) => {
        const { previewUrl, stored } = await prepareFile(file);
        const preview: UploadedImage = { id: uid(), url: previewUrl, caption: "" };
        wipFileMap.current.set(preview.id, stored);
        return preview;
      }),
    );
    setWipSteps((p) => p.map((s) => {
      if (s.id !== stepId) return s;
      return { ...s, images: [...s.images, ...entries].slice(0, 5) };
    }));
  }

  function removeStepImage(stepId: string, imgId: string) {
    wipFileMap.current.delete(imgId);
    setWipSteps((p) => p.map((s) =>
      s.id === stepId ? { ...s, images: s.images.filter((i) => i.id !== imgId) } : s
    ));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim())            e.title       = t("errors.title");
    if (!description.trim())      e.description = t("errors.description");
    if (coverImages.length === 0) e.images      = t("errors.images");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Verify the session is still active before any DB writes.
      // A session can expire while the user is filling out the form.
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[NewPostForm] session uid:", session?.user?.id, "/ user.id:", user.id);
      if (!session?.user) {
        throw new Error("セッションが期限切れです。再度ログインしてから投稿してください。");
      }

      // 1. INSERT post row to get the UUID
      const { data: postRow, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id:     user.id,
          title:       title.trim(),
          description: description.trim(),
          category:    CATEGORY_TO_DB[category] ?? "other",
          kit_name:    kit.trim() || null,
        })
        .select("id")
        .single();

      if (postError || !postRow) {
        throw new Error((postError as { message?: string })?.message ?? "Failed to create post.");
      }

      const postId = postRow.id as string;

      // 2. Upload cover images
      const imageUrls: string[] = [];
      for (let i = 0; i < coverImages.length; i++) {
        const img    = coverImages[i];
        const stored = coverFileMap.current.get(img.id);
        if (!stored) throw new Error("画像の参照が失われました。もう一度画像を選択してください。");
        const path = `${user.id}/${postId}-${i}.${stored.ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, stored.buffer, { contentType: stored.contentType, upsert: false });
        if (upErr) throw new Error((upErr as { message?: string })?.message ?? "Image upload failed.");
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      // 3. INSERT post_images
      if (imageUrls.length > 0) {
        const imageRows = coverImages.map((img, i) => ({
          post_id:    postId,
          image_url:  imageUrls[i] ?? "",
          caption:    img.caption.trim() || null,
          sort_order: i,
        })).filter((r) => r.image_url);
        await supabase.from("post_images").insert(imageRows);
      }

      // 4. Tags — insert-or-ignore, then SELECT to get id
      // ignoreDuplicates:true generates DO NOTHING (no UPDATE policy needed on tags table)
      if (tags.length > 0) {
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
      }

      // 5. Paints
      if (paints.length > 0) {
        await supabase.from("post_paints").insert(
          paints.map((name) => ({ post_id: postId, paint_name: name }))
        );
      }

      // 6. Tools
      if (tools.length > 0) {
        await supabase.from("post_tools").insert(
          tools.map((name) => ({ post_id: postId, tool_name: name }))
        );
      }

      // 7. Techniques
      if (techniques.length > 0) {
        await supabase.from("post_techniques").insert(
          techniques.map((name) => ({ post_id: postId, technique_name: name }))
        );
      }

      // 8. WIP journal entries
      if (hasWIP) {
        const validSteps = wipSteps.filter((s) => s.title.trim());
        for (let i = 0; i < validSteps.length; i++) {
          const step = validSteps[i];
          let stepImageUrl: string | null = null;

          // Upload the first WIP image for this step
          const firstImg = step.images[0];
          if (firstImg) {
            const wipStored = wipFileMap.current.get(firstImg.id);
            if (wipStored) {
              const wipPath = `${user.id}/${postId}-wip-${i}.${wipStored.ext}`;
              const { error: wipErr } = await supabase.storage
                .from("post-images")
                .upload(wipPath, wipStored.buffer, { contentType: wipStored.contentType, upsert: false });
              if (!wipErr) {
                const { data: wipUrlData } = supabase.storage.from("post-images").getPublicUrl(wipPath);
                stepImageUrl = wipUrlData.publicUrl;
              }
            }
          }

          await supabase.from("build_journal_entries").insert({
            post_id:    postId,
            title:      step.title.trim(),
            content:    step.description.trim() || null,
            image_url:  stepImageUrl,
            sort_order: i,
          });
        }
      }

      router.push(`/posts/${postId}`);
    } catch (err) {
      console.error("[NewPostForm] submit error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to publish post.");
      setSubmitting(false);
    }
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>{ta("loginRequired")}</p>
        <button
          onClick={openLoginModal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          {ta("login")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={16} /> {t("back")}
          </Link>
          <h1
            className="text-4xl font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("pageTitle")}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</p>
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

          {/* ── WIP ──────────────────────────────────────────────────────── */}
          <Section title={t("sections.wip")}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHasWIP((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: hasWIP ? "var(--accent-primary)" : "var(--text-secondary)" }}
              >
                {hasWIP
                  ? <ToggleRight size={22} style={{ color: "var(--accent-primary)" }} />
                  : <ToggleLeft  size={22} style={{ color: "var(--text-muted)" }} />}
                {t("wip.toggle")}
              </button>
            </div>

            {hasWIP && (
              <WIPStepEditor
                steps={wipSteps}
                onAdd={addStep}
                onRemove={removeStep}
                onUpdateField={updateStepField}
                onAddImages={addStepImages}
                onRemoveImage={removeStepImage}
              />
            )}
          </Section>

          {submitError && (
            <p className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={14} /> {submitError}
            </p>
          )}

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between gap-4 pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <Link
              href="/"
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
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "var(--accent-primary)",
                color:      "var(--bg-primary)",
                opacity:    submitting ? 0.6 : 1,
              }}
            >
              <Send size={15} />
              {submitting ? t("submitting") : t("submit")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
