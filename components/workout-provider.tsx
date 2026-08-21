"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseNumericInput } from "@/lib/numeric-input";
import { applySavedWorkoutSetToSession, updateWorkoutSetDraft } from "@/lib/workout-set-editor";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";
import {
  completeWorkoutSession,
  saveWorkoutSet,
  swapWorkoutSessionExercise,
} from "@/lib/workout-session-service";
import {
  coachxExerciseAlternativeMap,
  createDemoWorkoutSession,
  getExerciseDefinition,
  type CompletedSet,
  type RestTimerState,
  type SessionExercise,
  type WorkoutSessionState
} from "@/lib/workout-data";
import { buildWorkoutWorkflowState, getRestSecondsRemaining } from "@/lib/workout-live-state";

interface WorkoutStoreValue {
  session: WorkoutSessionState;
  hydrateSession: (nextSession: WorkoutSessionState) => void;
  updateSetDraft: (exerciseId: string, setNumber: number, patch: Partial<SessionExercise["sets"][number]>) => void;
  completeSet: (exerciseId: string, setNumber: number, payload: { kilograms: string; reps: string; rir?: string }) => Promise<void>;
  saveLoggedSet: (exerciseId: string, setNumber: number, payload: { kilograms: string; reps: string; rir?: string }) => Promise<void>;
  swapExercise: (exerciseId: string, alternativeId: string) => Promise<void>;
  startRestTimer: (exerciseId: string, setNumber: number, seconds: number) => void;
  addThirtySeconds: () => void;
  skipRestTimer: () => void;
  selectAdjustmentTime: (minutes: "20 min" | "30 min" | "45 min") => void;
  applyAdjustment: () => void;
  updateSafety: (patch: Partial<WorkoutSessionState["safety"]>) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
  resetDemoWorkout: () => void;
}

const WorkoutStoreContext = createContext<WorkoutStoreValue | null>(null);

function getStorageKey(userId: string | null) {
  return `coachx-workout-session:${userId ?? "demo"}`;
}

function reviveSession(raw: string | null) {
  if (!raw) {
    return createDemoWorkoutSession();
  }

  try {
    return JSON.parse(raw) as WorkoutSessionState;
  } catch {
    return createDemoWorkoutSession();
  }
}

function computeRestTimer(exerciseId: string, setNumber: number, seconds: number): RestTimerState {
  return {
    exerciseId,
    setNumber,
    secondsRemaining: seconds,
    active: true,
    endsAt: new Date(Date.now() + seconds * 1000).toISOString()
  };
}

function normalizeWorkoutSessionState(nextSession: WorkoutSessionState): WorkoutSessionState {
  const restTimer = nextSession.restTimer
    ? {
        ...nextSession.restTimer,
        endsAt:
          nextSession.restTimer.active && !nextSession.restTimer.endsAt
            ? new Date(Date.now() + nextSession.restTimer.secondsRemaining * 1000).toISOString()
            : nextSession.restTimer.endsAt ?? null
      }
    : null;
  const baseWorkflow = buildWorkoutWorkflowState({
    ...nextSession,
    restTimer
  });

  return {
    ...nextSession,
    restTimer,
    workflow: {
      ...baseWorkflow,
      pausedAt: nextSession.workflow?.pausedAt ?? null,
      pauseAccumulatedMs: nextSession.workflow?.pauseAccumulatedMs ?? 0,
      restEndsAt: restTimer?.endsAt ?? nextSession.workflow?.restEndsAt ?? null
    }
  };
}

function getSessionExercise(session: WorkoutSessionState, exerciseId: string) {
  return session.exercises.find((exercise) => exercise.id === exerciseId) ?? session.exercises[0];
}

function markCompletedSetOnSession(session: WorkoutSessionState, exerciseId: string, setNumber: number, payload: { kilograms: string; reps: string; rir?: string }): WorkoutSessionState {
  const completedAt = new Date().toISOString();
  const weightKg = parseNumericInput(payload.kilograms, { allowBlank: false, allowZero: false }).value ?? 0;
  const reps = parseNumericInput(payload.reps, { allowBlank: false, allowZero: false, integer: true }).value ?? 0;
  const rir =
    payload.rir == null || payload.rir.trim() === ""
      ? undefined
      : parseNumericInput(payload.rir, { allowBlank: false, allowZero: true, integer: true, min: 0, max: 5 }).value;

  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) {
        return exercise;
      }

      const alreadyCompleted = exercise.completedSets.some((set) => set.setNumber === setNumber);
      const nextCompletedSets = alreadyCompleted
        ? exercise.completedSets
        : [
            ...exercise.completedSets,
            {
              setNumber,
              kilograms: weightKg,
              reps,
              rir,
              performedAt: completedAt
            } satisfies CompletedSet
          ];

      const completedCount = nextCompletedSets.length;
      const exerciseCompleted = completedCount >= exercise.totalSets;

      return {
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.setNumber === setNumber
            ? {
                ...set,
                kilograms: payload.kilograms,
                reps: payload.reps,
                rir: payload.rir,
                completed: true,
                status: "completed" as const,
                completedAt
              }
            : set
        ),
        completedSets: nextCompletedSets,
        status: exerciseCompleted ? "completed" : exercise.status,
        startedAt: exercise.startedAt ?? completedAt,
        completedAt: exerciseCompleted ? completedAt : exercise.completedAt
      };
    }),
    restTimer: computeRestTimer(exerciseId, setNumber, getExerciseDefinition(getSessionExercise(session, exerciseId).performedExerciseId).restSeconds)
  } satisfies WorkoutSessionState;
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const { locale } = useLocale();
  const sessionRef = useRef<WorkoutSessionState>(createDemoWorkoutSession());
  const [session, setSession] = useState<WorkoutSessionState>(createDemoWorkoutSession);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    const key = getStorageKey(auth.isConfigured && auth.user ? auth.user.id : null);
    const cached = typeof window === "undefined" ? null : window.localStorage.getItem(key);
    const revived = normalizeWorkoutSessionState(reviveSession(cached));
    setSession(revived);
    sessionRef.current = revived;
  }, [auth.isConfigured, auth.ready, auth.user?.id, locale]);

  useEffect(() => {
    if (!auth.ready || typeof window === "undefined") {
      return;
    }

    const key = getStorageKey(auth.isConfigured && auth.user ? auth.user.id : null);
    window.localStorage.setItem(key, JSON.stringify(session));
  }, [auth.isConfigured, auth.ready, auth.user?.id, session, locale]);

  useEffect(() => {
    if (!session.restTimer?.active || !session.restTimer.endsAt) {
      return;
    }

    const tick = () => {
      setSession((current) => {
        if (!current.restTimer?.active || !current.restTimer.endsAt) {
          return current;
        }

        const nextRemaining = getRestSecondsRemaining(current);
        return nextRemaining > 0
          ? {
              ...current,
              restTimer: {
                ...current.restTimer,
                secondsRemaining: nextRemaining,
                active: true
              }
            }
          : {
              ...current,
              restTimer: null
            };
      });
    };

    tick();

    const interval = window.setInterval(() => {
      tick();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session.restTimer?.active, session.restTimer?.endsAt, session.workflow?.pauseAccumulatedMs, session.workflow?.pausedAt, locale]);

  const value = useMemo<WorkoutStoreValue>(() => {
    const hydrateSession: WorkoutStoreValue["hydrateSession"] = (nextSession) => {
      const normalized = normalizeWorkoutSessionState(nextSession);
      setSession(normalized);
      sessionRef.current = normalized;
    };

    const updateSetDraft: WorkoutStoreValue["updateSetDraft"] = (exerciseId, setNumber, patch) => {
      setSession((current) => updateWorkoutSetDraft(current, exerciseId, setNumber, patch));
    };

    const completeSet: WorkoutStoreValue["completeSet"] = async (exerciseId, setNumber, payload) => {
      const currentSession = sessionRef.current;
      const currentExercise = getSessionExercise(currentSession, exerciseId);
      const currentSet = currentExercise.sets.find((set) => set.setNumber === setNumber) ?? currentExercise.sets[currentExercise.sets.length - 1];
      const savedWorkoutSessionExerciseId = currentExercise.sessionExerciseId ?? currentExercise.id;

      setSession((current) => ({
        ...normalizeWorkoutSessionState(markCompletedSetOnSession(current, exerciseId, setNumber, payload)),
        saveState: "pending",
        saveError: null
      }));

      const client = getSupabaseBrowserClient();
      if (!auth.isConfigured || !auth.user || !client || !currentSession.workoutSessionId) {
        return;
      }

      try {
        const saved = await saveWorkoutSet(client, {
          workoutSessionExerciseId: savedWorkoutSessionExerciseId,
          workoutSetId: currentSet?.workoutSetId ?? null,
          setNumber,
          payload
        });

        publishFeedbackSuccess("workout.set", "Set completed", "Your reps and load are saved.");
        setSession((current) =>
          normalizeWorkoutSessionState({
            ...applySavedWorkoutSetToSession(current, exerciseId, setNumber, saved),
            saveState: "saved",
            saveError: null
          })
        );
      } catch (error) {
        publishFeedbackError("workout.set", "Set could not be saved", "Your previous set data is still here.");
        setSession((current) => ({
          ...current,
          saveState: "error",
          saveError: error instanceof Error ? error.message : "Unable to save workout set."
        }));
        throw error;
      }
    };

    const saveLoggedSet: WorkoutStoreValue["saveLoggedSet"] = async (exerciseId, setNumber, payload) => {
      const currentSession = sessionRef.current;
      const currentExercise = getSessionExercise(currentSession, exerciseId);
      const currentSet = currentExercise.sets.find((set) => set.setNumber === setNumber) ?? currentExercise.sets[currentExercise.sets.length - 1];
      const savedWorkoutSessionExerciseId = currentExercise.sessionExerciseId ?? currentExercise.id;

      setSession((current) => ({
        ...current,
        saveState: "pending",
        saveError: null
      }));

      const client = getSupabaseBrowserClient();
      if (!auth.isConfigured || !auth.user || !client || !currentSession.workoutSessionId) {
        return;
      }

      try {
        const saved = await saveWorkoutSet(client, {
          workoutSessionExerciseId: savedWorkoutSessionExerciseId,
          workoutSetId: currentSet?.workoutSetId ?? null,
          setNumber,
          payload
        });

        publishFeedbackSuccess("workout.set", "Set updated", "Your saved set stays in sync.");
        setSession((current) =>
          normalizeWorkoutSessionState({
            ...applySavedWorkoutSetToSession(current, exerciseId, setNumber, saved),
            saveState: "saved",
            saveError: null
          })
        );
      } catch (error) {
        publishFeedbackError("workout.set", "Set could not be saved", "Your previous set data is still here.");
        setSession((current) => ({
          ...current,
          saveState: "error",
          saveError: error instanceof Error ? error.message : "Unable to save workout set."
        }));
        throw error;
      }
    };

    const swapExercise: WorkoutStoreValue["swapExercise"] = async (exerciseId, alternativeId) => {
      setSession((current) => ({
        ...current,
        saveState: "pending",
        saveError: null,
        exercises: current.exercises.map((exercise) =>
          exercise.id !== exerciseId
            ? exercise
            : {
                ...exercise,
                performedExerciseId: alternativeId
              }
        )
      }));

      const client = getSupabaseBrowserClient();
      if (!auth.isConfigured || !auth.user || !client || !sessionRef.current.workoutSessionId) {
        return;
      }

      try {
        await swapWorkoutSessionExercise(client, {
          workoutSessionExerciseId: getSessionExercise(sessionRef.current, exerciseId).sessionExerciseId ?? exerciseId,
          performedExerciseKey: alternativeId,
          swapReason: "manual swap"
        });

        publishFeedbackSuccess("workout.swap", "Exercise swapped", "The current set history is preserved.");
        setSession((current) => ({
          ...current,
          saveState: "saved",
          saveError: null
        }));
      } catch (error) {
        publishFeedbackError("workout.swap", "Exercise swap could not be saved", "Your workout history is unchanged.");
        setSession((current) => ({
          ...current,
          saveState: "error",
          saveError: error instanceof Error ? error.message : "Unable to swap workout exercise."
        }));
        throw error;
      }
    };

    const startRestTimer: WorkoutStoreValue["startRestTimer"] = (exerciseId, setNumber, seconds) => {
      setSession((current) =>
        normalizeWorkoutSessionState({
          ...current,
          restTimer: computeRestTimer(exerciseId, setNumber, seconds)
        })
      );
    };

    const addThirtySeconds: WorkoutStoreValue["addThirtySeconds"] = () => {
      setSession((current) =>
        current.restTimer
          ? normalizeWorkoutSessionState({
              ...current,
              restTimer: {
                ...current.restTimer,
                secondsRemaining: getRestSecondsRemaining(current) + 15,
                active: true,
                endsAt: new Date(Date.now() + (getRestSecondsRemaining(current) + 15) * 1000).toISOString()
              }
            })
          : current
      );
    };

    const skipRestTimer: WorkoutStoreValue["skipRestTimer"] = () => {
      setSession((current) =>
        current.restTimer
          ? normalizeWorkoutSessionState({
              ...current,
              restTimer: null
            })
          : current
      );
    };

    const selectAdjustmentTime: WorkoutStoreValue["selectAdjustmentTime"] = (minutes) => {
      setSession((current) => ({
        ...current,
        adjustment: {
          ...current.adjustment,
          selectedTime: minutes
        }
      }));
    };

    const applyAdjustment: WorkoutStoreValue["applyAdjustment"] = () => {
      setSession((current) => ({
        ...current,
        adjustment: {
          ...current.adjustment,
          applied: true
        }
      }));
    };

    const updateSafety: WorkoutStoreValue["updateSafety"] = (patch) => {
      setSession((current) => ({
        ...current,
        safety: {
          ...current.safety,
          ...patch
        }
      }));
    };

    const pauseWorkout: WorkoutStoreValue["pauseWorkout"] = () => {
      setSession((current) => {
        if (current.workflow?.pausedAt) {
          return current;
        }

        return normalizeWorkoutSessionState({
          ...current,
          workflow: {
            ...(current.workflow ?? buildWorkoutWorkflowState(current)),
            pausedAt: new Date().toISOString(),
            pauseAccumulatedMs: current.workflow?.pauseAccumulatedMs ?? 0
          }
        });
      });
    };

    const resumeWorkout: WorkoutStoreValue["resumeWorkout"] = () => {
      setSession((current) => {
        const pausedAt = current.workflow?.pausedAt;
        if (!pausedAt) {
          return current;
        }

        const pausedForMs = Math.max(0, Date.now() - Date.parse(pausedAt));
        return normalizeWorkoutSessionState({
          ...current,
          workflow: {
            ...(current.workflow ?? buildWorkoutWorkflowState(current)),
            pausedAt: null,
            pauseAccumulatedMs: (current.workflow?.pauseAccumulatedMs ?? 0) + pausedForMs
          }
        });
      });
    };

    const finishWorkout: WorkoutStoreValue["finishWorkout"] = async () => {
      setSession((current) => ({
        ...current,
        restTimer: null,
        saveState: "pending",
        saveError: null
      }));

      const client = getSupabaseBrowserClient();
      if (!auth.isConfigured || !auth.user || !client || !sessionRef.current.workoutSessionId) {
        return;
      }

      try {
        const finished = await completeWorkoutSession(client, {
          workoutSessionId: sessionRef.current.workoutSessionId,
          durationSeconds: sessionRef.current.durationSeconds ?? null,
          notes: sessionRef.current.notes ?? null
        });

        publishFeedbackSuccess("workout.finish", "Workout complete", "Your session is saved and ready to review.");
        setSession((current) => ({
          ...current,
          status: finished.status,
          completedAt: finished.completed_at,
          durationSeconds: finished.duration_seconds,
          notes: finished.notes,
          persistence: {
            workoutSessionId: finished.id,
            scheduledWorkoutId: finished.scheduled_workout_id,
            workoutTemplateId: finished.workout_template_id,
            status: finished.status,
            startedAt: finished.started_at,
            completedAt: finished.completed_at,
            durationSeconds: finished.duration_seconds,
            notes: finished.notes,
            sessionMetadata: (finished.session_metadata as Record<string, unknown> | null) ?? null
          },
          saveState: "saved",
          saveError: null,
          source: "remote"
        }));
      } catch (error) {
        publishFeedbackError("workout.finish", "Workout could not be completed", "Your current session is still open.");
        setSession((current) => ({
          ...current,
          saveState: "error",
          saveError: error instanceof Error ? error.message : "Unable to complete workout."
        }));
        throw error;
      }
    };

    const resetDemoWorkout: WorkoutStoreValue["resetDemoWorkout"] = () => {
      const demo = createDemoWorkoutSession();
      setSession(demo);
      sessionRef.current = demo;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(getStorageKey(null), JSON.stringify(demo));
      }
    };

    return {
      session,
      hydrateSession,
      updateSetDraft,
      completeSet,
      saveLoggedSet,
      swapExercise,
      startRestTimer,
      addThirtySeconds,
      skipRestTimer,
      selectAdjustmentTime,
      applyAdjustment,
      updateSafety,
      pauseWorkout,
      resumeWorkout,
      finishWorkout,
      resetDemoWorkout
    };
  }, [auth.isConfigured, auth.user, session, locale]);

  return <WorkoutStoreContext.Provider value={value}>{children}</WorkoutStoreContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutStoreContext);

  if (!context) {
    throw new Error("useWorkoutStore must be used within WorkoutProvider");
  }

  return context;
}

export function getWorkoutExercise(session: WorkoutSessionState, exerciseId: string) {
  return getSessionExercise(session, exerciseId);
}

export function getWorkoutAlternativeCards(exerciseId: string) {
  return coachxExerciseAlternativeMap[exerciseId] ?? [];
}
