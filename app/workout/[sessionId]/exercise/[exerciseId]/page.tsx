"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { NumericControl, RirControl } from "@/components/numeric-controls";
import { AthlexMedia } from "@/components/athlex-media";
import { useAuthStore } from "@/components/auth-provider";
import { loadIdentityResolution, type ManagementMode } from "@/lib/auth/identity-resolver";
import { useProgramStore } from "@/components/program-provider";
import { useReducedMotion } from "@/motion/useReducedMotion";
import {
  buildConfirmationSheetTimeline,
  buildPreparingBicepsTimeline
} from "@/motion/feedback";
import {
  buildActiveExerciseEnterTimeline,
  buildExerciseCompleteTimeline,
  buildPauseTimeline,
  buildRestEnterTimeline,
  buildSetCompleteTimeline,
  buildWorkoutStartTimeline,
  buildWorkoutCompleteTimeline
} from "@/motion/workout";
import { useTranslator } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { countCompletedExercises, getExerciseDefinition, getExerciseProgressionTarget, getWorkoutExercise } from "@/lib/workout-data";
import type { SessionExercise } from "@/lib/workout-data";
import { validateWorkoutSetDraft, type WorkoutSetDraftErrors } from "@/lib/workout-set-editor";
import { resolveExerciseHeroMedia, resolveExerciseThumbnailMedia } from "@/lib/media";
import { getOrCreateWorkoutSession, type WorkoutSessionSeed } from "@/lib/workout-session-service";
import { getWorkoutLiveSnapshot } from "@/lib/workout-live-state";
import type { SupportedLocale } from "@/lib/numeric-input";
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

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatRest(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function muscleLabel(locale: string, muscle: string) {
  const copy = {
    en: { glutes: "Glutes", back: "Back", chest: "Chest", hamstrings: "Hamstrings", quadriceps: "Quads", core: "Core" },
    es: { glutes: "Glúteos", back: "Espalda", chest: "Pecho", hamstrings: "Isquiotibiales", quadriceps: "Cuádriceps", core: "Core" },
    ca: { glutes: "Glutis", back: "Esquena", chest: "Pit", hamstrings: "Isquiotibials", quadriceps: "Quàdriceps", core: "Core" },
    de: { glutes: "Gesäß", back: "Rücken", chest: "Brust", hamstrings: "Hamstrings", quadriceps: "Quadrizeps", core: "Rumpf" }
  }[locale as "en" | "es" | "ca" | "de"] ?? { glutes: "Glutes", back: "Back", chest: "Chest", hamstrings: "Hamstrings", quadriceps: "Quads", core: "Core" };

  return copy[muscle as keyof typeof copy] ?? muscle;
}

function resolveSupportedLocale(locale: string): SupportedLocale {
  return locale === "es" || locale === "ca" || locale === "de" ? locale : "en";
}

function formatWorkoutRirValue(value: string | number | null | undefined) {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return "—";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return parsed >= 5 ? "5+" : String(parsed);
}

function formatWorkoutSetSubtitle(set: { kilograms: string | number; reps: string | number; rir?: string | number | null }) {
  const load = `${set.kilograms} kg`;
  const reps = `${set.reps} reps`;
  const rir = `RIR ${formatWorkoutRirValue(set.rir)}`;

  return `${load} · ${reps} · ${rir}`;
}

type PreparingWorkoutStage = "start" | "mid" | "ready";

function WorkoutPreparingVisual({ reducedMotion }: { reducedMotion: boolean }) {
  const visualRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<PreparingWorkoutStage>("start");

  useEffect(() => {
    if (reducedMotion) {
      setStage("ready");
      return undefined;
    }

    setStage("start");
    const midFrame = window.requestAnimationFrame(() => setStage("mid"));
    const readyTimer = window.setTimeout(() => setStage("ready"), 260);

    return () => {
      window.cancelAnimationFrame(midFrame);
      window.clearTimeout(readyTimer);
    };
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const root = visualRef.current;
    if (!root) {
      return undefined;
    }

    const context = buildPreparingBicepsTimeline({ root, reducedMotion }, "[data-feedback-preparing]");
    return () => context.revert();
  }, [reducedMotion]);

  return (
    <div className="workout-preparing-visual" ref={visualRef} data-feedback-preparing="true" data-stage={stage}>
      <svg className="workout-preparing-visual__svg" viewBox="0 0 240 184" role="img" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="workout-preparing-glow" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(182,255,0,0.34)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>
        <rect className="workout-preparing-visual__backdrop" x="0" y="0" width="240" height="184" rx="28" />
        <circle className="workout-preparing-visual__halo" cx="172" cy="70" r="58" />
        <path
          className="workout-preparing-visual__torso"
          d="M53 51C53 45.477 57.477 41 63 41H95C100.523 41 105 45.477 105 51V137C105 142.523 100.523 147 95 147H63C57.477 147 53 142.523 53 137V51Z"
        />
        <path className="workout-preparing-visual__arm workout-preparing-visual__arm--upper" d="M104 79C119 63 140 63 153 77" />
        <path className="workout-preparing-visual__arm workout-preparing-visual__arm--forearm" d="M153 77C164 89 165 108 155 124" />
        <circle className="workout-preparing-visual__fist" cx="154" cy="125" r="8" />
        <path
          className="workout-preparing-visual__biceps"
          d="M112 75C121 63 139 61 151 70C144 82 132 88 120 88C116 88 112 82 112 75Z"
        />
        <path className="workout-preparing-visual__beam workout-preparing-visual__beam--left" d="M28 136L48 136" />
        <path className="workout-preparing-visual__beam workout-preparing-visual__beam--right" d="M186 30L205 30" />
      </svg>
      <div className="workout-preparing-visual__signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function ActiveExercisePage() {
  const params = useParams<{ sessionId: string; exerciseId: string }>();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const motionRootRef = useRef<HTMLElement | null>(null);
  const finishSheetRef = useRef<HTMLDivElement | null>(null);
  const finishSheetCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const hydratedRouteIdRef = useRef<string | null>(null);
  const finishSheetTimeoutRef = useRef<number | null>(null);
  const stickyActionScrollFrameRef = useRef<number | null>(null);
  const stickyActionLastScrollYRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false);
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);
  const [finishSheetMounted, setFinishSheetMounted] = useState(false);
  const [finishSheetClosing, setFinishSheetClosing] = useState(false);
  const [stickyActionHidden, setStickyActionHidden] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [managementMode, setManagementMode] = useState<ManagementMode>("self_managed");
  const [activeSetErrors, setActiveSetErrors] = useState<WorkoutSetDraftErrors | null>(null);
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);
  const [editingSetSnapshot, setEditingSetSnapshot] = useState<SessionExercise["sets"][number] | null>(null);
  const [editingSetErrors, setEditingSetErrors] = useState<WorkoutSetDraftErrors | null>(null);
  const { locale } = useTranslator();
  const auth = useAuthStore();
  const { scheduledWorkouts, templates, templateExercises, getDaySummary, ready: programReady } = useProgramStore();
  const { session, hydrateSession, updateSetDraft, completeSet, saveLoggedSet, skipRestTimer, addThirtySeconds, pauseWorkout, resumeWorkout, finishWorkout } =
    useWorkoutStore();

  const workoutId = resolveSessionId(params.sessionId);
  const routeExerciseId = resolveSessionId(params.exerciseId) || session.exercises[0]?.id || "";

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
    setPauseSheetOpen(Boolean(session.workflow?.pausedAt));
  }, [session.workflow?.pausedAt]);

  useEffect(() => {
    if (!auth.ready || !auth.isConfigured || !auth.user) {
      setManagementMode("self_managed");
      return;
    }

    let active = true;

    async function hydrateIdentity() {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return;
      }

      try {
        const identity = await loadIdentityResolution(client, auth.user!.id, { identityIntent: null });
        if (active) {
          setManagementMode(identity.managementMode);
        }
      } catch {
        if (active) {
          setManagementMode("self_managed");
        }
      }
    }

    void hydrateIdentity();

    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.ready, auth.user?.id]);

  useEffect(() => {
    if (!auth.ready || !programReady || !auth.isConfigured || !auth.user || !workoutId || !scheduledWorkout || !day || !templateView) {
      return;
    }

    if (hydratedRouteIdRef.current === workoutId && session.workoutSessionId === workoutId) {
      setRouteReady(true);
      return;
    }

    let active = true;
    setRouteReady(false);
    const resolvedScheduledWorkout = scheduledWorkout;
    const resolvedDay = day;
    const resolvedTemplateView = templateView;
    const resolvedTemplateExercises = templateExercisesForSeed;

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
      hydratedRouteIdRef.current = workoutId;
      setRouteReady(true);

      if (result.session.id !== workoutId) {
        router.replace(`/workout/${result.session.id}/exercise/${routeExerciseId}`);
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [
    auth.isConfigured,
    auth.ready,
    auth.user?.id,
    day,
    hydrateSession,
    programReady,
    routeExerciseId,
    router,
    scheduledWorkout,
    session.workoutSessionId,
    templateView,
    templateExercisesForSeed,
    workoutId
  ]);

  const live = getWorkoutLiveSnapshot(session);
  const exercise = getWorkoutExercise(session, routeExerciseId || live.activeExercise.id);
  const definition = getExerciseDefinition(exercise.performedExerciseId);
  const currentSet = exercise.sets.find((set) => !set.completed) ?? exercise.sets[exercise.sets.length - 1];
  const nextExercise = session.exercises[exercise.order] ?? null;
  const completedCount = exercise.completedSets.length;
  const exerciseComplete = exercise.completedSets.length >= exercise.totalSets;
  const remainingExercises = Math.max(0, session.totalExercises - countCompletedExercises(session) - (exerciseComplete ? 0 : 1));
  const primaryMuscle = muscleLabel(locale, definition.primaryMuscles[0] ?? "");
  const secondaryMuscle = muscleLabel(locale, definition.secondaryMuscles[0] ?? "");
  const heroMedia = resolveExerciseHeroMedia({
    exerciseKey: definition.id,
    exerciseName: definition.name,
    primaryMuscles: definition.primaryMuscles,
    secondaryMuscles: definition.secondaryMuscles,
    equipment: definition.equipment
  });
  const nextExerciseMedia = nextExercise
    ? resolveExerciseThumbnailMedia({
        exerciseKey: getExerciseDefinition(nextExercise.performedExerciseId).id,
        exerciseName: getExerciseDefinition(nextExercise.performedExerciseId).name,
        primaryMuscles: getExerciseDefinition(nextExercise.performedExerciseId).primaryMuscles,
        secondaryMuscles: getExerciseDefinition(nextExercise.performedExerciseId).secondaryMuscles,
        equipment: getExerciseDefinition(nextExercise.performedExerciseId).equipment
      })
    : null;

  const supportedLocale = resolveSupportedLocale(locale);

  const controlCopy = {
    en: {
      plan: "PLAN",
      actual: "ACTUAL",
      coachPlan: "COACH PLAN",
      loggedSets: "LOGGED SETS",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      saved: "Saved",
      readOnly: "Read only",
      youDid: "YOU DID",
      setLabel: "Set"
    },
    es: {
      plan: "PLAN",
      actual: "ACTUAL",
      coachPlan: "PLAN DEL COACH",
      loggedSets: "SERIES REGISTRADAS",
      edit: "Editar",
      save: "Guardar",
      cancel: "Cancelar",
      saved: "Guardado",
      readOnly: "Solo lectura",
      youDid: "HICISTE",
      setLabel: "Serie"
    },
    ca: {
      plan: "PLA",
      actual: "ACTUAL",
      coachPlan: "PLA DEL COACH",
      loggedSets: "SÈRIES REGISTRADES",
      edit: "Edita",
      save: "Desa",
      cancel: "Cancel·la",
      saved: "Desat",
      readOnly: "Només lectura",
      youDid: "HAS FET",
      setLabel: "Sèrie"
    },
    de: {
      plan: "PLAN",
      actual: "AKTUELL",
      coachPlan: "COACH-PLAN",
      loggedSets: "PROTOKOLLIERTE SÄTZE",
      edit: "Bearbeiten",
      save: "Speichern",
      cancel: "Abbrechen",
      saved: "Gespeichert",
      readOnly: "Nur lesen",
      youDid: "DU HAST GEMACHT",
      setLabel: "Satz"
    }
  }[supportedLocale];

  const copy = {
    en: {
      closeWorkout: "Close workout",
      moreOptions: "More options",
      workoutSession: "Workout Session",
      workoutStart: "Preparing your workout",
      workoutStartCopy: "Workout title",
      exerciseCount: "exercise count",
      estimatedDuration: "estimated duration",
      globalTimer: "Elapsed",
      pause: "Pause",
      resume: "Resume workout",
      finish: "End workout",
      exercise: "Exercise",
      primary: "Primary",
      secondary: "Secondary",
      previewExercise: "Preview exercise",
      previewExerciseBody: "Review technique, media, and alternatives without losing workout context.",
      sets: "Sets",
      reps: "Reps",
      sec: "Sec",
      lastSession: "Last session",
      logSets: "Log Sets",
      kg: "Kg",
      rir: "RIR",
      restTimer: "Rest",
      nextSet: "Next set",
      addFifteenSeconds: "+15 SEC",
      skip: "Skip rest",
      alternatives: "Alternatives",
      pain: "Pain / discomfort",
      saving: "Saving...",
      completeSet: "Complete Set",
      tracker: "Tracker",
      completed: "Completed",
      current: "Current",
      future: "Future",
      target: "TARGET",
      rest: "REST",
      lastTime: "LAST TIME",
      exerciseComplete: "EXERCISE COMPLETE",
      nextExercise: "NEXT EXERCISE",
      nextExerciseCta: "Next Exercise",
      workoutPaused: "WORKOUT PAUSED",
      keepTraining: "Keep training",
      finishAnyway: "Finish anyway",
      finishTitle: "Finish workout?",
      finishEarly: "Finish early?",
      finishBody: "Your completed sets are already saved.",
      finishingNotice: "Your completed sets are already saved.",
      summaryCount: "sets",
      workoutComplete: "WORKOUT COMPLETE"
    },
    es: {
      closeWorkout: "Cerrar entrenamiento",
      moreOptions: "Más opciones",
      workoutSession: "Sesión de entrenamiento",
      workoutStart: "Preparando tu entrenamiento",
      workoutStartCopy: "Título del entrenamiento",
      exerciseCount: "número de ejercicio",
      estimatedDuration: "duración estimada",
      globalTimer: "Transcurrido",
      pause: "Pausa",
      resume: "Reanudar entrenamiento",
      finish: "Terminar entrenamiento",
      exercise: "Ejercicio",
      primary: "Primario",
      secondary: "Secundario",
      previewExercise: "Vista previa del ejercicio",
      previewExerciseBody: "Revisa la técnica, los medios y las alternativas sin perder el contexto del entrenamiento.",
      sets: "Series",
      reps: "Reps",
      sec: "Seg",
      lastSession: "Última sesión",
      logSets: "Registrar series",
      kg: "Kg",
      rir: "RIR",
      restTimer: "Descanso",
      nextSet: "Siguiente serie",
      addFifteenSeconds: "+15 SEG",
      skip: "Saltar descanso",
      alternatives: "Alternativas",
      pain: "Dolor / molestia",
      saving: "Guardando...",
      completeSet: "Completar serie",
      tracker: "Progreso",
      completed: "Completado",
      current: "Actual",
      future: "Futuro",
      target: "OBJETIVO",
      rest: "DESCANSO",
      lastTime: "ÚLTIMA VEZ",
      exerciseComplete: "EJERCICIO COMPLETADO",
      nextExercise: "SIGUIENTE EJERCICIO",
      nextExerciseCta: "Siguiente ejercicio",
      workoutPaused: "ENTRENAMIENTO EN PAUSA",
      keepTraining: "Seguir entrenando",
      finishAnyway: "Finalizar igualmente",
      finishTitle: "¿Terminar entrenamiento?",
      finishEarly: "¿Terminar antes de tiempo?",
      finishBody: "Tus series completadas ya están guardadas.",
      finishingNotice: "Tus series completadas ya están guardadas.",
      summaryCount: "series",
      workoutComplete: "ENTRENAMIENTO COMPLETADO"
    },
    ca: {
      closeWorkout: "Tanca l'entrenament",
      moreOptions: "Més opcions",
      workoutSession: "Sessió d'entrenament",
      workoutStart: "Preparant el teu entrenament",
      workoutStartCopy: "Títol de l'entrenament",
      exerciseCount: "nombre d'exercici",
      estimatedDuration: "durada estimada",
      globalTimer: "Transcorregut",
      pause: "Pausa",
      resume: "Reprendre entrenament",
      finish: "Acabar entrenament",
      exercise: "Exercici",
      primary: "Primari",
      secondary: "Secundari",
      previewExercise: "Previsualitza l'exercici",
      previewExerciseBody: "Revisa la tècnica, els mitjans i les alternatives sense perdre el context de l'entrenament.",
      sets: "Sèries",
      reps: "Reps",
      sec: "Seg",
      lastSession: "Última sessió",
      logSets: "Registrar sèries",
      kg: "Kg",
      rir: "RIR",
      restTimer: "Descans",
      nextSet: "Sèrie següent",
      addFifteenSeconds: "+15 SEG",
      skip: "Omet descans",
      alternatives: "Alternatives",
      pain: "Dolor / molèstia",
      saving: "Desant...",
      completeSet: "Completa la sèrie",
      tracker: "Progrés",
      completed: "Completat",
      current: "Actual",
      future: "Futur",
      target: "OBJECTIU",
      rest: "DESCANS",
      lastTime: "DARRERA VEGADA",
      exerciseComplete: "EXERCICI COMPLETAT",
      nextExercise: "SEGÜENT EXERCICI",
      nextExerciseCta: "Següent exercici",
      workoutPaused: "ENTRENAMENT EN PAUSA",
      keepTraining: "Continua entrenant",
      finishAnyway: "Finalitza igualment",
      finishTitle: "Acabar entrenament?",
      finishEarly: "Acabar abans d'hora?",
      finishBody: "Les sèries completades ja estan desades.",
      finishingNotice: "Les sèries completades ja estan desades.",
      summaryCount: "sèries",
      workoutComplete: "ENTRENAMENT COMPLETAT"
    },
    de: {
      closeWorkout: "Training schließen",
      moreOptions: "Weitere Optionen",
      workoutSession: "Trainingseinheit",
      workoutStart: "Dein Training wird vorbereitet",
      workoutStartCopy: "Trainingstitel",
      exerciseCount: "Übungsanzahl",
      estimatedDuration: "geschätzte Dauer",
      globalTimer: "Verstrichen",
      pause: "Pause",
      resume: "Training fortsetzen",
      finish: "Training beenden",
      exercise: "Übung",
      primary: "Primär",
      secondary: "Sekundär",
      previewExercise: "Übung ansehen",
      previewExerciseBody: "Überprüfe Technik, Medien und Alternativen, ohne den Trainingskontext zu verlieren.",
      sets: "Sätze",
      reps: "Wdh.",
      sec: "Sek",
      lastSession: "Letzte Einheit",
      logSets: "Sätze protokollieren",
      kg: "Kg",
      rir: "RIR",
      restTimer: "Pause",
      nextSet: "Nächster Satz",
      addFifteenSeconds: "+15 SEK",
      skip: "Pause überspringen",
      alternatives: "Alternativen",
      pain: "Schmerz / Unbehagen",
      saving: "Speichern...",
      completeSet: "Satz abschließen",
      tracker: "Tracker",
      completed: "Abgeschlossen",
      current: "Aktuell",
      future: "Zukünftig",
      target: "ZIEL",
      rest: "PAUSE",
      lastTime: "LETZTES MAL",
      exerciseComplete: "ÜBUNG ABGESCHLOSSEN",
      nextExercise: "NÄCHSTE ÜBUNG",
      nextExerciseCta: "Nächste Übung",
      workoutPaused: "TRAINING PAUSIERT",
      keepTraining: "Weiter trainieren",
      finishAnyway: "Trotzdem beenden",
      finishTitle: "Training beenden?",
      finishEarly: "Früh beenden?",
      finishBody: "Deine abgeschlossenen Sätze sind bereits gespeichert.",
      finishingNotice: "Deine abgeschlossenen Sätze sind bereits gespeichert.",
      summaryCount: "Sätze",
      workoutComplete: "TRAINING ABGESCHLOSSEN"
    }
  }[locale as "en" | "es" | "ca" | "de"] ?? {
    closeWorkout: "Close workout",
    moreOptions: "More options",
    workoutSession: "Workout Session",
    workoutStart: "Preparing your workout",
    workoutStartCopy: "Workout title",
    exerciseCount: "exercise count",
    estimatedDuration: "estimated duration",
    globalTimer: "Elapsed",
    pause: "Pause",
    resume: "Resume workout",
    finish: "End workout",
    exercise: "Exercise",
    primary: "Primary",
    secondary: "Secondary",
    previewExercise: "Preview exercise",
    previewExerciseBody: "Review technique, media, and alternatives without losing workout context.",
    sets: "Sets",
    reps: "Reps",
    sec: "Sec",
    lastSession: "Last session",
    logSets: "Log Sets",
    kg: "Kg",
    rir: "RIR",
    restTimer: "Rest",
    nextSet: "Next set",
    addFifteenSeconds: "+15 SEC",
    skip: "Skip rest",
    alternatives: "Alternatives",
    pain: "Pain / discomfort",
    saving: "Saving...",
    completeSet: "Complete Set",
    tracker: "Tracker",
    completed: "Completed",
    current: "Current",
    future: "Future",
    target: "TARGET",
    rest: "REST",
    lastTime: "LAST TIME",
    exerciseComplete: "EXERCISE COMPLETE",
    nextExercise: "NEXT EXERCISE",
    nextExerciseCta: "Next Exercise",
    workoutPaused: "WORKOUT PAUSED",
    keepTraining: "Keep training",
    finishAnyway: "Finish anyway",
    finishTitle: "Finish workout?",
    finishEarly: "Finish early?",
    finishBody: "Your completed sets are already saved.",
    finishingNotice: "Your completed sets are already saved.",
    summaryCount: "sets",
    workoutComplete: "WORKOUT COMPLETE"
  };

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root) {
      return;
    }

    if (!reducedMotion) {
      if (!routeReady) {
        buildWorkoutStartTimeline({ root, reducedMotion });
      } else if (pauseSheetOpen) {
        buildPauseTimeline({ root, reducedMotion });
      } else if (exerciseComplete) {
        buildExerciseCompleteTimeline({ root, reducedMotion });
      } else if (session.restTimer?.active) {
        buildRestEnterTimeline({ root, reducedMotion });
      } else {
        buildActiveExerciseEnterTimeline({ root, reducedMotion });
      }
    }

    return undefined;
  }, [exerciseComplete, pauseSheetOpen, reducedMotion, routeReady, session.restTimer?.active]);

  useEffect(() => {
    if (finishSheetTimeoutRef.current !== null) {
      window.clearTimeout(finishSheetTimeoutRef.current);
      finishSheetTimeoutRef.current = null;
    }

    if (finishSheetOpen) {
      setFinishSheetMounted(true);
      setFinishSheetClosing(false);
      return;
    }

    if (!finishSheetMounted) {
      return;
    }

    if (reducedMotion) {
      setFinishSheetMounted(false);
      setFinishSheetClosing(false);
      return;
    }

    setFinishSheetClosing(true);
    finishSheetTimeoutRef.current = window.setTimeout(() => {
      setFinishSheetMounted(false);
      setFinishSheetClosing(false);
      finishSheetTimeoutRef.current = null;
    }, 220);

    return () => {
      if (finishSheetTimeoutRef.current !== null) {
        window.clearTimeout(finishSheetTimeoutRef.current);
        finishSheetTimeoutRef.current = null;
      }
    };
  }, [finishSheetMounted, finishSheetOpen, reducedMotion]);

  useLayoutEffect(() => {
    const root = finishSheetRef.current;
    if (!root || !finishSheetMounted || finishSheetClosing) {
      return undefined;
    }

    const context = buildConfirmationSheetTimeline({ root, reducedMotion }, "[data-feedback-sheet]");
    finishSheetCloseButtonRef.current?.focus();
    return () => context.revert();
  }, [finishSheetClosing, finishSheetMounted, reducedMotion]);

  useEffect(() => {
    if (!finishSheetMounted || finishSheetClosing) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFinishSheetOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = finishSheetRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [finishSheetClosing, finishSheetMounted]);

  const handleComplete = async () => {
    if (submitting || currentSet.completed) {
      return;
    }

    const validation = validateWorkoutSetDraft(supportedLocale, {
      kilograms: currentSet.kilograms,
      reps: currentSet.reps,
      rir: currentSet.rir
    });

    if (!validation.valid) {
      setActiveSetErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setActiveSetErrors(null);

    try {
      await completeSet(exercise.id, currentSet.setNumber, {
        kilograms: currentSet.kilograms,
        reps: currentSet.reps,
        rir: currentSet.rir
      });

      buildSetCompleteTimeline({ root: motionRootRef.current ?? document.body, reducedMotion });

      const isFinalSet = completedCount + 1 >= exercise.totalSets;
      if (isFinalSet) {
        skipRestTimer();
        if (nextExercise) {
          buildExerciseCompleteTimeline({ root: motionRootRef.current ?? document.body, reducedMotion });
        } else {
          buildWorkoutCompleteTimeline({ root: motionRootRef.current ?? document.body, reducedMotion });
          await finishWorkout();
          router.push(`/workout/${session.id}/summary`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const beginEditLoggedSet = (setNumber: number) => {
    const set = exercise.sets.find((entry) => entry.setNumber === setNumber);
    if (!set) {
      return;
    }

    setEditingSetNumber(setNumber);
    setEditingSetSnapshot({ ...set });
    setEditingSetErrors(null);
  };

  const cancelEditLoggedSet = () => {
    setEditingSetNumber(null);
    setEditingSetSnapshot(null);
    setEditingSetErrors(null);
  };

  const saveLoggedSetDraft = async () => {
    if (!editingSetSnapshot || editingSetNumber === null || submitting) {
      return;
    }

    const validation = validateWorkoutSetDraft(supportedLocale, {
      kilograms: editingSetSnapshot.kilograms,
      reps: editingSetSnapshot.reps,
      rir: editingSetSnapshot.rir
    });

    if (!validation.valid) {
      setEditingSetErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setEditingSetErrors(null);

    try {
      await saveLoggedSet(exercise.id, editingSetNumber, {
        kilograms: editingSetSnapshot.kilograms,
        reps: editingSetSnapshot.reps,
        rir: editingSetSnapshot.rir?.trim() ? editingSetSnapshot.rir : undefined
      });
      cancelEditLoggedSet();
    } finally {
      setSubmitting(false);
    }
  };

  const workoutStartCopy = routeReady
    ? null
    : {
        title: session.workoutType,
        exercises: `${session.totalExercises} ${copy.exerciseCount}`,
        duration: session.summary.duration
      };
  const completeSetLabel = `${copy.completeSet} ${currentSet.setNumber}`;
  const currentSetRirValue = currentSet.rir == null || currentSet.rir.trim() === "" ? null : Number(currentSet.rir);
  const suggestedTargetCopy = getExerciseProgressionTarget(supportedLocale, exercise.suggestedTarget);

  useEffect(() => {
    if (editingSetNumber !== null) {
      setStickyActionHidden(true);
      return undefined;
    }

    setStickyActionHidden(false);

    const scrollContainer = document.querySelector("main");
    if (!(scrollContainer instanceof HTMLElement)) {
      return undefined;
    }

    stickyActionLastScrollYRef.current = scrollContainer.scrollTop;

    const updateStickyActionVisibility = () => {
      const currentScrollY = scrollContainer.scrollTop;
      const delta = currentScrollY - stickyActionLastScrollYRef.current;

      if (currentScrollY <= 8) {
        setStickyActionHidden(false);
      } else if (delta > 6) {
        setStickyActionHidden(true);
      } else if (delta < -6) {
        setStickyActionHidden(false);
      }

      stickyActionLastScrollYRef.current = currentScrollY;
    };

    const onScroll = () => {
      if (stickyActionScrollFrameRef.current != null) {
        return;
      }

      stickyActionScrollFrameRef.current = window.requestAnimationFrame(() => {
        stickyActionScrollFrameRef.current = null;
        updateStickyActionVisibility();
      });
    };

    updateStickyActionVisibility();
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
      if (stickyActionScrollFrameRef.current != null) {
        window.cancelAnimationFrame(stickyActionScrollFrameRef.current);
        stickyActionScrollFrameRef.current = null;
      }
    };
  }, [editingSetNumber]);

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-active-topbar">
          <button aria-label={copy.closeWorkout} className="tap-target focus-ring" type="button" onClick={() => router.push(`/workout/${session.id}`)}>
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
          <div className="workout-active-topbar__copy">
            <div className="eyebrow" style={{ margin: 0 }}>
              {copy.workoutSession}
            </div>
            <div className="workout-active-topbar__title">{session.phaseLabel}</div>
            <div className="workout-active-topbar__meta">
              <span>{copy.globalTimer}</span>
              <span>{formatElapsed(live.elapsedSeconds)}</span>
            </div>
          </div>
          <div className="workout-active-topbar__actions">
            <button
              aria-label={pauseSheetOpen ? copy.resume : copy.pause}
              className="tap-target focus-ring"
              type="button"
              onClick={() => {
                if (pauseSheetOpen) {
                  resumeWorkout();
                  setPauseSheetOpen(false);
                } else {
                  pauseWorkout();
                  setPauseSheetOpen(true);
                }
              }}
            >
              <span className="icon" aria-hidden="true">
                {pauseSheetOpen ? "play_arrow" : "pause"}
              </span>
            </button>
            <button aria-label={copy.moreOptions} className="tap-target focus-ring" type="button" onClick={() => setFinishSheetOpen(true)}>
              <span className="icon" aria-hidden="true">
                more_vert
              </span>
            </button>
          </div>
        </header>
      }
    >
      <main ref={motionRootRef} className="content tight workout-active-shell">
        {!routeReady ? (
          <section className="section">
            <Card className="workout-start-card workout-start-card--preparing elevated" data-workout-motion="start-hero">
              <div className="workout-start-card__copy">
                <div className="eyebrow workout-start-card__eyebrow">{copy.workoutStart}</div>
                <h1 className="headline-lg workout-start-card__title" style={{ marginTop: 8, textTransform: "uppercase" }}>
                  {workoutStartCopy?.title ?? session.workoutType}
                </h1>
                <p className="body-md workout-start-card__meta">
                  {workoutStartCopy?.exercises ?? `${session.totalExercises} ${copy.exerciseCount}`} · {workoutStartCopy?.duration ?? session.summary.duration}
                </p>
              </div>
              <WorkoutPreparingVisual reducedMotion={reducedMotion} />
            </Card>
          </section>
        ) : (
          <>
            <section className="section">
              <Card className="workout-active-hero" data-workout-motion="active-hero">
                <div className="workout-active-hero__media">
                  <AthlexMedia resolution={heroMedia} />
                  <div className="workout-active-hero__fade" />
                </div>
                <div className="workout-active-hero__body">
                  <div className="workout-active-hero__body-copy">
                    <div className="pill" style={{ background: "rgba(182,255,0,0.14)", color: "var(--accent-primary)", width: "fit-content" }}>
                      {definition.label}
                    </div>
                    <h1 className="headline-lg" style={{ textTransform: "uppercase", marginTop: 10 }}>
                      {definition.name}
                    </h1>
                    <p className="body-md" style={{ marginTop: 8, color: "rgba(247,247,247,0.88)" }}>
                      {copy.primary}: {primaryMuscle} · {copy.secondary}: {secondaryMuscle}
                    </p>
                    <div className="eyebrow" style={{ marginTop: 12 }}>
                      {copy.previewExercise}
                    </div>
                    <p className="caption" style={{ marginTop: 6 }}>
                      {copy.previewExerciseBody}
                    </p>
                  </div>
                  <Link
                    className="button-secondary focus-ring workout-active-hero__detail-link"
                    href={`/workout/${workoutId}/exercise/${exercise.id}/detail`}
                  >
                    {copy.previewExercise}
                  </Link>
                </div>
              </Card>
            </section>

            <section className="section" data-workout-motion="active-shell">
              <Card className="workout-prescription-card">
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="eyebrow" style={{ margin: 0 }}>
                    {managementMode === "coach_managed" ? controlCopy.coachPlan : controlCopy.plan}
                  </div>
                  {managementMode === "coach_managed" ? (
                    <span className="pill" style={{ background: "rgba(182,255,0,0.12)", color: "var(--accent-primary)" }}>
                      {controlCopy.readOnly}
                    </span>
                  ) : null}
                </div>
                <div className="workout-prescription-grid">
                  <div>
                    <div className="eyebrow" style={{ margin: 0 }}>
                      {copy.target}
                    </div>
                    <div className="headline-md" style={{ marginTop: 8 }}>
                      {definition.programReps} · RIR {definition.programRir}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ margin: 0 }}>
                      {copy.rest}
                    </div>
                    <div className="headline-md" style={{ marginTop: 8 }}>
                      {formatRest(definition.restSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ margin: 0 }}>
                      {copy.lastTime}
                    </div>
                    <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                      {exercise.lastComparableSession}
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            <section className="section">
              <div className="row" style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ margin: 0 }}>
                  {copy.tracker}
                </div>
                <div className="caption">
                  {completedCount} / {exercise.totalSets}
                </div>
              </div>
              <div className="workout-set-tracker" aria-label={copy.tracker}>
                {exercise.sets.map((set) => {
                  const state = set.completed ? copy.completed : set.setNumber === currentSet.setNumber ? copy.current : copy.future;
                  return (
                    <div key={set.setNumber} className={`workout-set-tracker__chip ${set.completed ? "is-complete" : set.setNumber === currentSet.setNumber ? "is-current" : ""}`}>
                      <span className="workout-set-tracker__state">{state}</span>
                      <span className="workout-set-tracker__number">{set.setNumber}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {!exerciseComplete ? (
              <section className="section" data-workout-motion="active-logger">
                <Card className="workout-logger-card elevated">
                  <div className="row" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow" style={{ margin: 0 }}>
                        {copy.exercise} {exercise.order} / {session.totalExercises}
                      </div>
                      <div className="headline-md" style={{ marginTop: 8 }}>
                        {definition.name}
                      </div>
                    </div>
                    <div className="pill" style={{ background: "rgba(182,255,0,0.12)", color: "var(--accent-primary)" }}>
                      {copy.nextSet} {currentSet.setNumber}
                    </div>
                  </div>
                  <div className="workout-logger-grid">
                    <NumericControl
                      className="workout-logger-control"
                      decimals={1}
                      error={activeSetErrors?.kilograms}
                      inputMode="decimal"
                      label={copy.kg}
                      locale={supportedLocale}
                      min={0.1}
                      onBlur={() => setActiveSetErrors((current) => (current ? { ...current, kilograms: undefined } : current))}
                      onChange={(value) => updateSetDraft(exercise.id, currentSet.setNumber, { kilograms: value })}
                      onFocus={() => setActiveSetErrors((current) => (current ? { ...current, kilograms: undefined } : current))}
                      step={2.5}
                      unit="kg"
                      value={currentSet.kilograms}
                    />
                    <NumericControl
                      className="workout-logger-control"
                      decimals={0}
                      error={activeSetErrors?.reps}
                      inputMode="numeric"
                      label={copy.reps}
                      locale={supportedLocale}
                      min={1}
                      onBlur={() => setActiveSetErrors((current) => (current ? { ...current, reps: undefined } : current))}
                      onChange={(value) => updateSetDraft(exercise.id, currentSet.setNumber, { reps: value })}
                      onFocus={() => setActiveSetErrors((current) => (current ? { ...current, reps: undefined } : current))}
                      step={1}
                      unit="reps"
                      value={currentSet.reps}
                    />
                    <RirControl
                      className="workout-logger-control"
                      helper={activeSetErrors?.rir}
                      locale={supportedLocale}
                      onChange={(value) => updateSetDraft(exercise.id, currentSet.setNumber, { rir: String(value) })}
                      readOnly={false}
                      state={activeSetErrors?.rir ? "invalid" : "default"}
                      value={currentSetRirValue !== null && Number.isFinite(currentSetRirValue) ? currentSetRirValue : null}
                    />
                        </div>
                        <div className="workout-logger-footer">
                          <div className="caption">{suggestedTargetCopy}</div>
                        </div>
                      </Card>
                    </section>
            ) : null}

            <section className="section">
              <div className="row" style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ margin: 0 }}>
                  {controlCopy.loggedSets}
                </div>
                <div className="caption">
                  {exercise.completedSets.length} / {exercise.totalSets}
                </div>
              </div>
              <div className="stack">
                {exercise.completedSets.map((set) => {
                  const isEditing = editingSetNumber === set.setNumber;
                  const setDraft = isEditing ? editingSetSnapshot : null;

                  if (isEditing && setDraft) {
                    return (
                      <Card key={set.setNumber} className="workout-set-row workout-set-row--editing elevated">
                        <div className="row start workout-set-row__header">
                          <div>
                            <div className="eyebrow" style={{ margin: 0 }}>
                              {controlCopy.setLabel} {set.setNumber}
                            </div>
                            <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                              {formatWorkoutSetSubtitle(set)}
                            </div>
                          </div>
                          <span className="pill" style={{ background: "rgba(182,255,0,0.12)", color: "var(--accent-primary)" }}>
                            {controlCopy.edit}
                          </span>
                        </div>
                        <div className="workout-logger-grid">
                          <NumericControl
                            className="workout-logger-control"
                            decimals={1}
                            error={editingSetErrors?.kilograms}
                            inputMode="decimal"
                            label={copy.kg}
                            locale={supportedLocale}
                            min={0.1}
                            onChange={(value) => setEditingSetSnapshot((current) => (current ? { ...current, kilograms: value } : current))}
                            step={2.5}
                            unit="kg"
                            value={setDraft.kilograms}
                          />
                          <NumericControl
                            className="workout-logger-control"
                            decimals={0}
                            error={editingSetErrors?.reps}
                            inputMode="numeric"
                            label={copy.reps}
                            locale={supportedLocale}
                            min={1}
                            onChange={(value) => setEditingSetSnapshot((current) => (current ? { ...current, reps: value } : current))}
                            step={1}
                            unit="reps"
                            value={setDraft.reps}
                          />
                          <RirControl
                            className="workout-logger-control"
                            helper={editingSetErrors?.rir}
                            locale={supportedLocale}
                            onChange={(value) => setEditingSetSnapshot((current) => (current ? { ...current, rir: String(value) } : current))}
                            state={editingSetErrors?.rir ? "invalid" : "default"}
                            value={
                              setDraft.rir != null && setDraft.rir.trim() !== "" && Number.isFinite(Number(setDraft.rir))
                                ? Number(setDraft.rir)
                                : null
                            }
                          />
                        </div>
                        <div className="workout-logger-footer">
                          <div className="caption">{controlCopy.saved}</div>
                          <div className="workout-set-row__actions">
                            <button className="button-secondary focus-ring" type="button" disabled={submitting} onClick={cancelEditLoggedSet}>
                              {controlCopy.cancel}
                            </button>
                            <button className="button-primary focus-ring" type="button" disabled={submitting} onClick={saveLoggedSetDraft}>
                              {submitting ? copy.saving : controlCopy.save}
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <Card key={set.setNumber} className="workout-set-row elevated">
                      <div className="row start">
                        <div className="workout-set-row__meta">
                          <div className="eyebrow" style={{ margin: 0 }}>
                            {controlCopy.setLabel} {set.setNumber}
                          </div>
                          <div className="body-md" style={{ fontWeight: 700 }}>
                            {formatWorkoutSetSubtitle(set)}
                          </div>
                          <div className="caption">{controlCopy.saved}</div>
                        </div>
                        <button className="button-secondary focus-ring" type="button" onClick={() => beginEditLoggedSet(set.setNumber)}>
                          {controlCopy.edit}
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {session.restTimer?.active ? (
              <section className="section" data-workout-motion="rest-card">
                <Card className="workout-rest-card elevated">
                  <div className="row" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow">{copy.restTimer}</div>
                      <div className="headline-lg" style={{ marginTop: 6 }} data-workout-motion="rest-ring">
                        {formatRest(session.restTimer.secondsRemaining)}
                      </div>
                    </div>
                    <div className="pill">{copy.nextSet}</div>
                  </div>
                  <div className="row">
                    <button className="workout-secondary-button focus-ring" type="button" onClick={() => addThirtySeconds()}>
                      {copy.addFifteenSeconds}
                    </button>
                    <button className="workout-secondary-button focus-ring" type="button" onClick={() => skipRestTimer()}>
                      {copy.skip}
                    </button>
                  </div>
                </Card>
              </section>
            ) : null}

            {exerciseComplete ? (
              <section className="section" data-workout-motion="exercise-complete-overlay">
                <Card className="workout-exercise-complete-card elevated">
                  <div className="eyebrow" style={{ color: "#b6ff00" }}>
                    {copy.exerciseComplete}
                  </div>
                  <h2 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                    {exercise.totalSets} / {exercise.totalSets} {copy.summaryCount}
                  </h2>
                  <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                    {copy.nextExercise}
                  </p>
                  {nextExercise ? (
                    <div className="workout-next-preview" data-workout-motion="next-exercise-card">
                      <div className="workout-next-preview__image">
                        {nextExerciseMedia ? (
                          <AthlexMedia resolution={nextExerciseMedia} />
                        ) : null}
                      </div>
                      <div className="workout-next-preview__copy">
                        <div className="pill" style={{ background: "rgba(182,255,0,0.14)", color: "var(--accent-primary)" }}>
                          {copy.nextExercise}
                        </div>
                        <div className="headline-md" style={{ marginTop: 8, textTransform: "uppercase" }}>
                          {getExerciseDefinition(nextExercise.performedExerciseId).name}
                        </div>
                        <div className="caption" style={{ marginTop: 4 }}>
                          {nextExercise.totalSets} sets · {getExerciseDefinition(nextExercise.performedExerciseId).programReps}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Card>
              </section>
            ) : null}

            <div className="stack">
              <Link className="workout-secondary-button focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}/alternatives`}>
                <span className="icon" aria-hidden="true">
                  swap_horiz
                </span>
                {copy.alternatives}
              </Link>
              <Link className="workout-secondary-button focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}/safety`}>
                <span className="icon" aria-hidden="true">
                  report
                </span>
                {copy.pain}
              </Link>
            </div>
          </>
        )}

        {pauseSheetOpen ? (
          <section className="workout-sheet workout-sheet--overlay" data-workout-motion="pause-overlay" aria-label={copy.workoutPaused}>
            <Card className="workout-sheet__card elevated">
              <div className="eyebrow" style={{ color: "#b6ff00" }}>
                {copy.workoutPaused}
              </div>
              <h2 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                {formatElapsed(live.elapsedSeconds)}
              </h2>
              <div className="caption" style={{ marginTop: 6 }}>
                {completedCount} / {exercise.totalSets} {copy.summaryCount}
              </div>
              <div className="workout-sheet__actions">
                <button
                  className="button-primary focus-ring"
                  type="button"
                  onClick={() => {
                    resumeWorkout();
                    setPauseSheetOpen(false);
                  }}
                >
                  {copy.resume}
                </button>
                <button
                  className="button-secondary focus-ring"
                  type="button"
                  onClick={() => {
                    setPauseSheetOpen(false);
                    setFinishSheetOpen(true);
                  }}
                >
                  {copy.finish}
                </button>
              </div>
            </Card>
          </section>
        ) : null}

        {finishSheetMounted ? (
          <section
            className={`workout-sheet workout-sheet--overlay ${finishSheetClosing ? "workout-sheet--closing" : ""}`.trim()}
            aria-describedby="finish-workout-copy"
            aria-labelledby="finish-workout-title"
            aria-modal="true"
            role="dialog"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setFinishSheetOpen(false);
              }
            }}
          >
            <div
              className={`workout-sheet__card-shell ${finishSheetClosing ? "workout-sheet__card-shell--closing" : ""}`.trim()}
              ref={finishSheetRef}
              data-feedback-sheet="true"
              data-workout-motion="finish-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="workout-sheet__card elevated workout-sheet__card--finish">
                <div className="eyebrow" style={{ color: "#b6ff00" }}>
                  {remainingExercises > 0 ? copy.finishEarly : copy.finishTitle}
                </div>
                <h2 className="headline-lg" id="finish-workout-title" style={{ marginTop: 8, textTransform: "uppercase" }}>
                  {copy.finishTitle}
                </h2>
                <p className="body-md" id="finish-workout-copy" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                  {copy.finishingNotice}
                </p>
                <div className="workout-sheet__actions">
                  <button className="button-secondary focus-ring" type="button" onClick={() => setFinishSheetOpen(false)}>
                    {copy.keepTraining}
                  </button>
                  <button
                    ref={finishSheetCloseButtonRef}
                    className="button-primary focus-ring"
                    type="button"
                    onClick={async () => {
                      setFinishSheetOpen(false);
                      await finishWorkout();
                      router.push(`/workout/${session.id}/summary`);
                    }}
                  >
                    {copy.finishAnyway}
                  </button>
                </div>
              </Card>
            </div>
          </section>
        ) : null}

        {editingSetNumber === null ? (
          <div className={`sticky-action ${stickyActionHidden ? "sticky-action--hidden" : ""}`.trim()}>
            {!exerciseComplete ? (
              <button
                aria-label={completeSetLabel}
                className="button-primary focus-ring"
                disabled={submitting}
                type="button"
                onClick={() => void handleComplete()}
              >
                {submitting ? copy.saving : completeSetLabel}
              </button>
            ) : nextExercise ? (
              <Link className="button-primary focus-ring" href={`/workout/${session.id}/exercise/${nextExercise.id}`}>
                {copy.nextExerciseCta}
              </Link>
            ) : (
              <Link className="button-primary focus-ring" href={`/workout/${session.id}/summary`}>
                {copy.workoutComplete}
              </Link>
            )}
          </div>
        ) : null}
      </main>
    </Screen>
  );
}
