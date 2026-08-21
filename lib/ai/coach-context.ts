import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProgressStateFromPersistedSnapshot, loadPersistedProgressSnapshot } from "@/lib/progress-service";
import { createProgressDemoState } from "@/lib/progress-data";
import { buildWeeklyCheckinSummary, getWeeklyCheckinReviewState } from "@/lib/checkin-service";
import { resolveWeeklyCheckinWindow } from "@/lib/checkin-data";
import { getRecentExercisePerformanceForKeys, getWorkoutHistory } from "@/lib/workout-session-service";
import { getProgramDaySummary, loadProgramBundle } from "@/lib/program-service";
import { loadAthleteSnapshot } from "@/lib/athlete-service";
import type { Database, NutritionDaysRow, NutritionDaySelectionsRow, NutritionHydrationLogsRow, NutritionMealSlotsRow, NutritionPlansRow, NutritionSupplementLogsRow, WeeklyCheckinResponsesRow, WeeklyCheckinReviewsRow, WeeklyCheckinsRow } from "@/lib/supabase/database.types";
import type { CoachRecommendationContext, CoachRecommendationContextAthlete, CoachRecommendationContextCheckIn, CoachRecommendationContextNutrition, CoachRecommendationContextProgress, CoachRecommendationContextProgram, CoachRecommendationContextWorkout } from "@/lib/ai/schemas";

const MAX_ITEMS = 5;

function limit<T>(items: T[], count = MAX_ITEMS) {
  return items.slice(0, count);
}

function formatMacroLine(calories: number | null, protein: number | null, carbs: number | null, fat: number | null) {
  if ([calories, protein, carbs, fat].some((item) => typeof item !== "number")) {
    return null;
  }

  return `${calories} kcal · ${protein}P · ${carbs}C · ${fat}F`;
}

function formatPerformanceSummary(exerciseKey: string, performance: unknown) {
  if (!performance || typeof performance !== "object") {
    return null;
  }

  const summary = performance as {
    lastWeightKg?: number | null;
    lastReps?: number | null;
    lastRir?: number | null;
    lastCompletedAt?: string | null;
  };

  const pieces = [
    exerciseKey.replaceAll("-", " "),
    summary.lastWeightKg != null ? `${summary.lastWeightKg} kg` : null,
    summary.lastReps != null ? `${summary.lastReps} reps` : null,
    summary.lastRir != null ? `RIR ${summary.lastRir}` : null
  ].filter((item): item is string => Boolean(item));

  return pieces.join(" · ");
}

async function loadNutritionContext(client: SupabaseClient<Database>, userId: string): Promise<CoachRecommendationContextNutrition> {
  const dayResult = await client.from("nutrition_days").select("*").eq("user_id", userId).order("calendar_date", { ascending: false }).limit(1).maybeSingle();

  if (dayResult.error || !dayResult.data) {
    return {
      planName: null,
      status: "missing",
      dayType: "missing",
      calendarDate: null,
      calorieTarget: null,
      macroTarget: null,
      mealProgress: {
        plannedMeals: 0,
        selectedMeals: 0,
        eatenMeals: 0,
        hydrationMl: 0,
        hydrationTargetMl: null,
        supplementsCompleted: 0,
        supplementsTotal: 0
      },
      safetyHighlights: []
    };
  }

  const dayRow = dayResult.data as NutritionDaysRow;
  const [planResult, slotResult] = await Promise.all([
    client.from("nutrition_plans").select("*").eq("id", dayRow.nutrition_plan_id).maybeSingle(),
    client.from("nutrition_meal_slots").select("*").eq("nutrition_day_id", dayRow.id).order("sort_order", { ascending: true })
  ]);

  if (planResult.error) {
    throw planResult.error;
  }

  if (slotResult.error) {
    throw slotResult.error;
  }

  const slots = (slotResult.data ?? []) as NutritionMealSlotsRow[];
  const slotIds = slots.map((slot) => slot.id);
  const [optionResult, selectionResult, hydrationResult, supplementResult] = await Promise.all([
    slotIds.length
      ? client.from("nutrition_meal_options").select("*").in("meal_slot_id", slotIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    client.from("nutrition_day_selections").select("*").eq("nutrition_day_id", dayRow.id),
    client.from("nutrition_hydration_logs").select("*").eq("nutrition_day_id", dayRow.id),
    client.from("nutrition_supplement_logs").select("*").eq("nutrition_day_id", dayRow.id)
  ]);

  if (optionResult.error) {
    throw optionResult.error;
  }

  if (selectionResult.error) {
    throw selectionResult.error;
  }

  if (hydrationResult.error) {
    throw hydrationResult.error;
  }

  if (supplementResult.error) {
    throw supplementResult.error;
  }

  const selectionRows = (selectionResult.data ?? []) as NutritionDaySelectionsRow[];
  const hydrationRows = (hydrationResult.data ?? []) as NutritionHydrationLogsRow[];
  const supplementRows = (supplementResult.data ?? []) as NutritionSupplementLogsRow[];
  const selectedMeals = selectionRows.filter((row) => row.status === "selected" || row.status === "eaten").length;
  const eatenMeals = selectionRows.filter((row) => row.status === "eaten").length;
  const hydrationMl = hydrationRows.reduce((total, entry) => total + entry.amount_ml, 0);
  const completedSupplements = supplementRows.filter((row) => row.status === "completed").length;
  const dayMetadata = dayRow.day_metadata && typeof dayRow.day_metadata === "object" && !Array.isArray(dayRow.day_metadata) ? (dayRow.day_metadata as Record<string, unknown>) : null;
  const safetyProfile = dayMetadata?.safetyProfile && typeof dayMetadata.safetyProfile === "object" && !Array.isArray(dayMetadata.safetyProfile)
    ? (dayMetadata.safetyProfile as Record<string, unknown>)
    : null;

  return {
    planName: planResult.data ? (planResult.data as NutritionPlansRow).name : null,
    status: (planResult.data ? (planResult.data as NutritionPlansRow).status : "missing") as CoachRecommendationContextNutrition["status"],
    dayType: dayRow.day_type,
    calendarDate: dayRow.calendar_date,
    calorieTarget: dayRow.calorie_target,
    macroTarget: formatMacroLine(dayRow.calorie_target, dayRow.protein_target_g, dayRow.carb_target_g, dayRow.fat_target_g),
    mealProgress: {
      plannedMeals: slots.length,
      selectedMeals,
      eatenMeals,
      hydrationMl,
      hydrationTargetMl: dayRow.water_target_ml,
      supplementsCompleted: completedSupplements,
      supplementsTotal: supplementRows.length
    },
    safetyHighlights: [
      ...(Array.isArray(safetyProfile?.allergies) ? (safetyProfile.allergies as string[]) : []),
      ...(Array.isArray(safetyProfile?.restrictions) ? (safetyProfile.restrictions as string[]) : []),
      ...(Array.isArray(safetyProfile?.intolerances) ? (safetyProfile.intolerances as string[]) : [])
    ]
      .filter((item): item is string => typeof item === "string")
      .slice(0, 6)
  };
}

async function loadWeeklyCheckInContext(client: SupabaseClient<Database>, userId: string): Promise<CoachRecommendationContextCheckIn> {
  const checkinResult = await client
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkinResult.error || !checkinResult.data) {
    return {
      weekStartDate: null,
      weekEndDate: null,
      status: null,
      reviewLabel: "No weekly check-in yet",
      reviewSummary: "No submitted weekly check-in is available yet.",
      triggerKeys: [],
      adherence: {
        training: null,
        nutrition: null
      }
    };
  }

  const checkinRow = checkinResult.data as WeeklyCheckinsRow;
  const responsesResult = await client.from("weekly_checkin_responses").select("*").eq("weekly_checkin_id", checkinRow.id).order("created_at", { ascending: true });
  if (responsesResult.error) {
    throw responsesResult.error;
  }

  const reviewResult = await client.from("weekly_checkin_reviews").select("*").eq("weekly_checkin_id", checkinRow.id).maybeSingle();
  if (reviewResult.error) {
    throw reviewResult.error;
  }

  const window = resolveWeeklyCheckinWindow(checkinRow.week_start_date);
  const [workoutsResult, nutritionResult, progressResult] = await Promise.all([
    client
      .from("scheduled_workouts")
      .select("status")
      .eq("user_id", userId)
      .gte("scheduled_date", window.weekStartDate)
      .lte("scheduled_date", window.weekEndDate),
    client
      .from("nutrition_days")
      .select("status")
      .eq("user_id", userId)
      .gte("calendar_date", window.weekStartDate)
      .lte("calendar_date", window.weekEndDate),
    client
      .from("progress_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("entry_date", window.weekStartDate)
      .lte("entry_date", window.weekEndDate)
  ]);

  if (workoutsResult.error) {
    throw workoutsResult.error;
  }

  if (nutritionResult.error) {
    throw nutritionResult.error;
  }

  if (progressResult.error) {
    throw progressResult.error;
  }

  const workoutRows = (workoutsResult.data ?? []) as Array<{ status: string }>;
  const nutritionRows = (nutritionResult.data ?? []) as Array<{ status: string }>;
  const progressRows = progressResult.data ?? [];

  const summary = buildWeeklyCheckinSummary(window.weekStartDate, window.weekEndDate, {
    completedScheduledWorkouts: workoutRows.filter((row) => row.status === "completed").length,
    plannedScheduledWorkouts: workoutRows.filter((row) => row.status !== "cancelled").length,
    completedNutritionDays: nutritionRows.filter((row) => row.status === "completed").length,
    plannedNutritionDays: nutritionRows.length,
    progressEntries: progressRows.length
  }, (responsesResult.data ?? []) as WeeklyCheckinResponsesRow[]);

  const review = reviewResult.data as WeeklyCheckinReviewsRow | null;
  const reviewState = review ? getWeeklyCheckinReviewState(review, summary) : summary.review;

  return {
    weekStartDate: checkinRow.week_start_date,
    weekEndDate: checkinRow.week_end_date,
    status: checkinRow.status,
    reviewLabel: reviewState.recommendationLabel,
    reviewSummary: reviewState.summary,
    triggerKeys: review ? (review.review_reason && typeof review.review_reason === "object" && !Array.isArray(review.review_reason) && Array.isArray((review.review_reason as Record<string, unknown>).triggerKeys) ? ((review.review_reason as Record<string, unknown>).triggerKeys as string[]).filter((item) => typeof item === "string") : []) : summary.reviewReason.triggerKeys,
    adherence: {
      training: summary.adherencePercent.training,
      nutrition: summary.adherencePercent.nutrition
    }
  };
}

async function loadProgressContext(client: SupabaseClient<Database>, userId: string): Promise<CoachRecommendationContextProgress> {
  const snapshot = await loadPersistedProgressSnapshot(client, userId);

  if (!snapshot) {
    return {
      trendSummary: "No persisted progress history yet.",
      latestMeasurements: [],
      lastSavedAt: null
    };
  }

  const state = buildProgressStateFromPersistedSnapshot(createProgressDemoState(), snapshot);
  const latestRows = state.measurement.lastSavedRows.slice().reverse();
  const latestMeasurements = latestRows
    .map((row) => `${row.label}: ${row.currentValue?.toFixed?.(1) ?? row.currentValue} ${row.unit}`)
    .slice(0, 4);

  return {
    trendSummary: state.trends.currentTrendSummary,
    latestMeasurements,
    lastSavedAt: state.measurement.savedAt ?? null
  };
}

async function loadProgramContext(client: SupabaseClient<Database>, userId: string): Promise<CoachRecommendationContextProgram> {
  const bundle = await loadProgramBundle(client, userId);
  const dateKey = new Date().toISOString().slice(0, 10);
  const summary = bundle ? getProgramDaySummary(bundle, dateKey) : null;
  const recentExerciseKeys = bundle?.templateExercises.slice(0, 5).map((exercise) => exercise.exercise_key) ?? [];
  const recentPerformanceMap = recentExerciseKeys.length > 0 ? await getRecentExercisePerformanceForKeys(client, userId, recentExerciseKeys) : new Map<string, unknown>();
  const recentPerformanceSummary = recentExerciseKeys
    .map((exerciseKey) => formatPerformanceSummary(exerciseKey, recentPerformanceMap.get(exerciseKey)))
    .filter((item): item is string => Boolean(item));

  const recentSessions = await getWorkoutHistory(client, userId);

  return {
    id: bundle?.activeProgram?.id ?? null,
    phaseLabel: bundle?.program?.phaseLabel ?? "Phase 1",
    goal: bundle?.program?.goal ?? "Training goal not set",
    status: bundle?.activeProgram?.status ?? "missing",
    currentDayLabel: summary?.dateLabel ?? dateKey,
    currentWorkoutLabel: summary?.workoutTitle ?? "No active workout",
    scheduledWorkoutCount: bundle?.scheduledWorkouts.length ?? 0,
    recentExerciseKeys,
    recentPerformanceSummary,
    recentSessions: recentSessions.slice(0, 3).map((session) => ({
      id: session.id,
      completedAt: session.completed_at ?? session.created_at,
      durationMinutes: session.duration_seconds != null ? Math.round(session.duration_seconds / 60) : null,
      notes: session.notes
    }))
  };
}

async function loadAthleteContext(client: SupabaseClient<Database>, userId: string): Promise<CoachRecommendationContextAthlete> {
  const snapshot = await loadAthleteSnapshot(client, userId);
  const profile = snapshot.snapshot.profile;

  return {
    locale: profile.locale,
    displayName: profile.name,
    onboardingStatus: snapshot.onboardingStatus,
    goal: snapshot.snapshot.goals.mainGoal,
    priorities: limit(snapshot.snapshot.goals.priorities, 5),
    trainingDaysPerWeek: snapshot.snapshot.trainingPreferences.daysPerWeek,
    scheduleSnapshot: [
      snapshot.snapshot.trainingPreferences.duration,
      snapshot.snapshot.trainingPreferences.location,
      snapshot.snapshot.scheduleLifestyle.workSchedule,
      snapshot.snapshot.scheduleLifestyle.sleepQuality
    ].filter((item): item is string => Boolean(item)),
    nutritionSnapshot: [
      snapshot.snapshot.nutritionPreferences.mealFrequency,
      snapshot.snapshot.nutritionPreferences.budget,
      snapshot.snapshot.nutritionPreferences.variety
    ].filter((item): item is string => Boolean(item)),
    healthSnapshot: {
      currentPain: snapshot.snapshot.healthLimitations.currentPain.trim() || null,
      coachReviewRequired: snapshot.snapshot.healthLimitations.coachReviewRequired,
      movementLimitations: limit(snapshot.snapshot.healthLimitations.movementLimitations, 5),
      allergies: limit(snapshot.snapshot.nutritionPreferences.allergies, 5)
    }
  };
}

function createFallbackContextSummary(context: CoachRecommendationContext) {
  return {
    athlete: context.athlete,
    program: context.program,
    nutrition: context.nutrition,
    progress: context.progress,
    checkIn: context.checkIn
  };
}

export async function buildCoachRecommendationContext(client: SupabaseClient<Database>, userId: string, contextType: CoachRecommendationContext["contextType"], contextKey: string): Promise<CoachRecommendationContext> {
  const [athlete, program, nutrition, progress, checkIn] = await Promise.all([
    loadAthleteContext(client, userId),
    loadProgramContext(client, userId),
    loadNutritionContext(client, userId),
    loadProgressContext(client, userId),
    loadWeeklyCheckInContext(client, userId)
  ]);

  return {
    contextType,
    contextKey,
    generatedAt: new Date().toISOString(),
    locale: athlete.locale,
    athlete,
    program,
    workout: {
      recentSessions: program.recentSessions
    },
    nutrition,
    progress,
    checkIn
  };
}

export function summarizeCoachContext(context: CoachRecommendationContext) {
  return createFallbackContextSummary(context);
}
