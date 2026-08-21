import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n";
import { createProgressDemoState } from "@/lib/progress-data";
import { buildProgressStateFromPersistedSnapshot, type ProgressPersistedSnapshot } from "@/lib/progress-service";
import type { ProgressState } from "@/lib/progress-data";
import { buildEmptyMotivationalImmersion, buildMotivationalImmersion, type MotivationalImmersionState } from "@/lib/motivational-immersion";
import { getProgramDaySummary, loadProgramBundle } from "@/lib/program-service";
import { deriveWeeklyCheckinReviewSummary, computeSignalFromScoredQuestions, resolveWeeklyCheckinWindow } from "@/lib/checkin-data";
import { loadAthleteSnapshot } from "@/lib/athlete-service";
import type {
  Database,
  NutritionDaySelectionsRow,
  NutritionDaysRow,
  NutritionHydrationLogsRow,
  NutritionSupplementLogsRow,
  ProgressEntriesRow,
  ProgressMeasurementsRow,
  ProgressPhotosRow,
  ScheduledWorkoutsRow,
  WeeklyCheckinResponsesRow,
  WeeklyCheckinReviewsRow,
  WeeklyCheckinsRow,
  WorkoutSessionExercisesRow,
  WorkoutSessionsRow,
  WorkoutSetsRow
} from "@/lib/supabase/database.types";

export const performanceAnalyticsRanges = ["4w", "8w", "12w", "all"] as const;
export type PerformanceAnalyticsRangeId = (typeof performanceAnalyticsRanges)[number];

export interface PerformanceAnalyticsRange {
  id: PerformanceAnalyticsRangeId;
  label: string;
  days: number;
  startDateKey: string | null;
  endDateKey: string;
}

export interface PerformanceAnalyticsPoint {
  label: string;
  value: number;
  display: string;
  dateKey: string;
}

export interface PerformanceAnalyticsSeries {
  id: string;
  label: string;
  unit: string;
  accent: string;
  points: PerformanceAnalyticsPoint[];
}

export interface PerformanceAnalyticsMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: "accent" | "positive" | "warning" | "neutral";
}

export interface PerformanceAnalyticsCopy {
  title: string;
  subtitle: string;
  rangeLabel: string;
  rangeOptions: Record<PerformanceAnalyticsRangeId, string>;
  heroLabel: string;
  heroSummary: string;
  heroStatusOnTrack: string;
  heroStatusBuilding: string;
  heroStatusAttention: string;
  heroStatusLimited: string;
  bodySection: string;
  trainingSection: string;
  nutritionSection: string;
  recoverySection: string;
  checkInSection: string;
  insightsSection: string;
  coverageSection: string;
  nextFocusSection: string;
  chartTapHint: string;
  emptyTitle: string;
  emptyCopy: string;
  limitedHistory: string;
  noCheckIn: string;
  recentSessions: string;
  latestEntries: string;
  currentPhase: string;
  currentGoal: string;
  currentWorkout: string;
  currentDay: string;
  totalVolume: string;
  sessionCount: string;
  avgDuration: string;
  trainingAdherence: string;
  nutritionAdherence: string;
  hydration: string;
  weight: string;
  waist: string;
  recovery: string;
  checkIn: string;
  dataCoverage: string;
  dataPoints: string;
  nextFocusConsistency: string;
  nextFocusHydration: string;
  nextFocusRecovery: string;
  nextFocusNutrition: string;
  nextFocusLimited: string;
}

export interface PerformanceAnalyticsChart {
  id: string;
  title: string;
  subtitle: string;
  unit: string;
  series: PerformanceAnalyticsSeries[];
  pointsLabel: string;
  emptyTitle: string;
  emptyCopy: string;
}

export interface PerformanceAnalyticsDashboard {
  copy: PerformanceAnalyticsCopy;
  locale: Locale;
  range: PerformanceAnalyticsRange;
  generatedAt: string;
  athleteName: string;
  phaseLabel: string;
  goal: string;
  currentWorkout: string;
  currentDay: string;
  status: "on-track" | "building" | "attention" | "limited";
  statusLabel: string;
  summary: string;
  nextFocus: string;
  recentCheckInLabel: string;
  recentCheckInSummary: string;
  recentCheckInSignals: string[];
  metrics: PerformanceAnalyticsMetric[];
  charts: {
    training: PerformanceAnalyticsChart;
    weight: PerformanceAnalyticsChart;
    waist: PerformanceAnalyticsChart;
    nutrition: PerformanceAnalyticsChart;
    recovery: PerformanceAnalyticsChart;
  };
  dataCoverage: {
    workouts: number;
    nutritionDays: number;
    progressEntries: number;
    checkIns: number;
  };
  recentSessions: Array<{ label: string; detail: string }>;
  latestProgressSummary: string;
  latestNutritionSummary: string;
  immersion: MotivationalImmersionState;
}

const localeDateOptions = {
  month: "short",
  day: "numeric",
  timeZone: "UTC"
} as const;

const ANNUAL_BOUNDARY_DAYS = 365;

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatNumber(locale: Locale, value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

function formatDateLabel(dateKey: string, locale: Locale) {
  return formatDate(new Date(`${dateKey}T00:00:00.000Z`), { ...localeDateOptions, locale });
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function getRangeLabel(locale: Locale, rangeId: PerformanceAnalyticsRangeId) {
  const labels: Record<Locale, Record<PerformanceAnalyticsRangeId, string>> = {
    en: { "4w": "4 weeks", "8w": "8 weeks", "12w": "12 weeks", all: "All history" },
    es: { "4w": "4 semanas", "8w": "8 semanas", "12w": "12 semanas", all: "Todo" },
    ca: { "4w": "4 setmanes", "8w": "8 setmanes", "12w": "12 setmanes", all: "Tot" },
    de: { "4w": "4 Wochen", "8w": "8 Wochen", "12w": "12 Wochen", all: "Alles" }
  };

  return labels[locale][rangeId];
}

function getCopy(locale: Locale): PerformanceAnalyticsCopy {
  const copy: Record<Locale, PerformanceAnalyticsCopy> = {
    en: {
      title: "Performance analytics",
      subtitle: "Real training, progress, nutrition, and recovery data. No synthetic fitness score.",
      rangeLabel: "Window",
      rangeOptions: { "4w": "4 weeks", "8w": "8 weeks", "12w": "12 weeks", all: "All history" },
      heroLabel: "Athlete context",
      heroSummary: "Bounded windows only. Real persisted rows only.",
      heroStatusOnTrack: "On track",
      heroStatusBuilding: "Building",
      heroStatusAttention: "Needs attention",
      heroStatusLimited: "Limited data",
      bodySection: "Body composition",
      trainingSection: "Training load",
      nutritionSection: "Nutrition adherence",
      recoverySection: "Recovery",
      checkInSection: "Weekly check-in",
      insightsSection: "Insights",
      coverageSection: "Data coverage",
      nextFocusSection: "Next focus",
      chartTapHint: "Tap a point to inspect the latest value.",
      emptyTitle: "No persisted analytics yet",
      emptyCopy: "Finish a few workouts, measurements, and check-ins to populate this view.",
      limitedHistory: "History is still short. Keep logging real data to unlock stronger trends.",
      noCheckIn: "No submitted weekly check-in is available yet.",
      recentSessions: "Recent sessions",
      latestEntries: "Latest entries",
      currentPhase: "Current phase",
      currentGoal: "Goal",
      currentWorkout: "Workout",
      currentDay: "Day",
      totalVolume: "Total volume",
      sessionCount: "Sessions",
      avgDuration: "Avg. duration",
      trainingAdherence: "Training adherence",
      nutritionAdherence: "Nutrition adherence",
      hydration: "Hydration",
      weight: "Weight",
      waist: "Waist",
      recovery: "Recovery",
      checkIn: "Check-in",
      dataCoverage: "Rows loaded",
      dataPoints: "points",
      nextFocusConsistency: "Keep planned training days consistent and let the trend build.",
      nextFocusHydration: "Raise hydration on training days.",
      nextFocusRecovery: "Protect sleep and recovery on the heaviest weeks.",
      nextFocusNutrition: "Improve meal completion and hydration before adding more volume.",
      nextFocusLimited: "Add more persisted sessions and measurements to unlock the full view."
    },
    es: {
      title: "Analítica de rendimiento",
      subtitle: "Datos reales de entrenamiento, progreso, nutrición y recuperación. Sin puntuación artificial.",
      rangeLabel: "Ventana",
      rangeOptions: { "4w": "4 semanas", "8w": "8 semanas", "12w": "12 semanas", all: "Todo el historial" },
      heroLabel: "Contexto del atleta",
      heroSummary: "Solo ventanas acotadas. Solo filas persistidas reales.",
      heroStatusOnTrack: "En curso",
      heroStatusBuilding: "Construyendo",
      heroStatusAttention: "Requiere atención",
      heroStatusLimited: "Datos limitados",
      bodySection: "Composición corporal",
      trainingSection: "Carga de entrenamiento",
      nutritionSection: "Adherencia nutricional",
      recoverySection: "Recuperación",
      checkInSection: "Check-in semanal",
      insightsSection: "Insights",
      coverageSection: "Cobertura de datos",
      nextFocusSection: "Siguiente foco",
      chartTapHint: "Toca un punto para inspeccionar el valor más reciente.",
      emptyTitle: "Aún no hay analítica persistida",
      emptyCopy: "Completa algunos entrenamientos, mediciones y check-ins para llenar esta vista.",
      limitedHistory: "El historial sigue siendo corto. Sigue registrando datos reales para desbloquear tendencias más sólidas.",
      noCheckIn: "Todavía no hay un check-in semanal enviado.",
      recentSessions: "Sesiones recientes",
      latestEntries: "Últimas entradas",
      currentPhase: "Fase actual",
      currentGoal: "Objetivo",
      currentWorkout: "Entrenamiento",
      currentDay: "Día",
      totalVolume: "Volumen total",
      sessionCount: "Sesiones",
      avgDuration: "Duración media",
      trainingAdherence: "Adherencia al entrenamiento",
      nutritionAdherence: "Adherencia nutricional",
      hydration: "Hidratación",
      weight: "Peso",
      waist: "Cintura",
      recovery: "Recuperación",
      checkIn: "Check-in",
      dataCoverage: "Filas cargadas",
      dataPoints: "puntos",
      nextFocusConsistency: "Mantén constantes los días de entrenamiento planificados y deja que la tendencia crezca.",
      nextFocusHydration: "Sube la hidratación en los días de entrenamiento.",
      nextFocusRecovery: "Protege el sueño y la recuperación en las semanas más duras.",
      nextFocusNutrition: "Mejora el cierre de comidas y la hidratación antes de subir más volumen.",
      nextFocusLimited: "Añade más sesiones y mediciones persistidas para desbloquear la vista completa."
    },
    ca: {
      title: "Analítica de rendiment",
      subtitle: "Dades reals d'entrenament, progrés, nutrició i recuperació. Sense puntuacions artificials.",
      rangeLabel: "Finestra",
      rangeOptions: { "4w": "4 setmanes", "8w": "8 setmanes", "12w": "12 setmanes", all: "Tot l'historial" },
      heroLabel: "Context de l'atleta",
      heroSummary: "Només finestres acotades. Només files persistides reals.",
      heroStatusOnTrack: "En marxa",
      heroStatusBuilding: "Construint",
      heroStatusAttention: "Cal atenció",
      heroStatusLimited: "Dades limitades",
      bodySection: "Composició corporal",
      trainingSection: "Càrrega d'entrenament",
      nutritionSection: "Adherència nutricional",
      recoverySection: "Recuperació",
      checkInSection: "Check-in setmanal",
      insightsSection: "Insights",
      coverageSection: "Cobertura de dades",
      nextFocusSection: "Següent focus",
      chartTapHint: "Toca un punt per inspeccionar l'últim valor.",
      emptyTitle: "Encara no hi ha analítica persistida",
      emptyCopy: "Completa alguns entrenaments, mesures i check-ins per omplir aquesta vista.",
      limitedHistory: "L'historial encara és curt. Segueix registrant dades reals per desbloquejar tendències més sòlides.",
      noCheckIn: "Encara no hi ha cap check-in setmanal enviat.",
      recentSessions: "Sessions recents",
      latestEntries: "Últimes entrades",
      currentPhase: "Fase actual",
      currentGoal: "Objectiu",
      currentWorkout: "Entrenament",
      currentDay: "Dia",
      totalVolume: "Volum total",
      sessionCount: "Sessions",
      avgDuration: "Durada mitjana",
      trainingAdherence: "Adherència a l'entrenament",
      nutritionAdherence: "Adherència nutricional",
      hydration: "Hidratació",
      weight: "Pes",
      waist: "Cintura",
      recovery: "Recuperació",
      checkIn: "Check-in",
      dataCoverage: "Files carregades",
      dataPoints: "punts",
      nextFocusConsistency: "Mantén constants els dies d'entrenament planificats i deixa créixer la tendència.",
      nextFocusHydration: "Puja la hidratació en els dies d'entrenament.",
      nextFocusRecovery: "Protegeix el son i la recuperació en les setmanes més dures.",
      nextFocusNutrition: "Millora el tancament dels àpats i la hidratació abans d'afegir més volum.",
      nextFocusLimited: "Afegeix més sessions i mesures persistides per desbloquejar la vista completa."
    },
    de: {
      title: "Leistungsanalyse",
      subtitle: "Echte Daten zu Training, Fortschritt, Ernährung und Regeneration. Keine künstliche Fitnessbewertung.",
      rangeLabel: "Zeitraum",
      rangeOptions: { "4w": "4 Wochen", "8w": "8 Wochen", "12w": "12 Wochen", all: "Gesamter Verlauf" },
      heroLabel: "Athletenkontext",
      heroSummary: "Nur begrenzte Zeitfenster. Nur echte persistierte Zeilen.",
      heroStatusOnTrack: "Auf Kurs",
      heroStatusBuilding: "Aufbau",
      heroStatusAttention: "Achtung nötig",
      heroStatusLimited: "Wenige Daten",
      bodySection: "Körperzusammensetzung",
      trainingSection: "Trainingsbelastung",
      nutritionSection: "Ernährungs-Compliance",
      recoverySection: "Regeneration",
      checkInSection: "Wöchentlicher Check-in",
      insightsSection: "Einblicke",
      coverageSection: "Datenabdeckung",
      nextFocusSection: "Nächster Fokus",
      chartTapHint: "Tippe auf einen Punkt, um den letzten Wert zu prüfen.",
      emptyTitle: "Noch keine persistierten Analysedaten",
      emptyCopy: "Schließe einige Workouts, Messungen und Check-ins ab, um diese Ansicht zu füllen.",
      limitedHistory: "Der Verlauf ist noch kurz. Sammle weiter echte Daten, um stärkere Trends zu sehen.",
      noCheckIn: "Noch kein wöchentlicher Check-in vorhanden.",
      recentSessions: "Aktuelle Sessions",
      latestEntries: "Neueste Einträge",
      currentPhase: "Aktuelle Phase",
      currentGoal: "Ziel",
      currentWorkout: "Training",
      currentDay: "Tag",
      totalVolume: "Gesamtvolumen",
      sessionCount: "Sessions",
      avgDuration: "Ø Dauer",
      trainingAdherence: "Trainings-Compliance",
      nutritionAdherence: "Ernährungs-Compliance",
      hydration: "Hydration",
      weight: "Gewicht",
      waist: "Taille",
      recovery: "Regeneration",
      checkIn: "Check-in",
      dataCoverage: "Geladene Zeilen",
      dataPoints: "Punkte",
      nextFocusConsistency: "Halte die geplanten Trainingstage konstant und lass den Trend wachsen.",
      nextFocusHydration: "Erhöhe die Hydration an Trainingstagen.",
      nextFocusRecovery: "Schütze Schlaf und Regeneration in den härtesten Wochen.",
      nextFocusNutrition: "Verbessere Mahlzeitenabschluss und Hydration, bevor du das Volumen erhöhst.",
      nextFocusLimited: "Sammle mehr persistierte Sessions und Messungen, um die vollständige Ansicht freizuschalten."
    }
  };

  return copy[locale];
}

function resolveRange(rangeId: PerformanceAnalyticsRangeId, locale: Locale): PerformanceAnalyticsRange {
  const now = new Date();
  const days = rangeId === "4w" ? 28 : rangeId === "8w" ? 56 : rangeId === "12w" ? 84 : ANNUAL_BOUNDARY_DAYS;
  const startDateKey = rangeId === "all" ? toDateKey(subtractDays(now, ANNUAL_BOUNDARY_DAYS)) : toDateKey(subtractDays(now, days));

  return {
    id: rangeId,
    label: getRangeLabel(locale, rangeId),
    days,
    startDateKey,
    endDateKey: toDateKey(now)
  };
}

function formatPoint(locale: Locale, dateKey: string, value: number, maximumFractionDigits = 0) {
  return {
    label: formatDateLabel(dateKey, locale),
    value,
    display: formatNumber(locale, value, maximumFractionDigits),
    dateKey
  } satisfies PerformanceAnalyticsPoint;
}

function buildSeriesFromValues(
  id: string,
  label: string,
  unit: string,
  accent: string,
  locale: Locale,
  values: Array<{ dateKey: string; value: number }> | null
): PerformanceAnalyticsSeries {
  const points = values && values.length > 0 ? values.map((item) => formatPoint(locale, item.dateKey, item.value, unit === "kg" ? 1 : 0)) : [];
  return {
    id,
    label,
    unit,
    accent,
    points
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function latestValue(points: Array<{ dateKey: string; value: number }>) {
  return points.at(-1) ?? null;
}

function previousValue(points: Array<{ dateKey: string; value: number }>) {
  return points.at(-2) ?? null;
}

function formatSignedDelta(locale: Locale, current: number | null, previous: number | null, unit = "", precision = 1) {
  if (current == null || previous == null) {
    return "";
  }

  const delta = Number((current - previous).toFixed(precision));
  if (delta === 0) {
    return "—";
  }

  const prefix = delta > 0 ? "+" : "";
  const formatted = `${prefix}${formatNumber(locale, Math.abs(delta), precision)}${unit ? ` ${unit}` : ""}`;
  return delta > 0 ? formatted : `−${formatNumber(locale, Math.abs(delta), precision)}${unit ? ` ${unit}` : ""}`;
}

function buildWorkoutLoadSeries(
  sessions: WorkoutSessionsRow[],
  exercises: WorkoutSessionExercisesRow[],
  sets: WorkoutSetsRow[],
  locale: Locale,
  label: string
) {
  const exerciseBySession = new Map<string, WorkoutSessionExercisesRow[]>();
  for (const exercise of exercises) {
    const bucket = exerciseBySession.get(exercise.workout_session_id) ?? [];
    bucket.push(exercise);
    exerciseBySession.set(exercise.workout_session_id, bucket);
  }

  const setsByExercise = new Map<string, WorkoutSetsRow[]>();
  for (const set of sets) {
    const bucket = setsByExercise.get(set.workout_session_exercise_id) ?? [];
    bucket.push(set);
    setsByExercise.set(set.workout_session_exercise_id, bucket);
  }

  const points = sessions
    .slice()
    .sort((left, right) => (left.completed_at ?? left.started_at).localeCompare(right.completed_at ?? right.started_at))
    .map((session) => {
      const sessionExercises = exerciseBySession.get(session.id) ?? [];
      const totalVolume = sessionExercises.reduce((total, exercise) => {
        const sessionSets = setsByExercise.get(exercise.id) ?? [];
        return (
          total +
          sessionSets.reduce((setTotal, set) => {
            if (set.status !== "completed" || set.weight_kg == null || set.reps == null) {
              return setTotal;
            }

            return setTotal + set.weight_kg * set.reps;
          }, 0)
        );
      }, 0);

      return {
        dateKey: (session.completed_at ?? session.started_at).slice(0, 10),
        value: totalVolume
      };
    });

  return {
    series: buildSeriesFromValues("training-volume", label, "kg", "#B6FF00", locale, points),
    totalVolume: points.reduce((total, point) => total + point.value, 0),
    sessionCount: sessions.length,
    averageSessionVolume: average(points.map((point) => point.value)),
    latest: latestValue(points),
    previous: previousValue(points)
  };
}

function buildProgressSeries(state: ProgressState, locale: Locale, weightLabel: string, waistLabel: string) {
  const weightHistory = state.measurement.histories.find((history) => history.type === "weight")?.entries ?? [];
  const waistHistory = state.measurement.histories.find((history) => history.type === "waist")?.entries ?? [];

  return {
    weight: buildSeriesFromValues(
      "weight",
      weightLabel,
      "kg",
      "#FFFFFF",
      locale,
      weightHistory.map((entry) => ({ dateKey: entry.dateKey, value: entry.value }))
    ),
    waist: buildSeriesFromValues(
      "waist",
      waistLabel,
      "cm",
      "#B6FF00",
      locale,
      waistHistory.map((entry) => ({ dateKey: entry.dateKey, value: entry.value }))
    ),
    latestWeight: weightHistory.at(-1) ?? null,
    previousWeight: weightHistory.at(-2) ?? null,
    latestWaist: waistHistory.at(-1) ?? null,
    previousWaist: waistHistory.at(-2) ?? null
  };
}

function buildNutritionSeries(
  days: NutritionDaysRow[],
  selections: NutritionDaySelectionsRow[],
  hydration: NutritionHydrationLogsRow[],
  supplements: NutritionSupplementLogsRow[],
  locale: Locale,
  adherenceLabel: string,
  hydrationLabel: string
) {
  const selectionByDay = new Map<string, NutritionDaySelectionsRow[]>();
  for (const selection of selections) {
    const bucket = selectionByDay.get(selection.nutrition_day_id) ?? [];
    bucket.push(selection);
    selectionByDay.set(selection.nutrition_day_id, bucket);
  }

  const hydrationByDay = new Map<string, NutritionHydrationLogsRow[]>();
  for (const log of hydration) {
    const bucket = hydrationByDay.get(log.nutrition_day_id) ?? [];
    bucket.push(log);
    hydrationByDay.set(log.nutrition_day_id, bucket);
  }

  const supplementByDay = new Map<string, NutritionSupplementLogsRow[]>();
  for (const log of supplements) {
    const bucket = supplementByDay.get(log.nutrition_day_id) ?? [];
    bucket.push(log);
    supplementByDay.set(log.nutrition_day_id, bucket);
  }

  const points = days.map((day) => {
    const daySelections = selectionByDay.get(day.id) ?? [];
    const plannedMeals = daySelections.length > 0 ? daySelections.length : 1;
    const completedMeals = daySelections.filter((selection) => selection.status === "eaten").length;
    const hydrationMl = (hydrationByDay.get(day.id) ?? []).reduce((total, log) => total + log.amount_ml, 0);
    const targetHydration = day.water_target_ml ?? 0;
    const supplementCompleted = (supplementByDay.get(day.id) ?? []).filter((supplement) => supplement.status === "completed").length;
    const score = plannedMeals > 0 ? Math.round((completedMeals / plannedMeals) * 100) : 0;

    return {
      dateKey: day.calendar_date,
      value: score,
      hydrationMl,
      targetHydration,
      supplementCompleted
    };
  });

  return {
    series: buildSeriesFromValues("nutrition-adherence", adherenceLabel, "%", "#B6FF00", locale, points.map((point) => ({ dateKey: point.dateKey, value: point.value }))),
    hydrationSeries: buildSeriesFromValues("hydration", hydrationLabel, "ml", "#FFFFFF", locale, points.map((point) => ({ dateKey: point.dateKey, value: point.hydrationMl }))),
    points,
    averageAdherence: average(points.map((point) => point.value)),
    averageHydration: average(points.map((point) => point.hydrationMl)),
    latest: points.at(-1) ?? null
  };
}

function scoreResponses(responses: WeeklyCheckinResponsesRow[]) {
  const numericValue = (questionKey: string) => {
    const row = responses.find((response) => response.question_key === questionKey);
    return typeof row?.numeric_value === "number" ? row.numeric_value : null;
  };

  const choiceValue = (questionKey: string) => {
    const row = responses.find((response) => response.question_key === questionKey);
    return typeof row?.choice_value === "string" ? row.choice_value : null;
  };

  return computeSignalFromScoredQuestions({
    training_adherence: numericValue("training_adherence"),
    nutrition_adherence: numericValue("nutrition_adherence"),
    energy: numericValue("energy"),
    sleep: numericValue("sleep"),
    stress: numericValue("stress"),
    recovery: numericValue("recovery"),
    pain_discomfort: choiceValue("pain_discomfort")
  });
}

function buildRecoverySeries(checkins: WeeklyCheckinsRow[], responsesByCheckin: Map<string, WeeklyCheckinResponsesRow[]>, locale: Locale, label: string) {
  const points = checkins
    .slice()
    .sort((left, right) => left.week_start_date.localeCompare(right.week_start_date))
    .map((checkin) => {
      const responses = responsesByCheckin.get(checkin.id) ?? [];
      const signal = scoreResponses(responses);
      const recoveryResponse = responses.find((response) => response.question_key === "recovery");
      const numericScore = typeof recoveryResponse?.numeric_value === "number" ? recoveryResponse.numeric_value : signal.recoveryScore;

      return {
        dateKey: checkin.week_start_date,
        value: numericScore ?? 0
      };
    });

  return {
    series: buildSeriesFromValues("recovery", label, "%", "#FFFFFF", locale, points),
    latest: points.at(-1) ?? null,
    previous: points.at(-2) ?? null
  };
}

function buildCopyHighlight(locale: Locale, summary: {
  trendKind: "on-track" | "building" | "attention" | "limited";
  nutritionAverage: number | null;
  recoveryAverage: number | null;
  progressCount: number;
  workoutCount: number;
}) {
  const copy = getCopy(locale);
  const hasLimitedHistory = summary.progressCount < 2 && summary.workoutCount < 2;

  if (hasLimitedHistory) {
    return {
      status: "limited" as const,
      statusLabel: copy.heroStatusLimited,
      summary: copy.limitedHistory,
      nextFocus: copy.nextFocusLimited
    };
  }

  if (summary.trendKind === "attention") {
    const focus = summary.recoveryAverage != null && summary.recoveryAverage < 60 ? copy.nextFocusRecovery : summary.nutritionAverage != null && summary.nutritionAverage < 70 ? copy.nextFocusNutrition : copy.nextFocusConsistency;
    return {
      status: "attention" as const,
      statusLabel: copy.heroStatusAttention,
      summary: copy.heroSummary,
      nextFocus: focus
    };
  }

  if (summary.trendKind === "building") {
    return {
      status: "building" as const,
      statusLabel: copy.heroStatusBuilding,
      summary: copy.heroSummary,
      nextFocus: copy.nextFocusConsistency
    };
  }

  return {
    status: "on-track" as const,
    statusLabel: copy.heroStatusOnTrack,
    summary: copy.heroSummary,
    nextFocus: copy.nextFocusConsistency
  };
}

function buildEmptyDashboard(locale: Locale, range: PerformanceAnalyticsRange): PerformanceAnalyticsDashboard {
  const copy = getCopy(locale);
  return {
    copy,
    locale,
    range,
    generatedAt: new Date().toISOString(),
    athleteName: "",
    phaseLabel: "",
    goal: "",
    currentWorkout: "",
    currentDay: "",
    status: "limited",
    statusLabel: copy.heroStatusLimited,
    summary: copy.emptyCopy,
    nextFocus: copy.nextFocusLimited,
    recentCheckInLabel: copy.noCheckIn,
    recentCheckInSummary: copy.noCheckIn,
    recentCheckInSignals: [],
    metrics: [],
    charts: {
      training: {
        id: createId(),
        title: copy.trainingSection,
        subtitle: copy.limitedHistory,
        unit: "kg",
        series: [],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      weight: {
        id: createId(),
        title: copy.weight,
        subtitle: copy.emptyCopy,
        unit: "kg",
        series: [],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      waist: {
        id: createId(),
        title: copy.waist,
        subtitle: copy.emptyCopy,
        unit: "cm",
        series: [],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      nutrition: {
        id: createId(),
        title: copy.nutritionSection,
        subtitle: copy.emptyCopy,
        unit: "%",
        series: [],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      recovery: {
        id: createId(),
        title: copy.recoverySection,
        subtitle: copy.emptyCopy,
        unit: "%",
        series: [],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      }
    },
    dataCoverage: { workouts: 0, nutritionDays: 0, progressEntries: 0, checkIns: 0 },
    recentSessions: [],
    latestProgressSummary: copy.emptyCopy,
    latestNutritionSummary: copy.emptyCopy,
    immersion: buildEmptyMotivationalImmersion(locale, range.label)
  };
}

async function loadBoundedProgressSnapshot(client: SupabaseClient<Database>, userId: string, range: PerformanceAnalyticsRange) {
  const entriesQuery = client.from("progress_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: true });
  const entriesResult = range.startDateKey ? await entriesQuery.gte("entry_date", range.startDateKey) : await entriesQuery;
  if (entriesResult.error) {
    throw entriesResult.error;
  }

  const entries = (entriesResult.data ?? []) as ProgressEntriesRow[];
  const entryIds = entries.map((entry) => entry.id);

  const [measurementsResult, photosResult] = await Promise.all([
    entryIds.length
      ? client.from("progress_measurements").select("*").in("progress_entry_id", entryIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    entryIds.length
      ? client.from("progress_photos").select("*").in("progress_entry_id", entryIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (measurementsResult.error) {
    throw measurementsResult.error;
  }
  if (photosResult.error) {
    throw photosResult.error;
  }

  return {
    entries,
    measurements: (measurementsResult.data ?? []) as ProgressMeasurementsRow[],
    photos: (photosResult.data ?? []) as ProgressPhotosRow[]
  } satisfies ProgressPersistedSnapshot;
}

async function loadBoundedWorkoutSnapshot(client: SupabaseClient<Database>, userId: string, range: PerformanceAnalyticsRange) {
  const sessionsQuery = client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: true });

  const sessionsResult = range.startDateKey ? await sessionsQuery.gte("completed_at", `${range.startDateKey}T00:00:00.000Z`) : await sessionsQuery;
  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const sessions = (sessionsResult.data ?? []) as WorkoutSessionsRow[];
  const sessionIds = sessions.map((session) => session.id);

  const [exerciseResult, scheduledResult] = await Promise.all([
    sessionIds.length
      ? client.from("workout_session_exercises").select("*").in("workout_session_id", sessionIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    client
      .from("scheduled_workouts")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: true })
      .gte("scheduled_date", range.startDateKey ?? toDateKey(subtractDays(new Date(), ANNUAL_BOUNDARY_DAYS)))
  ]);

  if (exerciseResult.error) {
    throw exerciseResult.error;
  }
  if (scheduledResult.error) {
    throw scheduledResult.error;
  }

  const exercises = (exerciseResult.data ?? []) as WorkoutSessionExercisesRow[];
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const setsResult = exerciseIds.length
    ? await client.from("workout_sets").select("*").in("workout_session_exercise_id", exerciseIds).order("set_number", { ascending: true })
    : { data: [], error: null };
  if (setsResult.error) {
    throw setsResult.error;
  }

  return {
    sessions,
    exercises,
    sets: (setsResult.data ?? []) as WorkoutSetsRow[],
    scheduled: (scheduledResult.data ?? []) as ScheduledWorkoutsRow[]
  };
}

async function loadBoundedNutritionSnapshot(client: SupabaseClient<Database>, userId: string, range: PerformanceAnalyticsRange) {
  const daysQuery = client.from("nutrition_days").select("*").eq("user_id", userId).order("calendar_date", { ascending: true });
  const daysResult = range.startDateKey ? await daysQuery.gte("calendar_date", range.startDateKey) : await daysQuery;
  if (daysResult.error) {
    throw daysResult.error;
  }

  const days = (daysResult.data ?? []) as NutritionDaysRow[];
  const dayIds = days.map((day) => day.id);
  const [selectionsResult, hydrationResult, supplementResult] = await Promise.all([
    dayIds.length ? client.from("nutrition_day_selections").select("*").in("nutrition_day_id", dayIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    dayIds.length ? client.from("nutrition_hydration_logs").select("*").in("nutrition_day_id", dayIds).order("logged_at", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    dayIds.length ? client.from("nutrition_supplement_logs").select("*").in("nutrition_day_id", dayIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null })
  ]);

  if (selectionsResult.error) {
    throw selectionsResult.error;
  }
  if (hydrationResult.error) {
    throw hydrationResult.error;
  }
  if (supplementResult.error) {
    throw supplementResult.error;
  }

  return {
    days,
    selections: (selectionsResult.data ?? []) as NutritionDaySelectionsRow[],
    hydration: (hydrationResult.data ?? []) as NutritionHydrationLogsRow[],
    supplements: (supplementResult.data ?? []) as NutritionSupplementLogsRow[]
  };
}

async function loadBoundedCheckInSnapshot(client: SupabaseClient<Database>, userId: string, range: PerformanceAnalyticsRange) {
  const checkinsQuery = client.from("weekly_checkins").select("*").eq("user_id", userId).order("week_start_date", { ascending: true });
  const checkinsResult = range.startDateKey ? await checkinsQuery.gte("week_start_date", range.startDateKey) : await checkinsQuery;
  if (checkinsResult.error) {
    throw checkinsResult.error;
  }

  const checkins = (checkinsResult.data ?? []) as WeeklyCheckinsRow[];
  const checkinIds = checkins.map((checkin) => checkin.id);
  const [responsesResult, reviewsResult] = await Promise.all([
    checkinIds.length ? client.from("weekly_checkin_responses").select("*").in("weekly_checkin_id", checkinIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    checkinIds.length ? client.from("weekly_checkin_reviews").select("*").in("weekly_checkin_id", checkinIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null })
  ]);

  if (responsesResult.error) {
    throw responsesResult.error;
  }
  if (reviewsResult.error) {
    throw reviewsResult.error;
  }

  return {
    checkins,
    responses: (responsesResult.data ?? []) as WeeklyCheckinResponsesRow[],
    reviews: (reviewsResult.data ?? []) as WeeklyCheckinReviewsRow[]
  };
}

export function resolvePerformanceAnalyticsRange(rangeId: PerformanceAnalyticsRangeId | string | null | undefined, locale: Locale) {
  if (rangeId === "4w" || rangeId === "8w" || rangeId === "12w" || rangeId === "all") {
    return resolveRange(rangeId, locale);
  }

  return resolveRange("8w", locale);
}

export function buildPerformanceAnalyticsDashboardFromSnapshot(
  snapshot: {
    athleteName: string;
    goal: string;
    phaseLabel: string;
    currentWorkout: string;
    currentDay: string;
    progressState: ProgressState;
    workout: Awaited<ReturnType<typeof loadBoundedWorkoutSnapshot>>;
    nutrition: Awaited<ReturnType<typeof loadBoundedNutritionSnapshot>>;
    checkIn: Awaited<ReturnType<typeof loadBoundedCheckInSnapshot>>;
    programScheduledCount: number;
    locale: Locale;
    range: PerformanceAnalyticsRange;
  }
): PerformanceAnalyticsDashboard {
  const copy = getCopy(snapshot.locale);
  const progressSeries = buildProgressSeries(snapshot.progressState, snapshot.locale, copy.weight, copy.waist);
  const training = buildWorkoutLoadSeries(snapshot.workout.sessions, snapshot.workout.exercises, snapshot.workout.sets, snapshot.locale, copy.totalVolume);
  const nutrition = buildNutritionSeries(snapshot.nutrition.days, snapshot.nutrition.selections, snapshot.nutrition.hydration, snapshot.nutrition.supplements, snapshot.locale, copy.nutritionAdherence, copy.hydration);
  const responsesByCheckin = new Map<string, WeeklyCheckinResponsesRow[]>();
  for (const response of snapshot.checkIn.responses) {
    const bucket = responsesByCheckin.get(response.weekly_checkin_id) ?? [];
    bucket.push(response);
    responsesByCheckin.set(response.weekly_checkin_id, bucket);
  }
  const recovery = buildRecoverySeries(snapshot.checkIn.checkins, responsesByCheckin, snapshot.locale, copy.recovery);

  const latestCheckIn = snapshot.checkIn.checkins.at(-1) ?? null;
  const latestCheckInResponses = latestCheckIn ? (responsesByCheckin.get(latestCheckIn.id) ?? []) : [];
  const latestCheckInSummary = latestCheckInResponses.length > 0 ? deriveWeeklyCheckinReviewSummary(scoreResponses(latestCheckInResponses)) : null;
  const latestReview = snapshot.checkIn.reviews.at(-1) ?? null;

  const latestWeight = progressSeries.latestWeight;
  const previousWeight = progressSeries.previousWeight;
  const latestWaist = progressSeries.latestWaist;
  const previousWaist = progressSeries.previousWaist;

  const weightDelta = formatSignedDelta(snapshot.locale, latestWeight?.value ?? null, previousWeight?.value ?? null, "kg");
  const waistDelta = formatSignedDelta(snapshot.locale, latestWaist?.value ?? null, previousWaist?.value ?? null, "cm");
  const nutritionAverage = nutrition.averageAdherence;
  const hydrationAverage = nutrition.averageHydration;
  const recoveryAverage = average(recovery.series.points.map((point) => point.value));

  const trainingVolumeDelta = formatSignedDelta(
    snapshot.locale,
    training.latest?.value ?? null,
    training.previous?.value ?? null,
    "kg",
    0
  );

  const trendKind =
    (latestWeight && previousWeight && latestWaist && previousWaist && latestWeight.value <= previousWeight.value && latestWaist.value <= previousWaist.value) ||
    (training.latest && training.previous && training.latest.value >= training.previous.value)
      ? "building"
      : nutritionAverage != null && nutritionAverage < 70
        ? "attention"
        : recoveryAverage != null && recoveryAverage < 60
          ? "attention"
          : "on-track";

  const highlight = buildCopyHighlight(snapshot.locale, {
    trendKind,
    nutritionAverage,
    recoveryAverage,
    progressCount: snapshot.progressState.measurement.histories.reduce((total, history) => total + history.entries.length, 0),
    workoutCount: snapshot.workout.sessions.length
  });

  const recentSessions = snapshot.workout.sessions
    .slice(-3)
    .map((session) => {
      const volume = snapshot.workout.exercises
        .filter((exercise) => exercise.workout_session_id === session.id)
        .reduce((total, exercise) => {
          const sessionSets = snapshot.workout.sets.filter((set) => set.workout_session_exercise_id === exercise.id && set.status === "completed");
          return total + sessionSets.reduce((setTotal, set) => setTotal + (set.weight_kg ?? 0) * (set.reps ?? 0), 0);
        }, 0);

      return {
        label: formatDateLabel((session.completed_at ?? session.started_at).slice(0, 10), snapshot.locale),
        detail: `${formatNumber(snapshot.locale, volume, 0)} kg · ${formatNumber(snapshot.locale, session.duration_seconds != null ? Math.round(session.duration_seconds / 60) : 0, 0)} min`
      };
    })
    .reverse();

  const metrics: PerformanceAnalyticsMetric[] = [
    {
      id: "trainingVolume",
      label: copy.totalVolume,
      value: `${formatNumber(snapshot.locale, training.totalVolume, 0)} kg`,
      delta: trainingVolumeDelta,
      detail: `${formatNumber(snapshot.locale, training.sessionCount, 0)} ${copy.sessionCount.toLowerCase()}`,
      tone: "accent"
    },
    {
      id: "weight",
      label: copy.weight,
      value: latestWeight ? `${formatNumber(snapshot.locale, latestWeight.value, 1)} kg` : "—",
      delta: weightDelta,
      detail: latestWeight ? formatDateLabel(latestWeight.dateKey, snapshot.locale) : copy.limitedHistory,
      tone: "neutral"
    },
    {
      id: "waist",
      label: copy.waist,
      value: latestWaist ? `${formatNumber(snapshot.locale, latestWaist.value, 1)} cm` : "—",
      delta: waistDelta,
      detail: latestWaist ? formatDateLabel(latestWaist.dateKey, snapshot.locale) : copy.limitedHistory,
      tone: "positive"
    },
    {
      id: "nutrition",
      label: copy.nutritionAdherence,
      value: nutritionAverage != null ? `${formatNumber(snapshot.locale, nutritionAverage, 0)}%` : "—",
      delta: nutrition.latest ? `${formatNumber(snapshot.locale, nutrition.latest.value, 0)}%` : "",
      detail: nutrition.latest ? formatDateLabel(nutrition.latest.dateKey, snapshot.locale) : copy.limitedHistory,
      tone: nutritionAverage != null && nutritionAverage >= 80 ? "positive" : nutritionAverage != null && nutritionAverage >= 65 ? "accent" : "warning"
    },
    {
      id: "recovery",
      label: copy.recovery,
      value: recoveryAverage != null ? `${formatNumber(snapshot.locale, recoveryAverage, 0)}%` : "—",
      delta: recovery.latest ? `${formatNumber(snapshot.locale, recovery.latest.value, 0)}%` : "",
      detail: latestCheckIn ? formatDateLabel(latestCheckIn.week_start_date, snapshot.locale) : copy.noCheckIn,
      tone: recoveryAverage != null && recoveryAverage >= 70 ? "positive" : recoveryAverage != null && recoveryAverage >= 55 ? "accent" : "warning"
    }
  ];

  const workoutCoverage = snapshot.programScheduledCount > 0 ? `${snapshot.workout.sessions.length}/${snapshot.programScheduledCount}` : `${snapshot.workout.sessions.length}`;

  const bodySummary =
    latestWeight && latestWaist
      ? latestWeight.value <= (previousWeight?.value ?? latestWeight.value) && latestWaist.value <= (previousWaist?.value ?? latestWaist.value)
        ? copy.heroSummary
        : copy.heroSummary
      : copy.limitedHistory;

  const latestProgressEntry = snapshot.progressState.measurement.lastSavedRows.at(-1) ?? null;
  const latestNutritionDay = snapshot.nutrition.days.at(-1) ?? null;
  const workoutVolumes = snapshot.workout.sessions
    .slice()
    .map((session) =>
      snapshot.workout.exercises
        .filter((exercise) => exercise.workout_session_id === session.id)
        .reduce((total, exercise) => {
          const sessionSets = snapshot.workout.sets.filter((set) => set.workout_session_exercise_id === exercise.id && set.status === "completed");
          return total + sessionSets.reduce((setTotal, set) => setTotal + (set.weight_kg ?? 0) * (set.reps ?? 0), 0);
        }, 0)
    );
  const latestSession = snapshot.workout.sessions.at(-1) ?? null;
  const latestSessionExerciseIds = latestSession ? snapshot.workout.exercises.filter((exercise) => exercise.workout_session_id === latestSession.id).map((exercise) => exercise.id) : [];
  const latestWorkoutLoad = latestSessionExerciseIds.length
    ? Math.max(
        ...snapshot.workout.sets
          .filter((set) => latestSessionExerciseIds.includes(set.workout_session_exercise_id) && set.status === "completed" && typeof set.weight_kg === "number")
          .map((set) => Number(set.weight_kg))
      )
    : null;
  const bestWorkoutLoad = snapshot.workout.sets.some((set) => set.status === "completed" && typeof set.weight_kg === "number")
    ? Math.max(...snapshot.workout.sets.filter((set) => set.status === "completed" && typeof set.weight_kg === "number").map((set) => Number(set.weight_kg)))
    : null;
  const nutritionAdherencePercent = nutrition.averageAdherence;
  const hydrationMl = nutrition.latest?.hydrationMl ?? null;
  const hydrationTargetMl = nutrition.latest?.targetHydration ?? null;
  const trainingAdherencePercent = snapshot.progressState.trends.adherenceTrend.current;
  const phaseComplete = snapshot.progressState.phaseReview.status === "NEXT PHASE";
  const immersion = buildMotivationalImmersion(snapshot.locale, {
    locale: snapshot.locale,
    phaseLabel: snapshot.phaseLabel,
    trainingAdherencePercent,
    nutritionAdherencePercent,
    hydrationMl,
    hydrationTargetMl,
    workoutSessionCount: snapshot.workout.sessions.length,
    latestWorkoutLoad,
    bestWorkoutLoad,
    phaseComplete
  });

  const [latestRecoveryLabel, latestRecoverySummary, latestRecoverySignals] = latestCheckInSummary
    ? [latestCheckInSummary.recommendationLabel, latestCheckInSummary.reviewReason.summary, latestCheckInSummary.reviewReason.triggerKeys]
      : latestReview
      ? [
          latestReview.status,
          typeof latestReview.review_reason === "object" && latestReview.review_reason !== null && !Array.isArray(latestReview.review_reason) && typeof (latestReview.review_reason as Record<string, unknown>).summary === "string"
            ? String((latestReview.review_reason as Record<string, unknown>).summary)
            : copy.noCheckIn,
          typeof latestReview.review_reason === "object" && latestReview.review_reason !== null && !Array.isArray(latestReview.review_reason) && Array.isArray((latestReview.review_reason as Record<string, unknown>).triggerKeys)
            ? ((latestReview.review_reason as Record<string, unknown>).triggerKeys as string[]).filter((item) => typeof item === "string")
            : []
        ]
      : [copy.noCheckIn, copy.noCheckIn, []];

  const status: PerformanceAnalyticsDashboard["status"] =
    highlight.status === "limited"
      ? "limited"
      : highlight.status === "attention"
        ? "attention"
        : trendKind === "building"
          ? "building"
          : "on-track";

  const latestNutritionSummary =
    latestNutritionDay && nutrition.latest
      ? `${formatDateLabel(nutrition.latest.dateKey, snapshot.locale)} · ${formatNumber(snapshot.locale, nutrition.latest.value, 0)}%`
      : copy.limitedHistory;

  return {
    copy,
    locale: snapshot.locale,
    range: snapshot.range,
    generatedAt: new Date().toISOString(),
    athleteName: snapshot.athleteName,
    phaseLabel: snapshot.phaseLabel,
    goal: snapshot.goal,
    currentWorkout: snapshot.currentWorkout,
    currentDay: snapshot.currentDay,
    status,
    statusLabel: highlight.statusLabel,
    summary: highlight.summary,
    nextFocus: highlight.nextFocus,
    recentCheckInLabel: latestRecoveryLabel,
    recentCheckInSummary: latestRecoverySummary,
    recentCheckInSignals: latestRecoverySignals,
    metrics,
    charts: {
      training: {
        id: createId(),
        title: copy.trainingSection,
        subtitle: `${copy.totalVolume} · ${copy.chartTapHint}`,
        unit: "kg",
        series: [training.series],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      weight: {
        id: createId(),
        title: copy.weight,
        subtitle: `${copy.chartTapHint}`,
        unit: "kg",
        series: [progressSeries.weight],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      waist: {
        id: createId(),
        title: copy.waist,
        subtitle: `${copy.chartTapHint}`,
        unit: "cm",
        series: [progressSeries.waist],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      nutrition: {
        id: createId(),
        title: copy.nutritionSection,
        subtitle: copy.chartTapHint,
        unit: "%",
        series: [nutrition.series],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      },
      recovery: {
        id: createId(),
        title: copy.recoverySection,
        subtitle: copy.chartTapHint,
        unit: "%",
        series: [recovery.series],
        pointsLabel: copy.dataPoints,
        emptyTitle: copy.emptyTitle,
        emptyCopy: copy.emptyCopy
      }
    },
    dataCoverage: {
      workouts: snapshot.workout.sessions.length,
      nutritionDays: snapshot.nutrition.days.length,
      progressEntries: snapshot.progressState.measurement.histories.reduce((total, history) => total + history.entries.length, 0),
      checkIns: snapshot.checkIn.checkins.length
    },
    recentSessions,
    latestProgressSummary: latestProgressEntry
      ? `${latestProgressEntry.label} · ${formatNumber(snapshot.locale, latestProgressEntry.currentValue ?? latestProgressEntry.previousValue ?? 0, 1)} ${latestProgressEntry.unit}`
      : bodySummary,
    latestNutritionSummary,
    immersion
  };
}

export async function loadPerformanceAnalyticsDashboard(
  client: SupabaseClient<Database>,
  userId: string,
  locale: Locale,
  rangeId: PerformanceAnalyticsRangeId | string | null | undefined
) {
  const range = resolvePerformanceAnalyticsRange(rangeId, locale);

  const [athleteSnapshot, programBundle, progressSnapshot, workoutSnapshot, nutritionSnapshot, checkInSnapshot] = await Promise.all([
    loadAthleteSnapshot(client, userId),
    loadProgramBundle(client, userId),
    loadBoundedProgressSnapshot(client, userId, range),
    loadBoundedWorkoutSnapshot(client, userId, range),
    loadBoundedNutritionSnapshot(client, userId, range),
    loadBoundedCheckInSnapshot(client, userId, range)
  ]);

  const programSummary = programBundle ? getProgramDaySummary(programBundle, range.endDateKey) : null;
  const progressState = buildProgressStateFromPersistedSnapshot(createProgressDemoState(), progressSnapshot);

  return buildPerformanceAnalyticsDashboardFromSnapshot({
    athleteName: athleteSnapshot.snapshot.profile.name,
    goal: athleteSnapshot.snapshot.goals.mainGoal,
    phaseLabel: programBundle?.program?.phaseLabel ?? "Phase 1",
    currentWorkout: programSummary?.workoutTitle ?? programBundle?.program?.firstWorkout ?? "—",
    currentDay: programSummary?.dateLabel ?? range.endDateKey,
    progressState,
    workout: workoutSnapshot,
    nutrition: nutritionSnapshot,
    checkIn: checkInSnapshot,
    programScheduledCount: workoutSnapshot.scheduled.length,
    locale,
    range
  });
}

export function buildEmptyPerformanceAnalyticsDashboard(locale: Locale, rangeId: PerformanceAnalyticsRangeId | string | null | undefined) {
  return buildEmptyDashboard(locale, resolvePerformanceAnalyticsRange(rangeId, locale));
}
