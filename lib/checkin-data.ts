export type WeeklyCheckinStatus = "not_started" | "in_progress" | "completed" | "submitted" | "reviewed";
export type WeeklyCheckinResponseType = "scale" | "boolean" | "text" | "single_choice" | "multiple_choice" | "numeric";
export type WeeklyCheckinReviewStatus = "pending" | "needs_attention" | "reviewed" | "acknowledged";
export type WeeklyCheckinRecommendationType = "none" | "light_review" | "coach_review" | "program_adjustment";

export interface WeeklyCheckinQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface WeeklyCheckinQuestionDefinition {
  key: string;
  title: string;
  prompt: string;
  responseType: WeeklyCheckinResponseType;
  helperText?: string;
  scale?: {
    minimumLabel: string;
    maximumLabel: string;
    minimum: number;
    maximum: number;
  };
  options?: WeeklyCheckinQuestionOption[];
}

import type { Json } from "@/lib/supabase/database.types";

export interface WeeklyCheckinResponseDraft {
  questionKey: string;
  responseType: WeeklyCheckinResponseType;
  numericValue: number | null;
  textValue: string | null;
  booleanValue: boolean | null;
  choiceValue: string | null;
  jsonValue: Json | null;
  answeredAt: string | null;
}

export interface WeeklyCheckinSummarySignal {
  completedScheduledWorkouts: number;
  plannedScheduledWorkouts: number;
  completedNutritionDays: number;
  plannedNutritionDays: number;
  progressEntries: number;
  trainingAdherenceScore: number | null;
  nutritionAdherenceScore: number | null;
  energyScore: number | null;
  sleepScore: number | null;
  stressScore: number | null;
  recoveryScore: number | null;
  painDescriptor: string | null;
  painFlag: boolean;
  lowRecoveryFlag: boolean;
  lowEnergyFlag: boolean;
  lowSleepFlag: boolean;
  lowStressControlFlag: boolean;
}

export interface WeeklyCheckinReviewSummary {
  status: WeeklyCheckinReviewStatus;
  recommendationType: WeeklyCheckinRecommendationType;
  reviewReason: {
    triggerKeys: string[];
    summary: string;
    signals: WeeklyCheckinSummarySignal;
    source: "deterministic";
  };
  reviewNotes: string | null;
  recommendationLabel: string;
}

const scaleQuestion = (key: string, title: string, prompt: string, helperText: string, minimumLabel: string, maximumLabel: string): WeeklyCheckinQuestionDefinition => ({
  key,
  title,
  prompt,
  responseType: "scale",
  helperText,
  scale: {
    minimum: 1,
    maximum: 5,
    minimumLabel,
    maximumLabel
  }
});

export const weeklyCheckinQuestions: WeeklyCheckinQuestionDefinition[] = [
  scaleQuestion(
    "training_adherence",
    "Training adherence",
    "How consistently did you follow the planned training this week?",
    "Use the full scale. Low does not mean failure; it just helps the review stay honest.",
    "Not at all",
    "Fully"
  ),
  scaleQuestion(
    "nutrition_adherence",
    "Nutrition adherence",
    "How closely did you follow the nutrition plan this week?",
    "Choose the level that best reflects the whole week, not one day.",
    "Off track",
    "Very consistent"
  ),
  scaleQuestion(
    "energy",
    "Energy",
    "How was your energy across the week?",
    "Higher is better here.",
    "Very low",
    "Very high"
  ),
  scaleQuestion(
    "sleep",
    "Sleep",
    "How was your sleep quality this week?",
    "Think about consistency and recovery, not one isolated night.",
    "Poor",
    "Excellent"
  ),
  scaleQuestion(
    "stress",
    "Stress",
    "How manageable was your stress this week?",
    "Higher means stress felt easier to manage.",
    "Hard to manage",
    "Very manageable"
  ),
  scaleQuestion(
    "recovery",
    "Recovery",
    "How well did you recover between sessions?",
    "Consider soreness, readiness, and how you felt on training days.",
    "Poor",
    "Great"
  ),
  {
    key: "pain_discomfort",
    title: "Pain or discomfort",
    prompt: "Did anything feel painful or concerning while training or recovering?",
    responseType: "single_choice",
    helperText: "If something felt off, flag it. The review stays calm and private.",
    options: [
      { id: "none", label: "None" },
      { id: "mild", label: "Mild" },
      { id: "moderate", label: "Moderate" },
      { id: "high", label: "High" }
    ]
  },
  {
    key: "weekly_notes",
    title: "Weekly notes",
    prompt: "Anything else you want AthlexForce to know?",
    responseType: "text",
    helperText: "Short notes are fine. This is the place for context."
  }
];

const checkinQuestionCopy: Record<Locale, Record<string, Pick<WeeklyCheckinQuestionDefinition, "title" | "prompt" | "helperText"> & { scale?: { minimumLabel: string; maximumLabel: string } }>> = {
  en: {
    training_adherence: {
      title: "Training adherence",
      prompt: "How consistently did you follow the planned training this week?",
      helperText: "Use the full scale. Low does not mean failure; it just helps the review stay honest.",
      scale: { minimumLabel: "Not at all", maximumLabel: "Fully" }
    },
    nutrition_adherence: {
      title: "Nutrition adherence",
      prompt: "How closely did you follow the nutrition plan this week?",
      helperText: "Choose the level that best reflects the whole week, not one day.",
      scale: { minimumLabel: "Off track", maximumLabel: "Very consistent" }
    },
    energy: {
      title: "Energy",
      prompt: "How was your energy across the week?",
      helperText: "Higher is better here.",
      scale: { minimumLabel: "Very low", maximumLabel: "Very high" }
    },
    sleep: {
      title: "Sleep",
      prompt: "How was your sleep quality this week?",
      helperText: "Think about consistency and recovery, not one isolated night.",
      scale: { minimumLabel: "Poor", maximumLabel: "Excellent" }
    },
    stress: {
      title: "Stress",
      prompt: "How manageable was your stress this week?",
      helperText: "Higher means stress felt easier to manage.",
      scale: { minimumLabel: "Hard to manage", maximumLabel: "Very manageable" }
    },
    recovery: {
      title: "Recovery",
      prompt: "How well did you recover between sessions?",
      helperText: "Consider soreness, readiness, and how you felt on training days.",
      scale: { minimumLabel: "Poor", maximumLabel: "Great" }
    },
    pain_discomfort: {
      title: "Pain or discomfort",
      prompt: "Did anything feel painful or concerning while training or recovering?",
      helperText: "If something felt off, flag it. The review stays calm and private."
    },
    weekly_notes: {
      title: "Weekly notes",
      prompt: "Anything else you want AthlexForce to know?",
      helperText: "Short notes are fine. This is the place for context."
    }
  },
  es: {
    training_adherence: { title: "Adherencia al entrenamiento", prompt: "¿Qué tan bien seguiste el entrenamiento planificado esta semana?", helperText: "Usa toda la escala. Bajo no significa fracaso; solo ayuda a una revisión honesta.", scale: { minimumLabel: "Nada", maximumLabel: "Totalmente" } },
    nutrition_adherence: { title: "Adherencia a la nutrición", prompt: "¿Qué tan bien seguiste el plan de nutrición esta semana?", helperText: "Elige el nivel que mejor represente toda la semana, no solo un día.", scale: { minimumLabel: "Desviado", maximumLabel: "Muy constante" } },
    energy: { title: "Energía", prompt: "¿Cómo estuvo tu energía durante la semana?", helperText: "Más alto es mejor.", scale: { minimumLabel: "Muy baja", maximumLabel: "Muy alta" } },
    sleep: { title: "Sueño", prompt: "¿Cómo fue la calidad de tu sueño esta semana?", helperText: "Piensa en la constancia y la recuperación, no en una sola noche.", scale: { minimumLabel: "Mala", maximumLabel: "Excelente" } },
    stress: { title: "Estrés", prompt: "¿Qué tan manejable fue tu estrés esta semana?", helperText: "Más alto significa que el estrés fue más fácil de manejar.", scale: { minimumLabel: "Difícil", maximumLabel: "Muy manejable" } },
    recovery: { title: "Recuperación", prompt: "¿Qué tan bien te recuperaste entre sesiones?", helperText: "Considera dolor muscular, frescura y cómo te sentiste al entrenar.", scale: { minimumLabel: "Mala", maximumLabel: "Buena" } },
    pain_discomfort: { title: "Dolor o molestia", prompt: "¿Notaste algo doloroso o preocupante al entrenar o recuperarte?", helperText: "Si algo no iba bien, márcalo. La revisión sigue siendo calmada y privada." },
    weekly_notes: { title: "Notas semanales", prompt: "¿Algo más que AthlexForce deba saber?", helperText: "Bastan notas cortas. Aquí va el contexto." }
  },
  ca: {
    training_adherence: { title: "Adherència a l'entrenament", prompt: "Fins a quin punt vas seguir el pla d'entrenament aquesta setmana?", helperText: "Fes servir tota l'escala. Baix no vol dir fracàs; només ajuda a una revisió honesta.", scale: { minimumLabel: "Gens", maximumLabel: "Totalment" } },
    nutrition_adherence: { title: "Adherència a la nutrició", prompt: "Fins a quin punt vas seguir el pla de nutrició aquesta setmana?", helperText: "Tria el nivell que millor representi tota la setmana, no només un dia.", scale: { minimumLabel: "Desviat", maximumLabel: "Molt constant" } },
    energy: { title: "Energia", prompt: "Com ha estat la teva energia durant la setmana?", helperText: "Més alt és millor.", scale: { minimumLabel: "Molt baixa", maximumLabel: "Molt alta" } },
    sleep: { title: "Son", prompt: "Com ha estat la qualitat del teu son aquesta setmana?", helperText: "Pensa en la constància i la recuperació, no en una sola nit.", scale: { minimumLabel: "Dolent", maximumLabel: "Excel·lent" } },
    stress: { title: "Estrès", prompt: "Com de manejable ha estat l'estrès aquesta setmana?", helperText: "Més alt vol dir que l'estrès ha estat més fàcil de gestionar.", scale: { minimumLabel: "Difícil", maximumLabel: "Molt manejable" } },
    recovery: { title: "Recuperació", prompt: "Com t'has recuperat entre sessions?", helperText: "Tingues en compte el dolor muscular, la disposició i com t'has sentit en entrenar.", scale: { minimumLabel: "Dolenta", maximumLabel: "Bona" } },
    pain_discomfort: { title: "Dolor o molèstia", prompt: "Has notat alguna cosa dolorosa o preocupant entrenant o recuperant-te?", helperText: "Si alguna cosa no anava bé, marca-ho. La revisió continua sent tranquil·la i privada." },
    weekly_notes: { title: "Notes setmanals", prompt: "Hi ha res més que AthlexForce hagi de saber?", helperText: "N'hi ha prou amb notes curtes. Aquí va el context." }
  },
  de: {
    training_adherence: { title: "Trainingsadhärenz", prompt: "Wie konsequent bist du diese Woche dem Trainingsplan gefolgt?", helperText: "Nutze die ganze Skala. Niedrig bedeutet nicht Versagen; es hilft nur einer ehrlichen Bewertung.", scale: { minimumLabel: "Gar nicht", maximumLabel: "Vollständig" } },
    nutrition_adherence: { title: "Ernährungsadhärenz", prompt: "Wie genau bist du diese Woche dem Ernährungsplan gefolgt?", helperText: "Wähle den Wert, der die ganze Woche am besten beschreibt, nicht nur einen Tag.", scale: { minimumLabel: "Abweichend", maximumLabel: "Sehr konstant" } },
    energy: { title: "Energie", prompt: "Wie war deine Energie über die Woche?", helperText: "Höher ist besser.", scale: { minimumLabel: "Sehr niedrig", maximumLabel: "Sehr hoch" } },
    sleep: { title: "Schlaf", prompt: "Wie war deine Schlafqualität diese Woche?", helperText: "Denke an Konstanz und Erholung, nicht an eine einzelne Nacht.", scale: { minimumLabel: "Schlecht", maximumLabel: "Exzellent" } },
    stress: { title: "Stress", prompt: "Wie gut war dein Stress diese Woche zu bewältigen?", helperText: "Höher heißt, der Stress war leichter zu handhaben.", scale: { minimumLabel: "Schwer", maximumLabel: "Sehr gut bewältigbar" } },
    recovery: { title: "Erholung", prompt: "Wie gut hast du dich zwischen den Sessions erholt?", helperText: "Berücksichtige Muskelkater, Bereitschaft und dein Gefühl an Trainingstagen.", scale: { minimumLabel: "Schlecht", maximumLabel: "Gut" } },
    pain_discomfort: { title: "Schmerz oder Unwohlsein", prompt: "Gab es etwas Schmerzhaftes oder Besorgniserregendes beim Training oder in der Erholung?", helperText: "Wenn sich etwas nicht gut angefühlt hat, markiere es. Die Bewertung bleibt ruhig und privat." },
    weekly_notes: { title: "Wöchentliche Notizen", prompt: "Gibt es noch etwas, das AthlexForce wissen sollte?", helperText: "Kurze Notizen reichen. Hier gehört der Kontext hin." }
  }
};

export function getWeeklyCheckinQuestions(locale: Locale = getCurrentLocale()) {
  const copy = checkinQuestionCopy[locale] ?? checkinQuestionCopy.en;
  return weeklyCheckinQuestions.map((question) => {
    const localized = copy[question.key];
    return {
      ...question,
      ...(localized
        ? {
            title: localized.title,
            prompt: localized.prompt,
            helperText: localized.helperText,
            scale: localized.scale
              ? {
                  minimum: question.scale?.minimum ?? 1,
                  maximum: question.scale?.maximum ?? 5,
                  minimumLabel: localized.scale.minimumLabel,
                  maximumLabel: localized.scale.maximumLabel
                }
              : question.scale,
            options: question.options?.map((option) => ({
              ...option,
              label:
                locale === "es"
                  ? option.id === "none"
                    ? "Ninguno"
                    : option.id === "mild"
                      ? "Leve"
                      : option.id === "moderate"
                        ? "Moderado"
                        : "Alto"
                  : locale === "ca"
                    ? option.id === "none"
                      ? "Cap"
                      : option.id === "mild"
                        ? "Lleu"
                        : option.id === "moderate"
                          ? "Moderat"
                          : "Alt"
                    : locale === "de"
                      ? option.id === "none"
                        ? "Keins"
                        : option.id === "mild"
                          ? "Leicht"
                          : option.id === "moderate"
                            ? "Mittel"
                            : "Hoch"
                      : option.label
            }))
          }
        : question)
    };
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function resolveWeeklyCheckinWindow(dateKey: string) {
  const anchor = new Date(`${dateKey.slice(0, 10)}T00:00:00.000Z`);
  const start = addDays(anchor, -anchor.getUTCDay());
  const end = addDays(start, 6);

  return {
    weekStartDate: formatDateKey(start),
    weekEndDate: formatDateKey(end)
  };
}

export function getWeeklyCheckinQuestion(questionKey: string) {
  return weeklyCheckinQuestions.find((question) => question.key === questionKey) ?? null;
}

export function createEmptyWeeklyCheckinResponses() {
  return weeklyCheckinQuestions.map<WeeklyCheckinResponseDraft>((question) => ({
    questionKey: question.key,
    responseType: question.responseType,
    numericValue: null,
    textValue: null,
    booleanValue: null,
    choiceValue: null,
    jsonValue: null,
    answeredAt: null
  }));
}

function scoreToSignal(score: number | null | undefined) {
  if (typeof score !== "number") {
    return false;
  }

  return score <= 2;
}

export function deriveWeeklyCheckinReviewSummary(signals: WeeklyCheckinSummarySignal): WeeklyCheckinReviewSummary {
  const triggerKeys: string[] = [];

  if (signals.painFlag) {
    triggerKeys.push("pain_discomfort");
  }

  if (signals.lowRecoveryFlag || scoreToSignal(signals.recoveryScore)) {
    triggerKeys.push("recovery");
  }

  if (signals.lowEnergyFlag || scoreToSignal(signals.energyScore)) {
    triggerKeys.push("energy");
  }

  if (signals.lowSleepFlag || scoreToSignal(signals.sleepScore)) {
    triggerKeys.push("sleep");
  }

  if (signals.lowStressControlFlag || scoreToSignal(signals.stressScore)) {
    triggerKeys.push("stress");
  }

  if (scoreToSignal(signals.trainingAdherenceScore)) {
    triggerKeys.push("training_adherence");
  }

  if (scoreToSignal(signals.nutritionAdherenceScore)) {
    triggerKeys.push("nutrition_adherence");
  }

  const trainingRatio = signals.plannedScheduledWorkouts > 0 ? signals.completedScheduledWorkouts / signals.plannedScheduledWorkouts : 0;
  const nutritionRatio = signals.plannedNutritionDays > 0 ? signals.completedNutritionDays / signals.plannedNutritionDays : 0;

  if (trainingRatio < 0.5) {
    triggerKeys.push("training_adherence");
  }

  if (nutritionRatio < 0.5) {
    triggerKeys.push("nutrition_adherence");
  }

  const status: WeeklyCheckinReviewStatus = triggerKeys.length === 0 ? "pending" : "needs_attention";
  const recommendationType: WeeklyCheckinRecommendationType =
    triggerKeys.includes("pain_discomfort") || triggerKeys.includes("recovery")
      ? "coach_review"
      : triggerKeys.length > 0
        ? "light_review"
        : "none";

  const recommendationLabel =
    recommendationType === "coach_review"
      ? "Coach review required"
      : recommendationType === "light_review"
        ? "Light review recommended"
        : "No review required";

  const summary =
    triggerKeys.length === 0
      ? "The week looks stable and the active program can remain in place."
      : recommendationType === "coach_review"
        ? "A safety-sensitive signal was captured. Keep the current program stable until someone reviews it."
        : "A few adherence signals are softer this week, so the review should stay visible without mutating the program.";

  return {
    status,
    recommendationType,
    reviewReason: {
      triggerKeys,
      summary,
      signals,
      source: "deterministic"
    },
    reviewNotes: null,
    recommendationLabel
  };
}

export function getWeeklyCheckinQuestionIndex(questionKey: string) {
  return weeklyCheckinQuestions.findIndex((question) => question.key === questionKey);
}

export function computeSignalFromScoredQuestions(scores: {
  training_adherence?: number | null;
  nutrition_adherence?: number | null;
  energy?: number | null;
  sleep?: number | null;
  stress?: number | null;
  recovery?: number | null;
  pain_discomfort?: string | null;
}) {
  return {
    completedScheduledWorkouts: 0,
    plannedScheduledWorkouts: 0,
    completedNutritionDays: 0,
    plannedNutritionDays: 0,
    progressEntries: 0,
    trainingAdherenceScore: scores.training_adherence ?? null,
    nutritionAdherenceScore: scores.nutrition_adherence ?? null,
    energyScore: scores.energy ?? null,
    sleepScore: scores.sleep ?? null,
    stressScore: scores.stress ?? null,
    recoveryScore: scores.recovery ?? null,
    painDescriptor: scores.pain_discomfort ?? null,
    painFlag: Boolean(scores.pain_discomfort && scores.pain_discomfort !== "none"),
    lowRecoveryFlag: scoreToSignal(scores.recovery),
    lowEnergyFlag: scoreToSignal(scores.energy),
    lowSleepFlag: scoreToSignal(scores.sleep),
    lowStressControlFlag: scoreToSignal(scores.stress)
  } satisfies WeeklyCheckinSummarySignal;
}
import { getCurrentLocale, type Locale } from "@/lib/i18n";
