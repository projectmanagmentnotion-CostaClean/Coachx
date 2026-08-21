"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { BottomNav } from "@/components/bottom-nav";
import type { BottomTab } from "@/lib/coachx-data";
import { useReducedMotion } from "@/motion/useReducedMotion";
import { screenEnter, cardStagger } from "@/motion/transitions";
import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  activeTab?: BottomTab;
  shellClassName?: string;
  topbar?: ReactNode;
}

export function Screen({ children, activeTab, shellClassName, topbar }: ScreenProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const context = gsap.context(() => {
      const motionTargets = root.querySelectorAll(
        ".topbar, .calendar-toolbar, .card, .list-card, .day-cell, .nav-item, .workout-overview-card, .workout-set-row, .workout-alternative-card, .workout-library-card, .workout-detail-card, .workout-choice-card, .workout-summary-tile, .nutrition-hero-card, .nutrition-progress-card, .nutrition-meal-card, .nutrition-support-card, .nutrition-note-card, .nutrition-state-card, .nutrition-sheet, .nutrition-option-card, .nutrition-supplement-row, .progress-measurement-card, .progress-summary-card, .progress-next-card, .progress-photo-entry-card, .progress-photo-stage, .progress-compare-card, .progress-chart-card, .progress-trend-tile, .progress-strength-card, .progress-review-photo, .progress-review-metric, .progress-review-strength, .progress-review-list, .progress-review-outcome, .progress-support-card, .progress-link-card, .progress-compare-selector, .progress-compare-panel, .progress-immersion-card, .progress-immersion-ring, .progress-immersion-target, .progress-immersion-milestone, .analytics-hero-card, .analytics-chart-card, .analytics-metric-card, .analytics-summary-card, .analytics-insight-card, .analytics-empty, .analytics-range-chip, .analytics-chip, .analytics-topbar, .onboarding-card, .onboarding-choice-card, .onboarding-pill, .onboarding-reorder-row, .onboarding-summary-card, .onboarding-review-card, .program-hero-card, .program-section-card, .coach-tab, .coach-note-input, .coach-action-panel, .coach-athlete-card, .coach-review-card, .coach-summary-card"
      );
      if (reducedMotion) {
        gsap.set(motionTargets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(root, screenEnter.from, screenEnter.to);
      if (motionTargets.length > 0) {
        gsap.fromTo(motionTargets, cardStagger.from, {
          ...cardStagger.to,
          stagger: motionTargets.length > 12 ? 0.02 : cardStagger.stagger
        });
      }
    }, root);

    return () => context.revert();
  }, [reducedMotion]);

  return (
    <div className="app-frame">
      <div ref={rootRef} className={`screen ${activeTab ? "with-bottom-nav" : ""} ${shellClassName ?? ""}`.trim()}>
        {topbar}
        {children}
      </div>
      {activeTab ? <BottomNav active={activeTab} /> : null}
    </div>
  );
}
