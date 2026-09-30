import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./storage");

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Deteksi tipe gambar dari magic bytes (bukan dari nama file / header yang bisa dipalsukan). */
export function detectImage(buf: Buffer): keyof typeof MIME | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "gif";
  return null;
}

export function mimeFor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME[ext === "jpeg" ? "jpg" : ext] || null;
}

export async function saveImage(file: File, prefix: string, maxBytes = 5 * 1024 * 1024) {
  if (!file || typeof file.arrayBuffer !== "function") throw new UploadError("File tidak ditemukan.");
  if (file.size > maxBytes) throw new UploadError(`Ukuran maksimal ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) throw new UploadError("File bukan gambar yang valid (JPG, PNG, WEBP).");
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  const name = `${prefix}_${crypto.randomBytes(12).toString("hex")}.${ext}`;
  await fs.mkdir(/*turbopackIgnore: true*/ UPLOAD_DIR, { recursive: true });
  await fs.writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf);
  return { url: `/api/files/${name}`, hash, name };
}

export async function readUpload(name: string) {
  if (!/^[a-z]+_[a-f0-9]{24}\.(jpg|png|webp|gif)$/.test(name)) return null;
  try {
    return await fs.readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

export class UploadError extends Error {}
