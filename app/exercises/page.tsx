"use client";

import Link from "next/link";
import { Screen } from "@/components/screen";
import { useLocale } from "@/components/locale-provider";
import { coachxExerciseCatalog } from "@/lib/workout-data";
import { AthlexMedia } from "@/components/athlex-media";
import { resolveExerciseThumbnailMedia } from "@/lib/media";

const libraryIds = ["barbell-hip-thrust", "romanian-deadlift", "bulgarian-split-squat", "lat-pulldown", "chest-press"];

export default function ExerciseLibraryPage() {
  const { locale } = useLocale();
  const exercises = libraryIds.map((id) => coachxExerciseCatalog.find((exercise) => exercise.id === id) ?? coachxExerciseCatalog[0]);

  const copy = {
    en: {
      title: "Exercise Library",
      subtitle: "Your movement reference",
      search: "Search exercises...",
      browse: "Browse by muscle",
      viewMap: "View Map",
      targeted: "Targeted",
      filter: "Select a zone to filter",
      filters: ["All", "Glutes", "Hamstrings", "Quads", "Back"],
      openProfile: "Open profile"
    },
    es: {
      title: "Biblioteca de ejercicios",
      subtitle: "Tu referencia de movimiento",
      search: "Buscar ejercicios...",
      browse: "Explorar por músculo",
      viewMap: "Ver mapa",
      targeted: "Objetivo",
      filter: "Selecciona una zona para filtrar",
      filters: ["Todo", "Glúteos", "Isquios", "Cuádriceps", "Espalda"],
      openProfile: "Abrir perfil"
    },
    ca: {
      title: "Biblioteca d'exercicis",
      subtitle: "La teva referència de moviment",
      search: "Cerca exercicis...",
      browse: "Explora per múscul",
      viewMap: "Veure mapa",
      targeted: "Objectiu",
      filter: "Selecciona una zona per filtrar",
      filters: ["Tot", "Glutis", "Isquiotibials", "Quàdriceps", "Esquena"],
      openProfile: "Obre el perfil"
    },
    de: {
      title: "Übungsbibliothek",
      subtitle: "Deine Bewegungsreferenz",
      search: "Übungen suchen...",
      browse: "Nach Muskelbereich",
      viewMap: "Karte anzeigen",
      targeted: "Gezielt",
      filter: "Wähle einen Bereich zum Filtern",
      filters: ["Alle", "Gesäß", "Hamstrings", "Quadrizeps", "Rücken"],
      openProfile: "Profil öffnen"
    }
  }[locale as "en" | "es" | "ca" | "de"] ?? {
    title: "Exercise Library",
    subtitle: "Your movement reference",
    search: "Search exercises...",
    browse: "Browse by muscle",
    viewMap: "View Map",
    targeted: "Targeted",
    filter: "Select a zone to filter",
    filters: ["All", "Glutes", "Hamstrings", "Quads", "Back"],
    openProfile: "Open profile"
  };

  return (
    <Screen
      activeTab="progress"
      shellClassName="screen-shell library-shell"
      topbar={
        <header className="library-topbar">
          <div className="library-topbar__avatar">
            <img src="/coachx-avatar.svg" alt="Athlete profile" width={36} height={36} />
          </div>
          <div className="headline-md" style={{ textTransform: "uppercase", fontSize: 32, lineHeight: "38px" }}>
            {copy.title}
          </div>
          <Link aria-label={copy.openProfile} className="tap-target focus-ring" href="/profile" style={{ color: "#c6c6c7" }}>
            <span className="icon" aria-hidden="true">
              person
            </span>
          </Link>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="headline-md" style={{ color: "#c9cfb4", fontSize: 18, lineHeight: "26px", fontWeight: 500 }}>
            {copy.subtitle}
          </div>
        </section>

        <section className="section">
          <div className="library-search">
            <span className="icon muted" aria-hidden="true">
              search
            </span>
            <span className="caption" style={{ fontSize: 18, color: "#999" }}>
              {copy.search}
            </span>
          </div>
        </section>

        <section className="section">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 className="headline-md">{copy.browse}</h2>
            <span className="accent" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
              {copy.viewMap}
            </span>
          </div>
          <div className="library-target-card">
            <div>
              <div className="headline-md" style={{ color: "#b6ff00" }}>
                {copy.targeted}
              </div>
              <p className="body-md" style={{ marginTop: 6, color: "var(--text-secondary)" }}>
                {copy.filter}
              </p>
            </div>
          </div>
        </section>

        <section className="section workout-filter-scroll">
          {copy.filters.map((chip, index) => (
            <button key={chip} className={`workout-filter-chip ${index === 0 ? "active" : ""}`} type="button">
              {chip.toUpperCase()}
            </button>
          ))}
        </section>

        <section className="stack-lg">
          {exercises.map((exercise) => (
            <Link key={exercise.id} href={`/exercises/${exercise.id}`} className="library-item focus-ring">
              <div className="library-item__thumb">
                <AthlexMedia
                  resolution={resolveExerciseThumbnailMedia({
                    exerciseKey: exercise.id,
                    exerciseName: exercise.name,
                    primaryMuscles: exercise.primaryMuscles,
                    secondaryMuscles: exercise.secondaryMuscles,
                    equipment: exercise.equipment
                  })}
                />
              </div>
              <div className="library-item__body">
                <div className="headline-md" style={{ fontSize: 24, lineHeight: "28px" }}>
                  {exercise.name}
                </div>
                <div className="caption" style={{ marginTop: 6 }}>
                  <span className="accent">•</span> {exercise.primaryMuscles.map((muscle) => muscle.charAt(0).toUpperCase() + muscle.slice(1)).join(" + ")}
                </div>
                <div className="pill" style={{ minHeight: 24, marginTop: 10, padding: "0 10px", background: "rgba(37,37,37,0.95)" }}>
                  {exercise.equipment.toUpperCase()}
                </div>
              </div>
              <span className="icon muted" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          ))}
        </section>
      </main>
    </Screen>
  );
}
