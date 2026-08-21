"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AthlexMedia } from "@/components/athlex-media";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition, getWorkoutAlternativeCards, getWorkoutExercise } from "@/lib/workout-data";
import { resolveExerciseThumbnailMedia } from "@/lib/media";

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        chooseAlternative: "Choose Alternative",
        replacing: "Replacing",
        current: "Current",
        equipment: "Equipment:",
        prescription: "Prescription:",
        bestMatches: "Best Matches",
        match: "MATCH",
        last: "Last:",
        useThisExercise: "Use This Exercise",
        search: "Search",
        filters: ["All", "Machine", "Dumbbells", "Barbell", "Smith", "Cable"],
        summary: "Glute-focused hip extension. Alternatives preserve primary training objective."
      },
      es: {
        back: "Atrás",
        chooseAlternative: "Elegir alternativa",
        replacing: "Reemplazando",
        current: "Actual",
        equipment: "Equipo:",
        prescription: "Prescripción:",
        bestMatches: "Mejores opciones",
        match: "COINCIDE",
        last: "Último:",
        useThisExercise: "Usar este ejercicio",
        search: "Buscar",
        filters: ["Todo", "Máquina", "Mancuernas", "Barra", "Smith", "Polea"],
        summary: "Extensión de cadera enfocada en glúteos. Las alternativas mantienen el objetivo principal."
      },
      ca: {
        back: "Enrere",
        chooseAlternative: "Tria una alternativa",
        replacing: "Substituint",
        current: "Actual",
        equipment: "Equip:",
        prescription: "Prescripció:",
        bestMatches: "Millors opcions",
        match: "COINCIDEIX",
        last: "Últim:",
        useThisExercise: "Fes servir aquest exercici",
        search: "Cerca",
        filters: ["Tots", "Màquina", "Mancuernes", "Barra", "Smith", "Cable"],
        summary: "Extensió de maluc enfocada a glutis. Les alternatives preserven l'objectiu principal."
      },
      de: {
        back: "Zurück",
        chooseAlternative: "Alternative wählen",
        replacing: "Ersetzt",
        current: "Aktuell",
        equipment: "Ausrüstung:",
        prescription: "Vorgabe:",
        bestMatches: "Beste Treffer",
        match: "PASSEND",
        last: "Zuletzt:",
        useThisExercise: "Diese Übung verwenden",
        search: "Suche",
        filters: ["Alle", "Maschine", "Kurzhanteln", "Langhantel", "Smith", "Kabelzug"],
        summary: "Glute-fokussierte Hüftstreckung. Alternativen behalten das Hauptziel bei."
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      chooseAlternative: "Choose Alternative",
      replacing: "Replacing",
      current: "Current",
      equipment: "Equipment:",
      prescription: "Prescription:",
      bestMatches: "Best Matches",
      match: "MATCH",
      last: "Last:",
      useThisExercise: "Use This Exercise",
      search: "Search",
      filters: ["All", "Machine", "Dumbbells", "Barbell", "Smith", "Cable"],
      summary: "Glute-focused hip extension. Alternatives preserve primary training objective."
    }
  );
}

export default function ExerciseAlternativesPage() {
  const params = useParams<{ sessionId: string; exerciseId: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const exerciseId = params?.exerciseId ?? "hip-thrust";
  const { session, swapExercise } = useWorkoutStore();
  const exercise = getWorkoutExercise(session, exerciseId);
  const currentDefinition = getExerciseDefinition(exercise.prescribedExerciseId);
  const performedDefinition = getExerciseDefinition(exercise.performedExerciseId);
  const alternatives = getWorkoutAlternativeCards(currentDefinition.id);

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-section-topbar">
          <button aria-label={copy.back} className="tap-target focus-ring" type="button" onClick={() => router.back()}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <div className="workout-section-topbar__copy">
            <div className="headline-md" style={{ fontSize: 20, textTransform: "uppercase" }}>
              {copy.chooseAlternative}
            </div>
            <div className="caption">
              {copy.replacing} {currentDefinition.name}
            </div>
          </div>
          <button aria-label={copy.search} className="tap-target focus-ring" type="button">
            <span className="icon" aria-hidden="true">
              search
            </span>
          </button>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <Card className="workout-alternative-current">
            <div className="row start">
              <div className="workout-alternative-current__thumb">
                <AthlexMedia
                  resolution={resolveExerciseThumbnailMedia({
                    exerciseKey: performedDefinition.id,
                    exerciseName: performedDefinition.name,
                    primaryMuscles: performedDefinition.primaryMuscles,
                    secondaryMuscles: performedDefinition.secondaryMuscles,
                    equipment: performedDefinition.equipment
                  })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="workout-status-pill">{copy.current}</div>
                <h1 className="headline-md" style={{ marginTop: 8, textTransform: "uppercase" }}>
                  {performedDefinition.name}
                </h1>
                <div className="caption" style={{ marginTop: 4 }}>
                  {copy.equipment} {performedDefinition.equipment.toUpperCase()}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>
                  {performedDefinition.summary}
                </div>
              </div>
            </div>
            <div className="workout-mini-panel" style={{ marginTop: 12 }}>
              <div className="row">
                <span className="caption">{copy.prescription}</span>
                <span className="body-md" style={{ fontWeight: 700 }}>
                  {currentDefinition.programSets} x {currentDefinition.programReps} <span className="caption">| RIR {currentDefinition.programRir}</span>
                </span>
              </div>
            </div>
          </Card>
        </section>

        <section className="section workout-filter-scroll">
          {copy.filters.map((chip, index) => (
            <button key={chip} className={`workout-filter-chip ${index === 0 ? "active" : ""}`} type="button">
              {chip}
            </button>
          ))}
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {copy.bestMatches}
          </div>
          <div className="caption" style={{ fontStyle: "italic", marginBottom: 12 }}>
            {copy.summary}
          </div>

          <div className="stack">
            {alternatives.map((alternative) => {
              const definition = getExerciseDefinition(alternative.exerciseId);
              return (
                <Card key={alternative.id} className="workout-alternative-card">
                  <div className="workout-status-pill workout-status-pill--match">
                    {alternative.label} {copy.match}
                  </div>
                  <h2 className="headline-md" style={{ marginTop: 12, textTransform: "uppercase" }}>
                    {definition.name}
                  </h2>
                  <div className="caption" style={{ marginTop: 4 }}>
                    {copy.equipment} {alternative.equipment.toUpperCase()}
                  </div>
                  <p className="body-md" style={{ marginTop: 12, color: "var(--text-secondary)" }}>
                    {alternative.summary}
                  </p>
                  <div className="workout-mini-panel" style={{ marginTop: 14 }}>
                    <div className="row">
                      <span className="caption">{copy.last}</span>
                      <span className="body-md" style={{ fontWeight: 700 }}>
                        {alternative.lastPerformance}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={saving}
                    className="workout-secondary-button focus-ring"
                    type="button"
                    onClick={async () => {
                      if (saving) {
                        return;
                      }

                      setSaving(true);
                      try {
                        await swapExercise(exercise.id, alternative.exerciseId);
                        router.push(`/workout/${session.id}/exercise/${exercise.id}`);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    <span className="icon" aria-hidden="true">
                      swap_horiz
                    </span>
                    {copy.useThisExercise}
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </Screen>
  );
}
