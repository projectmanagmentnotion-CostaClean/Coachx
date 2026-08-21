"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { buildKpiUpdateTimeline } from "@/motion/feedback";
import { useReducedMotion } from "@/motion/useReducedMotion";
import type { PerformanceAnalyticsSeries } from "@/lib/performance-analytics";
import type { ProgressIntensityLevel } from "@/lib/motivational-immersion";

interface AnalyticsChartCardProps {
  title: string;
  subtitle: string;
  unit: string;
  series: PerformanceAnalyticsSeries;
  pointsLabel: string;
  emptyTitle: string;
  emptyCopy: string;
  chartTone?: "primary" | "accent";
  targetValue?: number | null;
  targetLabel?: string | null;
  targetState?: ProgressIntensityLevel | null;
}

function buildPath(points: PerformanceAnalyticsSeries["points"]) {
  if (points.length === 0) {
    return "";
  }

  const maxValue = Math.max(...points.map((point) => point.value));
  const minValue = Math.min(...points.map((point) => point.value));
  const range = Math.max(1, maxValue - minValue);

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 78 - 10;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function getPointPosition(points: PerformanceAnalyticsSeries["points"], index: number) {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const maxValue = Math.max(...points.map((point) => point.value));
  const minValue = Math.min(...points.map((point) => point.value));
  const range = Math.max(1, maxValue - minValue);
  const point = points[index] ?? points.at(-1)!;
  const x = (index / Math.max(1, points.length - 1)) * 100;
  const y = 100 - ((point.value - minValue) / range) * 78 - 10;
  return { x, y };
}

function getValuePosition(points: PerformanceAnalyticsSeries["points"], value: number) {
  if (points.length === 0) {
    return { x: 100, y: 50 };
  }

  const maxValue = Math.max(...points.map((point) => point.value));
  const minValue = Math.min(...points.map((point) => point.value));
  const range = Math.max(1, maxValue - minValue);
  const y = 100 - ((value - minValue) / range) * 78 - 10;
  return { x: 100, y };
}

export function AnalyticsChartCard({ title, subtitle, unit, series, pointsLabel, emptyTitle, emptyCopy, chartTone = "primary", targetValue = null, targetLabel = null, targetState = null }: AnalyticsChartCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, series.points.length - 1));
  const activePoint = series.points[activeIndex] ?? series.points.at(-1) ?? null;

  useEffect(() => {
    setActiveIndex(Math.max(0, series.points.length - 1));
  }, [series.id, series.points.length]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || series.points.length === 0) {
      return;
    }

    const context = buildKpiUpdateTimeline(
      { root, reducedMotion },
      {
        lineSelector: "[data-analytics-line]",
        pointSelector: "[data-analytics-point]"
      }
    );

    return () => context.revert();
  }, [reducedMotion, series.id, series.points.length]);

  const renderLabel = useMemo(() => {
    if (!activePoint) {
      return emptyTitle;
    }

    return `${activePoint.label} · ${activePoint.display} ${unit}`;
  }, [activePoint, emptyTitle, unit]);

  if (series.points.length === 0) {
    return (
      <Card className={`analytics-chart-card analytics-chart-card--${chartTone} p-16`}>
        <div className="row start" style={{ marginBottom: 10 }}>
          <div>
            <div className="eyebrow">{title}</div>
            <p className="caption" style={{ marginTop: 4 }}>
              {subtitle}
            </p>
          </div>
          <span className={`analytics-chip analytics-chip--${chartTone}`}>{pointsLabel}</span>
        </div>
        <div className="analytics-empty" role="status" aria-live="polite">
          <h3 className="body-md" style={{ fontWeight: 700 }}>
            {emptyTitle}
          </h3>
          <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {emptyCopy}
          </p>
        </div>
      </Card>
    );
  }

  const path = buildPath(series.points);
  const selectedPosition = getPointPosition(series.points, activeIndex);
  const maxValue = Math.max(...series.points.map((point) => point.value));
  const minValue = Math.min(...series.points.map((point) => point.value));
  const targetPosition = typeof targetValue === "number" ? getValuePosition(series.points, targetValue) : null;
  const targetStroke =
    targetState === "achieved"
      ? "#ff8f2f"
      : targetState === "heat"
        ? "#ff9b3d"
        : targetState === "close"
          ? "#ffd166"
          : targetState === "active"
            ? "#efe66f"
            : series.accent;

  return (
    <div ref={rootRef}>
      <Card className={`analytics-chart-card analytics-chart-card--${chartTone} p-16`}>
      <div className="row start" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">{title}</div>
          <p className="caption" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>
        <span className={`analytics-chip analytics-chip--${chartTone}`}>{pointsLabel}</span>
      </div>
      {targetLabel && targetValue != null ? (
        <div className="caption analytics-chart__target" style={{ marginTop: -4, marginBottom: 10 }}>
          {targetLabel}
        </div>
      ) : null}

      <div className="analytics-chart">
        <svg className="analytics-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={title}>
          <defs>
            <linearGradient id={`chart-gradient-${series.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={series.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={series.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,100 L0,100 L100,100 Z" fill={`url(#chart-gradient-${series.id})`} opacity="0.35" />
          <path
            data-analytics-line
            data-feedback-kpi-line
            d={path}
            fill="none"
            stroke={targetValue != null ? targetStroke : series.accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
            vectorEffect="non-scaling-stroke"
          />
          {targetPosition ? (
            <g aria-hidden="true">
              <line
                x1="0"
                x2="100"
                y1={targetPosition.y}
                y2={targetPosition.y}
                stroke={targetStroke}
                strokeDasharray="4,4"
                strokeOpacity="0.45"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="100" cy={targetPosition.y} r="2.8" fill={targetStroke} opacity="0.95" />
            </g>
          ) : null}
          {series.points.map((point, index) => {
            const position = getPointPosition(series.points, index);
            const isActive = index === activeIndex;
            return (
              <g key={`${series.id}-${point.dateKey}-${index}`}>
                <circle
                  data-analytics-point
                  data-feedback-kpi-point
                  cx={position.x}
                  cy={position.y}
                  r={isActive ? 3.6 : 2.6}
                  fill={isActive ? targetStroke : "#0f0f0f"}
                  stroke={targetValue != null ? targetStroke : series.accent}
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
          {activePoint ? (
            <line
              x1={selectedPosition.x}
              x2={selectedPosition.x}
              y1="0"
              y2="100"
              stroke={series.accent}
              strokeDasharray="2,4"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <rect x="0" y="0" width="100" height="100" fill="transparent" />
        </svg>
      </div>

      <div className="analytics-chart__details">
        <div className="analytics-chart__selected">
          <div className="caption">{activePoint ? activePoint.label : emptyTitle}</div>
          <div className="headline-md" style={{ marginTop: 6 }}>
            {activePoint ? `${activePoint.display} ${unit}` : "—"}
          </div>
        </div>
        <div className="caption" style={{ textAlign: "right" }}>
          {activePoint ? `${minValue.toFixed(0)} → ${maxValue.toFixed(0)} ${unit}` : ""}
          <div style={{ marginTop: 6 }}>{renderLabel}</div>
        </div>
      </div>

      <div className="analytics-chart__points" role="tablist" aria-label={title}>
        {series.points.map((point, index) => (
          <button
            key={`${series.id}-${point.dateKey}-button`}
            type="button"
            className={`analytics-point-chip focus-ring ${index === activeIndex ? "active" : ""}`.trim()}
            onClick={() => setActiveIndex(index)}
            aria-pressed={index === activeIndex}
            aria-label={`${point.label} · ${point.display} ${unit}`}
          >
            <span className="analytics-point-chip__label">{point.label}</span>
            <span className="analytics-point-chip__value">{point.display}</span>
          </button>
        ))}
      </div>
      </Card>
    </div>
  );
}
