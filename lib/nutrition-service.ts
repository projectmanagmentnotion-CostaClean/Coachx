import type { SupabaseClient } from "@supabase/supabase-js";
import { createNutritionDayForDate, type FoodItem, type MacroSummary, type MealDifficulty, type MealOption, type MealSlot, type NutritionDay, type NutritionDayType, type NutritionSafetyProfile, type NutritionTarget } from "@/lib/nutrition-data";
import type { ProgramDaySummary } from "@/lib/program-service";
import type {
  Database,
  Json,
  NutritionDaySelectionsInsert,
  NutritionDaySelectionsRow,
  NutritionDaysInsert,
  NutritionDaysRow,
  NutritionHydrationLogsInsert,
  NutritionHydrationLogsRow,
  NutritionMealOptionsInsert,
  NutritionMealOptionsRow,
  NutritionMealSlotsInsert,
  NutritionMealSlotsRow,
  NutritionPlansInsert,
  NutritionPlansRow,
  NutritionSupplementLogsInsert,
  NutritionSupplementLogsRow
} from "@/lib/supabase/database.types";

export type NutritionPlanStatus = "proposed" | "active" | "completed" | "archived";
export type NutritionDayStatus = "planned" | "in_progress" | "completed";
export type NutritionSelectionStatus = "selected" | "eaten" | "skipped";
export type NutritionMeasurementBasis = "raw" | "cooked" | "prepared" | "serving" | "unit";
export type NutritionSupplementStatus = "pending" | "completed";

type NutritionMealOptionPresentation = {
  summary?: string;
  prepTime?: string;
  difficulty?: MealDifficulty;
  tags?: string[];
  image?: string;
  portions?: FoodItem[];
  allergenTags?: string[];
  restrictionTags?: string[];
  intoleranceTags?: string[];
};

type NutritionMealSlotMetadata = {
  description?: string;
  timeLabel?: string;
  isNext?: boolean;
};

type NutritionDayMetadata = {
  title?: string;
  subtitle?: string;
  coachNote?: string;
  nutritionPrescription?: string;
  nutritionPreferences?: string[];
  safetyProfile?: NutritionSafetyProfile;
  hydrationQuickAddMl?: number[];
};

export interface NutritionPlanSnapshot {
  id: string;
  userId: string;
  programId: string | null;
  status: NutritionPlanStatus;
  name: string;
  dailyTargets: MacroSummary;
  fiberTargetG: number | null;
  waterTargetMl: number | null;
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface NutritionSelectionRecord {
  mealSlotId: string;
  mealOptionId: string;
  status: NutritionSelectionStatus;
  selectedAt: string;
  eatenAt: string | null;
  completedAt: string | null;
}

export interface NutritionHydrationLog {
  id: string;
  amountMl: number;
  loggedAt: string;
}

export interface NutritionSupplementLog {
  supplementId: string;
  label: string;
  dosage: string;
  status: NutritionSupplementStatus;
  completedAt: string | null;
}

export interface NutritionDaySnapshot {
  id: string;
  userId: string;
  nutritionPlanId: string;
  programPhaseId: string | null;
  scheduledWorkoutId: string | null;
  calendarDate: string;
  dayType: NutritionDayType;
  status: NutritionDayStatus;
  target: NutritionTarget;
  waterTargetMl: number | null;
  title: string;
  subtitle: string;
  coachNote: string;
  nutritionPrescription: string;
  nutritionPreferences: string[];
  safetyProfile: NutritionSafetyProfile;
  mealSlots: NutritionDay["mealSlots"];
  hydrationTargetMl: number;
  hydrationQuickAddMl: number[];
  supplements: NutritionDay["supplements"];
}

export interface NutritionStoreSnapshot {
  version: 1;
  plan: NutritionPlanSnapshot;
  day: NutritionDaySnapshot;
  selections: NutritionSelectionRecord[];
  hydrationLogs: NutritionHydrationLog[];
  supplementLogs: NutritionSupplementLog[];
  updatedAt: string;
}

export interface NutritionStoreLoadResult {
  snapshot: NutritionStoreSnapshot;
  source: "remote" | "seeded";
}

export interface NutritionAdherenceSummary {
  plannedMeals: number;
  selectedMeals: number;
  eatenMeals: number;
  completedMeals: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  hydrationMl: number;
  hydrationTargetMl: number;
  supplementsCompleted: number;
  supplementsTotal: number;
}

export type NutritionMealUiState = "next" | "upcoming" | "completed" | "past_incomplete";

export interface NutritionProgressSummary {
  target: MacroSummary;
  consumed: MacroSummary;
  remaining: MacroSummary;
  mealsCompleted: number;
  mealsTotal: number;
  mealsRemaining: number;
  hydrationMl: number;
  hydrationTargetMl: number;
  hydrationRemainingMl: number;
  supplementsCompleted: number;
  supplementsTotal: number;
  nextMealSlot: MealSlot | null;
}

export interface RankedMealOption {
  option: MealOption;
  score: number;
  label: "BEST MATCH" | "QUICK OPTION" | "ALTERNATIVE";
  reason: string;
}

export interface NutritionDayContext {
  dateKey: string;
  dayType: NutritionDayType;
  daySummary: ProgramDaySummary | null;
}

export function normalizeNutritionDateKey(dateKey: string) {
  return dateKey.slice(0, 10);
}

export function deriveNutritionDayType(daySummary: ProgramDaySummary | null | undefined): NutritionDayType {
  return daySummary?.isRestDay ? "rest" : "training";
}

export function resolveNutritionDayContext(dateKey: string, daySummary: ProgramDaySummary | null | undefined): NutritionDayContext {
  return {
    dateKey: normalizeNutritionDateKey(dateKey),
    dayType: deriveNutritionDayType(daySummary),
    daySummary: daySummary ?? null
  };
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneNutritionDay(day: NutritionDay): NutritionDay {
  return JSON.parse(JSON.stringify(day)) as NutritionDay;
}

function hydrationTotalFromLogs(logs: NutritionHydrationLog[]) {
  return logs.reduce((total, entry) => total + entry.amountMl, 0);
}

function selectionStatusLabel(selection: NutritionSelectionRecord | undefined): NutritionDay["mealSlots"][number]["state"] {
  if (!selection) {
    return "planned";
  }

  if (selection.completedAt) {
    return "completed";
  }

  if (selection.eatenAt) {
    return "eaten";
  }

  return "selected";
}

function calculateCompletedMealMacros(snapshot: NutritionStoreSnapshot) {
  return snapshot.selections.reduce<MacroSummary>(
    (accumulator, selection) => {
      if (!selection.eatenAt && !selection.completedAt) {
        return accumulator;
      }

      const slot = snapshot.day.mealSlots.find((candidate) => candidate.id === selection.mealSlotId);
      const option = slot?.options.find((candidate) => candidate.id === selection.mealOptionId);

      if (!option) {
        return accumulator;
      }

      return {
        calories: accumulator.calories + option.macro.calories,
        protein: accumulator.protein + option.macro.protein,
        carbs: accumulator.carbs + option.macro.carbs,
        fat: accumulator.fat + option.macro.fat
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function parsePrepMinutes(prepTime: string) {
  const match = prepTime.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function optionMacroDistance(slot: MealSlot, option: MealOption) {
  return Math.abs(option.macro.calories - slot.target.calories) / 25 + Math.abs(option.macro.protein - slot.target.protein) / 5 + Math.abs(option.macro.carbs - slot.target.carbs) / 10 + Math.abs(option.macro.fat - slot.target.fat) / 5;
}

function optionSelectionScore(slot: MealSlot, option: MealOption) {
  const macroScore = optionMacroDistance(slot, option);
  const prepScore = parsePrepMinutes(option.prepTime) / 12;
  const difficultyScore = option.difficulty === "easy" ? 0 : option.difficulty === "moderate" ? 0.35 : 0.7;
  return Number((macroScore + prepScore + difficultyScore).toFixed(2));
}

export function createNutritionPlanSnapshot(userId: string, day: NutritionDay, programId: string | null): NutritionPlanSnapshot {
  return {
    id: createId(),
    userId,
    programId,
    status: "active",
    name: day.dayType === "rest" ? "Recovery Nutrition Plan" : "Training Nutrition Plan",
    dailyTargets: { ...day.target },
    fiberTargetG: null,
    waterTargetMl: day.hydration.targetMl,
    startedAt: new Date().toISOString(),
    endedAt: null,
    metadata: {
      dayType: day.dayType,
      subtitle: day.subtitle,
      title: day.title
    }
  };
}

function selectionRecordFromMealSlot(slot: NutritionDay["mealSlots"][number]): NutritionSelectionRecord | null {
  if (!slot.selectedOptionId) {
    return null;
  }

  return {
    mealSlotId: slot.id,
    mealOptionId: slot.selectedOptionId,
    status: slot.state === "completed" ? "eaten" : slot.state === "eaten" ? "eaten" : "selected",
    selectedAt: new Date().toISOString(),
    eatenAt: slot.state === "selected" ? null : new Date().toISOString(),
    completedAt: slot.state === "completed" ? new Date().toISOString() : null
  };
}

function supplementRecordFromReminder(reminder: NutritionDay["supplements"][number]): NutritionSupplementLog {
  return {
    supplementId: reminder.id,
    label: reminder.label,
    dosage: reminder.dosage,
    status: reminder.checked ? "completed" : "pending",
    completedAt: reminder.checked ? new Date().toISOString() : null
  };
}

export function createNutritionStoreSnapshot(dateKey: string, daySummary?: ProgramDaySummary | null, userId = "demo-user", programId: string | null = null): NutritionStoreSnapshot {
  const context = resolveNutritionDayContext(dateKey, daySummary);
  const sourceDay = createNutritionDayForDate(dateKey, context.dayType);
  const plan = createNutritionPlanSnapshot(userId, sourceDay, programId);
  const selections = sourceDay.mealSlots.map(selectionRecordFromMealSlot).filter(Boolean) as NutritionSelectionRecord[];
  const hydrationLogs: NutritionHydrationLog[] = sourceDay.hydration.currentMl > 0 ? [{ id: createId(), amountMl: sourceDay.hydration.currentMl, loggedAt: new Date().toISOString() }] : [];
  const supplementLogs = sourceDay.supplements.map(supplementRecordFromReminder);

  return {
    version: 1,
    plan,
    day: {
      id: createId(),
      userId,
      nutritionPlanId: plan.id,
      programPhaseId: null,
      scheduledWorkoutId: daySummary?.scheduledWorkoutId ?? null,
      calendarDate: normalizeNutritionDateKey(dateKey),
      dayType: context.dayType,
      status: sourceDay.mealSlots.every((slot) => slot.state === "completed")
        ? "completed"
        : sourceDay.mealSlots.some((slot) => slot.state !== "planned")
          ? "in_progress"
          : "planned",
      target: { ...sourceDay.target },
      waterTargetMl: sourceDay.hydration.targetMl,
      title: sourceDay.title,
      subtitle: sourceDay.subtitle,
      coachNote: sourceDay.coachNote,
      nutritionPrescription: sourceDay.nutritionPrescription,
      nutritionPreferences: [...sourceDay.nutritionPreferences],
      safetyProfile: {
        allergies: [...sourceDay.safetyProfile.allergies],
        restrictions: [...sourceDay.safetyProfile.restrictions],
        intolerances: [...sourceDay.safetyProfile.intolerances],
        preferences: [...sourceDay.safetyProfile.preferences],
        budget: [...sourceDay.safetyProfile.budget],
        variety: [...sourceDay.safetyProfile.variety]
      },
      mealSlots: sourceDay.mealSlots.map((slot) => ({
        ...slot
      })),
      hydrationTargetMl: sourceDay.hydration.targetMl,
      hydrationQuickAddMl: [...sourceDay.hydration.quickAddMl],
      supplements: sourceDay.supplements.map((reminder) => ({ ...reminder }))
    },
    selections,
    hydrationLogs,
    supplementLogs,
    updatedAt: new Date().toISOString()
  };
}

export function buildNutritionDayView(snapshot: NutritionStoreSnapshot): NutritionDay {
  const day = cloneNutritionDay(createNutritionDayForDate(snapshot.day.calendarDate, snapshot.day.dayType));
  const baseMealSlots = snapshot.day.mealSlots;
  const selectionMap = new Map(snapshot.selections.map((selection) => [selection.mealSlotId, selection]));
  const selectedSlots = baseMealSlots.map((slot) => {
    const selection = selectionMap.get(slot.id) ?? null;

    return {
      ...slot,
      selectedOptionId: selection?.mealOptionId ?? slot.selectedOptionId,
      state: selection ? selectionStatusLabel(selection) : slot.state,
      isNext: !selection && slot.isNext
    };
  });
  const hydrationTotal = hydrationTotalFromLogs(snapshot.hydrationLogs);
  const progress = calculateCompletedMealMacros(snapshot);
  const supplements = day.supplements.map((reminder) => {
    const log = snapshot.supplementLogs.find((entry) => entry.supplementId === reminder.id);
    return {
      ...reminder,
      checked: log?.status === "completed"
    };
  });

  return {
    ...day,
    target: { ...snapshot.day.target },
    title: snapshot.day.title,
    subtitle: snapshot.day.subtitle,
    coachNote: snapshot.day.coachNote,
    nutritionPrescription: snapshot.day.nutritionPrescription,
    nutritionPreferences: [...snapshot.day.nutritionPreferences],
    safetyProfile: {
      allergies: [...snapshot.day.safetyProfile.allergies],
      restrictions: [...snapshot.day.safetyProfile.restrictions],
      intolerances: [...snapshot.day.safetyProfile.intolerances],
      preferences: [...snapshot.day.safetyProfile.preferences],
      budget: [...snapshot.day.safetyProfile.budget],
      variety: [...snapshot.day.safetyProfile.variety]
    },
    mealSlots: selectedSlots,
    progress,
    hydration: {
      currentMl: hydrationTotal,
      targetMl: snapshot.day.hydrationTargetMl,
      quickAddMl: [...snapshot.day.hydrationQuickAddMl]
    },
    supplements
  };
}

export function applyMealSelection(snapshot: NutritionStoreSnapshot, slotId: string, optionId: string) {
  const now = new Date().toISOString();
  const nextSelections = snapshot.selections.filter((selection) => selection.mealSlotId !== slotId);
  const updatedSelection: NutritionSelectionRecord = {
    mealSlotId: slotId,
    mealOptionId: optionId,
    status: "selected",
    selectedAt: now,
    eatenAt: null,
    completedAt: null
  };
  nextSelections.push(updatedSelection);

  return {
    ...snapshot,
    selections: nextSelections.sort((left, right) => left.mealSlotId.localeCompare(right.mealSlotId)),
    updatedAt: now
  };
}

export function markMealEaten(snapshot: NutritionStoreSnapshot, slotId: string) {
  const now = new Date().toISOString();

  return {
    ...snapshot,
    selections: snapshot.selections.map((selection) =>
      selection.mealSlotId === slotId
        ? ({
            ...selection,
            status: "eaten",
            eatenAt: selection.eatenAt ?? now
          } satisfies NutritionSelectionRecord)
        : selection
    ),
    updatedAt: now
  };
}

export function markMealCompleted(snapshot: NutritionStoreSnapshot, slotId: string) {
  const now = new Date().toISOString();

  return {
    ...snapshot,
    selections: snapshot.selections.map((selection) =>
      selection.mealSlotId === slotId
        ? ({
            ...selection,
            status: "eaten",
            eatenAt: selection.eatenAt ?? now,
            completedAt: now
          } satisfies NutritionSelectionRecord)
        : selection
    ),
    updatedAt: now
  };
}

export function addHydration(snapshot: NutritionStoreSnapshot, amountMl: number) {
  const now = new Date().toISOString();

  return {
    ...snapshot,
    hydrationLogs: [
      ...snapshot.hydrationLogs,
      {
        id: createId(),
        amountMl,
        loggedAt: now
      }
    ],
    updatedAt: now
  };
}

export function toggleSupplement(snapshot: NutritionStoreSnapshot, supplementId: string) {
  const now = new Date().toISOString();
  const existing = snapshot.supplementLogs.find((entry) => entry.supplementId === supplementId);

  if (existing) {
    const nextStatus: NutritionSupplementStatus = existing.status === "completed" ? "pending" : "completed";
    return {
      ...snapshot,
      supplementLogs: snapshot.supplementLogs.map((entry) =>
        entry.supplementId === supplementId
          ? ({
              ...entry,
              status: nextStatus,
              completedAt: nextStatus === "completed" ? now : null
            } satisfies NutritionSupplementLog)
          : entry
      ),
      updatedAt: now
    };
  }

  const reminder = snapshot.day.supplements.find((entry) => entry.id === supplementId);

  return {
    ...snapshot,
    supplementLogs: [
      ...snapshot.supplementLogs,
      {
        supplementId,
        label: reminder?.label ?? supplementId,
        dosage: reminder?.dosage ?? "",
        status: "completed",
        completedAt: now
      } satisfies NutritionSupplementLog
    ],
    updatedAt: now
  };
}

export function summarizeNutritionDay(snapshot: NutritionStoreSnapshot): NutritionAdherenceSummary {
  const view = buildNutritionDayView(snapshot);
  const completedSelections = snapshot.selections.filter((selection) => selection.completedAt || selection.eatenAt);
  const completedMacros = calculateCompletedMealMacros(snapshot);
  return {
    plannedMeals: view.mealSlots.length,
    selectedMeals: snapshot.selections.filter((selection) => selection.status === "selected").length,
    eatenMeals: snapshot.selections.filter((selection) => selection.eatenAt != null).length,
    completedMeals: completedSelections.length,
    caloriesConsumed: completedMacros.calories,
    caloriesTarget: view.target.calories,
    proteinConsumed: completedMacros.protein,
    carbsConsumed: completedMacros.carbs,
    fatConsumed: completedMacros.fat,
    hydrationMl: view.hydration.currentMl,
    hydrationTargetMl: view.hydration.targetMl,
    supplementsCompleted: view.supplements.filter((supplement) => supplement.checked).length,
    supplementsTotal: view.supplements.length
  };
}

export function resolveNutritionMealUiState(slot: MealSlot): NutritionMealUiState {
  if (slot.state === "completed") {
    return "completed";
  }

  if (slot.state === "selected" || slot.state === "eaten") {
    return "past_incomplete";
  }

  return slot.isNext ? "next" : "upcoming";
}

export function getNutritionNextMeal(snapshot: NutritionStoreSnapshot) {
  const view = buildNutritionDayView(snapshot);
  return view.mealSlots.find((slot) => resolveNutritionMealUiState(slot) === "next") ?? view.mealSlots.find((slot) => slot.state !== "completed") ?? null;
}

export function buildNutritionProgressSummary(snapshot: NutritionStoreSnapshot): NutritionProgressSummary {
  const summary = summarizeNutritionDay(snapshot);
  const nextMealSlot = getNutritionNextMeal(snapshot);
  return {
    target: snapshot.day.target,
    consumed: {
      calories: summary.caloriesConsumed,
      protein: summary.proteinConsumed,
      carbs: summary.carbsConsumed,
      fat: summary.fatConsumed
    },
    remaining: {
      calories: Math.max(0, summary.caloriesTarget - summary.caloriesConsumed),
      protein: Math.max(0, snapshot.day.target.protein - summary.proteinConsumed),
      carbs: Math.max(0, snapshot.day.target.carbs - summary.carbsConsumed),
      fat: Math.max(0, snapshot.day.target.fat - summary.fatConsumed)
    },
    mealsCompleted: summary.completedMeals,
    mealsTotal: summary.plannedMeals,
    mealsRemaining: Math.max(0, summary.plannedMeals - summary.completedMeals),
    hydrationMl: summary.hydrationMl,
    hydrationTargetMl: summary.hydrationTargetMl,
    hydrationRemainingMl: Math.max(0, summary.hydrationTargetMl - summary.hydrationMl),
    supplementsCompleted: summary.supplementsCompleted,
    supplementsTotal: summary.supplementsTotal,
    nextMealSlot
  };
}

export function rankMealOptions(slot: MealSlot, options: MealOption[]): RankedMealOption[] {
  const ranked = options
    .map((option) => ({
      option,
      score: optionSelectionScore(slot, option)
    }))
    .sort((left, right) => left.score - right.score || parsePrepMinutes(left.option.prepTime) - parsePrepMinutes(right.option.prepTime) || left.option.name.localeCompare(right.option.name));

  if (ranked.length === 0) {
    return [];
  }

  const quickIndex = ranked.findIndex((entry) => entry.option.prepTime === ranked.slice().sort((left, right) => parsePrepMinutes(left.option.prepTime) - parsePrepMinutes(right.option.prepTime))[0]?.option.prepTime);

  return ranked.map((entry, index) => ({
    option: entry.option,
    score: entry.score,
    label: index === 0 ? "BEST MATCH" : index === quickIndex ? "QUICK OPTION" : "ALTERNATIVE",
    reason:
      index === 0
        ? "Closest to the target macro shape."
        : index === quickIndex
          ? "Fastest preparation time."
          : "Balanced fallback with a transparent score."
  }));
}

export function nutritionStorageKey(userId: string | null, dateKey: string) {
  return `coachx-nutrition-state:${userId ?? "demo"}:${normalizeNutritionDateKey(dateKey)}`;
}

export function reviveNutritionStoreSnapshot(raw: string | null, fallbackDateKey: string, daySummary?: ProgramDaySummary | null) {
  if (!raw) {
    return createNutritionStoreSnapshot(fallbackDateKey, daySummary);
  }

  try {
    const parsed = JSON.parse(raw) as NutritionStoreSnapshot;
    if (parsed?.version !== 1 || !parsed.day || !Array.isArray(parsed.selections) || !Array.isArray(parsed.hydrationLogs) || !Array.isArray(parsed.supplementLogs)) {
      return createNutritionStoreSnapshot(fallbackDateKey, daySummary);
    }

    return parsed;
  } catch {
    return createNutritionStoreSnapshot(fallbackDateKey, daySummary);
  }
}

export function serializeNutritionStoreSnapshot(snapshot: NutritionStoreSnapshot) {
  return JSON.stringify(snapshot);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readNutritionDayMetadata(value: Json | null): NutritionDayMetadata | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const safetyProfile = isPlainObject(value.safetyProfile) ? value.safetyProfile : null;

  return {
    title: typeof value.title === "string" ? value.title : undefined,
    subtitle: typeof value.subtitle === "string" ? value.subtitle : undefined,
    coachNote: typeof value.coachNote === "string" ? value.coachNote : undefined,
    nutritionPrescription: typeof value.nutritionPrescription === "string" ? value.nutritionPrescription : undefined,
    nutritionPreferences: Array.isArray(value.nutritionPreferences)
      ? value.nutritionPreferences.filter((item): item is string => typeof item === "string")
      : undefined,
    safetyProfile: safetyProfile
      ? {
          allergies: Array.isArray(safetyProfile.allergies)
            ? safetyProfile.allergies.filter((item): item is string => typeof item === "string")
            : [],
          restrictions: Array.isArray(safetyProfile.restrictions)
            ? safetyProfile.restrictions.filter((item): item is string => typeof item === "string")
            : [],
          intolerances: Array.isArray(safetyProfile.intolerances)
            ? safetyProfile.intolerances.filter((item): item is string => typeof item === "string")
            : [],
          preferences: Array.isArray(safetyProfile.preferences)
            ? safetyProfile.preferences.filter((item): item is string => typeof item === "string")
            : [],
          budget: Array.isArray(safetyProfile.budget)
            ? safetyProfile.budget.filter((item): item is string => typeof item === "string")
            : [],
          variety: Array.isArray(safetyProfile.variety)
            ? safetyProfile.variety.filter((item): item is string => typeof item === "string")
            : []
        }
      : undefined,
    hydrationQuickAddMl: Array.isArray(value.hydrationQuickAddMl)
      ? value.hydrationQuickAddMl.filter((item): item is number => typeof item === "number")
      : undefined
  };
}

function readMealSlotMetadata(value: Json | null): NutritionMealSlotMetadata | null {
  if (!isPlainObject(value)) {
    return null;
  }

  return {
    description: typeof value.description === "string" ? value.description : undefined,
    timeLabel: typeof value.timeLabel === "string" ? value.timeLabel : undefined,
    isNext: typeof value.isNext === "boolean" ? value.isNext : undefined
  };
}

function readFoodItem(value: unknown): FoodItem | null {
  if (!isPlainObject(value) || typeof value.name !== "string" || typeof value.amount !== "string") {
    return null;
  }

  return {
    name: value.name,
    amount: value.amount,
    preparation:
      value.preparation === "raw" || value.preparation === "cooked" || value.preparation === "prepared"
        ? value.preparation
        : "prepared",
    measurementBasis:
      value.measurementBasis === "raw" ||
      value.measurementBasis === "cooked" ||
      value.measurementBasis === "prepared" ||
      value.measurementBasis === "serving" ||
      value.measurementBasis === "unit"
        ? value.measurementBasis
        : undefined,
    note: typeof value.note === "string" ? value.note : undefined
  };
}

function readMealOptionPresentation(value: Json | null): NutritionMealOptionPresentation | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const portions = Array.isArray(value.portions)
    ? value.portions.map((item) => readFoodItem(item)).filter((item): item is FoodItem => item !== null)
    : undefined;

  return {
    summary: typeof value.summary === "string" ? value.summary : undefined,
    prepTime: typeof value.prepTime === "string" ? value.prepTime : undefined,
    difficulty:
      value.difficulty === "easy" || value.difficulty === "moderate" || value.difficulty === "advanced"
        ? value.difficulty
        : undefined,
    tags: Array.isArray(value.tags) ? value.tags.filter((item): item is string => typeof item === "string") : undefined,
    image: typeof value.image === "string" ? value.image : undefined,
    portions,
    allergenTags: Array.isArray(value.allergenTags)
      ? value.allergenTags.filter((item): item is string => typeof item === "string")
      : undefined,
    restrictionTags: Array.isArray(value.restrictionTags)
      ? value.restrictionTags.filter((item): item is string => typeof item === "string")
      : undefined,
    intoleranceTags: Array.isArray(value.intoleranceTags)
      ? value.intoleranceTags.filter((item): item is string => typeof item === "string")
      : undefined
  };
}

function buildPlanInsert(snapshot: NutritionStoreSnapshot): NutritionPlansInsert {
  return {
    id: snapshot.plan.id,
    user_id: snapshot.plan.userId,
    program_id: snapshot.plan.programId,
    status: snapshot.plan.status,
    name: snapshot.plan.name,
    daily_calorie_target: snapshot.plan.dailyTargets.calories,
    protein_target_g: snapshot.plan.dailyTargets.protein,
    carb_target_g: snapshot.plan.dailyTargets.carbs,
    fat_target_g: snapshot.plan.dailyTargets.fat,
    fiber_target_g: snapshot.plan.fiberTargetG,
    water_target_ml: snapshot.plan.waterTargetMl,
    started_at: snapshot.plan.startedAt,
    ended_at: snapshot.plan.endedAt,
    plan_metadata: snapshot.plan.metadata as unknown as Json
  };
}

function buildDayInsert(snapshot: NutritionStoreSnapshot): NutritionDaysInsert {
  return {
    id: snapshot.day.id,
    user_id: snapshot.day.userId,
    nutrition_plan_id: snapshot.day.nutritionPlanId,
    program_phase_id: snapshot.day.programPhaseId,
    scheduled_workout_id: snapshot.day.scheduledWorkoutId,
    calendar_date: snapshot.day.calendarDate,
    day_type: snapshot.day.dayType,
    status: snapshot.day.status,
    calorie_target: snapshot.day.target.calories,
    protein_target_g: snapshot.day.target.protein,
    carb_target_g: snapshot.day.target.carbs,
    fat_target_g: snapshot.day.target.fat,
    water_target_ml: snapshot.day.waterTargetMl,
    day_metadata: {
      title: snapshot.day.title,
      subtitle: snapshot.day.subtitle,
      coachNote: snapshot.day.coachNote,
      nutritionPrescription: snapshot.day.nutritionPrescription,
      nutritionPreferences: snapshot.day.nutritionPreferences,
      safetyProfile: snapshot.day.safetyProfile,
      hydrationQuickAddMl: snapshot.day.hydrationQuickAddMl
    } as unknown as Json
  };
}

function buildMealSlotInsert(snapshot: NutritionStoreSnapshot, slot: NutritionDay["mealSlots"][number], sortOrder: number): NutritionMealSlotsInsert {
  return {
    nutrition_day_id: snapshot.day.id,
    slot_key: slot.id,
    name: slot.label,
    sort_order: sortOrder,
    target_calories: slot.target.calories,
    target_protein_g: slot.target.protein,
    target_carb_g: slot.target.carbs,
    target_fat_g: slot.target.fat,
    notes: slot.description,
    slot_metadata: {
      description: slot.description,
      timeLabel: slot.timeLabel,
      isNext: slot.isNext ?? false
    } as unknown as Json
  };
}

function buildMealOptionInsert(slotId: string, option: MealOption, sortOrder: number): NutritionMealOptionsInsert {
  return {
    meal_slot_id: slotId,
    option_key: option.id,
    name: option.name,
    description: option.summary,
    ingredients: option.portions as unknown as Json,
    calories: option.macro.calories,
    protein_g: option.macro.protein,
    carb_g: option.macro.carbs,
    fat_g: option.macro.fat,
    portion_notes: option.prepTime,
    measurement_basis: option.measurementBasis ?? "serving",
    allergen_metadata: {
      tags: option.allergenTags ?? []
    } as unknown as Json,
    restriction_metadata: {
      tags: option.restrictionTags ?? [],
      intoleranceTags: option.intoleranceTags ?? [],
      summary: option.summary,
      prepTime: option.prepTime,
      difficulty: option.difficulty,
      image: option.image ?? null
    } as unknown as Json,
    sort_order: sortOrder
  };
}

function buildSelectionInsert(snapshot: NutritionStoreSnapshot, mealSlotId: string, mealOptionId: string, selection: NutritionSelectionRecord): NutritionDaySelectionsInsert {
  return {
    user_id: snapshot.day.userId,
    nutrition_day_id: snapshot.day.id,
    meal_slot_id: mealSlotId,
    meal_option_id: mealOptionId,
    status: selection.status,
    selected_at: selection.selectedAt,
    eaten_at: selection.eatenAt,
    completed_at: selection.completedAt
  };
}

function buildHydrationInsert(snapshot: NutritionStoreSnapshot, log: NutritionHydrationLog): NutritionHydrationLogsInsert {
  return {
    id: log.id,
    user_id: snapshot.day.userId,
    nutrition_day_id: snapshot.day.id,
    amount_ml: log.amountMl,
    logged_at: log.loggedAt
  };
}

function buildSupplementInsert(snapshot: NutritionStoreSnapshot, log: NutritionSupplementLog): NutritionSupplementLogsInsert {
  return {
    user_id: snapshot.day.userId,
    nutrition_day_id: snapshot.day.id,
    supplement_key: log.supplementId,
    label: log.label,
    dosage: log.dosage,
    status: log.status,
    completed_at: log.completedAt
  };
}

function applyRemoteSelections(
  snapshot: NutritionStoreSnapshot,
  selectionRows: NutritionDaySelectionsRow[],
  slotKeyById: Map<string, string>,
  optionKeyById: Map<string, string>
) {
  const selectionBySlot = new Map<string, NutritionDaySelectionsRow>();
  const selectedRecords: NutritionSelectionRecord[] = [];

  for (const row of selectionRows) {
    const slotKey = slotKeyById.get(row.meal_slot_id);
    if (!slotKey) {
      continue;
    }

    selectionBySlot.set(slotKey, row);
  }

  for (const slot of snapshot.day.mealSlots) {
    const selection = selectionBySlot.get(slot.id);
    if (!selection) {
      continue;
    }

    const resolvedOptionId = optionKeyById.get(selection.meal_option_id) ?? slot.selectedOptionId ?? null;
    if (!resolvedOptionId) {
      continue;
    }

    selectedRecords.push({
      mealSlotId: slot.id,
      mealOptionId: resolvedOptionId,
      status: selection.status,
      selectedAt: selection.selected_at,
      eatenAt: selection.eaten_at,
      completedAt: selection.completed_at
    });
  }

  snapshot.selections = selectedRecords;

  snapshot.day.mealSlots = snapshot.day.mealSlots.map((slot) => {
    const selection = selectionBySlot.get(slot.id);
    if (!selection) {
      return slot;
    }

    const resolvedOptionId = optionKeyById.get(selection.meal_option_id) ?? slot.selectedOptionId;
    return {
      ...slot,
      selectedOptionId: resolvedOptionId,
      state:
        selection.completed_at != null
          ? "completed"
          : selection.eaten_at != null
            ? "eaten"
            : "selected"
    };
  });
}

function applyRemoteProgressLogs(snapshot: NutritionStoreSnapshot, hydrationRows: NutritionHydrationLogsRow[], supplementRows: NutritionSupplementLogsRow[]) {
  snapshot.hydrationLogs = hydrationRows
    .slice()
    .sort((left, right) => left.logged_at.localeCompare(right.logged_at))
    .map((row) => ({
      id: row.id,
      amountMl: row.amount_ml,
      loggedAt: row.logged_at
    }));

  snapshot.supplementLogs = supplementRows.map((row) => ({
    supplementId: row.supplement_key,
    label: row.label,
    dosage: row.dosage,
    status: row.status,
    completedAt: row.completed_at
  }));
}

function mergeRemoteNutritionData(
  fallback: NutritionStoreSnapshot,
  planRow: NutritionPlansRow,
  dayRow: NutritionDaysRow,
  slotRows: NutritionMealSlotsRow[],
  optionRows: NutritionMealOptionsRow[],
  selectionRows: NutritionDaySelectionsRow[],
  hydrationRows: NutritionHydrationLogsRow[],
  supplementRows: NutritionSupplementLogsRow[]
) {
  const snapshot = structuredClone(fallback) as NutritionStoreSnapshot;
  const dayMetadata = readNutritionDayMetadata(dayRow.day_metadata);
  const slotByKey = new Map(slotRows.map((row) => [row.slot_key, row]));
  const slotKeyById = new Map(slotRows.map((row) => [row.id, row.slot_key]));
  const optionsBySlotId = new Map<string, NutritionMealOptionsRow[]>();
  const optionKeyById = new Map<string, string>();

  for (const optionRow of optionRows) {
    optionKeyById.set(optionRow.id, optionRow.option_key);
    const existing = optionsBySlotId.get(optionRow.meal_slot_id) ?? [];
    existing.push(optionRow);
    optionsBySlotId.set(optionRow.meal_slot_id, existing);
  }

  snapshot.plan = {
    ...snapshot.plan,
    id: planRow.id,
    userId: planRow.user_id,
    programId: planRow.program_id,
    status: planRow.status,
    name: planRow.name,
    dailyTargets: {
      calories: planRow.daily_calorie_target,
      protein: planRow.protein_target_g,
      carbs: planRow.carb_target_g,
      fat: planRow.fat_target_g
    },
    fiberTargetG: planRow.fiber_target_g ?? null,
    waterTargetMl: planRow.water_target_ml,
    startedAt: planRow.started_at,
    endedAt: planRow.ended_at,
    metadata: isPlainObject(planRow.plan_metadata) ? planRow.plan_metadata : null
  };

  snapshot.day = {
    ...snapshot.day,
    id: dayRow.id,
    userId: dayRow.user_id,
    nutritionPlanId: dayRow.nutrition_plan_id,
    programPhaseId: dayRow.program_phase_id,
    scheduledWorkoutId: dayRow.scheduled_workout_id,
    calendarDate: dayRow.calendar_date,
    dayType: dayRow.day_type === "custom" ? fallback.day.dayType : dayRow.day_type,
    status: dayRow.status,
    target: {
      label: fallback.day.target.label,
      calories: dayRow.calorie_target,
      protein: dayRow.protein_target_g,
      carbs: dayRow.carb_target_g,
      fat: dayRow.fat_target_g
    },
    waterTargetMl: dayRow.water_target_ml,
    title: dayMetadata?.title ?? snapshot.day.title,
    subtitle: dayMetadata?.subtitle ?? snapshot.day.subtitle,
    coachNote: dayMetadata?.coachNote ?? snapshot.day.coachNote,
    nutritionPrescription: dayMetadata?.nutritionPrescription ?? snapshot.day.nutritionPrescription,
    nutritionPreferences: dayMetadata?.nutritionPreferences ?? snapshot.day.nutritionPreferences,
    safetyProfile: dayMetadata?.safetyProfile ?? snapshot.day.safetyProfile,
    hydrationQuickAddMl: dayMetadata?.hydrationQuickAddMl ?? snapshot.day.hydrationQuickAddMl,
    mealSlots: snapshot.day.mealSlots.map((slot) => {
      const remoteSlot = slotByKey.get(slot.id);
      const remoteOptions = remoteSlot ? optionsBySlotId.get(remoteSlot.id) ?? [] : [];
      const remoteSlotMetadata = remoteSlot ? readMealSlotMetadata(remoteSlot.slot_metadata) : null;

      return {
        ...slot,
        label: remoteSlot?.name ?? slot.label,
        description: remoteSlotMetadata?.description ?? remoteSlot?.notes ?? slot.description,
        timeLabel: remoteSlotMetadata?.timeLabel ?? slot.timeLabel,
        isNext: remoteSlotMetadata?.isNext ?? slot.isNext,
        target: {
          calories: remoteSlot?.target_calories ?? slot.target.calories,
          protein: remoteSlot?.target_protein_g ?? slot.target.protein,
          carbs: remoteSlot?.target_carb_g ?? slot.target.carbs,
          fat: remoteSlot?.target_fat_g ?? slot.target.fat
        },
        options: slot.options.map((option) => {
          const remoteOption = remoteOptions.find((candidate) => candidate.option_key === option.id);
          const presentation = readMealOptionPresentation(remoteOption?.restriction_metadata ?? null);
          const ingredients = Array.isArray(remoteOption?.ingredients) ? (remoteOption.ingredients as unknown as FoodItem[]) : option.portions;
          return {
            ...option,
            name: remoteOption?.name ?? option.name,
            summary: presentation?.summary ?? remoteOption?.description ?? option.summary,
            macro: {
              calories: remoteOption?.calories ?? option.macro.calories,
              protein: remoteOption?.protein_g ?? option.macro.protein,
              carbs: remoteOption?.carb_g ?? option.macro.carbs,
              fat: remoteOption?.fat_g ?? option.macro.fat
            },
            prepTime: presentation?.prepTime ?? remoteOption?.portion_notes ?? option.prepTime,
            difficulty: presentation?.difficulty ?? option.difficulty,
            tags: presentation?.tags ?? option.tags,
            allergenTags: presentation?.allergenTags ?? option.allergenTags,
            restrictionTags: presentation?.restrictionTags ?? option.restrictionTags,
            intoleranceTags: presentation?.intoleranceTags ?? option.intoleranceTags,
            measurementBasis: remoteOption?.measurement_basis ?? option.measurementBasis,
            portions: presentation?.portions ?? ingredients,
            image: presentation?.image ?? option.image
          };
        })
      };
    })
  };

  applyRemoteSelections(snapshot, selectionRows, slotKeyById, optionKeyById);
  applyRemoteProgressLogs(snapshot, hydrationRows, supplementRows);
  snapshot.updatedAt = dayRow.updated_at;

  return snapshot;
}

export async function persistNutritionStoreSnapshot(client: SupabaseClient<Database>, snapshot: NutritionStoreSnapshot) {
  const planResult = await client.from("nutrition_plans").upsert([buildPlanInsert(snapshot)] as never[], { onConflict: "id" }).select("*").single();
  if (planResult.error) {
    throw planResult.error;
  }
  const planRow = planResult.data as NutritionPlansRow;

  const dayResult = await client
    .from("nutrition_days")
    .upsert([buildDayInsert({ ...snapshot, plan: { ...snapshot.plan, id: planRow.id } })] as never[], { onConflict: "user_id,calendar_date" })
    .select("*")
    .single();
  if (dayResult.error) {
    throw dayResult.error;
  }
  const dayRow = dayResult.data as NutritionDaysRow;

  const slotInsertRows = snapshot.day.mealSlots.map((slot, index) => buildMealSlotInsert({ ...snapshot, day: { ...snapshot.day, id: dayRow.id } }, slot, index + 1));
  const slotResult = await client
    .from("nutrition_meal_slots")
    .upsert(slotInsertRows as never[], { onConflict: "nutrition_day_id,slot_key" })
    .select("*");
  if (slotResult.error) {
    throw slotResult.error;
  }
  const savedSlotRows = (slotResult.data ?? []) as NutritionMealSlotsRow[];

  const slotIdByKey = new Map<string, string>();
  for (const row of savedSlotRows) {
    slotIdByKey.set(row.slot_key, row.id);
  }

  const optionInsertRows: NutritionMealOptionsInsert[] = [];
  for (const slot of snapshot.day.mealSlots) {
    const slotId = slotIdByKey.get(slot.id);
    if (!slotId) {
      continue;
    }

    slot.options.forEach((option, index) => {
      optionInsertRows.push(buildMealOptionInsert(slotId, option, index + 1));
    });
  }

  const optionResult = optionInsertRows.length
    ? await client.from("nutrition_meal_options").upsert(optionInsertRows as never[], { onConflict: "meal_slot_id,option_key" }).select("*")
    : { data: [], error: null };
  if (optionResult.error) {
    throw optionResult.error;
  }
  const savedOptionRows = (optionResult.data ?? []) as NutritionMealOptionsRow[];

  const slotIdByOptionId = new Map<string, string>();
  for (const row of savedOptionRows) {
    slotIdByOptionId.set(`${row.meal_slot_id}:${row.option_key}`, row.id);
  }

  const selectionInsertRows: NutritionDaySelectionsInsert[] = [];
  for (const selection of snapshot.selections) {
    const slotId = slotIdByKey.get(selection.mealSlotId);
    const optionId = slotId ? slotIdByOptionId.get(`${slotId}:${selection.mealOptionId}`) : null;
    if (!slotId || !optionId) {
      continue;
    }

    selectionInsertRows.push(buildSelectionInsert(snapshot, slotId, optionId, selection));
  }

  if (selectionInsertRows.length > 0) {
    const selectionResult = await client
      .from("nutrition_day_selections")
      .upsert(selectionInsertRows as never[], { onConflict: "nutrition_day_id,meal_slot_id" })
      .select("*");
    if (selectionResult.error) {
      throw selectionResult.error;
    }
  }

  const hydrationInsertRows = snapshot.hydrationLogs.map((log) => buildHydrationInsert(snapshot, log));
  if (hydrationInsertRows.length > 0) {
    const hydrationResult = await client.from("nutrition_hydration_logs").upsert(hydrationInsertRows as never[], { onConflict: "id" }).select("*");
    if (hydrationResult.error) {
      throw hydrationResult.error;
    }
  }

  const supplementInsertRows = snapshot.supplementLogs.map((log) => buildSupplementInsert(snapshot, log));
  if (supplementInsertRows.length > 0) {
    const supplementResult = await client
      .from("nutrition_supplement_logs")
      .upsert(supplementInsertRows as never[], { onConflict: "nutrition_day_id,supplement_key" })
      .select("*");
    if (supplementResult.error) {
      throw supplementResult.error;
    }
  }

  return {
    plan: planResult.data,
    day: dayResult.data
  };
}

export async function loadOrCreateNutritionStoreSnapshot(
  client: SupabaseClient<Database>,
  userId: string,
  dateKey: string,
  daySummary?: ProgramDaySummary | null,
  programId: string | null = null
): Promise<NutritionStoreLoadResult> {
  const fallback = createNutritionStoreSnapshot(dateKey, daySummary, userId, programId);
  const normalizedDate = normalizeNutritionDateKey(dateKey);

  const dayResult = await client.from("nutrition_days").select("*").eq("user_id", userId).eq("calendar_date", normalizedDate).maybeSingle();
  if (dayResult.error) {
    throw dayResult.error;
  }

  if (!dayResult.data) {
    await persistNutritionStoreSnapshot(client, fallback);
    return {
      snapshot: fallback,
      source: "seeded"
    };
  }
  const dayRow = dayResult.data as NutritionDaysRow;

  const planResult = await client.from("nutrition_plans").select("*").eq("id", dayRow.nutrition_plan_id).maybeSingle();
  if (planResult.error) {
    throw planResult.error;
  }

  if (!planResult.data) {
    await persistNutritionStoreSnapshot(client, fallback);
    return {
      snapshot: fallback,
      source: "seeded"
    };
  }
  const planRow = planResult.data as NutritionPlansRow;

  const slotResult = await client.from("nutrition_meal_slots").select("*").eq("nutrition_day_id", dayRow.id).order("sort_order", { ascending: true });

  if (slotResult.error) {
    throw slotResult.error;
  }

  if (!slotResult.data || slotResult.data.length === 0) {
    await persistNutritionStoreSnapshot(client, fallback);
    return {
      snapshot: fallback,
      source: "seeded"
    };
  }

  const slotRows = (slotResult.data ?? []) as NutritionMealSlotsRow[];
  const slotIds = slotRows.map((row) => row.id);

  const [optionResult, selectionResult, hydrationResult, supplementResult] = await Promise.all([
    client.from("nutrition_meal_options").select("*").in("meal_slot_id", slotIds).order("sort_order", { ascending: true }),
    client.from("nutrition_day_selections").select("*").eq("nutrition_day_id", dayRow.id),
    client.from("nutrition_hydration_logs").select("*").eq("nutrition_day_id", dayRow.id).order("logged_at", { ascending: true }),
    client.from("nutrition_supplement_logs").select("*").eq("nutrition_day_id", dayRow.id)
  ]);

  if (optionResult.error) {
    throw optionResult.error;
  }

  if (selectionResult.error) {
    throw selectionResult.error;
  }

  if (hydrationResult.error) {
    throw hydrationResult.error;
  }

  if (supplementResult.error) {
    throw supplementResult.error;
  }

  const snapshot = mergeRemoteNutritionData(
    fallback,
    planRow,
    dayRow,
    slotRows,
    (optionResult.data ?? []) as NutritionMealOptionsRow[],
    (selectionResult.data ?? []) as NutritionDaySelectionsRow[],
    (hydrationResult.data ?? []) as NutritionHydrationLogsRow[],
    (supplementResult.data ?? []) as NutritionSupplementLogsRow[]
  );

  return {
    snapshot,
    source: "remote"
  };
}
