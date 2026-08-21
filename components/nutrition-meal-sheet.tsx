"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AthlexMedia } from "@/components/athlex-media";
import { useTranslator } from "@/components/locale-provider";
import type { MealOption, MealSlot } from "@/lib/nutrition-data";
import { resolveMealHeroMedia } from "@/lib/media";
import { buildConfirmationSheetTimeline } from "@/motion/feedback";
import { useReducedMotion } from "@/motion/useReducedMotion";

interface NutritionMealSheetProps {
  slot: MealSlot;
  options: MealOption[];
  currentOptionId: string | null;
  selectedOptionId: string | null;
  managementMode: "self_managed" | "coach_managed";
  onSelectOption: (optionId: string) => void;
  onConfirm: () => void;
  onRequestAlternative?: () => void;
  onClose: () => void;
}

function copyFor(locale: string) {
  return (
    {
      en: {
        mealLabels: { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" },
        chooseOption: "Choose option",
        mealDetail: "Meal detail",
        close: "Close meal chooser",
        cancel: "Cancel",
        confirm: "Confirm selection",
        replaceMeal: "Replace meal",
        requestAlternative: "Request alternative",
        coachManagedUnavailable: "Coach-managed replacement is handled outside this flow.",
        current: "Current",
        new: "New",
        ingredients: "Ingredients",
        preparation: "Preparation",
        noSafeOptions: "No safe options available",
        target: "target"
      },
      es: {
        mealLabels: { breakfast: "Desayuno", lunch: "Comida", snack: "Merienda", dinner: "Cena" },
        chooseOption: "Elegir opción",
        mealDetail: "Detalle del plato",
        close: "Cerrar selector",
        cancel: "Cancelar",
        confirm: "Confirmar selección",
        replaceMeal: "Reemplazar comida",
        requestAlternative: "Solicitar alternativa",
        coachManagedUnavailable: "El reemplazo gestionado por el coach se gestiona fuera de este flujo.",
        current: "Actual",
        new: "Nuevo",
        ingredients: "Ingredientes",
        preparation: "Preparación",
        noSafeOptions: "No hay opciones seguras",
        target: "objetivo"
      },
      ca: {
        mealLabels: { breakfast: "Esmorzar", lunch: "Dinar", snack: "Berenar", dinner: "Sopar" },
        chooseOption: "Tria opció",
        mealDetail: "Detall del plat",
        close: "Tanca el selector",
        cancel: "Cancel·la",
        confirm: "Confirma la selecció",
        replaceMeal: "Substitueix l'àpat",
        requestAlternative: "Demana una alternativa",
        coachManagedUnavailable: "La substitució gestionada pel coach es gestiona fora d'aquest flux.",
        current: "Actual",
        new: "Nou",
        ingredients: "Ingredients",
        preparation: "Preparació",
        noSafeOptions: "No hi ha opcions segures",
        target: "objectiu"
      },
      de: {
        mealLabels: { breakfast: "Frühstück", lunch: "Mittagessen", snack: "Snack", dinner: "Abendessen" },
        chooseOption: "Option wählen",
        mealDetail: "Details zur Mahlzeit",
        close: "Auswahl schließen",
        cancel: "Abbrechen",
        confirm: "Auswahl bestätigen",
        replaceMeal: "Mahlzeit ersetzen",
        requestAlternative: "Alternative anfragen",
        coachManagedUnavailable: "Die durch den Coach verwaltete Ersetzung erfolgt außerhalb dieses Ablaufs.",
        current: "Aktuell",
        new: "Neu",
        ingredients: "Zutaten",
        preparation: "Zubereitung",
        noSafeOptions: "Keine sicheren Optionen verfügbar",
        target: "Ziel"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      mealLabels: { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" },
      chooseOption: "Choose option",
      mealDetail: "Meal detail",
      close: "Close meal chooser",
      cancel: "Cancel",
      confirm: "Confirm selection",
      replaceMeal: "Replace meal",
      requestAlternative: "Request alternative",
      coachManagedUnavailable: "Coach-managed replacement is handled outside this flow.",
      current: "Current",
      new: "New",
      ingredients: "Ingredients",
      preparation: "Preparation",
      noSafeOptions: "No safe options available",
      target: "target"
    }
  );
}

type NutritionSheetPresentationCopy = {
  mealLabels: { breakfast: string; lunch: string; snack: string; dinner: string };
  options: Record<string, { name: string; summary: string }>;
};

function nutritionSheetPresentationFor(locale: string): NutritionSheetPresentationCopy | null {
  if (locale !== "es") {
    return null;
  }

  return {
    mealLabels: { breakfast: "Desayuno", lunch: "Comida", snack: "Merienda", dinner: "Cena" },
    options: {
      "eggs-avocado-toast": { name: "Tostada de huevos y aguacate", summary: "Desayuno saciante con energía estable." },
      "greek-yogurt-parfait": { name: "Parfait de yogur griego", summary: "Opción más ligera con proteína y fruta." },
      "overnight-oats-whey": { name: "Avena nocturna + whey", summary: "Desayuno portátil con un reparto de macros fiable." },
      "chicken-rice-bowl": { name: "Bol de pollo con arroz", summary: "Proteína magra, arroz jazmín y verduras verdes." },
      "lean-beef-potato": { name: "Ternera magra + patata", summary: "Combustible de entrenamiento con recalentado fácil." },
      "turkey-wrap": { name: "Wrap de pavo", summary: "Comida portátil con macros equilibrados." },
      "chicken-pasta": { name: "Pasta con pollo", summary: "Opción más alta en carbohidratos para la ventana principal de entrenamiento." },
      "greek-yogurt-whey": { name: "Yogur griego + whey", summary: "Proteína rápida y poco tiempo de preparación." },
      "cottage-cheese-berries": { name: "Requesón con bayas", summary: "Merienda cremosa con saciedad estable." },
      "protein-shake-banana": { name: "Batido de proteína + plátano", summary: "La opción con menos fricción cuando te mueves entre sesiones." },
      "chicken-sweet-potato": { name: "Pollo + boniato", summary: "Cena equilibrada que replica la copia exportada actual." },
      "salmon-rice": { name: "Salmón + arroz", summary: "Opción de recuperación con más grasa y porcionado sencillo." },
      "turkey-chili": { name: "Chili de pavo", summary: "Cena batch-friendly con final caliente." },
      "protein-oats": { name: "Avena proteica", summary: "Avena caliente con un final alto en proteína." },
      "egg-white-wrap": { name: "Wrap de claras", summary: "Desayuno magro para un día más ligero." },
      "yogurt-granola-rest": { name: "Yogur + granola", summary: "Opción sencilla con proteína suficiente para la recuperación." },
      "turkey-potato-rest": { name: "Pavo + patata", summary: "Plato de recuperación sencillo con ingredientes familiares." },
      "salmon-salad-rest": { name: "Ensalada de salmón", summary: "Comida alta en proteína con menos carga de carbohidratos." },
      "chicken-bowl-rest": { name: "Bol de pollo", summary: "Bol práctico para la estructura del día de descanso." },
      "cottage-cheese-rest": { name: "Requesón con bayas", summary: "Merienda alta en proteína y de preparación rápida." },
      "yogurt-pumpkin-rest": { name: "Yogur + semillas de calabaza", summary: "Merienda fácil con un perfil de carbohidratos más ligero." },
      "protein-shake-rest": { name: "Batido de proteína", summary: "Opción rápida cuando el día va cargado." },
      "cod-rice-rest": { name: "Bacalao + arroz", summary: "Cena ligera que mantiene la proteína alta." },
      "turkey-pasta-rest": { name: "Pasta con pavo", summary: "Cena cómoda para una noche de menor intensidad." },
      "salmon-veg-rest": { name: "Salmón + verduras", summary: "Cena con más grasa y preparación simple." }
    }
  };
}

export function NutritionMealSheet({
  slot,
  options,
  currentOptionId,
  selectedOptionId,
  managementMode,
  onSelectOption,
  onConfirm,
  onRequestAlternative,
  onClose
}: NutritionMealSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { locale } = useTranslator();
  const copy = copyFor(locale);
  const extendedCopy = copy as typeof copy & Record<string, string>;
  const presentation = nutritionSheetPresentationFor(locale);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;

    if (!sheet || reducedMotion) {
      return;
    }

    const context = buildConfirmationSheetTimeline({ root: sheet, reducedMotion }, "[data-feedback-sheet]");

    return () => context.revert();
  }, [portalRoot, reducedMotion, slot.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? null;
  const currentOption = options.find((option) => option.id === currentOptionId) ?? options[0] ?? null;
  const slotLabel = presentation?.mealLabels[slot.id as keyof typeof presentation.mealLabels] ?? copy.mealLabels[slot.id as keyof typeof copy.mealLabels] ?? slot.label;
  const currentMedia = currentOption
    ? resolveMealHeroMedia({
        mealKey: currentOption.id,
        mealName: currentOption.name,
        macroHint: `${currentOption.macro.calories} kcal · ${currentOption.macro.protein}P / ${currentOption.macro.carbs}C / ${currentOption.macro.fat}F`,
        prepTimeHint: currentOption.prepTime
      })
    : null;

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    <div className="nutrition-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={sheetRef}
        aria-labelledby="nutrition-meal-sheet-title"
        aria-modal="true"
        className="nutrition-sheet card elevated"
        data-feedback-sheet="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nutrition-sheet__grabber" aria-hidden="true" />
        <div className="nutrition-sheet__header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{extendedCopy.mealDetail ?? copy.chooseOption}</div>
            <h3 className="headline-md" id="nutrition-meal-sheet-title">
              {slotLabel}
            </h3>
            <p className="caption" style={{ marginTop: 6 }}>
              {slot.target.calories} kcal {copy.target} · {slot.target.protein}P / {slot.target.carbs}C / {slot.target.fat}F
            </p>
          </div>
          <button aria-label={copy.close} className="tap-target focus-ring nutrition-sheet__close" onClick={onClose} type="button">
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="nutrition-sheet__detail">
          <div className="nutrition-sheet__media">
            {currentMedia ? <AthlexMedia resolution={currentMedia} /> : null}
          </div>

          {currentOption ? (
            <div className="nutrition-sheet__detail-copy">
              <div className="row start">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>
                    {copy.current}
                  </div>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {presentation?.options[currentOption.id]?.name ?? currentOption.name}
                  </div>
                </div>
                <span className="pill nutrition-option-card__pill" style={{ minHeight: 24 }}>
                  {currentOption.prepTime}
                </span>
              </div>
              <p className="caption" style={{ marginTop: 8 }}>
                {presentation?.options[currentOption.id]?.summary ?? currentOption.summary}
              </p>
              <div className="nutrition-sheet__macro-row">
                <span>{currentOption.macro.calories} kcal</span>
                <span>{currentOption.macro.protein}P</span>
                <span>{currentOption.macro.carbs}C</span>
                <span>{currentOption.macro.fat}F</span>
              </div>
              <div className="eyebrow" style={{ marginTop: 14, marginBottom: 6 }}>
                {copy.ingredients}
              </div>
              <div className="nutrition-food-list">
                {currentOption.portions.map((portion) => (
                  <div key={`${currentOption.id}-${portion.name}`} className="nutrition-food-row">
                    <span>{portion.name}</span>
                    <span>
                      {portion.amount}
                      {portion.note ? ` · ${portion.note}` : ""}
                      {" "}
                      <span className="nutrition-food-row__state">({portion.preparation})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="nutrition-sheet__body">
          {options.map((option) => {
            const isSelected = option.id === selectedOptionId;

            return (
              <button
                key={option.id}
                className={`nutrition-option-card focus-ring ${isSelected ? "selected" : ""}`.trim()}
                onClick={() => onSelectOption(option.id)}
                type="button"
              >
                <div className="nutrition-option-card__top">
                  <div>
                    <div className="body-md" style={{ fontWeight: 700 }}>
                      {presentation?.options[option.id]?.name ?? option.name}
                    </div>
                    <div className="caption" style={{ marginTop: 4 }}>
                      {presentation?.options[option.id]?.summary ?? option.summary}
                    </div>
                  </div>
                  <div className="nutrition-option-card__label-stack">
                    <span className="pill nutrition-option-card__pill" style={{ minHeight: 24 }}>
                      {option.prepTime}
                    </span>
                    <span className={`caption nutrition-option-card__choice ${isSelected ? "selected" : ""}`.trim()}>
                      {isSelected ? copy.new : copy.current}
                    </span>
                  </div>
                </div>

                <div className="nutrition-option-card__macro">
                  {option.macro.calories} kcal · {option.macro.protein}P / {option.macro.carbs}C / {option.macro.fat}F
                </div>

                <div className="nutrition-food-list">
                  {option.portions.map((portion) => (
                    <div key={`${option.id}-${portion.name}`} className="nutrition-food-row">
                      <span>{portion.name}</span>
                      <span>
                        {portion.amount}
                        {portion.note ? ` · ${portion.note}` : ""}
                        {" "}
                        <span className="nutrition-food-row__state">({portion.preparation})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {selectedOption ? (
          <div className="nutrition-sheet__preview">
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {copy.new}
            </div>
            <div className="nutrition-sheet__comparison">
              <div>
                <div className="caption">{copy.current}</div>
                <div className="body-md" style={{ fontWeight: 700, marginTop: 4 }}>
                  {presentation?.options[currentOption?.id ?? ""]?.name ?? currentOption?.name ?? slot.label}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>
                  {currentOption ? `${currentOption.macro.calories} kcal · ${currentOption.macro.protein}P / ${currentOption.macro.carbs}C / ${currentOption.macro.fat}F` : "—"}
                </div>
              </div>
              <div>
                <div className="caption">{copy.new}</div>
                <div className="body-md" style={{ fontWeight: 700, marginTop: 4 }}>
                  {presentation?.options[selectedOption.id]?.name ?? selectedOption.name}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>
                  {`${selectedOption.macro.calories} kcal · ${selectedOption.macro.protein}P / ${selectedOption.macro.carbs}C / ${selectedOption.macro.fat}F`}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="nutrition-sheet__footer">
          <button className="button-secondary focus-ring nutrition-sheet__secondary" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          {managementMode === "coach_managed" ? (
            onRequestAlternative ? (
              <button className="button-primary focus-ring nutrition-sheet__primary" onClick={onRequestAlternative} type="button">
                {extendedCopy.requestAlternative ?? copy.confirm}
              </button>
            ) : (
              <div className="nutrition-sheet__coach-note caption" style={{ alignSelf: "center", color: "var(--text-muted)" }}>
                {extendedCopy.coachManagedUnavailable ?? copy.confirm}
              </div>
            )
          ) : (
            <button className="button-primary focus-ring nutrition-sheet__primary" disabled={!selectedOption} onClick={onConfirm} type="button">
              {extendedCopy.replaceMeal ?? copy.confirm}
            </button>
          )}
        </div>
      </div>
    </div>,
    portalRoot
  );
}
