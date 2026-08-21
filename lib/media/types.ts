export type MediaSurfaceKind = "exercise" | "meal";

export type MediaVariant = "hero" | "thumbnail" | "preview" | "start" | "end" | "fullscreen";

export type MediaResolutionState = "mapped" | "missing" | "load_error";

export interface MediaAsset {
  src: string;
  alt: string;
  sizes: string;
  objectPosition?: string;
  priority?: boolean;
}

export interface MediaFallback {
  kind: MediaSurfaceKind;
  title: string;
  subtitle: string;
  hint?: string;
  icon: "fitness_center" | "restaurant";
}

export interface ResolvedMedia {
  key: string;
  kind: MediaSurfaceKind;
  variant: MediaVariant;
  state: MediaResolutionState;
  asset: MediaAsset | null;
  fallback: MediaFallback;
  hasDedicatedMedia: boolean;
}
