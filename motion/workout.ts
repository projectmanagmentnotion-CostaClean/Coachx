import { gsap } from "gsap";

type WorkoutMotionRoot = {
  root: HTMLElement;
  reducedMotion: boolean;
};

function getTargets(root: HTMLElement, selectors: string[]) {
  return root.querySelectorAll(selectors.join(", "));
}

function setReducedMotionVisible(root: HTMLElement, selectors: string[]) {
  const targets = getTargets(root, selectors);
  if (targets.length > 0) {
    gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1 });
  }
}

function createTimeline({ root, reducedMotion }: WorkoutMotionRoot, selectors: string[], build: (timeline: gsap.core.Timeline) => void) {
  if (reducedMotion) {
    setReducedMotionVisible(root, selectors);
    return null;
  }

  const timeline = gsap.timeline({ defaults: { duration: 0.32, ease: "power2.out" } });
  build(timeline);
  return timeline;
}

export function buildWorkoutStartTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='start-hero']", "[data-workout-motion='start-meta']", "[data-workout-motion='start-cta']"], (timeline) => {
    timeline.fromTo(
      "[data-workout-motion='start-hero']",
      { autoAlpha: 0, y: 18, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.48 }
    );
    timeline.fromTo("[data-workout-motion='start-meta']", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.18");
    timeline.fromTo("[data-workout-motion='start-cta']", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.12");
  });
}

export function buildActiveExerciseEnterTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='active-shell']", "[data-workout-motion='active-hero']", "[data-workout-motion='active-logger']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='active-shell']", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28 });
    timeline.fromTo("[data-workout-motion='active-hero']", { autoAlpha: 0, y: 18, scale: 1.03 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.56 }, "-=0.12");
    timeline.fromTo("[data-workout-motion='active-logger']", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.36 }, "-=0.22");
  });
}

export function buildSetCompleteTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='set-complete-overlay']"], (timeline) => {
    timeline.fromTo(
      "[data-workout-motion='set-complete-overlay']",
      { autoAlpha: 0, scale: 0.96 },
      { autoAlpha: 1, scale: 1, duration: 0.24 }
    );
    timeline.to("[data-workout-motion='set-complete-overlay']", { autoAlpha: 0, scale: 1.02, duration: 0.2 }, "+=0.18");
  });
}

export function buildRestEnterTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='rest-card']", "[data-workout-motion='rest-ring']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='rest-card']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.32 });
    timeline.fromTo("[data-workout-motion='rest-ring']", { scale: 0.9, autoAlpha: 0 }, { autoAlpha: 1, scale: 1, duration: 0.34 }, "-=0.12");
  });
}

export function buildRestReadyTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='rest-ready']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='rest-ready']", { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.24 });
  });
}

export function buildExerciseCompleteTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-complete-overlay']", "[data-workout-motion='next-exercise-card']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='exercise-complete-overlay']", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.3 });
    timeline.fromTo("[data-workout-motion='next-exercise-card']", { autoAlpha: 0, y: 18, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42 }, "-=0.14");
  });
}

export function buildNextExerciseTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='next-exercise-card']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='next-exercise-card']", { autoAlpha: 0, y: 20, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4 });
  });
}

export function buildPauseTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='pause-overlay']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='pause-overlay']", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22 });
  });
}

export function buildWorkoutCompleteTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(
    scope,
    ["[data-workout-motion='complete-hero']", "[data-workout-motion='complete-kpis']", "[data-workout-motion='complete-breakdown']"],
    (timeline) => {
      timeline.fromTo("[data-workout-motion='complete-hero']", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.36 });
      timeline.fromTo("[data-workout-motion='complete-kpis']", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.06 }, "-=0.12");
      timeline.fromTo("[data-workout-motion='complete-breakdown']", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.1");
    }
  );
}

export function buildKpiRevealTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='kpi-tile']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='kpi-tile']", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.05 });
  });
}

export function buildExerciseDetailOpenTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(
    scope,
    [
      "[data-workout-motion='exercise-detail-hero']",
      "[data-workout-motion='exercise-detail-technique']",
      "[data-workout-motion='exercise-detail-anatomy']",
      "[data-workout-motion='exercise-detail-performance']",
      "[data-workout-motion='exercise-detail-alternatives']"
    ],
    (timeline) => {
      timeline.fromTo("[data-workout-motion='exercise-detail-hero']", { autoAlpha: 0, y: 18, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 });
      timeline.fromTo("[data-workout-motion='exercise-detail-technique']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.14");
      timeline.fromTo("[data-workout-motion='exercise-detail-anatomy']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.12");
      timeline.fromTo("[data-workout-motion='exercise-detail-performance']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.12");
      timeline.fromTo("[data-workout-motion='exercise-detail-alternatives']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.32 }, "-=0.12");
    }
  );
}

export function buildExerciseDetailCloseTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-detail-close']"], (timeline) => {
    timeline.to("[data-workout-motion='exercise-detail-close']", { autoAlpha: 0, y: 10, duration: 0.18 });
  });
}

export function buildExerciseMediaToggleTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-detail-hero']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='exercise-detail-hero']", { scale: 0.995 }, { scale: 1, duration: 0.22 });
  });
}

export function buildMuscleMapRevealTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-detail-anatomy']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='exercise-detail-anatomy']", { autoAlpha: 0, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.3 });
  });
}

export function buildAlternativesEnterTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-detail-alternatives']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='exercise-detail-alternatives']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3 });
  });
}

export function buildAlternativePreviewTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='alternative-preview']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='alternative-preview']", { autoAlpha: 0, y: 12, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28 });
  });
}

export function buildCoachRequestTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='coach-request-sheet']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='coach-request-sheet']", { autoAlpha: 0, y: 16, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28 });
  });
}

export function buildExerciseSwapTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='swap-success-sheet']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='swap-success-sheet']", { autoAlpha: 0, y: 16, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28 });
  });
}

export function buildMediaFullscreenTimeline(scope: WorkoutMotionRoot) {
  return createTimeline(scope, ["[data-workout-motion='exercise-fullscreen']"], (timeline) => {
    timeline.fromTo("[data-workout-motion='exercise-fullscreen']", { autoAlpha: 0, scale: 0.99 }, { autoAlpha: 1, scale: 1, duration: 0.22 });
  });
}
