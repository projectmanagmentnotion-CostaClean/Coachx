import { gsap } from "gsap";

type FeedbackMotionScope = {
  root: HTMLElement;
  reducedMotion: boolean;
};

function getTargets(root: HTMLElement, selectors: string[]) {
  const targets = new Set<HTMLElement>();

  for (const selector of selectors) {
    if (root.matches(selector)) {
      targets.add(root);
    }

    root.querySelectorAll<HTMLElement>(selector).forEach((target) => targets.add(target));
  }

  return Array.from(targets);
}

function setReducedMotionVisible(root: HTMLElement, selectors: string[]) {
  const targets = getTargets(root, selectors);
  if (targets.length > 0) {
    gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1 });
  }
}

function createTimeline(
  scope: FeedbackMotionScope,
  selectors: string[],
  build: (timeline: gsap.core.Timeline) => void
) {
  if (scope.reducedMotion) {
    setReducedMotionVisible(scope.root, selectors);
    return gsap.context(() => {}, scope.root);
  }

  return gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { duration: 0.3, ease: "power2.out" } });
    build(timeline);
  }, scope.root);
}

export function buildPressFeedbackTimeline(scope: FeedbackMotionScope, selector = "[data-feedback-press]") {
  return createTimeline(scope, [selector], (timeline) => {
    timeline.fromTo(selector, { scale: 0.985 }, { scale: 1, duration: 0.14, ease: "power2.out" });
  });
}

export function buildConfirmationSheetTimeline(scope: FeedbackMotionScope, selector = "[data-feedback-sheet]") {
  return createTimeline(scope, [selector], (timeline) => {
    timeline.fromTo(selector, { autoAlpha: 0, y: 24, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
  });
}

export function buildContextualSuccessTimeline(scope: FeedbackMotionScope, selector = "[data-feedback-success]") {
  return createTimeline(scope, [selector], (timeline) => {
    timeline.fromTo(selector, { autoAlpha: 0, y: 12, scale: 0.99 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "power2.out" });
    timeline.to(selector, { autoAlpha: 0, duration: 0.18, ease: "power2.in" }, "+=0.7");
  });
}

export function buildErrorFeedbackTimeline(scope: FeedbackMotionScope, selector = "[data-feedback-error]") {
  return createTimeline(scope, [selector], (timeline) => {
    timeline.fromTo(selector, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" });
  });
}

export function buildKpiUpdateTimeline(
  scope: FeedbackMotionScope,
  selectors: { lineSelector?: string; pointSelector?: string; cardSelector?: string } = {}
) {
  const lineSelector = selectors.lineSelector ?? "[data-feedback-kpi-line]";
  const pointSelector = selectors.pointSelector ?? "[data-feedback-kpi-point]";
  const cardSelector = selectors.cardSelector ?? "[data-feedback-kpi-card]";

  return createTimeline(scope, [lineSelector, pointSelector, cardSelector].filter(Boolean) as string[], (timeline) => {
    const line = scope.root.querySelector<SVGPathElement | SVGCircleElement>(lineSelector);
    if (line && "getTotalLength" in line) {
      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
      timeline.to(line, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 0);
    }

    const points = scope.root.querySelectorAll<SVGCircleElement>(pointSelector);
    if (points.length > 0) {
      timeline.fromTo(points, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: 0.26, ease: "power2.out", stagger: 0.04 }, 0.1);
    }

    const cards = scope.root.querySelectorAll<HTMLElement>(cardSelector);
    if (cards.length > 0) {
      timeline.fromTo(cards, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out", stagger: 0.04 }, 0.05);
    }
  });
}

export function buildPreparingBicepsTimeline(scope: FeedbackMotionScope, selector = "[data-feedback-preparing]") {
  return createTimeline(scope, [selector], (timeline) => {
    timeline.fromTo(selector, { autoAlpha: 0, y: 14, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "power2.out" });
  });
}
