import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AthletePreferencesInsert,
  AthletePreferencesRow,
  AthleteProfilesInsert,
  AthleteProfilesRow,
  AthleteOnboardingStatus,
  Database
} from "@/lib/supabase/database.types";
import { createProfileSnapshot, type ProfileSnapshot } from "@/lib/profile-settings-data";
import { createOnboardingDemoState, type AthleteProfile, type GoalPriority, type GoalProfile, type HealthLimitations, type NutritionPreferences, type ScheduleLifestyle, type TrainingPreferences } from "@/lib/onboarding-data";

const goalPriorityValues = ["Glutes", "Legs", "Abdomen", "Upper Body", "Conditioning", "Recovery"] as const;

const unitSystemValues = ["metric", "imperial"] as const;

const onboardingStatusValues = ["not_started", "in_progress", "completed"] as const;

const stringListSchema = z.array(z.string()).default([]).transform((items) => items.map((item) => item.trim()).filter(Boolean));

const athleteProfileSchema = z.object({
  name: z.string().trim().min(1),
  age: z.number().int().min(0).max(130),
  heightCm: z.number().min(0).max(300),
  weightKg: z.number().min(0).max(500),
  unitSystem: z.enum(unitSystemValues),
  locale: z.enum(["es", "ca", "en", "de"]),
  avatarPath: z.string().nullable().optional()
});

const goalProfileSchema = z.object({
  mainGoal: z.string().trim().min(1),
  priorities: z.array(z.enum(goalPriorityValues)).default([]).transform((items) => items.filter(Boolean))
});

const trainingPreferencesSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7),
  preferredDays: stringListSchema,
  duration: z.string(),
  location: z.string(),
  equipment: stringListSchema,
  style: z.string(),
  favoriteExercises: stringListSchema,
  movementsToAvoid: stringListSchema,
  varietyPreference: z.string(),
  abPreference: z.string(),
  supersetPreference: z.string(),
  restTimerPreference: z.string(),
  cardioPreference: z.string(),
  guidancePreference: z.string()
});

const scheduleLifestyleSchema = z.object({
  workSchedule: z.string(),
  activityLevel: z.string(),
  sittingContext: z.string(),
  steps: z.string(),
  commute: z.string(),
  predictability: z.string(),
  energyPattern: z.string(),
  wakeTime: z.string(),
  bedTime: z.string(),
  sleepQuality: z.string(),
  stress: z.string(),
  water: z.string(),
  caffeine: z.string(),
  weekendPattern: z.string(),
  availableTrainingTime: z.string(),
  reminderPreference: z.enum(["push", "email", "both", "none"])
});

const healthLimitationsSchema = z.object({
  injuryHistory: z.string(),
  currentPain: z.string(),
  movementLimitations: stringListSchema,
  romLimitations: stringListSchema,
  surgeryHistory: z.string(),
  medicationContext: z.string(),
  warningSymptoms: z.string(),
  cycleContext: z.string(),
  pregnancyPostpartum: z.string(),
  digestion: z.string(),
  coachReviewRequired: z.boolean()
});

const nutritionPreferencesSchema = z.object({
  mealFrequency: z.string(),
  mealTimes: z.string(),
  breakfastPreference: z.string(),
  preWorkoutEating: z.string(),
  cookingAccess: z.string(),
  mealPrep: z.string(),
  portionPreference: z.string(),
  budget: z.string(),
  shoppingHabits: z.string(),
  likedFoods: stringListSchema,
  dislikedFoods: stringListSchema,
  allergies: stringListSchema,
  intolerances: stringListSchema,
  restrictions: stringListSchema,
  flexibility: z.string(),
  variety: z.string(),
  cravings: z.string(),
  eatingOut: z.string(),
  weekends: z.string(),
  macroVisibility: z.enum(["full", "summary", "hidden"]),
  supplements: stringListSchema,
  barriers: z.string(),
  supportPreference: z.string()
});

const profileSnapshotSchema = z.object({
  profile: athleteProfileSchema,
  goals: goalProfileSchema,
  trainingPreferences: trainingPreferencesSchema,
  scheduleLifestyle: scheduleLifestyleSchema,
  healthLimitations: healthLimitationsSchema,
  nutritionPreferences: nutritionPreferencesSchema
});

const athleteProfileRowSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().trim().min(1),
  age_years: z.number().int().min(0).nullable(),
  date_of_birth: z.string().nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  unit_system: z.enum(unitSystemValues),
  avatar_path: z.string().nullable().optional(),
  locale: z.enum(["es", "ca", "en", "de"]).default("es"),
  onboarding_status: z.enum(onboardingStatusValues),
  onboarding_completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

const athletePreferencesRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  goals: z.unknown(),
  training_preferences: z.unknown(),
  schedule_lifestyle: z.unknown(),
  health_limitations: z.unknown(),
  nutrition_preferences: z.unknown(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string()
});

export interface AthleteSnapshotRecord {
  profile: AthleteProfilesRow;
  preferences: AthletePreferencesRow | null;
}

export interface AthleteSnapshotPayload {
  snapshot: ProfileSnapshot;
  onboardingStatus: AthleteOnboardingStatus;
  onboardingCompletedAt: string | null;
  profilePresent: boolean;
  preferencesPresent: boolean;
  localePresent: boolean;
  source: "remote" | "default";
}

function cloneSnapshot(snapshot: ProfileSnapshot): ProfileSnapshot {
  return profileSnapshotSchema.parse(structuredClone(snapshot));
}

function defaultSnapshot() {
  return cloneSnapshot(createProfileSnapshot());
}

function reviveList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function reviveSnapshotFromRaw(raw: unknown, fallback: ProfileSnapshot): ProfileSnapshot {
  if (!raw || typeof raw !== "object") {
    return cloneSnapshot(fallback);
  }

  const value = raw as Partial<ProfileSnapshot>;

  return cloneSnapshot({
    profile: {
      ...fallback.profile,
      ...(value.profile ?? {})
    },
    goals: {
      ...fallback.goals,
      ...(value.goals ?? {}),
      priorities: reviveList(value.goals?.priorities, fallback.goals.priorities) as GoalPriority[]
    },
    trainingPreferences: {
      ...fallback.trainingPreferences,
      ...(value.trainingPreferences ?? {}),
      preferredDays: reviveList(value.trainingPreferences?.preferredDays, fallback.trainingPreferences.preferredDays),
      equipment: reviveList(value.trainingPreferences?.equipment, fallback.trainingPreferences.equipment),
      favoriteExercises: reviveList(value.trainingPreferences?.favoriteExercises, fallback.trainingPreferences.favoriteExercises),
      movementsToAvoid: reviveList(value.trainingPreferences?.movementsToAvoid, fallback.trainingPreferences.movementsToAvoid)
    },
    scheduleLifestyle: {
      ...fallback.scheduleLifestyle,
      ...(value.scheduleLifestyle ?? {})
    },
    healthLimitations: {
      ...fallback.healthLimitations,
      ...(value.healthLimitations ?? {}),
      movementLimitations: reviveList(value.healthLimitations?.movementLimitations, fallback.healthLimitations.movementLimitations),
      romLimitations: reviveList(value.healthLimitations?.romLimitations, fallback.healthLimitations.romLimitations)
    },
    nutritionPreferences: {
      ...fallback.nutritionPreferences,
      ...(value.nutritionPreferences ?? {}),
      likedFoods: reviveList(value.nutritionPreferences?.likedFoods, fallback.nutritionPreferences.likedFoods),
      dislikedFoods: reviveList(value.nutritionPreferences?.dislikedFoods, fallback.nutritionPreferences.dislikedFoods),
      allergies: reviveList(value.nutritionPreferences?.allergies, fallback.nutritionPreferences.allergies),
      intolerances: reviveList(value.nutritionPreferences?.intolerances, fallback.nutritionPreferences.intolerances),
      restrictions: reviveList(value.nutritionPreferences?.restrictions, fallback.nutritionPreferences.restrictions),
      supplements: reviveList(value.nutritionPreferences?.supplements, fallback.nutritionPreferences.supplements)
    }
  });
}

export function sanitizeProfileSnapshot(snapshot: ProfileSnapshot) {
  return cloneSnapshot(snapshot);
}

export function buildProfileSnapshotFromOnboarding(state: ReturnType<typeof createOnboardingDemoState>) {
  return cloneSnapshot({
    profile: { ...state.profile },
    goals: { ...state.goals, priorities: [...state.goals.priorities] as GoalPriority[] },
    trainingPreferences: {
      ...state.trainingPreferences,
      preferredDays: [...state.trainingPreferences.preferredDays],
      equipment: [...state.trainingPreferences.equipment],
      favoriteExercises: [...state.trainingPreferences.favoriteExercises],
      movementsToAvoid: [...state.trainingPreferences.movementsToAvoid]
    },
    scheduleLifestyle: { ...state.scheduleLifestyle },
    healthLimitations: {
      ...state.healthLimitations,
      movementLimitations: [...state.healthLimitations.movementLimitations],
      romLimitations: [...state.healthLimitations.romLimitations]
    },
    nutritionPreferences: {
      ...state.nutritionPreferences,
      likedFoods: [...state.nutritionPreferences.likedFoods],
      dislikedFoods: [...state.nutritionPreferences.dislikedFoods],
      allergies: [...state.nutritionPreferences.allergies],
      intolerances: [...state.nutritionPreferences.intolerances],
      restrictions: [...state.nutritionPreferences.restrictions],
      supplements: [...state.nutritionPreferences.supplements]
    }
  });
}

export function buildAthleteProfileRow(
  userId: string,
  snapshot: ProfileSnapshot,
  onboardingStatus: AthleteOnboardingStatus,
  onboardingCompletedAt: string | null,
  options: { includeLocale?: boolean } = {}
): AthleteProfilesInsert {
  const parsed = profileSnapshotSchema.parse(snapshot);
  const includeLocale = options.includeLocale ?? true;

  const row: AthleteProfilesInsert = {
    id: userId,
    display_name: parsed.profile.name,
    age_years: parsed.profile.age,
    date_of_birth: null,
    height_cm: parsed.profile.heightCm,
    weight_kg: parsed.profile.weightKg,
    unit_system: parsed.profile.unitSystem,
    avatar_path: parsed.profile.avatarPath ?? null,
    onboarding_status: onboardingStatus,
    onboarding_completed_at: onboardingCompletedAt
  };

  if (includeLocale) {
    row.locale = parsed.profile.locale;
  }

  return row;
}

export function buildAthletePreferencesRow(userId: string, snapshot: ProfileSnapshot, version = 1): AthletePreferencesInsert {
  const parsed = profileSnapshotSchema.parse(snapshot);

  return {
    user_id: userId,
    goals: parsed.goals,
    training_preferences: parsed.trainingPreferences,
    schedule_lifestyle: parsed.scheduleLifestyle,
    health_limitations: parsed.healthLimitations,
    nutrition_preferences: parsed.nutritionPreferences,
    version
  };
}

export function reviveProfileSnapshot(raw: unknown) {
  return profileSnapshotSchema.parse(raw);
}

export function createSnapshotFromRows(profileRow: AthleteProfilesRow, preferencesRow?: AthletePreferencesRow | null): AthleteSnapshotPayload {
  const fallback = defaultSnapshot();
  const localePresent = Object.prototype.hasOwnProperty.call(profileRow, "locale");

  const mergedProfile = athleteProfileRowSchema.parse(profileRow);
  const preferences = preferencesRow ? athletePreferencesRowSchema.parse(preferencesRow) : null;

  const snapshot = reviveSnapshotFromRaw(
    {
      profile: {
        ...fallback.profile,
        name: mergedProfile.display_name,
        age: mergedProfile.age_years ?? fallback.profile.age,
        heightCm: mergedProfile.height_cm ?? fallback.profile.heightCm,
        weightKg: mergedProfile.weight_kg ?? fallback.profile.weightKg,
        unitSystem: mergedProfile.unit_system,
        locale: mergedProfile.locale,
        avatarPath: mergedProfile.avatar_path ?? fallback.profile.avatarPath ?? null
      },
      goals: preferences?.goals,
      trainingPreferences: preferences?.training_preferences,
      scheduleLifestyle: preferences?.schedule_lifestyle,
      healthLimitations: preferences?.health_limitations,
      nutritionPreferences: preferences?.nutrition_preferences
    },
    fallback
  );

  return {
    snapshot,
    onboardingStatus: mergedProfile.onboarding_status,
    onboardingCompletedAt: mergedProfile.onboarding_completed_at,
    profilePresent: true,
    preferencesPresent: Boolean(preferences),
    localePresent,
    source: "remote"
  };
}

export async function loadAthleteSnapshot(client: SupabaseClient<Database>, userId: string) {
  const [profileResult, preferencesResult] = await Promise.all([
    client.from("athlete_profiles").select("*").eq("id", userId).maybeSingle(),
    client.from("athlete_preferences").select("*").eq("user_id", userId).maybeSingle()
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (!profileResult.data) {
    return {
      snapshot: defaultSnapshot(),
      onboardingStatus: "not_started" as const,
      onboardingCompletedAt: null,
      profilePresent: false,
      preferencesPresent: false,
      source: "default" as const
    };
  }

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  return createSnapshotFromRows(profileResult.data, preferencesResult.data ?? null);
}

export async function saveAthleteSnapshot(
  client: SupabaseClient<Database>,
  userId: string,
  snapshot: ProfileSnapshot,
  onboardingStatus: AthleteOnboardingStatus,
  onboardingCompletedAt: string | null,
  version = 1
) {
  const preferencesRow = buildAthletePreferencesRow(userId, snapshot, version);
  const databaseClient = client as SupabaseClient<any>;

  const profileRow = buildAthleteProfileRow(userId, snapshot, onboardingStatus, onboardingCompletedAt);
  const profileResult = await databaseClient.from("athlete_profiles").upsert(profileRow, { onConflict: "id" }).select("*").single();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const preferencesResult = await databaseClient
    .from("athlete_preferences")
    .upsert(preferencesRow, { onConflict: "user_id" })
    .select("*")
    .single();

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  return {
    profile: profileResult.data,
    preferences: preferencesResult.data
  };
}

export function mapOnboardingStatus(status: "not-started" | "in-progress" | "complete"): AthleteOnboardingStatus {
  switch (status) {
    case "not-started":
      return "not_started";
    case "in-progress":
      return "in_progress";
    case "complete":
      return "completed";
  }
}

export function mapOnboardingStatusFromDatabase(status: AthleteOnboardingStatus) {
  switch (status) {
    case "not_started":
      return "not-started";
    case "in_progress":
      return "in-progress";
    case "completed":
      return "complete";
  }
}

export function mergeRemoteSnapshotIntoOnboardingState<T extends ReturnType<typeof createOnboardingDemoState>>(
  state: T,
  payload: AthleteSnapshotPayload
): T {
  const locale = resolveAthleteSnapshotLocale(payload, state.profile.locale);

  return {
    ...state,
    profile: {
      ...payload.snapshot.profile,
      locale
    },
    goals: { ...payload.snapshot.goals, priorities: [...payload.snapshot.goals.priorities] as GoalPriority[] },
    trainingPreferences: {
      ...payload.snapshot.trainingPreferences,
      preferredDays: [...payload.snapshot.trainingPreferences.preferredDays],
      equipment: [...payload.snapshot.trainingPreferences.equipment],
      favoriteExercises: [...payload.snapshot.trainingPreferences.favoriteExercises],
      movementsToAvoid: [...payload.snapshot.trainingPreferences.movementsToAvoid]
    },
    scheduleLifestyle: { ...payload.snapshot.scheduleLifestyle },
    healthLimitations: {
      ...payload.snapshot.healthLimitations,
      movementLimitations: [...payload.snapshot.healthLimitations.movementLimitations],
      romLimitations: [...payload.snapshot.healthLimitations.romLimitations]
    },
    nutritionPreferences: {
      ...payload.snapshot.nutritionPreferences,
      likedFoods: [...payload.snapshot.nutritionPreferences.likedFoods],
      dislikedFoods: [...payload.snapshot.nutritionPreferences.dislikedFoods],
      allergies: [...payload.snapshot.nutritionPreferences.allergies],
      intolerances: [...payload.snapshot.nutritionPreferences.intolerances],
      restrictions: [...payload.snapshot.nutritionPreferences.restrictions],
      supplements: [...payload.snapshot.nutritionPreferences.supplements]
    },
    progress: {
      ...state.progress,
      status: payload.onboardingStatus === "completed" ? "complete" : payload.onboardingStatus === "in_progress" ? "in-progress" : state.progress.status,
      resumeStep: payload.onboardingStatus === "completed" ? "program" : state.progress.resumeStep
    }
  };
}

export function resolveAthleteSnapshotLocale(payload: AthleteSnapshotPayload, localLocale: ProfileSnapshot["profile"]["locale"]) {
  const isNewPlaceholder = payload.onboardingStatus === "not_started" && !payload.preferencesPresent;
  return payload.localePresent && !isNewPlaceholder ? payload.snapshot.profile.locale : localLocale;
}

export function createAthleteProfileDraft(snapshot?: ProfileSnapshot) {
  const source = snapshot ?? defaultSnapshot();
  return cloneSnapshot(source);
}
