import type { Locale } from "@/lib/i18n";

export type ProgressIntensityLevel = "calm" | "active" | "close" | "heat" | "achieved";
export type MotivationalTargetKind = "training_adherence" | "nutrition_adherence" | "hydration" | "phase_completion" | "new_best_load" | "workout_count";

export interface ProgressIntensityThresholds {
  active: number;
  close: number;
  heat: number;
  achieved: number;
}

export interface MotivationalTarget {
  id: string;
  kind: MotivationalTargetKind;
  label: string;
  sourceLabel: string;
  value: number | null;
  target: number | null;
  unit: string;
  displayValue: string;
  displayTarget: string | null;
  remainingAmount: number | null;
  remainingText: string | null;
  percent: number | null;
  state: ProgressIntensityLevel;
  validForHeat: boolean;
}

export interface MotivationalMilestone {
  id: string;
  label: string;
  detail: string;
  achieved: boolean;
  state: ProgressIntensityLevel;
  tone: "neutral" | "warm" | "hot";
}

export interface MotivationalImmersionState {
  state: ProgressIntensityLevel;
  stateLabel: string;
  heroTitle: string;
  heroSummary: string;
  targetLabel: string;
  targetValueLabel: string;
  remainingLabel: string;
  primaryTarget: MotivationalTarget | null;
  targets: MotivationalTarget[];
  milestones: MotivationalMilestone[];
  showParticles: boolean;
  backgroundTone: string;
}

export interface MotivationalImmersionInput {
  locale: Locale;
  phaseLabel: string;
  trainingAdherencePercent: number | null;
  nutritionAdherencePercent: number | null;
  hydrationMl: number | null;
  hydrationTargetMl: number | null;
  workoutSessionCount: number;
  latestWorkoutLoad: number | null;
  bestWorkoutLoad: number | null;
  phaseComplete: boolean;
}

const defaultThresholds: ProgressIntensityThresholds = {
  active: 70,
  close: 85,
  heat: 95,
  achieved: 100
};

const rankByState: Record<ProgressIntensityLevel, number> = {
  calm: 0,
  active: 1,
  close: 2,
  heat: 3,
  achieved: 4
};

const localeCopy: Record<Locale, Record<"steady" | "building" | "close" | "heat" | "achieved" | "target" | "remaining" | "noTarget" | "firstWorkout" | "tenWorkouts" | "phaseComplete" | "newBestLoad", string>> = {
  en: {
    steady: "Steady progress.",
    building: "Momentum is building.",
    close: "You are close.",
    heat: "Target in reach.",
    achieved: "Target hit.",
    target: "Target",
    remaining: "to go",
    noTarget: "No target is defined yet.",
    firstWorkout: "First workout logged.",
    tenWorkouts: "10 workouts logged.",
    phaseComplete: "Phase complete.",
    newBestLoad: "New best load."
  },
  es: {
    steady: "Progreso constante.",
    building: "El impulso va creciendo.",
    close: "Ya falta poco.",
    heat: "El objetivo esta cerca.",
    achieved: "Objetivo conseguido.",
    target: "Objetivo",
    remaining: "para el objetivo",
    noTarget: "Aun no hay un objetivo definido.",
    firstWorkout: "Primer entrenamiento registrado.",
    tenWorkouts: "10 entrenamientos registrados.",
    phaseComplete: "Fase completada.",
    newBestLoad: "Nueva mejor marca."
  },
  ca: {
    steady: "Progres constant.",
    building: "L'impuls va creixent.",
    close: "Ja hi ets gairebe.",
    heat: "L'objectiu es a prop.",
    achieved: "Objectiu assolit.",
    target: "Objectiu",
    remaining: "per arribar a l'objectiu",
    noTarget: "Encara no hi ha cap objectiu definit.",
    firstWorkout: "Primer entrenament registrat.",
    tenWorkouts: "10 entrenaments registrats.",
    phaseComplete: "Fase completada.",
    newBestLoad: "Nova millor marca."
  },
  de: {
    steady: "Ruhiger Fortschritt.",
    building: "Der Schwung baut sich auf.",
    close: "Noch nicht weit.",
    heat: "Das Ziel ist in Reichweite.",
    achieved: "Ziel erreicht.",
    target: "Ziel",
    remaining: "noch",
    noTarget: "Noch ist kein Ziel definiert.",
    firstWorkout: "Erstes Training erfasst.",
    tenWorkouts: "10 Trainings erfasst.",
    phaseComplete: "Phase abgeschlossen.",
    newBestLoad: "Neue Bestleistung."
  }
};

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function formatValue(locale: Locale, value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

function formatPercent(locale: Locale, value: number, maximumFractionDigits = 0) {
  return `${formatValue(locale, value, maximumFractionDigits)}%`;
}

function normalizePercent(value: number | null | undefined, target: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
    return null;
  }

  return (value / target) * 100;
}

export function resolveProgressIntensity(percent: number | null | undefined, thresholds: Partial<ProgressIntensityThresholds> = {}) {
  const merged = { ...defaultThresholds, ...thresholds };
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return "calm" as const;
  }

  if (percent >= merged.achieved) {
    return "achieved" as const;
  }

  if (percent >= merged.heat) {
    return "heat" as const;
  }

  if (percent >= merged.close) {
    return "close" as const;
  }

  if (percent >= merged.active) {
    return "active" as const;
  }

  return "calm" as const;
}

function formatRemainingLabel(locale: Locale, remainingAmount: number, unit: string) {
  const numeric = Math.abs(remainingAmount) < 1 ? remainingAmount.toFixed(1) : Number.isInteger(remainingAmount) ? remainingAmount.toFixed(0) : remainingAmount.toFixed(1);
  switch (locale) {
    case "es":
      return `${numeric} ${unit} ${localeCopy.es.remaining}`;
    case "ca":
      return `${numeric} ${unit} ${localeCopy.ca.remaining}`;
    case "de":
      return `${localeCopy.de.remaining} ${numeric} ${unit}`;
    default:
      return `${numeric} ${unit} ${localeCopy.en.remaining}`;
  }
}

function formatTargetLabel(locale: Locale, label: string, value: number | null, target: number | null, unit: string) {
  const valueText = value == null ? "?" : unit === "%" ? formatPercent(locale, value) : `${formatValue(locale, value, unit === "ml" ? 0 : 1)} ${unit}`;
  const targetText = target == null ? null : unit === "%" ? formatPercent(locale, target) : `${formatValue(locale, target, unit === "ml" ? 0 : 1)} ${unit}`;

  return {
    valueText,
    targetText
  };
}

function buildTarget(
  locale: Locale,
  target: Omit<MotivationalTarget, "displayValue" | "displayTarget" | "remainingAmount" | "remainingText" | "percent" | "state"> & {
    value: number | null;
    target: number | null;
    validForHeat?: boolean;
    thresholds?: Partial<ProgressIntensityThresholds>;
  }
): MotivationalTarget {
  const percent = normalizePercent(target.value, target.target);
  const state = resolveProgressIntensity(percent, target.thresholds);
  const remainingAmount = typeof target.value === "number" && typeof target.target === "number" ? Number((target.target - target.value).toFixed(target.unit === "ml" ? 0 : 1)) : null;
  const { valueText, targetText } = formatTargetLabel(locale, target.label, target.value, target.target, target.unit);

  return {
    id: target.id,
    kind: target.kind,
    label: target.label,
    sourceLabel: target.sourceLabel,
    value: target.value,
    target: target.target,
    unit: target.unit,
    displayValue: valueText,
    displayTarget: targetText,
    remainingAmount,
    remainingText: remainingAmount != null && remainingAmount > 0 && target.target != null ? formatRemainingLabel(locale, remainingAmount, target.unit) : null,
    percent,
    state,
    validForHeat: target.validForHeat ?? true
  };
}

function buildMilestone(locale: Locale, id: string, label: string, detail: string, achieved: boolean, tone: MotivationalMilestone["tone"]): MotivationalMilestone {
  return {
    id,
    label,
    detail,
    achieved,
    state: achieved ? "achieved" : "calm",
    tone
  };
}

function pickPrimaryTarget(targets: MotivationalTarget[]) {
  return targets
    .slice()
    .sort((left, right) => {
      const leftRank = rankByState[left.state];
      const rightRank = rankByState[right.state];
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }

      return (right.percent ?? 0) - (left.percent ?? 0);
    })[0] ?? null;
}

function getCopy(locale: Locale) {
  return localeCopy[locale];
}

export function buildMotivationalImmersion(locale: Locale, input: MotivationalImmersionInput): MotivationalImmersionState {
  const copy = getCopy(locale);
  const targets: MotivationalTarget[] = [];

  if (typeof input.trainingAdherencePercent === "number") {
    targets.push(
      buildTarget(locale, {
        id: createId("training-adherence"),
        kind: "training_adherence",
        label: "Training adherence",
        sourceLabel: "Weekly check-in",
        value: input.trainingAdherencePercent,
        target: 100,
        unit: "%",
        validForHeat: true
      })
    );
  }

  if (typeof input.nutritionAdherencePercent === "number") {
    targets.push(
      buildTarget(locale, {
        id: createId("nutrition-adherence"),
        kind: "nutrition_adherence",
        label: "Nutrition adherence",
        sourceLabel: "Nutrition plan",
        value: input.nutritionAdherencePercent,
        target: 100,
        unit: "%",
        validForHeat: true
      })
    );
  }

  if (typeof input.hydrationMl === "number" && typeof input.hydrationTargetMl === "number" && input.hydrationTargetMl > 0) {
    targets.push(
      buildTarget(locale, {
        id: createId("hydration"),
        kind: "hydration",
        label: "Hydration",
        sourceLabel: "Daily nutrition",
        value: input.hydrationMl,
        target: input.hydrationTargetMl,
        unit: "ml",
        validForHeat: true
      })
    );
  }

  const workoutBest = typeof input.bestWorkoutLoad === "number" ? input.bestWorkoutLoad : null;
  const workoutLatest = typeof input.latestWorkoutLoad === "number" ? input.latestWorkoutLoad : null;
  const hasNewBest = workoutBest != null && workoutLatest != null && input.workoutSessionCount > 1 && workoutLatest >= workoutBest;

  const milestones: MotivationalMilestone[] = [];

  if (input.workoutSessionCount >= 1) {
    milestones.push(buildMilestone(locale, "first-workout", copy.firstWorkout, `${input.workoutSessionCount} workouts logged`, true, "neutral"));
  }

  if (input.workoutSessionCount >= 10) {
    milestones.push(buildMilestone(locale, "ten-workouts", copy.tenWorkouts, `${formatValue(locale, input.workoutSessionCount, 0)} workouts logged`, true, "warm"));
  }

  if (input.phaseComplete) {
    milestones.push(buildMilestone(locale, "phase-complete", copy.phaseComplete, input.phaseLabel, true, "hot"));
  }

  if (hasNewBest && workoutLatest != null && workoutBest != null) {
    const weightLabel = `${formatValue(locale, workoutLatest, 0)} kg`;
    milestones.push(buildMilestone(locale, "new-best-load", copy.newBestLoad, `${weightLabel} matched the best completed load`, true, "hot"));
  }

  const primaryTarget = pickPrimaryTarget(targets);
  const primaryState = input.phaseComplete || milestones.some((milestone) => milestone.id === "new-best-load")
    ? "achieved"
    : primaryTarget?.state ?? "calm";

  const heroTitle =
    primaryState === "achieved"
      ? copy.achieved.toUpperCase()
      : primaryState === "heat"
        ? copy.heat.toUpperCase()
        : primaryState === "close"
          ? copy.close.toUpperCase()
          : primaryState === "active"
            ? copy.building.toUpperCase()
            : copy.steady.toUpperCase();

  const heroSummary =
    primaryState === "achieved"
      ? input.phaseComplete
        ? `${input.phaseLabel} is complete. Now we build from here.`
        : milestones.some((milestone) => milestone.id === "new-best-load")
          ? "A new best has landed. Keep the line moving."
          : "The target has been hit."
      : primaryState === "heat"
        ? "The last stretch is warm now."
        : primaryState === "close"
          ? "You are almost there."
          : primaryState === "active"
            ? "The target is building steadily."
            : "No target is close enough yet to heat the screen.";

  const remainingLabel = primaryTarget?.remainingText ?? (primaryState === "achieved" ? copy.achieved : copy.noTarget);
  const targetLabel = primaryTarget?.label ?? (input.phaseComplete ? "Phase milestone" : copy.target);
  const targetValueLabel = primaryTarget ? `${primaryTarget.displayValue} / ${primaryTarget.displayTarget ?? "—"}` : input.phaseComplete ? copy.achieved : copy.noTarget;

  return {
    state: primaryState,
    stateLabel: heroTitle,
    heroTitle,
    heroSummary,
    targetLabel,
    targetValueLabel,
    remainingLabel,
    primaryTarget,
    targets,
    milestones,
    showParticles: primaryState === "achieved",
    backgroundTone:
      primaryState === "achieved"
        ? "achieved"
        : primaryState === "heat"
          ? "heat"
          : primaryState === "close"
            ? "close"
            : primaryState === "active"
              ? "active"
              : "calm"
  };
}

export function buildPhaseAchievementImmersion(locale: Locale, input: { phaseLabel: string; phaseComplete: boolean; reviewSummary: string; workoutSessionCount: number }) {
  const copy = getCopy(locale);
  const heroTitle = input.phaseComplete ? copy.achieved.toUpperCase() : copy.building.toUpperCase();
  const heroSummary = input.phaseComplete ? input.reviewSummary : copy.steady;

  return {
    state: input.phaseComplete ? ("achieved" as const) : ("active" as const),
    stateLabel: heroTitle,
    heroTitle,
    heroSummary,
    targetLabel: input.phaseComplete ? "Phase milestone" : copy.target,
    targetValueLabel: input.phaseComplete ? input.phaseLabel : copy.noTarget,
    remainingLabel: input.phaseComplete ? copy.achieved : copy.noTarget,
    primaryTarget: input.phaseComplete
      ? buildTarget(locale, {
          id: createId("phase-completion"),
          kind: "phase_completion",
          label: "Phase completion",
          sourceLabel: "Phase review",
          value: 100,
          target: 100,
          unit: "%",
          validForHeat: true
        })
      : null,
    targets: input.phaseComplete
      ? [
          buildTarget(locale, {
            id: createId("phase-completion"),
            kind: "phase_completion",
            label: "Phase completion",
            sourceLabel: "Phase review",
            value: 100,
            target: 100,
            unit: "%",
            validForHeat: true
          })
        ]
      : [],
    milestones: [
      buildMilestone(locale, "phase-complete", copy.phaseComplete, input.phaseLabel, input.phaseComplete, "hot"),
      buildMilestone(locale, "workout-count", input.workoutSessionCount >= 10 ? copy.tenWorkouts : copy.firstWorkout, `${formatValue(locale, input.workoutSessionCount, 0)} workouts logged`, input.workoutSessionCount >= 1, "warm")
    ],
    showParticles: input.phaseComplete,
    backgroundTone: input.phaseComplete ? "achieved" : "active"
  } satisfies MotivationalImmersionState;
}

export function buildEmptyMotivationalImmersion(locale: Locale, phaseLabel: string): MotivationalImmersionState {
  const copy = getCopy(locale);

  return {
    state: "calm",
    stateLabel: copy.steady.toUpperCase(),
    heroTitle: copy.steady.toUpperCase(),
    heroSummary: copy.noTarget,
    targetLabel: copy.target,
    targetValueLabel: phaseLabel,
    remainingLabel: copy.noTarget,
    primaryTarget: null,
    targets: [],
    milestones: [],
    showParticles: false,
    backgroundTone: "calm"
  };
}
