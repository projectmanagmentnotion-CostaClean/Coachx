"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslator } from "@/components/locale-provider";

export function OnboardingStepHeader({
  title,
  subtitle,
  stepLabel,
  backHref,
  rightLabel,
  rightHref
}: {
  title: string;
  subtitle: string;
  stepLabel: string;
  backHref: string;
  rightLabel?: string;
  rightHref?: string;
}) {
  const { t } = useTranslator();

  return (
    <header className="topbar onboarding-topbar">
      <Link href={backHref} aria-label={t("common.back")} className="tap-target focus-ring">
        <span className="icon" aria-hidden="true">
          arrow_back
        </span>
      </Link>
      <div className="onboarding-topbar__copy">
        <div className="eyebrow" style={{ margin: 0, color: "#c9cfb4" }}>
          {stepLabel}
        </div>
        <div className="body-md" style={{ fontWeight: 700, marginTop: 2 }}>
          {title}
        </div>
        <div className="caption" style={{ marginTop: 2, fontSize: 12, lineHeight: "16px" }}>
          {subtitle}
        </div>
      </div>
      {rightHref && rightLabel ? (
        <Link href={rightHref} className="progress-mini-action" style={{ minHeight: 40, padding: "0 12px" }}>
          {rightLabel}
        </Link>
      ) : (
        <span className="progress-topbar__spacer" />
      )}
    </header>
  );
}

export function OnboardingCard({
  title,
  subtitle,
  children,
  className = ""
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card onboarding-card ${className}`.trim()}>
      <div className="stack" style={{ gap: 12 }}>
        <div>
          <div className="eyebrow">{title}</div>
          {subtitle ? <p className="caption" style={{ marginTop: 6 }}>{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ChoiceButton({
  label,
  description,
  selected = false,
  onClick,
  compact = false
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`onboarding-choice-card focus-ring ${selected ? "selected" : ""} ${compact ? "compact" : ""}`.trim()}
    >
      <div style={{ minWidth: 0 }}>
        <div className="body-md" style={{ fontWeight: 700 }}>
          {label}
        </div>
        {description ? <div className="caption" style={{ marginTop: 4 }}>{description}</div> : null}
      </div>
      <span className={`choice-radio ${selected ? "selected" : ""}`} aria-hidden="true" />
    </button>
  );
}

export function PillToggle({
  label,
  selected = false,
  onClick
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`onboarding-pill focus-ring ${selected ? "selected" : ""}`.trim()}>
      {label}
    </button>
  );
}

export function OnboardingStickyActions({
  primary,
  secondary
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="onboarding-sticky-actions">
      {secondary}
      {primary}
    </div>
  );
}
