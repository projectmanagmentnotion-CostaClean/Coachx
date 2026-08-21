"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition } from "@/lib/workout-data";

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Workout",
        question: "How much time do you have?",
        version: "AthlexForce 30 Min Version",
        description: "Lower-priority work is removed while the main training objective stays intact.",
        keep: "Keep",
        removeToday: "Remove Today",
        useVersion: "Use 30 Min Version ->",
        reschedule: "Reschedule Full Workout",
        options: ["20 min", "30 min", "45 min"]
      },
      es: {
        back: "Atrás",
        title: "Ajustar entrenamiento",
        question: "¿Cuánto tiempo tienes?",
        version: "Versión de 30 min de AthlexForce",
        description: "Se elimina el trabajo de menor prioridad mientras se mantiene el objetivo principal.",
        keep: "Mantener",
        removeToday: "Eliminar hoy",
        useVersion: "Usar versión de 30 min ->",
        reschedule: "Reprogramar entrenamiento completo",
        options: ["20 min", "30 min", "45 min"]
      },
      ca: {
        back: "Enrere",
        title: "Ajusta l'entrenament",
        question: "Quant de temps tens?",
        version: "Versió de 30 min d'AthlexForce",
        description: "S'elimina el treball de menor prioritat mentre es manté l'objectiu principal.",
        keep: "Mantenir",
        removeToday: "Eliminar avui",
        useVersion: "Fes servir la versió de 30 min ->",
        reschedule: "Reprograma l'entrenament complet",
        options: ["20 min", "30 min", "45 min"]
      },
      de: {
        back: "Zurück",
        title: "Training anpassen",
        question: "Wie viel Zeit hast du?",
        version: "AthlexForce 30-Minuten-Version",
        description: "Weniger wichtige Arbeit wird entfernt, das Hauptziel bleibt erhalten.",
        keep: "Behalten",
        removeToday: "Heute entfernen",
        useVersion: "30-Minuten-Version verwenden ->",
        reschedule: "Gesamtes Training neu planen",
        options: ["20 min", "30 min", "45 min"]
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Workout",
      question: "How much time do you have?",
      version: "AthlexForce 30 Min Version",
      description: "Lower-priority work is removed while the main training objective stays intact.",
      keep: "Keep",
      removeToday: "Remove Today",
      useVersion: "Use 30 Min Version ->",
      reschedule: "Reschedule Full Workout",
      options: ["20 min", "30 min", "45 min"]
    }
  );
}

export default function ShorterSessionPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const { session, selectAdjustmentTime } = useWorkoutStore();
  const leadExercise = getExerciseDefinition(session.exercises[0].prescribedExerciseId);

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-section-topbar">
          <button aria-label={copy.back} className="tap-target focus-ring" type="button" onClick={() => router.back()}>
            <span className="icon" aria-hidden="true">
              close
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
          <div className="headline-lg" style={{ textAlign: "center", textTransform: "uppercase", marginBottom: 20 }}>
            {copy.question}
          </div>
          <div className="grid-3">
            {copy.options.map((minutes) => (
              <button
                key={minutes}
                className={`workout-time-chip ${minutes === copy.options[1] ? "selected" : ""}`}
                type="button"
                onClick={() => selectAdjustmentTime(minutes as "20 min" | "30 min" | "45 min")}
              >
                {minutes.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="workout-adjust-recommendation">
            <div className="eyebrow" style={{ color: "#b6ff00" }}>
              {copy.version}
            </div>
            <p className="body-lg" style={{ marginTop: 12, color: "var(--text-secondary)" }}>
              {copy.description}
            </p>
            <div className="workout-divider" />
            <div className="stack">
              <div className="eyebrow">{copy.keep}</div>
              {[leadExercise.name, "Romanian Deadlift", "Leg Curl", "Hip Abduction"].map((item) => (
                <div key={item} className="row">
                  <span className="icon accent filled" aria-hidden="true">
                    check_circle
                  </span>
                  <span className="body-lg">{item}</span>
                </div>
              ))}
              <div className="eyebrow" style={{ marginTop: 12 }}>
                {copy.removeToday}
              </div>
              {["Bulgarian Split Squat", "Cable Kickback"].map((item) => (
                <div key={item} className="row muted" style={{ textDecoration: "line-through" }}>
                  <span className="icon" aria-hidden="true">
                    do_not_disturb_on
                  </span>
                  <span className="body-lg">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <div className="sticky-action stack">
          <Link className="button-primary focus-ring" href={`/workout/${session.id}/adjust/updated`}>
            {copy.useVersion}
          </Link>
          <Link className="workout-secondary-button focus-ring" href={`/workout/${session.id}/adjust/reorganize`}>
            {copy.reschedule}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
