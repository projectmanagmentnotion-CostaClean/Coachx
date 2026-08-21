import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CoachProfilesRow } from "@/lib/supabase/database.types";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

function isMissingRelationError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /relation .* does not exist|does not exist|42P01/i.test(message);
}

export interface CoachSessionContext {
  client: SupabaseClient<Database>;
  userId: string;
  coachProfile: CoachProfilesRow | null;
  isCoach: boolean;
}

export interface CoachAccessCheck {
  allowed: boolean;
  reason: string | null;
}

export async function loadCoachSessionContext(): Promise<CoachSessionContext | null> {
  const client = await createSupabaseServerComponentClient();
  if (!client) {
    return null;
  }

  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  const coachResult = await client.from("coach_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (coachResult.error && !isMissingRelationError(coachResult.error)) {
    throw coachResult.error;
  }

  const coachProfile = coachResult.data as CoachProfilesRow | null;

  return {
    client,
    userId: user.id,
    coachProfile,
    isCoach: Boolean(coachProfile && coachProfile.status === "active")
  };
}

export async function isAssignedCoach(client: SupabaseClient<Database>, coachUserId: string, athleteUserId: string) {
  const result = await client
    .from("coach_athlete_assignments")
    .select("id,status")
    .eq("coach_user_id", coachUserId)
    .eq("athlete_user_id", athleteUserId)
    .eq("status", "active")
    .maybeSingle();

  if (result.error) {
    if (isMissingRelationError(result.error)) {
      return false;
    }
    throw result.error;
  }

  return Boolean(result.data);
}

export async function requireCoachAccess(athleteUserId: string) {
  const session = await loadCoachSessionContext();
  if (!session?.isCoach) {
    return { session: null, access: { allowed: false, reason: "Coach access is required." } satisfies CoachAccessCheck };
  }

  const allowed = await isAssignedCoach(session.client, session.userId, athleteUserId);
  return {
    session: allowed ? session : null,
    access: allowed
      ? ({ allowed: true, reason: null } satisfies CoachAccessCheck)
      : ({ allowed: false, reason: "This athlete is not assigned to the current coach." } satisfies CoachAccessCheck)
  };
}

export function coachDashboardRoute() {
  return "/coach";
}

export function coachAthletesRoute() {
  return "/coach/athletes";
}
