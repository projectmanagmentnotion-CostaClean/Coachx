"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AthlexMedia } from "@/components/athlex-media";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { AnatomyPreview } from "@/components/anatomy-preview";
import { useLocale } from "@/components/locale-provider";
import { publishFeedbackSuccess } from "@/components/feedback-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { readIdentityIntent } from "@/lib/auth/session-policy";
import {
  getExerciseDefinition,
  getWorkoutAlternativeCards,
  getWorkoutExercise,
  type ExerciseAlternative
} from "@/lib/workout-data";
import {
  resolveExerciseEndMedia,
  resolveExerciseFullscreenMedia,
  resolveExerciseStartMedia,
  resolveExerciseThumbnailMedia
} from "@/lib/media";
import {
  buildAlternativePreviewTimeline,
  buildAlternativesEnterTimeline,
  buildCoachRequestTimeline,
  buildExerciseDetailOpenTimeline,
  buildExerciseMediaToggleTimeline,
  buildExerciseSwapTimeline,
  buildMediaFullscreenTimeline,
  buildMuscleMapRevealTimeline
} from "@/motion/workout";
import { useReducedMotion } from "@/motion/useReducedMotion";

type MediaSide = "start" | "end";
type DetailSource = "workout" | "library";

interface ExerciseDetailExperienceProps {
  exerciseId: string;
  backHref: string;
  source: DetailSource;
  detailHref?: string;
}

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        detail: "Exercise Detail",
        start: "START",
        end: "END",
        technique: "Technique",
        muscleIntent: "Muscle Intent",
        performance: "Performance",
        alternatives: "Alternatives",
        preview: "Preview exercise",
        fullscreen: "Fullscreen media",
        returnWorkout: "Return to workout",
        returnLibrary: "Back to library",
        select: "Select",
        replace: "Replace",
        requestChange: "Request change",
        requestDeferred: "Request change is deferred until exercise-level request persistence is wired.",
        swapSuccess: "Swap Success",
        requestSuccess: "Request Success",
        startLabel: "Start media",
        endLabel: "End media",
        primary: "Primary",
        secondary: "Secondary",
        lastSession: "Last session",
        progressionTarget: "Progression target",
        setup: "Setup",
        cues: "Coaching cues",
        avoid: "Avoid",
        fullscreenClose: "Close fullscreen",
        noMedia: "No-media fallback"
      },
      es: {
        back: "Atrás",
        detail: "Detalle del ejercicio",
        start: "INICIO",
        end: "FIN",
        technique: "Técnica",
        muscleIntent: "Intención muscular",
        performance: "Rendimiento",
        alternatives: "Alternativas",
        preview: "Vista previa del ejercicio",
        fullscreen: "Media en pantalla completa",
        returnWorkout: "Volver al entrenamiento",
        returnLibrary: "Volver a la biblioteca",
        select: "Seleccionar",
        replace: "Reemplazar",
        requestChange: "Solicitar cambio",
        requestDeferred: "La solicitud de cambio queda diferida hasta que exista persistencia a nivel de ejercicio.",
        swapSuccess: "Cambio realizado",
        requestSuccess: "Solicitud enviada",
        startLabel: "Media inicial",
        endLabel: "Media final",
        primary: "Primario",
        secondary: "Secundario",
        lastSession: "Última sesión",
        progressionTarget: "Objetivo de progresión",
        setup: "Preparación",
        cues: "Claves del coach",
        avoid: "Evitar",
        fullscreenClose: "Cerrar pantalla completa",
        noMedia: "Fallback sin media"
      },
      ca: {
        back: "Enrere",
        detail: "Detall de l'exercici",
        start: "INICI",
        end: "FINAL",
        technique: "Tècnica",
        muscleIntent: "Intenció muscular",
        performance: "Rendiment",
        alternatives: "Alternatives",
        preview: "Previsualitza l'exercici",
        fullscreen: "Media a pantalla completa",
        returnWorkout: "Torna a l'entrenament",
        returnLibrary: "Torna a la biblioteca",
        select: "Selecciona",
        replace: "Substitueix",
        requestChange: "Sol·licita canvi",
        requestDeferred: "La sol·licitud de canvi queda diferida fins que existeixi persistència a nivell d'exercici.",
        swapSuccess: "Canvi fet",
        requestSuccess: "Sol·licitud enviada",
        startLabel: "Media d'inici",
        endLabel: "Media final",
        primary: "Primari",
        secondary: "Secundari",
        lastSession: "Darrera sessió",
        progressionTarget: "Objectiu de progressió",
        setup: "Preparació",
        cues: "Claus del coach",
        avoid: "Evita",
        fullscreenClose: "Tanca pantalla completa",
        noMedia: "Fallback sense media"
      },
      de: {
        back: "Zurück",
        detail: "Übungsdetail",
        start: "START",
        end: "ENDE",
        technique: "Technik",
        muscleIntent: "Muskelintention",
        performance: "Leistung",
        alternatives: "Alternativen",
        preview: "Übung ansehen",
        fullscreen: "Medien im Vollbild",
        returnWorkout: "Zurück zum Training",
        returnLibrary: "Zurück zur Bibliothek",
        select: "Auswählen",
        replace: "Ersetzen",
        requestChange: "Änderung anfragen",
        requestDeferred: "Die Änderungsanfrage ist verschoben, bis die Persistenz auf Übungsebene angebunden ist.",
        swapSuccess: "Wechsel erfolgreich",
        requestSuccess: "Anfrage gesendet",
        startLabel: "Start-Medium",
        endLabel: "End-Medium",
        primary: "Primär",
        secondary: "Sekundär",
        lastSession: "Letzte Einheit",
        progressionTarget: "Progressionsziel",
        setup: "Setup",
        cues: "Coach-Hinweise",
        avoid: "Vermeiden",
        fullscreenClose: "Vollbild schließen",
        noMedia: "Fallback ohne Medium"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      detail: "Exercise Detail",
      start: "START",
      end: "END",
      technique: "Technique",
      muscleIntent: "Muscle Intent",
      performance: "Performance",
      alternatives: "Alternatives",
      preview: "Preview exercise",
      fullscreen: "Fullscreen media",
      returnWorkout: "Return to workout",
      returnLibrary: "Back to library",
      select: "Select",
      replace: "Replace",
      requestChange: "Request change",
      requestDeferred: "Request change is deferred until exercise-level request persistence is wired.",
      swapSuccess: "Swap Success",
      requestSuccess: "Request Success",
      startLabel: "Start media",
      endLabel: "End media",
      primary: "Primary",
      secondary: "Secondary",
      lastSession: "Last session",
      progressionTarget: "Progression target",
      setup: "Setup",
      cues: "Coaching cues",
      avoid: "Avoid",
      fullscreenClose: "Close fullscreen",
      noMedia: "No-media fallback"
    }
  );
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function AlternativeCard({
  alternative,
  definition,
  onSelect,
  selected,
  localeCopy,
  source
}: {
  alternative: ExerciseAlternative;
  definition: ReturnType<typeof getExerciseDefinition>;
  onSelect: () => void;
  selected: boolean;
  localeCopy: ReturnType<typeof copyFor>;
  source: DetailSource;
}) {
  const equipmentLabel = alternative.equipment.toUpperCase();
  return (
    <Card className={`exercise-alt-card ${selected ? "selected" : ""}`.trim()}>
      <div className="row start">
        <div className="exercise-alt-card__thumb">
          <AthlexMedia
            resolution={resolveExerciseThumbnailMedia({
              exerciseKey: definition.id,
              exerciseName: definition.name,
              primaryMuscles: definition.primaryMuscles,
              secondaryMuscles: definition.secondaryMuscles,
              equipment: definition.equipment
            })}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="workout-status-pill workout-status-pill--match">{alternative.label}</div>
          <div className="headline-md" style={{ marginTop: 8, textTransform: "uppercase" }}>
            {definition.name}
          </div>
          <p className="caption" style={{ marginTop: 4 }}>
            {equipmentLabel} · {alternative.summary}
          </p>
        </div>
      </div>
      <div className="exercise-alt-card__meta">
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {localeCopy.lastSession}
          </div>
          <div className="body-md" style={{ fontWeight: 700 }}>
            {alternative.lastPerformance}
          </div>
        </div>
        <button className="button-secondary focus-ring" type="button" onClick={onSelect}>
          {selected ? localeCopy.replace : localeCopy.select}
        </button>
      </div>
      {source === "workout" ? (
        <div className="caption" style={{ marginTop: 10, color: "var(--accent-primary)" }}>
          {localeCopy.preview}
        </div>
      ) : null}
    </Card>
  );
}

export function ExerciseDetailExperience({ exerciseId, backHref, source, detailHref }: ExerciseDetailExperienceProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const motionRootRef = useRef<HTMLElement | null>(null);
  const { session, swapExercise } = useWorkoutStore();
  const copy = copyFor(locale);
  const identityIntent = readIdentityIntent();
  const isCoachManaged = identityIntent === "coach_managed";
  const exercise = getWorkoutExercise(session, exerciseId);
  const definition = getExerciseDefinition(exercise.performedExerciseId);
  const alternatives = useMemo(() => getWorkoutAlternativeCards(definition.id), [definition.id]);
  const [mediaSide, setMediaSide] = useState<MediaSide>("start");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [confirmAlternative, setConfirmAlternative] = useState<ExerciseAlternative | null>(alternatives[0] ?? null);
  const [requestDeferredOpen, setRequestDeferredOpen] = useState(false);
  const [swapSuccessOpen, setSwapSuccessOpen] = useState(false);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(alternatives[0]?.id ?? null);

  useEffect(() => {
    setSelectedAlternativeId(alternatives[0]?.id ?? null);
    setConfirmAlternative(alternatives[0] ?? null);
    setMediaSide("start");
    setFullscreenOpen(false);
    setRequestDeferredOpen(false);
    setSwapSuccessOpen(false);
  }, [exerciseId, alternatives]);

  const selectedAlternative = useMemo(
    () => alternatives.find((alternative) => alternative.id === selectedAlternativeId) ?? alternatives[0] ?? null,
    [alternatives, selectedAlternativeId]
  );

  const mediaContext = useMemo(
    () => ({
      exerciseKey: definition.id,
      exerciseName: definition.name,
      primaryMuscles: definition.primaryMuscles,
      secondaryMuscles: definition.secondaryMuscles,
      equipment: definition.equipment
    }),
    [definition.equipment, definition.id, definition.name, definition.primaryMuscles, definition.secondaryMuscles]
  );

  const startMedia = useMemo(() => resolveExerciseStartMedia(mediaContext), [mediaContext]);
  const endMedia = useMemo(() => resolveExerciseEndMedia(mediaContext), [mediaContext]);
  const fullscreenMedia = useMemo(() => resolveExerciseFullscreenMedia(mediaContext), [mediaContext]);

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root) {
      return;
    }

    if (fullscreenOpen) {
      buildMediaFullscreenTimeline({ root, reducedMotion });
      return;
    }

    buildExerciseDetailOpenTimeline({ root, reducedMotion });
    buildMuscleMapRevealTimeline({ root, reducedMotion });
    buildAlternativesEnterTimeline({ root, reducedMotion });
  }, [fullscreenOpen, reducedMotion]);

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root || reducedMotion) {
      return;
    }

    buildExerciseMediaToggleTimeline({ root, reducedMotion });
  }, [mediaSide, reducedMotion]);

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root || reducedMotion || !selectedAlternative) {
      return;
    }

    buildAlternativePreviewTimeline({ root, reducedMotion });
  }, [reducedMotion, selectedAlternative]);

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root || reducedMotion) {
      return;
    }

    if (requestDeferredOpen) {
      buildCoachRequestTimeline({ root, reducedMotion });
    }
  }, [requestDeferredOpen, reducedMotion]);

  useLayoutEffect(() => {
    const root = motionRootRef.current;
    if (!root || reducedMotion) {
      return;
    }

    if (swapSuccessOpen) {
      buildExerciseSwapTimeline({ root, reducedMotion });
    }
  }, [swapSuccessOpen, reducedMotion]);

  useEffect(() => {
    const nextMedia = mediaSide === "start" ? endMedia : startMedia;
    if (!nextMedia.asset?.src || nextMedia.asset.src === (mediaSide === "start" ? startMedia.asset?.src : endMedia.asset?.src)) {
      return;
    }

    const preload = new window.Image();
    preload.src = nextMedia.asset.src;
  }, [endMedia, mediaSide, startMedia]);

  const primaryMuscles = definition.primaryMuscles.map((muscle) => capitalizeWords(muscle));
  const secondaryMuscles = definition.secondaryMuscles.map((muscle) => capitalizeWords(muscle));
  const returnLabel = source === "workout" ? copy.returnWorkout : copy.returnLibrary;
  const backActionHref = detailHref ?? backHref;

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-section-topbar">
          <button aria-label={copy.back} className="tap-target focus-ring" type="button" onClick={() => router.push(backHref)}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <div className="workout-section-topbar__copy">
            <div className="eyebrow" style={{ margin: 0 }}>
              {copy.detail}
            </div>
            <div className="workout-section-topbar__title">{definition.name}</div>
            <div className="workout-section-topbar__meta">
              <span>{definition.equipment.toUpperCase()}</span>
              <span>·</span>
              <span>{isCoachManaged ? "COACH-MANAGED" : "SELF-MANAGED"}</span>
            </div>
          </div>
          <button aria-label={copy.fullscreen} className="tap-target focus-ring" type="button" onClick={() => setFullscreenOpen(true)}>
            <span className="icon" aria-hidden="true">
              fullscreen
            </span>
          </button>
        </header>
      }
    >
      <main ref={motionRootRef} className="content tight exercise-detail-shell">
        <section className="section" data-workout-motion="exercise-detail-hero">
          <Card className="exercise-detail-hero">
            <div className="exercise-detail-hero__media">
              <AthlexMedia resolution={mediaSide === "start" ? startMedia : endMedia} />
              <div className="exercise-detail-media__fade" />
              <div className="exercise-detail-media__badge">{mediaSide === "start" ? copy.startLabel : copy.endLabel}</div>
            </div>
            <div className="exercise-detail-hero__content">
              <div className="row start">
                <div className="pill" style={{ background: "rgba(182,255,0,0.14)", color: "var(--accent-primary)" }}>
                  {definition.equipment.toUpperCase()}
                </div>
                <div className="caption" style={{ color: "var(--accent-primary)" }}>
                  {copy.preview}
                </div>
              </div>
              <h1 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                {definition.name}
              </h1>
              <p className="body-md" style={{ marginTop: 8, color: "rgba(247,247,247,0.88)" }}>
                {primaryMuscles.join(" · ")} <span style={{ color: "var(--text-secondary)" }}>·</span> {secondaryMuscles.join(" · ")}
              </p>
              <div className="exercise-detail-toggle-row">
                <button className={`progress-choice-chip ${mediaSide === "start" ? "active" : ""}`.trim()} type="button" onClick={() => setMediaSide("start")}>
                  {copy.start}
                </button>
                <button className={`progress-choice-chip ${mediaSide === "end" ? "active" : ""}`.trim()} type="button" onClick={() => setMediaSide("end")}>
                  {copy.end}
                </button>
                <button className="progress-choice-chip" type="button" onClick={() => setFullscreenOpen(true)}>
                  {copy.fullscreen}
                </button>
              </div>
            </div>
          </Card>
        </section>

        <section className="section" data-workout-motion="exercise-detail-technique">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.technique}
          </div>
          <div className="exercise-detail-grid">
            <Card className="exercise-detail-card">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.setup}
              </div>
              <ul className="workout-step-list">
                {definition.setup.map((item, index) => (
                  <li key={item}>
                    <span className="workout-step-list__number">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="exercise-detail-card">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.cues}
              </div>
              <div className="stack" style={{ marginTop: 12 }}>
                {definition.coachCues.map((cue) => (
                  <div key={cue} className="body-md">
                    • {cue}
                  </div>
                ))}
              </div>
              <div className="workout-divider" />
              <div className="eyebrow" style={{ color: "var(--warning)" }}>
                {copy.avoid}
              </div>
              <div className="stack" style={{ marginTop: 12 }}>
                {definition.commonMistakes.map((mistake) => (
                  <div key={mistake} className="body-md">
                    • {mistake}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="section" data-workout-motion="exercise-detail-anatomy">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.muscleIntent}
          </div>
          <Card className="exercise-detail-card">
            <AnatomyPreview focus={definition.primaryMuscles} className="exercise-detail-anatomy" />
            <div className="exercise-detail-intent-grid">
              <div className="exercise-detail-intent-card">
                <div className="eyebrow" style={{ color: "var(--accent-primary)", marginBottom: 6 }}>
                  {copy.primary}
                </div>
                <div className="headline-md" style={{ textTransform: "uppercase" }}>
                  {primaryMuscles.join(" + ")}
                </div>
              </div>
              <div className="exercise-detail-intent-card">
                <div className="eyebrow" style={{ color: "var(--accent-secondary)", marginBottom: 6 }}>
                  {copy.secondary}
                </div>
                <div className="headline-md" style={{ textTransform: "uppercase" }}>
                  {secondaryMuscles.join(" + ")}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="section" data-workout-motion="exercise-detail-performance">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.performance}
          </div>
          <div className="exercise-detail-grid">
            <Card className="exercise-detail-card">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.lastSession}
              </div>
              <div className="headline-md" style={{ marginTop: 8 }}>
                {definition.lastPerformance}
              </div>
              <p className="caption" style={{ marginTop: 8 }}>
                {exercise.lastComparableSession}
              </p>
            </Card>
            <Card className="exercise-detail-card">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.progressionTarget}
              </div>
              <div className="body-md" style={{ marginTop: 8 }}>
                {definition.progressionTarget}
              </div>
              <div className="workout-mini-panel" style={{ marginTop: 12 }}>
                <div className="row">
                  <span className="caption">
                    {definition.programSets} × {definition.programReps}
                  </span>
                  <span className="caption">RIR {definition.programRir}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="section" data-workout-motion="exercise-detail-alternatives">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.alternatives}
          </div>
          <div className="stack">
            {alternatives.map((alternative) => {
              const nextDefinition = getExerciseDefinition(alternative.exerciseId);
              return (
                <AlternativeCard
                  key={alternative.id}
                  alternative={alternative}
                  definition={nextDefinition}
                  onSelect={() => {
                    setConfirmAlternative(alternative);
                    setSelectedAlternativeId(alternative.id);
                  }}
                  selected={alternative.id === selectedAlternativeId}
                  localeCopy={copy}
                  source={source}
                />
              );
            })}
          </div>
        </section>

        <div className="sticky-action exercise-detail-sticky">
          <PrimaryButton
            className="focus-ring"
            href={source === "workout" ? backHref : backHref}
          >
            {returnLabel}
          </PrimaryButton>
          {source === "workout" ? (
            <SecondaryButton className="focus-ring" onClick={() => setFullscreenOpen(true)}>
              {copy.preview}
            </SecondaryButton>
          ) : null}
        </div>

        {confirmAlternative ? (
          <section className="workout-sheet workout-sheet--overlay" aria-label={source === "workout" ? copy.replace : copy.requestChange}>
            <Card className="workout-sheet__card elevated exercise-detail-confirm-sheet" data-workout-motion="exercise-detail-confirm">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {isCoachManaged ? copy.requestChange : copy.replace}
              </div>
              <h2 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                {getExerciseDefinition(confirmAlternative.exerciseId).name}
              </h2>
              <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                {confirmAlternative.summary}
              </p>
              <div className="exercise-detail-confirm-grid" style={{ marginTop: 12 }} data-workout-motion="alternative-preview">
                <Card className="p-16">
                  <div className="caption">Before</div>
                  <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                    {definition.name}
                  </div>
                </Card>
                <Card className="p-16">
                  <div className="caption">After</div>
                  <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                    {getExerciseDefinition(confirmAlternative.exerciseId).name}
                  </div>
                </Card>
              </div>
              {isCoachManaged ? (
                <Card className="p-16 elevated" style={{ background: "var(--background-charcoal)" }}>
                  <div className="progress-chip progress-chip--accent" style={{ display: "inline-flex" }}>
                    DEFERRED
                  </div>
                  <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                    {copy.requestDeferred}
                  </p>
                </Card>
              ) : null}
              <div className="workout-sheet__actions">
                <button className="button-secondary focus-ring" type="button" onClick={() => setConfirmAlternative(null)}>
                  {copy.back}
                </button>
                {isCoachManaged ? (
                  <button className="button-primary focus-ring" type="button" onClick={() => setRequestDeferredOpen(true)}>
                    {copy.requestChange}
                  </button>
                ) : (
                  <button
                    className="button-primary focus-ring"
                    type="button"
                    onClick={async () => {
                      const nextAlternative = confirmAlternative;
                      if (!nextAlternative) {
                        return;
                      }

                      setSwapSuccessOpen(true);
                      await swapExercise(exercise.id, nextAlternative.exerciseId);
                      publishFeedbackSuccess("workout.swap", "Swap Success", "Your workout history stays intact.");
                      router.replace(backActionHref);
                    }}
                  >
                    {copy.replace}
                  </button>
                )}
              </div>
            </Card>
          </section>
        ) : null}

        {requestDeferredOpen ? (
          <section className="workout-sheet workout-sheet--overlay" aria-label={copy.requestSuccess}>
            <Card className="workout-sheet__card elevated exercise-detail-confirm-sheet" data-workout-motion="coach-request-sheet">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.requestSuccess}
              </div>
              <h2 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                {getExerciseDefinition(selectedAlternative?.exerciseId ?? confirmAlternative?.exerciseId ?? definition.id).name}
              </h2>
              <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                {copy.requestDeferred}
              </p>
              <div className="workout-sheet__actions">
                <button className="button-secondary focus-ring" type="button" onClick={() => setRequestDeferredOpen(false)}>
                  {copy.back}
                </button>
                <button
                  className="button-primary focus-ring"
                  type="button"
                  onClick={() => {
                    setRequestDeferredOpen(false);
                    router.replace(backActionHref);
                  }}
                >
                  {copy.returnWorkout}
                </button>
              </div>
            </Card>
          </section>
        ) : null}

        {swapSuccessOpen ? (
          <section className="workout-sheet workout-sheet--overlay" aria-label={copy.swapSuccess}>
            <Card className="workout-sheet__card elevated exercise-detail-confirm-sheet" data-workout-motion="swap-success-sheet">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {copy.swapSuccess}
              </div>
              <h2 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
                {getExerciseDefinition(selectedAlternative?.exerciseId ?? confirmAlternative?.exerciseId ?? definition.id).name}
              </h2>
              <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
                The active workout returns with the new exercise preserved.
              </p>
              <div className="workout-sheet__actions">
                <button className="button-primary focus-ring" type="button" onClick={() => router.replace(backActionHref)}>
                  {copy.returnWorkout}
                </button>
              </div>
            </Card>
          </section>
        ) : null}

        {fullscreenOpen ? (
          <section className="exercise-detail-fullscreen" data-workout-motion="exercise-fullscreen" aria-label={copy.fullscreen}>
            <div className="exercise-detail-fullscreen__topbar">
              <button className="tap-target focus-ring" type="button" onClick={() => setFullscreenOpen(false)} aria-label={copy.fullscreenClose}>
                <span className="icon" aria-hidden="true">
                  close
                </span>
              </button>
              <div className="eyebrow" style={{ margin: 0 }}>
                {copy.fullscreen}
              </div>
              <span className="tap-target" aria-hidden="true" />
            </div>
            <div className="exercise-detail-fullscreen__media">
              <AthlexMedia resolution={fullscreenMedia} />
            </div>
          </section>
        ) : null}
      </main>
    </Screen>
  );
}
