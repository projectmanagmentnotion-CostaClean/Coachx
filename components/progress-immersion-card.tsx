"use client";

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { Card } from "@/components/ui";
import { useReducedMotion } from "@/motion/useReducedMotion";
import type { MotivationalImmersionState, ProgressIntensityLevel } from "@/lib/motivational-immersion";

interface ProgressImmersionCardProps {
  immersion: MotivationalImmersionState;
  action?: ReactNode;
  compact?: boolean;
}

const intensityTone: Record<ProgressIntensityLevel, string> = {
  calm: "calm",
  active: "active",
  close: "close",
  heat: "heat",
  achieved: "achieved"
};

function intensityToStroke(level: ProgressIntensityLevel) {
  switch (level) {
    case "achieved":
      return { start: "#ffd166", mid: "#ff8f2f", end: "#ff5f1f" };
    case "heat":
      return { start: "#ffd166", mid: "#ffb347", end: "#ff8f2f" };
    case "close":
      return { start: "#fff08a", mid: "#ffd166", end: "#ffb347" };
    case "active":
      return { start: "#dfff67", mid: "#c5ff31", end: "#b6ff00" };
    case "calm":
    default:
      return { start: "#dfff67", mid: "#b6ff00", end: "#7fd000" };
  }
}

function ProgressIntensityRing({ immersion, compact = false }: { immersion: MotivationalImmersionState; compact?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<SVGCircleElement | null>(null);
  const reducedMotion = useReducedMotion();
  const targetPercent = useMemo(() => {
    const rawPercent = immersion.primaryTarget?.percent ?? (immersion.state === "achieved" ? 100 : 0);
    if (!Number.isFinite(rawPercent)) {
      return 0;
    }

    return Math.max(0, Math.min(100, rawPercent));
  }, [immersion.primaryTarget?.percent, immersion.state]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) {
      return;
    }

    const length = track.getTotalLength();
    track.style.strokeDasharray = `${length}`;
    track.style.strokeDashoffset = `${length}`;

    if (reducedMotion) {
      track.style.strokeDashoffset = `${length - (length * targetPercent) / 100}`;
      return;
    }

    const context = gsap.context(() => {
      gsap.to(track, {
        strokeDashoffset: length - (length * targetPercent) / 100,
        duration: immersion.state === "achieved" ? 1.25 : 0.95,
        ease: "power2.out"
      });

      if (immersion.state === "achieved") {
        const sparks = Array.from(root.querySelectorAll<HTMLElement>("[data-immersion-spark]"));
        sparks.forEach((spark, index) => {
          const x = Number(spark.dataset.x ?? 0);
          const y = Number(spark.dataset.y ?? 0);
          gsap.fromTo(
            spark,
            { autoAlpha: 0, scale: 0.15, x: 0, y: 0 },
            {
              autoAlpha: 1,
              scale: 1,
              x,
              y,
              delay: index * 0.05,
              duration: 0.8,
              ease: "power3.out"
            }
          );
        });
      }
    }, root);

    return () => context.revert();
  }, [immersion.state, reducedMotion, targetPercent]);

  const stroke = intensityToStroke(immersion.state);
  const radius = compact ? 42 : 50;
  const size = compact ? 124 : 148;
  const center = size / 2;
  const circleStroke = compact ? 11 : 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * targetPercent) / 100;
  const percentLabel = immersion.primaryTarget?.percent != null ? `${Math.round(immersion.primaryTarget.percent)}%` : immersion.state === "achieved" ? "100%" : "—";

  return (
    <div ref={rootRef} className={`progress-immersion-ring progress-immersion-ring--${intensityTone[immersion.state]}${compact ? " compact" : ""}`.trim()}>
      <svg className="progress-immersion-ring__svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${immersion.stateLabel}. ${immersion.targetLabel}. ${immersion.remainingLabel}`}>
        <defs>
          <linearGradient id={`immersion-gradient-${immersion.state}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke.start} />
            <stop offset="55%" stopColor={stroke.mid} />
            <stop offset="100%" stopColor={stroke.end} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={circleStroke}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          ref={trackRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#immersion-gradient-${immersion.state})`}
          strokeLinecap="round"
          strokeWidth={circleStroke}
          vectorEffect="non-scaling-stroke"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="progress-immersion-ring__center">
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          {immersion.stateLabel}
        </div>
        <div className={compact ? "headline-md" : "headline-lg"} style={{ lineHeight: 1 }}>
          {percentLabel}
        </div>
        <div className="caption" style={{ marginTop: 6, lineHeight: 1.4 }}>
          {immersion.targetValueLabel}
        </div>
        <div className="caption" style={{ marginTop: 4, color: "var(--text-muted)" }}>
          {immersion.remainingLabel}
        </div>
      </div>

      {immersion.state === "achieved" && !reducedMotion ? (
        <div className="progress-immersion-ring__sparks" aria-hidden="true">
          {[
            { x: -28, y: -36 },
            { x: 30, y: -20 },
            { x: -16, y: 34 },
            { x: 34, y: 28 }
          ].map((spark, index) => (
            <span
              key={`${spark.x}-${spark.y}`}
              data-immersion-spark
              data-x={spark.x}
              data-y={spark.y}
              className="progress-immersion-ring__spark"
              style={{ left: "50%", top: "50%" }}
            />
          ))}
        </div>
      ) : null}

      <div className="progress-immersion-ring__bottom caption">{immersion.targetLabel}</div>
    </div>
  );
}

export function ProgressImmersionCard({ immersion, action, compact = false }: ProgressImmersionCardProps) {
  const toneClass = immersion.backgroundTone ?? immersion.state;

  return (
    <Card className={`progress-immersion-card progress-immersion-card--${toneClass} p-16${compact ? " compact" : ""}`.trim()}>
      <div className="progress-immersion-card__header">
        <div className="stack">
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {immersion.stateLabel}
          </div>
          <h2 className={compact ? "headline-md" : "headline-lg"} style={{ margin: 0, lineHeight: 1.05 }}>
            {immersion.heroTitle}
          </h2>
          <p className="body-md" style={{ marginTop: 8, lineHeight: 1.6 }}>
            {immersion.heroSummary}
          </p>
        </div>
        <ProgressIntensityRing immersion={immersion} compact={compact} />
      </div>

      <div className="progress-immersion-card__meta">
        <div>
          <div className="caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {immersion.targetLabel}
          </div>
          <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
            {immersion.targetValueLabel}
          </div>
        </div>
        <div>
          <div className="caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Target status
          </div>
          <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
            {immersion.remainingLabel}
          </div>
        </div>
      </div>

      <div className="progress-immersion-card__targets">
        {immersion.targets.length > 0 ? (
          immersion.targets.map((target) => (
            <div key={target.id} className={`progress-immersion-target progress-immersion-target--${target.state}`}>
              <div className="progress-immersion-target__row">
                <div className="body-md" style={{ fontWeight: 700 }}>
                  {target.label}
                </div>
                <span className="progress-immersion-target__state">{target.state.toUpperCase()}</span>
              </div>
              <div className="caption" style={{ marginTop: 6, lineHeight: 1.5 }}>
                {target.displayValue}
                {target.displayTarget ? ` / ${target.displayTarget}` : ""}
              </div>
              <div className="caption" style={{ marginTop: 4, lineHeight: 1.5 }}>
                {target.remainingText ?? target.sourceLabel}
              </div>
            </div>
          ))
        ) : (
          <div className="progress-immersion-target progress-immersion-target--calm">
            <div className="body-md" style={{ fontWeight: 700 }}>
              No target yet
            </div>
            <div className="caption" style={{ marginTop: 6, lineHeight: 1.5 }}>
              AthlexForce stays calm until a real target is available.
            </div>
          </div>
        )}
      </div>

      {immersion.milestones.length > 0 ? (
        <div className="progress-immersion-card__milestones">
          {immersion.milestones.map((milestone) => (
            <span key={milestone.id} className={`progress-immersion-milestone progress-immersion-milestone--${milestone.tone}${milestone.achieved ? " achieved" : ""}`.trim()}>
              <span className="progress-immersion-milestone__label">{milestone.label}</span>
              <span className="progress-immersion-milestone__detail">{milestone.detail}</span>
            </span>
          ))}
        </div>
      ) : null}

      {action ? <div className="progress-immersion-card__actions">{action}</div> : null}
    </Card>
  );
}
