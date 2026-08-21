import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import * as ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libDir = path.join(repoRoot, "lib");
const tempDir = await mkdtemp(path.join(tmpdir(), "coachx-onboarding-tests-"));

function rewriteAliasImport(specifier, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);

  function normalizeRelativeImport(targetPath) {
    const relativePath = path.relative(currentDir, targetPath).replaceAll(path.sep, "/").replace(/\.mjs$/, "");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  }

  if (specifier.startsWith("@/lib/")) {
    const relativeSourcePath = specifier.slice("@/lib/".length);
    const targetPath = relativeSourcePath === "media"
      ? path.join(tempDir, "media", "index.mjs")
      : path.join(tempDir, `${relativeSourcePath}.mjs`);
    return normalizeRelativeImport(targetPath);
  }

  if (specifier.startsWith("@/components/")) {
    const relativeSourcePath = specifier.slice("@/components/".length);
    const targetPath = path.join(tempDir, "components", `${relativeSourcePath}.mjs`);
    return normalizeRelativeImport(targetPath);
  }

  return specifier;
}

async function transpileLibraryChain() {
  const sourceFiles = [
    "anatomy.ts",
    "checkin-data.ts",
    "checkin-service.ts",
    "ai/schemas.ts",
    "ai/openai-client.ts",
    "ai/coach-context.ts",
    "ai/coach-engine.ts",
    "ai/recommendation-service.ts",
    "recommendations/change-proposal-service.ts",
    "notification-service.ts",
    "coach/coach-policy.ts",
    "coach/coach-relationship-service.ts",
    "i18n.ts",
    "nutrition-data.ts",
    "workout-data.ts",
    "coachx-data.ts",
    "numeric-input.ts",
    "workout-set-editor.ts",
    "progress-data.ts",
    "progress-service.ts",
    "program-service.ts",
    "onboarding-data.ts",
    "profile-settings-data.ts",
    "feedback.ts",
    "nutrition-service.ts",
    "media/types.ts",
    "media/exercise-media.ts",
    "media/meal-media.ts",
    "media/index.ts",
    "auth/navigation.ts",
    "auth/session-policy.ts",
    "auth/identity-resolver.ts",
    "auth/auth-errors.ts",
    "athlete-service.ts",
    "workout-session-service.ts",
    "workout-live-state.ts",
    "motivational-immersion.ts"
  ];

  for (const fileName of sourceFiles) {
    const sourcePath = path.join(libDir, fileName);
    const sourceText = await readFile(sourcePath, "utf8");
    const outputPath = path.join(tempDir, fileName.replace(/\.ts$/, ".mjs"));
    const rewrittenSource = sourceText
      .replace(/from\s+["'](@\/(?:lib|components)\/[^"']+)["']/g, (_, specifier) => `from "${rewriteAliasImport(specifier, outputPath)}"`)
      .replace(/from\s+["']openai\/helpers\/zod["']/g, `from "${pathToFileURL(path.join(repoRoot, "node_modules/openai/helpers/zod.mjs")).href}"`)
      .replace(/from\s+['"]openai['"]/g, `from "${pathToFileURL(path.join(repoRoot, "node_modules/openai/index.mjs")).href}"`)
      .replace(/from\s+["']zod["']/g, `from "${pathToFileURL(path.join(repoRoot, "node_modules/zod/index.js")).href}"`);

    const transpiled = ts.transpileModule(rewrittenSource, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.Preserve,
        esModuleInterop: true
      },
      fileName
    }).outputText;

    const outputText = transpiled
      .replace(/from "((?:\.{1,2}\/)[^"]+)"/g, (_, specifier) => `from "${specifier.endsWith(".mjs") ? specifier : `${specifier}.mjs`}"`)
      .replace(/from '((?:\.{1,2}\/)[^']+)'/g, (_, specifier) => `from '${specifier.endsWith(".mjs") ? specifier : `${specifier}.mjs`}'`);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, outputText, "utf8");
  }

  return import(pathToFileURL(path.join(tempDir, "onboarding-data.mjs")).href);
}

const onboarding = await transpileLibraryChain();
const i18n = await import(pathToFileURL(path.join(tempDir, "i18n.mjs")).href);
const progressData = await import(pathToFileURL(path.join(tempDir, "progress-data.mjs")).href);
const numericInput = await import(pathToFileURL(path.join(tempDir, "numeric-input.mjs")).href);
const workoutSetEditor = await import(pathToFileURL(path.join(tempDir, "workout-set-editor.mjs")).href);
const profileSettings = await import(pathToFileURL(path.join(tempDir, "profile-settings-data.mjs")).href);
const nutritionService = await import(pathToFileURL(path.join(tempDir, "nutrition-service.mjs")).href);
const authNavigation = await import(pathToFileURL(path.join(tempDir, "auth/navigation.mjs")).href);
const athleteService = await import(pathToFileURL(path.join(tempDir, "athlete-service.mjs")).href);
const progressService = await import(pathToFileURL(path.join(tempDir, "progress-service.mjs")).href);
const workoutSessionService = await import(pathToFileURL(path.join(tempDir, "workout-session-service.mjs")).href);
const workoutData = await import(pathToFileURL(path.join(tempDir, "workout-data.mjs")).href);
const workoutLiveState = await import(pathToFileURL(path.join(tempDir, "workout-live-state.mjs")).href);
const programService = await import(pathToFileURL(path.join(tempDir, "program-service.mjs")).href);
const checkinData = await import(pathToFileURL(path.join(tempDir, "checkin-data.mjs")).href);
const checkinService = await import(pathToFileURL(path.join(tempDir, "checkin-service.mjs")).href);
const notificationService = await import(pathToFileURL(path.join(tempDir, "notification-service.mjs")).href);
const feedback = await import(pathToFileURL(path.join(tempDir, "feedback.mjs")).href);
const coachPolicy = await import(pathToFileURL(path.join(tempDir, "coach/coach-policy.mjs")).href);
const aiSchemas = await import(pathToFileURL(path.join(tempDir, "ai/schemas.mjs")).href);
const aiEngine = await import(pathToFileURL(path.join(tempDir, "ai/coach-engine.mjs")).href);
const aiRecommendationService = await import(pathToFileURL(path.join(tempDir, "ai/recommendation-service.mjs")).href);
const changeProposalService = await import(pathToFileURL(path.join(tempDir, "recommendations/change-proposal-service.mjs")).href);
const immersion = await import(pathToFileURL(path.join(tempDir, "motivational-immersion.mjs")).href);
const authSessionPolicy = await import(pathToFileURL(path.join(tempDir, "auth/session-policy.mjs")).href);
const identityResolver = await import(pathToFileURL(path.join(tempDir, "auth/identity-resolver.mjs")).href);
const authErrors = await import(pathToFileURL(path.join(tempDir, "auth/auth-errors.mjs")).href);
const coachRelationshipService = await import(pathToFileURL(path.join(tempDir, "coach/coach-relationship-service.mjs")).href);
const feedbackLibrary = await import(pathToFileURL(path.join(tempDir, "feedback.mjs")).href);

function flattenMessagePaths(tree, prefix = "") {
  const entries = [];
  for (const [key, value] of Object.entries(tree)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      entries.push(...flattenMessagePaths(value, pathKey));
    } else {
      entries.push(pathKey);
    }
  }
  return entries;
}

test("trusted app origins are explicit and keep open-redirect protection intact", () => {
  assert.equal(authSessionPolicy.isTrustedAppOrigin("http://localhost:3000"), true);
  assert.equal(authSessionPolicy.isTrustedAppOrigin("https://coachxsync1.vercel.app"), true);
  assert.equal(authSessionPolicy.isTrustedAppOrigin("https://coachxsync1-zeta.vercel.app"), true);
  assert.equal(authSessionPolicy.isTrustedAppOrigin("https://evil.example"), false);
  assert.equal(authSessionPolicy.isTrustedAppOrigin("https://coachxsync1-zeta.vercel.app.evil.example"), false);

  assert.equal(
    authSessionPolicy.buildTrustedAppUrl("https://coachxsync1-zeta.vercel.app", "/auth/callback?next=/"),
    "https://coachxsync1-zeta.vercel.app/auth/callback?next=/"
  );
  assert.equal(
    authSessionPolicy.buildTrustedAppUrl("http://localhost:3000", "/auth/callback?next=/reset-password"),
    "http://localhost:3000/auth/callback?next=/reset-password"
  );
  assert.equal(authSessionPolicy.buildTrustedAppUrl("https://evil.example", "/auth/callback?next=/"), null);
  assert.equal(authSessionPolicy.resolveSafeInternalPath("//evil.example", "/"), "/");
  assert.equal(authSessionPolicy.resolveSafeInternalPath("https://evil.example", "/"), "/");
  assert.equal(authSessionPolicy.resolveSafeInternalPath("/calendar", "/"), "/calendar");
});

test("feedback memory can clear stale auth sign-in notices without affecting other actions", () => {
  const staleAuthNotice = feedbackLibrary.buildFeedbackNotice("en", {
    actionId: "auth.sign-in",
    kind: "error",
    title: "Google sign-in could not be completed",
    detail: "Google sign-in is only available from a trusted AthlexForce origin."
  });
  const workoutNotice = feedbackLibrary.buildFeedbackNotice("en", {
    actionId: "workout.set",
    kind: "success",
    title: "Set completed",
    detail: "Your reps and load are saved."
  });

  const nextMemory = feedbackLibrary.clearFeedbackMemoryForAction(
    {
      recent: [staleAuthNotice, workoutNotice],
      lastByAction: {
        "auth.sign-in": staleAuthNotice,
        "workout.set": workoutNotice
      }
    },
    "auth.sign-in"
  );

  assert.equal(nextMemory.recent.some((notice) => notice.actionId === "auth.sign-in"), false);
  assert.equal(nextMemory.recent.some((notice) => notice.actionId === "workout.set"), true);
  assert.equal(Object.hasOwn(nextMemory.lastByAction, "auth.sign-in"), false);
  assert.equal(Object.hasOwn(nextMemory.lastByAction, "workout.set"), true);
});

test("feedback hierarchy resolves canonical levels", () => {
  assert.equal(feedbackLibrary.resolveFeedbackLevel("inline", 1), "L2");
  assert.equal(feedbackLibrary.resolveFeedbackLevel("toast", 2), "L3");
  assert.equal(feedbackLibrary.resolveFeedbackLevel("hero", 4), "L4");
});

test("canonical feedback defaults favor visible local states", () => {
  assert.equal(feedbackLibrary.getFeedbackActionDefaults("profile.save").placement, "inline");
  assert.equal(feedbackLibrary.getFeedbackActionDefaults("progress.measurement").placement, "inline");
  assert.equal(feedbackLibrary.getFeedbackActionDefaults("workout.finish").placement, "hero");
});

test("i18n dictionaries stay in parity across supported locales", () => {
  const referencePaths = flattenMessagePaths(i18n.i18nMessages.en).sort();

  for (const locale of i18n.supportedLocales) {
    const localePaths = flattenMessagePaths(i18n.i18nMessages[locale]).sort();
    assert.deepEqual(localePaths, referencePaths, `Locale ${locale} is missing product keys`);
  }
});

test("locale switching updates the active locale and translation lookup immediately", () => {
  const previousLocale = i18n.getCurrentLocale();
  i18n.setCurrentLocale("de");
  assert.equal(i18n.getCurrentLocale(), "de");
  assert.equal(i18n.getTranslation("de", "common.language"), "Sprache");
  i18n.setCurrentLocale(previousLocale);
});

test("onboarding step ordering works", () => {
  assert.equal(onboarding.getNextOnboardingStep("goals"), "training-experience");
  assert.equal(onboarding.getPreviousOnboardingStep("goals"), "profile");
});

test("priority reordering is immediate", () => {
  assert.deepEqual(onboarding.reorderPriorityItems(["Glutes", "Legs", "Abdomen"], 0, 2), ["Legs", "Abdomen", "Glutes"]);
});

test("nutrition safety blocks allergy matches", () => {
  assert.equal(
    onboarding.isNutritionChoiceAllowed({ tags: ["peanuts"] }, onboarding.onboardingDemoState.nutritionPreferences),
    false
  );
  assert.equal(
    onboarding.isNutritionChoiceAllowed({ tags: ["rice"] }, onboarding.onboardingDemoState.nutritionPreferences),
    true
  );
});

test("coach review is required for significant limitations", () => {
  assert.equal(onboarding.shouldRequireCoachReview(onboarding.onboardingDemoState.healthLimitations), false);
  assert.equal(
    onboarding.shouldRequireCoachReview({
      ...onboarding.onboardingDemoState.healthLimitations,
      currentPain: "Knee pain during deep flexion"
    }),
    true
  );
});

test("baseline seed stays separate from progress state", () => {
  const seed = onboarding.buildBaselineSeed(onboarding.onboardingDemoState);
  assert.equal(seed.measurements.length, 4);
  assert.equal(seed.photos.length, 3);
  assert.equal(seed.photos[0].checkpoint, "baseline");
});

test("program activation is explicit", () => {
  const proposal = onboarding.createProgramProposal(onboarding.onboardingDemoState);
  assert.equal(proposal.status, "proposed");
  const active = onboarding.activateProgram(proposal);
  assert.equal(active.status, "active");
  assert.equal(onboarding.finalizeOnboarding(onboarding.onboardingDemoState).progress.status, "complete");
});
test("progress immersion resolves calm, close, heat, and achieved states", () => {
  assert.equal(immersion.resolveProgressIntensity(null), "calm");
  assert.equal(immersion.resolveProgressIntensity(69), "calm");
  assert.equal(immersion.resolveProgressIntensity(70), "active");
  assert.equal(immersion.resolveProgressIntensity(85), "close");
  assert.equal(immersion.resolveProgressIntensity(95), "heat");
  assert.equal(immersion.resolveProgressIntensity(100), "achieved");
  assert.equal(immersion.resolveProgressIntensity(112), "achieved");
});

test("progress immersion surfaces real targets and milestone states", () => {
  const state = immersion.buildMotivationalImmersion("en", {
    locale: "en",
    phaseLabel: "Phase 3",
    trainingAdherencePercent: 96,
    nutritionAdherencePercent: 93,
    hydrationMl: 1800,
    hydrationTargetMl: 2500,
    workoutSessionCount: 12,
    latestWorkoutLoad: 100,
    bestWorkoutLoad: 95,
    phaseComplete: false
  });

  assert.equal(state.state, "achieved");
  assert.ok(state.primaryTarget);
  assert.equal(state.primaryTarget?.kind, "training_adherence");
  assert.ok(state.targets.length >= 3);
  assert.ok(state.milestones.some((milestone) => milestone.id === "first-workout"));
  assert.ok(state.milestones.some((milestone) => milestone.id === "ten-workouts"));
  assert.ok(state.milestones.some((milestone) => milestone.id === "new-best-load"));
  assert.equal(state.showParticles, true);
});

test("phase achievement immersion keeps progress grounded in the review state", () => {
  const state = immersion.buildPhaseAchievementImmersion("de", {
    phaseLabel: "Phase 4",
    phaseComplete: true,
    reviewSummary: "Phase complete and ready for the next block.",
    workoutSessionCount: 9
  });

  assert.equal(state.state, "achieved");
  assert.ok(state.primaryTarget);
  assert.equal(state.primaryTarget?.kind, "phase_completion");
  assert.equal(state.milestones[0].achieved, true);
  assert.equal(state.milestones[1].achieved, true);
  assert.equal(state.showParticles, true);
});

test("empty immersion stays calm until a real target exists", () => {
  const state = immersion.buildEmptyMotivationalImmersion("ca", "Phase 2");
  assert.equal(state.state, "calm");
  assert.equal(state.primaryTarget, null);
  assert.equal(state.targets.length, 0);
  assert.equal(state.milestones.length, 0);
});

test("profile review classifies program-impacting edits", () => {
  const current = profileSettings.createProfileSnapshot();
  const next = {
    ...current,
    trainingPreferences: {
      ...current.trainingPreferences,
      daysPerWeek: 3
    }
  };

  const review = profileSettings.buildProfileReview(current, next, onboarding.onboardingDemoState.program);
  assert.equal(review.classification, "PROGRAM_ADJUSTMENT_RECOMMENDED");
  assert.ok(review.whatChanged.some((change) => change.field === "Training days"));
});

test("nutrition safety changes require coach review", () => {
  const current = profileSettings.createProfileSnapshot();
  const next = {
    ...current,
    nutritionPreferences: {
      ...current.nutritionPreferences,
      allergies: [...current.nutritionPreferences.allergies, "Shellfish"]
    }
  };

  const review = profileSettings.buildProfileReview(current, next, onboarding.onboardingDemoState.program);
  assert.equal(review.classification, "COACH_REVIEW_REQUIRED");
});

test("notification settings preserve categories when the master toggle changes", () => {
  const settings = profileSettings.createNotificationSettings();
  const disabled = {
    ...settings,
    masterEnabled: false
  };

  const revived = profileSettings.reviveProfileSettingsState(JSON.stringify({ notifications: disabled })).notifications;
  assert.equal(revived.masterEnabled, false);
  assert.equal(revived.categories.length, settings.categories.length);
  assert.deepEqual(
    revived.categories.map((category) => category.id),
    settings.categories.map((category) => category.id)
  );
});

test("weekly check-in windows run sunday through saturday", () => {
  const window = checkinData.resolveWeeklyCheckinWindow("2026-08-09");
  assert.equal(window.weekStartDate, "2026-08-09");
  assert.equal(window.weekEndDate, "2026-08-15");
});

test("weekly check-in review escalates safety and recovery signals", () => {
  const summary = checkinData.deriveWeeklyCheckinReviewSummary(
    checkinData.computeSignalFromScoredQuestions({
      training_adherence: 2,
      nutrition_adherence: 3,
      energy: 2,
      sleep: 3,
      stress: 4,
      recovery: 2,
      pain_discomfort: "moderate"
    })
  );

  assert.equal(summary.recommendationType, "coach_review");
  assert.ok(summary.reviewReason.triggerKeys.includes("pain_discomfort"));
});

test("notification preferences round-trip through the service boundary", () => {
  const settings = profileSettings.createNotificationSettings();
  const row = notificationService.buildNotificationPreferencesRow("00000000-0000-4000-8000-000000000099", {
    ...settings,
    masterEnabled: false,
    intensity: "more-support",
    categories: settings.categories.map((category) => ({ ...category, enabled: category.id === "weekly-check-in" }))
  });

  const revived = notificationService.notificationPreferencesRowToSettings({
    id: "00000000-0000-4000-8000-000000000099",
    user_id: "00000000-0000-4000-8000-000000000099",
    master_enabled: row.master_enabled ?? false,
    workout_reminders_enabled: row.workout_reminders_enabled ?? false,
    program_updates_enabled: row.program_updates_enabled ?? false,
    weekly_check_in_enabled: row.weekly_check_in_enabled ?? false,
    measurements_enabled: row.measurements_enabled ?? false,
    progress_photos_enabled: row.progress_photos_enabled ?? false,
    phase_reviews_enabled: row.phase_reviews_enabled ?? false,
    nutrition_reminders_enabled: row.nutrition_reminders_enabled ?? false,
    hydration_enabled: row.hydration_enabled ?? false,
    supplements_enabled: row.supplements_enabled ?? false,
    sleep_routine_enabled: row.sleep_routine_enabled ?? false,
    adaptive_alerts_enabled: row.adaptive_alerts_enabled ?? false,
    reminder_intensity: row.reminder_intensity ?? "minimal",
    quiet_hours_enabled: row.quiet_hours_enabled ?? false,
    quiet_hours_start: row.quiet_hours_start ?? null,
    quiet_hours_end: row.quiet_hours_end ?? null,
    preferred_timezone: row.preferred_timezone ?? null,
    created_at: "2026-08-09T12:00:00.000Z",
    updated_at: "2026-08-09T12:00:00.000Z"
  });

  assert.equal(revived.masterEnabled, false);
  assert.equal(revived.intensity, "more-support");
  assert.equal(revived.categories.find((category) => category.id === "weekly-check-in")?.enabled, true);
});

test("coach recommendation fallback stays review-only and never auto-applies", () => {
  const context = {
    contextType: "phase_review",
    contextKey: "program-123",
    generatedAt: "2026-08-10T08:00:00.000Z",
    athlete: {
      displayName: "Alex",
      onboardingStatus: "completed",
      goal: "Body Recomposition",
      priorities: ["Glutes", "Legs", "Abdomen"],
      trainingDaysPerWeek: 4,
      scheduleSnapshot: ["4 days", "Europe/Madrid"],
      nutritionSnapshot: ["Meal prep", "High protein"],
      healthSnapshot: {
        currentPain: "Knee pain during deep flexion",
        coachReviewRequired: true,
        movementLimitations: ["Squat"],
        allergies: ["Shellfish"]
      }
    },
    program: {
      id: "program-123",
      phaseLabel: "Phase 1",
      goal: "Body Recomposition",
      status: "active",
      currentDayLabel: "Saturday, August 8, 2026",
      currentWorkoutLabel: "Glutes + Hamstrings",
      scheduledWorkoutCount: 4,
      recentExerciseKeys: ["barbell-hip-thrust", "romanian-deadlift"],
      recentPerformanceSummary: ["barbell hip thrust · 80 kg · 10 reps"],
      recentSessions: [{ id: "session-1", completedAt: "2026-08-09T08:00:00.000Z", durationMinutes: 68, notes: null }]
    },
    workout: {
      recentSessions: [{ id: "session-1", completedAt: "2026-08-09T08:00:00.000Z", durationMinutes: 68, notes: null }]
    },
    nutrition: {
      planName: "Training Nutrition Plan",
      status: "active",
      dayType: "training",
      calendarDate: "2026-08-10",
      calorieTarget: 2050,
      macroTarget: "2050 kcal · 140P · 220C · 60F",
      mealProgress: {
        plannedMeals: 4,
        selectedMeals: 3,
        eatenMeals: 2,
        hydrationMl: 1600,
        hydrationTargetMl: 2500,
        supplementsCompleted: 1,
        supplementsTotal: 2
      },
      safetyHighlights: ["Shellfish"]
    },
    progress: {
      trendSummary: "Waist moved to 72.8 cm and weight is steady.",
      latestMeasurements: ["Waist: 72.8 cm", "Weight: 62.8 kg"],
      lastSavedAt: "2026-08-10T08:00:00.000Z"
    },
    checkIn: {
      weekStartDate: "2026-08-09",
      weekEndDate: "2026-08-15",
      status: "submitted",
      reviewLabel: "Coach review required",
      reviewSummary: "A safety-sensitive signal is present.",
      triggerKeys: ["pain_discomfort", "recovery"],
      adherence: {
        training: 68,
        nutrition: 74
      }
    }
  };

  const fallback = aiEngine.buildFallbackRecommendation(context);
  assert.equal(fallback.source, "fallback");
  assert.equal(fallback.recommendationType, "coach_review");
  assert.equal(fallback.application.canApplyAutomatically, false);
  assert.equal(fallback.application.status, "recommended");
  assert.equal(fallback.nextPhase.title, "Stabilize and review");
  assert.ok(fallback.safetyNotes.some((note) => note.includes("Do not auto-apply")));
  assert.doesNotThrow(() => aiSchemas.coachRecommendationPayloadSchema.parse(fallback));
});

test("coach recommendation records keep application state separate from the payload", () => {
  const context = {
    contextType: "phase_review",
    contextKey: "program-123",
    generatedAt: "2026-08-10T08:00:00.000Z",
    athlete: {
      displayName: "Alex",
      onboardingStatus: "completed",
      goal: "Body Recomposition",
      priorities: ["Glutes", "Legs", "Abdomen"],
      trainingDaysPerWeek: 4,
      scheduleSnapshot: ["4 days"],
      nutritionSnapshot: ["Meal prep"],
      healthSnapshot: {
        currentPain: null,
        coachReviewRequired: false,
        movementLimitations: [],
        allergies: []
      }
    },
    program: {
      id: "program-123",
      phaseLabel: "Phase 1",
      goal: "Body Recomposition",
      status: "active",
      currentDayLabel: "Saturday, August 8, 2026",
      currentWorkoutLabel: "Glutes + Hamstrings",
      scheduledWorkoutCount: 4,
      recentExerciseKeys: ["barbell-hip-thrust"],
      recentPerformanceSummary: ["barbell hip thrust · 80 kg · 10 reps"],
      recentSessions: []
    },
    workout: {
      recentSessions: []
    },
    nutrition: {
      planName: "Training Nutrition Plan",
      status: "active",
      dayType: "training",
      calendarDate: "2026-08-10",
      calorieTarget: 2050,
      macroTarget: "2050 kcal · 140P · 220C · 60F",
      mealProgress: {
        plannedMeals: 4,
        selectedMeals: 3,
        eatenMeals: 2,
        hydrationMl: 1600,
        hydrationTargetMl: 2500,
        supplementsCompleted: 1,
        supplementsTotal: 2
      },
      safetyHighlights: []
    },
    progress: {
      trendSummary: "Stable.",
      latestMeasurements: ["Waist: 72.8 cm"],
      lastSavedAt: "2026-08-10T08:00:00.000Z"
    },
    checkIn: {
      weekStartDate: "2026-08-09",
      weekEndDate: "2026-08-15",
      status: "submitted",
      reviewLabel: "No weekly check-in yet",
      reviewSummary: "No submitted weekly check-in is available yet.",
      triggerKeys: [],
      adherence: {
        training: 88,
        nutrition: 90
      }
    }
  };

  const fallback = aiEngine.buildFallbackRecommendation(context);
  const insert = aiRecommendationService.buildCoachRecommendationInsert("00000000-0000-4000-8000-000000000099", context, {
    payload: fallback,
    source: "fallback",
    model: "fallback",
    generationStatus: "fallback",
    errorMessage: "OpenAI unavailable."
  });

  assert.equal(insert.application_status, "recommended");
  assert.equal(insert.applied_at, null);
  assert.equal(insert.source, "fallback");
  assert.equal(insert.context_type, "phase_review");
  assert.equal(insert.recommendation_type, fallback.recommendationType);
});

test("program change previews stay typed and preserve the before/after boundary", () => {
  const bundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000099");
  const commandOptions = changeProposalService.buildProgramChangeCommandOptions({
    source: "remote",
    program: programService.buildProgramBundleFromProposal("00000000-0000-4000-8000-000000000099", onboarding.onboardingDemoState.program).program,
    activeProgram: bundle.program,
    activePhase: bundle.phase,
    templates: bundle.templates,
    templateExercises: bundle.templateExercises,
    scheduledWorkouts: bundle.scheduledWorkouts,
    selectedDateKey: bundle.scheduledWorkouts[0]?.scheduled_date ?? null,
    monthLabel: bundle.scheduledWorkouts[0]?.scheduled_date ?? null,
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  });

  assert.ok(commandOptions.length > 0);
  const selected = commandOptions[0];
  const recommendation = {
    id: "00000000-0000-4000-8000-000000000199",
    userId: "00000000-0000-4000-8000-000000000099",
    contextType: "phase_review",
    contextKey: "program-123",
    source: "fallback",
    generationStatus: "fallback",
    model: "fallback",
    promptVersion: "coachx-ai-v1",
    title: "Phase review",
    summary: "Preview the current phase.",
    recommendationType: "program_adjustment",
    applicationStatus: "recommended",
    appliedAt: null,
    appliedChangeSummary: null,
    fallbackReason: null,
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    payload: aiEngine.buildFallbackRecommendation({
      contextType: "phase_review",
      contextKey: "program-123",
      generatedAt: "2026-08-10T08:00:00.000Z",
      athlete: {
        displayName: "Alex",
        onboardingStatus: "completed",
        goal: "Body Recomposition",
        priorities: ["Glutes", "Legs", "Abdomen"],
        trainingDaysPerWeek: 4,
        scheduleSnapshot: ["4 days"],
        nutritionSnapshot: ["Meal prep"],
        healthSnapshot: {
          currentPain: null,
          coachReviewRequired: false,
          movementLimitations: [],
          allergies: []
        }
      },
      program: {
        id: bundle.program.id,
        phaseLabel: bundle.program.phaseLabel,
        goal: bundle.program.goal,
        status: "active",
        currentDayLabel: "Saturday, August 8, 2026",
        currentWorkoutLabel: bundle.templates[0].name,
        scheduledWorkoutCount: bundle.scheduledWorkouts.length,
        recentExerciseKeys: ["barbell-hip-thrust"],
        recentPerformanceSummary: ["barbell hip thrust · 80 kg · 10 reps"],
        recentSessions: []
      },
      workout: { recentSessions: [] },
      nutrition: {
        planName: "Training Nutrition Plan",
        status: "active",
        dayType: "training",
        calendarDate: "2026-08-10",
        calorieTarget: 2050,
        macroTarget: "2050 kcal · 140P · 220C · 60F",
        mealProgress: {
          plannedMeals: 4,
          selectedMeals: 3,
          eatenMeals: 2,
          hydrationMl: 1600,
          hydrationTargetMl: 2500,
          supplementsCompleted: 1,
          supplementsTotal: 2
        },
        safetyHighlights: []
      },
      progress: {
        trendSummary: "Stable.",
        latestMeasurements: ["Waist: 72.8 cm"],
        lastSavedAt: "2026-08-10T08:00:00.000Z"
      },
      checkIn: {
        weekStartDate: "2026-08-09",
        weekEndDate: "2026-08-15",
        status: "submitted",
        reviewLabel: "No weekly check-in yet",
        reviewSummary: "No submitted weekly check-in is available yet.",
        triggerKeys: [],
        adherence: { training: 88, nutrition: 90 }
      }
    })
  };

  const draft = changeProposalService.buildProgramChangeProposalFromCommand(bundle, recommendation, selected.command);
  assert.equal(draft.status, "proposed");
  assert.equal(draft.targetEntityType, selected.command.type === "phase_extension" ? "program_phase" : selected.command.type === "workout_reschedule" ? "scheduled_workout" : "workout_template_exercise");
  assert.equal(draft.validationResult.status, "approved");
  assert.ok(draft.beforeSnapshot.headline.length > 0);
  assert.ok(draft.afterSnapshot.headline.length > 0);
});

function createFakeProgramChangeClient(seedState) {
  const state = structuredClone(seedState);

  function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function matchesRow(row, filters) {
    return filters.every((filter) => {
      if (filter.kind === "eq") {
        return row[filter.column] === filter.value;
      }

      if (filter.kind === "in") {
        return filter.values.includes(row[filter.column]);
      }

      return true;
    });
  }

  function applyOrdering(rows, order) {
    if (!order) {
      return rows;
    }

    return rows.slice().sort((left, right) => {
      const leftValue = left[order.column];
      const rightValue = right[order.column];

      if (leftValue === rightValue) {
        return 0;
      }

      return order.ascending ? (leftValue > rightValue ? 1 : -1) : leftValue > rightValue ? -1 : 1;
    });
  }

  function runQuery(tableName, query) {
    const table = state[tableName];

    if (query.type === "insert") {
      const inserted = query.payload.map((row) => ({
        id: row.id ?? createId(),
        created_at: row.created_at ?? "2026-08-10T08:00:00.000Z",
        updated_at: row.updated_at ?? row.created_at ?? "2026-08-10T08:00:00.000Z",
        ...structuredClone(row)
      }));
      table.push(...inserted);
      return inserted;
    }

    if (query.type === "update") {
      const rows = table.filter((row) => matchesRow(row, query.filters));
      for (const row of rows) {
        Object.assign(row, query.payload, { updated_at: "2026-08-10T09:00:00.000Z" });
      }
      return rows;
    }

    let rows = table.filter((row) => matchesRow(row, query.filters));
    rows = applyOrdering(rows, query.order);
    if (typeof query.limit === "number") {
      rows = rows.slice(0, query.limit);
    }
    return rows;
  }

  function createQuery(tableName) {
    const query = {
      type: "select",
      filters: [],
      payload: null,
      order: null,
      limit: null
    };

    const api = {
      select() {
        return api;
      },
      eq(column, value) {
        query.filters.push({ kind: "eq", column, value });
        return api;
      },
      in(column, values) {
        query.filters.push({ kind: "in", column, values });
        return api;
      },
      order(column, options) {
        query.order = { column, ascending: options?.ascending !== false };
        return api;
      },
      limit(count) {
        query.limit = count;
        return api;
      },
      update(values) {
        query.type = "update";
        query.payload = values;
        return api;
      },
      insert(values) {
        query.type = "insert";
        query.payload = Array.isArray(values) ? values : [values];
        return api;
      },
      async maybeSingle() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: null };
      },
      async single() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: rows[0] ? null : new Error("Not found") };
      }
    };

    return api;
  }

  return {
    state,
    from(tableName) {
      return createQuery(tableName);
    },
    async rpc(name, args) {
      if (name !== "apply_program_change_proposal") {
        return { data: null, error: new Error("Unexpected rpc") };
      }

      const proposal = state.program_change_proposals.find((row) => row.id === args.p_proposal_id);
      if (!proposal) {
        return { data: null, error: new Error("Not found") };
      }

      if (proposal.status === "applied") {
        return { data: proposal, error: null };
      }

      if (proposal.status !== "proposed" || proposal.validation_result.status !== "approved") {
        return { data: null, error: new Error("Requires review") };
      }

      if (proposal.change_type === "phase_extension") {
        const phase = state.program_phases.find((row) => row.id === proposal.target_entity_id);
        if (!phase) {
          proposal.status = "superseded";
          proposal.validation_result = { status: "needs_review", messages: ["The phase was no longer available."], safetyFlags: [], sourceUpdatedAt: proposal.source_updated_at };
          return { data: proposal, error: null };
        }

        if (proposal.source_updated_at && phase.updated_at !== proposal.source_updated_at) {
          proposal.status = "superseded";
          proposal.validation_result = { status: "needs_review", messages: ["The phase changed after the proposal was created."], safetyFlags: [], sourceUpdatedAt: proposal.source_updated_at };
          return { data: proposal, error: null };
        }

        phase.end_date = proposal.change_command.proposedEndDate;
        phase.week_count += 1;
        phase.updated_at = "2026-08-10T09:00:00.000Z";
      }

      if (state.program_change_events.some((event) => event.proposal_id === proposal.id)) {
        proposal.status = "applied";
        proposal.applied_at = proposal.applied_at ?? "2026-08-10T09:00:00.000Z";
        return { data: proposal, error: null };
      }

      state.program_change_events.push({
        id: createId(),
        user_id: proposal.user_id,
        program_id: proposal.program_id,
        proposal_id: proposal.id,
        recommendation_id: proposal.recommendation_id,
        change_type: proposal.change_type,
        before_snapshot: structuredClone(proposal.before_snapshot),
        after_snapshot: structuredClone(proposal.after_snapshot),
        source: proposal.recommendation_id ? "ai" : "deterministic",
        applied_at: "2026-08-10T09:00:00.000Z",
        created_at: "2026-08-10T09:00:00.000Z"
      });

      proposal.status = "applied";
      proposal.applied_at = "2026-08-10T09:00:00.000Z";
      return { data: proposal, error: null };
    }
  };
}

test("program change proposals create once, detect staleness, and stay idempotent on apply", async () => {
  const bundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000099");
  const bundleView = programService.createProgramBundleFromRows(bundle.program, bundle.phase, bundle.templates, bundle.templateExercises, bundle.scheduledWorkouts);
  const recommendation = {
    id: "00000000-0000-4000-8000-000000000299",
    userId: "00000000-0000-4000-8000-000000000099",
    contextType: "phase_review",
    contextKey: "program-123",
    source: "fallback",
    generationStatus: "fallback",
    model: "fallback",
    promptVersion: "coachx-ai-v1",
    title: "Phase review",
    summary: "Preview the current phase.",
    recommendationType: "program_adjustment",
    applicationStatus: "recommended",
    appliedAt: null,
    appliedChangeSummary: null,
    fallbackReason: null,
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    payload: aiEngine.buildFallbackRecommendation({
      contextType: "phase_review",
      contextKey: "program-123",
      generatedAt: "2026-08-10T08:00:00.000Z",
      athlete: {
        displayName: "Alex",
        onboardingStatus: "completed",
        goal: "Body Recomposition",
        priorities: ["Glutes", "Legs", "Abdomen"],
        trainingDaysPerWeek: 4,
        scheduleSnapshot: ["4 days"],
        nutritionSnapshot: ["Meal prep"],
        healthSnapshot: {
          currentPain: null,
          coachReviewRequired: false,
          movementLimitations: [],
          allergies: []
        }
      },
      program: {
        id: bundle.program.id,
        phaseLabel: bundle.program.phaseLabel,
        goal: bundle.program.goal,
        status: "active",
        currentDayLabel: "Saturday, August 8, 2026",
        currentWorkoutLabel: bundle.templates[0].name,
        scheduledWorkoutCount: bundle.scheduledWorkouts.length,
        recentExerciseKeys: ["barbell-hip-thrust"],
        recentPerformanceSummary: ["barbell hip thrust · 80 kg · 10 reps"],
        recentSessions: []
      },
      workout: { recentSessions: [] },
      nutrition: {
        planName: "Training Nutrition Plan",
        status: "active",
        dayType: "training",
        calendarDate: "2026-08-10",
        calorieTarget: 2050,
        macroTarget: "2050 kcal · 140P · 220C · 60F",
        mealProgress: {
          plannedMeals: 4,
          selectedMeals: 3,
          eatenMeals: 2,
          hydrationMl: 1600,
          hydrationTargetMl: 2500,
          supplementsCompleted: 1,
          supplementsTotal: 2
        },
        safetyHighlights: []
      },
      progress: {
        trendSummary: "Stable.",
        latestMeasurements: ["Waist: 72.8 cm"],
        lastSavedAt: "2026-08-10T08:00:00.000Z"
      },
      checkIn: {
        weekStartDate: "2026-08-09",
        weekEndDate: "2026-08-15",
        status: "submitted",
        reviewLabel: "No weekly check-in yet",
        reviewSummary: "No submitted weekly check-in is available yet.",
        triggerKeys: [],
        adherence: { training: 88, nutrition: 90 }
      }
    })
  };
  const commandOptions = changeProposalService.buildProgramChangeCommandOptions(bundleView);
  assert.ok(commandOptions.length > 0);
  const command = commandOptions.find((option) => option.command.type === "phase_extension")?.command ?? commandOptions[0].command;
  if (command.type === "phase_extension") {
    assert.equal(
      new Date(`${command.proposedEndDate}T00:00:00Z`).getTime() - new Date(`${command.currentEndDate}T00:00:00Z`).getTime(),
      7 * 24 * 60 * 60 * 1000
    );
  }

  const client = createFakeProgramChangeClient({
    ai_recommendations: [
      {
        id: recommendation.id,
        user_id: recommendation.userId,
        context_type: recommendation.contextType,
        context_key: recommendation.contextKey,
        source: recommendation.source,
        generation_status: recommendation.generationStatus,
        model: recommendation.model,
        prompt_version: recommendation.promptVersion,
        title: recommendation.title,
        summary: recommendation.summary,
        recommendation_type: recommendation.recommendationType,
        recommendation_payload: recommendation.payload,
        context_snapshot: recommendation.contextSnapshot,
        application_status: recommendation.applicationStatus,
        applied_at: recommendation.appliedAt,
        applied_change_summary: recommendation.appliedChangeSummary,
        error_message: recommendation.fallbackReason,
        created_at: recommendation.createdAt,
        updated_at: recommendation.updatedAt
      }
    ],
    program_change_proposals: [],
    program_change_events: [],
    programs: [bundleView.program],
    program_phases: [bundleView.activePhase],
    workout_templates: bundleView.templates,
    workout_template_exercises: bundleView.templateExercises,
    scheduled_workouts: bundleView.scheduledWorkouts
  });

  const proposal = await changeProposalService.createProgramChangeProposal(client, recommendation.userId, recommendation, {
    source: "remote",
    program: bundleView.program,
    activeProgram: bundleView.activeProgram,
    activePhase: bundleView.activePhase,
    templates: bundleView.templates,
    templateExercises: bundleView.templateExercises,
    scheduledWorkouts: bundleView.scheduledWorkouts,
    selectedDateKey: bundleView.scheduledWorkouts[0]?.scheduled_date ?? null,
    monthLabel: bundleView.scheduledWorkouts[0]?.scheduled_date ?? null,
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  }, command);

  const duplicate = await changeProposalService.createProgramChangeProposal(client, recommendation.userId, recommendation, {
    source: "remote",
    program: bundleView.program,
    activeProgram: bundleView.activeProgram,
    activePhase: bundleView.activePhase,
    templates: bundleView.templates,
    templateExercises: bundleView.templateExercises,
    scheduledWorkouts: bundleView.scheduledWorkouts,
    selectedDateKey: bundleView.scheduledWorkouts[0]?.scheduled_date ?? null,
    monthLabel: bundleView.scheduledWorkouts[0]?.scheduled_date ?? null,
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  }, command);

  assert.equal(proposal.id, duplicate.id);
  assert.equal(client.state.program_change_proposals.length, 1);

  const staleProposal = client.state.program_change_proposals[0];
  client.state.program_phases[0].updated_at = "2026-08-10T09:30:00.000Z";
  const staleResult = await changeProposalService.applyProgramChangeProposal(client, staleProposal.id);
  assert.equal(staleResult.status, "superseded");
  assert.equal(client.state.program_change_events.length, 0);

  client.state.program_phases[0].updated_at = staleProposal.source_updated_at ?? client.state.program_phases[0].updated_at;
  staleProposal.status = "proposed";
  staleProposal.validation_result = { status: "approved", messages: [], safetyFlags: [], sourceUpdatedAt: staleProposal.source_updated_at };
  const applied = await changeProposalService.applyProgramChangeProposal(client, staleProposal.id);
  const appliedAgain = await changeProposalService.applyProgramChangeProposal(client, staleProposal.id);
  assert.equal(applied.status, "applied");
  assert.equal(appliedAgain.status, "applied");
  assert.equal(client.state.program_change_events.length, 1);
});

test("weekly check-in service creates one record and updates the same response row", async () => {
  const client = createFakeCheckinClient({
    weekly_checkins: [],
    weekly_checkin_responses: [],
    weekly_checkin_reviews: [],
    scheduled_workouts: [
      { id: "00000000-0000-4000-8000-000000000031", user_id: "00000000-0000-4000-8000-000000000099", scheduled_date: "2026-08-09", status: "completed", created_at: "2026-08-09T08:00:00.000Z", updated_at: "2026-08-09T08:00:00.000Z" },
      { id: "00000000-0000-4000-8000-000000000032", user_id: "00000000-0000-4000-8000-000000000099", scheduled_date: "2026-08-10", status: "scheduled", created_at: "2026-08-09T08:00:00.000Z", updated_at: "2026-08-09T08:00:00.000Z" }
    ],
    nutrition_days: [
      { id: "00000000-0000-4000-8000-000000000033", user_id: "00000000-0000-4000-8000-000000000099", calendar_date: "2026-08-09", status: "completed", created_at: "2026-08-09T08:00:00.000Z", updated_at: "2026-08-09T08:00:00.000Z" },
      { id: "00000000-0000-4000-8000-000000000034", user_id: "00000000-0000-4000-8000-000000000099", calendar_date: "2026-08-10", status: "planned", created_at: "2026-08-09T08:00:00.000Z", updated_at: "2026-08-09T08:00:00.000Z" }
    ],
    progress_entries: [
      { id: "00000000-0000-4000-8000-000000000035", user_id: "00000000-0000-4000-8000-000000000099", entry_date: "2026-08-09", entry_type: "measurement", weight_kg: 62, notes: null, source: "manual", created_at: "2026-08-09T08:00:00.000Z", updated_at: "2026-08-09T08:00:00.000Z" }
    ]
  });

  const created = await checkinService.getOrCreateWeeklyCheckin(
    client,
    "00000000-0000-4000-8000-000000000099",
    "2026-08-09",
    "00000000-0000-4000-8000-000000000090",
    "00000000-0000-4000-8000-000000000091"
  );
  assert.equal(client.state.weekly_checkins.length, 1);
  assert.equal(created.checkin.user_id, "00000000-0000-4000-8000-000000000099");

  const responseA = await checkinService.saveCheckinResponse(client, "00000000-0000-4000-8000-000000000099", created.checkin.id, {
    questionKey: "training_adherence",
    responseType: "scale",
    numericValue: 4
  });
  const responseB = await checkinService.saveCheckinResponse(client, "00000000-0000-4000-8000-000000000099", created.checkin.id, {
    questionKey: "training_adherence",
    responseType: "scale",
    numericValue: 5
  });

  assert.equal(client.state.weekly_checkin_responses.length, 1);
  assert.equal(responseA.numeric_value, 4);
  assert.equal(responseB.numeric_value, 5);

  const submitted = await checkinService.submitWeeklyCheckin(client, "00000000-0000-4000-8000-000000000099", created.checkin.id, "steady week");
  assert.equal(submitted.checkin.status, "submitted");
  assert.equal(client.state.weekly_checkins[0].submitted_at != null, true);
  assert.equal(client.state.weekly_checkin_reviews.length, 1);
  assert.equal(submitted.summary.reviewReason.triggerKeys.length >= 0, true);
});

test("program update remains explicit", () => {
  const current = profileSettings.createProfileSnapshot();
  const updatedProgram = profileSettings.applySnapshotToProgram(onboarding.onboardingDemoState.program, current);
  assert.equal(updatedProgram.goal, current.goals.mainGoal);
  assert.equal(updatedProgram.status, onboarding.onboardingDemoState.program.status);
});

test("route helpers keep authenticated users out of entry", () => {
  assert.equal(authNavigation.resolveAthleteRouteForStatus("not_started"), "/entry");
  assert.equal(authNavigation.resolveAthleteRouteForStatus("in_progress"), "/onboarding");
  assert.equal(authNavigation.resolveAthleteRouteForStatus("completed"), "/");
});

test("session preference and safe redirect helpers stay narrow", () => {
  assert.equal(authSessionPolicy.readRememberSessionPreference(false), false);
  assert.equal(authSessionPolicy.getRememberSessionPreferenceLabel(true), "Keep me signed in");
  assert.equal(authSessionPolicy.getRememberSessionPreferenceLabel(false), "Sign out when this browser session ends");
  assert.equal(authSessionPolicy.resolveSafeInternalPath("/reset-password"), "/reset-password");
  assert.equal(authSessionPolicy.resolveSafeInternalPath("https://evil.example/reset-password"), "/");
  assert.equal(authSessionPolicy.resolveSafeInternalPath("//evil.example"), "/");
});

test("auth error mapper keeps user-facing copy plain", () => {
  assert.equal(authErrors.mapAuthErrorMessage("Google access was denied"), "Google access was denied. Try again.");
  assert.equal(authErrors.mapAuthErrorMessage("Invalid login"), "That email and password don't match.");
  assert.equal(authErrors.mapAuthErrorMessage("Network error"), "Couldn't connect. Try again.");
  assert.equal(authErrors.mapAuthErrorMessage(null), "Something went wrong. Try again.");
});

test("identity workspace resolution stays backend-bound", () => {
  assert.equal(
    identityResolver.resolveIdentityWorkspace({
      athleteCapability: true,
      coachCapability: false,
      coachManaged: false,
      preferredWorkspace: "coach"
    }),
    "athlete"
  );
  assert.equal(
    identityResolver.resolveIdentityWorkspace({
      athleteCapability: true,
      coachCapability: true,
      coachManaged: false,
      preferredWorkspace: "coach"
    }),
    "coach"
  );
  assert.equal(
    identityResolver.resolveIdentityWorkspace({
      athleteCapability: true,
      coachCapability: true,
      coachManaged: true,
      preferredWorkspace: null
    }),
    "athlete"
  );
});

test("coach relationship summary parser only exposes safe fields", () => {
  assert.equal(coachRelationshipService.parseCoachRelationshipSummary(null), null);
  assert.deepEqual(
    coachRelationshipService.parseCoachRelationshipSummary({
      coachUserId: "00000000-0000-0000-0000-000000000001",
      coachDisplayName: "Coach Test",
      coachAvatarPath: null,
      assignmentStatus: "active",
      managementMode: "coach_managed",
      assignedAt: "2026-08-12T10:00:00.000Z",
      acceptedAt: "2026-08-12T10:10:00.000Z",
      endedAt: null
    }),
    {
      coachUserId: "00000000-0000-0000-0000-000000000001",
      coachDisplayName: "Coach Test",
      coachAvatarPath: null,
      assignmentStatus: "active",
      managementMode: "coach_managed",
      assignedAt: "2026-08-12T10:00:00.000Z",
      acceptedAt: "2026-08-12T10:10:00.000Z",
      endedAt: null
    }
  );
});

test("coach role detection and assignment checks are explicit", () => {
  assert.deepEqual(coachPolicy.resolveCoachAccess(false, false), {
    allowed: false,
    reason: "Coach access is required."
  });
  assert.deepEqual(coachPolicy.resolveCoachAccess(true, false), {
    allowed: false,
    reason: "This athlete is not assigned to the current coach."
  });
  assert.deepEqual(coachPolicy.resolveCoachAccess(true, true), {
    allowed: true,
    reason: null
  });
});

test("coach attention queue logic stays deterministic", () => {
  const reasons = coachPolicy.buildCoachAttentionReasons({
    needsCheckInReview: true,
    triggerKeys: ["pain_discomfort", "recovery", "training_adherence", "nutrition_adherence", "pain_discomfort"],
    recommendationStatus: "reviewing",
    proposalStatus: "proposed",
    missedCheckIn: true,
    coachReviewRequired: true
  });

  assert.deepEqual(reasons, [
    "Check-in needs attention",
    "Reported pain",
    "Low recovery",
    "Low training adherence",
    "Low nutrition adherence",
    "Pending recommendation",
    "Pending proposal",
    "Missed check-in",
    "Coach review required"
  ]);
});

test("coach review action mapping preserves explicit decisions", () => {
  assert.equal(coachPolicy.mapCoachCheckinActionToStatus("followup_requested", ""), "needs_attention");
  assert.equal(coachPolicy.mapCoachCheckinActionToStatus("checkin_acknowledged", ""), "acknowledged");
  assert.equal(coachPolicy.mapCoachRecommendationActionToStatus("recommendation_rejected", ""), "rejected");
  assert.equal(coachPolicy.mapCoachProposalActionToStatus("proposal_approved", ""), "approved");
  assert.equal(coachPolicy.mapCoachProposalActionToStatus("proposal_rejected", ""), "rejected");
});

test("coach action audit metadata stays structured", () => {
  assert.deepEqual(
    coachPolicy.buildCoachActionAuditMetadata({
      actionType: "checkin_reviewed",
      status: "reviewed",
      note: "Ready for follow-up"
    }),
    {
      actionType: "checkin_reviewed",
      status: "reviewed",
      note: "Ready for follow-up"
    }
  );
});

test("athlete rows preserve profile and snapshot data", () => {
  const snapshot = profileSettings.createProfileSnapshot();
  const profileRow = athleteService.buildAthleteProfileRow("00000000-0000-0000-0000-000000000001", snapshot, "completed", "2026-08-08T08:00:00.000Z");
  const preferencesRow = athleteService.buildAthletePreferencesRow("00000000-0000-0000-0000-000000000001", snapshot);

  assert.equal(profileRow.display_name, snapshot.profile.name);
  assert.equal(profileRow.onboarding_status, "completed");
  assert.equal(preferencesRow.user_id, "00000000-0000-0000-0000-000000000001");
  assert.deepEqual(preferencesRow.goals, snapshot.goals);
});

test("athlete profile avatar migration adds the nullable path idempotently", async () => {
  const migration = await readFile(path.join(repoRoot, "supabase", "migrations", "20260811_athlete_profile_avatar_path.sql"), "utf8");

  assert.match(migration, /alter table public\.athlete_profiles\s+add column if not exists avatar_path text null/i);
});

test("identity relationship migration adds secure invitation and relationship RPCs", async () => {
  const migration = await readFile(path.join(repoRoot, "supabase", "migrations", "20260812_identity_relationship_gateway.sql"), "utf8");

  assert.match(migration, /coach_athlete_assignments_status_check/i);
  assert.match(migration, /status in \('invited', 'pending', 'active', 'paused', 'ended', 'revoked'\)/i);
  assert.match(migration, /create or replace function public\.coach_create_assignment_invitation/i);
  assert.match(migration, /create or replace function public\.coach_accept_assignment_invitation/i);
  assert.match(migration, /create or replace function public\.get_my_coach_relationship/i);
  assert.match(migration, /grant execute on function public\.coach_accept_assignment_invitation/i);
});

test("remote snapshots hydrate onboarding state without changing the active program", () => {
  const snapshot = profileSettings.createProfileSnapshot();
  const remote = {
    snapshot,
    onboardingStatus: "in_progress",
    onboardingCompletedAt: null,
    profilePresent: true,
    preferencesPresent: true,
    source: "remote"
  };
  const hydrated = athleteService.mergeRemoteSnapshotIntoOnboardingState(onboarding.onboardingDemoState, remote);

  assert.equal(hydrated.profile.name, snapshot.profile.name);
  assert.equal(hydrated.progress.status, "in-progress");
  assert.equal(hydrated.program.status, onboarding.onboardingDemoState.program.status);
});

test("remote hydration preserves the current locale when the stored row has no locale field", () => {
  const snapshot = profileSettings.createProfileSnapshot();
  const remote = {
    snapshot,
    onboardingStatus: "completed",
    onboardingCompletedAt: "2026-08-08T10:00:00.000Z",
    profilePresent: true,
    preferencesPresent: true,
    localePresent: false,
    source: "remote"
  };
  const hydrated = athleteService.mergeRemoteSnapshotIntoOnboardingState(
    {
      ...onboarding.onboardingDemoState,
      profile: { ...onboarding.onboardingDemoState.profile, locale: "de" }
    },
    remote
  );

  assert.equal(hydrated.profile.locale, "de");
  assert.equal(hydrated.progress.status, "complete");
});

test("OAuth placeholder profiles preserve the language selected before sign-in", () => {
  const snapshot = profileSettings.createProfileSnapshot();
  const remote = {
    snapshot: { ...snapshot, profile: { ...snapshot.profile, locale: "es" } },
    onboardingStatus: "not_started",
    onboardingCompletedAt: null,
    profilePresent: true,
    preferencesPresent: false,
    localePresent: true,
    source: "remote"
  };

  assert.equal(athleteService.resolveAthleteSnapshotLocale(remote, "de"), "de");
});

test("saved profiles remain authoritative for language after sign-in", () => {
  const snapshot = profileSettings.createProfileSnapshot();
  const remote = {
    snapshot: { ...snapshot, profile: { ...snapshot.profile, locale: "ca" } },
    onboardingStatus: "completed",
    onboardingCompletedAt: "2026-08-08T10:00:00.000Z",
    profilePresent: true,
    preferencesPresent: true,
    localePresent: true,
    source: "remote"
  };

  assert.equal(athleteService.resolveAthleteSnapshotLocale(remote, "de"), "ca");
});

test("initial locale prefers the provided server locale before persisted browser state", () => {
  assert.equal(i18n.getInitialLocale("ca"), "ca");
});

test("language is a global settings section instead of personal profile data", () => {
  const languageSection = profileSettings.profileSectionOrder.find((section) => section.id === "language");

  assert.equal(languageSection?.route, "/profile/preferences/language");
  assert.equal(profileSettings.profileSectionOrder.find((section) => section.id === "personal")?.summary.includes("Language"), false);
});

test("feedback notices resolve consistent titles across locales", () => {
  const english = feedback.buildFeedbackNotice("en", {
    actionId: "workout.set",
    kind: "success",
    detail: "Your reps and load are saved."
  });
  const german = feedback.buildFeedbackNotice("de", {
    actionId: "workout.set",
    kind: "success",
    detail: "Deine Wiederholungen und Last sind gespeichert."
  });

  assert.equal(english.kind, "success");
  assert.equal(english.placement, "inline");
  assert.equal(german.kind, "success");
  assert.equal(german.placement, "inline");
  assert.notEqual(english.title, german.title);
});

test("feedback memory deduplicates repeated notices by action and state", () => {
  const initial = feedback.createInitialFeedbackMemory();
  const notice = feedback.buildFeedbackNotice("en", {
    actionId: "profile.locale",
    kind: "success",
    detail: "Your choice will stay with this device."
  });
  const memory = {
    recent: [notice, { ...notice, id: "duplicate" }],
    lastByAction: { "profile.locale": notice }
  };

  const revived = feedback.reviveFeedbackMemory(feedback.serializeFeedbackMemory(memory));
  assert.equal(revived.recent.length, 2);
  assert.equal(initial.recent.length, 0);
  assert.equal(revived.lastByAction["profile.locale"]?.actionId, "profile.locale");
});

test("nutrition snapshots derive training and rest contexts from the program calendar", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000010");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const trainingSummary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const restSummary = programService.getProgramDaySummary(bundleView, "2026-08-09");
  const trainingSnapshot = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    trainingSummary,
    "00000000-0000-4000-8000-000000000011",
    bundleView.activeProgram?.id ?? null
  );
  const restSnapshot = nutritionService.createNutritionStoreSnapshot(
    "2026-08-09",
    restSummary,
    "00000000-0000-4000-8000-000000000011",
    bundleView.activeProgram?.id ?? null
  );

  assert.equal(trainingSnapshot.day.dayType, "training");
  assert.equal(restSnapshot.day.dayType, "rest");
  assert.equal(nutritionService.buildNutritionDayView(trainingSnapshot).title, "Glutes + Hamstrings");
  assert.equal(nutritionService.buildNutritionDayView(restSnapshot).title, "Recovery Day");
});

test("current date keys use local civil calendar fields", () => {
  assert.equal(programService.getCurrentLocalDateKey(new Date(2026, 7, 11, 0, 30)), "2026-08-11");
  assert.equal(programService.getCurrentLocalDateKey(new Date(2026, 0, 2, 23, 30)), "2026-01-02");
});

test("explicit nutrition dates take precedence over the current local date", () => {
  assert.equal(programService.resolveDateKeyOrCurrentLocal("2026-08-08", "2026-08-11"), "2026-08-08");
  assert.equal(programService.resolveDateKeyOrCurrentLocal(null, "2026-08-11"), "2026-08-11");
});

test("calendar marks the civil current date independently from the selected date", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000018");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const days = programService.buildCalendarDays(bundleView, "2026-08-01", "2026-08-08", "2026-08-11");

  assert.equal(days.find((day) => day.key === "2026-08-08")?.isSelected, true);
  assert.equal(days.find((day) => day.key === "2026-08-08")?.isToday, false);
  assert.equal(days.find((day) => day.key === "2026-08-11")?.isSelected, false);
  assert.equal(days.find((day) => day.key === "2026-08-11")?.isToday, true);
});

test("an unscheduled current day resolves to rest without mutating the program", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000019");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const scheduledBefore = structuredClone(bundleView.scheduledWorkouts);
  const today = programService.getCurrentLocalDateKey(new Date(2026, 7, 11, 12));
  const summary = programService.getProgramDaySummary(bundleView, today);

  assert.equal(summary?.dateKey, "2026-08-11");
  assert.equal(summary?.isRestDay, true);
  assert.equal(summary?.scheduledWorkoutId, "");
  assert.deepEqual(bundleView.scheduledWorkouts, scheduledBefore);
});

test("nutrition selections update in place and do not duplicate slot records", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000012");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    summary,
    "00000000-0000-4000-8000-000000000013",
    bundleView.activeProgram?.id ?? null
  );
  const selected = nutritionService.applyMealSelection(initial, "lunch", "chicken-rice-bowl");
  const changed = nutritionService.applyMealSelection(selected, "lunch", "turkey-wrap");
  const updatedSlot = changed.selections.find((selection) => selection.mealSlotId === "lunch");

  assert.equal(changed.selections.filter((selection) => selection.mealSlotId === "lunch").length, 1);
  assert.equal(updatedSlot?.mealOptionId, "turkey-wrap");
});

test("nutrition hydration, supplement, and meal completion restore through the snapshot boundary", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000014");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    summary,
    "00000000-0000-4000-8000-000000000015",
    bundleView.activeProgram?.id ?? null
  );
  const selected = nutritionService.applyMealSelection(initial, "lunch", "chicken-rice-bowl");
  const eaten = nutritionService.markMealEaten(selected, "lunch");
  const completed = nutritionService.markMealCompleted(eaten, "lunch");
  const hydrated = nutritionService.addHydration(completed, 250);
  const supplemented = nutritionService.toggleSupplement(hydrated, "protein-isolate");
  const summaryView = nutritionService.summarizeNutritionDay(supplemented);

  assert.equal(nutritionService.buildNutritionDayView(supplemented).mealSlots.find((slot) => slot.id === "lunch")?.state, "completed");
  assert.equal(summaryView.hydrationMl, hydrated.hydrationLogs.reduce((total, entry) => total + entry.amountMl, 0));
  assert.equal(summaryView.supplementsCompleted, 2);
  assert.equal(summaryView.completedMeals >= 2, true);
});

test("nutrition snapshots survive serialize and revive without changing the source context", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000016");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-09");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-09",
    summary,
    "00000000-0000-4000-8000-000000000017",
    bundleView.activeProgram?.id ?? null
  );
  const roundTrip = nutritionService.reviveNutritionStoreSnapshot(
    nutritionService.serializeNutritionStoreSnapshot(initial),
    "2026-08-09",
    summary
  );

  assert.equal(roundTrip.day.dayType, "rest");
  assert.equal(roundTrip.plan.userId, "00000000-0000-4000-8000-000000000017");
  assert.equal(nutritionService.buildNutritionDayView(roundTrip).dateKey, "2026-08-09");
});

test("nutrition next meal and ui state resolution stay truthful", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000018");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    summary,
    "00000000-0000-4000-8000-000000000019",
    bundleView.activeProgram?.id ?? null
  );
  const view = nutritionService.buildNutritionDayView(initial);
  const nextSlot = nutritionService.getNutritionNextMeal(initial);

  assert.equal(nutritionService.resolveNutritionMealUiState(view.mealSlots[0]), "completed");
  assert.equal(nutritionService.resolveNutritionMealUiState(view.mealSlots[1]), "next");
  assert.equal(nextSlot?.id, "lunch");
});

test("nutrition progress summary reflects real persistence values", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000020");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    summary,
    "00000000-0000-4000-8000-000000000021",
    bundleView.activeProgram?.id ?? null
  );
  const selected = nutritionService.applyMealSelection(initial, "lunch", "chicken-rice-bowl");
  const completed = nutritionService.markMealCompleted(selected, "lunch");
  const hydrated = nutritionService.addHydration(completed, 500);
  const progress = nutritionService.buildNutritionProgressSummary(hydrated);

  assert.equal(progress.consumed.calories, 450 + 648);
  assert.equal(progress.mealsCompleted >= 2, true);
  assert.equal(progress.hydrationMl, initial.hydrationLogs.reduce((total, entry) => total + entry.amountMl, 0) + 500);
  assert.equal(progress.hydrationRemainingMl, progress.hydrationTargetMl - progress.hydrationMl);
});

test("nutrition option ranking stays deterministic", () => {
  const demoBundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000022");
  const bundleView = programService.createProgramBundleFromRows(
    demoBundle.program,
    demoBundle.phase,
    demoBundle.templates,
    demoBundle.templateExercises,
    demoBundle.scheduledWorkouts
  );
  const summary = programService.getProgramDaySummary(bundleView, "2026-08-08");
  const initial = nutritionService.createNutritionStoreSnapshot(
    "2026-08-08",
    summary,
    "00000000-0000-4000-8000-000000000023",
    bundleView.activeProgram?.id ?? null
  );
  const slot = nutritionService.buildNutritionDayView(initial).mealSlots.find((mealSlot) => mealSlot.id === "lunch");

  assert.ok(slot);
  const ranked = nutritionService.rankMealOptions(slot, slot.options);
  assert.equal(ranked[0]?.label, "BEST MATCH");
  assert.equal(ranked.length, slot.options.length);
  assert.equal(ranked[0].score <= ranked[1].score, true);
});

test("progress payloads keep weight separate from centimeter measurements", () => {
  const state = progressData.createProgressDemoState();
  state.measurement.definitions = state.measurement.definitions.map((definition) =>
    definition.type === "weight"
      ? { ...definition, todayValue: "62.8" }
      : {
          ...definition,
          todayValue:
            definition.type === "waist" ? "72.8" : definition.type === "hips" ? "97.4" : definition.type === "thigh" ? "56.0" : definition.todayValue
        }
  );

  const payload = progressService.buildProgressEntriesPayload(state, "manual");

  assert.equal(payload.entry.entry_type, "measurement");
  assert.equal(payload.entry.weight_kg, 62.8);
  assert.deepEqual(
    payload.measurements.map((measurement) => measurement.measurement_key).sort(),
    ["hips", "thigh", "waist"]
  );
});

test("numeric input helpers accept comma decimals and reject invalid strings", () => {
  const parsed = numericInput.parseNumericInput("32,5", { allowBlank: false, allowZero: false });
  assert.equal(parsed.valid, true);
  assert.equal(parsed.value, 32.5);

  const rejected = numericInput.parseNumericInput("abc", { allowBlank: false, allowZero: false });
  assert.equal(rejected.valid, false);
  assert.equal(rejected.reason, "invalid");

  assert.equal(numericInput.stepNumericInput("32,5", 2.5, { decimals: 1, fallback: 30 }), "35");

  const measurement = progressData.parseMeasurementInput("72,8", 40, 150);
  assert.equal(measurement.valid, true);
  assert.equal(measurement.value, 72.8);
});

test("logged set editor validation and save helpers keep active logger and edit draft separate", () => {
  const session = structuredClone(workoutData.createDemoWorkoutSession());
  const exercise = session.exercises[0];
  const setNumber = exercise.sets[0].setNumber;

  const activeLogger = {
    kilograms: "abc",
    reps: "8",
    rir: "2"
  };
  const editDraft = {
    kilograms: "32,5",
    reps: "8",
    rir: "2"
  };

  const activeLoggerValidation = workoutSetEditor.validateWorkoutSetDraft("en", activeLogger);
  const editDraftValidation = workoutSetEditor.validateWorkoutSetDraft("es", editDraft);

  assert.equal(activeLoggerValidation.valid, false);
  assert.equal(activeLoggerValidation.errors.kilograms, "ENTER A VALID NUMBER");
  assert.equal(editDraftValidation.valid, true);
  assert.equal(editDraftValidation.parsed.kilograms, 32.5);

  const draftSession = workoutSetEditor.updateWorkoutSetDraft(session, exercise.id, setNumber, { kilograms: "abc" });
  assert.notStrictEqual(draftSession, session);
  assert.equal(session.exercises[0].sets[0].kilograms, exercise.sets[0].kilograms);
  assert.equal(draftSession.exercises[0].sets[0].kilograms, "abc");

  const savedSession = workoutSetEditor.applySavedWorkoutSetToSession(session, exercise.id, setNumber, {
    id: "00000000-0000-4000-8000-000000009999",
    weight_kg: 32.5,
    reps: 8,
    rir: 2,
    completed_at: "2026-08-20T08:00:00.000Z",
    status: "completed",
    notes: null
  });

  assert.equal(savedSession.exercises[0].performedExerciseId, exercise.performedExerciseId);
  assert.equal(savedSession.exercises[0].sets[0].workoutSetId, "00000000-0000-4000-8000-000000009999");
  assert.equal(savedSession.exercises[0].sets[0].kilograms, "32.5");
  assert.equal(savedSession.exercises[0].completedSets[0].kilograms, 32.5);
});

test("progress snapshots hydrate remote measurement history and photo paths", () => {
  const snapshot = {
    entries: [
      {
        id: "00000000-0000-4000-8000-000000000021",
        user_id: "00000000-0000-4000-8000-000000000022",
        entry_date: "2026-08-08",
        entry_type: "checkpoint",
        weight_kg: 63,
        notes: null,
        source: "onboarding_baseline",
        created_at: "2026-08-08T08:00:00.000Z",
        updated_at: "2026-08-08T08:00:00.000Z"
      },
      {
        id: "00000000-0000-4000-8000-000000000023",
        user_id: "00000000-0000-4000-8000-000000000022",
        entry_date: "2026-08-15",
        entry_type: "measurement",
        weight_kg: 62.8,
        notes: null,
        source: "manual",
        created_at: "2026-08-15T08:00:00.000Z",
        updated_at: "2026-08-15T08:00:00.000Z"
      }
    ],
    measurements: [
      {
        id: "00000000-0000-4000-8000-000000000024",
        progress_entry_id: "00000000-0000-4000-8000-000000000021",
        measurement_key: "waist",
        value_cm: 74,
        created_at: "2026-08-08T08:00:00.000Z",
        updated_at: "2026-08-08T08:00:00.000Z"
      },
      {
        id: "00000000-0000-4000-8000-000000000025",
        progress_entry_id: "00000000-0000-4000-8000-000000000023",
        measurement_key: "waist",
        value_cm: 72.8,
        created_at: "2026-08-15T08:00:00.000Z",
        updated_at: "2026-08-15T08:00:00.000Z"
      }
    ],
    photos: [
      {
        id: "00000000-0000-4000-8000-000000000026",
        user_id: "00000000-0000-4000-8000-000000000022",
        progress_entry_id: "00000000-0000-4000-8000-000000000021",
        pose: "front",
        storage_bucket: "progress-photos",
        storage_path: "user/entry/front-a.jpg",
        captured_at: null,
        uploaded_at: "2026-08-08T08:00:00.000Z",
        width: null,
        height: null,
        mime_type: "image/jpeg",
        file_size_bytes: 1234,
        created_at: "2026-08-08T08:00:00.000Z",
        updated_at: "2026-08-08T08:00:00.000Z"
      },
      {
        id: "00000000-0000-4000-8000-000000000027",
        user_id: "00000000-0000-4000-8000-000000000022",
        progress_entry_id: "00000000-0000-4000-8000-000000000023",
        pose: "front",
        storage_bucket: "progress-photos",
        storage_path: "user/entry/front-b.jpg",
        captured_at: null,
        uploaded_at: "2026-08-15T08:00:00.000Z",
        width: null,
        height: null,
        mime_type: "image/jpeg",
        file_size_bytes: 1234,
        created_at: "2026-08-15T08:00:00.000Z",
        updated_at: "2026-08-15T08:00:00.000Z"
      }
    ]
  };

  const hydrated = progressService.buildProgressStateFromPersistedSnapshot(progressData.createProgressDemoState(), snapshot);

  assert.equal(hydrated.measurement.histories.find((history) => history.type === "waist")?.entries.at(-1)?.value, 72.8);
  assert.equal(hydrated.measurement.lastSavedRows.find((row) => row.type === "waist")?.difference, -1.2);
  assert.equal(hydrated.photos.checkpoints[0].photos.front.storagePath, "user/entry/front-a.jpg");
  assert.equal(hydrated.photos.checkpoints[1].photos.front.storagePath, "user/entry/front-b.jpg");
  assert.equal(hydrated.trends.keyMetrics[1].value, "72.8 cm");
});

function createFakeWorkoutClient(seedState) {
  const state = structuredClone(seedState);
  state.rpcCalls = [];

  function matchesRow(row, filters) {
    return filters.every((filter) => {
      if (filter.kind === "eq") {
        return row[filter.column] === filter.value;
      }

      if (filter.kind === "in") {
        return filter.values.includes(row[filter.column]);
      }

      return true;
    });
  }

  function applyOrdering(rows, order) {
    if (!order) {
      return rows;
    }

    return rows.slice().sort((left, right) => {
      const leftValue = left[order.column];
      const rightValue = right[order.column];

      if (leftValue === rightValue) {
        return 0;
      }

      if (leftValue == null) {
        return order.ascending ? -1 : 1;
      }

      if (rightValue == null) {
        return order.ascending ? 1 : -1;
      }

      return order.ascending ? (leftValue > rightValue ? 1 : -1) : leftValue > rightValue ? -1 : 1;
    });
  }

  function runQuery(tableName, query) {
    const table = state[tableName];

    if (query.type === "update") {
      const rows = table.filter((row) => matchesRow(row, query.filters));
      for (const row of rows) {
        Object.assign(row, query.payload);
      }
      return rows;
    }

    if (query.type === "insert") {
      const inserted = query.payload.map((row) => ({
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z",
        ...structuredClone(row)
      }));
      table.push(...inserted);
      return inserted;
    }

    let rows = table.filter((row) => matchesRow(row, query.filters));
    rows = applyOrdering(rows, query.order);
    if (typeof query.limit === "number") {
      rows = rows.slice(0, query.limit);
    }
    return rows;
  }

  function createQuery(tableName) {
    const query = {
      type: "select",
      filters: [],
      payload: null,
      order: null,
      limit: null
    };

    const api = {
      select() {
        return api;
      },
      eq(column, value) {
        query.filters.push({ kind: "eq", column, value });
        return api;
      },
      in(column, values) {
        query.filters.push({ kind: "in", column, values });
        return api;
      },
      order(column, options) {
        query.order = { column, ascending: options?.ascending !== false };
        return api;
      },
      limit(count) {
        query.limit = count;
        return api;
      },
      update(values) {
        query.type = "update";
        query.payload = values;
        return api;
      },
      insert(values) {
        query.type = "insert";
        query.payload = Array.isArray(values) ? values : [values];
        return api;
      },
      async maybeSingle() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: null };
      },
      async single() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: rows[0] ? null : new Error("Not found") };
      }
    };

    return api;
  }

  return {
    state,
    from(tableName) {
      return createQuery(tableName);
    },
    async rpc(name, args) {
      state.rpcCalls.push({ name, args });

      if (name === "complete_workout_session") {
        const row = state.workout_sessions.find((item) => item.id === args.p_workout_session_id);
        if (!row) {
          return { data: null, error: new Error("Not found") };
        }

        row.status = "completed";
        row.completed_at = "2026-08-09T10:00:00.000Z";
        row.duration_seconds = args.p_duration_seconds ?? row.duration_seconds;
        row.notes = args.p_notes ?? row.notes;
        return { data: row, error: null };
      }

      return { data: null, error: new Error("Unexpected rpc") };
    }
  };
}

function createFakeCheckinClient(seedState) {
  const state = structuredClone(seedState);

  function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function matchesRow(row, filters) {
    return filters.every((filter) => {
      if (filter.kind === "eq") {
        return row[filter.column] === filter.value;
      }

      if (filter.kind === "gte") {
        return row[filter.column] >= filter.value;
      }

      if (filter.kind === "lte") {
        return row[filter.column] <= filter.value;
      }

      return true;
    });
  }

  function applyOrdering(rows, order) {
    if (!order) {
      return rows;
    }

    return rows.slice().sort((left, right) => {
      const leftValue = left[order.column];
      const rightValue = right[order.column];

      if (leftValue === rightValue) {
        return 0;
      }

      return order.ascending ? (leftValue > rightValue ? 1 : -1) : leftValue > rightValue ? -1 : 1;
    });
  }

  function applyUpsert(tableName, payload, conflictColumns) {
    const table = state[tableName];
    const rows = Array.isArray(payload) ? payload : [payload];
    const inserted = [];

    for (const candidate of rows) {
      const existing = table.find((row) => conflictColumns.every((column) => row[column] === candidate[column]));
      if (existing) {
        Object.assign(existing, candidate, { updated_at: "2026-08-09T12:00:00.000Z" });
        inserted.push(existing);
      } else {
        const row = {
          id: candidate.id ?? createId(),
          created_at: "2026-08-09T12:00:00.000Z",
          updated_at: "2026-08-09T12:00:00.000Z",
          reviewed_at: candidate.reviewed_at ?? null,
          ...structuredClone(candidate)
        };
        table.push(row);
        inserted.push(row);
      }
    }

    return inserted;
  }

  function runQuery(tableName, query) {
    const table = state[tableName];

    if (query.type === "insert") {
      const inserted = query.payload.map((row) => ({
        id: row.id ?? createId(),
        created_at: "2026-08-09T12:00:00.000Z",
        updated_at: "2026-08-09T12:00:00.000Z",
        ...structuredClone(row)
      }));
      table.push(...inserted);
      return inserted;
    }

    if (query.type === "update") {
      const rows = table.filter((row) => matchesRow(row, query.filters));
      for (const row of rows) {
        Object.assign(row, query.payload, { updated_at: "2026-08-09T12:00:00.000Z" });
      }
      return rows;
    }

    if (query.type === "upsert") {
      return applyUpsert(tableName, query.payload, query.conflictColumns);
    }

    let rows = table.filter((row) => matchesRow(row, query.filters));
    rows = applyOrdering(rows, query.order);
    if (typeof query.limit === "number") {
      rows = rows.slice(0, query.limit);
    }
    return rows;
  }

  function createQuery(tableName) {
    const query = {
      type: "select",
      filters: [],
      payload: null,
      order: null,
      limit: null,
      conflictColumns: []
    };

    const api = {
      select() {
        return api;
      },
      eq(column, value) {
        query.filters.push({ kind: "eq", column, value });
        return api;
      },
      gte(column, value) {
        query.filters.push({ kind: "gte", column, value });
        return api;
      },
      lte(column, value) {
        query.filters.push({ kind: "lte", column, value });
        return api;
      },
      order(column, options) {
        query.order = { column, ascending: options?.ascending !== false };
        return api;
      },
      limit(count) {
        query.limit = count;
        return api;
      },
      update(values) {
        query.type = "update";
        query.payload = values;
        return api;
      },
      insert(values) {
        query.type = "insert";
        query.payload = Array.isArray(values) ? values : [values];
        return api;
      },
      upsert(values, options) {
        query.type = "upsert";
        query.payload = Array.isArray(values) ? values : [values];
        query.conflictColumns = String(options?.onConflict ?? "").split(",").map((value) => value.trim()).filter(Boolean);
        return api;
      },
      async maybeSingle() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: null };
      },
      async single() {
        const rows = runQuery(tableName, query);
        return { data: rows[0] ?? null, error: rows[0] ? null : new Error("Not found") };
      }
    };

    return api;
  }

  return {
    state,
    from(tableName) {
      return createQuery(tableName);
    }
  };
}

test("workout set saves update the same row and complete the exercise only when all sets are done", async () => {
  const client = createFakeWorkoutClient({
    workout_sessions: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        user_id: "00000000-0000-4000-8000-000000000002",
        scheduled_workout_id: "00000000-0000-4000-8000-000000000003",
        workout_template_id: "00000000-0000-4000-8000-000000000004",
        status: "in_progress",
        started_at: "2026-08-09T08:00:00.000Z",
        completed_at: null,
        duration_seconds: null,
        notes: null,
        session_metadata: {},
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z"
      }
    ],
    workout_session_exercises: [
      {
        id: "00000000-0000-4000-8000-000000000005",
        workout_session_id: "00000000-0000-4000-8000-000000000001",
        prescribed_template_exercise_id: "00000000-0000-4000-8000-000000000006",
        prescribed_exercise_key: "barbell-hip-thrust",
        performed_exercise_key: "barbell-hip-thrust",
        sort_order: 1,
        target_sets: 2,
        rep_min: 8,
        rep_max: 10,
        rir_min: 1,
        rir_max: 2,
        rest_seconds: 120,
        notes: null,
        swap_reason: null,
        status: "planned",
        started_at: null,
        completed_at: null,
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z"
      }
    ],
    workout_sets: [
      {
        id: "00000000-0000-4000-8000-000000000007",
        workout_session_exercise_id: "00000000-0000-4000-8000-000000000005",
        set_number: 1,
        status: "planned",
        weight_kg: null,
        reps: null,
        rir: null,
        completed_at: null,
        notes: null,
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z"
      }
    ]
  });

  await workoutSessionService.saveWorkoutSet(client, {
    workoutSessionExerciseId: "00000000-0000-4000-8000-000000000005",
    workoutSetId: "00000000-0000-4000-8000-000000000007",
    setNumber: 1,
    payload: { kilograms: "80,5", reps: "10", rir: "2" }
  });

  assert.equal(client.state.workout_sets.length, 1);
  assert.equal(client.state.workout_sets[0].weight_kg, 80.5);
  assert.equal(client.state.workout_session_exercises[0].status, "planned");
  assert.equal(workoutSessionService.isWorkoutSessionExerciseComplete(2, client.state.workout_sets), false);

  await workoutSessionService.saveWorkoutSet(client, {
    workoutSessionExerciseId: "00000000-0000-4000-8000-000000000005",
    workoutSetId: "00000000-0000-4000-8000-000000000007",
    setNumber: 1,
    payload: { kilograms: "85,5", reps: "10", rir: "" }
  });

  assert.equal(client.state.workout_sets.length, 1);
  assert.equal(client.state.workout_sets[0].weight_kg, 85.5);
  assert.equal(client.state.workout_sets[0].rir, null);
  assert.equal(workoutSessionService.isWorkoutSessionExerciseComplete(2, client.state.workout_sets), false);

  await workoutSessionService.saveWorkoutSet(client, {
    workoutSessionExerciseId: "00000000-0000-4000-8000-000000000005",
    setNumber: 2,
    payload: { kilograms: "85,0", reps: "9", rir: "1" }
  });

  assert.equal(client.state.workout_sets.length, 2);
  assert.equal(workoutSessionService.isWorkoutSessionExerciseComplete(2, client.state.workout_sets), true);
});

test("exercise swaps preserve the prescribed identity", async () => {
  const client = createFakeWorkoutClient({
    workout_sessions: [],
    workout_session_exercises: [
      {
        id: "00000000-0000-4000-8000-000000000005",
        workout_session_id: "00000000-0000-4000-8000-000000000001",
        prescribed_template_exercise_id: "00000000-0000-4000-8000-000000000006",
        prescribed_exercise_key: "barbell-hip-thrust",
        performed_exercise_key: "barbell-hip-thrust",
        sort_order: 1,
        target_sets: 4,
        rep_min: 8,
        rep_max: 10,
        rir_min: 1,
        rir_max: 2,
        rest_seconds: 120,
        notes: null,
        swap_reason: null,
        status: "planned",
        started_at: null,
        completed_at: null,
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z"
      }
    ],
    workout_sets: []
  });

  const swapped = await workoutSessionService.swapWorkoutSessionExercise(client, {
    workoutSessionExerciseId: "00000000-0000-4000-8000-000000000005",
    performedExerciseKey: "glute-drive-machine",
    swapReason: "pain"
  });

  assert.equal(swapped.prescribed_exercise_key, "barbell-hip-thrust");
  assert.equal(swapped.performed_exercise_key, "glute-drive-machine");
  assert.equal(client.state.workout_session_exercises[0].performed_exercise_key, "glute-drive-machine");
});

test("workout completion persists through the RPC boundary", async () => {
  const client = createFakeWorkoutClient({
    workout_sessions: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        user_id: "00000000-0000-4000-8000-000000000002",
        scheduled_workout_id: "00000000-0000-4000-8000-000000000003",
        workout_template_id: "00000000-0000-4000-8000-000000000004",
        status: "in_progress",
        started_at: "2026-08-09T08:00:00.000Z",
        completed_at: null,
        duration_seconds: null,
        notes: null,
        session_metadata: {},
        created_at: "2026-08-09T08:00:00.000Z",
        updated_at: "2026-08-09T08:00:00.000Z"
      }
    ],
    workout_session_exercises: [],
    workout_sets: []
  });

  const completed = await workoutSessionService.completeWorkoutSession(client, {
    workoutSessionId: "00000000-0000-4000-8000-000000000001",
    durationSeconds: 3600,
    notes: "done"
  });

  assert.equal(completed.status, "completed");
  assert.equal(client.state.workout_sessions[0].status, "completed");
  assert.equal(client.state.workout_sessions[0].duration_seconds, 3600);
});

test("workout live snapshot derives elapsed time and rest countdown from durable timestamps", () => {
  const session = structuredClone(workoutData.createDemoWorkoutSession());
  session.startedAt = "2026-08-13T10:00:00.000Z";
  session.status = "in_progress";
  session.restTimer = {
    exerciseId: session.exercises[0].id,
    setNumber: 1,
    secondsRemaining: 90,
    active: true,
    endsAt: "2026-08-13T10:01:30.000Z"
  };
  session.workflow = {
    activeExerciseId: session.exercises[0].id,
    activeSetNumber: 1,
    restEndsAt: "2026-08-13T10:01:30.000Z",
    pausedAt: null,
    pauseAccumulatedMs: 0
  };

  const snapshot = workoutLiveState.getWorkoutLiveSnapshot(session, Date.parse("2026-08-13T10:01:00.000Z"));

  assert.equal(snapshot.phase, "resting");
  assert.equal(snapshot.elapsedSeconds, 60);
  assert.equal(snapshot.restSecondsRemaining, 30);
  assert.equal(snapshot.activeExercise.id, session.exercises[0].id);
});

test("remote workout summary exposes real volume and set counts", async () => {
  const bundle = programService.createDemoProgramBundle("00000000-0000-4000-8000-000000000099");
  const scheduledWorkout = bundle.scheduledWorkouts[0];
  const day = programService.getProgramDaySummary(bundle, scheduledWorkout.scheduled_date);
  assert.ok(day);
  assert.ok(day.scheduledWorkoutId);

  const templateRow = bundle.templates.find((template) => template.code === day.templateCode) ?? bundle.templates[0];
  const templateExercises = bundle.templateExercises
    .filter((exercise) => exercise.workout_template_id === templateRow.id)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((exercise) => ({
      id: exercise.id,
      exerciseKey: exercise.exercise_key,
      sortOrder: exercise.sort_order,
      sets: exercise.sets,
      repMin: exercise.rep_min,
      repMax: exercise.rep_max,
      rirMin: exercise.rir_min,
      rirMax: exercise.rir_max,
      restSeconds: exercise.rest_seconds,
      notes: exercise.notes ?? ""
    }));

  const client = createFakeWorkoutClient({
    workout_sessions: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        user_id: "00000000-0000-4000-8000-000000000099",
        scheduled_workout_id: scheduledWorkout.id,
        workout_template_id: templateRow.id,
        status: "in_progress",
        started_at: "2026-08-13T10:00:00.000Z",
        completed_at: null,
        duration_seconds: null,
        notes: null,
        session_metadata: {},
        created_at: "2026-08-13T10:00:00.000Z",
        updated_at: "2026-08-13T10:00:00.000Z"
      }
    ],
    workout_session_exercises: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        workout_session_id: "00000000-0000-4000-8000-000000000001",
        prescribed_template_exercise_id: templateExercises[0].id,
        prescribed_exercise_key: templateExercises[0].exerciseKey,
        performed_exercise_key: templateExercises[0].exerciseKey,
        sort_order: 1,
        target_sets: templateExercises[0].sets,
        rep_min: templateExercises[0].repMin,
        rep_max: templateExercises[0].repMax,
        rir_min: templateExercises[0].rirMin,
        rir_max: templateExercises[0].rirMax,
        rest_seconds: templateExercises[0].restSeconds,
        notes: null,
        swap_reason: null,
        status: "planned",
        started_at: null,
        completed_at: null,
        created_at: "2026-08-13T10:00:00.000Z",
        updated_at: "2026-08-13T10:00:00.000Z"
      }
    ],
    workout_sets: [
      {
        id: "00000000-0000-4000-8000-000000000020",
        workout_session_exercise_id: "00000000-0000-4000-8000-000000000010",
        set_number: 1,
        status: "completed",
        weight_kg: 80,
        reps: 10,
        rir: 2,
        completed_at: "2026-08-13T10:05:00.000Z",
        notes: null,
        created_at: "2026-08-13T10:05:00.000Z",
        updated_at: "2026-08-13T10:05:00.000Z"
      },
      {
        id: "00000000-0000-4000-8000-000000000021",
        workout_session_exercise_id: "00000000-0000-4000-8000-000000000010",
        set_number: 2,
        status: "completed",
        weight_kg: 82.5,
        reps: 9,
        rir: 1,
        completed_at: "2026-08-13T10:08:00.000Z",
        notes: null,
        created_at: "2026-08-13T10:08:00.000Z",
        updated_at: "2026-08-13T10:08:00.000Z"
      }
    ]
  });

  const seed = {
    routeSessionId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000099",
    scheduledWorkout,
    day,
    template: {
      id: templateRow.id,
      code: templateRow.code,
      name: templateRow.name,
      focus: templateRow.focus,
      estimatedDurationMinutes: templateRow.estimated_duration_minutes,
      sortOrder: templateRow.sort_order,
      exercises: templateExercises.map((exercise) => ({
        exerciseKey: exercise.exerciseKey,
        sortOrder: exercise.sortOrder,
        sets: exercise.sets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        rirMin: exercise.rirMin,
        rirMax: exercise.rirMax,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes
      }))
    },
    templateExercises
  };

  const loaded = await workoutSessionService.getOrCreateWorkoutSession(client, seed);

  assert.match(loaded.session.summary.totalVolume, /kg$/);
  assert.match(loaded.session.summary.exercisesCompleted, /^\d+ \/ \d+$/);
  assert.match(loaded.session.summary.setsCompleted, /^\d+$/);
  assert.equal(loaded.session.summary.averageRir == null || typeof loaded.session.summary.averageRir === "string", true);
});

await rm(tempDir, { recursive: true, force: true });
