"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";
import { getExerciseDefinition, getWorkoutExercise } from "@/lib/workout-data";

const locations = ["Neck", "Shoulder", "Upper Back", "Lower Back", "Elbow", "Hip", "Glute", "Knee"] as const;

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Session",
        step02: "Step 02",
        whereFeelIt: "Where do you feel it?",
        step03: "Step 03",
        howIntense: "How intense is it?",
        currentRating: "Current rating:",
        continue: "Continue",
        labels: { neck: "NECK", shoulder: "SHOULDER", upperBack: "UPPER BACK", lowerBack: "LOWER BACK", elbow: "ELBOW", hip: "HIP", glute: "GLUTE", knee: "KNEE" }
      },
      es: {
        back: "Atrás",
        title: "Ajustar sesión",
        step02: "Paso 02",
        whereFeelIt: "¿Dónde lo sientes?",
        step03: "Paso 03",
        howIntense: "¿Qué intensidad tiene?",
        currentRating: "Valoración actual:",
        continue: "Continuar",
        labels: { neck: "CUELLO", shoulder: "HOMBRO", upperBack: "ESPALDA ALTA", lowerBack: "ESPALDA BAJA", elbow: "CODO", hip: "CADERA", glute: "GLÚTEO", knee: "RODILLA" }
      },
      ca: {
        back: "Enrere",
        title: "Ajusta la sessió",
        step02: "Pas 02",
        whereFeelIt: "On ho sents?",
        step03: "Pas 03",
        howIntense: "Quina intensitat té?",
        currentRating: "Valoració actual:",
        continue: "Continua",
        labels: { neck: "COLL", shoulder: "ESPATLLA", upperBack: "ESQUENA ALTA", lowerBack: "ESQUENA BAIXA", elbow: "COLZE", hip: "MALUC", glute: "GLUTI", knee: "GENOLL" }
      },
      de: {
        back: "Zurück",
        title: "Sitzung anpassen",
        step02: "Schritt 02",
        whereFeelIt: "Wo spürst du es?",
        step03: "Schritt 03",
        howIntense: "Wie intensiv ist es?",
        currentRating: "Aktuelle Bewertung:",
        continue: "Weiter",
        labels: { neck: "HALS", shoulder: "SCHULTER", upperBack: "OBERER RÜCKEN", lowerBack: "UNTERER RÜCKEN", elbow: "ELLBOGEN", hip: "HÜFTE", glute: "GESÄSS", knee: "KNIE" }
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Session",
      step02: "Step 02",
      whereFeelIt: "Where do you feel it?",
      step03: "Step 03",
      howIntense: "How intense is it?",
      currentRating: "Current rating:",
      continue: "Continue",
      labels: { neck: "NECK", shoulder: "SHOULDER", upperBack: "UPPER BACK", lowerBack: "LOWER BACK", elbow: "ELBOW", hip: "HIP", glute: "GLUTE", knee: "KNEE" }
    }
  );
}

export default function SafetyLocationPage() {
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
              {copy.step02}
            </div>
            <div className="headline-lg" style={{ marginTop: 8 }}>
              {copy.whereFeelIt}
            </div>
            <div className="caption" style={{ marginTop: 6 }}>
              {definition.name}
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="workout-safety-map">
            <div className="workout-safety-map__figure">
              <span className="workout-safety-map__body" aria-hidden="true" />
              <span className="workout-safety-map__marker" aria-hidden="true" />
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="workout-chip-row">
            {locations.map((location) => (
              <button
                key={location}
                className={`workout-filter-chip ${session.safety.location === location.toLowerCase() ? "active" : ""}`}
                type="button"
                onClick={() => updateSafety({ location: location.toLowerCase() })}
              >
                {copy.labels[location === "Upper Back" ? "upperBack" : location === "Lower Back" ? "lowerBack" : location.toLowerCase() as keyof typeof copy.labels]}
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="workout-detail-card">
            <div className="eyebrow">{copy.step03}</div>
            <div className="headline-md" style={{ marginTop: 6 }}>
              {copy.howIntense}
            </div>
            <div className="caption" style={{ marginTop: 6 }}>
              {copy.currentRating} {session.safety.intensity} / 10
            </div>
          </Card>
        </section>

        <div className="sticky-action">
          <Link className="button-primary focus-ring" href={`/workout/${session.id}/exercise/${exercise.id}/safety/resolution`}>
            {copy.continue}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
