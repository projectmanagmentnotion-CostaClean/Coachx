import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AthleteOnboardingStatus,
  AthleteProfilesRow,
  CoachAthleteAssignmentsRow,
  CoachProfilesRow,
  Database
} from "@/lib/supabase/database.types";
import type { IdentityIntent, WorkspacePreference } from "@/lib/auth/session-policy";

export type WorkspaceKind = WorkspacePreference;
export type ManagementMode = "self_managed" | "coach_managed";

export interface IdentityResolution {
  userId: string;
  athleteProfile: Pick<AthleteProfilesRow, "id" | "onboarding_status" | "onboarding_completed_at" | "locale"> | null;
  coachProfile: CoachProfilesRow | null;
  activeCoachAssignment: CoachAthleteAssignmentsRow | null;
  athleteCapability: boolean;
  coachCapability: boolean;
  coachManaged: boolean;
  managementMode: ManagementMode;
  availableWorkspaces: WorkspaceKind[];
  preferredWorkspace: WorkspaceKind;
  resolvedWorkspace: WorkspaceKind;
  identityIntent: IdentityIntent | null;
  identityGatewayRequired: boolean;
}

export function resolveIdentityWorkspace(
  input: {
    athleteCapability: boolean;
    coachCapability: boolean;
    coachManaged: boolean;
    preferredWorkspace?: WorkspacePreference | null;
  }
): WorkspaceKind {
  const defaultWorkspace: WorkspaceKind = input.coachCapability && !input.coachManaged ? "coach" : "athlete";

  if (input.preferredWorkspace === "coach") {
    return input.coachCapability ? "coach" : defaultWorkspace;
  }

  if (input.preferredWorkspace === "athlete") {
    return "athlete";
  }

  return defaultWorkspace;
}

export async function loadIdentityResolution(
  client: SupabaseClient<Database>,
  userId: string,
  options: {
    preferredWorkspace?: WorkspacePreference | null;
    identityIntent?: IdentityIntent | null;
  } = {}
): Promise<IdentityResolution> {
  const [athleteResult, coachResult, assignmentResult] = await Promise.all([
    client
      .from("athlete_profiles")
      .select("id,onboarding_status,onboarding_completed_at,locale")
      .eq("id", userId)
      .maybeSingle(),
    client.from("coach_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client
      .from("coach_athlete_assignments")
      .select("*")
      .eq("athlete_user_id", userId)
      .eq("status", "active")
      .maybeSingle()
  ]);

  if (athleteResult.error) {
    throw athleteResult.error;
  }

  if (coachResult.error) {
    throw coachResult.error;
  }

  if (assignmentResult.error) {
    throw assignmentResult.error;
  }

  const athleteProfile = (athleteResult.data ?? null) as IdentityResolution["athleteProfile"];
  const coachProfile = (coachResult.data ?? null) as IdentityResolution["coachProfile"];
  const activeCoachAssignment = (assignmentResult.data ?? null) as IdentityResolution["activeCoachAssignment"];
  const athleteCapability = Boolean(athleteProfile);
  const coachCapability = Boolean(coachProfile && coachProfile.status === "active");
  const coachManaged = Boolean(activeCoachAssignment);
  const managementMode: ManagementMode = coachManaged ? "coach_managed" : "self_managed";
  const availableWorkspaces: WorkspaceKind[] = athleteCapability ? ["athlete"] : [];

  if (coachCapability) {
    availableWorkspaces.push("coach");
  }

  const resolvedWorkspace = resolveIdentityWorkspace({
    athleteCapability,
    coachCapability,
    coachManaged,
    preferredWorkspace: options.preferredWorkspace ?? null
  });

  return {
    userId,
    athleteProfile,
    coachProfile,
    activeCoachAssignment,
    athleteCapability,
    coachCapability,
    coachManaged,
    managementMode,
    availableWorkspaces,
    preferredWorkspace: resolveIdentityWorkspace({
      athleteCapability,
      coachCapability,
      coachManaged,
      preferredWorkspace: options.preferredWorkspace ?? null
    }),
    resolvedWorkspace,
    identityIntent: options.identityIntent ?? null,
    identityGatewayRequired: Boolean(athleteProfile && athleteProfile.onboarding_status === "not_started" && !options.identityIntent)
  };
}

export function resolveAuthenticatedLandingRoute(identity: IdentityResolution) {
  if (!identity.athleteCapability) {
    return "/entry";
  }

  if (identity.resolvedWorkspace === "coach") {
    return "/coach";
  }

  if (identity.athleteProfile?.onboarding_status !== "completed") {
    return "/onboarding";
  }

  return "/";
}

export function isKnownAthleteOnboardingStatus(status: string | null | undefined): status is AthleteOnboardingStatus {
  return status === "not_started" || status === "in_progress" || status === "completed";
}
