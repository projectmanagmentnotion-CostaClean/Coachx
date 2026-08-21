import { getCurrentLocale, type Locale } from "@/lib/i18n";
import { createProgressDemoState } from "@/lib/progress-data";

export type OnboardingStepId =
  | "entry"
  | "intro"
  | "profile"
  | "goals"
  | "training-experience"
  | "training-preferences"
  | "schedule"
  | "health"
  | "nutrition"
  | "baseline"
  | "review"
  | "building-plan"
  | "plan-ready"
  | "program";

export type GoalPriority = "Glutes" | "Legs" | "Abdomen" | "Upper Body" | "Conditioning" | "Recovery";
export type UnitSystem = "metric" | "imperial";
export type ReminderPreference = "push" | "email" | "both" | "none";
export type NutritionMacroVisibility = "full" | "summary" | "hidden";
export type ProgramStatus = "proposed" | "active";
export type BaselinePose = "front" | "side" | "back";

export interface AthleteProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  unitSystem: UnitSystem;
  locale: Locale;
  avatarPath?: string | null;
}

export interface GoalProfile {
  mainGoal: string;
  priorities: GoalPriority[];
}

export interface TrainingExperience {
  trainingAge: string;
  currentFrequency: string;
  confidence: string;
  equipmentFamiliarity: string;
  movementFamiliarity: string;
  loadFamiliarity: string;
  rirFamiliarity: string;
  technicalConfidence: string;
  currentKeyLifts: string[];
}

export interface TrainingPreferences {
  daysPerWeek: number;
  preferredDays: string[];
  duration: string;
  location: string;
  equipment: string[];
  style: string;
  favoriteExercises: string[];
  movementsToAvoid: string[];
  varietyPreference: string;
  abPreference: string;
  supersetPreference: string;
  restTimerPreference: string;
  cardioPreference: string;
  guidancePreference: string;
}

export interface ScheduleLifestyle {
  workSchedule: string;
  activityLevel: string;
  sittingContext: string;
  steps: string;
  commute: string;
  predictability: string;
  energyPattern: string;
  wakeTime: string;
  bedTime: string;
  sleepQuality: string;
  stress: string;
  water: string;
  caffeine: string;
  weekendPattern: string;
  availableTrainingTime: string;
  reminderPreference: ReminderPreference;
}

export interface HealthLimitations {
  injuryHistory: string;
  currentPain: string;
  movementLimitations: string[];
  romLimitations: string[];
  surgeryHistory: string;
  medicationContext: string;
  warningSymptoms: string;
  cycleContext: string;
  pregnancyPostpartum: string;
  digestion: string;
  coachReviewRequired: boolean;
}

export interface NutritionPreferences {
  mealFrequency: string;
  mealTimes: string;
  breakfastPreference: string;
  preWorkoutEating: string;
  cookingAccess: string;
  mealPrep: string;
  portionPreference: string;
  budget: string;
  shoppingHabits: string;
  likedFoods: string[];
  dislikedFoods: string[];
  allergies: string[];
  intolerances: string[];
  restrictions: string[];
  flexibility: string;
  variety: string;
  cravings: string;
  eatingOut: string;
  weekends: string;
  macroVisibility: NutritionMacroVisibility;
  supplements: string[];
  barriers: string;
  supportPreference: string;
}

export interface BaselineMeasurement {
  type: "weight" | "waist" | "hips" | "thigh";
  value: string;
  unit: string;
  dateLabel: string;
}

export interface BaselinePhotoPose {
  pose: BaselinePose;
  status: "captured" | "missing" | "retake";
  label: string;
}

export interface BaselinePhotos {
  checkpoint: "baseline";
  dateLabel: string;
  privateByDefault: true;
  poses: BaselinePhotoPose[];
}

export interface BaselineState {
  measurements: BaselineMeasurement[];
  photos: BaselinePhotos;
  successDefinition: string;
}

export interface OnboardingProgress {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  resumeStep: OnboardingStepId;
  status: "not-started" | "in-progress" | "complete";
}

export interface ProgramRecommendation {
  title: string;
  duration: string;
  summary: string;
  changes: string[];
}

export interface ProgramState {
  status: ProgramStatus;
  phaseLabel: string;
  goal: string;
  duration: string;
  whyItFits: string;
  weeklyStructure: string[];
  firstWorkout: string;
  nutrition: string;
  cardio: string;
  recovery: string;
  habits: string;
  checkIn: string;
  baselineTimeline: string[];
  recentAdjustments: string[];
  workoutTemplates: string[];
  keyMovements: string[];
  progressionSystem: string;
  previousPhase: string;
  currentPhase: string;
  completedPhase: string;
  activatedAt: string | null;
  recommendation: ProgramRecommendation;
}

export interface OnboardingState {
  profile: AthleteProfile;
  goals: GoalProfile;
  trainingExperience: TrainingExperience;
  trainingPreferences: TrainingPreferences;
  scheduleLifestyle: ScheduleLifestyle;
  healthLimitations: HealthLimitations;
  nutritionPreferences: NutritionPreferences;
  baseline: BaselineState;
  progress: OnboardingProgress;
  program: ProgramState;
}

const onboardingSteps: OnboardingStepId[] = [
  "entry",
  "intro",
  "profile",
  "goals",
  "training-experience",
  "training-preferences",
  "schedule",
  "health",
  "nutrition",
  "baseline",
  "review",
  "building-plan",
  "plan-ready",
  "program"
];

function baselinePhotos(): BaselinePhotos {
  return {
    checkpoint: "baseline",
    dateLabel: "Week 0",
    privateByDefault: true,
    poses: [
      { pose: "front", status: "captured", label: "Front" },
      { pose: "side", status: "captured", label: "Side" },
      { pose: "back", status: "missing", label: "Back" }
    ]
  };
}

function weekdayShortLabels(locale: Locale) {
  return [new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-03T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-04T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-05T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-06T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-07T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-08T00:00:00Z")),
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date("2026-08-09T00:00:00Z"))];
}

export function createOnboardingDemoState(locale: Locale = getCurrentLocale()): OnboardingState {
  const days = weekdayShortLabels(locale);
  return {
    profile: {
      name: "Alex",
      age: 29,
      heightCm: 171,
      weightKg: 62.8,
      unitSystem: "metric",
      locale,
      avatarPath: null
    },
    goals: {
      mainGoal: "Body Recomposition",
      priorities: ["Glutes", "Legs", "Abdomen"]
    },
    trainingExperience: {
      trainingAge: "2-3 years",
      currentFrequency: "4 days / week",
      confidence: "Intermediate",
      equipmentFamiliarity: "Full gym",
      movementFamiliarity: "Comfortable with the main compound lifts",
      loadFamiliarity: "Tolerates moderate loading well",
      rirFamiliarity: "Uses RIR guidance with reasonable consistency",
      technicalConfidence: "Stable under coaching",
      currentKeyLifts: ["Hip Thrust 80 kg", "Romanian Deadlift 30 kg", "Lat Pulldown 45 kg"]
    },
    trainingPreferences: {
      daysPerWeek: 4,
      preferredDays: [days[0], days[1], days[3], days[5]],
      duration: "60-75 min",
      location: "Full gym",
      equipment: ["Barbell", "Dumbbells", "Cable", "Machine"],
      style: "Progressive hypertrophy",
      favoriteExercises: ["Hip thrust", "Romanian deadlift", "Lat pulldown"],
      movementsToAvoid: ["High impact jumping"],
      varietyPreference: "Structured variety",
      abPreference: "2x weekly",
      supersetPreference: "Occasional",
      restTimerPreference: "Visible",
      cardioPreference: "Zone 2",
      guidancePreference: "Clear coach cues"
    },
    scheduleLifestyle: {
      workSchedule: "Mostly consistent weekdays",
      activityLevel: "Moderately active",
      sittingContext: "Mixed desk and movement",
      steps: "7-9k",
      commute: "Short commute",
      predictability: "Medium",
      energyPattern: "Best later in the day",
      wakeTime: "07:00",
      bedTime: "23:00",
      sleepQuality: "Usually 6-7 hours",
      stress: "Moderate",
      water: "2.0-2.5 L",
      caffeine: "1-2 coffees",
      weekendPattern: "Less predictable",
      availableTrainingTime: "After work",
      reminderPreference: "push"
    },
    healthLimitations: {
      injuryHistory: "No major current injuries",
      currentPain: "None currently reported",
      movementLimitations: ["Avoid deep knee flexion when tired"],
      romLimitations: ["Keep hinge range controlled"],
      surgeryHistory: "None reported",
      medicationContext: "No relevant medication context",
      warningSymptoms: "None",
      cycleContext: "Optional tracking only",
      pregnancyPostpartum: "Not applicable",
      digestion: "No notable issues",
      coachReviewRequired: false
    },
    nutritionPreferences: {
      mealFrequency: "3 meals + 1 snack",
      mealTimes: "Regular weekdays, flexible weekends",
      breakfastPreference: "Savory breakfast",
      preWorkoutEating: "Light carb + protein",
      cookingAccess: "Kitchen available",
      mealPrep: "2-3 meals at a time",
      portionPreference: "Moderate portions",
      budget: "Moderate",
      shoppingHabits: "Weekly shop",
      likedFoods: ["Eggs", "Rice", "Chicken", "Greek yogurt"],
      dislikedFoods: ["Very spicy meals"],
      allergies: ["Peanuts"],
      intolerances: ["Lactose sensitive"],
      restrictions: ["No shellfish"],
      flexibility: "Structured flexibility",
      variety: "Balanced repeatable meals",
      cravings: "Sweet evening snacks",
      eatingOut: "1-2 times per week",
      weekends: "Slightly looser",
      macroVisibility: "summary",
      supplements: ["Creatine", "Protein powder"],
      barriers: "Time and consistency",
      supportPreference: "Simple meal anchors"
    },
    baseline: {
      measurements: [
        { type: "weight", value: "62.8", unit: "kg", dateLabel: "Week 0" },
        { type: "waist", value: "74.0", unit: "cm", dateLabel: "Week 0" },
        { type: "hips", value: "98.0", unit: "cm", dateLabel: "Week 0" },
        { type: "thigh", value: "56.5", unit: "cm", dateLabel: "Week 0" }
      ],
      photos: baselinePhotos(),
      successDefinition: "Measurements entered, photos captured, and the coach can track change consistently."
    },
    progress: {
      currentStep: "intro",
      completedSteps: ["entry"],
      resumeStep: "intro",
      status: "not-started"
    },
    program: {
      status: "proposed",
      phaseLabel: "Phase 1",
      goal: "Body Recomposition",
      duration: "8 weeks",
      whyItFits:
        "The plan matches the selected priorities, training history, and schedule while keeping the progressions controlled and repeatable.",
      weeklyStructure: ["4 training days", "2 lower-body anchors", "1 upper-body balance day", "1 recovery / cardio slot"],
      firstWorkout: "Glutes + Hamstrings · Workout A",
      nutrition: "2050 kcal · 140P · 220C · 60F",
      cardio: "Zone 2 · 20 min",
      recovery: "Sleep, hydration, and weekend consistency stay visible.",
      habits: "Track meals, hit reminders, and keep the baseline repeatable.",
      checkIn: "Weekly check-in and Week 8 review",
      baselineTimeline: ["Week 0 baseline", "Week 4 comparison", "Week 8 review"],
      recentAdjustments: ["No recent active adjustments"],
      workoutTemplates: ["Lower A", "Upper", "Lower B", "Recovery"],
      keyMovements: ["Hip Thrust", "Romanian Deadlift", "Bulgarian Split Squat", "Lat Pulldown"],
      progressionSystem: "Progress reps before load where possible and keep main movements stable.",
      previousPhase: "Initial setup",
      currentPhase: "Phase 1",
      completedPhase: "Baseline collected",
      activatedAt: null,
      recommendation: {
        title: "Phase 2",
        duration: "8 WEEKS",
        summary: "Body recomposition — progression",
        changes: ["Keep glute and hamstring emphasis", "Progress hip thrust and hinge loading", "Maintain recovery checks"]
      }
    }
  };
}

export function getOnboardingStepOrder() {
  return onboardingSteps.slice();
}

export function getOnboardingStepIndex(step: OnboardingStepId) {
  return onboardingSteps.indexOf(step);
}

export function getNextOnboardingStep(step: OnboardingStepId) {
  const index = getOnboardingStepIndex(step);
  return onboardingSteps[Math.min(onboardingSteps.length - 1, index + 1)];
}

export function getPreviousOnboardingStep(step: OnboardingStepId) {
  const index = getOnboardingStepIndex(step);
  return onboardingSteps[Math.max(0, index - 1)];
}

export function getOnboardingRoute(step: OnboardingStepId) {
  switch (step) {
    case "entry":
      return "/entry";
    case "intro":
      return "/onboarding";
    case "profile":
      return "/onboarding/profile";
    case "goals":
      return "/onboarding/goals";
    case "training-experience":
      return "/onboarding/training-experience";
    case "training-preferences":
      return "/onboarding/training-preferences";
    case "schedule":
      return "/onboarding/schedule";
    case "health":
      return "/onboarding/health";
    case "nutrition":
      return "/onboarding/nutrition";
    case "baseline":
      return "/onboarding/baseline";
    case "review":
      return "/onboarding/review";
    case "building-plan":
      return "/onboarding/building-plan";
    case "plan-ready":
      return "/onboarding/plan-ready";
    case "program":
      return "/program";
  }
}

export function reorderPriorityItems(priorities: GoalPriority[], fromIndex: number, toIndex: number) {
  const next = priorities.slice();
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

function hasMeaningfulHealthSignal(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const neutralPhrases = ["none", "no major", "not applicable", "n/a", "no issues", "no concern", "none currently"];
  if (neutralPhrases.some((phrase) => normalized.includes(phrase))) {
    return false;
  }

  return /pain|injur|surgery|symptom|pregnan|postpartum|limit|restriction|medication|digest/.test(normalized);
}

export function shouldRequireCoachReview(health: HealthLimitations) {
  return Boolean(
    health.coachReviewRequired ||
      hasMeaningfulHealthSignal(health.currentPain) ||
      hasMeaningfulHealthSignal(health.injuryHistory) ||
      hasMeaningfulHealthSignal(health.surgeryHistory) ||
      hasMeaningfulHealthSignal(health.warningSymptoms) ||
      hasMeaningfulHealthSignal(health.pregnancyPostpartum)
  );
}

export function isNutritionChoiceAllowed(
  choice: { tags: string[]; ingredients?: string[]; allergens?: string[] },
  nutrition: NutritionPreferences
) {
  const normalized = new Set([
    ...choice.tags.map((tag) => tag.toLowerCase()),
    ...(choice.ingredients ?? []).map((ingredient) => ingredient.toLowerCase()),
    ...(choice.allergens ?? []).map((allergen) => allergen.toLowerCase())
  ]);
  const blocks = [...nutrition.allergies, ...nutrition.restrictions, ...nutrition.intolerances].some((entry) =>
    normalized.has(entry.toLowerCase())
  );
  return !blocks;
}

export function buildBaselineSeed(state: OnboardingState) {
  return {
    measurements: state.baseline.measurements.map((measurement) => ({
      type: measurement.type,
      value: measurement.value,
      unit: measurement.unit,
      dateLabel: measurement.dateLabel
    })),
    photos: state.baseline.photos.poses.map((pose) => ({
      pose: pose.pose,
      status: pose.status,
      label: pose.label,
      checkpoint: "baseline" as const,
      privateByDefault: true
    }))
  };
}

export function createProgramProposal(state: OnboardingState): ProgramState {
  return {
    ...state.program,
    status: "proposed",
    activatedAt: null
  };
}

export function activateProgram(program: ProgramState) {
  return {
    ...program,
    status: "active" as const,
    activatedAt: program.activatedAt ?? "2026-08-08T08:00:00.000Z"
  };
}

export function getResumeOnboardingRoute(progress: OnboardingProgress) {
  return getOnboardingRoute(progress.resumeStep);
}

export function getEntryDestination(progress: OnboardingProgress) {
  if (progress.status === "complete") {
    return "/";
  }

  if (progress.status === "in-progress") {
    return getOnboardingRoute(progress.resumeStep);
  }

  return "/onboarding";
}

export function markStepComplete(state: OnboardingState, step: OnboardingStepId) {
  const completedSteps = state.progress.completedSteps.includes(step)
    ? state.progress.completedSteps
    : [...state.progress.completedSteps, step];

  const nextStep = getNextOnboardingStep(step);

  return {
    ...state,
    progress: {
      ...state.progress,
      currentStep: step,
      completedSteps,
      resumeStep: nextStep,
      status: step === "program" ? "complete" : "in-progress"
    }
  } satisfies OnboardingState;
}

export function advanceOnboardingStep(state: OnboardingState) {
  return markStepComplete(state, getNextOnboardingStep(state.progress.currentStep));
}

export function finalizeOnboarding(state: OnboardingState) {
  return {
    ...state,
    progress: {
      ...state.progress,
      currentStep: "program",
      completedSteps: Array.from(new Set([...state.progress.completedSteps, "program"])),
      resumeStep: "program",
      status: "complete"
    },
    program: activateProgram(createProgramProposal(state))
  } satisfies OnboardingState;
}

export function getOnboardingSectionLabel(step: OnboardingStepId, index: number) {
  const total = onboardingSteps.length - 1;
  return `${step.replace(/-/g, " ")}, section ${index} of ${total}`;
}

export const onboardingStepOrder = onboardingSteps;

export const onboardingDemoState = createOnboardingDemoState();

export const baselineSeed = buildBaselineSeed(onboardingDemoState);

export const programProposal = createProgramProposal(onboardingDemoState);
