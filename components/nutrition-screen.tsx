"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton } from "@/components/ui";
import { AthlexMedia } from "@/components/athlex-media";
import { useTranslator } from "@/components/locale-provider";
import { NutritionMealSheet } from "@/components/nutrition-meal-sheet";
import { NutritionProvider, useNutritionSession } from "@/components/nutrition-provider";
import {
  getNutritionDay,
  getSafeMealOptions,
  type MacroSummary,
  type MealSlot,
  type NutritionSafetyProfile
} from "@/lib/nutrition-data";
import { resolveMealThumbnailMedia } from "@/lib/media";
import { resolveNutritionMealUiState } from "@/lib/nutrition-service";

type NutritionScreenMode = "ready" | "loading" | "empty" | "error";

interface NutritionScreenProps {
  dateKey: string;
  mode: NutritionScreenMode;
}

function nutritionCopyFor(locale: string) {
  return (
    {
      en: {
        dayType: { training: "TRAINING DAY", rest: "REST DAY" },
        daySubtitle: { training: "Workout A", rest: "Mobility + steps" },
        mealLabels: { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" },
        target: "TARGET",
        dailyProgress: "PROGRESS",
        today: "TODAY",
        consumed: "Consumed",
        remaining: "Remaining",
        nextMeal: "NEXT MEAL",
        openMeal: "OPEN MEAL",
        mealDetail: "MEAL DETAIL",
        ingredients: "Ingredients",
        preparation: "Preparation",
        hydration: "HYDRATION",
        supplements: "SUPPLEMENTS",
        coachNote: "COACH NOTE",
        calories: "Calories",
        protein: "PROTEIN",
        carbs: "CARBS",
        fat: "FAT",
        viewOptions: "VIEW OPTIONS",
        markEaten: "MARK EATEN",
        markComplete: "MARK COMPLETE",
        chooseMeal: "CHOOSE MEAL",
        completed: "COMPLETED",
        next: "NEXT",
        noSafeOptions: "No safe options available",
        planned: "PLANNED",
        selected: "SELECTED",
        eaten: "EATEN",
        nutritionComplete: "NUTRITION COMPLETE",
        partialDay: "PARTIAL DAY",
        noNutritionPlan: "NO NUTRITION PLAN TODAY",
        couldntSave: "COULDN'T SAVE",
        tryAgain: "TRY AGAIN",
        mealUpdated: "MEAL UPDATED",
        waterRemaining: "Water remaining",
        supplementsRemaining: "Supplements remaining",
        replaceMeal: "REPLACE MEAL",
        requestAlternative: "REQUEST ALTERNATIVE",
        coachManagedUnavailable: "Coach-managed replacement is handled outside this flow.",
        current: "Current",
        new: "New"
      },
      es: {
        dayType: { training: "DÍA DE ENTRENAMIENTO", rest: "DÍA DE DESCANSO" },
        daySubtitle: { training: "Entrenamiento A", rest: "Movilidad + pasos" },
        mealLabels: { breakfast: "Desayuno", lunch: "Comida", snack: "Merienda", dinner: "Cena" },
        target: "OBJETIVO",
        dailyProgress: "PROGRESO",
        today: "HOY",
        hydration: "HIDRATACIÓN",
        supplements: "SUPLEMENTOS",
        coachNote: "NOTA DEL COACH",
        calories: "Calorías",
        protein: "PROTEÍNA",
        carbs: "CARBOHIDRATOS",
        fat: "GRASA",
        viewOptions: "VER OPCIONES",
        markEaten: "MARCAR COMO COMIDO",
        markComplete: "MARCAR COMO COMPLETADO",
        chooseMeal: "ELEGIR COMIDA",
        completed: "COMPLETADO",
        next: "SIGUIENTE",
        noSafeOptions: "No hay opciones seguras",
        planned: "PLANIFICADO",
        selected: "SELECCIONADO",
        eaten: "COMIDO"
      },
      ca: {
        dayType: { training: "DIA D'ENTRENAMENT", rest: "DIA DE DESCANS" },
        daySubtitle: { training: "Entrenament A", rest: "Mobilitat + passos" },
        mealLabels: { breakfast: "Esmorzar", lunch: "Dinar", snack: "Berenar", dinner: "Sopar" },
        target: "OBJECTIU",
        dailyProgress: "PROGRÉS",
        today: "AVUI",
        hydration: "HIDRATACIÓ",
        supplements: "SUPLEMENTS",
        coachNote: "NOTA DEL COACH",
        calories: "Calories",
        protein: "PROTEÏNA",
        carbs: "HIDRATS DE CARBONI",
        fat: "GREIX",
        viewOptions: "VEURE OPCIONS",
        markEaten: "MARCAR COM MENJAT",
        markComplete: "MARCAR COM COMPLETAT",
        chooseMeal: "TRIAR ÀPAT",
        completed: "COMPLETAT",
        next: "SEGÜENT",
        noSafeOptions: "No hi ha opcions segures",
        planned: "PLANIFICAT",
        selected: "SELECCIONAT",
        eaten: "MENJAT"
      },
      de: {
        dayType: { training: "TRAININGSTAG", rest: "RUHETAG" },
        daySubtitle: { training: "Workout A", rest: "Mobilität + Schritte" },
        mealLabels: { breakfast: "Frühstück", lunch: "Mittagessen", snack: "Snack", dinner: "Abendessen" },
        target: "ZIEL",
        dailyProgress: "FORTSCHRITT",
        today: "HEUTE",
        hydration: "HYDRATION",
        supplements: "SUPPLEMENTS",
        coachNote: "COACH-NOTIZ",
        calories: "Kalorien",
        protein: "PROTEIN",
        carbs: "KOHLENHYDRATE",
        fat: "FETT",
        viewOptions: "OPTIONEN ANSEHEN",
        markEaten: "ALS GEGESSEN MARKIEREN",
        markComplete: "ALS ABGESCHLOSSEN MARKIEREN",
        chooseMeal: "MAHLZEIT WÄHLEN",
        completed: "ABGESCHLOSSEN",
        next: "NÄCHSTE",
        noSafeOptions: "Keine sicheren Optionen verfügbar",
        planned: "GEPLANT",
        selected: "AUSGEWÄHLT",
        eaten: "GEGESSEN"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      dayType: { training: "TRAINING DAY", rest: "REST DAY" },
      daySubtitle: { training: "Workout A", rest: "Mobility + steps" },
      mealLabels: { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" },
      target: "TARGET",
      dailyProgress: "PROGRESS",
      today: "TODAY",
      consumed: "Consumed",
      remaining: "Remaining",
      nextMeal: "NEXT MEAL",
      openMeal: "OPEN MEAL",
      mealDetail: "MEAL DETAIL",
      ingredients: "Ingredients",
      preparation: "Preparation",
      hydration: "HYDRATION",
      supplements: "SUPPLEMENTS",
      coachNote: "COACH NOTE",
      calories: "Calories",
      protein: "PROTEIN",
      carbs: "CARBS",
      fat: "FAT",
      viewOptions: "VIEW OPTIONS",
      markEaten: "MARK EATEN",
      markComplete: "MARK COMPLETE",
      chooseMeal: "CHOOSE MEAL",
      completed: "COMPLETED",
      next: "NEXT",
      noSafeOptions: "No safe options available",
      planned: "PLANNED",
      selected: "SELECTED",
      eaten: "EATEN",
      nutritionComplete: "NUTRITION COMPLETE",
      partialDay: "PARTIAL DAY",
      noNutritionPlan: "NO NUTRITION PLAN TODAY",
      couldntSave: "COULDN'T SAVE",
      tryAgain: "TRY AGAIN",
      mealUpdated: "MEAL UPDATED",
      waterRemaining: "Water remaining",
      supplementsRemaining: "Supplements remaining",
      replaceMeal: "REPLACE MEAL",
      requestAlternative: "REQUEST ALTERNATIVE",
      coachManagedUnavailable: "Coach-managed replacement is handled outside this flow.",
      current: "Current",
      new: "New"
    }
  );
}

type NutritionPresentationCopy = {
  dayTitle: { training: string; rest: string };
  daySubtitle: { training: string; rest: string };
  coachNote: string;
  mealSlots: Record<string, { label: string; description: string }>;
  options: Record<string, { name: string; summary: string }>;
};

function nutritionPresentationFor(locale: string): NutritionPresentationCopy | null {
  if (locale !== "es") {
    return null;
  }

  return {
    dayTitle: {
      training: "Glúteos + Isquios",
      rest: "Día de recuperación"
    },
    daySubtitle: {
      training: "Entrenamiento A",
      rest: "Movilidad + pasos"
    },
    coachNote: "Mantén la mayor parte de los carbohidratos alrededor de tu ventana de entrenamiento hoy para maximizar el rendimiento y la recuperación.",
    mealSlots: {
      breakfast: {
        label: "Desayuno",
        description: "Carga proteína y carbohidratos antes de la sesión de entrenamiento."
      },
      lunch: {
        label: "Comida",
        description: "Comida principal de entrenamiento con cuatro opciones equivalentes."
      },
      snack: {
        label: "Merienda",
        description: "Merienda de recuperación sencilla que mantiene el día en objetivo."
      },
      dinner: {
        label: "Cena",
        description: "Cena de recuperación con una proteína principal y un carbohidrato principal."
      }
    },
    options: {
      "eggs-avocado-toast": {
        name: "Tostada de huevos y aguacate",
        summary: "Desayuno saciante con energía estable."
      },
      "greek-yogurt-parfait": {
        name: "Parfait de yogur griego",
        summary: "Opción más ligera con proteína y fruta."
      },
      "overnight-oats-whey": {
        name: "Avena nocturna + whey",
        summary: "Desayuno portátil con un reparto de macros fiable."
      },
      "chicken-rice-bowl": {
        name: "Bol de pollo con arroz",
        summary: "Proteína magra, arroz jazmín y verduras verdes."
      },
      "lean-beef-potato": {
        name: "Ternera magra + patata",
        summary: "Combustible de entrenamiento con recalentado fácil."
      },
      "turkey-wrap": {
        name: "Wrap de pavo",
        summary: "Comida portátil con macros equilibrados."
      },
      "chicken-pasta": {
        name: "Pasta con pollo",
        summary: "Opción más alta en carbohidratos para la ventana principal de entrenamiento."
      },
      "greek-yogurt-whey": {
        name: "Yogur griego + whey",
        summary: "Proteína rápida y poco tiempo de preparación."
      },
      "cottage-cheese-berries": {
        name: "Requesón con bayas",
        summary: "Merienda cremosa con saciedad estable."
      },
      "protein-shake-banana": {
        name: "Batido de proteína + plátano",
        summary: "La opción con menos fricción cuando te mueves entre sesiones."
      },
      "chicken-sweet-potato": {
        name: "Pollo + boniato",
        summary: "Cena equilibrada que replica la copia exportada actual."
      },
      "salmon-rice": {
        name: "Salmón + arroz",
        summary: "Opción de recuperación con más grasa y porcionado sencillo."
      },
      "turkey-chili": {
        name: "Chili de pavo",
        summary: "Cena batch-friendly con final caliente."
      },
      "protein-oats": {
        name: "Avena proteica",
        summary: "Avena caliente con un final alto en proteína."
      },
      "egg-white-wrap": {
        name: "Wrap de claras",
        summary: "Desayuno magro para un día más ligero."
      },
      "yogurt-granola-rest": {
        name: "Yogur + granola",
        summary: "Opción sencilla con proteína suficiente para la recuperación."
      },
      "turkey-potato-rest": {
        name: "Pavo + patata",
        summary: "Plato de recuperación sencillo con ingredientes familiares."
      },
      "salmon-salad-rest": {
        name: "Ensalada de salmón",
        summary: "Comida alta en proteína con menos carga de carbohidratos."
      },
      "chicken-bowl-rest": {
        name: "Bol de pollo",
        summary: "Bol práctico para la estructura del día de descanso."
      },
      "cottage-cheese-rest": {
        name: "Requesón con bayas",
        summary: "Merienda alta en proteína y de preparación rápida."
      },
      "yogurt-pumpkin-rest": {
        name: "Yogur + semillas de calabaza",
        summary: "Merienda fácil con un perfil de carbohidratos más ligero."
      },
      "protein-shake-rest": {
        name: "Batido de proteína",
        summary: "Opción rápida cuando el día va cargado."
      },
      "cod-rice-rest": {
        name: "Bacalao + arroz",
        summary: "Cena ligera que mantiene la proteína alta."
      },
      "turkey-pasta-rest": {
        name: "Pasta con pavo",
        summary: "Cena cómoda para una noche de menor intensidad."
      },
      "salmon-veg-rest": {
        name: "Salmón + verduras",
        summary: "Cena con más grasa y preparación simple."
      }
    }
  };
}

function formatMacro(summary: MacroSummary) {
  return `${summary.calories} kcal · ${summary.protein}P / ${summary.carbs}C / ${summary.fat}F`;
}

function MetricBar({ label, current, target }: { label: string; current: number; target: number }) {
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="nutrition-progress-row">
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="body-md" style={{ fontWeight: 700 }}>
          {label}
        </span>
        <span className="caption">
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{current}</span> / {target}
        </span>
      </div>
      <div className="nutrition-progress-track">
        <div className="nutrition-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function formatMacroDisplay(summary: MacroSummary) {
  return `${summary.calories} kcal · ${summary.protein}P / ${summary.carbs}C / ${summary.fat}F`;
}

function MealCard({
  slot,
  safetyProfile,
  onOpenChooser,
  onMarkEaten,
  onMarkCompleted
}: {
  slot: MealSlot;
  safetyProfile: NutritionSafetyProfile;
  onOpenChooser: (slot: MealSlot) => void;
  onMarkEaten: (slotId: string) => void;
  onMarkCompleted: (slotId: string) => void;
}) {
  const { locale } = useTranslator();
  const copy = nutritionCopyFor(locale);
  const presentation = nutritionPresentationFor(locale);
  const selectedOption = slot.selectedOptionId ? slot.options.find((option) => option.id === slot.selectedOptionId) ?? null : null;
  const selectedOptionMedia = selectedOption
    ? resolveMealThumbnailMedia({
        mealKey: selectedOption.id,
        mealName: selectedOption.name,
        macroHint: formatMacroDisplay(selectedOption.macro),
        prepTimeHint: selectedOption.prepTime
      })
    : null;
  const safeOptions = getSafeMealOptions(slot, safetyProfile);
  const canChoose = safeOptions.length > 0;
  const localizedSlot = presentation?.mealSlots[slot.id] ?? null;
  const slotLabel = localizedSlot?.label ?? copy.mealLabels[slot.id as keyof typeof copy.mealLabels] ?? slot.label;
  const selectedOptionName = selectedOption ? presentation?.options[selectedOption.id]?.name ?? selectedOption.name : null;
  const uiState = resolveNutritionMealUiState(slot);
  const statusLabel =
    uiState === "completed"
      ? copy.completed
      : slot.state === "selected"
        ? copy.selected
        : slot.state === "eaten"
          ? copy.eaten
        : uiState === "next"
          ? copy.next
          : copy.planned;
  const actionLabel =
    slot.state === "completed"
      ? copy.viewOptions
      : slot.state === "selected"
        ? copy.markEaten
        : slot.state === "eaten"
          ? copy.markComplete
          : uiState === "next"
            ? copy.chooseMeal
            : copy.viewOptions;

  const handleAction = () => {
    if (slot.state === "selected") {
      onMarkEaten(slot.id);
      return;
    }

    if (slot.state === "eaten") {
      onMarkCompleted(slot.id);
      return;
    }

    if (canChoose) {
      onOpenChooser(slot);
    }
  };

  return (
    <Card className={`nutrition-meal-card p-16 ${uiState === "next" ? "nutrition-meal-card--next" : ""} ${slot.state === "completed" ? "nutrition-meal-card--completed" : ""}`.trim()}>
      <div className="nutrition-meal-card__header">
        <div className="nutrition-meal-card__copy">
          <div className="nutrition-meal-card__label-row">
            <span className={`pill nutrition-meal-card__pill ${slot.state === "completed" ? "nutrition-meal-card__pill--complete" : ""}`}>
              {slot.state === "completed" ? copy.completed : uiState === "next" ? `${copy.next}: ${slotLabel.toUpperCase()}` : slotLabel.toUpperCase()}
            </span>
            <span className="caption nutrition-meal-card__status">{statusLabel}</span>
          </div>
          <h3 className={`headline-md nutrition-meal-card__title ${slot.state === "completed" ? "nutrition-meal-card__title--complete" : ""}`.trim()}>
            {slot.state === "completed" && selectedOptionName
              ? selectedOptionName
              : uiState === "next"
                ? copy.chooseMeal
                : slot.id === "breakfast" && selectedOptionName
                  ? selectedOptionName
                  : slotLabel}
          </h3>
          <p className="caption nutrition-meal-card__subtitle">
            {selectedOption
              ? presentation?.options[selectedOption.id]?.summary ?? selectedOption.summary
              : localizedSlot?.description ?? slot.description}
          </p>
        </div>
        <span className="nutrition-meal-card__macro">{slot.target.calories} kcal</span>
      </div>

      <div className="nutrition-meal-card__media">
        {selectedOptionMedia ? (
          <div className="nutrition-meal-thumb">
            <AthlexMedia resolution={selectedOptionMedia} />
          </div>
        ) : uiState === "next" ? (
          <div className="nutrition-meal-card__thumb-row" aria-hidden="true">
            <div className="nutrition-meal-thumb nutrition-meal-thumb--skeleton" />
            <div className="nutrition-meal-thumb nutrition-meal-thumb--skeleton" />
            <div className="nutrition-meal-thumb nutrition-meal-thumb--skeleton" />
          </div>
        ) : null}

        <div className="nutrition-meal-card__action">
          <button
            className={`button-secondary focus-ring nutrition-meal-card__button ${slot.state === "completed" ? "nutrition-meal-card__button--secondary" : ""}`.trim()}
            disabled={!canChoose && slot.state !== "selected" && slot.state !== "eaten"}
            onClick={handleAction}
            type="button"
          >
            {actionLabel}
          </button>
          {slot.state === "completed" ? null : (
            <span className="caption nutrition-meal-card__macro-summary">{formatMacroDisplay(slot.target)}</span>
          )}
          {!canChoose && slot.state !== "selected" && slot.state !== "eaten" ? (
            <span className="caption nutrition-meal-card__macro-summary">{copy.noSafeOptions}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function NutritionDayContent({ dateKey }: { dateKey: string }) {
  const { t, locale } = useTranslator();
  const copy = nutritionCopyFor(locale);
  const uiCopy = copy as typeof copy & Record<string, string>;
  const presentation = nutritionPresentationFor(locale);
  const { day, managementMode, selectMealOption, markMealEaten, markMealCompleted, addHydration, toggleSupplement } = useNutritionSession();
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);
  const [draftOptionId, setDraftOptionId] = useState<string | null>(null);

  const activeSlot = day.mealSlots.find((slot) => slot.id === openSlotId) ?? null;
  const safeOptions = activeSlot ? getSafeMealOptions(activeSlot, day.safetyProfile) : [];
  const nextMeal = useMemo(() => day.mealSlots.find((slot) => resolveNutritionMealUiState(slot) === "next") ?? day.mealSlots.find((slot) => slot.state !== "completed") ?? null, [day.mealSlots]);
  const completedMeals = useMemo(() => day.mealSlots.filter((slot) => slot.state === "completed").length, [day.mealSlots]);
  const totalMeals = day.mealSlots.length;
  const remainingCalories = Math.max(0, day.target.calories - day.progress.calories);
  const remainingProtein = Math.max(0, day.target.protein - day.progress.protein);
  const remainingCarbs = Math.max(0, day.target.carbs - day.progress.carbs);
  const remainingFat = Math.max(0, day.target.fat - day.progress.fat);
  const hydrationRemaining = Math.max(0, day.hydration.targetMl - day.hydration.currentMl);
  const completeDay = totalMeals > 0 && completedMeals === totalMeals;

  const openChooser = (slot: MealSlot) => {
    const options = getSafeMealOptions(slot, day.safetyProfile);
    if (options.length === 0) {
      return;
    }

    setOpenSlotId(slot.id);
    setDraftOptionId(slot.selectedOptionId ?? options[0]?.id ?? null);
  };

  const closeChooser = () => {
    setOpenSlotId(null);
    setDraftOptionId(null);
  };

  const confirmChoice = () => {
    if (!activeSlot || !draftOptionId) {
      return;
    }

    selectMealOption(activeSlot.id, draftOptionId);
    closeChooser();
  };

  return (
    <Screen
      activeTab="calendar"
      shellClassName="nutrition-shell"
      topbar={
        <header className="topbar nutrition-topbar">
          <Link aria-label={t("common.back")} className="tap-target focus-ring" href={`/day/${dateKey}`}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <div className="nutrition-topbar__copy">
            <h1 className="headline-md nutrition-topbar__title">{t("common.nutrition").toUpperCase()}</h1>
            <p className="caption">{day.calendarLabel}</p>
          </div>
          <span className="nutrition-topbar__spacer" aria-hidden="true" />
        </header>
      }
      >
      <main className="content tight">
        <section className="section">
          <Card className="nutrition-hero-card p-16 elevated">
            <div className="nutrition-hero-card__badge-row">
              <span className="pill">{copy.dayType[day.dayType]}</span>
              <span className="nutrition-hero-card__subtitle">{day.dateLabel}</span>
            </div>
            <div className="nutrition-hero-card__summary">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>
                  {uiCopy.consumed ?? copy.target}
                </div>
                <div className="headline-lg nutrition-hero-card__summary-value">
                  {day.progress.calories.toLocaleString()} / {day.target.calories.toLocaleString()} kcal
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>
                  {uiCopy.remaining ?? copy.target}
                </div>
                <div className="headline-lg nutrition-hero-card__summary-value nutrition-hero-card__summary-value--accent">
                  {remainingCalories.toLocaleString()} kcal
                </div>
              </div>
            </div>
            <div className="nutrition-hero-card__next">
              <div className="eyebrow" style={{ color: "var(--accent-primary)" }}>
                {uiCopy.nextMeal ?? copy.next}
              </div>
              {nextMeal ? (
                <>
                  <div className="body-md" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                    {nextMeal.timeLabel} · {nextMeal.label}
                  </div>
                  <div className="headline-md" style={{ marginTop: 6 }}>
                    {nextMeal.selectedOptionId ? nextMeal.options.find((option) => option.id === nextMeal.selectedOptionId)?.name ?? nextMeal.label : nextMeal.label}
                  </div>
                  <p className="caption" style={{ marginTop: 6 }}>
                    {nextMeal.description}
                  </p>
                </>
              ) : (
                <div className="body-md" style={{ fontWeight: 700 }}>
                  {uiCopy.nutritionComplete ?? copy.completed}
                </div>
              )}
            </div>
            <div className="nutrition-hero-card__macros">
              <div className="nutrition-hero-card__macro">
                <span className="headline-md">{day.progress.protein}</span>
                <span className="eyebrow">{copy.protein}</span>
              </div>
              <div className="nutrition-hero-card__macro nutrition-hero-card__macro--divider">
                <span className="headline-md">{day.progress.carbs}</span>
                <span className="eyebrow">{copy.carbs}</span>
              </div>
              <div className="nutrition-hero-card__macro">
                <span className="headline-md">{day.progress.fat}</span>
                <span className="eyebrow">{copy.fat}</span>
              </div>
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="nutrition-section-label">{copy.dailyProgress}</div>
          <Card className="nutrition-progress-card p-16">
            <MetricBar label={copy.calories} current={day.progress.calories} target={day.target.calories} />
            <div className="nutrition-progress-grid">
              <MetricBar label={copy.protein} current={day.progress.protein} target={day.target.protein} />
              <MetricBar label={copy.carbs} current={day.progress.carbs} target={day.target.carbs} />
              <MetricBar label={copy.fat} current={day.progress.fat} target={day.target.fat} />
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="nutrition-section-label">{copy.today}</div>
          <div className="stack">
            {day.mealSlots.map((slot) => (
              <MealCard
                key={slot.id}
                onMarkCompleted={markMealCompleted}
                onMarkEaten={markMealEaten}
                onOpenChooser={openChooser}
                safetyProfile={day.safetyProfile}
                slot={slot}
              />
            ))}
          </div>
        </section>

        <div className="grid-2 nutrition-support-grid">
          <Card className="nutrition-support-card p-16">
            <div className="nutrition-support-card__label">
              <span className="nutrition-support-card__icon" aria-hidden="true">
                water_drop
              </span>
              {copy.hydration}
            </div>
            <div className="nutrition-support-card__value">
              <span className="headline-md">{(day.hydration.currentMl / 1000).toFixed(1)}</span>
              <span className="caption">/ {(day.hydration.targetMl / 1000).toFixed(1)} L</span>
            </div>
            <div className="nutrition-progress-track nutrition-support-card__track">
              <div
                className="nutrition-progress-fill nutrition-progress-fill--blue"
                style={{ width: `${Math.min(100, Math.round((day.hydration.currentMl / day.hydration.targetMl) * 100))}%` }}
              />
            </div>
            <div className="nutrition-support-card__actions">
              {day.hydration.quickAddMl.map((amountMl) => (
                <button
                  key={amountMl}
                  className="button-secondary focus-ring nutrition-support-card__button"
                  onClick={() => addHydration(amountMl)}
                  type="button"
                >
                  +{amountMl} ml
                </button>
              ))}
            </div>
          </Card>

          <Card className="nutrition-support-card p-16">
              <div className="nutrition-support-card__label">
                <span className="nutrition-support-card__icon nutrition-support-card__icon--purple" aria-hidden="true">
                  medication
              </span>
              {copy.supplements}
            </div>
            <div className="nutrition-supplement-list">
              {day.supplements.map((supplement) => (
                <button
                  key={supplement.id}
                  className="nutrition-supplement-row focus-ring"
                  onClick={() => toggleSupplement(supplement.id)}
                  type="button"
                >
                  <span className={`nutrition-supplement-row__box ${supplement.checked ? "checked" : ""}`}>
                    {supplement.checked ? (
                      <span className="icon filled" aria-hidden="true">
                        check
                      </span>
                    ) : null}
                  </span>
                  <span className={`caption ${supplement.checked ? "nutrition-supplement-row__label--complete" : ""}`.trim()}>
                    {supplement.label}
                  </span>
                  <span className="caption nutrition-supplement-row__dose">{supplement.dosage}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <section className="section">
          <Card className="nutrition-note-card p-16">
            <div className="nutrition-note-card__icon">
              <span className="icon filled" aria-hidden="true">
                record_voice_over
              </span>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6, color: "var(--accent-primary)" }}>
                {copy.coachNote}
              </div>
              <p className="caption nutrition-note-card__copy">{presentation?.coachNote ?? day.coachNote}</p>
            </div>
          </Card>
        </section>
      </main>

      {activeSlot ? (
        <NutritionMealSheet
          currentOptionId={activeSlot?.selectedOptionId ?? null}
          managementMode={managementMode}
          onClose={closeChooser}
          onConfirm={confirmChoice}
          onSelectOption={(optionId) => setDraftOptionId(optionId)}
          options={safeOptions}
          selectedOptionId={draftOptionId}
          slot={activeSlot}
        />
      ) : null}
    </Screen>
  );
}

function NutritionStateScreen({
  dateKey,
  mode
}: {
  dateKey: string;
  mode: Exclude<NutritionScreenMode, "ready">;
}) {
  const { t } = useTranslator();
  const day = getNutritionDay(dateKey);

  return (
    <Screen
      activeTab="calendar"
      shellClassName="nutrition-shell"
      topbar={
        <header className="topbar nutrition-topbar">
          <Link aria-label={t("common.back")} className="tap-target focus-ring" href={`/day/${dateKey}`}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <div className="nutrition-topbar__copy">
            <h1 className="headline-md nutrition-topbar__title">{t("common.nutrition").toUpperCase()}</h1>
            <p className="caption">{day.calendarLabel}</p>
          </div>
          <span className="nutrition-topbar__spacer" aria-hidden="true" />
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <Card className="nutrition-state-card p-16 elevated">
            <div className="nutrition-state-card__eyebrow">{t("common.loading")}</div>
            <h1 className="headline-md" style={{ marginTop: 10 }}>
              {mode === "loading" ? t("common.loading") : mode === "empty" ? t("common.noData") : t("common.error")}
            </h1>
            <p className="caption" style={{ marginTop: 8 }}>
              {mode === "loading"
                ? t("common.loading")
                : mode === "empty"
                  ? t("common.noData")
                  : t("common.retry")}
            </p>
            {mode === "error" ? (
              <div style={{ marginTop: 16 }}>
                <PrimaryButton href={`/day/${dateKey}/nutrition`} className="focus-ring">
                  {t("common.retry")}
                </PrimaryButton>
              </div>
            ) : null}
          </Card>
        </section>
      </main>
    </Screen>
  );
}

export function NutritionScreen({ dateKey, mode }: NutritionScreenProps) {
  if (mode !== "ready") {
    return <NutritionStateScreen dateKey={dateKey} mode={mode} />;
  }

  return (
    <NutritionProvider dateKey={dateKey}>
      <NutritionDayContent dateKey={dateKey} />
    </NutritionProvider>
  );
}
