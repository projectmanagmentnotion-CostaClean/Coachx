export type SupportedLocale = "en" | "es" | "ca" | "de";

export type NumericParseReason = "required" | "invalid" | "zero" | "range";

export interface NumericParseResult {
  valid: boolean;
  value?: number;
  reason?: NumericParseReason;
}

export interface NumericParseOptions {
  min?: number;
  max?: number;
  allowBlank?: boolean;
  allowZero?: boolean;
  integer?: boolean;
}

export const RIR_VALUES = [0, 1, 2, 3, 4, 5] as const;
export const RPE_VALUES = [6, 7, 8, 9, 10] as const;

const NUMERIC_COPY: Record<SupportedLocale, { enterValidNumber: string; readOnly: string; saved: string; saving: string; tryAgain: string }> = {
  en: { enterValidNumber: "ENTER A VALID NUMBER", readOnly: "READ ONLY", saved: "SAVED", saving: "SAVING...", tryAgain: "TRY AGAIN" },
  es: { enterValidNumber: "INTRODUCE UN NÚMERO VÁLIDO", readOnly: "SOLO LECTURA", saved: "GUARDADO", saving: "GUARDANDO...", tryAgain: "INTÉNTALO DE NUEVO" },
  ca: { enterValidNumber: "INTRODUEIX UN NÚMERO VÀLID", readOnly: "NOMÉS LECTURA", saved: "DESAT", saving: "DESANT...", tryAgain: "TORNA-HO A PROVAR" },
  de: { enterValidNumber: "GIB EINE GÜLTIGE ZAHL EIN", readOnly: "NUR LESEN", saved: "GESPEICHERT", saving: "WIRD GESPEICHERT...", tryAgain: "ERNEUT VERSUCHEN" }
};

const RIR_COPY: Record<SupportedLocale, Record<(typeof RIR_VALUES)[number], { label: string; description: string }>> = {
  en: {
    0: { label: "0", description: "MAX EFFORT" },
    1: { label: "1", description: "VERY HARD" },
    2: { label: "2", description: "HARD" },
    3: { label: "3", description: "CONTROLLED" },
    4: { label: "4", description: "EASY" },
    5: { label: "5+", description: "VERY EASY" }
  },
  es: {
    0: { label: "0", description: "MÁXIMO ESFUERZO" },
    1: { label: "1", description: "MUY DURO" },
    2: { label: "2", description: "DURO" },
    3: { label: "3", description: "CONTROLADO" },
    4: { label: "4", description: "FÁCIL" },
    5: { label: "5+", description: "MUY FÁCIL" }
  },
  ca: {
    0: { label: "0", description: "MÀXIM ESFORÇ" },
    1: { label: "1", description: "MOLT DUR" },
    2: { label: "2", description: "DUR" },
    3: { label: "3", description: "CONTROLAT" },
    4: { label: "4", description: "FÀCIL" },
    5: { label: "5+", description: "MOLT FÀCIL" }
  },
  de: {
    0: { label: "0", description: "MAXIMAL" },
    1: { label: "1", description: "SEHR SCHWER" },
    2: { label: "2", description: "SCHWER" },
    3: { label: "3", description: "KONTROLLIERT" },
    4: { label: "4", description: "LEICHT" },
    5: { label: "5+", description: "SEHR LEICHT" }
  }
};

const RPE_COPY: Record<SupportedLocale, Record<(typeof RPE_VALUES)[number], string>> = {
  en: { 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" },
  es: { 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" },
  ca: { 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" },
  de: { 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" }
};

function clamp(value: number, min?: number, max?: number) {
  if (typeof min === "number" && value < min) {
    return min;
  }

  if (typeof max === "number" && value > max) {
    return max;
  }

  return value;
}

function roundToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeNumericInput(value: string) {
  return value.trim().replaceAll(/\s+/g, "").replaceAll(",", ".");
}

export function parseNumericInput(value: string, options: NumericParseOptions = {}): NumericParseResult {
  const normalized = normalizeNumericInput(value);

  if (!normalized) {
    return options.allowBlank ? { valid: true, value: undefined } : { valid: false, reason: "required" };
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return { valid: false, reason: "invalid" };
  }

  if (!options.allowZero && parsed <= 0) {
    return { valid: false, reason: "zero" };
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return { valid: false, reason: "invalid" };
  }

  const clamped = clamp(parsed, options.min, options.max);
  if (clamped !== parsed) {
    return { valid: false, reason: "range" };
  }

  return { valid: true, value: roundToDecimals(parsed, options.integer ? 0 : 1) };
}

export function formatNumericInput(value: number | null, decimals = 1) {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : roundToDecimals(value, decimals).toFixed(decimals).replace(/\.0+$/, "").replace(/\.([1-9]*)0+$/, ".$1");
}

export function getNumericCopy(locale: SupportedLocale) {
  return NUMERIC_COPY[locale] ?? NUMERIC_COPY.en;
}

export function getNumericValidationMessage(locale: SupportedLocale, reason: NumericParseReason, range?: { min?: number; max?: number }) {
  const copy = getNumericCopy(locale);

  switch (reason) {
    case "required":
      return copy.enterValidNumber;
    case "invalid":
      return copy.enterValidNumber;
    case "zero":
      return copy.enterValidNumber;
    case "range":
      if (typeof range?.min === "number" && typeof range?.max === "number") {
        return locale === "es"
          ? `Mantén este valor entre ${range.min} y ${range.max}.`
          : locale === "ca"
            ? `Mantén aquest valor entre ${range.min} i ${range.max}.`
            : locale === "de"
              ? `Bleib zwischen ${range.min} und ${range.max}.`
              : `Keep this between ${range.min} and ${range.max}.`;
      }

      return copy.enterValidNumber;
    default:
      return copy.enterValidNumber;
  }
}

export function stepNumericInput(
  value: string,
  delta: number,
  options: { decimals?: number; fallback?: number; min?: number; max?: number } = {}
) {
  const decimals = options.decimals ?? 1;
  const parsed = parseNumericInput(value, { allowBlank: true, allowZero: true });
  const base = parsed.valid && typeof parsed.value === "number" ? parsed.value : options.fallback ?? 0;
  const nextValue = clamp(roundToDecimals(base + delta, decimals), options.min, options.max);
  return formatNumericInput(nextValue, decimals);
}

export function getRirOptionCopy(locale: SupportedLocale, value: (typeof RIR_VALUES)[number]) {
  return RIR_COPY[locale]?.[value] ?? RIR_COPY.en[value];
}

export function getRpeLabel(locale: SupportedLocale, value: (typeof RPE_VALUES)[number]) {
  return RPE_COPY[locale]?.[value] ?? RPE_COPY.en[value];
}

