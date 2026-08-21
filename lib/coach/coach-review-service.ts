import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  AiRecommendationsRow,
  ProgramChangeProposalsRow
} from "@/lib/supabase/database.types";

export interface CoachReviewActionResult {
  status: "ok";
  noteId: string | null;
}

export async function markCoachCheckinReview(
  client: SupabaseClient<Database>,
  weeklyCheckinId: string,
  action: "reviewed" | "acknowledged" | "needs_followup",
  note?: string | null
) {
  const result = await (client as any).rpc("coach_mark_checkin_reviewed", {
    p_weekly_checkin_id: weeklyCheckinId,
    p_action: action,
    p_note: note?.trim() ? note.trim() : null
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: "ok" as const,
    noteId: null
  } satisfies CoachReviewActionResult;
}

export async function setCoachRecommendationDecision(
  client: SupabaseClient<Database>,
  recommendationId: string,
  decision: "approve" | "reject" | "defer"
) {
  const result = await (client as any).rpc("coach_decide_recommendation", {
    p_recommendation_id: recommendationId,
    p_decision: decision
  });

  if (result.error) {
    throw result.error;
  }

  return result.data as AiRecommendationsRow | null;
}

export async function setCoachProposalDecision(
  client: SupabaseClient<Database>,
  proposalId: string,
  decision: "approve" | "reject"
) {
  const result = await (client as any).rpc("coach_decide_program_change_proposal", {
    p_proposal_id: proposalId,
    p_decision: decision
  });

  if (result.error) {
    throw result.error;
  }

  return result.data as ProgramChangeProposalsRow | null;
}
