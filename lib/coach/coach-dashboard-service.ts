import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachRecommendationRecordView } from "@/lib/ai/schemas";
import type { ProgramChangeProposalRecordView } from "@/lib/recommendations/change-proposal-service";
import { isAssignedCoach } from "@/lib/coach/coach-auth-service";
import { createSnapshotFromRows, loadAthleteSnapshot } from "@/lib/athlete-service";
import { computeSignalFromScoredQuestions, deriveWeeklyCheckinReviewSummary, getWeeklyCheckinQuestion } from "@/lib/checkin-data";
import { loadProgramBundle, type ProgramBundleView } from "@/lib/program-service";
import { buildCoachAttentionReasons } from "@/lib/coach/coach-policy";
import type {
  Database,
  CoachAthleteAssignmentsRow,
  CoachProfilesRow,
  ProgressEntriesRow,
  ProgressMeasurementsRow,
  WeeklyCheckinResponsesRow,
  WeeklyCheckinReviewsRow,
  WeeklyCheckinsRow,
  AiRecommendationsRow,
  NutritionDaysRow,
  NutritionDaySelectionsRow,
  NutritionHydrationLogsRow,
  NutritionSupplementLogsRow,
  WorkoutSessionsRow,
  AthletePreferencesRow,
  AthleteProfilesRow
} from "@/lib/supabase/database.types";

function isMissingRelationError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /relation .* does not exist|does not exist|42P01/i.test(message);
}

export interface CoachAthleteSummary {
  athleteId: string;
  displayName: string;
  goal: string;
  phaseLabel: string;
  programStatus: string;
  latestCheckInStatus: string;
  latestCheckInLabel: string;
  latestRecommendationStatus: string;
  latestProposalStatus: string;
  attentionReasons: string[];
  lastActivityAt: string | null;
  trainingAdherenceLabel: string | null;
  nutritionAdherenceLabel: string | null;
}

export interface CoachAthleteDetailSummary {
  summary: CoachAthleteSummary;
  athleteProfile: AthleteProfilesRow | null;
  athletePreferences: AthletePreferencesRow | null;
  profileSnapshot: ReturnType<typeof createSnapshotFromRows>["snapshot"];
  activeProgram: ProgramBundleView | null;
  latestWeeklyCheckin: WeeklyCheckinsRow | null;
  latestWeeklyCheckinResponses: WeeklyCheckinResponsesRow[];
  latestWeeklyCheckinReview: WeeklyCheckinReviewsRow | null;
  recentRecommendations: CoachRecommendationRecordView[];
  recentProposals: ProgramChangeProposalRecordView[];
  recentProgressEntries: ProgressEntriesRow[];
  recentProgressMeasurements: ProgressMeasurementsRow[];
  recentWorkoutSessions: WorkoutSessionsRow[];
  nutritionDays: NutritionDaysRow[];
  nutritionSelections: NutritionDaySelectionsRow[];
  hydrationLogs: NutritionHydrationLogsRow[];
  supplementLogs: NutritionSupplementLogsRow[];
}

export interface CoachDashboardSummary {
  coachName: string;
  athletes: CoachAthleteSummary[];
  attentionQueue: CoachAthleteSummary[];
  pendingReviews: CoachAthleteSummary[];
  pendingRecommendations: CoachAthleteSummary[];
  pendingProposals: CoachAthleteSummary[];
}

function formatAdherenceLabel(value: number | null) {
  if (typeof value !== "number") {
    return null;
  }

  if (value >= 80) {
    return `${value}% stable`;
  }

  if (value >= 60) {
    return `${value}% visible`;
  }

  return `${value}% needs attention`;
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

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function normalizeCoachRecommendation(row: unknown): CoachRecommendationRecordView {
  const value = asRecord(row);
  const payload = asRecord(value.recommendation_payload);
  const nextPhase = asRecord(payload.nextPhase);
  const application = asRecord(payload.application);
  const contextSnapshot = asRecord(value.context_snapshot);

  return {
    id: String(value.id ?? ""),
    userId: String(value.user_id ?? ""),
    contextType: String(value.context_type ?? "manual") as CoachRecommendationRecordView["contextType"],
    contextKey: String(value.context_key ?? ""),
    source: String(value.source ?? "fallback") as CoachRecommendationRecordView["source"],
    generationStatus: String(value.generation_status ?? "generated") as CoachRecommendationRecordView["generationStatus"],
    model: String(value.model ?? "unknown"),
    promptVersion: String(value.prompt_version ?? "coachx-ai-v1"),
    title: String(value.title ?? payload.title ?? "Recommendation"),
    summary: String(value.summary ?? payload.summary ?? "No summary available."),
    recommendationType: String(value.recommendation_type ?? payload.recommendationType ?? "none") as CoachRecommendationRecordView["recommendationType"],
    applicationStatus: String(value.application_status ?? application.status ?? "reviewing") as CoachRecommendationRecordView["applicationStatus"],
    appliedAt: typeof value.applied_at === "string" ? value.applied_at : null,
    appliedChangeSummary: value.applied_change_summary && typeof value.applied_change_summary === "object" && !Array.isArray(value.applied_change_summary) ? (value.applied_change_summary as Record<string, unknown>) : null,
    fallbackReason: typeof value.error_message === "string" ? value.error_message : null,
    createdAt: String(value.created_at ?? ""),
    updatedAt: String(value.updated_at ?? ""),
    payload: {
      source: String(payload.source ?? value.source ?? "fallback") as CoachRecommendationRecordView["payload"]["source"],
      title: String(payload.title ?? value.title ?? "Recommendation"),
      summary: String(payload.summary ?? value.summary ?? "No summary available."),
      recommendationType: String(payload.recommendationType ?? value.recommendation_type ?? "none") as CoachRecommendationRecordView["payload"]["recommendationType"],
      confidence: Number(payload.confidence ?? 0),
      keySignals: asStringArray(payload.keySignals),
      whatWorked: asStringArray(payload.whatWorked),
      whatHeldBack: asStringArray(payload.whatHeldBack),
      focusNext: asStringArray(payload.focusNext),
      safetyNotes: asStringArray(payload.safetyNotes),
      nextPhase: {
        title: String(nextPhase.title ?? "Next phase"),
        duration: String(nextPhase.duration ?? "8 weeks"),
        summary: String(nextPhase.summary ?? "No summary available."),
        changes: asStringArray(nextPhase.changes),
        firstWorkout: String(nextPhase.firstWorkout ?? "Workout A"),
        nutrition: String(nextPhase.nutrition ?? "Maintain current nutrition targets."),
        cardio: String(nextPhase.cardio ?? "Zone 2"),
        recovery: String(nextPhase.recovery ?? "Keep recovery steady."),
        checkIn: String(nextPhase.checkIn ?? "Weekly check-in")
      },
      application: {
        status: String(application.status ?? "reviewing") as CoachRecommendationRecordView["payload"]["application"]["status"],
        canApplyAutomatically: false,
        reason: String(application.reason ?? "Manual review required.")
      },
      fallbackReason: typeof payload.fallbackReason === "string" ? payload.fallbackReason : null
    },
    contextSnapshot: contextSnapshot as unknown as CoachRecommendationRecordView["contextSnapshot"]
  };
}

function normalizeProgramChangeProposal(row: unknown): ProgramChangeProposalRecordView {
  const value = asRecord(row);
  const changeCommand = asRecord(value.change_command);
  const beforeSnapshot = asRecord(value.before_snapshot);
  const afterSnapshot = asRecord(value.after_snapshot);
  const validationResult = asRecord(value.validation_result);

  return {
    id: String(value.id ?? ""),
    userId: String(value.user_id ?? ""),
    recommendationId: typeof value.recommendation_id === "string" ? value.recommendation_id : null,
    programId: typeof value.program_id === "string" ? value.program_id : null,
    programPhaseId: typeof value.program_phase_id === "string" ? value.program_phase_id : null,
    changeType: String(value.change_type ?? "set_adjustment") as ProgramChangeProposalRecordView["changeType"],
    status: String(value.status ?? "draft") as ProgramChangeProposalRecordView["status"],
    targetEntityType: String(value.target_entity_type ?? "workout_template_exercise") as ProgramChangeProposalRecordView["targetEntityType"],
    targetEntityId: typeof value.target_entity_id === "string" ? value.target_entity_id : null,
    changeCommand: (changeCommand.type ? changeCommand : ({ type: "set_adjustment", templateExerciseId: "", currentSets: 0, proposedSets: 0 } as never)) as ProgramChangeProposalRecordView["changeCommand"],
    beforeSnapshot: {
      headline: String(beforeSnapshot.headline ?? ""),
      subheadline: String(beforeSnapshot.subheadline ?? ""),
      details: asStringArray(beforeSnapshot.details),
      metrics: Array.isArray(beforeSnapshot.metrics)
        ? beforeSnapshot.metrics
            .map((item) => {
              const metric = asRecord(item);
              const label = String(metric.label ?? "");
              const metricValue = String(metric.value ?? "");
              return label && metricValue ? { label, value: metricValue } : null;
            })
            .filter((item): item is { label: string; value: string } => item !== null)
        : []
    },
    afterSnapshot: {
      headline: String(afterSnapshot.headline ?? ""),
      subheadline: String(afterSnapshot.subheadline ?? ""),
      details: asStringArray(afterSnapshot.details),
      metrics: Array.isArray(afterSnapshot.metrics)
        ? afterSnapshot.metrics
            .map((item) => {
              const metric = asRecord(item);
              const label = String(metric.label ?? "");
              const metricValue = String(metric.value ?? "");
              return label && metricValue ? { label, value: metricValue } : null;
            })
            .filter((item): item is { label: string; value: string } => item !== null)
        : []
    },
    reason: String(value.reason ?? ""),
    validationResult: {
      status: String(validationResult.status ?? "needs_review") as ProgramChangeProposalRecordView["validationResult"]["status"],
      messages: asStringArray(validationResult.messages),
      safetyFlags: asStringArray(validationResult.safetyFlags),
      sourceUpdatedAt: typeof validationResult.sourceUpdatedAt === "string" ? validationResult.sourceUpdatedAt : null
    },
    sourceUpdatedAt: typeof value.source_updated_at === "string" ? value.source_updated_at : null,
    createdAt: String(value.created_at ?? ""),
    updatedAt: String(value.updated_at ?? ""),
    approvedAt: typeof value.approved_at === "string" ? value.approved_at : null,
    appliedAt: typeof value.applied_at === "string" ? value.applied_at : null,
    rejectedAt: typeof value.rejected_at === "string" ? value.rejected_at : null
  };
}

async function loadAthleteDetailBundle(client: SupabaseClient<Database>, athleteId: string) {
  const [athleteSnapshot, programBundle, checkinsResult, recommendationsResult, proposalsResult, progressEntriesResult, workoutSessionsResult, nutritionDaysResult, hydrationResult, supplementsResult] =
    await Promise.all([
      loadAthleteSnapshot(client, athleteId),
      loadProgramBundle(client, athleteId),
      client.from("weekly_checkins").select("*").eq("user_id", athleteId).order("week_start_date", { ascending: false }).limit(5),
      client.from("ai_recommendations").select("*").eq("user_id", athleteId).order("created_at", { ascending: false }).limit(5),
      client.from("program_change_proposals").select("*").eq("user_id", athleteId).order("created_at", { ascending: false }).limit(5),
      client.from("progress_entries").select("*").eq("user_id", athleteId).order("entry_date", { ascending: false }).limit(5),
      client.from("workout_sessions").select("*").eq("user_id", athleteId).order("started_at", { ascending: false }).limit(5),
      client.from("nutrition_days").select("*").eq("user_id", athleteId).order("calendar_date", { ascending: false }).limit(7),
      client.from("nutrition_hydration_logs").select("*").eq("user_id", athleteId).order("logged_at", { ascending: false }).limit(10),
      client.from("nutrition_supplement_logs").select("*").eq("user_id", athleteId).order("created_at", { ascending: false }).limit(10)
    ]);

  if (checkinsResult.error) {
    throw checkinsResult.error;
  }
  if (recommendationsResult.error) {
    throw recommendationsResult.error;
  }
  if (proposalsResult.error && !isMissingRelationError(proposalsResult.error)) {
    throw proposalsResult.error;
  }
  if (progressEntriesResult.error) {
    throw progressEntriesResult.error;
  }
  if (workoutSessionsResult.error) {
    throw workoutSessionsResult.error;
  }
  if (nutritionDaysResult.error) {
    throw nutritionDaysResult.error;
  }
  if (hydrationResult.error) {
    throw hydrationResult.error;
  }
  if (supplementsResult.error) {
    throw supplementsResult.error;
  }

  const checkins = (checkinsResult.data ?? []) as WeeklyCheckinsRow[];
  const latestWeeklyCheckin = checkins[0] ?? null;
  const latestCheckInResponsesResult = latestWeeklyCheckin
    ? await client.from("weekly_checkin_responses").select("*").eq("weekly_checkin_id", latestWeeklyCheckin.id).order("created_at", { ascending: true })
    : { data: [] as WeeklyCheckinResponsesRow[], error: null };
  const latestReviewResult = latestWeeklyCheckin
    ? await client.from("weekly_checkin_reviews").select("*").eq("weekly_checkin_id", latestWeeklyCheckin.id).maybeSingle()
    : { data: null as WeeklyCheckinReviewsRow | null, error: null };

  if (latestCheckInResponsesResult.error) {
    throw latestCheckInResponsesResult.error;
  }
  if (latestReviewResult.error) {
    throw latestReviewResult.error;
  }

  const latestWeeklyCheckinResponses = (latestCheckInResponsesResult.data ?? []) as WeeklyCheckinResponsesRow[];
  const latestWeeklyCheckinReview = latestReviewResult.data as WeeklyCheckinReviewsRow | null;
  const latestCheckInSummary = latestWeeklyCheckinResponses.length > 0 ? deriveWeeklyCheckinReviewSummary(scoreResponses(latestWeeklyCheckinResponses)) : null;
  const latestRecommendation = ((recommendationsResult.data ?? []) as AiRecommendationsRow[])[0] ?? null;
  const latestProposal = proposalsResult.error && isMissingRelationError(proposalsResult.error) ? null : ((proposalsResult.data ?? []) as ProgramChangeProposalRecordView[])[0] ?? null;
  const recentProgressEntries = (progressEntriesResult.data ?? []) as ProgressEntriesRow[];
  const recentWorkoutSessions = (workoutSessionsResult.data ?? []) as WorkoutSessionsRow[];
  const nutritionDays = (nutritionDaysResult.data ?? []) as NutritionDaysRow[];
  const hydrationLogs = (hydrationResult.data ?? []) as NutritionHydrationLogsRow[];
  const supplementLogs = (supplementsResult.data ?? []) as NutritionSupplementLogsRow[];
  const profile = athleteSnapshot.snapshot.profile;

  const attentionReasons = buildCoachAttentionReasons({
    needsCheckInReview: latestCheckInSummary?.recommendationType === "coach_review",
    triggerKeys: latestCheckInSummary?.reviewReason.triggerKeys,
    recommendationStatus: latestRecommendation?.application_status ?? "none",
    proposalStatus: latestProposal?.status ?? null,
    missedCheckIn: Boolean(latestWeeklyCheckin && latestWeeklyCheckin.status !== "submitted" && latestWeeklyCheckin.status !== "reviewed"),
    coachReviewRequired: athleteSnapshot.snapshot.healthLimitations?.coachReviewRequired ?? false
  });

  const lastActivityAt =
    latestWeeklyCheckin?.submitted_at ??
    latestWeeklyCheckin?.updated_at ??
    recentWorkoutSessions[0]?.completed_at ??
    recentWorkoutSessions[0]?.started_at ??
    recentProgressEntries[0]?.updated_at ??
    nutritionDays[0]?.updated_at ??
    hydrationLogs[0]?.logged_at ??
    supplementLogs[0]?.updated_at ??
    null;

  const latestTrainingAdherence = latestCheckInResponsesResult.data?.find((row) => row.question_key === "training_adherence")?.numeric_value ?? null;
  const latestNutritionAdherence = latestCheckInResponsesResult.data?.find((row) => row.question_key === "nutrition_adherence")?.numeric_value ?? null;

  const summary: CoachAthleteSummary = {
    athleteId,
    displayName: profile.name,
    goal: athleteSnapshot.snapshot.goals.mainGoal,
    phaseLabel: programBundle?.activePhase?.name ?? "No active phase",
    programStatus: programBundle?.activeProgram?.status ?? "archived",
    latestCheckInStatus: latestWeeklyCheckin?.status ?? "not_started",
    latestCheckInLabel: latestWeeklyCheckinReview?.status ?? latestWeeklyCheckin?.status ?? "pending",
    latestRecommendationStatus: latestRecommendation?.application_status ?? "none",
    latestProposalStatus: latestProposal?.status ?? "none",
    attentionReasons,
    lastActivityAt,
    trainingAdherenceLabel: formatAdherenceLabel(latestTrainingAdherence),
    nutritionAdherenceLabel: formatAdherenceLabel(latestNutritionAdherence)
  };

  return {
    summary,
    athleteProfile: athleteSnapshot.profilePresent ? (((await client.from("athlete_profiles").select("*").eq("id", athleteId).maybeSingle()).data as CoachAthleteDetailSummary["athleteProfile"]) ?? null) : null,
    athletePreferences: athleteSnapshot.preferencesPresent ? (((await client.from("athlete_preferences").select("*").eq("user_id", athleteId).maybeSingle()).data as CoachAthleteDetailSummary["athletePreferences"]) ?? null) : null,
    profileSnapshot: athleteSnapshot.snapshot,
    activeProgram: programBundle ?? null,
    latestWeeklyCheckin,
    latestWeeklyCheckinResponses,
    latestWeeklyCheckinReview,
    recentRecommendations: (recommendationsResult.data ?? []).map((row) => normalizeCoachRecommendation(row)),
    recentProposals: proposalsResult.error && isMissingRelationError(proposalsResult.error) ? [] : ((proposalsResult.data ?? []).map((row) => normalizeProgramChangeProposal(row)) as ProgramChangeProposalRecordView[]),
    recentProgressEntries,
    recentProgressMeasurements: [],
    recentWorkoutSessions,
    nutritionDays,
    nutritionSelections: [],
    hydrationLogs,
    supplementLogs
  } satisfies CoachAthleteDetailSummary;
}

export async function loadCoachDashboard(client: SupabaseClient<Database>, coachUserId: string): Promise<CoachDashboardSummary> {
  const profileResult = await client.from("coach_profiles").select("*").eq("user_id", coachUserId).maybeSingle();
  if (profileResult.error) {
    throw profileResult.error;
  }

  const assignmentsResult = await client
    .from("coach_athlete_assignments")
    .select("*")
    .eq("coach_user_id", coachUserId)
    .eq("status", "active")
    .order("assigned_at", { ascending: false });

  if (assignmentsResult.error) {
    throw assignmentsResult.error;
  }

  const assignments = (assignmentsResult.data ?? []) as CoachAthleteAssignmentsRow[];
  const athleteIds = assignments.map((assignment) => assignment.athlete_user_id);
  const athletes = athleteIds.length > 0 ? await Promise.all(athleteIds.map((athleteId) => loadAthleteDetailBundle(client, athleteId))) : [];
  const athleteSummaries = athletes.map((entry) => entry.summary);

  return {
    coachName: ((profileResult.data as CoachProfilesRow | null)?.display_name ?? "Coach"),
    athletes: athleteSummaries,
    attentionQueue: athleteSummaries.filter((athlete) => athlete.attentionReasons.length > 0),
    pendingReviews: athleteSummaries.filter((athlete) => athlete.latestCheckInStatus !== "reviewed" && athlete.latestCheckInStatus !== "acknowledged"),
    pendingRecommendations: athleteSummaries.filter((athlete) => athlete.latestRecommendationStatus === "recommended" || athlete.latestRecommendationStatus === "reviewing"),
    pendingProposals: athleteSummaries.filter((athlete) => athlete.latestProposalStatus === "draft" || athlete.latestProposalStatus === "proposed" || athlete.latestProposalStatus === "needs_review")
  };
}

export async function loadCoachAthleteDetail(client: SupabaseClient<Database>, coachUserId: string, athleteId: string) {
  const allowed = await isAssignedCoach(client, coachUserId, athleteId);
  if (!allowed) {
    return null;
  }

  return loadAthleteDetailBundle(client, athleteId);
}
