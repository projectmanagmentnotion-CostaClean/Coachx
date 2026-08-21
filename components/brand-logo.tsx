import type { CSSProperties } from "react";

const BRAND_ASSETS = {
  original: {
    src: "/brand/athlexforce-logo-original.png",
    width: 584,
    height: 322
  },
  full: {
    src: "/brand/athlexforce-logo-full.png",
    width: 1536,
    height: 1024
  },
  horizontal: {
    src: "/brand/athlexforce-logo-horizontal.png",
    width: 1536,
    height: 1024
  },
  mark: {
    src: "/brand/athlexforce-mark.png",
    width: 1536,
    height: 1024
  }
} as const;

export type BrandVariant = keyof typeof BRAND_ASSETS;

export function BrandLogo({
  variant,
  width,
  alt = "AthlexForce",
  decorative = false,
  className,
  style,
  priority = false
}: {
  variant: BrandVariant;
  width?: number;
  alt?: string;
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const asset = BRAND_ASSETS[variant];

  return (
    <img
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={{
        display: "block",
        width: width ? `${width}px` : "auto",
        height: "auto",
        ...style
      }}
    />
  );
}
