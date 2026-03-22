import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "assets");
const PUBLIC_URL_PREFIX = "/uploads/assets";
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ORIGINAL_NAME_LENGTH = 191;

export const ASSET_UPLOAD_CONSTRAINTS = {
  allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
};

export function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function normalizeOriginalFileName(input: string): string {
  const trimmed = input.trim() || "asset";
  if (trimmed.length <= MAX_ORIGINAL_NAME_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, MAX_ORIGINAL_NAME_LENGTH);
}

export function getPublicAssetUrl(storedName: string): string {
  return `${PUBLIC_URL_PREFIX}/${storedName}`;
}

export function getAssetDiskPath(storedName: string): string {
  return path.join(PUBLIC_UPLOAD_DIR, storedName);
}

function getExtensionByMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/svg+xml") return ".svg";
  return "";
}

export function validateAssetFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "지원하지 않는 이미지 형식입니다.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "파일 크기는 10MB 이하만 업로드할 수 있습니다.";
  }

  return null;
}

export async function writeAssetFile(file: File): Promise<{
  storedName: string;
  diskPath: string;
  publicUrl: string;
}> {
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });

  const originalName = sanitizeFileName(file.name || "asset");
  const extensionFromName = path.extname(originalName).toLowerCase();
  const extension = extensionFromName || getExtensionByMimeType(file.type) || ".bin";

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 40);
  const randomHash = crypto.randomBytes(8).toString("hex");
  const storedName = `${contentHash}${randomHash}${extension}`;
  const diskPath = getAssetDiskPath(storedName);

  await writeFile(diskPath, buffer);

  return {
    storedName,
    diskPath,
    publicUrl: getPublicAssetUrl(storedName),
  };
}

export async function removeAssetFile(storedName: string): Promise<void> {
  const diskPath = getAssetDiskPath(storedName);
  if (!existsSync(diskPath)) {
    return;
  }
  await unlink(diskPath);
}
