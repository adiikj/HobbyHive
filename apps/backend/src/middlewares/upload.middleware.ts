import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const uploadsDir = path.join(process.cwd(), "public", "uploads");
await fs.mkdir(uploadsDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** The only extensions served from /uploads (new uploads are saved as .jpg/.png/.webp/.gif; .jpeg is older ones). */
export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/**
 * What the file really is, from its first bytes. The browser's Content-Type and the original filename are the
 * uploader's claims; trusting them let an HTML file be saved as x.html and served from the app's own origin.
 */
export const detectImageType = (bytes: Buffer): string | null => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  const head = bytes.subarray(0, 12).toString("latin1");
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) return ".gif";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return ".webp";
  return null;
};

// Kept in memory (at most 5 MB) until its bytes are checked; nothing touches the disk before that
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ApiError(400, "Only JPEG, PNG, WEBP or GIF images can be uploaded."));
      return;
    }
    cb(null, true);
  },
});

/** Saves an uploaded image under a random name with the extension of its real type; returns the filename. */
export const saveUploadedImage = async (file: Express.Multer.File) => {
  const ext = detectImageType(file.buffer);
  if (!ext) {
    throw new ApiError(400, "Only JPEG, PNG, WEBP or GIF images can be uploaded.");
  }
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
  return filename;
};
