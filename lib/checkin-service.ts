import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  NutritionDayStatus,
  ScheduledWorkoutStatus,
  WeeklyCheckinRecommendationType,
  WeeklyCheckinResponseType,
  WeeklyCheckinReviewStatus,
  WeeklyCheckinResponsesInsert,
  WeeklyCheckinResponsesRow,
  WeeklyCheckinReviewsInsert,
  WeeklyCheckinReviewsRow,
  WeeklyCheckinsInsert,
  WeeklyCheckinsRow
} from "@/lib/supabase/database.types";
import {
  computeSignalFromScoredQuestions,
  deriveWeeklyCheckinReviewSummary,
  getWeeklyCheckinQuestion,
  resolveWeeklyCheckinWindow,
  type WeeklyCheckinResponseDraft,
  type WeeklyCheckinSummarySignal
} from "@/lib/checkin-data";

const weeklyCheckinRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  program_id: z.string().uuid().nullable(),
  program_phase_id: z.string().uuid().nullable(),
  week_start_date: z.string(),
  week_end_date: z.string(),
  status: z.enum(["not_started", "in_progress", "completed", "submitted", "reviewed"]),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  submitted_at: z.string().nullable(),
  overall_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

const weeklyCheckinResponseRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  weekly_checkin_id: z.string().uuid(),
  question_key: z.string(),
  response_type: z.enum(["scale", "boolean", "text", "single_choice", "multiple_choice", "numeric"]),
  numeric_value: z.number().nullable(),
  text_value: z.string().nullable(),
  boolean_value: z.boolean().nullable(),
  choice_value: z.string().nullable(),
  json_value: z.unknown().nullable(),
  answered_at: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

const weeklyCheckinReviewRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  weekly_checkin_id: z.string().uuid(),
  status: z.enum(["pending", "needs_attention", "reviewed", "acknowledged"]),
  review_reason: z.unknown(),
  review_notes: z.string().nullable(),
  recommendation_type: z.enum(["none", "light_review", "coach_review", "program_adjustment"]).nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  updated_at: z.string()
});

export interface WeeklyCheckinCounts {
  completedScheduledWorkouts: number;
  plannedScheduledWorkouts: number;
  completedNutritionDays: number;
  plannedNutritionDays: number;
  progressEntries: number;
}

export interface WeeklyCheckinSummary {
  weekStartDate: string;
  weekEndDate: string;
  counts: WeeklyCheckinCounts;
  adherencePercent: {
    training: number;
    nutrition: number;
  };
  responseSnapshot: Record<string, string | number | boolean | Json | null>;
  signals: WeeklyCheckinSummarySignal;
  reviewReason: {
    triggerKeys: string[];
    summary: string;
    signals: WeeklyCheckinSummarySignal;
    source: "deterministic";
  };
  review: {
    status: WeeklyCheckinReviewStatus;
    recommendationType: WeeklyCheckinRecommendationType;
    summary: string;
    recommendationLabel: string;
  };
}

export interface WeeklyCheckinSnapshot {
  checkin: WeeklyCheckinsRow;
  responses: WeeklyCheckinResponsesRow[];
  review: WeeklyCheckinReviewsRow | null;
  summary: WeeklyCheckinSummary;
  source: "remote" | "created" | "demo";
}

export interface WeeklyCheckinResponseInput {
  questionKey: string;
  responseType: WeeklyCheckinResponseType;
  numericValue?: number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  choiceValue?: string | null;
  jsonValue?: Json | null;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function parseWeeklyCheckinRow(row: unknown) {
  return weeklyCheckinRowSchema.parse(row) as WeeklyCheckinsRow;
}

function parseWeeklyCheckinResponseRow(row: unknown) {
  return weeklyCheckinResponseRowSchema.parse(row) as WeeklyCheckinResponsesRow;
}

function parseWeeklyCheckinReviewRow(row: unknown) {
  return weeklyCheckinReviewRowSchema.parse(row) as WeeklyCheckinReviewsRow;
}

function getNumericResponseValue(responses: WeeklyCheckinResponsesRow[], questionKey: string) {
  return responses.find((response) => response.question_key === questionKey)?.numeric_value ?? null;
}

function getChoiceResponseValue(responses: WeeklyCheckinResponsesRow[], questionKey: string) {
  return responses.find((response) => response.question_key === questionKey)?.choice_value ?? null;
}

function getTextResponseValue(responses: WeeklyCheckinResponsesRow[], questionKey: string) {
  return responses.find((response) => response.question_key === questionKey)?.text_value ?? null;
}

function buildSignalsFromResponses(
  counts: WeeklyCheckinCounts,
  responses: WeeklyCheckinResponsesRow[]
): WeeklyCheckinSummarySignal {
  const trainingAdherenceScore = getNumericResponseValue(responses, "training_adherence");
  const nutritionAdherenceScore = getNumericResponseValue(responses, "nutrition_adherence");
  const energyScore = getNumericResponseValue(responses, "energy");
  const sleepScore = getNumericResponseValue(responses, "sleep");
  const stressScore = getNumericResponseValue(responses, "stress");
  const recoveryScore = getNumericResponseValue(responses, "recovery");
  const painDescriptor = getChoiceResponseValue(responses, "pain_discomfort");

  return {
    ...counts,
    trainingAdherenceScore,
    nutritionAdherenceScore,
    energyScore,
    sleepScore,
    stressScore,
    recoveryScore,
    painDescriptor,
    painFlag: Boolean(painDescriptor && painDescriptor !== "none"),
    lowRecoveryFlag: recoveryScore != null ? recoveryScore <= 2 : false,
    lowEnergyFlag: energyScore != null ? energyScore <= 2 : false,
    lowSleepFlag: sleepScore != null ? sleepScore <= 2 : false,
    lowStressControlFlag: stressScore != null ? stressScore <= 2 : false
  };
}

function computeAdherencePercent(completed: number, planned: number) {
  if (planned <= 0) {
    return 0;
  }

  return Math.round((completed / planned) * 100);
}

async function loadWeeklyCounts(client: SupabaseClient<Database>, userId: string, weekStartDate: string, weekEndDate: string): Promise<WeeklyCheckinCounts> {
  const [workoutsResult, nutritionResult, progressResult] = await Promise.all([
    client
      .from("scheduled_workouts")
      .select("status")
      .eq("user_id", userId)
      .gte("scheduled_date", weekStartDate)
      .lte("scheduled_date", weekEndDate),
    client
      .from("nutrition_days")
      .select("status")
      .eq("user_id", userId)
      .gte("calendar_date", weekStartDate)
      .lte("calendar_date", weekEndDate),
    client
      .from("progress_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("entry_date", weekStartDate)
      .lte("entry_date", weekEndDate)
  ]);

  for (const result of [workoutsResult, nutritionResult, progressResult]) {
    if (result.error) {
      throw result.error;
    }
  }

  const scheduledWorkouts = (workoutsResult.data ?? []) as Array<{ status: ScheduledWorkoutStatus }>;
  const nutritionDays = (nutritionResult.data ?? []) as Array<{ status: NutritionDayStatus }>;
  const progressEntries = progressResult.data?.length ?? 0;

  return {
    completedScheduledWorkouts: scheduledWorkouts.filter((item) => item.status === "completed").length,
    plannedScheduledWorkouts: scheduledWorkouts.filter((item) => item.status !== "cancelled").length,
    completedNutritionDays: nutritionDays.filter((item) => item.status === "completed").length,
    plannedNutritionDays: nutritionDays.length,
    progressEntries
  };
}

export function buildWeeklyCheckinSummary(
  weekStartDate: string,
  weekEndDate: string,
  counts: WeeklyCheckinCounts,
  responses: WeeklyCheckinResponsesRow[]
) {
  const signals = buildSignalsFromResponses(counts, responses);
  const review = deriveWeeklyCheckinReviewSummary(signals);

  return {
    weekStartDate,
    weekEndDate,
    counts,
    adherencePercent: {
      training: computeAdherencePercent(counts.completedScheduledWorkouts, counts.plannedScheduledWorkouts),
      nutrition: computeAdherencePercent(counts.completedNutritionDays, counts.plannedNutritionDays)
    },
    responseSnapshot: responses.reduce<Record<string, string | number | boolean | Json | null>>((accumulator, response) => {
      accumulator[response.question_key] =
        response.numeric_value ?? response.text_value ?? response.boolean_value ?? response.choice_value ?? response.json_value ?? null;
      return accumulator;
    }, {}),
    signals,
    reviewReason: {
      ...review.reviewReason,
      source: "deterministic"
    },
    review: {
      status: review.status,
      recommendationType: review.recommendationType,
      summary: review.reviewReason.summary,
      recommendationLabel: review.recommendationLabel
    }
  } satisfies WeeklyCheckinSummary;
}

export async function getOrCreateWeeklyCheckin(
  client: SupabaseClient<Database>,
  userId: string,
  dateKey: string,
  programId: string | null,
  programPhaseId: string | null
) {
  const { weekStartDate, weekEndDate } = resolveWeeklyCheckinWindow(dateKey);
  const existing = await client
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    const current = parseWeeklyCheckinRow(existing.data);

    if (current.status === "not_started") {
      const updated = await client
        .from("weekly_checkins")
        .update({
          status: "in_progress",
          started_at: current.started_at ?? new Date().toISOString(),
          program_id: programId ?? current.program_id,
          program_phase_id: programPhaseId ?? current.program_phase_id
        } as never)
        .eq("id", current.id)
        .select("*")
        .single();

      if (updated.error) {
        throw updated.error;
      }

      return { checkin: parseWeeklyCheckinRow(updated.data), source: "remote" as const };
    }

    return { checkin: current, source: "remote" as const };
  }

  const payload: WeeklyCheckinsInsert = {
    id: createId(),
    user_id: userId,
    program_id: programId,
    program_phase_id: programPhaseId,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    status: "in_progress",
    started_at: new Date().toISOString(),
    completed_at: null,
    submitted_at: null,
    overall_notes: null
  };

  const created = await client.from("weekly_checkins").insert(payload as never).select("*").single();

  if (created.error) {
    throw created.error;
  }

  return { checkin: parseWeeklyCheckinRow(created.data), source: "created" as const };
}

export async function loadWeeklyCheckinSnapshot(
  client: SupabaseClient<Database>,
  userId: string,
  dateKey: string,
  programId: string | null,
  programPhaseId: string | null
): Promise<WeeklyCheckinSnapshot> {
  const created = await getOrCreateWeeklyCheckin(client, userId, dateKey, programId, programPhaseId);
  const { weekStartDate, weekEndDate } = resolveWeeklyCheckinWindow(dateKey);
  const [responsesResult, reviewResult, counts] = await Promise.all([
    client
      .from("weekly_checkin_responses")
      .select("*")
      .eq("weekly_checkin_id", created.checkin.id)
      .order("created_at", { ascending: true }),
    client
      .from("weekly_checkin_reviews")
      .select("*")
      .eq("weekly_checkin_id", created.checkin.id)
      .maybeSingle(),
    loadWeeklyCounts(client, userId, weekStartDate, weekEndDate)
  ]);

  if (responsesResult.error) {
    throw responsesResult.error;
  }

  if (reviewResult.error) {
    throw reviewResult.error;
  }

  const responses = (responsesResult.data ?? []).map((row) => parseWeeklyCheckinResponseRow(row));
  const review = reviewResult.data ? parseWeeklyCheckinReviewRow(reviewResult.data) : null;
  const summary = buildWeeklyCheckinSummary(weekStartDate, weekEndDate, counts, responses);

  return {
    checkin: created.checkin,
    responses,
    review,
    summary,
    source: created.source
  };
}

export function createCheckinResponsePayload(
  userId: string,
  weeklyCheckinId: string,
  answer: WeeklyCheckinResponseInput
): WeeklyCheckinResponsesInsert {
  const question = getWeeklyCheckinQuestion(answer.questionKey);
  if (!question) {
    throw new Error(`Unknown weekly check-in question: ${answer.questionKey}`);
  }

  return {
    user_id: userId,
    weekly_checkin_id: weeklyCheckinId,
    question_key: answer.questionKey,
    response_type: answer.responseType,
    numeric_value: answer.numericValue ?? null,
    text_value: answer.textValue ?? null,
    boolean_value: answer.booleanValue ?? null,
    choice_value: answer.choiceValue ?? null,
    json_value: answer.jsonValue ?? null,
    answered_at: new Date().toISOString()
  };
}

export async function saveCheckinResponse(
  client: SupabaseClient<Database>,
  userId: string,
  weeklyCheckinId: string,
  answer: WeeklyCheckinResponseInput
) {
  const payload = createCheckinResponsePayload(userId, weeklyCheckinId, answer);
  const result = await client.from("weekly_checkin_responses").upsert(payload as never, { onConflict: "weekly_checkin_id,question_key" }).select("*").single();

  if (result.error) {
    throw result.error;
  }

  return parseWeeklyCheckinResponseRow(result.data);
}

export async function submitWeeklyCheckin(
  client: SupabaseClient<Database>,
  userId: string,
  weeklyCheckinId: string,
  overallNotes: string | null = null
) {
  const responsesResult = await client.from("weekly_checkin_responses").select("*").eq("weekly_checkin_id", weeklyCheckinId).order("created_at", { ascending: true });

  if (responsesResult.error) {
    throw responsesResult.error;
  }

  const responses = (responsesResult.data ?? []).map((row) => parseWeeklyCheckinResponseRow(row));
  const checkinResult = await client
    .from("weekly_checkins")
    .update({
      status: "submitted",
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      overall_notes: overallNotes
    } as never)
    .eq("id", weeklyCheckinId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (checkinResult.error) {
    throw checkinResult.error;
  }

  const checkin = parseWeeklyCheckinRow(checkinResult.data);
  const counts = await loadWeeklyCounts(client, userId, checkin.week_start_date, checkin.week_end_date);
  const summary = buildWeeklyCheckinSummary(checkin.week_start_date, checkin.week_end_date, counts, responses);
  const reviewPayload: WeeklyCheckinReviewsInsert = {
    user_id: userId,
    weekly_checkin_id: weeklyCheckinId,
    status: summary.review.recommendationType === "coach_review" || summary.review.recommendationType === "light_review" ? "needs_attention" : "pending",
    review_reason: summary.reviewReason as unknown as Json,
    review_notes: overallNotes,
    recommendation_type: summary.review.recommendationType
  };

  const reviewResult = await client.from("weekly_checkin_reviews").upsert(reviewPayload as never, { onConflict: "weekly_checkin_id" }).select("*").single();

  if (reviewResult.error) {
    throw reviewResult.error;
  }

  return {
    checkin,
    review: parseWeeklyCheckinReviewRow(reviewResult.data),
    summary
  };
}

export async function acknowledgeWeeklyCheckinReview(client: SupabaseClient<Database>, userId: string, weeklyCheckinId: string) {
  const result = await client
    .from("weekly_checkin_reviews")
    .update({
      status: "acknowledged",
      reviewed_at: new Date().toISOString()
    } as never)
    .eq("weekly_checkin_id", weeklyCheckinId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  return parseWeeklyCheckinReviewRow(result.data);
}

export function getCurrentQuestionKey(responses: WeeklyCheckinResponsesRow[]) {
  const questionOrder = ["training_adherence", "nutrition_adherence", "energy", "sleep", "stress", "recovery", "pain_discomfort", "weekly_notes"];
  const completedKeys = new Set(responses.map((response) => response.question_key));
  return questionOrder.find((key) => !completedKeys.has(key)) ?? "weekly_notes";
}

export function mapResponsesToDrafts(responses: WeeklyCheckinResponsesRow[]) {
  return responses.map<WeeklyCheckinResponseDraft>((response) => ({
    questionKey: response.question_key,
    responseType: response.response_type,
    numericValue: response.numeric_value,
    textValue: response.text_value,
    booleanValue: response.boolean_value,
    choiceValue: response.choice_value,
    jsonValue: (response.json_value ?? null) as Json | null,
    answeredAt: response.answered_at
  }));
}

export function getWeeklyCheckinReviewState(review: WeeklyCheckinReviewsRow | null, summary: WeeklyCheckinSummary) {
  if (!review) {
    return summary.review;
  }

  return {
    status: review.status,
    recommendationType: review.recommendation_type ?? summary.review.recommendationType,
    summary: typeof review.review_reason === "object" && review.review_reason && "summary" in review.review_reason ? String((review.review_reason as Record<string, unknown>).summary ?? summary.review.summary) : summary.review.summary,
    recommendationLabel: summary.review.recommendationLabel
  };
}
