import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const profileAvatarBucket = "profile-avatars";
export const profileAvatarAccept = "image/jpeg,image/png,image/webp";
export const profileAvatarMaxBytes = 5 * 1024 * 1024;
export const profileAvatarMaxDimension = 1024;

export function buildProfileAvatarStoragePath(userId: string) {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${userId}/avatar/${uuid}.jpg`;
}

export function validateProfileAvatarFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > profileAvatarMaxBytes) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

async function loadImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load the selected image."));
    });
    image.src = objectUrl;
    const resolved = await loaded;
    return { width: resolved.naturalWidth, height: resolved.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function optimizeProfileAvatarFile(file: File) {
  const { width, height } = await loadImageDimensions(file);
  if (width < 256 || height < 256) {
    throw new Error("Image must be at least 256 px on each side.");
  }

  const scale = Math.min(1, profileAvatarMaxDimension / Math.max(width, height));
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is unavailable in this browser.");
  }

  context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error("Image optimization failed."));
        return;
      }
      resolve(value);
    }, "image/jpeg", 0.88);
  });

  bitmap.close();

  return {
    blob,
    width: outputWidth,
    height: outputHeight,
    mimeType: "image/jpeg"
  };
}

export async function uploadProfileAvatar(
  client: SupabaseClient<Database>,
  userId: string,
  file: File
) {
  const optimized = await optimizeProfileAvatarFile(file);
  const storagePath = buildProfileAvatarStoragePath(userId);

  const { error } = await client.storage.from(profileAvatarBucket).upload(storagePath, optimized.blob, {
    cacheControl: "31536000",
    contentType: optimized.mimeType,
    upsert: false
  });

  if (error) {
    throw error;
  }

  return {
    storagePath,
    width: optimized.width,
    height: optimized.height,
    mimeType: optimized.mimeType,
    size: optimized.blob.size
  };
}

