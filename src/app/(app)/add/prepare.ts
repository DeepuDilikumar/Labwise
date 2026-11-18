export const MAX_PAGES = 10;
export const MAX_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 2200;

/**
 * Client-side prep: rotation from EXIF is applied by createImageBitmap, large photos are
 * downscaled to ~2200px and re-encoded as JPEG (smaller uploads, and EXIF/GPS metadata is
 * stripped as a side effect). PDFs pass through untouched.
 */
export async function prepareFile(file: File): Promise<{ file: File } | { error: string }> {
  if (file.type === "application/pdf") return file.size > MAX_BYTES ? { error: "too_large" } : { file };
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return { error: "bad_type" };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { error: /heic|heif/i.test(file.type + file.name) ? "heic" : "bad_type" };
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
  if (!blob) return { error: "bad_type" };
  if (blob.size > MAX_BYTES) return { error: "too_large" };
  return { file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) };
}
