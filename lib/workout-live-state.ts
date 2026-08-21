import type { SessionExercise, WorkoutSessionState, WorkoutWorkflowState } from "@/lib/workout-data";

export type WorkoutLivePhase = "preparing" | "active" | "resting" | "paused" | "exercise_complete" | "completed";

export interface WorkoutLiveSnapshot {
  phase: WorkoutLivePhase;
  activeExercise: SessionExercise;
  activeExerciseIndex: number;
  activeSetNumber: number;
  completedExercises: number;
  totalExercises: number;
  elapsedSeconds: number;
  restSecondsRemaining: number;
  isFinalExercise: boolean;
  isFinalSet: boolean;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPauseAccumulatedMs(session: WorkoutSessionState, nowMs: number) {
  const workflow = session.workflow;
  if (!workflow) {
    return 0;
  }

  const pausedAt = toTimestamp(workflow.pausedAt);
  return Math.max(0, (workflow.pauseAccumulatedMs ?? 0) + (pausedAt == null ? 0 : Math.max(0, nowMs - pausedAt)));
}

export function buildWorkoutWorkflowState(session: WorkoutSessionState): WorkoutWorkflowState {
  const activeExerciseIndex = Math.max(
    0,
    session.exercises.findIndex((exercise) => exercise.completedSets.length < exercise.totalSets)
  );
  const activeExercise = session.exercises[activeExerciseIndex] ?? session.exercises[0];
  const activeSetNumber = activeExercise?.sets.find((set) => !set.completed)?.setNumber ?? activeExercise?.sets.at(-1)?.setNumber ?? 1;

  return {
    activeExerciseId: activeExercise?.id ?? null,
    activeSetNumber,
    restEndsAt: session.restTimer?.endsAt ?? null,
    pausedAt: null,
    pauseAccumulatedMs: 0
  };
}

export function getWorkoutElapsedSeconds(session: WorkoutSessionState, nowMs = Date.now()) {
  const startedAt = toTimestamp(session.startedAt);
  if (startedAt == null) {
    return 0;
  }

  const endAt = toTimestamp(session.completedAt) ?? nowMs;
  const adjusted = Math.max(0, endAt - startedAt - getPauseAccumulatedMs(session, nowMs));
  return Math.max(0, Math.floor(adjusted / 1000));
}

export function getRestSecondsRemaining(session: WorkoutSessionState, nowMs = Date.now()) {
  if (!session.restTimer?.active) {
    return 0;
  }

  if (!session.restTimer.endsAt) {
    return Math.max(0, session.restTimer.secondsRemaining);
  }

  const pausedMs = getPauseAccumulatedMs(session, nowMs);
  const remainingMs = Math.max(0, toTimestamp(session.restTimer.endsAt)! - (nowMs - pausedMs));
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function getWorkoutLiveSnapshot(session: WorkoutSessionState, nowMs = Date.now()): WorkoutLiveSnapshot {
  const completedExercises = session.exercises.filter((exercise) => exercise.completedSets.length >= exercise.totalSets).length;
  const activeExerciseIndex = Math.max(
    0,
    session.workflow?.activeExerciseId
      ? Math.max(
          0,
          session.exercises.findIndex((exercise) => exercise.id === session.workflow?.activeExerciseId)
        )
      : session.exercises.findIndex((exercise) => exercise.completedSets.length < exercise.totalSets)
  );
  const activeExercise = session.exercises[activeExerciseIndex] ?? session.exercises[0];
  const activeSetNumber =
    activeExercise?.sets.find((set) => !set.completed)?.setNumber ?? session.workflow?.activeSetNumber ?? activeExercise?.sets.at(-1)?.setNumber ?? 1;
  const restSecondsRemaining = getRestSecondsRemaining(session, nowMs);
  const phase: WorkoutLivePhase =
    session.status === "completed"
      ? "completed"
      : session.workflow?.pausedAt
        ? "paused"
        : restSecondsRemaining > 0
          ? "resting"
          : activeExercise && activeExercise.completedSets.length >= activeExercise.totalSets
            ? "exercise_complete"
            : "active";

  return {
    phase,
    activeExercise: activeExercise ?? session.exercises[0],
    activeExerciseIndex,
    activeSetNumber,
    completedExercises,
    totalExercises: session.totalExercises,
    elapsedSeconds: getWorkoutElapsedSeconds(session, nowMs),
    restSecondsRemaining,
    isFinalExercise: activeExerciseIndex >= session.exercises.length - 1,
    isFinalSet: Boolean(activeExercise?.sets.at(-1)?.completed) && activeExercise?.completedSets.length >= activeExercise.totalSets
  };
}
