// Image file utilities for upload normalization.
// Used by NewPostForm and EditPostForm on the client only.

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "webp", "gif",
  "heic", "heif", "bmp", "tiff", "avif",
]);

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png",  webp: "image/webp",
  gif: "image/gif",  heic: "image/heic",
  heif: "image/heif", bmp: "image/bmp",
  tiff: "image/tiff", avif: "image/avif",
};

export function extFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "jpg";
}

// Accept files even when file.type is empty (common on Android + some iOS).
export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTS.has(extFromName(file.name));
}

// Derive a reliable MIME type even when file.type is empty.
export function resolveContentType(file: File): string {
  return file.type || EXT_MIME[extFromName(file.name)] || "image/jpeg";
}

// Stored form for a selected image — ArrayBuffer avoids iOS File-reference expiry.
export type StoredFile = {
  buffer: ArrayBuffer;
  contentType: string;
  ext: string;
};

// Convert HEIC/HEIF to JPEG via canvas (works on iOS Safari which decodes HEIC natively).
// Falls back to the original file if the browser cannot decode HEIC.
async function toJpegIfHeic(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  const ext = extFromName(file.name);
  const mime = resolveContentType(file);
  if (!["heic", "heif"].includes(ext) && !["image/heic", "image/heif"].includes(mime)) {
    return file;
  }
  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

// Normalize a file for storage: HEIC→JPEG, then read into ArrayBuffer.
// Returns a preview URL (caller must revoke when done) + StoredFile for upload.
export async function prepareFile(
  file: File,
): Promise<{ previewUrl: string; stored: StoredFile }> {
  const normalized  = await toJpegIfHeic(file);
  const buffer      = await normalized.arrayBuffer();
  const contentType = resolveContentType(normalized);
  const ext         = extFromName(normalized.name);
  const previewUrl  = URL.createObjectURL(normalized);
  return { previewUrl, stored: { buffer, contentType, ext } };
}
