import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachAthleteAssignmentsRow, Database, Json } from "@/lib/supabase/database.types";

export interface CoachRelationshipSummary {
  coachUserId: string;
  coachDisplayName: string;
  coachAvatarPath: string | null;
  assignmentStatus: CoachAthleteAssignmentsRow["status"];
  managementMode: "self_managed" | "coach_managed";
  assignedAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseCoachRelationshipSummary(value: Json | null | undefined): CoachRelationshipSummary | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const coachUserId = typeof value.coachUserId === "string" ? value.coachUserId : null;
  const coachDisplayName = typeof value.coachDisplayName === "string" ? value.coachDisplayName : null;
  const coachAvatarPath = typeof value.coachAvatarPath === "string" ? value.coachAvatarPath : null;
  const assignmentStatus = typeof value.assignmentStatus === "string" ? value.assignmentStatus : null;
  const managementMode = value.managementMode === "coach_managed" ? "coach_managed" : "self_managed";
  const assignedAt = typeof value.assignedAt === "string" ? value.assignedAt : null;

  if (!coachUserId || !coachDisplayName || !assignmentStatus || !assignedAt) {
    return null;
  }

  return {
    coachUserId,
    coachDisplayName,
    coachAvatarPath,
    assignmentStatus: assignmentStatus as CoachAthleteAssignmentsRow["status"],
    managementMode,
    assignedAt,
    acceptedAt: typeof value.acceptedAt === "string" ? value.acceptedAt : null,
    endedAt: typeof value.endedAt === "string" ? value.endedAt : null
  };
}

export async function loadMyCoachRelationship(client: SupabaseClient<Database>) {
  const { data, error } = await client.rpc("get_my_coach_relationship");

  if (error) {
    throw error;
  }

  return parseCoachRelationshipSummary(data as Json | null);
}

export async function acceptCoachInvitation(client: SupabaseClient<Database>, token: string) {
  const { data, error } = await client.rpc("coach_accept_assignment_invitation", { p_token: token } as never);

  if (error) {
    throw error;
  }

  return data as CoachAthleteAssignmentsRow;
}
