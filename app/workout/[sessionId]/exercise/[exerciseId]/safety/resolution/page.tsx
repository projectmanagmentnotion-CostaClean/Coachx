"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition, getWorkoutExercise } from "@/lib/workout-data";

const choices = [
  "Continue with less weight",
  "Try a different range",
  "Use an alternative exercise",
  "Stop this exercise",
  "Ask AthlexForce"
] as const;

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Session",
        step: "Step 06 - Session Decision",
        question: "What should happen next?",
        logSummary: "Log summary",
        target: "target",
        continue: "Save & Continue",
        choices: ["Continue with less weight", "Try a different range", "Use an alternative exercise", "Stop this exercise", "Ask AthlexForce"]
      },
      es: {
        back: "Atrás",
        title: "Ajustar sesión",
        step: "Paso 06 - Decisión de la sesión",
        question: "¿Qué debería pasar ahora?",
        logSummary: "Resumen de registro",
        target: "objetivo",
        continue: "Guardar y continuar",
        choices: ["Continuar con menos peso", "Probar un rango diferente", "Usar un ejercicio alternativo", "Detener este ejercicio", "Preguntar a AthlexForce"]
      },
      ca: {
        back: "Enrere",
        title: "Ajusta la sessió",
        step: "Pas 06 - Decisió de la sessió",
        question: "Què hauria de passar ara?",
        logSummary: "Resum de registre",
        target: "objectiu",
        continue: "Desa i continua",
        choices: ["Continua amb menys pes", "Prova un rang diferent", "Fes servir un exercici alternatiu", "Atura aquest exercici", "Pregunta a AthlexForce"]
      },
      de: {
        back: "Zurück",
        title: "Sitzung anpassen",
        step: "Schritt 06 - Sitzungsentscheidung",
        question: "Was soll als Nächstes passieren?",
        logSummary: "Protokollzusammenfassung",
        target: "Ziel",
        continue: "Speichern & Weiter",
        choices: ["Mit weniger Gewicht fortfahren", "Einen anderen Bereich versuchen", "Eine alternative Übung verwenden", "Diese Übung stoppen", "AthlexForce fragen"]
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Session",
      step: "Step 06 - Session Decision",
      question: "What should happen next?",
      logSummary: "Log summary",
      target: "target",
      continue: "Save & Continue",
      choices: ["Continue with less weight", "Try a different range", "Use an alternative exercise", "Stop this exercise", "Ask AthlexForce"]
    }
  );
}

export default function SafetyResolutionPage() {
  const params = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const { session, updateSafety } = useWorkoutStore();
  const exercise = getWorkoutExercise(session, params?.exerciseId ?? session.exercises[0].id);
  const definition = getExerciseDefinition(exercise.performedExerciseId);

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
          <div className="headline-md" style={{ fontSize: 20, textTransform: "uppercase" }}>
            {copy.title}
          </div>
          <span className="tap-target" />
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <Card className="workout-safety-exercise-card">
            <div className="eyebrow" style={{ color: "#b6ff00" }}>
              {copy.step}
            </div>
            <div className="headline-lg" style={{ marginTop: 8 }}>
              {copy.question}
            </div>
            <div className="caption" style={{ marginTop: 6 }}>
              {definition.name} · {definition.label}
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="stack">
            {choices.map((choice) => (
              <button
                key={choice}
                className={`workout-choice-card ${session.safety.action === choice ? "selected" : ""}`}
                type="button"
                onClick={() => updateSafety({ action: choice })}
              >
                <span className="body-lg" style={{ textTransform: "uppercase" }}>
                  {copy.choices[choices.indexOf(choice)]}
                </span>
                <span className="choice-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="workout-detail-card">
            <div className="eyebrow">{copy.logSummary}</div>
            <div className="caption" style={{ marginTop: 8 }}>
              Set {exercise.completedSets.length + 1} / {exercise.totalSets} · {definition.programReps} {copy.target}
            </div>
          </Card>
        </section>

        <div className="sticky-action">
          <Link className="button-primary focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}`}>
            {copy.continue}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
