import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  Database,
  Json,
  ProgramChangeEventSource,
  ProgramChangeStatus,
  ProgramChangeTargetEntityType,
  ProgramChangeType
} from "@/lib/supabase/database.types";
import type { CoachRecommendationRecordView } from "@/lib/ai/schemas";
import { getWorkoutAlternativeCards, getExerciseDefinition } from "@/lib/workout-data";
import type { ProgramBundleView } from "@/lib/program-service";
import { formatDate, getCurrentLocale } from "@/lib/i18n";

const programChangeStatusValues = ["draft", "proposed", "needs_review", "approved", "rejected", "applied", "failed", "superseded", "expired"] as const;
const programChangeTypeValues = [
  "exercise_swap",
  "set_adjustment",
  "rep_range_adjustment",
  "load_guidance",
  "volume_adjustment",
  "workout_reschedule",
  "workout_frequency_adjustment",
  "recovery_adjustment",
  "phase_extension",
  "phase_transition"
] as const;
const programChangeTargetEntityTypeValues = ["workout_template_exercise", "scheduled_workout", "program_phase"] as const;

const jsonSchema: z.ZodType<Json> = z.custom<Json>(() => true);

export const exerciseSwapCommandSchema = z.object({
  type: z.literal("exercise_swap"),
  scheduledWorkoutId: z.string().uuid(),
  templateExerciseId: z.string().uuid(),
  fromExerciseId: z.string().min(1),
  toExerciseId: z.string().min(1),
  reason: z.string().min(1)
});

export const setAdjustmentCommandSchema = z.object({
  type: z.literal("set_adjustment"),
  templateExerciseId: z.string().uuid(),
  currentSets: z.number().int().positive(),
  proposedSets: z.number().int().positive()
});

export const repRangeAdjustmentCommandSchema = z.object({
  type: z.literal("rep_range_adjustment"),
  templateExerciseId: z.string().uuid(),
  currentMin: z.number().int().positive(),
  currentMax: z.number().int().positive(),
  proposedMin: z.number().int().positive(),
  proposedMax: z.number().int().positive()
});

export const workoutRescheduleCommandSchema = z.object({
  type: z.literal("workout_reschedule"),
  scheduledWorkoutId: z.string().uuid(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const phaseExtensionCommandSchema = z.object({
  type: z.literal("phase_extension"),
  phaseId: z.string().uuid(),
  currentEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proposedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const programChangeCommandSchema = z.discriminatedUnion("type", [
  exerciseSwapCommandSchema,
  setAdjustmentCommandSchema,
  repRangeAdjustmentCommandSchema,
  workoutRescheduleCommandSchema,
  phaseExtensionCommandSchema
]);

export type ProgramChangeCommand = z.infer<typeof programChangeCommandSchema>;

export interface ProgramChangePreviewSnapshot {
  headline: string;
  subheadline: string;
  details: string[];
  metrics: Array<{ label: string; value: string }>;
}

export interface ProgramChangeValidationResult {
  status: "approved" | "needs_review";
  messages: string[];
  safetyFlags: string[];
  sourceUpdatedAt: string | null;
}

export interface ProgramChangeProposalDraft {
  changeType: ProgramChangeType;
  targetEntityType: ProgramChangeTargetEntityType;
  targetEntityId: string | null;
  programId: string | null;
  programPhaseId: string | null;
  reason: string;
  changeCommand: ProgramChangeCommand;
  beforeSnapshot: ProgramChangePreviewSnapshot;
  afterSnapshot: ProgramChangePreviewSnapshot;
  validationResult: ProgramChangeValidationResult;
  sourceUpdatedAt: string | null;
  status: ProgramChangeStatus;
}

export interface ProgramChangeCommandOption {
  command: ProgramChangeCommand;
  title: string;
  summary: string;
  note: string;
  validationHint: string;
}

export interface ProgramChangeProposalRecordView {
  id: string;
  userId: string;
  recommendationId: string | null;
  programId: string | null;
  programPhaseId: string | null;
  changeType: ProgramChangeType;
  status: ProgramChangeStatus;
  targetEntityType: ProgramChangeTargetEntityType;
  targetEntityId: string | null;
  changeCommand: ProgramChangeCommand;
  beforeSnapshot: ProgramChangePreviewSnapshot;
  afterSnapshot: ProgramChangePreviewSnapshot;
  reason: string;
  validationResult: ProgramChangeValidationResult;
  sourceUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  appliedAt: string | null;
  rejectedAt: string | null;
}

export interface ProgramChangeEventRecordView {
  id: string;
  userId: string;
  programId: string | null;
  proposalId: string;
  recommendationId: string | null;
  changeType: ProgramChangeType;
  beforeSnapshot: ProgramChangePreviewSnapshot;
  afterSnapshot: ProgramChangePreviewSnapshot;
  source: ProgramChangeEventSource;
  appliedAt: string;
  createdAt: string;
}

const programChangeProposalRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  recommendation_id: z.string().uuid().nullable(),
  program_id: z.string().uuid().nullable(),
  program_phase_id: z.string().uuid().nullable(),
  change_type: z.enum(programChangeTypeValues),
  status: z.enum(programChangeStatusValues),
  target_entity_type: z.enum(programChangeTargetEntityTypeValues),
  target_entity_id: z.string().uuid().nullable(),
  change_command: jsonSchema,
  before_snapshot: jsonSchema,
  after_snapshot: jsonSchema,
  reason: z.string(),
  validation_result: jsonSchema,
  source_updated_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  approved_at: z.string().nullable(),
  applied_at: z.string().nullable(),
  rejected_at: z.string().nullable()
});

const programChangeEventRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  program_id: z.string().uuid().nullable(),
  proposal_id: z.string().uuid(),
  recommendation_id: z.string().uuid().nullable(),
  change_type: z.enum(programChangeTypeValues),
  before_snapshot: jsonSchema,
  after_snapshot: jsonSchema,
  source: z.enum(["ai", "deterministic", "athlete", "coach"]),
  applied_at: z.string(),
  created_at: z.string()
});

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return formatDate(date, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC", locale: getCurrentLocale() });
}

function parsePreviewSnapshot(snapshot: unknown): ProgramChangePreviewSnapshot {
  const value = snapshot as Record<string, unknown>;
  return {
    headline: String(value.headline ?? ""),
    subheadline: String(value.subheadline ?? ""),
    details: Array.isArray(value.details) ? value.details.map((item) => String(item)).filter(Boolean) : [],
    metrics: Array.isArray(value.metrics)
      ? value.metrics
          .map((item) => {
            const entry = item as Record<string, unknown>;
            const label = String(entry.label ?? "");
            const valueText = String(entry.value ?? "");
            return label && valueText ? { label, value: valueText } : null;
          })
          .filter((item): item is { label: string; value: string } => Boolean(item))
      : []
  };
}

function parseValidationResult(validationResult: unknown): ProgramChangeValidationResult {
  const value = validationResult as Record<string, unknown>;
  return {
    status: value.status === "needs_review" ? "needs_review" : "approved",
    messages: Array.isArray(value.messages) ? value.messages.map((item) => String(item)).filter(Boolean) : [],
    safetyFlags: Array.isArray(value.safetyFlags) ? value.safetyFlags.map((item) => String(item)).filter(Boolean) : [],
    sourceUpdatedAt: typeof value.sourceUpdatedAt === "string" ? value.sourceUpdatedAt : null
  };
}

function parseProposalRow(row: unknown): ProgramChangeProposalRecordView {
  const value = programChangeProposalRowSchema.parse(row);
  return {
    id: value.id,
    userId: value.user_id,
    recommendationId: value.recommendation_id,
    programId: value.program_id,
    programPhaseId: value.program_phase_id,
    changeType: value.change_type,
    status: value.status,
    targetEntityType: value.target_entity_type,
    targetEntityId: value.target_entity_id,
    changeCommand: programChangeCommandSchema.parse(value.change_command),
    beforeSnapshot: parsePreviewSnapshot(value.before_snapshot),
    afterSnapshot: parsePreviewSnapshot(value.after_snapshot),
    reason: value.reason,
    validationResult: parseValidationResult(value.validation_result),
    sourceUpdatedAt: value.source_updated_at,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    approvedAt: value.approved_at,
    appliedAt: value.applied_at,
    rejectedAt: value.rejected_at
  };
}

function parseEventRow(row: unknown): ProgramChangeEventRecordView {
  const value = programChangeEventRowSchema.parse(row);
  return {
    id: value.id,
    userId: value.user_id,
    programId: value.program_id,
    proposalId: value.proposal_id,
    recommendationId: value.recommendation_id,
    changeType: value.change_type,
    beforeSnapshot: parsePreviewSnapshot(value.before_snapshot),
    afterSnapshot: parsePreviewSnapshot(value.after_snapshot),
    source: value.source,
    appliedAt: value.applied_at,
    createdAt: value.created_at
  };
}

function listToText(items: string[]) {
  return items.length > 0 ? items.join(", ") : "None";
}

function findFirstTemplate(bundle: ProgramBundleView) {
  return bundle.templates.slice().sort((left, right) => left.sort_order - right.sort_order)[0] ?? null;
}

function findTemplateExercise(bundle: ProgramBundleView, templateId: string | null) {
  if (!templateId) {
    return null;
  }

  return bundle.templateExercises
    .filter((exercise) => exercise.workout_template_id === templateId)
    .sort((left, right) => left.sort_order - right.sort_order)[0] ?? null;
}

function findFirstScheduledWorkout(bundle: ProgramBundleView) {
  return bundle.scheduledWorkouts.slice().sort((left, right) => left.scheduled_date.localeCompare(right.scheduled_date))[0] ?? null;
}

function findNextFreeDate(bundle: ProgramBundleView, startDate: string) {
  const scheduledDates = new Set(bundle.scheduledWorkouts.map((row) => row.scheduled_date));
  let candidate = startDate;

  for (let index = 0; index < 14; index += 1) {
    if (!scheduledDates.has(candidate)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }

  return candidate;
}

function buildExerciseSwapOption(bundle: ProgramBundleView): ProgramChangeCommandOption | null {
  const template = findFirstTemplate(bundle);
  const templateExercise = findTemplateExercise(bundle, template?.id ?? null);
  const scheduledWorkout = findFirstScheduledWorkout(bundle);
  if (!template || !templateExercise || !scheduledWorkout) {
    return null;
  }

  const alternatives = getWorkoutAlternativeCards(templateExercise.exercise_key);
  const alternative = alternatives[0];
  if (!alternative) {
    return null;
  }

  const currentDefinition = getExerciseDefinition(templateExercise.exercise_key);
  const nextDefinition = getExerciseDefinition(alternative.exerciseId);
  return {
    command: {
      type: "exercise_swap",
      scheduledWorkoutId: scheduledWorkout.id,
      templateExerciseId: templateExercise.id,
      fromExerciseId: templateExercise.exercise_key,
      toExerciseId: alternative.exerciseId,
      reason: alternative.summary
    },
    title: "Swap exercise",
    summary: `${currentDefinition.name} → ${nextDefinition.name}`,
    note: alternative.summary,
    validationHint: `${listToText(currentDefinition.primaryMuscles)} to ${listToText(nextDefinition.primaryMuscles)}`
  };
}

function buildSetAdjustmentOption(bundle: ProgramBundleView): ProgramChangeCommandOption | null {
  const template = findFirstTemplate(bundle);
  const templateExercise = findTemplateExercise(bundle, template?.id ?? null);
  if (!template || !templateExercise || templateExercise.sets <= 1) {
    return null;
  }

  return {
    command: {
      type: "set_adjustment",
      templateExerciseId: templateExercise.id,
      currentSets: templateExercise.sets,
      proposedSets: templateExercise.sets - 1
    },
    title: "Reduce volume",
    summary: `${templateExercise.sets} sets → ${templateExercise.sets - 1} sets`,
    note: "Keep the same exercise and trim one set from the current prescription.",
    validationHint: "Small volume change"
  };
}

function buildRepRangeAdjustmentOption(bundle: ProgramBundleView): ProgramChangeCommandOption | null {
  const template = findFirstTemplate(bundle);
  const templateExercise = findTemplateExercise(bundle, template?.id ?? null);
  if (!template || !templateExercise || templateExercise.rep_max <= templateExercise.rep_min) {
    return null;
  }

  return {
    command: {
      type: "rep_range_adjustment",
      templateExerciseId: templateExercise.id,
      currentMin: templateExercise.rep_min,
      currentMax: templateExercise.rep_max,
      proposedMin: templateExercise.rep_min,
      proposedMax: Math.max(templateExercise.rep_min, templateExercise.rep_max - 1)
    },
    title: "Tighten rep range",
    summary: `${templateExercise.rep_min}-${templateExercise.rep_max} → ${templateExercise.rep_min}-${Math.max(templateExercise.rep_min, templateExercise.rep_max - 1)}`,
    note: "Keep the same exercise and narrow the top end of the target range.",
    validationHint: "Small rep-range adjustment"
  };
}

function buildWorkoutRescheduleOption(bundle: ProgramBundleView): ProgramChangeCommandOption | null {
  const workout = findFirstScheduledWorkout(bundle);
  if (!workout) {
    return null;
  }

  const nextDate = findNextFreeDate(bundle, addDays(workout.scheduled_date, 1));
  if (nextDate === workout.scheduled_date) {
    return null;
  }

  return {
    command: {
      type: "workout_reschedule",
      scheduledWorkoutId: workout.id,
      fromDate: workout.scheduled_date,
      toDate: nextDate
    },
    title: "Reschedule workout",
    summary: `${formatDateLabel(workout.scheduled_date)} → ${formatDateLabel(nextDate)}`,
    note: "Move the next scheduled workout to the next open day.",
    validationHint: "Schedule stays within the same plan"
  };
}

function buildPhaseExtensionOption(bundle: ProgramBundleView): ProgramChangeCommandOption | null {
  if (!bundle.activePhase) {
    return null;
  }

  const nextEndDate = addDays(bundle.activePhase.end_date, 7);
  return {
    command: {
      type: "phase_extension",
      phaseId: bundle.activePhase.id,
      currentEndDate: bundle.activePhase.end_date,
      proposedEndDate: nextEndDate
    },
    title: "Extend phase",
    summary: `${formatDateLabel(bundle.activePhase.end_date)} → ${formatDateLabel(nextEndDate)}`,
    note: "Add one week to the active phase without rewriting history.",
    validationHint: "Historical workouts stay intact"
  };
}

export function buildProgramChangeCommandOptions(bundle: ProgramBundleView, recommendation?: CoachRecommendationRecordView | null) {
  if (!bundle.activeProgram || !bundle.activePhase) {
    return [];
  }

  const options = [
    buildExerciseSwapOption(bundle),
    buildSetAdjustmentOption(bundle),
    buildRepRangeAdjustmentOption(bundle),
    buildWorkoutRescheduleOption(bundle),
    buildPhaseExtensionOption(bundle)
  ].filter((item): item is ProgramChangeCommandOption => Boolean(item));

  if (recommendation?.payload.recommendationType === "none") {
    return options.slice(0, 1);
  }

  return options;
}

function buildSafetyFlags(recommendation: CoachRecommendationRecordView | null) {
  const context = recommendation?.contextSnapshot;
  const flags: string[] = [];

  if (context && typeof context === "object") {
    const contextRecord = context as unknown as Record<string, unknown>;
    const athlete = contextRecord.athlete as Record<string, unknown> | undefined;
    const checkIn = contextRecord.checkIn as Record<string, unknown> | undefined;
    const nutrition = contextRecord.nutrition as Record<string, unknown> | undefined;
    const health = athlete?.healthSnapshot as Record<string, unknown> | undefined;

    if (health?.coachReviewRequired === true) {
      flags.push("Coach review required from athlete context.");
    }

    const currentPain = typeof health?.currentPain === "string" ? health.currentPain.trim() : "";
    if (currentPain) {
      flags.push(`Current pain noted: ${currentPain}.`);
    }

    const triggerKeys = Array.isArray(checkIn?.triggerKeys) ? checkIn?.triggerKeys.filter((item): item is string => typeof item === "string") : [];
    if (triggerKeys.includes("pain_discomfort") || triggerKeys.includes("recovery")) {
      flags.push(`Weekly check-in trigger keys: ${triggerKeys.join(", ")}.`);
    }

    const safetyHighlights = Array.isArray(nutrition?.safetyHighlights)
      ? nutrition.safetyHighlights.filter((item): item is string => typeof item === "string")
      : [];
    if (safetyHighlights.length > 0) {
      flags.push(`Nutrition safety notes: ${safetyHighlights.join(", ")}.`);
    }
  }

  return flags;
}

function buildValidationResult(
  recommendation: CoachRecommendationRecordView | null,
  command: ProgramChangeCommand,
  beforeSnapshot: ProgramChangePreviewSnapshot,
  afterSnapshot: ProgramChangePreviewSnapshot,
  messages: string[]
): ProgramChangeValidationResult {
  const safetyFlags = buildSafetyFlags(recommendation);
  const needsReview = safetyFlags.length > 0 || messages.some((message) => /conflict|mismatch|outside|unsupported|stale/i.test(message));

  if (command.type === "set_adjustment" && command.proposedSets > command.currentSets) {
    messages.push("Set increases require manual review.");
  }

  if (command.type === "rep_range_adjustment" && command.proposedMax > command.currentMax) {
    messages.push("Wider rep ranges require manual review.");
  }

  if (command.type === "phase_extension") {
    const currentEnd = new Date(`${command.currentEndDate}T00:00:00Z`).getTime();
    const proposedEnd = new Date(`${command.proposedEndDate}T00:00:00Z`).getTime();
    if (proposedEnd < currentEnd) {
      messages.push("Phase end dates cannot move backwards.");
    }
  }

  return {
    status: needsReview ? "needs_review" : "approved",
    messages,
    safetyFlags,
    sourceUpdatedAt: command.type === "phase_extension" ? beforeSnapshot.metrics.find((item) => item.label === "Last updated")?.value ?? null : beforeSnapshot.metrics.find((item) => item.label === "Last updated")?.value ?? null
  };
}

function buildPreviewSnapshot(
  headline: string,
  subheadline: string,
  details: string[],
  metrics: Array<{ label: string; value: string }>
): ProgramChangePreviewSnapshot {
  return {
    headline,
    subheadline,
    details,
    metrics
  };
}

function buildProgramChangeDraft(bundle: ProgramBundleView, recommendation: CoachRecommendationRecordView | null, command: ProgramChangeCommand): ProgramChangeProposalDraft {
  const messages: string[] = [];

  switch (command.type) {
    case "exercise_swap": {
      const template = bundle.templates.find((item) => item.id === bundle.templateExercises.find((exercise) => exercise.id === command.templateExerciseId)?.workout_template_id) ?? null;
      const templateExercise = bundle.templateExercises.find((exercise) => exercise.id === command.templateExerciseId) ?? null;
      if (!templateExercise || !template) {
        throw new Error("Exercise swap target was not found in the current program.");
      }

      if (templateExercise.exercise_key !== command.fromExerciseId) {
        messages.push("The exercise prescription changed after the proposal was prepared.");
      }

      const currentDefinition = getExerciseDefinition(templateExercise.exercise_key);
      const nextDefinition = getExerciseDefinition(command.toExerciseId);
      const alternatives = getWorkoutAlternativeCards(templateExercise.exercise_key);
      const allowed = alternatives.some((alternative) => alternative.exerciseId === command.toExerciseId);
      if (!allowed) {
        messages.push("The requested exercise is not a supported alternative for this movement.");
      }

      const beforeSnapshot = buildPreviewSnapshot(
        currentDefinition.name,
        template.name,
        [`Movement pattern: ${listToText(currentDefinition.primaryMuscles)}`, `Alternatives: ${alternatives.map((alternative) => getExerciseDefinition(alternative.exerciseId).name).join(", ") || "None"}`],
        [
          { label: "Sets", value: String(templateExercise.sets) },
          { label: "Reps", value: `${templateExercise.rep_min}-${templateExercise.rep_max}` },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Rest", value: `${templateExercise.rest_seconds}s` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const afterSnapshot = buildPreviewSnapshot(
        nextDefinition.name,
        template.name,
        [`Movement pattern: ${listToText(nextDefinition.primaryMuscles)}`, `Reason: ${command.reason}`],
        [
          { label: "Sets", value: String(templateExercise.sets) },
          { label: "Reps", value: `${templateExercise.rep_min}-${templateExercise.rep_max}` },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Rest", value: `${templateExercise.rest_seconds}s` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const validationResult = buildValidationResult(recommendation, command, beforeSnapshot, afterSnapshot, messages);

      return {
        changeType: "exercise_swap",
        targetEntityType: "workout_template_exercise",
        targetEntityId: templateExercise.id,
        programId: bundle.activeProgram?.id ?? null,
        programPhaseId: bundle.activePhase?.id ?? null,
        reason: command.reason,
        changeCommand: command,
        beforeSnapshot,
        afterSnapshot,
        validationResult,
        sourceUpdatedAt: templateExercise.updated_at,
        status: validationResult.status === "approved" ? "proposed" : "needs_review"
      };
    }
    case "set_adjustment": {
      const templateExercise = bundle.templateExercises.find((exercise) => exercise.id === command.templateExerciseId) ?? null;
      if (!templateExercise) {
        throw new Error("Set adjustment target was not found in the current program.");
      }

      if (templateExercise.sets !== command.currentSets) {
        messages.push("The exercise set count changed after the proposal was prepared.");
      }

      if (Math.abs(command.proposedSets - command.currentSets) > 1) {
        messages.push("Set changes beyond one set require manual review.");
      }

      if (command.proposedSets > command.currentSets) {
        messages.push("Increasing set volume requires manual review.");
      }

      const definition = getExerciseDefinition(templateExercise.exercise_key);
      const beforeSnapshot = buildPreviewSnapshot(
        definition.name,
        "Volume adjustment",
        ["Keep the exercise, trim the set count, and preserve the prescription history."],
        [
          { label: "Sets", value: String(command.currentSets) },
          { label: "Reps", value: `${templateExercise.rep_min}-${templateExercise.rep_max}` },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const afterSnapshot = buildPreviewSnapshot(
        definition.name,
        "Volume adjustment",
        ["Proposed set count keeps the same movement and future sessions only."],
        [
          { label: "Sets", value: String(command.proposedSets) },
          { label: "Reps", value: `${templateExercise.rep_min}-${templateExercise.rep_max}` },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const validationResult = buildValidationResult(recommendation, command, beforeSnapshot, afterSnapshot, messages);

      return {
        changeType: "set_adjustment",
        targetEntityType: "workout_template_exercise",
        targetEntityId: templateExercise.id,
        programId: bundle.activeProgram?.id ?? null,
        programPhaseId: bundle.activePhase?.id ?? null,
        reason: `Adjust sets from ${command.currentSets} to ${command.proposedSets}.`,
        changeCommand: command,
        beforeSnapshot,
        afterSnapshot,
        validationResult,
        sourceUpdatedAt: templateExercise.updated_at,
        status: validationResult.status === "approved" ? "proposed" : "needs_review"
      };
    }
    case "rep_range_adjustment": {
      const templateExercise = bundle.templateExercises.find((exercise) => exercise.id === command.templateExerciseId) ?? null;
      if (!templateExercise) {
        throw new Error("Rep-range target was not found in the current program.");
      }

      if (templateExercise.rep_min !== command.currentMin || templateExercise.rep_max !== command.currentMax) {
        messages.push("The rep prescription changed after the proposal was prepared.");
      }

      if (command.proposedMin > command.proposedMax) {
        messages.push("The proposed minimum reps cannot exceed the maximum.");
      }

      if (command.proposedMax - command.proposedMin > 2) {
        messages.push("Large rep-range changes require manual review.");
      }

      const definition = getExerciseDefinition(templateExercise.exercise_key);
      const beforeSnapshot = buildPreviewSnapshot(
        definition.name,
        "Rep range adjustment",
        ["Keep the exercise and narrow or refine the current target range."],
        [
          { label: "Reps", value: `${command.currentMin}-${command.currentMax}` },
          { label: "Sets", value: String(templateExercise.sets) },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const afterSnapshot = buildPreviewSnapshot(
        definition.name,
        "Rep range adjustment",
        ["Historical performed reps stay untouched; only the future prescription changes."],
        [
          { label: "Reps", value: `${command.proposedMin}-${command.proposedMax}` },
          { label: "Sets", value: String(templateExercise.sets) },
          { label: "RIR", value: `${templateExercise.rir_min}-${templateExercise.rir_max}` },
          { label: "Last updated", value: templateExercise.updated_at }
        ]
      );
      const validationResult = buildValidationResult(recommendation, command, beforeSnapshot, afterSnapshot, messages);

      return {
        changeType: "rep_range_adjustment",
        targetEntityType: "workout_template_exercise",
        targetEntityId: templateExercise.id,
        programId: bundle.activeProgram?.id ?? null,
        programPhaseId: bundle.activePhase?.id ?? null,
        reason: `Adjust rep range from ${command.currentMin}-${command.currentMax} to ${command.proposedMin}-${command.proposedMax}.`,
        changeCommand: command,
        beforeSnapshot,
        afterSnapshot,
        validationResult,
        sourceUpdatedAt: templateExercise.updated_at,
        status: validationResult.status === "approved" ? "proposed" : "needs_review"
      };
    }
    case "workout_reschedule": {
      const scheduledWorkout = bundle.scheduledWorkouts.find((row) => row.id === command.scheduledWorkoutId) ?? null;
      if (!scheduledWorkout) {
        throw new Error("Scheduled workout was not found.");
      }

      if (scheduledWorkout.scheduled_date !== command.fromDate) {
        messages.push("The scheduled date changed after the proposal was prepared.");
      }

      if (scheduledWorkout.status === "completed") {
        messages.push("Completed workouts cannot be rescheduled.");
      }

      if (bundle.scheduledWorkouts.some((row) => row.id !== scheduledWorkout.id && row.scheduled_date === command.toDate)) {
        messages.push("Another workout already exists on the proposed date.");
      }

      const beforeSnapshot = buildPreviewSnapshot(
        "Workout reschedule",
        formatDateLabel(command.fromDate),
        ["Move the existing scheduled workout without changing the template or session history."],
        [
          { label: "From", value: formatDateLabel(command.fromDate) },
          { label: "To", value: formatDateLabel(command.toDate) },
          { label: "Status", value: scheduledWorkout.status },
          { label: "Last updated", value: scheduledWorkout.updated_at }
        ]
      );
      const afterSnapshot = buildPreviewSnapshot(
        "Workout reschedule",
        formatDateLabel(command.toDate),
        ["The scheduled workout stays linked to the same template and athlete."],
        [
          { label: "From", value: formatDateLabel(command.fromDate) },
          { label: "To", value: formatDateLabel(command.toDate) },
          { label: "Status", value: "rescheduled" },
          { label: "Last updated", value: scheduledWorkout.updated_at }
        ]
      );
      const validationResult = buildValidationResult(recommendation, command, beforeSnapshot, afterSnapshot, messages);

      return {
        changeType: "workout_reschedule",
        targetEntityType: "scheduled_workout",
        targetEntityId: scheduledWorkout.id,
        programId: bundle.activeProgram?.id ?? null,
        programPhaseId: bundle.activePhase?.id ?? null,
        reason: `Move the workout from ${command.fromDate} to ${command.toDate}.`,
        changeCommand: command,
        beforeSnapshot,
        afterSnapshot,
        validationResult,
        sourceUpdatedAt: scheduledWorkout.updated_at,
        status: validationResult.status === "approved" ? "proposed" : "needs_review"
      };
    }
    case "phase_extension": {
      const phase = bundle.activePhase;
      if (!phase) {
        throw new Error("Phase extension target was not found.");
      }

      if (phase.id !== command.phaseId) {
        messages.push("The active phase changed after the proposal was prepared.");
      }

      if (command.proposedEndDate <= command.currentEndDate) {
        messages.push("The proposed phase end date must move forward.");
      }

      const beforeSnapshot = buildPreviewSnapshot(
        phase.name,
        "Phase extension",
        ["Extend the active phase only; do not rewrite past sessions or historical reviews."],
        [
          { label: "Current end", value: formatDateLabel(command.currentEndDate) },
          { label: "Proposed end", value: formatDateLabel(command.proposedEndDate) },
          { label: "Phase", value: phase.name },
          { label: "Last updated", value: phase.updated_at }
        ]
      );
      const afterSnapshot = buildPreviewSnapshot(
        phase.name,
        "Phase extension",
        ["Historical workouts remain untouched while the future schedule shifts forward."],
        [
          { label: "Current end", value: formatDateLabel(command.currentEndDate) },
          { label: "Proposed end", value: formatDateLabel(command.proposedEndDate) },
          { label: "Phase", value: phase.name },
          { label: "Last updated", value: phase.updated_at }
        ]
      );
      const validationResult = buildValidationResult(recommendation, command, beforeSnapshot, afterSnapshot, messages);

      return {
        changeType: "phase_extension",
        targetEntityType: "program_phase",
        targetEntityId: phase.id,
        programId: bundle.activeProgram?.id ?? null,
        programPhaseId: phase.id,
        reason: `Extend the phase from ${command.currentEndDate} to ${command.proposedEndDate}.`,
        changeCommand: command,
        beforeSnapshot,
        afterSnapshot,
        validationResult,
        sourceUpdatedAt: phase.updated_at,
        status: validationResult.status === "approved" ? "proposed" : "needs_review"
      };
    }
  }
}

function buildProposalInsert(userId: string, recommendationId: string | null, draft: ProgramChangeProposalDraft): Record<string, unknown> {
  return {
    id: createId(),
    user_id: userId,
    recommendation_id: recommendationId,
    program_id: draft.programId,
    program_phase_id: draft.programPhaseId,
    change_type: draft.changeType,
    status: draft.status,
    target_entity_type: draft.targetEntityType,
    target_entity_id: draft.targetEntityId,
    change_command: draft.changeCommand as unknown as Json,
    before_snapshot: draft.beforeSnapshot as unknown as Json,
    after_snapshot: draft.afterSnapshot as unknown as Json,
    reason: draft.reason,
    validation_result: draft.validationResult as unknown as Json,
    source_updated_at: draft.sourceUpdatedAt,
    approved_at: draft.status === "approved" ? new Date().toISOString() : null,
    applied_at: null,
    rejected_at: null
  };
}

export function buildProgramChangeProposalFromCommand(
  bundle: ProgramBundleView,
  recommendation: CoachRecommendationRecordView | null,
  command: ProgramChangeCommand
) {
  return buildProgramChangeDraft(bundle, recommendation, command);
}

export function parseProgramChangeProposal(row: unknown) {
  return parseProposalRow(row);
}

export function parseProgramChangeEvent(row: unknown) {
  return parseEventRow(row);
}

export async function getProgramChangeProposalById(client: SupabaseClient<Database>, userId: string, proposalId: string) {
  const result = await client.from("program_change_proposals").select("*").eq("id", proposalId).eq("user_id", userId).maybeSingle();
  if (result.error) {
    throw result.error;
  }

  return result.data ? parseProposalRow(result.data) : null;
}

export async function getLatestProgramChangeProposalByRecommendation(
  client: SupabaseClient<Database>,
  userId: string,
  recommendationId: string
) {
  const result = await client
    .from("program_change_proposals")
    .select("*")
    .eq("user_id", userId)
    .eq("recommendation_id", recommendationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? parseProposalRow(result.data) : null;
}

export async function createProgramChangeProposal(
  client: SupabaseClient<Database>,
  userId: string,
  recommendation: CoachRecommendationRecordView,
  bundle: ProgramBundleView,
  command: ProgramChangeCommand
) {
  const existing = await getLatestProgramChangeProposalByRecommendation(client, userId, recommendation.id);
  if (existing) {
    return existing;
  }

  const draft = buildProgramChangeProposalFromCommand(bundle, recommendation, command);
  const insert = buildProposalInsert(userId, recommendation.id, draft);
  const response = await client.from("program_change_proposals").insert(insert as never).select("*").single();

  if (response.error) {
    throw response.error;
  }

  return parseProposalRow(response.data);
}

export async function applyProgramChangeProposal(client: SupabaseClient<Database>, proposalId: string) {
  const response = await (client as any).rpc("apply_program_change_proposal", { p_proposal_id: proposalId });

  if (response.error) {
    throw response.error;
  }

  return parseProposalRow(response.data);
}

export async function loadProgramChangeEventByProposalId(client: SupabaseClient<Database>, userId: string, proposalId: string) {
  const response = await client.from("program_change_events").select("*").eq("proposal_id", proposalId).eq("user_id", userId).maybeSingle();
  if (response.error) {
    throw response.error;
  }

  return response.data ? parseEventRow(response.data) : null;
}

export function proposalStatusLabel(status: ProgramChangeStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "proposed":
      return "Preview ready";
    case "needs_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "applied":
      return "Applied";
    case "failed":
      return "Failed";
    case "superseded":
      return "Superseded";
    case "expired":
      return "Expired";
  }
}

export function commandLabel(command: ProgramChangeCommand) {
  switch (command.type) {
    case "exercise_swap":
      return "Exercise swap";
    case "set_adjustment":
      return "Set adjustment";
    case "rep_range_adjustment":
      return "Rep-range adjustment";
    case "workout_reschedule":
      return "Workout reschedule";
    case "phase_extension":
      return "Phase extension";
  }
}
