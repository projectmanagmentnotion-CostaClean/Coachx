import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  coachRecommendationApplicationStatusSchema,
  coachRecommendationContextTypeSchema,
  coachRecommendationGenerationStatusSchema,
  coachRecommendationPayloadSchema,
  coachRecommendationSourceSchema,
  coachRecommendationTypeSchema,
  type CoachRecommendationContext,
  type CoachRecommendationPayload,
  type CoachRecommendationRecordView
} from "@/lib/ai/schemas";

export interface CoachRecommendationInsert {
  user_id: string;
  context_type: CoachRecommendationRecordView["contextType"];
  context_key: string;
  source: CoachRecommendationRecordView["source"];
  generation_status: CoachRecommendationRecordView["generationStatus"];
  model: string;
  prompt_version: string;
  title: string;
  summary: string;
  recommendation_type: CoachRecommendationRecordView["recommendationType"];
  recommendation_payload: Json;
  context_snapshot: Json;
  application_status: CoachRecommendationRecordView["applicationStatus"];
  applied_at: string | null;
  applied_change_summary: Json | null;
  error_message: string | null;
}

function parseRow(row: unknown) {
  const value = row as Record<string, unknown>;

  return {
    id: String(value.id),
    userId: String(value.user_id),
    contextType: coachRecommendationContextTypeSchema.parse(value.context_type),
    contextKey: String(value.context_key),
    source: coachRecommendationSourceSchema.parse(value.source),
    generationStatus: coachRecommendationGenerationStatusSchema.parse(value.generation_status),
    model: String(value.model),
    promptVersion: String(value.prompt_version),
    title: String(value.title),
    summary: String(value.summary),
    recommendationType: coachRecommendationTypeSchema.parse(value.recommendation_type),
    applicationStatus: coachRecommendationApplicationStatusSchema.parse(value.application_status),
    appliedAt: typeof value.applied_at === "string" ? value.applied_at : null,
    appliedChangeSummary: value.applied_change_summary && typeof value.applied_change_summary === "object" && !Array.isArray(value.applied_change_summary) ? (value.applied_change_summary as Record<string, unknown>) : null,
    fallbackReason: typeof value.error_message === "string" ? value.error_message : null,
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at),
    payload: coachRecommendationPayloadSchema.parse(value.recommendation_payload),
    contextSnapshot: value.context_snapshot as CoachRecommendationContext
  } satisfies CoachRecommendationRecordView;
}

export function parseCoachRecommendation(row: unknown) {
  return parseRow(row);
}

export async function getLatestCoachRecommendation(
  client: SupabaseClient<Database>,
  userId: string,
  contextType: CoachRecommendationRecordView["contextType"],
  contextKey: string
) {
  const result = await client
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("context_type", contextType)
    .eq("context_key", contextKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return parseRow(result.data);
}

export async function getCoachRecommendationById(client: SupabaseClient<Database>, userId: string, recommendationId: string) {
  const result = await client.from("ai_recommendations").select("*").eq("user_id", userId).eq("id", recommendationId).maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return parseRow(result.data);
}

export function buildCoachRecommendationInsert(
  userId: string,
  context: CoachRecommendationContext,
  result: {
    payload: CoachRecommendationPayload;
    source: CoachRecommendationRecordView["source"];
    model: string;
    generationStatus: CoachRecommendationRecordView["generationStatus"];
    errorMessage: string | null;
  }
): CoachRecommendationInsert {
  return {
    user_id: userId,
    context_type: context.contextType,
    context_key: context.contextKey,
    source: result.source,
    generation_status: result.generationStatus,
    model: result.model,
    prompt_version: "coachx-ai-v1",
    title: result.payload.title,
    summary: result.payload.summary,
    recommendation_type: result.payload.recommendationType,
    recommendation_payload: result.payload as unknown as Json,
    context_snapshot: context as unknown as Json,
    application_status: result.payload.application.status,
    applied_at: null,
    applied_change_summary: null,
    error_message: result.errorMessage
  };
}

export async function saveCoachRecommendation(
  client: SupabaseClient<Database>,
  userId: string,
  context: CoachRecommendationContext,
  result: {
    payload: CoachRecommendationPayload;
    source: CoachRecommendationRecordView["source"];
    model: string;
    generationStatus: CoachRecommendationRecordView["generationStatus"];
    errorMessage: string | null;
  }
) {
  const payload = buildCoachRecommendationInsert(userId, context, result);
  const response = await client.from("ai_recommendations").insert(payload as never).select("*").single();

  if (response.error) {
    throw response.error;
  }

  return parseRow(response.data);
}

export async function setCoachRecommendationApplicationStatus(
  client: SupabaseClient<Database>,
  userId: string,
  recommendationId: string,
  patch: {
    applicationStatus: CoachRecommendationRecordView["applicationStatus"];
    appliedAt?: string | null;
    appliedChangeSummary?: Json | null;
  }
) {
  const response = await client
    .from("ai_recommendations")
    .update({
      application_status: patch.applicationStatus,
      applied_at: patch.appliedAt ?? null,
      applied_change_summary: patch.appliedChangeSummary ?? null
    } as never)
    .eq("id", recommendationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (response.error) {
    throw response.error;
  }

  return parseRow(response.data);
}
