"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { AnatomyPreview } from "@/components/anatomy-preview";
import { useTranslator } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition, type SessionExercise } from "@/lib/workout-data";

function formatBestSet(exercise: SessionExercise) {
  const bestSet = exercise.completedSets
    .slice()
    .sort((left, right) => {
      const leftVolume = left.kilograms * left.reps;
      const rightVolume = right.kilograms * right.reps;
      return rightVolume - leftVolume;
    })[0];

  if (!bestSet) {
    return null;
  }

  const load = bestSet.kilograms > 0 ? `${bestSet.kilograms} kg` : "BW";
  const rir = bestSet.rir != null ? ` · RIR ${bestSet.rir}` : "";
  return `${load} × ${bestSet.reps}${rir}`;
}

export default function WorkoutSummaryPage() {
  const { session } = useWorkoutStore();
  const { locale } = useTranslator();

  const copy = {
    en: {
      complete: "Workout Complete",
      duration: "Duration",
      exercises: "Exercises",
      workingSets: "Working Sets",
      totalVolume: "Total Volume",
      averageRir: "Average RIR",
      insight: "AthlexForce Insight",
      focus: "Workout Focus",
      performance: "Exercise Breakdown",
      nextTime: "Next Time",
      feel: "How did that session feel?",
      newBest: "Top set",
      done: "Done",
      viewProgress: "View Progress",
      sets: "sets"
    },
    es: {
      complete: "Entrenamiento completado",
      duration: "Duración",
      exercises: "Ejercicios",
      workingSets: "Series efectivas",
      totalVolume: "Volumen total",
      averageRir: "RIR medio",
      insight: "Insight de AthlexForce",
      focus: "Enfoque del entrenamiento",
      performance: "Desglose por ejercicio",
      nextTime: "Próxima vez",
      feel: "¿Cómo te sentiste en esa sesión?",
      newBest: "Mejor serie",
      done: "Listo",
      viewProgress: "Ver progreso",
      sets: "series"
    },
    ca: {
      complete: "Entrenament completat",
      duration: "Durada",
      exercises: "Exercicis",
      workingSets: "Sèries de treball",
      totalVolume: "Volum total",
      averageRir: "RIR mitjà",
      insight: "Insight d'AthlexForce",
      focus: "Focus de l'entrenament",
      performance: "Desglossament per exercici",
      nextTime: "La propera vegada",
      feel: "Com t'has sentit en aquesta sessió?",
      newBest: "Millor sèrie",
      done: "Fet",
      viewProgress: "Veure progrés",
      sets: "sèries"
    },
    de: {
      complete: "Training abgeschlossen",
      duration: "Dauer",
      exercises: "Übungen",
      workingSets: "Arbeitssätze",
      totalVolume: "Gesamtvolumen",
      averageRir: "Durchschn. RIR",
      insight: "AthlexForce-Einblick",
      focus: "Trainingsfokus",
      performance: "Übungsübersicht",
      nextTime: "Nächstes Mal",
      feel: "Wie hat sich die Einheit angefühlt?",
      newBest: "Top-Satz",
      done: "Fertig",
      viewProgress: "Fortschritt ansehen",
      sets: "Sätze"
    }
  }[locale as "en" | "es" | "ca" | "de"] ?? {
    complete: "Workout Complete",
    duration: "Duration",
    exercises: "Exercises",
    workingSets: "Working Sets",
    totalVolume: "Total Volume",
    averageRir: "Average RIR",
    insight: "AthlexForce Insight",
    focus: "Workout Focus",
    performance: "Exercise Breakdown",
    nextTime: "Next Time",
    feel: "How did that session feel?",
    newBest: "Top set",
    done: "Done",
    viewProgress: "View Progress",
    sets: "sets"
  };

  const focusExercise = getExerciseDefinition(session.exercises[0].performedExerciseId);
  const breakdown = useMemo(() => {
    return session.exercises.map((exercise) => {
      const definition = getExerciseDefinition(exercise.performedExerciseId);
      return {
        exercise,
        definition,
        bestSet: formatBestSet(exercise)
      };
    });
  }, [session.exercises]);

  const averageRir = session.summary.averageRir ?? null;

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-summary-topbar">
          <span className="eyebrow" style={{ margin: 0 }}>
            AthlexForce
          </span>
        </header>
      }
    >
      <main className="content tight">
        <section className="section workout-summary-hero" data-workout-motion="complete-hero">
          <div className="workout-summary-hero__icon">
            <span className="icon filled" aria-hidden="true">
              check_circle
            </span>
          </div>
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {copy.complete}
          </h1>
          <p className="body-lg" style={{ color: "var(--text-secondary)" }}>
            {session.workoutLabel} · {session.phaseLabel}
          </p>
          <p className="caption" style={{ marginTop: 8 }}>
            {session.dateLabel} · {session.totalExercises} / {session.totalExercises} {copy.exercises.toLowerCase()}
          </p>
        </section>

        <section className="grid-2 section" data-workout-motion="complete-kpis">
          {[
            [copy.duration, session.summary.duration],
            [copy.exercises, session.summary.exercisesCompleted],
            [copy.workingSets, session.summary.setsCompleted],
            [copy.totalVolume, session.summary.totalVolume],
            ...(averageRir ? ([[copy.averageRir, averageRir]] as Array<[string, string]>) : [])
          ].map(([label, value]) => (
            <Card key={label} className="workout-summary-tile">
              <div className="eyebrow" style={{ margin: 0 }}>
                {label}
              </div>
              <div className="headline-md" style={{ marginTop: 8 }}>
                {value}
              </div>
            </Card>
          ))}
        </section>

        <section className="section">
          <Card className="workout-insight-card elevated">
            <div className="row start">
              <span className="icon accent filled" aria-hidden="true">
                tips_and_updates
              </span>
              <div>
                <div className="eyebrow" style={{ color: "#b6ff00" }}>
                  {copy.insight}
                </div>
                <p className="body-md" style={{ color: "var(--text-primary)", marginTop: 6 }}>
                  {session.summary.insight}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.focus}
          </div>
          <Card className="workout-focus-card">
            <AnatomyPreview focus={focusExercise.primaryMuscles} />
          </Card>
        </section>

        <section className="section" data-workout-motion="complete-breakdown">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.performance}
          </div>
          <div className="stack">
            {breakdown.map(({ exercise, definition, bestSet }) => (
              <Card key={exercise.id} className="workout-performance-card">
                <div className="row">
                  <div>
                    <div className="workout-status-pill workout-status-pill--match">{copy.newBest}</div>
                    <div className="headline-md" style={{ marginTop: 10, textTransform: "uppercase" }}>
                      {definition.name}
                    </div>
                  </div>
                  <div className="headline-md" style={{ textAlign: "right" }}>
                    {exercise.completedSets.length} {copy.sets}
                  </div>
                </div>
                <div className="workout-divider" />
                <div className="stack">
                  <div className="caption" style={{ color: "var(--text-primary)" }}>
                    {bestSet ?? session.summary.nextTime[0]?.detail ?? "No completed sets yet"}
                  </div>
                  <div className="caption" style={{ color: "var(--text-secondary)" }}>
                    {exercise.lastComparableSession}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="workout-next-card">
            <div className="eyebrow">{copy.nextTime}</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {session.summary.nextTime.map((item: { label: string; detail: string }) => (
                <div key={item.label} className="workout-next-card__item">
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div className="caption">{item.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.feel}
          </div>
          <div className="workout-chip-row">
            {session.summary.feedback.map((item: "Too Easy" | "Good" | "Challenging") => (
              <button key={item} className={`workout-filter-chip ${item === "Good" ? "active" : ""}`} type="button">
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <div className="stack">
          <Link className="button-primary focus-ring" href="/">
            {copy.done}
          </Link>
          <Link className="workout-secondary-button focus-ring" href="/progress">
            {copy.viewProgress}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
