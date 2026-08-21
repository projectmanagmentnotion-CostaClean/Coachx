"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Workout",
        today: "Today",
        whatChanged: "What changed?",
        continue: "Continue",
        saving: "Saving...",
        use30: "Use 30 Min Version ->",
        chooseAnother: "Choose Another Day",
        selected: "SELECTED",
        options: ["I can't train today", "I need a shorter session", "I want to train later", "I missed this workout", "Other"]
      },
      es: {
        back: "Atrás",
        title: "Ajustar entrenamiento",
        today: "Hoy",
        whatChanged: "¿Qué cambió?",
        continue: "Continuar",
        saving: "Guardando...",
        use30: "Usar versión de 30 min ->",
        chooseAnother: "Elegir otro día",
        selected: "SELECCIONADO",
        options: ["No puedo entrenar hoy", "Necesito una sesión más corta", "Quiero entrenar más tarde", "Me he perdido este entrenamiento", "Otro"]
      },
      ca: {
        back: "Enrere",
        title: "Ajusta l'entrenament",
        today: "Avui",
        whatChanged: "Què ha canviat?",
        continue: "Continua",
        saving: "Desant...",
        use30: "Fes servir la versió de 30 min ->",
        chooseAnother: "Tria un altre dia",
        selected: "SELECCIONAT",
        options: ["No puc entrenar avui", "Necessito una sessió més curta", "Vull entrenar més tard", "M'he perdut aquest entrenament", "Altre"]
      },
      de: {
        back: "Zurück",
        title: "Training anpassen",
        today: "Heute",
        whatChanged: "Was hat sich geändert?",
        continue: "Weiter",
        saving: "Speichern...",
        use30: "30-Minuten-Version verwenden ->",
        chooseAnother: "Anderen Tag wählen",
        selected: "AUSGEWÄHLT",
        options: ["Ich kann heute nicht trainieren", "Ich brauche eine kürzere Einheit", "Ich möchte später trainieren", "Ich habe dieses Training verpasst", "Anderes"]
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Workout",
      today: "Today",
      whatChanged: "What changed?",
      continue: "Continue",
      saving: "Saving...",
      use30: "Use 30 Min Version ->",
      chooseAnother: "Choose Another Day",
      selected: "SELECTED",
      options: ["I can't train today", "I need a shorter session", "I want to train later", "I missed this workout", "Other"]
    }
  );
}

export default function AdjustWorkoutPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const { session, updateSafety } = useWorkoutStore();
  const [selected, setSelected] = useState<string | null>(null);

  const continueHref =
    selected === copy.options[1] || selected === copy.options[0] ? `/workout/${session.id}/adjust/shorter` : `/workout/${session.id}/adjust/reorganize`;

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
          <Card className="workout-adjust-hero">
            <div className="eyebrow" style={{ color: "#b6ff00" }}>
              {copy.today}
            </div>
            <h1 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
              {session.workoutType}
            </h1>
            <div className="body-lg" style={{ marginTop: 8, color: "var(--text-secondary)" }}>
              {session.phaseLabel}
            </div>
            <div className="caption" style={{ marginTop: 12 }}>
              {session.totalExercises} exercises · ~68 min
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {copy.whatChanged}
          </div>
          <div className="stack">
            {copy.options.map((choice) => (
              <button
                key={choice}
                className={`workout-choice-card ${selected === choice ? "selected" : ""}`}
                type="button"
                onClick={() => {
                  setSelected(choice);
                  updateSafety({ action: choice });
                }}
              >
                <span className="body-lg" style={{ textTransform: "uppercase" }}>
                  {choice}
                </span>
                <span className="choice-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <div className="sticky-action">
          <Link className={`button-primary focus-ring ${selected ? "" : "is-disabled"}`.trim()} aria-disabled={!selected} href={continueHref}>
            {copy.continue}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
