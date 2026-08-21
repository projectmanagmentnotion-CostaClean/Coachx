"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ResolvedMedia } from "@/lib/media/types";
import { markExerciseMediaLoadError, markMealMediaLoadError } from "@/lib/media";

function mediaFallbackCopy(resolution: ResolvedMedia, compactFallback: boolean) {
  const compact = compactFallback || resolution.variant === "thumbnail";
  const subtitle = compact ? "" : resolution.fallback.subtitle;
  const hint = compact ? "" : resolution.fallback.hint ?? "";

  return {
    compact,
    subtitle,
    hint
  };
}

export function AthlexMedia({
  resolution,
  className = "",
  compactFallback = false
}: {
  resolution: ResolvedMedia;
  className?: string;
  compactFallback?: boolean;
}) {
  const [renderResolution, setRenderResolution] = useState(resolution);

  useEffect(() => {
    setRenderResolution(resolution);
  }, [
    resolution.asset?.src,
    resolution.asset?.alt,
    resolution.asset?.sizes,
    resolution.asset?.objectPosition,
    resolution.asset?.priority,
    resolution.kind,
    resolution.key,
    resolution.state,
    resolution.variant,
    resolution.fallback.title,
    resolution.fallback.subtitle,
    resolution.fallback.hint,
    resolution.fallback.icon,
    resolution.hasDedicatedMedia
  ]);

  const asset = renderResolution.asset;
  const fallback = mediaFallbackCopy(renderResolution, compactFallback);

  if (renderResolution.state !== "mapped" || !asset) {
    return (
      <div
        className={`athlex-media athlex-media--fallback ${className}`.trim()}
        data-media-kind={renderResolution.kind}
        data-media-key={renderResolution.key}
        data-media-state={renderResolution.state}
        data-media-variant={renderResolution.variant}
      >
        <div className={`athlex-media__fallback ${fallback.compact ? "compact" : ""}`.trim()}>
          <div className="athlex-media__fallback-ambient" aria-hidden="true" />
          <div className={`athlex-media__fallback-icon ${fallback.compact ? "compact" : ""}`.trim()} aria-hidden="true">
            <span className="icon filled">{renderResolution.fallback.icon}</span>
          </div>
          {fallback.compact ? null : (
            <div className="athlex-media__fallback-copy">
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                AthlexForce
              </div>
              <div className={`body-md athlex-media__fallback-title ${fallback.compact ? "compact" : ""}`.trim()}>
                {renderResolution.fallback.title}
              </div>
              {fallback.subtitle ? <div className="caption athlex-media__fallback-subtitle">{fallback.subtitle}</div> : null}
              {fallback.hint ? <div className="caption athlex-media__fallback-hint">{fallback.hint}</div> : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`athlex-media ${className}`.trim()}
      data-media-kind={renderResolution.kind}
      data-media-key={renderResolution.key}
      data-media-state={renderResolution.state}
      data-media-variant={renderResolution.variant}
    >
      <Image
        alt={asset.alt}
        className="athlex-media__image"
        fill
        loading={asset.priority ? "eager" : "lazy"}
        priority={asset.priority}
        sizes={asset.sizes}
        src={asset.src}
        style={{ objectFit: "cover", objectPosition: asset.objectPosition ?? "center center" }}
        onError={() => {
          setRenderResolution((current) => (current.kind === "exercise" ? markExerciseMediaLoadError(current) : markMealMediaLoadError(current)));
        }}
      />
    </div>
  );
}
