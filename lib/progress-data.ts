import { coachxDemoState } from "@/lib/coachx-data";
import { parseNumericInput, type NumericParseReason } from "@/lib/numeric-input";

export type MeasurementType = "weight" | "waist" | "hips" | "thigh";
export type PhotoPose = "front" | "side" | "back";
export type ProgressCheckpoint = "baseline" | "week-4" | "week-8";
export type ComparisonMode = "side-by-side" | "slider";
export type PhaseOutcome = "ON TRACK" | "STRONG PROGRESS" | "ADJUSTMENT NEEDED" | "INSUFFICIENT DATA";
export type AthleteFeedback = "Very Good" | "Good" | "Mixed" | "Too Hard" | "Too Easy" | "Not Sure";

export interface ProgressDayContext {
  athleteName: string;
  calendarLabel: string;
  phaseLabel: string;
  dateKey: string;
  dateLabel: string;
}

export interface MeasurementDefinition {
  type: MeasurementType;
  label: string;
  unit: string;
  lastValue: number | null;
  lastDate: string | null;
  todayValue: string;
  min: number;
  max: number;
  step: number;
  optional?: boolean;
}

export interface MeasurementEntry {
  type: MeasurementType;
  value: number;
  unit: string;
  dateKey: string;
}

export interface MeasurementHistory {
  type: MeasurementType;
  entries: MeasurementEntry[];
}

export interface MeasurementSaveRow {
  type: MeasurementType;
  label: string;
  unit: string;
  previousValue: number | null;
  currentValue: number | null;
  previousDate: string | null;
  currentDate: string | null;
  difference: number | null;
}

export interface MeasurementState {
  checkpoint: ProgressCheckpoint;
  phaseLabel: string;
  weekLabel: string;
  lastCheckpointLabel: string;
  currentCheckpointLabel: string;
  currentDateLabel: string;
  currentDateKey: string;
  dueCount: number;
  definitions: MeasurementDefinition[];
  histories: MeasurementHistory[];
  validationErrors: Partial<Record<MeasurementType, string>>;
  lastSavedRows: MeasurementSaveRow[];
  savedAt: string | null;
}

export interface ProgressPhoto {
  pose: PhotoPose;
  checkpoint: ProgressCheckpoint;
  status: "captured" | "missing" | "retake";
  label: string;
  image: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  updatedAt: string | null;
  privateByDefault: true;
}

export interface ProgressPhotoCheckpoint {
  checkpoint: ProgressCheckpoint;
  label: string;
  dateLabel: string;
  photos: Record<PhotoPose, ProgressPhoto>;
}

export interface ProgressPhotoState {
  comparisonPose: PhotoPose;
  comparisonMode: ComparisonMode;
  checkpoints: ProgressPhotoCheckpoint[];
  selectedCheckpoint: ProgressCheckpoint;
  guidanceVisible: boolean;
}

export interface TrendPoint {
  label: string;
  value: number;
  display: string;
}

export interface TrendSeries {
  id: string;
  label: string;
  unit: string;
  points: TrendPoint[];
}

export interface StrengthTrend {
  movement: string;
  previous: number;
  current: number;
  unit: string;
  note: string;
}

export interface AdherenceTrend {
  label: string;
  current: number;
  previous: number;
  unit: string;
  note: string;
}

export interface RecoveryTrend {
  label: string;
  current: number;
  previous: number;
  unit: string;
  note: string;
}

export interface WeeklyFeedbackTrend {
  label: string;
  value: AthleteFeedback;
  note: string;
}

export interface PhaseChangeDecision {
  label: string;
  current: "KEEP" | "ADJUST";
  options: Array<"KEEP" | "ADJUST">;
}

export interface PhaseRecommendation {
  title: string;
  duration: string;
  summary: string;
  changes: string[];
}

export interface PhaseReview {
  checkpoint: ProgressCheckpoint;
  label: string;
  outcome: PhaseOutcome;
  summary: string;
  startMeasurements: Array<{ label: string; value: string; delta: string }>;
  whatWorked: string[];
  whatHeldBack: string[];
  athleteFeedback: WeeklyFeedbackTrend[];
  mainGoalDecision: PhaseChangeDecision;
  priorityDecision: PhaseChangeDecision;
  recommendation: PhaseRecommendation;
  status: "REVIEW" | "COACH REVIEW REQUIRED" | "NEXT PHASE";
}

export interface ProgressTrendsState {
  currentTrendLabel: string;
  currentTrendSummary: string;
  currentTrendStatus: PhaseOutcome;
  keyMetrics: Array<{ label: string; value: string; delta: string; accent?: boolean }>;
  bodyTrendSeries: TrendSeries[];
  strengthTrends: StrengthTrend[];
  adherenceTrend: AdherenceTrend;
  recoveryTrend: RecoveryTrend;
  weeklyFeedback: WeeklyFeedbackTrend[];
  coachInsight: string;
  nextFocus: string;
}

export interface ProgressState {
  day: ProgressDayContext;
  measurement: MeasurementState;
  photos: ProgressPhotoState;
  trends: ProgressTrendsState;
  phaseReview: PhaseReview;
}

const measurementLabels: Record<MeasurementType, { label: string; unit: string; lastValue: number | null; todayValue: string; min: number; max: number; step: number }> = {
  weight: { label: "Weight", unit: "kg", lastValue: 63.0, todayValue: "", min: 20, max: 250, step: 0.1 },
  waist: { label: "Waist", unit: "cm", lastValue: 74.0, todayValue: "72.8", min: 30, max: 180, step: 0.1 },
  hips: { label: "Hips", unit: "cm", lastValue: 98.0, todayValue: "", min: 40, max: 200, step: 0.1 },
  thigh: { label: "Thigh", unit: "cm", lastValue: 56.5, todayValue: "", min: 20, max: 120, step: 0.1 }
};

function createMeasurementHistory(type: MeasurementType, value: number | null, unit: string, dateKey: string): MeasurementHistory {
  return {
    type,
    entries: value === null
      ? []
      : [
          {
            type,
            value,
            unit,
            dateKey
          }
        ]
  };
}

function createPhoto(label: string, checkpoint: ProgressCheckpoint, pose: PhotoPose, status: ProgressPhoto["status"], image: string | null): ProgressPhoto {
  return {
    pose,
    checkpoint,
    status,
    label,
    image,
    storagePath: null,
    mimeType: null,
    fileSizeBytes: null,
    width: null,
    height: null,
    updatedAt: status === "captured" || status === "retake" ? "2026-08-08T18:00:00.000Z" : null,
    privateByDefault: true
  };
}

function createPhotoCheckpoint(checkpoint: ProgressCheckpoint, label: string, dateLabel: string, imagePrefix: string | null): ProgressPhotoCheckpoint {
  return {
    checkpoint,
    label,
    dateLabel,
    photos: {
      front: createPhoto("Front", checkpoint, "front", imagePrefix ? "captured" : "missing", imagePrefix ? "/progress-photo-front.svg" : null),
      side: createPhoto("Side", checkpoint, "side", imagePrefix ? "captured" : "missing", imagePrefix ? "/progress-photo-side.svg" : null),
      back: createPhoto("Back", checkpoint, "back", imagePrefix ? "captured" : "missing", imagePrefix ? "/progress-photo-back.svg" : null)
    }
  };
}

function createTrendSeries(): TrendSeries[] {
  return [
    {
      id: "weight-waist",
      label: "Weight vs Waist",
      unit: "4W",
      points: [
        { label: "W1", value: 63.0, display: "63.0" },
        { label: "W2", value: 62.9, display: "62.9" },
        { label: "W3", value: 62.8, display: "62.8" },
        { label: "W4", value: 62.8, display: "62.8" }
      ]
    }
  ];
}

export function createProgressDemoState(): ProgressState {
  const day = {
    athleteName: coachxDemoState.athlete.name,
    calendarLabel: coachxDemoState.day.calendarLabel,
    phaseLabel: coachxDemoState.day.phase,
    dateKey: coachxDemoState.day.dateKey,
    dateLabel: coachxDemoState.day.dateLabel
  } satisfies ProgressDayContext;

  const measurementDateKey = "2026-07-11";
  const definitions: MeasurementDefinition[] = (Object.keys(measurementLabels) as MeasurementType[]).map((type) => ({
    type,
    label: measurementLabels[type].label,
    unit: measurementLabels[type].unit,
    lastValue: measurementLabels[type].lastValue,
    lastDate: measurementDateKey,
    todayValue: measurementLabels[type].todayValue,
    min: measurementLabels[type].min,
    max: measurementLabels[type].max,
    step: measurementLabels[type].step
  }));

  const histories = definitions.map((definition) =>
    createMeasurementHistory(definition.type, definition.lastValue, definition.unit, measurementDateKey)
  );

  const photoBaseline = createPhotoCheckpoint("baseline", "Baseline", "July 11", null);
  const photoWeek4 = createPhotoCheckpoint("week-4", "Week 4", "August 8", "/progress-photo-week4");
  const photoWeek8 = createPhotoCheckpoint("week-8", "Week 8", "Week 8", "/progress-photo-week8");

  return {
    day,
    measurement: {
      checkpoint: "week-4",
      phaseLabel: coachxDemoState.day.phase,
      weekLabel: "Week 4",
      lastCheckpointLabel: "July 11",
      currentCheckpointLabel: "4 measurements due",
      currentDateLabel: "August 8",
      currentDateKey: coachxDemoState.day.dateKey,
      dueCount: definitions.length,
      definitions,
      histories,
      validationErrors: {},
      lastSavedRows: [
        {
          type: "weight",
          label: "Weight",
          unit: "kg",
          previousValue: 63.0,
          currentValue: 62.8,
          previousDate: "July 11",
          currentDate: "August 8",
          difference: -0.2
        },
        {
          type: "waist",
          label: "Waist",
          unit: "cm",
          previousValue: 74.0,
          currentValue: 72.8,
          previousDate: "July 11",
          currentDate: "August 8",
          difference: -1.2
        },
        {
          type: "hips",
          label: "Hips",
          unit: "cm",
          previousValue: 98.0,
          currentValue: 97.4,
          previousDate: "July 11",
          currentDate: "August 8",
          difference: -0.6
        }
      ],
      savedAt: null
    },
    photos: {
      comparisonPose: "front",
      comparisonMode: "side-by-side",
      checkpoints: [photoBaseline, photoWeek4, photoWeek8],
      selectedCheckpoint: "week-4",
      guidanceVisible: false
    },
    trends: {
      currentTrendLabel: "Body Recomposition",
      currentTrendSummary: "Waist is trending down while strength remains stable or improving.",
      currentTrendStatus: "ON TRACK",
      keyMetrics: [
        { label: "Weight", value: "62.8 kg", delta: "↓ 63.0", accent: false },
        { label: "Waist", value: "72.8 cm", delta: "↓ 74.0", accent: true },
        { label: "Hip Thrust", value: "90 kg", delta: "↑ 80", accent: false },
        { label: "Training", value: "92% adh", delta: "Target > 90%", accent: false }
      ],
      bodyTrendSeries: createTrendSeries(),
      strengthTrends: [
        { movement: "Romanian Deadlift", previous: 80, current: 85, unit: "kg", note: "+5% estimated 1RM" },
        { movement: "Lat Pulldown", previous: 54, current: 55, unit: "kg", note: "+2% estimated 1RM" }
      ],
      adherenceTrend: {
        label: "Training adherence",
        current: 92,
        previous: 90,
        unit: "adh",
        note: "Target stayed above 90%"
      },
      recoveryTrend: {
        label: "Recovery",
        current: 6.0,
        previous: 6.4,
        unit: "h sleep",
        note: "Lower sleep coincided with weaker performance this week."
      },
      weeklyFeedback: [
        { label: "Feedback", value: "Good", note: "Consistent effort with one lighter recovery day." }
      ],
      coachInsight:
        "Your strength is improving despite stable body weight, while waist measurements are decreasing. Sleep remains the main recovery bottleneck.",
      nextFocus: "Keep the current structure, hold protein steady, and protect sleep on the heaviest training days."
    },
    phaseReview: {
      checkpoint: "week-8",
      label: "Phase 1 Complete",
      outcome: "ON TRACK",
      summary:
        "Body measurements improved while lower-body strength increased and training adherence remained high.",
      startMeasurements: [
        { label: "Weight", value: "62.6 kg", delta: "↓ 0.4 kg" },
        { label: "Waist", value: "71.9 cm", delta: "↓ 2.1 cm" },
        { label: "Training adherence", value: "90%", delta: "Stable" }
      ],
      whatWorked: ["Training structure stayed consistent", "Recovery stayed mostly steady", "Meal timing supported the main sessions"],
      whatHeldBack: ["Sleep dipped on two heavier workdays", "Weekend hydration was inconsistent"],
      athleteFeedback: [
        { label: "Athlete feedback", value: "Good", note: "The phase felt sustainable and clear." }
      ],
      mainGoalDecision: { label: "Main goal", current: "KEEP", options: ["KEEP", "ADJUST"] },
      priorityDecision: { label: "Priorities", current: "KEEP", options: ["KEEP", "ADJUST"] },
      recommendation: {
        title: "Phase 2",
        duration: "8 WEEKS",
        summary: "Body recomposition — progression",
        changes: ["Maintain glute and hamstring emphasis", "Progress hip thrust and hinge loading", "Keep recovery slightly higher on heavy weeks"]
      },
      status: "NEXT PHASE"
    }
  };
}

export function formatMeasurementValue(value: number | null, unit: string) {
  if (value === null || Number.isNaN(value)) {
    return `00.0 ${unit.toUpperCase()}`;
  }

  return `${value.toFixed(1)} ${unit}`;
}

export function formatMeasurementDifference(difference: number | null, unit: string) {
  if (difference === null || Number.isNaN(difference)) {
    return "NO CHANGE";
  }

  const prefix = difference > 0 ? "+" : "";
  return `${prefix}${difference.toFixed(1)} ${unit}`;
}

export function parseMeasurementInput(value: string, min: number, max: number) {
  const parsed = parseNumericInput(value, {
    min,
    max,
    allowBlank: true,
    allowZero: false
  });

  if (!parsed.valid) {
    return { valid: false, reason: parsed.reason as NumericParseReason };
  }

  if (typeof parsed.value !== "number") {
    return { valid: false, reason: "required" as const };
  }

  return { valid: true, value: parsed.value };
}

export function computeMeasurementDifference(previousValue: number | null, currentValue: number | null) {
  if (previousValue === null || currentValue === null) {
    return null;
  }

  return Number((currentValue - previousValue).toFixed(1));
}

export function getMeasurementRows(measurement: MeasurementState) {
  return measurement.definitions.map((definition) => {
    const history = measurement.histories.find((entry) => entry.type === definition.type)?.entries ?? [];
    const previousEntry = history.at(-1) ?? null;
    const currentValue = definition.todayValue.trim() ? Number(definition.todayValue) : null;
    return {
      type: definition.type,
      label: definition.label,
      unit: definition.unit,
      previousValue: previousEntry?.value ?? null,
      currentValue,
      previousDate: previousEntry?.dateKey ?? null,
      currentDate: currentValue === null ? null : measurement.currentDateLabel,
      difference: computeMeasurementDifference(previousEntry?.value ?? null, currentValue)
    } satisfies MeasurementSaveRow;
  });
}

export function buildMeasurementHistory(measurement: MeasurementState, updates: Partial<Record<MeasurementType, number>>) {
  return measurement.histories.map((history) => {
    const updatedValue = updates[history.type];
    if (typeof updatedValue !== "number") {
      return history;
    }

    return {
      ...history,
      entries: [
        ...history.entries,
        {
          type: history.type,
          value: updatedValue,
          unit: measurement.definitions.find((definition) => definition.type === history.type)?.unit ?? "",
          dateKey: measurement.currentDateKey
        }
      ]
    };
  });
}

export function getMeasurementDefinition(measurement: MeasurementState, type: MeasurementType) {
  return measurement.definitions.find((definition) => definition.type === type) ?? measurement.definitions[0];
}

export function getPhotoCheckpoint(photos: ProgressPhotoState, checkpoint: ProgressCheckpoint) {
  return photos.checkpoints.find((item) => item.checkpoint === checkpoint) ?? photos.checkpoints[0];
}
