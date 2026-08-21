import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { formatDate, getCurrentLocale } from "@/lib/i18n";
import { parseNumericInput } from "@/lib/numeric-input";
import type {
  Database,
  ScheduledWorkoutsRow,
  WorkoutSessionExercisesInsert,
  WorkoutSessionExercisesRow,
  WorkoutSessionExercisesUpdate,
  WorkoutSessionsInsert,
  WorkoutSessionsRow,
  WorkoutSetsInsert,
  WorkoutSetsRow,
  WorkoutSetsUpdate
} from "@/lib/supabase/database.types";
import { buildWorkoutSessionFromDaySummary, type ProgramDaySummary, type ProgramTemplateExercise, type ProgramTemplateView } from "@/lib/program-service";
import { buildWorkoutWorkflowState } from "@/lib/workout-live-state";
import { getExerciseDefinition, type CompletedSet, type SessionExercise, type WorkoutSessionState } from "@/lib/workout-data";

const workoutSessionStatusValues = ["in_progress", "completed", "abandoned"] as const;
const workoutSessionExerciseStatusValues = ["planned", "completed", "skipped"] as const;
const workoutSetStatusValues = ["planned", "completed", "skipped"] as const;

const workoutSessionsRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  scheduled_workout_id: z.string().uuid().nullable(),
  workout_template_id: z.string().uuid().nullable(),
  status: z.enum(workoutSessionStatusValues),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  session_metadata: z.unknown().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

const workoutSessionExercisesRowSchema = z.object({
  id: z.string().uuid(),
  workout_session_id: z.string().uuid(),
  prescribed_template_exercise_id: z.string().uuid().nullable(),
  prescribed_exercise_key: z.string(),
  performed_exercise_key: z.string(),
  sort_order: z.number().int().nonnegative(),
  target_sets: z.number().int().nonnegative().nullable(),
  rep_min: z.number().int().nonnegative().nullable(),
  rep_max: z.number().int().nonnegative().nullable(),
  rir_min: z.number().nonnegative().nullable(),
  rir_max: z.number().nonnegative().nullable(),
  rest_seconds: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  swap_reason: z.string().nullable(),
  status: z.enum(workoutSessionExerciseStatusValues),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

const workoutSetsRowSchema = z.object({
  id: z.string().uuid(),
  workout_session_exercise_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  status: z.enum(workoutSetStatusValues),
  weight_kg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
  rir: z.number().nonnegative().nullable(),
  completed_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

function parseWorkoutSessionRow(row: unknown) {
  return workoutSessionsRowSchema.parse(row) as WorkoutSessionsRow;
}

function parseWorkoutSessionExerciseRow(row: unknown) {
  return workoutSessionExercisesRowSchema.parse(row) as WorkoutSessionExercisesRow;
}

function parseWorkoutSetRow(row: unknown) {
  return workoutSetsRowSchema.parse(row) as WorkoutSetsRow;
}

export interface WorkoutSessionSeed {
  routeSessionId: string;
  userId: string;
  scheduledWorkout: ScheduledWorkoutsRow;
  day: ProgramDaySummary;
  template: ProgramTemplateView;
  templateExercises: Array<ProgramTemplateExercise & { id: string }>;
}

export interface WorkoutHistoryPerformance {
  performedExerciseKey: string;
  workoutSessionId: string;
  workoutSessionExerciseId: string;
  completedAt: string;
  label: string;
  setCount: number;
  bestSet: {
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
  } | null;
}

export interface WorkoutSessionLoadResult {
  session: WorkoutSessionState;
  sessionRow: WorkoutSessionsRow;
  exerciseRows: WorkoutSessionExercisesRow[];
  setRows: WorkoutSetsRow[];
  source: "remote" | "created";
}

export interface WorkoutSetPayload {
  kilograms: string;
  reps: string;
  rir?: string;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isDuplicateKeyError(error: { message?: string; code?: string } | null | undefined) {
  return Boolean(error && (error.code === "23505" || /duplicate key/i.test(error.message ?? "")));
}

function formatWeight(value: number | null) {
  if (value == null) {
    return null;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatPerformanceLabel(bestSet: WorkoutHistoryPerformance["bestSet"], setRows: WorkoutSetsRow[]) {
  if (!bestSet) {
    return null;
  }

  const weightLabel = bestSet.weightKg == null ? "BW" : `${formatWeight(bestSet.weightKg)} kg`;
  const repLabel = setRows
    .map((row) => row.reps)
    .filter((value): value is number => typeof value === "number")
    .join(", ");
  const rirLabel = bestSet.rir == null ? "" : ` | RIR ${bestSet.rir}`;

  return `${weightLabel} | ${repLabel}${rirLabel ? ` ${rirLabel}` : ""}`.trim();
}

function computeVolume(setRows: WorkoutSetsRow[]) {
  return setRows.reduce((total, setRow) => total + (setRow.weight_kg ?? 0) * (setRow.reps ?? 0), 0);
}

function computeAverageRir(setRows: WorkoutSetsRow[]) {
  const completedRir = setRows.filter((setRow) => setRow.status === "completed" && setRow.rir != null).map((setRow) => setRow.rir as number);
  if (completedRir.length === 0) {
    return null;
  }

  const average = completedRir.reduce((total, value) => total + value, 0) / completedRir.length;
  return Number.isInteger(average) ? String(average) : average.toFixed(1).replace(/\.0$/, "");
}

function computeSummaryDuration(sessionRow: WorkoutSessionsRow, fallbackDuration: string) {
  if (sessionRow.duration_seconds == null) {
    return fallbackDuration;
  }

  const minutes = Math.max(1, Math.round(sessionRow.duration_seconds / 60));
  return `${minutes} min`;
}

function toCompletedSet(row: WorkoutSetsRow): CompletedSet {
  return {
    setNumber: row.set_number,
    kilograms: row.weight_kg ?? 0,
    reps: row.reps ?? 0,
    rir: row.rir ?? undefined,
    performedAt: row.completed_at ?? row.updated_at
  };
}

function buildHistoryLabel(performance: WorkoutHistoryPerformance | null, fallback: string) {
  if (!performance) {
    return fallback;
  }

  const date = new Date(performance.completedAt);
  const formattedDate = formatDate(date, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    locale: getCurrentLocale()
  });

  return `${formattedDate.toUpperCase()} | COMPLETED`;
}

function buildWorkoutSummary(
  sessionRow: WorkoutSessionsRow,
  fallbackDuration: string,
  exerciseRows: WorkoutSessionExercisesRow[],
  setRows: WorkoutSetsRow[],
  historyEntries: WorkoutHistoryPerformance[],
  fallbackSummary: WorkoutSessionState["summary"]
) {
  const completedSetRows = setRows.filter((row) => row.status === "completed");
  const completeExerciseCount = exerciseRows.filter((exerciseRow) => {
    const exerciseSetRows = setRows.filter((setRow) => setRow.workout_session_exercise_id === exerciseRow.id);
    const targetSets = exerciseRow.target_sets ?? exerciseSetRows.length;
    const completedSetCount = exerciseSetRows.filter((setRow) => setRow.status === "completed").length;
    return exerciseRow.status === "completed" || (targetSets > 0 && completedSetCount >= targetSets);
  }).length;

  return {
    duration: computeSummaryDuration(sessionRow, fallbackDuration),
    exercisesCompleted: `${completeExerciseCount} / ${exerciseRows.length}`,
    setsCompleted: String(completedSetRows.length),
    totalVolume: `${Math.round(computeVolume(completedSetRows)).toLocaleString(getCurrentLocale())} kg`,
    averageRir: computeAverageRir(completedSetRows),
    insight: historyEntries.length > 0 ? "Workout history is now stored remotely and can power the next progression step." : fallbackSummary.insight,
    nextTime:
      historyEntries.length > 0
        ? historyEntries.slice(0, 2).map((performance) => ({
            label: `${performance.performedExerciseKey.replace(/-/g, " ").toUpperCase()}`,
            detail: performance.label
          }))
        : fallbackSummary.nextTime,
    feedback: fallbackSummary.feedback
  };
}

export function isWorkoutSessionExerciseComplete(
  targetSets: number | null,
  setRows: Array<Pick<WorkoutSetsRow, "status">>
) {
  const completedSetCount = setRows.filter((row) => row.status === "completed").length;
  const expectedSets = targetSets ?? setRows.length;
  return expectedSets > 0 && completedSetCount >= expectedSets;
}

function buildSessionExerciseInsertRows(seed: WorkoutSessionSeed, sessionId: string): WorkoutSessionExercisesInsert[] {
  return seed.templateExercises.map((templateExercise, index) => ({
    id: createId(),
    workout_session_id: sessionId,
    prescribed_template_exercise_id: templateExercise.id,
    prescribed_exercise_key: templateExercise.exerciseKey,
    performed_exercise_key: templateExercise.exerciseKey,
    sort_order: templateExercise.sortOrder ?? index + 1,
    target_sets: templateExercise.sets,
    rep_min: templateExercise.repMin,
    rep_max: templateExercise.repMax,
    rir_min: templateExercise.rirMin,
    rir_max: templateExercise.rirMax,
    rest_seconds: templateExercise.restSeconds,
    notes: templateExercise.notes || null,
    swap_reason: null,
    status: "planned",
    started_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

function buildSetInsertRows(exerciseRows: WorkoutSessionExercisesRow[], templateExercises: ProgramTemplateExercise[]): WorkoutSetsInsert[] {
  return exerciseRows.flatMap((exerciseRow) => {
    const templateExercise = templateExercises.find((item) => item.exerciseKey === exerciseRow.prescribed_exercise_key);
    const setCount = templateExercise?.sets ?? exerciseRow.target_sets ?? 0;

    return Array.from({ length: setCount }, (_, index) => ({
      id: createId(),
      workout_session_exercise_id: exerciseRow.id,
      set_number: index + 1,
      status: "planned",
      weight_kg: null,
      reps: null,
      rir: null,
      completed_at: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  });
}

async function fetchWorkoutSessionRow(client: SupabaseClient<Database>, routeSessionId: string, userId: string) {
  const byId = await client.from("workout_sessions").select("*").eq("id", routeSessionId).maybeSingle();
  if (byId.error) {
    throw byId.error;
  }

  if (byId.data) {
    return parseWorkoutSessionRow(byId.data);
  }

  const byScheduled = await client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("scheduled_workout_id", routeSessionId)
    .maybeSingle();

  if (byScheduled.error) {
    throw byScheduled.error;
  }

  if (byScheduled.data) {
    return parseWorkoutSessionRow(byScheduled.data);
  }

  return null;
}

async function fetchRecentExercisePerformance(
  client: SupabaseClient<Database>,
  userId: string,
  performedExerciseKey: string
): Promise<WorkoutHistoryPerformance | null> {
  const completedSessions = await client
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  if (completedSessions.error) {
    throw completedSessions.error;
  }

  const sessionIds = ((completedSessions.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (sessionIds.length === 0) {
    return null;
  }

  const exerciseRows = await client
    .from("workout_session_exercises")
    .select("*")
    .in("workout_session_id", sessionIds)
    .eq("performed_exercise_key", performedExerciseKey)
    .order("completed_at", { ascending: false });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const latestExerciseRows = ((exerciseRows.data ?? []) as unknown[]).map((row) => parseWorkoutSessionExerciseRow(row));
  const latestExercise = latestExerciseRows[0];
  if (!latestExercise) {
    return null;
  }

  const setsResult = await client
    .from("workout_sets")
    .select("*")
    .eq("workout_session_exercise_id", latestExercise.id)
    .order("set_number", { ascending: true });

  if (setsResult.error) {
    throw setsResult.error;
  }

  const setRows = (setsResult.data ?? []).map((row) => parseWorkoutSetRow(row));
  const bestSet = setRows
    .filter((row) => row.status === "completed")
    .slice()
    .reverse()
    .find((row) => row.weight_kg != null || row.reps != null || row.rir != null);

  return {
    performedExerciseKey,
    workoutSessionId: latestExercise.workout_session_id,
    workoutSessionExerciseId: latestExercise.id,
    completedAt: latestExercise.completed_at ?? latestExercise.updated_at,
    label: formatPerformanceLabel(
      bestSet
        ? {
            weightKg: bestSet.weight_kg,
            reps: bestSet.reps,
            rir: bestSet.rir
          }
        : null,
      setRows
    ) ?? "No previous data",
    setCount: setRows.filter((row) => row.status === "completed").length,
    bestSet: bestSet
      ? {
          weightKg: bestSet.weight_kg,
          reps: bestSet.reps,
          rir: bestSet.rir
        }
      : null
  };
}

async function loadWorkoutSessionRows(client: SupabaseClient<Database>, sessionId: string) {
  const exerciseRowsResult = await client
    .from("workout_session_exercises")
    .select("*")
    .eq("workout_session_id", sessionId)
    .order("sort_order", { ascending: true });

  if (exerciseRowsResult.error) {
    throw exerciseRowsResult.error;
  }

  const exerciseRows = (exerciseRowsResult.data ?? []).map((row) => parseWorkoutSessionExerciseRow(row));
  const exerciseIds = exerciseRows.map((row) => row.id);

  if (exerciseIds.length === 0) {
    return { exerciseRows, setRows: [] as WorkoutSetsRow[] };
  }

  const setRowsResult = await client
    .from("workout_sets")
    .select("*")
    .in("workout_session_exercise_id", exerciseIds)
    .order("set_number", { ascending: true });

  if (setRowsResult.error) {
    throw setRowsResult.error;
  }

  return {
    exerciseRows,
    setRows: (setRowsResult.data ?? []).map((row) => parseWorkoutSetRow(row))
  };
}

function buildWorkoutSessionState(
  seed: WorkoutSessionSeed,
  sessionRow: WorkoutSessionsRow,
  exerciseRows: WorkoutSessionExercisesRow[],
  setRows: WorkoutSetsRow[],
  historyByExerciseKey: Map<string, WorkoutHistoryPerformance | null>
): WorkoutSessionState {
  const base = buildWorkoutSessionFromDaySummary(seed.day, {
    id: seed.template.id,
    code: seed.template.code,
    name: seed.template.name,
    focus: seed.template.focus,
    estimatedDurationMinutes: seed.template.estimatedDurationMinutes,
    sortOrder: seed.template.sortOrder,
    exercises: seed.templateExercises.map((exercise) => ({
      exerciseKey: exercise.exerciseKey,
      sortOrder: exercise.sortOrder,
      sets: exercise.sets,
      repMin: exercise.repMin,
      repMax: exercise.repMax,
      rirMin: exercise.rirMin,
      rirMax: exercise.rirMax,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes
    }))
  });

  const nextExercises = exerciseRows
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((exerciseRow, index) => {
      const definition = getExerciseDefinition(exerciseRow.performed_exercise_key);
      const rows = setRows
        .filter((setRow) => setRow.workout_session_exercise_id === exerciseRow.id)
        .slice()
        .sort((left, right) => left.set_number - right.set_number);

      const previousPerformance = historyByExerciseKey.get(exerciseRow.performed_exercise_key);
      const lastComparableSession = previousPerformance?.label ?? definition.lastPerformance;
      const isCompleted = exerciseRow.status === "completed" || isWorkoutSessionExerciseComplete(exerciseRow.target_sets, rows);

      return {
        id: exerciseRow.id,
        sessionExerciseId: exerciseRow.id,
        prescribedTemplateExerciseId: exerciseRow.prescribed_template_exercise_id ?? null,
        prescribedExerciseId: exerciseRow.prescribed_exercise_key,
        performedExerciseId: exerciseRow.performed_exercise_key,
        order: index + 1,
        totalExercises: exerciseRows.length,
        totalSets: exerciseRow.target_sets ?? rows.length,
        targetRir:
          exerciseRow.rir_min != null && exerciseRow.rir_max != null
            ? exerciseRow.rir_min === exerciseRow.rir_max
              ? String(exerciseRow.rir_min)
              : `${exerciseRow.rir_min}-${exerciseRow.rir_max}`
            : definition.programRir,
        restSeconds: exerciseRow.rest_seconds ?? definition.restSeconds,
        lastComparableSession,
        suggestedTarget: definition.progressionTarget,
        sets: rows.map((row) => ({
          setNumber: row.set_number,
          previous: lastComparableSession,
          kilograms: row.weight_kg == null ? "" : String(row.weight_kg),
          reps: row.reps == null ? "" : String(row.reps),
          rir: row.rir == null ? undefined : String(row.rir),
          completed: row.status === "completed",
          workoutSetId: row.id,
          status: row.status,
          completedAt: row.completed_at,
          notes: row.notes ?? null
        })),
        completedSets: rows.filter((row) => row.status === "completed").map(toCompletedSet),
        status: isCompleted ? "completed" : exerciseRow.status,
        startedAt: exerciseRow.started_at,
        completedAt: isCompleted ? exerciseRow.completed_at ?? sessionRow.completed_at : exerciseRow.completed_at,
        swapReason: exerciseRow.swap_reason ?? null
      } satisfies SessionExercise;
    });

  const historyEntries = Array.from(historyByExerciseKey.values())
    .filter((item): item is WorkoutHistoryPerformance => Boolean(item))
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime());

  const sessionState: WorkoutSessionState = {
    ...base,
    id: sessionRow.id,
    workoutSessionId: sessionRow.id,
    scheduledWorkoutId: sessionRow.scheduled_workout_id,
    workoutTemplateId: sessionRow.workout_template_id,
    status: sessionRow.status,
    startedAt: sessionRow.started_at,
    completedAt: sessionRow.completed_at,
    durationSeconds: sessionRow.duration_seconds,
    notes: sessionRow.notes ?? null,
    sessionMetadata: toRecord(sessionRow.session_metadata),
    saveState: "saved",
    saveError: null,
    source: "remote",
    persistence: {
      workoutSessionId: sessionRow.id,
      scheduledWorkoutId: sessionRow.scheduled_workout_id,
      workoutTemplateId: sessionRow.workout_template_id,
      status: sessionRow.status,
      startedAt: sessionRow.started_at,
      completedAt: sessionRow.completed_at,
      durationSeconds: sessionRow.duration_seconds,
      notes: sessionRow.notes,
      sessionMetadata: toRecord(sessionRow.session_metadata)
    },
    lastSessionLabel: buildHistoryLabel(historyEntries[0] ?? null, base.lastSessionLabel),
    exercises: nextExercises,
    totalExercises: nextExercises.length,
    totalSets: nextExercises.reduce((total, exercise) => total + exercise.totalSets, 0),
    summary: buildWorkoutSummary(sessionRow, base.summary.duration, exerciseRows, setRows, historyEntries, base.summary)
  };

  return {
    ...sessionState,
    workflow: buildWorkoutWorkflowState(sessionState)
  };
}

async function loadExistingWorkoutSession(
  client: SupabaseClient<Database>,
  seed: WorkoutSessionSeed,
  sessionRow: WorkoutSessionsRow
): Promise<WorkoutSessionLoadResult> {
  const { exerciseRows, setRows } = await loadWorkoutSessionRows(client, sessionRow.id);
  const historyByExerciseKey = new Map<string, WorkoutHistoryPerformance | null>();

  for (const exercise of exerciseRows) {
    if (historyByExerciseKey.has(exercise.performed_exercise_key)) {
      continue;
    }

    historyByExerciseKey.set(exercise.performed_exercise_key, await fetchRecentExercisePerformance(client, seed.userId, exercise.performed_exercise_key));
  }

  return {
    session: buildWorkoutSessionState(seed, sessionRow, exerciseRows, setRows, historyByExerciseKey),
    sessionRow,
    exerciseRows,
    setRows,
    source: "remote"
  };
}

async function createWorkoutSession(
  client: SupabaseClient<Database>,
  seed: WorkoutSessionSeed
): Promise<WorkoutSessionLoadResult> {
  const startedAt = new Date().toISOString();
  const sessionPayload: WorkoutSessionsInsert = {
    id: createId(),
    user_id: seed.userId,
    scheduled_workout_id: seed.scheduledWorkout.id,
    workout_template_id: seed.template.id,
    status: "in_progress",
    started_at: startedAt,
    duration_seconds: null,
    notes: null,
    session_metadata: {
      source: "coachx-slice3",
      routeSessionId: seed.routeSessionId,
      scheduledWorkoutId: seed.scheduledWorkout.id,
      templateCode: seed.template.code
    }
  };

  const sessionResult = await client.from("workout_sessions").insert([sessionPayload] as never[]).select("*").single();
  if (sessionResult.error) {
    if (!isDuplicateKeyError(sessionResult.error)) {
      throw sessionResult.error;
    }
  }

  const sessionRowResult = await client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", seed.userId)
    .eq("scheduled_workout_id", seed.scheduledWorkout.id)
    .single();

  if (sessionRowResult.error) {
    throw sessionRowResult.error;
  }

  const sessionRow = parseWorkoutSessionRow(sessionRowResult.data);
  const exerciseRowsToInsert = buildSessionExerciseInsertRows(seed, sessionRow.id);
  const exerciseInsertResult = await client.from("workout_session_exercises").insert(exerciseRowsToInsert as never[]).select("*");
  if (exerciseInsertResult.error) {
    throw exerciseInsertResult.error;
  }

  const persistedExerciseRowsResult = await client
    .from("workout_session_exercises")
    .select("*")
    .eq("workout_session_id", sessionRow.id)
    .order("sort_order", { ascending: true });

  if (persistedExerciseRowsResult.error) {
    throw persistedExerciseRowsResult.error;
  }

  const persistedExerciseRows = (persistedExerciseRowsResult.data ?? []).map((row) => parseWorkoutSessionExerciseRow(row));
  const setRowsToInsert = buildSetInsertRows(persistedExerciseRows, seed.templateExercises);
  const setInsertResult = await client.from("workout_sets").insert(setRowsToInsert as never[]).select("*");
  if (setInsertResult.error) {
    throw setInsertResult.error;
  }

  const persistedSetRowsResult = await client
    .from("workout_sets")
    .select("*")
    .in("workout_session_exercise_id", persistedExerciseRows.map((row) => row.id))
    .order("set_number", { ascending: true });

  if (persistedSetRowsResult.error) {
    throw persistedSetRowsResult.error;
  }

  const persistedSetRows = (persistedSetRowsResult.data ?? []).map((row) => parseWorkoutSetRow(row));
  const historyByExerciseKey = new Map<string, WorkoutHistoryPerformance | null>();

  for (const exercise of persistedExerciseRows) {
    if (historyByExerciseKey.has(exercise.performed_exercise_key)) {
      continue;
    }

    historyByExerciseKey.set(exercise.performed_exercise_key, await fetchRecentExercisePerformance(client, seed.userId, exercise.performed_exercise_key));
  }

  return {
    session: buildWorkoutSessionState(seed, sessionRow, persistedExerciseRows, persistedSetRows, historyByExerciseKey),
    sessionRow,
    exerciseRows: persistedExerciseRows,
    setRows: persistedSetRows,
    source: "created"
  };
}

export async function getOrCreateWorkoutSession(client: SupabaseClient<Database>, seed: WorkoutSessionSeed) {
  const existing = await fetchWorkoutSessionRow(client, seed.routeSessionId, seed.userId);
  if (existing) {
    const initialRows = await loadWorkoutSessionRows(client, existing.id);
    const existingExerciseKeys = new Set(
      initialRows.exerciseRows.map((row) => row.prescribed_template_exercise_id ?? `${row.prescribed_exercise_key}:${row.sort_order}`)
    );
    const missingExerciseRows = buildSessionExerciseInsertRows(seed, existing.id).filter(
      (row) => !existingExerciseKeys.has(row.prescribed_template_exercise_id ?? `${row.prescribed_exercise_key}:${row.sort_order}`)
    );

    if (missingExerciseRows.length > 0) {
      const exerciseInsertResult = await client.from("workout_session_exercises").insert(missingExerciseRows as never[]).select("*");
      if (exerciseInsertResult.error) {
        throw exerciseInsertResult.error;
      }
    }

    const afterExerciseInsert = await loadWorkoutSessionRows(client, existing.id);
    const existingSetKeys = new Set(afterExerciseInsert.setRows.map((row) => `${row.workout_session_exercise_id}:${row.set_number}`));
    const missingSetRows = buildSetInsertRows(afterExerciseInsert.exerciseRows, seed.templateExercises).filter(
      (row) => !existingSetKeys.has(`${row.workout_session_exercise_id}:${row.set_number}`)
    );

    if (missingSetRows.length > 0) {
      const setInsertResult = await client.from("workout_sets").insert(missingSetRows as never[]).select("*");
      if (setInsertResult.error) {
        throw setInsertResult.error;
      }
    }

    const refreshed = await loadWorkoutSessionRows(client, existing.id);
    const historyByExerciseKey = new Map<string, WorkoutHistoryPerformance | null>();

    for (const exercise of refreshed.exerciseRows) {
      if (historyByExerciseKey.has(exercise.performed_exercise_key)) {
        continue;
      }

      historyByExerciseKey.set(exercise.performed_exercise_key, await fetchRecentExercisePerformance(client, seed.userId, exercise.performed_exercise_key));
    }

    return {
      session: buildWorkoutSessionState(seed, existing, refreshed.exerciseRows, refreshed.setRows, historyByExerciseKey),
      sessionRow: existing,
      exerciseRows: refreshed.exerciseRows,
      setRows: refreshed.setRows,
      source: "remote" as const
    };
  }

  return createWorkoutSession(client, seed);
}

async function refreshWorkoutSessionExerciseProgress(client: SupabaseClient<Database>, workoutSessionExerciseId: string) {
  const exerciseResult = await client.from("workout_session_exercises").select("*").eq("id", workoutSessionExerciseId).maybeSingle();
  if (exerciseResult.error) {
    throw exerciseResult.error;
  }

  if (!exerciseResult.data) {
    return null;
  }

  const exerciseRow = parseWorkoutSessionExerciseRow(exerciseResult.data);
  const setRowsResult = await client
    .from("workout_sets")
    .select("*")
    .eq("workout_session_exercise_id", workoutSessionExerciseId)
    .order("set_number", { ascending: true });

  if (setRowsResult.error) {
    throw setRowsResult.error;
  }

  const setRows = (setRowsResult.data ?? []).map((row) => parseWorkoutSetRow(row));
  const now = new Date().toISOString();
  const completedSetCount = setRows.filter((row) => row.status === "completed").length;
  const targetSets = exerciseRow.target_sets ?? setRows.length;
  const patch: WorkoutSessionExercisesUpdate = {};

  if (!exerciseRow.started_at && completedSetCount > 0) {
    patch.started_at = now;
  }

  if (isWorkoutSessionExerciseComplete(exerciseRow.target_sets, setRows)) {
    patch.status = "completed";
    patch.completed_at = exerciseRow.completed_at ?? now;
  }

  if (Object.keys(patch).length === 0) {
    return exerciseRow;
  }

  patch.updated_at = now;
  const updateResult = await client.from("workout_session_exercises").update(patch as never).eq("id", workoutSessionExerciseId).select("*").single();
  if (updateResult.error) {
    throw updateResult.error;
  }

  return parseWorkoutSessionExerciseRow(updateResult.data);
}

export async function saveWorkoutSet(
  client: SupabaseClient<Database>,
  params: {
    workoutSessionExerciseId: string;
    workoutSetId?: string | null;
    setNumber: number;
    payload: WorkoutSetPayload;
  }
) {
  const weightResult = parseNumericInput(params.payload.kilograms, { allowBlank: false, allowZero: false });
  const repsResult = parseNumericInput(params.payload.reps, { allowBlank: false, allowZero: false, integer: true });
  const rirResult =
    params.payload.rir == null || params.payload.rir.trim() === ""
      ? { valid: true as const, value: null as number | null }
      : parseNumericInput(params.payload.rir, { allowBlank: false, allowZero: true, integer: true, min: 0, max: 5 });

  if (!weightResult.valid || !repsResult.valid || !rirResult.valid) {
    throw new Error("Invalid workout set values.");
  }

  const insertPayload: WorkoutSetsInsert = {
    id: params.workoutSetId ?? createId(),
    workout_session_exercise_id: params.workoutSessionExerciseId,
    set_number: params.setNumber,
    status: "completed",
    weight_kg: weightResult.value ?? null,
    reps: repsResult.value ?? null,
    rir: rirResult.value,
    completed_at: new Date().toISOString(),
    notes: null
  };

  let savedRow: WorkoutSetsRow;

  if (params.workoutSetId) {
    const updateResult = await client.from("workout_sets").update(insertPayload as never).eq("id", params.workoutSetId).select("*").single();
    if (updateResult.error) {
      throw updateResult.error;
    }

    savedRow = parseWorkoutSetRow(updateResult.data);
  } else {
    const existingResult = await client
      .from("workout_sets")
      .select("*")
      .eq("workout_session_exercise_id", params.workoutSessionExerciseId)
      .eq("set_number", params.setNumber)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      const existingRow = parseWorkoutSetRow(existingResult.data);
      const updateResult = await client.from("workout_sets").update(insertPayload as never).eq("id", existingRow.id).select("*").single();
      if (updateResult.error) {
        throw updateResult.error;
      }

      savedRow = parseWorkoutSetRow(updateResult.data);
    } else {
      const insertResult = await client.from("workout_sets").insert([insertPayload] as never[]).select("*").single();
      if (insertResult.error) {
        throw insertResult.error;
      }

      savedRow = parseWorkoutSetRow(insertResult.data);
    }
  }

  await refreshWorkoutSessionExerciseProgress(client, params.workoutSessionExerciseId);

  return savedRow;
}

export async function swapWorkoutSessionExercise(
  client: SupabaseClient<Database>,
  params: {
    workoutSessionExerciseId: string;
    performedExerciseKey: string;
    swapReason?: string | null;
  }
) {
  const updateResult = await (client as any)
    .from("workout_session_exercises")
    .update({
      performed_exercise_key: params.performedExerciseKey,
      swap_reason: params.swapReason ?? null,
      updated_at: new Date().toISOString()
    } as WorkoutSessionExercisesUpdate)
    .eq("id", params.workoutSessionExerciseId)
    .select("*")
    .single();

  if (updateResult.error) {
    throw updateResult.error;
  }

  return parseWorkoutSessionExerciseRow(updateResult.data);
}

export async function completeWorkoutSession(
  client: SupabaseClient<Database>,
  params: {
    workoutSessionId: string;
    durationSeconds?: number | null;
    notes?: string | null;
  }
) {
  const result = await (client as any).rpc("complete_workout_session", {
    p_workout_session_id: params.workoutSessionId,
    p_duration_seconds: params.durationSeconds ?? null,
    p_notes: params.notes ?? null
  });

  if (result.error) {
    throw result.error;
  }

  return parseWorkoutSessionRow(result.data);
}

export async function getWorkoutHistory(client: SupabaseClient<Database>, userId: string) {
  const result = await client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) => parseWorkoutSessionRow(row));
}

export async function getRecentExercisePerformanceForKeys(client: SupabaseClient<Database>, userId: string, exerciseKeys: string[]) {
  const entries = new Map<string, WorkoutHistoryPerformance | null>();

  await Promise.all(
    exerciseKeys.map(async (exerciseKey) => {
      entries.set(exerciseKey, await fetchRecentExercisePerformance(client, userId, exerciseKey));
    })
  );

  return entries;
}

export function buildWorkoutSessionBootstrapSummary(seed: WorkoutSessionSeed) {
  return buildWorkoutSessionFromDaySummary(seed.day, {
    id: seed.template.id,
    code: seed.template.code,
    name: seed.template.name,
    focus: seed.template.focus,
    estimatedDurationMinutes: seed.template.estimatedDurationMinutes,
    sortOrder: seed.template.sortOrder,
    exercises: seed.templateExercises
  });
}
