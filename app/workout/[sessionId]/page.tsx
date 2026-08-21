"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { PrimaryButton } from "@/components/ui";
import { AthlexMedia } from "@/components/athlex-media";
import { useAuthStore } from "@/components/auth-provider";
import { useProgramStore } from "@/components/program-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { useTranslator } from "@/components/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExerciseDefinition, countCompletedExercises } from "@/lib/workout-data";
import { resolveExerciseHeroMedia } from "@/lib/media";
import { getOrCreateWorkoutSession, type WorkoutSessionSeed } from "@/lib/workout-session-service";
import type { ProgramTemplateExercise, ProgramTemplateView } from "@/lib/program-service";

function resolveSessionId(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

function buildTemplateView(
  templateRow: { id: string; code: string; name: string; focus: string; estimated_duration_minutes: number; sort_order: number },
  templateExercises: Array<ProgramTemplateExercise & { id: string }>
): ProgramTemplateView {
  return {
    id: templateRow.id,
    code: templateRow.code,
    name: templateRow.name,
    focus: templateRow.focus,
    estimatedDurationMinutes: templateRow.estimated_duration_minutes,
    sortOrder: templateRow.sort_order,
    exercises: templateExercises.map(({ id: _exerciseId, ...exercise }) => exercise)
  };
}

export default function WorkoutOverviewPage() {
  const params = useParams<{ sessionId?: string | string[] }>();
  const router = useRouter();
  const auth = useAuthStore();
  const { locale } = useTranslator();
  const { session, hydrateSession } = useWorkoutStore();
  const { scheduledWorkouts, templates, templateExercises, getDaySummary, ready: programReady } = useProgramStore();
  const workoutId = resolveSessionId(params.sessionId);
  const loadedRouteIdRef = useRef<string | null>(null);

  const scheduledWorkout =
    scheduledWorkouts.find((workout) => workout.id === workoutId) ??
    (session.workoutSessionId === workoutId && session.scheduledWorkoutId
      ? scheduledWorkouts.find((workout) => workout.id === session.scheduledWorkoutId) ?? null
      : null);

  const day = scheduledWorkout ? getDaySummary(scheduledWorkout.scheduled_date) : null;

  const templateExercisesForSeed = useMemo<Array<ProgramTemplateExercise & { id: string }>>(() => {
    if (!day) {
      return [];
    }

    const templateRow = templates.find((template) => template.code === day.templateCode);
    if (!templateRow) {
      return [];
    }

    return templateExercises
      .filter((exercise) => exercise.workout_template_id === templateRow.id)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((exercise) => ({
        id: exercise.id,
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
  }, [day, templateExercises, templates]);

  const templateView = useMemo(() => {
    if (!day) {
      return null;
    }

    const templateRow = templates.find((template) => template.code === day.templateCode);
    if (!templateRow || templateExercisesForSeed.length === 0) {
      return null;
    }

    return buildTemplateView(templateRow, templateExercisesForSeed);
  }, [day, templateExercisesForSeed, templates]);

  useEffect(() => {
    if (!auth.ready || !programReady || !auth.isConfigured || !auth.user || !workoutId || !scheduledWorkout || !day || !templateView) {
      return;
    }

    const resolvedScheduledWorkout = scheduledWorkout;
    const resolvedDay = day;
    const resolvedTemplateView = templateView;
    const resolvedTemplateExercises = templateExercisesForSeed;

    if (loadedRouteIdRef.current === workoutId && session.workoutSessionId === workoutId) {
      return;
    }

    let active = true;

    async function hydrate() {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return;
      }

      const seed: WorkoutSessionSeed = {
        routeSessionId: workoutId,
        userId: auth.user!.id,
        scheduledWorkout: resolvedScheduledWorkout,
        day: resolvedDay,
        template: resolvedTemplateView,
        templateExercises: resolvedTemplateExercises
      };

      const result = await getOrCreateWorkoutSession(client, seed);
      if (!active) {
        return;
      }

      hydrateSession(result.session);
      loadedRouteIdRef.current = workoutId;

      if (result.session.id !== workoutId) {
        router.replace(`/workout/${result.session.id}`);
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.ready, auth.user?.id, day, hydrateSession, programReady, router, scheduledWorkout, session.workoutSessionId, templateView, workoutId]);

  const copy = {
    en: {
      goBack: "Go back",
      moreOptions: "More options",
      workoutSession: "Workout Session",
      exercisesCompleted: "exercises completed",
      prescription: "Prescription:",
      lastSession: "Last Session",
      readyToProgress: "Ready to Progress",
      swap: "Swap",
      startSession: "Start Session",
      resumeSession: "Resume Workout"
    },
    es: {
      goBack: "Volver",
      moreOptions: "Más opciones",
      workoutSession: "Sesión de entrenamiento",
      exercisesCompleted: "ejercicios completados",
      prescription: "Prescripción:",
      lastSession: "Sesión anterior",
      readyToProgress: "Listo para progresar",
      swap: "Cambiar",
      startSession: "Empezar sesión",
      resumeSession: "Reanudar entrenamiento"
    },
    ca: {
      goBack: "Enrere",
      moreOptions: "Més opcions",
      workoutSession: "Sessió d'entrenament",
      exercisesCompleted: "exercicis completats",
      prescription: "Prescripció:",
      lastSession: "Sessió anterior",
      readyToProgress: "Preparat per progressar",
      swap: "Canvia",
      startSession: "Inicia la sessió",
      resumeSession: "Reprendre entrenament"
    },
    de: {
      goBack: "Zurück",
      moreOptions: "Weitere Optionen",
      workoutSession: "Trainingseinheit",
      exercisesCompleted: "Übungen abgeschlossen",
      prescription: "Vorgabe:",
      lastSession: "Letzte Einheit",
      readyToProgress: "Bereit für Fortschritt",
      swap: "Tauschen",
      startSession: "Sitzung starten",
      resumeSession: "Training fortsetzen"
    }
  }[locale as "en" | "es" | "ca" | "de"] ?? {
    goBack: "Go back",
    moreOptions: "More options",
    workoutSession: "Workout Session",
    exercisesCompleted: "exercises completed",
    prescription: "Prescription:",
    lastSession: "Last Session",
    readyToProgress: "Ready to Progress",
    swap: "Swap",
    startSession: "Start Session",
    resumeSession: "Resume Workout"
  };

  const backHref = day ? `/day/${day.dateKey}` : "/calendar";

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="topbar workout-overview-topbar">
          <Link aria-label={copy.goBack} className="tap-target focus-ring" href={backHref}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <div className="headline-md" style={{ fontSize: 18, lineHeight: "24px", fontWeight: 700 }}>
            {copy.workoutSession}
          </div>
          <Link aria-label={copy.moreOptions} className="tap-target focus-ring" href={`/workout/${session.id}/adjust`}>
            <span className="icon" aria-hidden="true">
              more_vert
            </span>
          </Link>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="eyebrow" style={{ color: "#9fb15e" }}>
            {session.workoutType}
          </div>
          <h1 className="headline-xl" style={{ textTransform: "uppercase" }}>
            {session.phaseLabel}
          </h1>
          <p className="caption" style={{ marginTop: 6 }}>
            {session.subtitle}
          </p>
        </section>

        <section className="section">
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="eyebrow" style={{ margin: 0 }}>
              {countCompletedExercises(session)} / {session.totalExercises} {copy.exercisesCompleted}
            </div>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${(countCompletedExercises(session) / session.totalExercises) * 100}%` }} />
          </div>
          <div className="caption" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="icon" style={{ fontSize: 16 }}>
              history
            </span>
            <span>{session.lastSessionLabel}</span>
          </div>
        </section>

        <section className="stack-lg">
          {session.exercises.map((exercise, index) => {
            const definition = getExerciseDefinition(exercise.performedExerciseId);
            const media = resolveExerciseHeroMedia({
              exerciseKey: definition.id,
              exerciseName: definition.name,
              primaryMuscles: definition.primaryMuscles,
              secondaryMuscles: definition.secondaryMuscles,
              equipment: definition.equipment
            });
            const equipment = definition.label;

            return (
              <div key={exercise.id} className="stack">
                <Link
                  href={`/workout/${session.id}/exercise/${exercise.id}`}
                  className="workout-overview-card focus-ring"
                  aria-label={`Open ${definition.name}`}
                >
                  <div className="workout-overview-card__media">
                    <AthlexMedia compactFallback resolution={media} />
                    <div className="workout-overview-card__fade" />
                    <div className="workout-overview-card__content">
                      <div className="workout-overview-card__number">{String(index + 1).padStart(2, "0")}</div>
                      <div className="workout-overview-card__copy">
                        <div className="headline-md" style={{ textTransform: "uppercase" }}>
                          {definition.name}
                        </div>
                        <div className="pill" style={{ minHeight: 24, marginTop: 8, padding: "0 10px", background: "rgba(37,37,37,0.9)" }}>
                          {equipment}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-16" style={{ display: "grid", gap: 12 }}>
                    <div className="row">
                      <span className="caption">{copy.prescription}</span>
                      <span className="body-md" style={{ fontWeight: 700 }}>
                        {definition.programSets} x {definition.programReps}{" "}
                        <span className="caption" style={{ marginLeft: 8 }}>
                          {definition.programRir === "1-2" ? "RIR: 1-2" : `RIR: ${definition.programRir}`}
                        </span>
                      </span>
                    </div>
                    <div className="workout-mini-panel">
                      <div className="row" style={{ marginBottom: 4 }}>
                        <span className="eyebrow" style={{ margin: 0 }}>
                          {copy.lastSession}
                        </span>
                        <span className="pill" style={{ minHeight: 24, padding: "0 10px", background: "rgba(182,255,0,0.12)" }}>
                          {copy.readyToProgress}
                        </span>
                      </div>
                      <div className="body-md">{exercise.lastComparableSession}</div>
                    </div>
                  </div>
                </Link>

                <div style={{ paddingInline: 4 }}>
                  <Link className="workout-secondary-button focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}/alternatives`}>
                    <span className="icon" aria-hidden="true">
                      swap_horiz
                    </span>
                    {copy.swap}
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        <div className="sticky-action">
          <PrimaryButton href={`/workout/${session.id}/exercise/${session.exercises[0].id}`}>
            {session.status === "in_progress" ? copy.resumeSession : copy.startSession}
          </PrimaryButton>
        </div>
      </main>
    </Screen>
  );
}
