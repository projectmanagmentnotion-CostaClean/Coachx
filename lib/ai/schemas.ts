import { z } from "zod";
import type { Locale } from "@/lib/i18n";

export const coachRecommendationContextTypeSchema = z.enum(["weekly_checkin", "phase_review", "profile_review", "onboarding", "manual"]);

export const coachRecommendationSourceSchema = z.enum(["openai", "fallback"]);

export const coachRecommendationGenerationStatusSchema = z.enum(["generated", "fallback", "failed"]);

export const coachRecommendationApplicationStatusSchema = z.enum(["recommended", "reviewing", "applied", "rejected"]);

export const coachRecommendationTypeSchema = z.enum(["none", "light_review", "coach_review", "program_adjustment"]);

export const coachRecommendationPayloadSchema = z.object({
  source: coachRecommendationSourceSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  recommendationType: coachRecommendationTypeSchema,
  confidence: z.number().min(0).max(1),
  keySignals: z.array(z.string().min(1)).max(6),
  whatWorked: z.array(z.string().min(1)).max(6),
  whatHeldBack: z.array(z.string().min(1)).max(6),
  focusNext: z.array(z.string().min(1)).max(6),
  safetyNotes: z.array(z.string().min(1)).max(6),
  nextPhase: z.object({
    title: z.string().min(1),
    duration: z.string().min(1),
    summary: z.string().min(1),
    changes: z.array(z.string().min(1)).max(8),
    firstWorkout: z.string().min(1),
    nutrition: z.string().min(1),
    cardio: z.string().min(1),
    recovery: z.string().min(1),
    checkIn: z.string().min(1)
  }),
  application: z.object({
    status: coachRecommendationApplicationStatusSchema,
    canApplyAutomatically: z.literal(false),
    reason: z.string().min(1)
  }),
  fallbackReason: z.string().nullable()
});

export type CoachRecommendationPayload = z.infer<typeof coachRecommendationPayloadSchema>;

export interface CoachRecommendationContextAthlete {
  locale: Locale;
  displayName: string;
  onboardingStatus: "not_started" | "in_progress" | "completed";
  goal: string;
  priorities: string[];
  trainingDaysPerWeek: number;
  scheduleSnapshot: string[];
  nutritionSnapshot: string[];
  healthSnapshot: {
    currentPain: string | null;
    coachReviewRequired: boolean;
    movementLimitations: string[];
    allergies: string[];
  };
}

export interface CoachRecommendationContextProgram {
  id: string | null;
  phaseLabel: string;
  goal: string;
  status: "proposed" | "active" | "completed" | "archived" | "missing";
  currentDayLabel: string;
  currentWorkoutLabel: string;
  scheduledWorkoutCount: number;
  recentExerciseKeys: string[];
  recentPerformanceSummary: string[];
  recentSessions: Array<{
    id: string;
    completedAt: string;
    durationMinutes: number | null;
    notes: string | null;
  }>;
}

export interface CoachRecommendationContextWorkout {
  recentSessions: Array<{
    id: string;
    completedAt: string;
    durationMinutes: number | null;
    notes: string | null;
  }>;
}

export interface CoachRecommendationContextNutrition {
  planName: string | null;
  status: "proposed" | "active" | "completed" | "archived" | "missing";
  dayType: "training" | "rest" | "custom" | "missing";
  calendarDate: string | null;
  calorieTarget: number | null;
  macroTarget: string | null;
  mealProgress: {
    plannedMeals: number;
    selectedMeals: number;
    eatenMeals: number;
    hydrationMl: number;
    hydrationTargetMl: number | null;
    supplementsCompleted: number;
    supplementsTotal: number;
  };
  safetyHighlights: string[];
}

export interface CoachRecommendationContextProgress {
  trendSummary: string;
  latestMeasurements: string[];
  lastSavedAt: string | null;
}

export interface CoachRecommendationContextCheckIn {
  weekStartDate: string | null;
  weekEndDate: string | null;
  status: string | null;
  reviewLabel: string;
  reviewSummary: string;
  triggerKeys: string[];
  adherence: {
    training: number | null;
    nutrition: number | null;
  };
}

export interface CoachRecommendationContext {
  contextType: z.infer<typeof coachRecommendationContextTypeSchema>;
  contextKey: string;
  generatedAt: string;
  locale: Locale;
  athlete: CoachRecommendationContextAthlete;
  program: CoachRecommendationContextProgram;
  workout: CoachRecommendationContextWorkout;
  nutrition: CoachRecommendationContextNutrition;
  progress: CoachRecommendationContextProgress;
  checkIn: CoachRecommendationContextCheckIn;
}

export interface CoachRecommendationRecordView {
  id: string;
  userId: string;
  contextType: z.infer<typeof coachRecommendationContextTypeSchema>;
  contextKey: string;
  source: z.infer<typeof coachRecommendationSourceSchema>;
  generationStatus: z.infer<typeof coachRecommendationGenerationStatusSchema>;
  model: string;
  promptVersion: string;
  title: string;
  summary: string;
  recommendationType: z.infer<typeof coachRecommendationTypeSchema>;
  applicationStatus: z.infer<typeof coachRecommendationApplicationStatusSchema>;
  appliedAt: string | null;
  appliedChangeSummary: Record<string, unknown> | null;
  fallbackReason: string | null;
  createdAt: string;
  updatedAt: string;
  payload: CoachRecommendationPayload;
  contextSnapshot: CoachRecommendationContext;
}
