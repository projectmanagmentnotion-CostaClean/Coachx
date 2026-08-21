export type { MediaAsset, MediaFallback, MediaResolutionState, MediaSurfaceKind, MediaVariant, ResolvedMedia } from "@/lib/media/types";
export {
  markMediaLoadError as markExerciseMediaLoadError,
  resolveExerciseEndMedia,
  resolveExerciseFullscreenMedia,
  resolveExerciseHeroMedia,
  resolveExerciseMedia,
  resolveExerciseStartMedia,
  resolveExerciseThumbnailMedia
} from "@/lib/media/exercise-media";
export {
  markMediaLoadError as markMealMediaLoadError,
  resolveMealHeroMedia,
  resolveMealMedia,
  resolveMealPreviewMedia,
  resolveMealThumbnailMedia
} from "@/lib/media/meal-media";
