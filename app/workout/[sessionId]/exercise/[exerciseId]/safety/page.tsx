"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition, getWorkoutExercise } from "@/lib/workout-data";

const feelings = ["Muscle Burn", "Soreness", "Discomfort", "Pain"] as const;

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        step: "Step 02",
        whatFeelsWrong: "What doesn't feel right?",
        continue: "Continue",
        athlexforce: "AthlexForce",
        muscleBurn: "Muscle Burn",
        soreness: "Soreness",
        discomfort: "Discomfort",
        pain: "Pain"
      },
      es: {
        back: "Atrás",
        step: "Paso 02",
        whatFeelsWrong: "¿Qué no se siente bien?",
        continue: "Continuar",
        athlexforce: "AthlexForce",
        muscleBurn: "Quemazón muscular",
        soreness: "Agujetas",
        discomfort: "Molestia",
        pain: "Dolor"
      },
      ca: {
        back: "Enrere",
        step: "Pas 02",
        whatFeelsWrong: "Què no se sent bé?",
        continue: "Continua",
        athlexforce: "AthlexForce",
        muscleBurn: "Crema muscular",
        soreness: "Agulletes",
        discomfort: "Molèstia",
        pain: "Dolor"
      },
      de: {
        back: "Zurück",
        step: "Schritt 02",
        whatFeelsWrong: "Was fühlt sich nicht richtig an?",
        continue: "Weiter",
        athlexforce: "AthlexForce",
        muscleBurn: "Muskelbrennen",
        soreness: "Muskelkater",
        discomfort: "Unbehagen",
        pain: "Schmerz"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      step: "Step 02",
      whatFeelsWrong: "What doesn't feel right?",
      continue: "Continue",
      athlexforce: "AthlexForce",
      muscleBurn: "Muscle Burn",
      soreness: "Soreness",
      discomfort: "Discomfort",
      pain: "Pain"
    }
  );
}

export default function SafetyAssessmentPage() {
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
            {copy.athlexforce}
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
            <div className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
              {definition.name}
            </div>
            <div className="caption" style={{ marginTop: 6 }}>
              {definition.label}
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="headline-lg">{copy.whatFeelsWrong}</div>
        </section>

        <section className="section">
          <div className="stack">
            {feelings.map((feeling) => (
              <button
                key={feeling}
                className={`workout-choice-card ${session.safety.feeling?.toLowerCase() === feeling.toLowerCase() ? "selected" : ""}`}
                type="button"
                onClick={() => updateSafety({ feeling: feeling.toLowerCase() as typeof session.safety.feeling })}
              >
                <span className="body-lg" style={{ textTransform: "uppercase" }}>
                  {copy[feeling === "Muscle Burn" ? "muscleBurn" : feeling === "Soreness" ? "soreness" : feeling === "Discomfort" ? "discomfort" : "pain"]}
                </span>
                <span className="choice-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <div className="sticky-action">
          <Link className="button-primary focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}/safety/location`}>
            {copy.continue}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
