import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "posts");
const PUBLIC_URL_PREFIX = "/uploads/posts";
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getPublicAssetUrl(storedName: string): string {
  return `${PUBLIC_URL_PREFIX}/${storedName}`;
}

function getAssetDiskPath(storedName: string): string {
  return path.join(PUBLIC_UPLOAD_DIR, storedName);
}

function getExtensionByMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return "";
}

export function validatePostImage(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Unsupported image type.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Image size must be 10MB or smaller.";
  }

  return null;
}

export async function writePostImage(file: File): Promise<{
  storedName: string;
  diskPath: string;
  publicUrl: string;
}> {
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });

  const originalName = sanitizeFileName(file.name || "post-image");
  const extensionFromName = path.extname(originalName);
  const extension = extensionFromName || getExtensionByMimeType(file.type) || ".bin";
  const nameWithoutExtension = path.basename(originalName, extension);
  const uniqueToken = crypto.randomBytes(8).toString("hex");
  const storedName = `${nameWithoutExtension}-${Date.now()}-${uniqueToken}${extension}`;
  const diskPath = getAssetDiskPath(storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return {
    storedName,
    diskPath,
    publicUrl: getPublicAssetUrl(storedName),
  };
}

export async function removePostImage(storedName: string): Promise<void> {
  const diskPath = getAssetDiskPath(storedName);
  if (!existsSync(diskPath)) {
    return;
  }
  await unlink(diskPath);
}
