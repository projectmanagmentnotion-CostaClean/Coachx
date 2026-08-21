import { formatDate, getCurrentLocale, type Locale } from "@/lib/i18n";

export type NutritionDayType = "training" | "rest";

export type MealSlotState = "planned" | "selected" | "eaten" | "completed";
export type MealPreparationState = "raw" | "cooked" | "prepared";
export type MealMeasurementBasis = "raw" | "cooked" | "prepared" | "serving" | "unit";
export type MealDifficulty = "easy" | "moderate" | "advanced";

export interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionTarget extends MacroSummary {
  label: string;
}

export interface FoodItem {
  name: string;
  amount: string;
  preparation: MealPreparationState;
  measurementBasis?: MealMeasurementBasis;
  note?: string;
}

export interface NutritionSafetyProfile {
  allergies: string[];
  restrictions: string[];
  intolerances: string[];
  preferences: string[];
  budget: string[];
  variety: string[];
}

export interface MealOption {
  id: string;
  name: string;
  summary: string;
  macro: MacroSummary;
  prepTime: string;
  difficulty: MealDifficulty;
  tags: string[];
  allergenTags?: string[];
  restrictionTags?: string[];
  intoleranceTags?: string[];
  measurementBasis?: MealMeasurementBasis;
  portions: FoodItem[];
  image?: string;
}

export interface MealSlot {
  id: string;
  label: string;
  timeLabel: string;
  state: MealSlotState;
  target: MacroSummary;
  description: string;
  options: MealOption[];
  selectedOptionId: string | null;
  isNext?: boolean;
}

export interface HydrationState {
  currentMl: number;
  targetMl: number;
  quickAddMl: number[];
}

export interface SupplementReminder {
  id: string;
  label: string;
  dosage: string;
  checked: boolean;
}

export interface NutritionDay {
  dateKey: string;
  dateLabel: string;
  calendarLabel: string;
  dayType: NutritionDayType;
  title: string;
  subtitle: string;
  target: NutritionTarget;
  progress: MacroSummary;
  mealSlots: MealSlot[];
  hydration: HydrationState;
  supplements: SupplementReminder[];
  coachNote: string;
  nutritionPrescription: string;
  nutritionPreferences: string[];
  safetyProfile: NutritionSafetyProfile;
}

function createMacroSummary(calories: number, protein: number, carbs: number, fat: number): MacroSummary {
  return { calories, protein, carbs, fat };
}

function createMealOption(option: MealOption): MealOption {
  return option;
}

function createNutritionDay(day: NutritionDay): NutritionDay {
  return day;
}

function cloneNutritionDay(day: NutritionDay): NutritionDay {
  return JSON.parse(JSON.stringify(day)) as NutritionDay;
}

function formatNutritionDateLabel(dateKey: string, locale: Locale = getCurrentLocale()) {
  return formatDate(new Date(`${dateKey}T00:00:00Z`), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    locale
  });
}

function formatNutritionCalendarLabel(dateKey: string, locale: Locale = getCurrentLocale()) {
  return formatDate(new Date(`${dateKey}T00:00:00Z`), {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    locale
  });
}

function rebaseNutritionDay(day: NutritionDay, dateKey: string, locale: Locale = getCurrentLocale()) {
  return {
    ...cloneNutritionDay(day),
    dateKey,
    dateLabel: formatNutritionDateLabel(dateKey, locale),
    calendarLabel: formatNutritionCalendarLabel(dateKey, locale)
  };
}

function buildTrainingDay(locale: Locale) {
  return createNutritionDay({
  dateKey: "2026-08-08",
  dateLabel: formatNutritionDateLabel("2026-08-08", locale),
  calendarLabel: formatNutritionCalendarLabel("2026-08-08", locale),
  dayType: "training",
  title: "Glutes + Hamstrings",
  subtitle: "Workout A",
  target: {
    label: "TRAINING DAY",
    ...createMacroSummary(2050, 140, 220, 60)
  },
  progress: createMacroSummary(1180, 82, 128, 32),
  mealSlots: [
    {
      id: "breakfast",
      label: "Breakfast",
      timeLabel: "7:30 AM",
      state: "completed",
      target: createMacroSummary(450, 34, 29, 21),
      description: "Front-load protein and carbs before the training session.",
      selectedOptionId: "eggs-avocado-toast",
      options: [
        createMealOption({
          id: "eggs-avocado-toast",
          name: "Eggs & Avocado Toast",
          summary: "High-satiety breakfast with steady energy.",
          macro: createMacroSummary(450, 34, 29, 21),
          prepTime: "10 min",
          difficulty: "easy",
          tags: ["breakfast", "eggs", "toast"],
          portions: [
            { name: "Whole eggs", amount: "3 eggs", preparation: "prepared", note: "Scrambled or fried" },
            { name: "Sourdough toast", amount: "2 slices", preparation: "prepared" },
            { name: "Avocado", amount: "80 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "greek-yogurt-parfait",
          name: "Greek Yogurt Parfait",
          summary: "Lighter option with protein and fruit.",
          macro: createMacroSummary(442, 37, 36, 14),
          prepTime: "8 min",
          difficulty: "easy",
          tags: ["breakfast", "dairy", "fruit"],
          portions: [
            { name: "Greek yogurt", amount: "250 g", preparation: "prepared" },
            { name: "Granola", amount: "35 g", preparation: "prepared" },
            { name: "Blueberries", amount: "90 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "overnight-oats-whey",
          name: "Overnight Oats + Whey",
          summary: "Portable breakfast with reliable macro balance.",
          macro: createMacroSummary(448, 33, 45, 15),
          prepTime: "5 min",
          difficulty: "easy",
          tags: ["breakfast", "oats", "portable"],
          portions: [
            { name: "Rolled oats", amount: "65 g", preparation: "raw" },
            { name: "Whey isolate", amount: "30 g", preparation: "prepared" },
            { name: "Banana", amount: "1 medium", preparation: "prepared" }
          ]
        })
      ]
    },
    {
      id: "lunch",
      label: "Lunch",
      timeLabel: "12:45 PM",
      state: "planned",
      target: createMacroSummary(650, 45, 75, 18),
      description: "Main training meal with four equivalent choices.",
      selectedOptionId: null,
      isNext: true,
      options: [
        createMealOption({
          id: "chicken-rice-bowl",
          name: "Chicken Rice Bowl",
          summary: "Lean protein, jasmine rice, and green veg.",
          macro: createMacroSummary(648, 46, 73, 17),
          prepTime: "15 min",
          difficulty: "easy",
          tags: ["chicken", "rice", "batch"],
          portions: [
            { name: "Chicken breast", amount: "150 g cooked", preparation: "cooked" },
            { name: "Jasmine rice", amount: "220 g cooked", preparation: "cooked" },
            { name: "Broccoli", amount: "90 g cooked", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "lean-beef-potato",
          name: "Lean Beef + Potato",
          summary: "Training fuel with easy reheating.",
          macro: createMacroSummary(655, 45, 76, 18),
          prepTime: "20 min",
          difficulty: "moderate",
          tags: ["beef", "potato", "batch"],
          portions: [
            { name: "Lean beef", amount: "160 g cooked", preparation: "cooked" },
            { name: "Potatoes", amount: "280 g roasted", preparation: "cooked" },
            { name: "Green beans", amount: "80 g", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "turkey-wrap",
          name: "Turkey Wrap",
          summary: "Portable meal with balanced macros.",
          macro: createMacroSummary(643, 44, 74, 17),
          prepTime: "12 min",
          difficulty: "easy",
          tags: ["turkey", "wrap", "portable"],
          portions: [
            { name: "Turkey breast", amount: "170 g cooked", preparation: "cooked" },
            { name: "Whole-wheat wraps", amount: "2 medium wraps", preparation: "prepared" },
            { name: "Avocado", amount: "60 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "chicken-pasta",
          name: "Chicken Pasta",
          summary: "Higher-carb option for the main training window.",
          macro: createMacroSummary(651, 47, 74, 18),
          prepTime: "18 min",
          difficulty: "moderate",
          tags: ["chicken", "pasta", "batch"],
          portions: [
            { name: "Chicken breast", amount: "145 g cooked", preparation: "cooked" },
            { name: "Pasta", amount: "180 g cooked", preparation: "cooked" },
            { name: "Tomato sauce", amount: "90 g", preparation: "prepared" }
          ]
        })
      ]
    },
    {
      id: "snack",
      label: "Snack",
      timeLabel: "3:30 PM",
      state: "planned",
      target: createMacroSummary(350, 25, 35, 12),
      description: "Simple recovery snack that keeps the day on target.",
      selectedOptionId: null,
      options: [
        createMealOption({
          id: "greek-yogurt-whey",
          name: "Greek Yogurt + Whey",
          summary: "Fast protein and low prep time.",
          macro: createMacroSummary(352, 27, 32, 12),
          prepTime: "5 min",
          difficulty: "easy",
          tags: ["dairy", "protein", "snack"],
          portions: [
            { name: "Greek yogurt", amount: "220 g", preparation: "prepared" },
            { name: "Whey isolate", amount: "25 g", preparation: "prepared" },
            { name: "Honey", amount: "10 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "cottage-cheese-berries",
          name: "Cottage Cheese + Berries",
          summary: "Creamy snack with steady satiety.",
          macro: createMacroSummary(348, 24, 34, 11),
          prepTime: "5 min",
          difficulty: "easy",
          tags: ["dairy", "berries", "snack"],
          portions: [
            { name: "Cottage cheese", amount: "200 g", preparation: "prepared" },
            { name: "Mixed berries", amount: "100 g", preparation: "prepared" },
            { name: "Rice cakes", amount: "2 cakes", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "protein-shake-banana",
          name: "Protein Shake + Banana",
          summary: "Lowest-friction option when moving between sessions.",
          macro: createMacroSummary(344, 26, 33, 11),
          prepTime: "3 min",
          difficulty: "easy",
          tags: ["shake", "banana", "portable"],
          portions: [
            { name: "Whey isolate", amount: "30 g", preparation: "prepared" },
            { name: "Banana", amount: "1 medium", preparation: "prepared" },
            { name: "Milk", amount: "250 ml", preparation: "prepared" }
          ]
        })
      ]
    },
    {
      id: "dinner",
      label: "Dinner",
      timeLabel: "7:15 PM",
      state: "planned",
      target: createMacroSummary(600, 36, 82, 19),
      description: "Recovery meal with one main protein and one main carb.",
      selectedOptionId: null,
      options: [
        createMealOption({
          id: "chicken-sweet-potato",
          name: "Chicken + Sweet Potato",
          summary: "Balanced dinner that mirrors the current export copy.",
          macro: createMacroSummary(602, 38, 81, 18),
          prepTime: "18 min",
          difficulty: "easy",
          tags: ["chicken", "sweet-potato", "recovery"],
          portions: [
            { name: "Chicken breast", amount: "165 g cooked", preparation: "cooked" },
            { name: "Sweet potato", amount: "280 g roasted", preparation: "cooked" },
            { name: "Olive oil", amount: "8 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "salmon-rice",
          name: "Salmon + Rice",
          summary: "Higher-fat recovery option with easy portioning.",
          macro: createMacroSummary(598, 35, 79, 19),
          prepTime: "20 min",
          difficulty: "moderate",
          tags: ["salmon", "rice", "omega-3"],
          portions: [
            { name: "Salmon", amount: "150 g cooked", preparation: "cooked" },
            { name: "White rice", amount: "190 g cooked", preparation: "cooked" },
            { name: "Asparagus", amount: "90 g", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "turkey-chili",
          name: "Turkey Chili",
          summary: "Batch-friendly dinner with a warm finish.",
          macro: createMacroSummary(604, 37, 84, 18),
          prepTime: "25 min",
          difficulty: "moderate",
          tags: ["turkey", "chili", "batch"],
          portions: [
            { name: "Lean turkey", amount: "155 g cooked", preparation: "cooked" },
            { name: "Beans", amount: "120 g cooked", preparation: "cooked" },
            { name: "Rice", amount: "150 g cooked", preparation: "cooked" }
          ]
        })
      ]
    }
  ],
  hydration: {
    currentMl: 1700,
    targetMl: 2500,
    quickAddMl: [250, 500]
  },
  supplements: [
    { id: "creatine", label: "Creatine", dosage: "5 g", checked: true },
    { id: "protein-isolate", label: "Protein isolate", dosage: "1 scoop", checked: false }
  ],
  coachNote:
    "Keep most carbohydrates around your training window today to maximize performance and recovery.",
  nutritionPrescription: "3 meals + snack · Structured",
  nutritionPreferences: ["Likes chicken", "Prefers portable lunches", "Keeps dinner simple"],
  safetyProfile: {
    allergies: [],
    restrictions: [],
    intolerances: [],
    preferences: ["chicken"],
    budget: ["batch"],
    variety: []
  }
  });
}

function buildRestDay(locale: Locale) {
  return createNutritionDay({
  dateKey: "2026-08-09",
  dateLabel: formatNutritionDateLabel("2026-08-09", locale),
  calendarLabel: formatNutritionCalendarLabel("2026-08-09", locale),
  dayType: "rest",
  title: "Recovery Day",
  subtitle: "Mobility + steps",
  target: {
    label: "REST DAY",
    ...createMacroSummary(1900, 150, 180, 65)
  },
  progress: createMacroSummary(760, 54, 62, 24),
  mealSlots: [
    {
      id: "breakfast",
      label: "Breakfast",
      timeLabel: "8:00 AM",
      state: "completed",
      target: createMacroSummary(420, 34, 28, 18),
      description: "Recovery breakfast with a lower carb ceiling.",
      selectedOptionId: "protein-oats",
      options: [
        createMealOption({
          id: "protein-oats",
          name: "Protein Oats",
          summary: "Warm oats with a high-protein finish.",
          macro: createMacroSummary(418, 34, 37, 14),
          prepTime: "8 min",
          difficulty: "easy",
          tags: ["oats", "breakfast"],
          portions: [
            { name: "Rolled oats", amount: "55 g", preparation: "raw" },
            { name: "Whey isolate", amount: "30 g", preparation: "prepared" },
            { name: "Blueberries", amount: "80 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "egg-white-wrap",
          name: "Egg White Wrap",
          summary: "Lean breakfast for a lighter day.",
          macro: createMacroSummary(422, 35, 30, 16),
          prepTime: "10 min",
          difficulty: "easy",
          tags: ["eggs", "wrap", "breakfast"],
          portions: [
            { name: "Egg whites", amount: "220 g", preparation: "prepared" },
            { name: "Wrap", amount: "1 large", preparation: "prepared" },
            { name: "Spinach", amount: "40 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "yogurt-granola-rest",
          name: "Yogurt + Granola",
          summary: "Simple option with enough protein for recovery.",
          macro: createMacroSummary(415, 33, 39, 13),
          prepTime: "5 min",
          difficulty: "easy",
          tags: ["dairy", "breakfast", "portable"],
          portions: [
            { name: "Greek yogurt", amount: "240 g", preparation: "prepared" },
            { name: "Granola", amount: "30 g", preparation: "prepared" },
            { name: "Banana", amount: "1 medium", preparation: "prepared" }
          ]
        })
      ]
    },
    {
      id: "lunch",
      label: "Lunch",
      timeLabel: "1:00 PM",
      state: "planned",
      target: createMacroSummary(560, 44, 54, 18),
      description: "Lighter recovery lunch that still hits protein.",
      selectedOptionId: null,
      isNext: true,
      options: [
        createMealOption({
          id: "turkey-potato-rest",
          name: "Turkey + Potato",
          summary: "Simple recovery plate with familiar ingredients.",
          macro: createMacroSummary(558, 44, 55, 17),
          prepTime: "15 min",
          difficulty: "easy",
          tags: ["turkey", "potato", "batch"],
          portions: [
            { name: "Turkey breast", amount: "160 g cooked", preparation: "cooked" },
            { name: "Potatoes", amount: "240 g roasted", preparation: "cooked" },
            { name: "Green beans", amount: "100 g", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "salmon-salad-rest",
          name: "Salmon Salad",
          summary: "Protein-rich lunch with a lighter carb load.",
          macro: createMacroSummary(562, 42, 52, 19),
          prepTime: "12 min",
          difficulty: "easy",
          tags: ["salmon", "salad", "recovery"],
          portions: [
            { name: "Salmon", amount: "140 g cooked", preparation: "cooked" },
            { name: "Mixed greens", amount: "80 g", preparation: "prepared" },
            { name: "Quinoa", amount: "150 g cooked", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "chicken-bowl-rest",
          name: "Chicken Bowl",
          summary: "Batch-friendly bowl for the rest-day structure.",
          macro: createMacroSummary(556, 45, 53, 16),
          prepTime: "15 min",
          difficulty: "easy",
          tags: ["chicken", "bowl", "batch"],
          portions: [
            { name: "Chicken breast", amount: "150 g cooked", preparation: "cooked" },
            { name: "Rice", amount: "160 g cooked", preparation: "cooked" },
            { name: "Broccoli", amount: "100 g cooked", preparation: "cooked" }
          ]
        })
      ]
    },
    {
      id: "snack",
      label: "Snack",
      timeLabel: "4:00 PM",
      state: "planned",
      target: createMacroSummary(300, 24, 26, 10),
      description: "Recovery snack without overfeeding the rest day.",
      selectedOptionId: null,
      options: [
        createMealOption({
          id: "cottage-cheese-rest",
          name: "Cottage Cheese + Berries",
          summary: "High-protein snack with low prep.",
          macro: createMacroSummary(302, 25, 24, 10),
          prepTime: "4 min",
          difficulty: "easy",
          tags: ["dairy", "snack", "berries"],
          portions: [
            { name: "Cottage cheese", amount: "200 g", preparation: "prepared" },
            { name: "Berries", amount: "100 g", preparation: "prepared" },
            { name: "Rice cakes", amount: "1-2 cakes", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "yogurt-pumpkin-rest",
          name: "Yogurt + Pumpkin Seeds",
          summary: "Easy snack with a lighter carb profile.",
          macro: createMacroSummary(298, 23, 23, 11),
          prepTime: "3 min",
          difficulty: "easy",
          tags: ["yogurt", "snack", "portable"],
          portions: [
            { name: "Greek yogurt", amount: "180 g", preparation: "prepared" },
            { name: "Pumpkin seeds", amount: "20 g", preparation: "prepared" },
            { name: "Honey", amount: "8 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "protein-shake-rest",
          name: "Protein Shake",
          summary: "Fast option when the day is busy.",
          macro: createMacroSummary(300, 24, 25, 10),
          prepTime: "2 min",
          difficulty: "easy",
          tags: ["shake", "snack", "portable"],
          portions: [
            { name: "Whey isolate", amount: "30 g", preparation: "prepared" },
            { name: "Milk", amount: "250 ml", preparation: "prepared" },
            { name: "Banana", amount: "1 small", preparation: "prepared" }
          ]
        })
      ]
    },
    {
      id: "dinner",
      label: "Dinner",
      timeLabel: "7:00 PM",
      state: "planned",
      target: createMacroSummary(620, 48, 72, 19),
      description: "Recovery dinner with steady protein and vegetables.",
      selectedOptionId: null,
      options: [
        createMealOption({
          id: "cod-rice-rest",
          name: "Cod + Rice",
          summary: "Light dinner that keeps protein high.",
          macro: createMacroSummary(620, 47, 71, 18),
          prepTime: "18 min",
          difficulty: "moderate",
          tags: ["cod", "rice", "recovery"],
          portions: [
            { name: "Cod", amount: "170 g cooked", preparation: "cooked" },
            { name: "Rice", amount: "190 g cooked", preparation: "cooked" },
            { name: "Zucchini", amount: "100 g cooked", preparation: "cooked" }
          ]
        }),
        createMealOption({
          id: "turkey-pasta-rest",
          name: "Turkey Pasta",
          summary: "Comfortable dinner for a lower-intensity evening.",
          macro: createMacroSummary(618, 49, 73, 18),
          prepTime: "20 min",
          difficulty: "moderate",
          tags: ["turkey", "pasta", "batch"],
          portions: [
            { name: "Turkey mince", amount: "160 g cooked", preparation: "cooked" },
            { name: "Pasta", amount: "170 g cooked", preparation: "cooked" },
            { name: "Tomato sauce", amount: "80 g", preparation: "prepared" }
          ]
        }),
        createMealOption({
          id: "salmon-veg-rest",
          name: "Salmon + Veg",
          summary: "Higher-fat dinner with simple prep.",
          macro: createMacroSummary(622, 46, 71, 20),
          prepTime: "18 min",
          difficulty: "easy",
          tags: ["salmon", "veg", "recovery"],
          portions: [
            { name: "Salmon", amount: "150 g cooked", preparation: "cooked" },
            { name: "Rice", amount: "160 g cooked", preparation: "cooked" },
            { name: "Mixed veg", amount: "120 g", preparation: "cooked" }
          ]
        })
      ]
    }
  ],
  hydration: {
    currentMl: 1500,
    targetMl: 2300,
    quickAddMl: [250, 500]
  },
  supplements: [
    { id: "creatine", label: "Creatine", dosage: "5 g", checked: true }
  ],
  coachNote: "Recovery day: keep the structure simple, maintain protein, and keep steps moving.",
  nutritionPrescription: "3 meals + snack · Recovery",
  nutritionPreferences: ["Simple prep", "Higher protein", "Batch-friendly dinners"],
  safetyProfile: {
    allergies: [],
    restrictions: [],
    intolerances: [],
    preferences: ["simple"],
    budget: ["batch"],
    variety: []
  }
  });
}

const nutritionDaySeeds: Record<string, NutritionDay> = {};

export function getNutritionDay(dateKey: string, locale: Locale = getCurrentLocale()): NutritionDay {
  const fallback = nutritionDaySeeds["2026-08-08"];
  const trainingDay = nutritionDaySeeds["2026-08-08"] ?? (nutritionDaySeeds["2026-08-08"] = buildTrainingDay(locale));
  const restDay = nutritionDaySeeds["2026-08-09"] ?? (nutritionDaySeeds["2026-08-09"] = buildRestDay(locale));
  const seed = nutritionDaySeeds[dateKey] ?? fallback ?? trainingDay;
  return rebaseNutritionDay(seed, dateKey, locale);
}

export function getNutritionDayTemplate(dayType: NutritionDayType, locale: Locale = getCurrentLocale()): NutritionDay {
  const trainingDay = buildTrainingDay(locale);
  const restDay = buildRestDay(locale);
  return cloneNutritionDay(dayType === "rest" ? restDay : trainingDay);
}

export function createNutritionDayForDate(dateKey: string, dayType: NutritionDayType = "training", locale: Locale = getCurrentLocale()): NutritionDay {
  return rebaseNutritionDay(getNutritionDayTemplate(dayType, locale), dateKey, locale);
}

export function createNutritionSession(dateKey: string, locale: Locale = getCurrentLocale()): NutritionDay {
  return getNutritionDay(dateKey, locale);
}

export function getSafeMealOptions(slot: MealSlot, profile: NutritionSafetyProfile): MealOption[] {
  return slot.options.filter((option) => isMealOptionSafe(option, profile));
}

export function isMealOptionSafe(option: MealOption, profile: NutritionSafetyProfile): boolean {
  const normalize = (value: string) => value.trim().toLowerCase();
  const optionTokens = new Set(
    [
      ...option.tags,
      ...(option.allergenTags ?? []),
      ...(option.restrictionTags ?? []),
      ...(option.intoleranceTags ?? [])
    ]
      .flatMap((value) => normalize(value).split(/[\s,+/_-]+/g))
      .filter(Boolean)
  );

  return ![profile.allergies, profile.restrictions, profile.intolerances].some((blockedGroup) =>
    blockedGroup.some((blockedValue) => {
      const blockedTokens = normalize(blockedValue).split(/[\s,+/_-]+/g).filter(Boolean);
      return blockedTokens.some((token) => optionTokens.has(token));
    })
  );
}

export function getMealSlotStatusLabel(slot: MealSlot): string {
  switch (slot.state) {
    case "completed":
      return "COMPLETED";
    case "eaten":
      return "EATEN";
    case "selected":
      return "SELECTED";
    default:
      return slot.isNext ? "NEXT" : "PLANNED";
  }
}
