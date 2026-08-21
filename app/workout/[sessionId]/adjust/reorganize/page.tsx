"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useProgramStore } from "@/components/program-provider";
import { useWorkoutStore } from "@/components/workout-provider";

function parseWorkoutDate(dateLabel: string) {
  const parsed = new Date(dateLabel);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getNextTuesday(date: Date) {
  const nextDate = new Date(date);
  const targetDay = 2;
  const currentDay = nextDate.getUTCDay();
  let daysUntilTuesday = (targetDay - currentDay + 7) % 7;

  if (daysUntilTuesday === 0) {
    daysUntilTuesday = 7;
  }

  nextDate.setUTCDate(nextDate.getUTCDate() + daysUntilTuesday);
  return nextDate.toISOString().slice(0, 10);
}

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Workout",
        reorg: "Reorganize My Week",
        description: "AthlexForce will find the best way to preserve your training priorities and recovery.",
        before: "Before",
        after: "After",
        logic: "AthlexForce Logic",
        moved: "Moved",
        removed: "Removed",
        freq: "Weekly Freq.",
        recovery: "Recovery",
        save: "Saving...",
        useSchedule: "Use This Schedule ✓",
        chooseOther: "Choose Another Day",
        rowLabels: { glutes: "Glutes", upper: "Upper", recov: "Recov." },
        stats: { moved: "2 sessions", removed: "0 sessions", freq: "4 workouts", recovery: "Maintained" }
      },
      es: {
        back: "Atrás",
        title: "Ajustar entrenamiento",
        reorg: "Reorganizar mi semana",
        description: "AthlexForce encontrará la mejor forma de preservar tus prioridades y recuperación.",
        before: "Antes",
        after: "Después",
        logic: "Lógica de AthlexForce",
        moved: "Movido",
        removed: "Eliminado",
        freq: "Frecuencia semanal",
        recovery: "Recuperación",
        save: "Guardando...",
        useSchedule: "Usar este horario ✓",
        chooseOther: "Elegir otro día",
        rowLabels: { glutes: "Glúteos", upper: "Superior", recov: "Recup." },
        stats: { moved: "2 sesiones", removed: "0 sesiones", freq: "4 entrenamientos", recovery: "Mantenida" }
      },
      ca: {
        back: "Enrere",
        title: "Ajusta l'entrenament",
        reorg: "Reorganitza la meva setmana",
        description: "AthlexForce trobarà la millor manera de preservar les teves prioritats d'entrenament i recuperació.",
        before: "Abans",
        after: "Després",
        logic: "Lògica d'AthlexForce",
        moved: "Mogut",
        removed: "Eliminat",
        freq: "Freq. setmanal",
        recovery: "Recuperació",
        save: "Desant...",
        useSchedule: "Fes servir aquest horari ✓",
        chooseOther: "Tria un altre dia",
        rowLabels: { glutes: "Glutis", upper: "Superior", recov: "Recup." },
        stats: { moved: "2 sessions", removed: "0 sessions", freq: "4 entrenaments", recovery: "Mantinguda" }
      },
      de: {
        back: "Zurück",
        title: "Training anpassen",
        reorg: "Meine Woche neu ordnen",
        description: "AthlexForce findet den besten Weg, Trainingsprioritäten und Erholung zu bewahren.",
        before: "Vorher",
        after: "Nachher",
        logic: "AthlexForce-Logik",
        moved: "Verschoben",
        removed: "Entfernt",
        freq: "Wöchentl. Frequenz",
        recovery: "Erholung",
        save: "Speichern...",
        useSchedule: "Diesen Plan verwenden ✓",
        chooseOther: "Anderen Tag wählen",
        rowLabels: { glutes: "Gluteus", upper: "Oberkörper", recov: "Erhol." },
        stats: { moved: "2 Einheiten", removed: "0 Einheiten", freq: "4 Workouts", recovery: "Erhalten" }
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Workout",
      reorg: "Reorganize My Week",
      description: "AthlexForce will find the best way to preserve your training priorities and recovery.",
      before: "Before",
      after: "After",
      logic: "AthlexForce Logic",
      moved: "Moved",
      removed: "Removed",
      freq: "Weekly Freq.",
      recovery: "Recovery",
      save: "Saving...",
      useSchedule: "Use This Schedule ✓",
      chooseOther: "Choose Another Day",
      rowLabels: { glutes: "Glutes", upper: "Upper", recov: "Recov." },
      stats: { moved: "2 sessions", removed: "0 sessions", freq: "4 workouts", recovery: "Maintained" }
    }
  );
}

export default function ReorganizeWeekPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const { session } = useWorkoutStore();
  const { rescheduleWorkoutDay } = useProgramStore();
  const [saving, setSaving] = useState(false);
  const scheduledWorkoutId = session.scheduledWorkoutId ?? session.id;
  const parsedWorkoutDate = parseWorkoutDate(session.dateLabel);
  const nextDate = getNextTuesday(parsedWorkoutDate ?? new Date());

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
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {copy.reorg}
          </h1>
          <p className="body-lg" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
            {copy.description}
          </p>
        </section>

        <section className="section">
          <Card className="workout-reorg-card">
            <div className="eyebrow">{copy.before}</div>
            <div className="workout-reorg-grid">
              {["Sat", "Sun", "Mon", "Tue"].map((day, index) => (
                <div key={day} className={`workout-day-tile ${index === 0 ? "active" : ""}`}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {day.toUpperCase()}
                  </div>
                  <div className="caption">{index === 0 ? copy.rowLabels.glutes : index % 2 === 0 ? copy.rowLabels.upper : copy.rowLabels.recov}</div>
                </div>
              ))}
            </div>
            <div className="workout-divider" />
            <div className="eyebrow">{copy.after}</div>
            <div className="workout-reorg-grid">
              {["Sat", "Sun", "Mon", "Tue"].map((day, index) => (
                <div key={day} className={`workout-day-tile ${index === 3 ? "active" : ""}`}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {day.toUpperCase()}
                  </div>
                  <div className="caption">{index === 3 ? copy.rowLabels.glutes : index === 1 ? copy.rowLabels.upper : copy.rowLabels.recov}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="workout-reorg-logic">
            <div className="eyebrow" style={{ color: "#b6ff00" }}>
              {copy.logic}
            </div>
            <p className="body-md" style={{ marginTop: 10, color: "var(--text-secondary)" }}>
              {copy.description}
            </p>
          </Card>
        </section>

        <section className="grid-2 section">
          <Card className="workout-stat-card">
            <div className="eyebrow">{copy.moved}</div>
            <div className="headline-md" style={{ marginTop: 8 }}>
              {copy.stats.moved}
            </div>
          </Card>
          <Card className="workout-stat-card">
            <div className="eyebrow">{copy.removed}</div>
            <div className="headline-md" style={{ marginTop: 8 }}>
              {copy.stats.removed}
            </div>
          </Card>
          <Card className="workout-stat-card">
            <div className="eyebrow">{copy.freq}</div>
            <div className="headline-md" style={{ marginTop: 8 }}>
              {copy.stats.freq}
            </div>
          </Card>
          <Card className="workout-stat-card">
            <div className="eyebrow">{copy.recovery}</div>
            <div className="headline-md" style={{ marginTop: 8 }}>
              {copy.stats.recovery}
            </div>
          </Card>
        </section>

        <div className="sticky-action stack">
          <button
            className="button-primary focus-ring"
            disabled={saving}
            type="button"
            onClick={async () => {
              setSaving(true);
              try {
                await rescheduleWorkoutDay(scheduledWorkoutId, nextDate);
                router.push(`/workout/${session.id}/adjust/updated?date=${encodeURIComponent(nextDate)}`);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? copy.save : copy.useSchedule}
          </button>
          <Link className="workout-secondary-button focus-ring" href={`/workout/${session.id}/adjust`}>
            {copy.chooseOther}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
