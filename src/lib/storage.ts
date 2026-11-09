import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSupabaseConfigured } from "./db";
import { createSupabaseServerClient } from "./supabase/server";

const BUCKET = "product-images";
const MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Stores an uploaded product image and returns its public URL.
 * - Supabase mode: uploads to the `product-images` storage bucket.
 * - Local mode: writes into `public/uploads` (development only).
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Choose an image to upload.");
  const extension = ALLOWED[file.type];
  if (!extension) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Image must be 6 MB or smaller.");

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from(BUCKET).upload(name, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }

  const directory = resolve(process.cwd(), "public/uploads");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, name), buffer);
  return `/uploads/${name}`;
}
