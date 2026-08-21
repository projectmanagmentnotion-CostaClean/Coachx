import type {
  CoachActionType,
  CoachRecommendationApplicationStatus,
  ProgramChangeStatus,
  WeeklyCheckinReviewStatus
} from "@/lib/supabase/database.types";

export interface CoachAccessDecision {
  allowed: boolean;
  reason: string | null;
}

export interface CoachAttentionInputs {
  needsCheckInReview?: boolean;
  triggerKeys?: string[];
  recommendationStatus?: string | null;
  proposalStatus?: string | null;
  missedCheckIn?: boolean;
  coachReviewRequired?: boolean;
}

export function resolveCoachAccess(hasCoachProfile: boolean, isAssigned: boolean): CoachAccessDecision {
  if (!hasCoachProfile) {
    return { allowed: false, reason: "Coach access is required." };
  }

  if (!isAssigned) {
    return { allowed: false, reason: "This athlete is not assigned to the current coach." };
  }

  return { allowed: true, reason: null };
}

export function buildCoachAttentionReasons(inputs: CoachAttentionInputs) {
  const reasons: string[] = [];

  if (inputs.needsCheckInReview) {
    reasons.push("Check-in needs attention");
  }

  for (const triggerKey of inputs.triggerKeys ?? []) {
    if (triggerKey === "pain_discomfort") {
      reasons.push("Reported pain");
    }
    if (triggerKey === "recovery") {
      reasons.push("Low recovery");
    }
    if (triggerKey === "training_adherence") {
      reasons.push("Low training adherence");
    }
    if (triggerKey === "nutrition_adherence") {
      reasons.push("Low nutrition adherence");
    }
  }

  if (inputs.recommendationStatus === "recommended" || inputs.recommendationStatus === "reviewing") {
    reasons.push("Pending recommendation");
  }

  if (inputs.proposalStatus && ["draft", "proposed", "needs_review", "approved"].includes(inputs.proposalStatus)) {
    reasons.push("Pending proposal");
  }

  if (inputs.proposalStatus === "superseded") {
    reasons.push("Stale proposal");
  }

  if (inputs.missedCheckIn) {
    reasons.push("Missed check-in");
  }

  if (inputs.coachReviewRequired) {
    reasons.push("Coach review required");
  }

  return [...new Set(reasons)];
}

export function mapCoachCheckinActionToStatus(actionType: CoachActionType, status: string): WeeklyCheckinReviewStatus {
  if (status === "reviewed" || status === "needs_attention" || status === "acknowledged") {
    return status;
  }

  if (actionType === "checkin_acknowledged") {
    return "acknowledged";
  }

  if (actionType === "followup_requested") {
    return "needs_attention";
  }

  return "reviewed";
}

export function mapCoachRecommendationActionToStatus(actionType: CoachActionType, status: string): CoachRecommendationApplicationStatus {
  if (status === "reviewing" || status === "rejected") {
    return status;
  }

  return actionType === "recommendation_rejected" ? "rejected" : "reviewing";
}

export function mapCoachProposalActionToStatus(actionType: CoachActionType, status: string): ProgramChangeStatus {
  if (status === "approved" || status === "rejected") {
    return status;
  }

  return actionType === "proposal_rejected" ? "rejected" : "approved";
}

export function buildCoachActionAuditMetadata(details: {
  actionType: CoachActionType;
  status: string | null;
  note: string | null;
}) {
  return {
    actionType: details.actionType,
    status: details.status,
    note: details.note
  };
}
