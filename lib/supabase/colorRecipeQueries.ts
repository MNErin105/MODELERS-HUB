import { supabase } from "@/lib/supabase";
import { ColorRecipeTag } from "@/lib/types";

// ── Raw row type ─────────────────────────────────────────────────────────────

type RawColorRecipeTag = {
  id: string;
  post_image_id: string;
  pin_x: number;
  pin_y: number;
  box_x: number;
  box_y: number;
  color_hex: string;
  content: string | null;
  sort_order: number;
};

const TAG_SELECT = "id, post_image_id, pin_x, pin_y, box_x, box_y, color_hex, content, sort_order";

function mapTag(raw: RawColorRecipeTag): ColorRecipeTag {
  return {
    id:          raw.id,
    postImageId: raw.post_image_id,
    // Stored as numeric; PostgREST can hand these back as strings.
    pin:         { x: Number(raw.pin_x), y: Number(raw.pin_y) },
    box:         { x: Number(raw.box_x), y: Number(raw.box_y) },
    colorHex:    raw.color_hex,
    content:     raw.content ?? "",
    sortOrder:   raw.sort_order,
  };
}

// ── Read ─────────────────────────────────────────────────────────────────────

// Tags for one image, in display order. Fetched lazily when the viewer opens —
// most visitors never open it, so they aren't part of the post payload.
export async function getColorRecipeTags(postImageId: string): Promise<ColorRecipeTag[]> {
  const { data } = await supabase
    .from("color_recipe_tags")
    .select(TAG_SELECT)
    .eq("post_image_id", postImageId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((r) => mapTag(r as unknown as RawColorRecipeTag));
}

// ── Write ────────────────────────────────────────────────────────────────────
// RLS lets only the owner of the post behind the image touch these rows.
// Not wired to any UI yet — the editing pass comes next.

export async function createColorRecipeTag(
  postImageId: string,
  tag: { pin: { x: number; y: number }; box: { x: number; y: number }; colorHex: string; content?: string; sortOrder?: number },
): Promise<ColorRecipeTag> {
  const { data, error } = await supabase
    .from("color_recipe_tags")
    .insert({
      post_image_id: postImageId,
      pin_x:      tag.pin.x,
      pin_y:      tag.pin.y,
      box_x:      tag.box.x,
      box_y:      tag.box.y,
      color_hex:  tag.colorHex,
      content:    tag.content?.trim() || null,
      sort_order: tag.sortOrder ?? 0,
    })
    .select(TAG_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create colour recipe tag");
  return mapTag(data as unknown as RawColorRecipeTag);
}

// Partial update — the editor saves at the end of each gesture (drag release,
// text blur, picker close) rather than on every intermediate change.
export async function updateColorRecipeTag(
  tagId: string,
  changes: {
    pin?: { x: number; y: number };
    box?: { x: number; y: number };
    colorHex?: string;
    content?: string;
    sortOrder?: number;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (changes.pin)                    { patch.pin_x = changes.pin.x; patch.pin_y = changes.pin.y; }
  if (changes.box)                    { patch.box_x = changes.box.x; patch.box_y = changes.box.y; }
  if (changes.colorHex !== undefined)   patch.color_hex  = changes.colorHex;
  if (changes.content  !== undefined)   patch.content    = changes.content.trim() || null;
  if (changes.sortOrder !== undefined)  patch.sort_order = changes.sortOrder;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("color_recipe_tags").update(patch).eq("id", tagId);
  if (error) throw new Error(error.message ?? "Failed to update colour recipe tag");
}

export async function deleteColorRecipeTag(tagId: string): Promise<void> {
  const { error } = await supabase.from("color_recipe_tags").delete().eq("id", tagId);
  if (error) throw new Error(error.message ?? "Failed to delete colour recipe tag");
}
