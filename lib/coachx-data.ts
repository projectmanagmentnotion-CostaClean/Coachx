import { createDemoWorkoutSession, getExerciseDefinition } from "@/lib/workout-data";
import { createNutritionSession, type NutritionDay } from "@/lib/nutrition-data";
import { getCurrentLocale, type Locale } from "@/lib/i18n";

export type BottomTab = "today" | "calendar" | "nutrition" | "progress" | "profile";

export type MuscleGroup =
  | "glutes"
  | "hamstrings"
  | "quadriceps"
  | "calves"
  | "core"
  | "chest"
  | "shoulders"
  | "triceps"
  | "biceps"
  | "back"
  | "lats";

export interface WorkoutMovement {
  name: string;
  prescription: string;
  icon: string;
  thumbnail?: string;
}

export interface CalendarDay {
  label: string;
  weekday: string;
  day: number;
  monthOffset: -1 | 0 | 1;
  hasActivity?: boolean;
  isSelected?: boolean;
  isToday?: boolean;
  isDimmed?: boolean;
  completed?: boolean;
}

export interface DemoDay {
  dateKey: string;
  dateLabel: string;
  calendarLabel: string;
  phase: string;
  workoutTitle: string;
  workoutType: string;
  duration: string;
  volume: string;
  sets: string;
  primaryTarget: string;
  secondaryTarget: string;
  workoutCount: string;
  nutritionCalories: string;
  macros: string;
  cardio: string;
  habits: string;
  coachInsight: string;
  muscleFocus: MuscleGroup[];
  anatomyKey: string;
  movements: WorkoutMovement[];
}

export interface ProgressMetric {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "steady";
}

export interface ProfileSection {
  label: string;
  value: string;
}

interface DemoAthlete {
  name: string;
  goal: string;
  priorities: string;
  training: string;
  experience: string;
  schedule: string;
  recovery: string;
  nutrition: string;
  health: string;
  baseline: string;
}

type DemoLocaleCopy = {
  athlete: DemoAthlete;
  day: Pick<DemoDay, "workoutType" | "primaryTarget" | "secondaryTarget" | "coachInsight" | "cardio" | "habits">;
  calendarMonth: string;
  calendarTitle: string;
  progressMetrics: ProgressMetric[];
  profileLabels: Array<{ label: string; valueKey: keyof DemoAthlete }>;
};

const copies: Record<Locale, DemoLocaleCopy> = {
  en: {
    athlete: {
      name: "Alex",
      goal: "Body recomposition",
      priorities: "Glutes · Hamstrings · Legs",
      training: "4 days / week · 60-75 min · Full gym",
      experience: "Intermediate",
      schedule: "Evening training · Active workday",
      recovery: "6-7h sleep · Moderate stress",
      nutrition: "3 meals + snack · Structured",
      health: "Information reviewed",
      baseline: "Measurements added · Photos added"
    },
    day: {
      workoutType: "Posterior chain emphasis",
      primaryTarget: "Glutes",
      secondaryTarget: "Hamstrings",
      coachInsight: "Keep the pelvis neutral on thrusts and hinge with control on every rep.",
      cardio: "Zone 2 · 20 min",
      habits: "Daily habits 0/5"
    },
    calendarMonth: "August 2026",
    calendarTitle: "Calendar",
    progressMetrics: [
      { label: "Training volume", value: "+8%", delta: "vs last week", trend: "up" },
      { label: "Bodyweight", value: "-0.4 kg", delta: "since baseline", trend: "down" },
      { label: "Consistency", value: "5 / 7", delta: "days completed", trend: "steady" }
    ],
    profileLabels: [
      { label: "Goal", valueKey: "goal" },
      { label: "Priorities", valueKey: "priorities" },
      { label: "Training", valueKey: "training" },
      { label: "Experience", valueKey: "experience" },
      { label: "Schedule", valueKey: "schedule" },
      { label: "Recovery", valueKey: "recovery" },
      { label: "Nutrition", valueKey: "nutrition" },
      { label: "Health & limitations", valueKey: "health" },
      { label: "Baseline", valueKey: "baseline" }
    ]
  },
  es: {
    athlete: {
      name: "Alex",
      goal: "Recomposición corporal",
      priorities: "Glúteos · Isquios · Piernas",
      training: "4 días / semana · 60-75 min · Gimnasio completo",
      experience: "Intermedio",
      schedule: "Entreno por la tarde · Jornada activa",
      recovery: "6-7h de sueño · Estrés moderado",
      nutrition: "3 comidas + snack · Estructurado",
      health: "Información revisada",
      baseline: "Mediciones añadidas · Fotos añadidas"
    },
    day: {
      workoutType: "Énfasis en cadena posterior",
      primaryTarget: "Glúteos",
      secondaryTarget: "Isquios",
      coachInsight: "Mantén la pelvis neutra en los thrusts y controla cada repetición.",
      cardio: "Zona 2 · 20 min",
      habits: "Hábitos diarios 0/5"
    },
    calendarMonth: "agosto de 2026",
    calendarTitle: "Calendario",
    progressMetrics: [
      { label: "Volumen de entrenamiento", value: "+8%", delta: "vs la semana pasada", trend: "up" },
      { label: "Peso corporal", value: "-0.4 kg", delta: "desde baseline", trend: "down" },
      { label: "Constancia", value: "5 / 7", delta: "días completados", trend: "steady" }
    ],
    profileLabels: [
      { label: "Objetivo", valueKey: "goal" },
      { label: "Prioridades", valueKey: "priorities" },
      { label: "Entrenamiento", valueKey: "training" },
      { label: "Experiencia", valueKey: "experience" },
      { label: "Horario", valueKey: "schedule" },
      { label: "Recuperación", valueKey: "recovery" },
      { label: "Nutrición", valueKey: "nutrition" },
      { label: "Salud y limitaciones", valueKey: "health" },
      { label: "Baseline", valueKey: "baseline" }
    ]
  },
  ca: {
    athlete: {
      name: "Alex",
      goal: "Recomposició corporal",
      priorities: "Glutis · Isquios · Cames",
      training: "4 dies / setmana · 60-75 min · Gimnàs complet",
      experience: "Intermedi",
      schedule: "Entrenament al vespre · Jornada activa",
      recovery: "6-7h de son · Estrès moderat",
      nutrition: "3 àpats + snack · Estructurat",
      health: "Informació revisada",
      baseline: "Mesures afegides · Fotos afegides"
    },
    day: {
      workoutType: "Èmfasi en la cadena posterior",
      primaryTarget: "Glutis",
      secondaryTarget: "Isquios",
      coachInsight: "Mantén la pelvis neutra als thrusts i controla cada repetició.",
      cardio: "Zona 2 · 20 min",
      habits: "Hàbits diaris 0/5"
    },
    calendarMonth: "agost de 2026",
    calendarTitle: "Calendari",
    progressMetrics: [
      { label: "Volum d'entrenament", value: "+8%", delta: "respecte a la setmana passada", trend: "up" },
      { label: "Pes corporal", value: "-0.4 kg", delta: "des del baseline", trend: "down" },
      { label: "Constància", value: "5 / 7", delta: "dies completats", trend: "steady" }
    ],
    profileLabels: [
      { label: "Objectiu", valueKey: "goal" },
      { label: "Prioritats", valueKey: "priorities" },
      { label: "Entrenament", valueKey: "training" },
      { label: "Experiència", valueKey: "experience" },
      { label: "Horari", valueKey: "schedule" },
      { label: "Recuperació", valueKey: "recovery" },
      { label: "Nutrició", valueKey: "nutrition" },
      { label: "Salut i limitacions", valueKey: "health" },
      { label: "Baseline", valueKey: "baseline" }
    ]
  },
  de: {
    athlete: {
      name: "Alex",
      goal: "Körperrekomposition",
      priorities: "Glutes · Hamstrings · Beine",
      training: "4 Tage / Woche · 60-75 Min. · Voll ausgestattetes Gym",
      experience: "Fortgeschritten",
      schedule: "Abendtraining · Aktiver Arbeitstag",
      recovery: "6-7h Schlaf · Moderater Stress",
      nutrition: "3 Mahlzeiten + Snack · Strukturiert",
      health: "Informationen geprüft",
      baseline: "Messungen hinzugefügt · Fotos hinzugefügt"
    },
    day: {
      workoutType: "Fokus auf die hintere Muskelkette",
      primaryTarget: "Glutes",
      secondaryTarget: "Hamstrings",
      coachInsight: "Halte das Becken bei Thrusts neutral und arbeite jede Wiederholung kontrolliert.",
      cardio: "Zone 2 · 20 Min.",
      habits: "Tägliche Gewohnheiten 0/5"
    },
    calendarMonth: "August 2026",
    calendarTitle: "Kalender",
    progressMetrics: [
      { label: "Trainingsvolumen", value: "+8%", delta: "gegenüber letzter Woche", trend: "up" },
      { label: "Körpergewicht", value: "-0.4 kg", delta: "seit Baseline", trend: "down" },
      { label: "Konstanz", value: "5 / 7", delta: "abgeschlossene Tage", trend: "steady" }
    ],
    profileLabels: [
      { label: "Ziel", valueKey: "goal" },
      { label: "Prioritäten", valueKey: "priorities" },
      { label: "Training", valueKey: "training" },
      { label: "Erfahrung", valueKey: "experience" },
      { label: "Zeitplan", valueKey: "schedule" },
      { label: "Erholung", valueKey: "recovery" },
      { label: "Ernährung", valueKey: "nutrition" },
      { label: "Gesundheit & Einschränkungen", valueKey: "health" },
      { label: "Baseline", valueKey: "baseline" }
    ]
  }
};

function buildCalendarDays(locale: Locale, selectedKey: string) {
  const year = 2026;
  const monthIndex = 7;
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = (startDate.getUTCDay() + 6) % 7;
  const firstVisibleDate = new Date(Date.UTC(year, monthIndex, 1 - startWeekday));
  const weekdays = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const selectedDate = new Date(selectedKey);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstVisibleDate);
    current.setUTCDate(firstVisibleDate.getUTCDate() + index);

    const monthOffset = current.getUTCMonth() < monthIndex ? -1 : current.getUTCMonth() > monthIndex ? 1 : 0;
    const isSelected = current.toISOString().startsWith(selectedKey);
    const isToday =
      current.getUTCFullYear() === selectedDate.getUTCFullYear() &&
      current.getUTCMonth() === selectedDate.getUTCMonth() &&
      current.getUTCDate() === selectedDate.getUTCDate();

    return {
      label: weekdays.format(current).toUpperCase(),
      weekday: weekdays.format(current),
      day: current.getUTCDate(),
      monthOffset,
      isDimmed: monthOffset !== 0,
      isSelected,
      isToday,
      hasActivity: [1, 2, 3, 5, 6, 8, 10, 11, 14, 15, 18, 20, 22, 24, 26, 28, 30].includes(current.getUTCDate()) && monthOffset === 0,
      completed: current.getUTCDate() === 7 && monthOffset === 0
    };
  });
}

export function createCoachxDemoState(locale: Locale = getCurrentLocale()) {
  const copy = copies[locale] ?? copies.en;
  const demoWorkoutSession = createDemoWorkoutSession();
  const demoNutritionDay: NutritionDay = createNutritionSession("2026-08-08");

  const demoDay: DemoDay = {
    dateKey: demoNutritionDay.dateKey,
    dateLabel: demoNutritionDay.dateLabel,
    calendarLabel: demoNutritionDay.calendarLabel,
    phase: demoWorkoutSession.phaseLabel,
    workoutTitle: demoWorkoutSession.workoutLabel,
    workoutType: copy.day.workoutType,
    duration: demoWorkoutSession.summary.duration,
    volume: "7.8k",
    sets: demoWorkoutSession.summary.setsCompleted,
    primaryTarget: copy.day.primaryTarget,
    secondaryTarget: copy.day.secondaryTarget,
    workoutCount: `${demoWorkoutSession.totalExercises} exercises`,
    nutritionCalories: `${demoNutritionDay.target.calories} kcal`,
    macros: `${demoNutritionDay.target.protein}P · ${demoNutritionDay.target.carbs}C · ${demoNutritionDay.target.fat}F`,
    cardio: copy.day.cardio,
    habits: copy.day.habits,
    coachInsight: copy.day.coachInsight,
    muscleFocus: ["glutes", "hamstrings"],
    anatomyKey: "posterior-lower-body",
    movements: demoWorkoutSession.exercises.map((exercise) => {
      const definition = getExerciseDefinition(exercise.performedExerciseId);
      return {
        name: definition.name,
        prescription: `${definition.programSets} sets x ${definition.programReps} reps`,
        icon: "fitness_center",
        thumbnail: definition.thumbnail
      };
    })
  };

  const demoCalendarDays = buildCalendarDays(locale, demoDay.dateKey);

  return {
    athlete: copy.athlete,
    day: demoDay,
    nutrition: demoNutritionDay,
    workoutSession: demoWorkoutSession,
    calendar: {
      monthLabel: copy.calendarMonth,
      topLabel: copy.calendarTitle,
      weekdays: demoCalendarDays.map((day) => day.weekday),
      days: demoCalendarDays
    },
    progress: {
      metrics: copy.progressMetrics
    },
    profile: copy.profileLabels.map((entry) => ({ label: entry.label, value: copy.athlete[entry.valueKey] }))
  };
}

export const coachxDemoState = createCoachxDemoState();
export const coachxToday = coachxDemoState.day;
export const coachxNutrition = coachxDemoState.nutrition;
export const coachxCalendarDays = coachxDemoState.calendar.days;
export const coachxCalendarWeekdays = coachxDemoState.calendar.weekdays;
export const coachxProgressMetrics = coachxDemoState.progress.metrics;
export const coachxProfile = coachxDemoState.profile;
