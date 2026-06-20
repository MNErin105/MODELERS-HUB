"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CATEGORIES, Category, BuildStep } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import { useAuth, authUserToAuthor } from "@/lib/context/AuthContext";
import ImageUploadZone from "./ImageUploadZone";
import ImagePreviewGrid, { UploadedImage } from "./ImagePreviewGrid";
import WIPStepEditor, { WIPStep } from "./WIPStepEditor";
import TagInput from "./TagInput";

// ── Suggested tags (technical proper nouns — kept in English for both locales) ─
const PAINT_SUGGESTIONS = [
  "Mr. Color", "Gaia Notes", "Tamiya Acrylic", "Vallejo", "Finisher's",
  "Mr. Surfacer", "AK Interactive", "Ammo by Mig", "Citadel", "Oil Paint",
];
const TOOL_SUGGESTIONS = [
  "Airbrush", "Hand-brushed", "Decals", "Pla-plate", "Photo-etch",
  "LED integration", "Soldering",
];
const TECHNIQUE_SUGGESTIONS = [
  "Weathering", "Chipping", "Drybrushing", "Panel Lining", "Salt weathering",
  "Hair spray technique", "Oil dot filtering", "Pin wash", "NMM", "OSL",
  "Zenithal priming", "Pre-shading", "Post-shading", "Scribing", "Masking",
];

function uid() { return Math.random().toString(36).slice(2, 10); }

function createObjectURL(file: File): UploadedImage {
  return { id: uid(), url: URL.createObjectURL(file), caption: "", authorComment: "" };
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
  const t       = useTranslations("newPost");
  const tc      = useTranslations("category");
  const ta      = useTranslations("auth");
  const router  = useRouter();
  const { addPost } = useApp();
  const { user, openLoginModal } = useAuth();

  // Core fields
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<Category>("Gunpla");
  const [kit,         setKit]         = useState("");

  // Tags
  const [paints,     setPaints]     = useState<string[]>([]);
  const [tools,      setTools]      = useState<string[]>([]);
  const [techniques, setTechniques] = useState<string[]>([]);
  const [tags,       setTags]       = useState<string[]>([]);

  // Images
  const [coverImages, setCoverImages] = useState<UploadedImage[]>([]);

  // WIP
  const [hasWIP,    setHasWIP]    = useState(false);
  const [wipSteps,  setWipSteps]  = useState<WIPStep[]>([
    { id: uid(), title: "", description: "", images: [] },
  ]);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  // ── Image handlers ──────────────────────────────────────────────────────────
  const addCoverImages = useCallback((files: File[]) => {
    setCoverImages((prev) => [...prev, ...files.map(createObjectURL)].slice(0, 20));
  }, []);

  const reorderImages = useCallback((imgs: UploadedImage[]) => setCoverImages(imgs), []);
  const deleteImage   = useCallback((id: string) => setCoverImages((p) => p.filter((i) => i.id !== id)), []);
  const updateCaption = useCallback((id: string, cap: string) =>
    setCoverImages((p) => p.map((i) => i.id === id ? { ...i, caption: cap } : i)), []);
  const updateAuthorComment = useCallback((id: string, comment: string) =>
    setCoverImages((p) => p.map((i) => i.id === id ? { ...i, authorComment: comment } : i)), []);

  // ── WIP handlers ────────────────────────────────────────────────────────────
  function addStep() { setWipSteps((p) => [...p, { id: uid(), title: "", description: "", images: [] }]); }
  function removeStep(id: string) { setWipSteps((p) => p.filter((s) => s.id !== id)); }

  function updateStepField(id: string, field: "title" | "description", value: string) {
    setWipSteps((p) => p.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  function addStepImages(stepId: string, files: File[]) {
    setWipSteps((p) => p.map((s) => {
      if (s.id !== stepId) return s;
      const added = files.map(createObjectURL).slice(0, 5 - s.images.length);
      return { ...s, images: [...s.images, ...added] };
    }));
  }

  function removeStepImage(stepId: string, imgId: string) {
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
    if (!validate()) return;
    setSubmitting(true);

    const buildSteps: BuildStep[] = hasWIP
      ? wipSteps
          .filter((s) => s.title.trim())
          .map((s, i) => ({
            id:          s.id,
            stepNumber:  i + 1,
            title:       s.title,
            description: s.description,
            date:        new Date().toISOString().split("T")[0],
            images:      s.images.map((img) => ({ url: img.url, caption: img.caption })),
          }))
      : [];

    const author = user ? authUserToAuthor(user) : {
      id: "self", name: "Anonymous", avatarUrl: "", country: "—",
      bio: "", followersCount: 0, followingCount: 0,
    };

    const post = {
      id:              `up-${Date.now()}`,
      title:           title.trim(),
      description:     description.trim(),
      thumbnailUrl:    coverImages[0].url,
      images:          coverImages.map(({ url, caption, authorComment }) => ({
        url, caption, ...(authorComment.trim() ? { authorComment: authorComment.trim() } : {}),
      })),
      buildSteps:      buildSteps.length > 0 ? buildSteps : undefined,
      author,
      tags,
      category,
      kit:             kit.trim(),
      paints,
      tools,
      techniques,
      saveCount:       0,
      likeCount:       0,
      weeklyLikeCount: 0,
      createdAt:       new Date().toISOString(),
    };

    addPost(post);
    router.push(`/posts/${post.id}`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          {ta("loginRequired")}
        </p>
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

        {/* Page header */}
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
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {t("subtitle")}
          </p>
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
              onAuthorCommentChange={updateAuthorComment}
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
            <TagInput label={t("fields.paints")}     value={paints}     onChange={setPaints}     placeholder={t("placeholders.paints")}     suggestions={PAINT_SUGGESTIONS} />
            <TagInput label={t("fields.tools")}      value={tools}      onChange={setTools}      placeholder={t("placeholders.tools")}      suggestions={TOOL_SUGGESTIONS} />
            <TagInput label={t("fields.techniques")} value={techniques} onChange={setTechniques} placeholder={t("placeholders.techniques")} suggestions={TECHNIQUE_SUGGESTIONS} />
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
