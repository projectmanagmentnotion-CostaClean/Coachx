import type { MediaAsset, MediaFallback, MediaVariant, ResolvedMedia } from "@/lib/media/types";

export interface ExerciseMediaContext {
  exerciseKey: string;
  exerciseName: string;
  variant: MediaVariant;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
}

const heroSizes = "(max-width: 430px) 100vw, 390px";
const thumbSizes = "64px";

function buildAsset(src: string, alt: string, sizes: string, objectPosition: string, priority = false): MediaAsset {
  return {
    src,
    alt,
    sizes,
    objectPosition,
    priority
  };
}

function buildFallback({ exerciseName, primaryMuscles = [], secondaryMuscles = [], equipment }: ExerciseMediaContext): MediaFallback {
  const muscleLine = [...primaryMuscles, ...secondaryMuscles].slice(0, 2).join(" · ");
  const subtitle = muscleLine || equipment || "AthlexForce movement reference";
  const hint = equipment ? equipment.toUpperCase() : undefined;

  return {
    kind: "exercise",
    title: exerciseName,
    subtitle,
    hint,
    icon: "fitness_center"
  };
}

const exerciseMediaFamilies: Record<
  string,
  Partial<Record<MediaVariant, MediaAsset>> & {
    start?: MediaAsset;
    end?: MediaAsset;
    hero?: MediaAsset;
    thumbnail?: MediaAsset;
    fullscreen?: MediaAsset;
  }
> = {
  "barbell-hip-thrust": {
    hero: buildAsset("/stitch-assets/hip_thrust.png", "Athlete performing a Hip Thrust", heroSizes, "center 28%", true),
    start: buildAsset("/stitch-assets/hip_thrust.png", "Athlete performing a Hip Thrust", heroSizes, "center 24%", true),
    end: buildAsset("/stitch-assets/hip_thrust.png", "Athlete performing a Hip Thrust", heroSizes, "center 34%"),
    thumbnail: buildAsset("/stitch-assets/hip_thrust.png", "Athlete performing a Hip Thrust", thumbSizes, "center 28%"),
    fullscreen: buildAsset("/stitch-assets/hip_thrust.png", "Athlete performing a Hip Thrust", heroSizes, "center 30%")
  },
  "romanian-deadlift": {
    hero: buildAsset("/stitch-assets/romanian_deadlift.png", "Athlete performing a Romanian Deadlift", heroSizes, "center 30%", true),
    start: buildAsset("/stitch-assets/romanian_deadlift.png", "Athlete performing a Romanian Deadlift", heroSizes, "center 26%", true),
    end: buildAsset("/stitch-assets/romanian_deadlift.png", "Athlete performing a Romanian Deadlift", heroSizes, "center 36%"),
    thumbnail: buildAsset("/stitch-assets/romanian_deadlift.png", "Athlete performing a Romanian Deadlift", thumbSizes, "center 30%"),
    fullscreen: buildAsset("/stitch-assets/romanian_deadlift.png", "Athlete performing a Romanian Deadlift", heroSizes, "center 32%")
  }
};

function pickExerciseAsset(family: Partial<Record<MediaVariant, MediaAsset>>, variant: MediaVariant): MediaAsset | null {
  const preferred = family[variant] ?? null;
  if (preferred) {
    return preferred;
  }

  if (variant === "thumbnail") {
    return family.thumbnail ?? family.hero ?? family.fullscreen ?? family.start ?? family.end ?? null;
  }

  if (variant === "start") {
    return family.start ?? family.hero ?? family.fullscreen ?? family.thumbnail ?? family.end ?? null;
  }

  if (variant === "end") {
    return family.end ?? family.hero ?? family.fullscreen ?? family.thumbnail ?? family.start ?? null;
  }

  return family.hero ?? family.fullscreen ?? family.thumbnail ?? family.start ?? family.end ?? null;
}

export function resolveExerciseMedia(context: ExerciseMediaContext): ResolvedMedia {
  const family = exerciseMediaFamilies[context.exerciseKey];
  const fallback = buildFallback(context);
  const asset = family ? pickExerciseAsset(family, context.variant) : null;

  return {
    key: context.exerciseKey,
    kind: "exercise",
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

export function resolveExerciseHeroMedia(context: Omit<ExerciseMediaContext, "variant">) {
  return resolveExerciseMedia({ ...context, variant: "hero" });
}

export function resolveExerciseThumbnailMedia(context: Omit<ExerciseMediaContext, "variant">) {
  return resolveExerciseMedia({ ...context, variant: "thumbnail" });
}

export function resolveExerciseStartMedia(context: Omit<ExerciseMediaContext, "variant">) {
  return resolveExerciseMedia({ ...context, variant: "start" });
}

export function resolveExerciseEndMedia(context: Omit<ExerciseMediaContext, "variant">) {
  return resolveExerciseMedia({ ...context, variant: "end" });
}

export function resolveExerciseFullscreenMedia(context: Omit<ExerciseMediaContext, "variant">) {
  return resolveExerciseMedia({ ...context, variant: "fullscreen" });
}
