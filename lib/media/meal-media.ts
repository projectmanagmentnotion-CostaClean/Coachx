import type { MediaAsset, MediaFallback, MediaVariant, ResolvedMedia } from "@/lib/media/types";

export interface MealMediaContext {
  mealKey: string;
  mealName: string;
  variant: MediaVariant;
  macroHint?: string;
  prepTimeHint?: string;
}

const heroSizes = "(max-width: 430px) 100vw, 390px";
const thumbSizes = "48px";

function buildAsset(src: string, alt: string, sizes: string, objectPosition: string, priority = false): MediaAsset {
  return {
    src,
    alt,
    sizes,
    objectPosition,
    priority
  };
}

function buildFallback({ mealName, macroHint, prepTimeHint }: MealMediaContext): MediaFallback {
  const subtitle = prepTimeHint ?? macroHint ?? "AthlexForce meal reference";
  const hint = macroHint ?? undefined;

  return {
    kind: "meal",
    title: mealName,
    subtitle,
    hint,
    icon: "restaurant"
  };
}

const mealMediaFamilies: Record<string, Partial<Record<MediaVariant, MediaAsset>>> = {
  "eggs-avocado-toast": {
    hero: buildAsset("/stitch-assets/nutrition-breakfast.png", "Eggs and avocado toast on slate", heroSizes, "center 42%", true),
    preview: buildAsset("/stitch-assets/nutrition-breakfast.png", "Eggs and avocado toast on slate", heroSizes, "center 42%", true),
    thumbnail: buildAsset("/stitch-assets/nutrition-breakfast.png", "Eggs and avocado toast on slate", thumbSizes, "center 42%")
  }
};

function pickMealAsset(family: Partial<Record<MediaVariant, MediaAsset>>, variant: MediaVariant): MediaAsset | null {
  const preferred = family[variant] ?? null;
  if (preferred) {
    return preferred;
  }

  if (variant === "thumbnail") {
    return family.thumbnail ?? family.preview ?? family.hero ?? family.fullscreen ?? family.start ?? family.end ?? null;
  }

  return family.hero ?? family.preview ?? family.thumbnail ?? family.fullscreen ?? family.start ?? family.end ?? null;
}

export function resolveMealMedia(context: MealMediaContext): ResolvedMedia {
  const family = mealMediaFamilies[context.mealKey];
  const fallback = buildFallback(context);
  const asset = family ? pickMealAsset(family, context.variant) : null;

  return {
    key: context.mealKey,
    kind: "meal",
    variant: context.variant,
    state: asset ? "mapped" : "missing",
    asset,
    fallback,
    hasDedicatedMedia: Boolean(asset && family?.[context.variant])
  };
}

export function markMediaLoadError(resolution: ResolvedMedia): ResolvedMedia {
  return {
    ...resolution,
    state: resolution.asset ? "load_error" : "missing",
    asset: null
  };
}

export function resolveMealHeroMedia(context: Omit<MealMediaContext, "variant">) {
  return resolveMealMedia({ ...context, variant: "hero" });
}

export function resolveMealThumbnailMedia(context: Omit<MealMediaContext, "variant">) {
  return resolveMealMedia({ ...context, variant: "thumbnail" });
}

export function resolveMealPreviewMedia(context: Omit<MealMediaContext, "variant">) {
  return resolveMealMedia({ ...context, variant: "preview" });
}
