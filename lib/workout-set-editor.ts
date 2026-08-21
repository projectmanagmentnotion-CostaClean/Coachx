import { getNumericValidationMessage, parseNumericInput, type SupportedLocale } from "@/lib/numeric-input";
import type { SessionExercise, WorkoutSessionState } from "@/lib/workout-data";

export type WorkoutSetDraftErrors = {
  kilograms?: string;
  reps?: string;
  rir?: string;
};

export function validateWorkoutSetDraft(locale: SupportedLocale, payload: { kilograms: string; reps: string; rir?: string }) {
  const kilograms = parseNumericInput(payload.kilograms, { allowBlank: false, allowZero: false });
  const reps = parseNumericInput(payload.reps, { allowBlank: false, allowZero: false, integer: true });
  const rir =
    payload.rir == null || payload.rir.trim() === ""
      ? { valid: true as const, value: null as number | null }
      : parseNumericInput(payload.rir, { allowBlank: false, allowZero: true, integer: true, min: 0, max: 5 });

  const errors: WorkoutSetDraftErrors = {};

  if (!kilograms.valid) {
    errors.kilograms = getNumericValidationMessage(locale, kilograms.reason ?? "invalid", { min: 0.1, max: 999.9 });
  }

  if (!reps.valid) {
    errors.reps = getNumericValidationMessage(locale, reps.reason ?? "invalid", { min: 1, max: 999 });
  }

  if (!rir.valid) {
    errors.rir = getNumericValidationMessage(locale, rir.reason ?? "invalid", { min: 0, max: 5 });
  }

  if (errors.kilograms || errors.reps || errors.rir) {
    return {
      valid: false as const,
      errors
    };
  }

  return {
    valid: true as const,
    errors: {} as WorkoutSetDraftErrors,
    parsed: {
      kilograms: kilograms.value ?? 0,
      reps: reps.value ?? 0,
      rir: rir.value ?? null
    }
  };
}

export function updateWorkoutSetDraft(
  session: WorkoutSessionState,
  exerciseId: string,
  setNumber: number,
  patch: Partial<SessionExercise["sets"][number]>
) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id !== exerciseId
        ? exercise
        : {
            ...exercise,
            sets: exercise.sets.map((set) => (set.setNumber === setNumber ? { ...set, ...patch } : set))
          }
    )
  };
}

export function applySavedWorkoutSetToSession(
  session: WorkoutSessionState,
  exerciseId: string,
  setNumber: number,
  saved: {
    id: string;
    weight_kg: number | null;
    reps: number | null;
    rir: number | null;
    completed_at: string | null;
    status: "planned" | "completed" | "skipped";
    notes: string | null;
  }
) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) {
        return exercise;
      }

      const nextSets = exercise.sets.map((set) =>
        set.setNumber === setNumber
          ? {
              ...set,
              workoutSetId: saved.id,
              kilograms: saved.weight_kg == null ? "" : String(saved.weight_kg),
              reps: saved.reps == null ? "" : String(saved.reps),
              rir: saved.rir == null ? undefined : String(saved.rir),
              completed: saved.status === "completed",
              status: saved.status,
              completedAt: saved.completed_at,
              notes: saved.notes
            }
          : set
      );

      const completedSetEntry = {
        setNumber,
        kilograms: saved.weight_kg ?? 0,
        reps: saved.reps ?? 0,
        rir: saved.rir ?? undefined,
        performedAt: saved.completed_at ?? new Date().toISOString()
      };

      const completedSets = exercise.completedSets.some((set) => set.setNumber === setNumber)
        ? exercise.completedSets.map((set) => (set.setNumber === setNumber ? completedSetEntry : set))
        : [...exercise.completedSets, completedSetEntry];

      return {
        ...exercise,
        sets: nextSets,
        completedSets
      };
    })
  };
}
