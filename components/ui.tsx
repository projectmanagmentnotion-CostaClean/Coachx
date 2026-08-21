import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  if (!title) {
    return <section className="section">{children}</section>;
  }

  return (
    <section className="section">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="headline-md">{title}</h2>
          {meta ? <p className="caption" style={{ marginTop: 4 }}>{meta}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  elevated = false,
  className = "",
  style
}: {
  children: ReactNode;
  elevated?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card ${elevated ? "elevated" : ""} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
  onClick,
  disabled,
  type = "button"
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  if (href) {
    return (
      <Link href={href} className={`button-primary focus-ring ${className}`.trim()}>
        {children}
      </Link>
    );
  }

  return (
    <button className={`button-primary focus-ring ${className}`.trim()} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  style,
  onClick,
  disabled,
  type = "button"
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button className={`button-secondary focus-ring ${className}`.trim()} type={type} style={style} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function StatTile({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 8 }}>{label}</p>
      <p className="metric">{value}</p>
      {meta ? <p className="caption" style={{ marginTop: 6 }}>{meta}</p> : null}
    </div>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  type = "button"
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button aria-label={label} className="tap-target focus-ring" type={type} onClick={onClick}>
      <span className="icon" aria-hidden="true">{icon}</span>
    </button>
  );
}
