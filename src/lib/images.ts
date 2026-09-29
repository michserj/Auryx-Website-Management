import "server-only";
import { getDb, schema } from "./db";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// SVG is intentionally not accepted (it can carry scripts).
const SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { mime: "image/gif", test: (b) => b.subarray(0, 4).toString() === "GIF8" },
];

export class ImageError extends Error {}

/** Validates an uploaded file by size and magic bytes (not the client-sent type) and stores it. */
export async function storeImage(file: File, alt: string) {
  if (file.size === 0) throw new ImageError("The file is empty.");
  if (file.size > MAX_IMAGE_BYTES) throw new ImageError("Images must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(buf));
  if (!kind) throw new ImageError("Only JPEG, PNG, WebP or GIF images are allowed.");
  const db = await getDb();
  const [row] = await db
    .insert(schema.images)
    .values({
      filename: file.name.replace(/[^\w.\-]+/g, "_").slice(0, 200) || "image",
      mimeType: kind.mime,
      size: buf.length,
      data: buf,
      alt: alt.trim().slice(0, 300),
    })
    .returning({ id: schema.images.id });
  return row.id;
}

export function fileFrom(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
