"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { useWorkoutStore } from "@/components/workout-provider";

function formatMoveDate(dateKey: string | null, locale: string) {
  if (!dateKey) {
    return null;
  }

  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(parsed);
}

function copyFor(locale: string) {
  return (
    {
      en: {
        back: "Back",
        title: "Adjust Session",
        updated: "Schedule Updated",
        moved: "Glutes + Hamstrings moved to",
        updatedPlan: "Updated Plan",
        confirmed: "Scheduled move confirmed",
        nutrition: "Nutrition updated: moved training-day target",
        done: "Done",
        viewCalendar: "View Calendar"
      },
      es: {
        back: "Atrás",
        title: "Ajustar sesión",
        updated: "Horario actualizado",
        moved: "Glúteos + isquios movidos a",
        updatedPlan: "Plan actualizado",
        confirmed: "Movimiento programado confirmado",
        nutrition: "Nutrición actualizada: objetivo del día de entrenamiento movido",
        done: "Hecho",
        viewCalendar: "Ver calendario"
      },
      ca: {
        back: "Enrere",
        title: "Ajusta la sessió",
        updated: "Horari actualitzat",
        moved: "Glutis + isquios moguts a",
        updatedPlan: "Pla actualitzat",
        confirmed: "Moviment programat confirmat",
        nutrition: "Nutrició actualitzada: objectiu del dia d'entrenament mogut",
        done: "Fet",
        viewCalendar: "Veure calendari"
      },
      de: {
        back: "Zurück",
        title: "Sitzung anpassen",
        updated: "Plan aktualisiert",
        moved: "Gesäß + Hamstrings verschoben auf",
        updatedPlan: "Aktualisierter Plan",
        confirmed: "Geplante Verschiebung bestätigt",
        nutrition: "Ernährung aktualisiert: Ziel für Trainingstag verschoben",
        done: "Fertig",
        viewCalendar: "Kalender ansehen"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      back: "Back",
      title: "Adjust Session",
      updated: "Schedule Updated",
      moved: "Glutes + Hamstrings moved to",
      updatedPlan: "Updated Plan",
      confirmed: "Scheduled move confirmed",
      nutrition: "Nutrition updated: moved training-day target",
      done: "Done",
      viewCalendar: "View Calendar"
    }
  );
}

export default function ScheduleUpdatedPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const searchParams = useSearchParams();
  const { session } = useWorkoutStore();
  const movedDate = formatMoveDate(searchParams.get("date"), locale);

  return (
    <Screen
      shellClassName="screen-shell workout-shell"
      topbar={
        <header className="workout-summary-topbar">
          <button aria-label={copy.back} className="tap-target focus-ring" type="button" onClick={() => router.back()}>
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
          <div className="eyebrow" style={{ margin: 0 }}>
            {copy.title}
          </div>
          <span className="tap-target" />
        </header>
      }
    >
      <main className="content tight">
        <section className="section workout-summary-hero">
          <div className="workout-summary-hero__icon">
            <span className="icon filled" aria-hidden="true">
              check_circle
            </span>
          </div>
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {copy.updated}
          </h1>
          <p className="body-lg" style={{ color: "var(--text-secondary)", marginTop: 8 }}>
            {copy.moved} {movedDate ?? copy.confirmed}.
          </p>
        </section>

        <section className="section">
          <Card className="workout-updated-card">
            <div className="eyebrow">{copy.updatedPlan}</div>
            <div className="workout-reorg-grid" style={{ marginTop: 16 }}>
              {[
                ["Sat", "Recov."],
                ["Sun", "Upper"],
                ["Mon", "Recov."],
                ["Tue", "Glutes"]
              ].map(([day, label], index) => (
                <div key={day} className={`workout-day-tile ${index === 3 ? "active" : ""}`}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {day}
                  </div>
                  <div className="caption">{label}</div>
                </div>
              ))}
            </div>
            <div className="workout-divider" />
            <div className="row">
              <div>
                <div className="headline-md">{session.workoutType}</div>
                <div className="caption" style={{ color: "#b6ff00", marginTop: 6 }}>
                  {movedDate ?? copy.confirmed}
                </div>
              </div>
              <span className="icon" aria-hidden="true">
                directions_run
              </span>
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="workout-reorg-logic">
            <div className="row">
              <span className="icon" aria-hidden="true">
                restaurant
              </span>
              <div className="body-lg" style={{ color: "var(--text-secondary)" }}>
                {copy.nutrition}
              </div>
            </div>
          </Card>
        </section>

        <div className="sticky-action stack">
          <Link className="button-primary focus-ring" href={`/workout/${session.id}`}>
            {copy.done}
          </Link>
          <Link className="workout-secondary-button focus-ring" href="/calendar">
            {copy.viewCalendar}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
