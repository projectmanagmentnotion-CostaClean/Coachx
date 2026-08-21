"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  activateProgramFromProposal,
  buildCalendarDays,
  buildWorkoutSessionFromDaySummary,
  createDemoProgramBundle,
  createProgramBundleFromRows,
  getProgramDaySummary,
  loadOrCreateProgramBundle,
  scheduleWorkoutOnDate as createScheduledWorkoutOnDate,
  rescheduleWorkout,
  type ProgramBundleView,
  type ProgramCalendarDay,
  type ProgramDaySummary
} from "@/lib/program-service";
import { type ProgramState } from "@/lib/onboarding-data";
import type { WorkoutSessionState } from "@/lib/workout-data";

interface ProgramStoreValue {
  loading: boolean;
  ready: boolean;
  error: string | null;
  bundle: ProgramBundleView;
  source: ProgramBundleView["source"];
  program: ProgramBundleView["program"];
  activeProgram: ProgramBundleView["activeProgram"];
  activePhase: ProgramBundleView["activePhase"];
  templates: ProgramBundleView["templates"];
  templateExercises: ProgramBundleView["templateExercises"];
  scheduledWorkouts: ProgramBundleView["scheduledWorkouts"];
  selectedDateKey: string | null;
  monthLabel: string | null;
  weekdays: string[];
  reloadProgram: () => Promise<void>;
  activateProgram: (proposal: ProgramState) => Promise<void>;
  scheduleWorkoutOnDate: (payload: { scheduledDate: string; workoutTemplateId: string; plannedDurationMinutes: number; programPhaseId?: string | null; origin?: "ad-hoc" | "program" }) => Promise<void>;
  rescheduleWorkoutDay: (workoutId: string, nextDate: string) => Promise<void>;
  getDaySummary: (dateKey: string) => ProgramDaySummary | null;
  getCalendarDays: (monthDateKey: string, selectedDateKey?: string | null, todayDateKey?: string) => ProgramCalendarDay[];
  buildWorkoutSessionForDate: (dateKey: string) => WorkoutSessionState | null;
  buildWorkoutSessionForScheduledWorkout: (workoutId: string) => WorkoutSessionState | null;
}

const ProgramContext = createContext<ProgramStoreValue | null>(null);
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

function createDemoBundleView() {
  const bundle = createDemoProgramBundle(DEMO_USER_ID);
  return {
    ...createProgramBundleFromRows(bundle.program, bundle.phase, bundle.templates, bundle.templateExercises, bundle.scheduledWorkouts),
    source: "demo" as const
  };
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const { locale } = useLocale();
  const authRef = useRef(auth);
  const [bundle, setBundle] = useState<ProgramBundleView>(() => createDemoBundleView());
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;

    async function hydrate() {
      const currentAuth = authRef.current;
      const client = getSupabaseBrowserClient();

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        if (!active) {
          return;
        }

        setBundle(createDemoBundleView());
        setError(null);
        setLoading(false);
        setReady(true);
        return;
      }

      try {
        const loaded = await loadOrCreateProgramBundle(client, currentAuth.user.id, false);
        if (!active) {
          return;
        }

        setBundle(loaded);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setBundle((current) => ({
          ...current,
          source: "empty",
          program: null,
          activeProgram: null,
          activePhase: null,
          templates: [],
          templateExercises: [],
          scheduledWorkouts: [],
          selectedDateKey: null,
          monthLabel: null
        }));
        setError(loadError instanceof Error ? loadError.message : "Unable to load program data.");
      } finally {
        if (!active) {
          return;
        }

        setLoading(false);
        setReady(true);
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [auth.ready, auth.isConfigured, auth.user?.id]);

  const value = useMemo<ProgramStoreValue>(() => {
    const reloadProgram: ProgramStoreValue["reloadProgram"] = async () => {
      const currentAuth = authRef.current;
      const client = getSupabaseBrowserClient();

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        setBundle(createDemoBundleView());
        return;
      }

      const loaded = await loadOrCreateProgramBundle(client, currentAuth.user.id, false);
      setBundle(loaded);
    };

    const activateProgram: ProgramStoreValue["activateProgram"] = async (proposal) => {
      const currentAuth = authRef.current;
      const client = getSupabaseBrowserClient();

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        setBundle(() => ({
          ...createDemoBundleView(),
          program: {
            ...proposal,
            status: "active",
            activatedAt: proposal.activatedAt ?? new Date().toISOString()
          }
        }));
        return;
      }

      const activated = await activateProgramFromProposal(client, currentAuth.user.id, proposal);
      setBundle(activated);
    };

    const scheduleWorkoutOnDate: ProgramStoreValue["scheduleWorkoutOnDate"] = async (payload) => {
      const currentAuth = authRef.current;
      const client = getSupabaseBrowserClient();

      if (!currentAuth.isConfigured || !currentAuth.user || !client || !bundle.activePhase) {
        return;
      }

      await createScheduledWorkoutOnDate(client, {
        userId: currentAuth.user.id,
        programPhaseId: payload.programPhaseId ?? bundle.activePhase.id,
        workoutTemplateId: payload.workoutTemplateId,
        scheduledDate: payload.scheduledDate,
        plannedDurationMinutes: payload.plannedDurationMinutes,
        origin: payload.origin ?? "ad-hoc"
      });
      await reloadProgram();
    };

    const rescheduleWorkoutDay: ProgramStoreValue["rescheduleWorkoutDay"] = async (workoutId, nextDate) => {
      const currentAuth = authRef.current;
      const client = getSupabaseBrowserClient();

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        setBundle((current) => ({
          ...current,
          scheduledWorkouts: current.scheduledWorkouts.map((workout) =>
            workout.id === workoutId
              ? {
                  ...workout,
                  scheduled_date: nextDate,
                  status: "rescheduled",
                  updated_at: new Date().toISOString()
                }
              : workout
          )
        }));
        return;
      }

      await rescheduleWorkout(client, workoutId, nextDate);
      await reloadProgram();
    };

    const getDaySummary: ProgramStoreValue["getDaySummary"] = (dateKey) => getProgramDaySummary(bundle, dateKey);

    const getCalendarDays: ProgramStoreValue["getCalendarDays"] = (monthDateKey, selectedDateKey, todayDateKey) =>
      buildCalendarDays(bundle, monthDateKey, selectedDateKey ?? bundle.selectedDateKey ?? monthDateKey, todayDateKey);

    const buildWorkoutSessionForDate: ProgramStoreValue["buildWorkoutSessionForDate"] = (dateKey) => {
      const day = getProgramDaySummary(bundle, dateKey);
      if (!day || day.isRestDay) {
        return null;
      }

      const templateRow = bundle.templates.find((template) => template.code === day.templateCode);
      if (!templateRow) {
        return null;
      }

      const templateExercises = bundle.templateExercises
        .filter((exercise) => exercise.workout_template_id === templateRow.id)
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((exercise) => ({
          exerciseKey: exercise.exercise_key,
          sortOrder: exercise.sort_order,
          sets: exercise.sets,
          repMin: exercise.rep_min,
          repMax: exercise.rep_max,
          rirMin: exercise.rir_min,
          rirMax: exercise.rir_max,
          restSeconds: exercise.rest_seconds,
          notes: exercise.notes ?? ""
        }));

      return buildWorkoutSessionFromDaySummary(day, {
        id: templateRow.id,
        code: templateRow.code,
        name: templateRow.name,
        focus: templateRow.focus,
        estimatedDurationMinutes: templateRow.estimated_duration_minutes,
        sortOrder: templateRow.sort_order,
        exercises: templateExercises
      });
    };

    const buildWorkoutSessionForScheduledWorkout: ProgramStoreValue["buildWorkoutSessionForScheduledWorkout"] = (workoutId) => {
      const scheduledWorkout = bundle.scheduledWorkouts.find((workout) => workout.id === workoutId);
      if (!scheduledWorkout) {
        return null;
      }

      return buildWorkoutSessionForDate(scheduledWorkout.scheduled_date);
    };

    return {
      loading,
      ready,
      error,
      bundle,
      source: bundle.source,
      program: bundle.program,
      activeProgram: bundle.activeProgram,
      activePhase: bundle.activePhase,
      templates: bundle.templates,
      templateExercises: bundle.templateExercises,
      scheduledWorkouts: bundle.scheduledWorkouts,
      selectedDateKey: bundle.selectedDateKey,
      monthLabel: bundle.monthLabel,
      weekdays: bundle.weekdays,
      reloadProgram,
      activateProgram,
      scheduleWorkoutOnDate,
      rescheduleWorkoutDay,
      getDaySummary,
      getCalendarDays,
      buildWorkoutSessionForDate,
      buildWorkoutSessionForScheduledWorkout
    };
  }, [bundle, error, loading, ready, locale]);

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}

export function useProgramStore() {
  const context = useContext(ProgramContext);

  if (!context) {
    throw new Error("useProgramStore must be used within ProgramProvider");
  }

  return context;
}
