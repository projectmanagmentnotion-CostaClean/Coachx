import type { Locale } from "@/lib/i18n";

export type FeedbackKind = "success" | "info" | "warning" | "error" | "pending";
export type FeedbackPlacement = "inline" | "toast" | "hero" | "dialog";
export type FeedbackIntensity = 0 | 1 | 2 | 3 | 4;
export type FeedbackLevel = "L1" | "L2" | "L3" | "L4";

export type FeedbackActionId =
  | "auth.sign-in"
  | "auth.sign-up"
  | "auth.sign-out"
  | "auth.session-expired"
  | "onboarding.save"
  | "onboarding.complete"
  | "workout.set"
  | "workout.swap"
  | "workout.finish"
  | "nutrition.meal"
  | "nutrition.water"
  | "nutrition.supplement"
  | "progress.measurement"
  | "progress.photo"
  | "progress.photo-remove"
  | "checkin.answer"
  | "checkin.submit"
  | "checkin.review"
  | "ai.recommendation"
  | "program-change.recommendation"
  | "program-change.proposal"
  | "program-change.apply"
  | "program-change.reject"
  | "profile.save"
  | "profile.locale"
  | "profile.notifications"
  | "coach.review"
  | "coach.decision";

export interface FeedbackNotice {
  id: string;
  actionId: FeedbackActionId;
  kind: FeedbackKind;
  placement: FeedbackPlacement;
  intensity: FeedbackIntensity;
  title: string;
  detail?: string | null;
  undoLabel?: string | null;
  timestamp: string;
  dedupeKey: string;
  reversible: boolean;
  needsConfirmation: boolean;
  ariaLive: "polite" | "assertive";
}

export interface FeedbackIntent {
  actionId: FeedbackActionId;
  title?: string;
  detail?: string | null;
  kind?: FeedbackKind;
  placement?: FeedbackPlacement;
  intensity?: FeedbackIntensity;
  reversible?: boolean;
  needsConfirmation?: boolean;
  undoLabel?: string | null;
}

export interface FeedbackMemoryState {
  recent: FeedbackNotice[];
  lastByAction: Partial<Record<FeedbackActionId, FeedbackNotice>>;
}

type FeedbackCopy = {
  actionLabels: Record<FeedbackActionId, Record<Locale, string>>;
  titles: Record<FeedbackKind, Record<Locale, string>>;
  details: Record<string, Record<Locale, string>>;
  undo: Record<Locale, string>;
  recovery: Record<Locale, string>;
};

const feedbackCopy: FeedbackCopy = {
  actionLabels: {
    "auth.sign-in": { es: "Inicio de sesión", ca: "Inici de sessió", en: "Sign in", de: "Anmeldung" },
    "auth.sign-up": { es: "Registro", ca: "Registre", en: "Sign up", de: "Registrierung" },
    "auth.sign-out": { es: "Salida", ca: "Sortida", en: "Sign out", de: "Abmeldung" },
    "auth.session-expired": { es: "Sesión", ca: "Sessió", en: "Session", de: "Sitzung" },
    "onboarding.save": { es: "Onboarding", ca: "Onboarding", en: "Onboarding", de: "Onboarding" },
    "onboarding.complete": { es: "Onboarding", ca: "Onboarding", en: "Onboarding", de: "Onboarding" },
    "workout.set": { es: "Serie", ca: "Sèrie", en: "Set", de: "Satz" },
    "workout.swap": { es: "Cambio de ejercicio", ca: "Canvi d'exercici", en: "Exercise swap", de: "Übungswechsel" },
    "workout.finish": { es: "Entrenamiento", ca: "Entrenament", en: "Workout", de: "Training" },
    "nutrition.meal": { es: "Comida", ca: "Àpat", en: "Meal", de: "Mahlzeit" },
    "nutrition.water": { es: "Agua", ca: "Aigua", en: "Water", de: "Wasser" },
    "nutrition.supplement": { es: "Suplemento", ca: "Suplement", en: "Supplement", de: "Supplement" },
    "progress.measurement": { es: "Medición", ca: "Mesura", en: "Measurement", de: "Messung" },
    "progress.photo": { es: "Foto de progreso", ca: "Foto de progrés", en: "Progress photo", de: "Fortschrittsfoto" },
    "progress.photo-remove": { es: "Foto de progreso", ca: "Foto de progrés", en: "Progress photo", de: "Fortschrittsfoto" },
    "checkin.answer": { es: "Respuesta", ca: "Resposta", en: "Answer", de: "Antwort" },
    "checkin.submit": { es: "Check-in", ca: "Check-in", en: "Check-in", de: "Check-in" },
    "checkin.review": { es: "Revisión", ca: "Revisió", en: "Review", de: "Review" },
    "ai.recommendation": { es: "Recomendación", ca: "Recomanació", en: "Recommendation", de: "Empfehlung" },
    "program-change.recommendation": { es: "Revisión del cambio", ca: "Revisió del canvi", en: "Change review", de: "Änderungsprüfung" },
    "program-change.proposal": { es: "Propuesta", ca: "Proposta", en: "Proposal", de: "Vorschlag" },
    "program-change.apply": { es: "Cambio de programa", ca: "Canvi de programa", en: "Program change", de: "Programmänderung" },
    "program-change.reject": { es: "Revisión", ca: "Revisió", en: "Review", de: "Review" },
    "profile.save": { es: "Perfil", ca: "Perfil", en: "Profile", de: "Profil" },
    "profile.locale": { es: "Idioma", ca: "Idioma", en: "Language", de: "Sprache" },
    "profile.notifications": { es: "Notificaciones", ca: "Notificacions", en: "Notifications", de: "Benachrichtigungen" },
    "coach.review": { es: "Revisión de coach", ca: "Revisió del coach", en: "Coach review", de: "Coach-Prüfung" },
    "coach.decision": { es: "Decisión del coach", ca: "Decisió del coach", en: "Coach decision", de: "Coach-Entscheidung" }
  },
  titles: {
    success: { es: "Correcto", ca: "Correcte", en: "Done", de: "Erledigt" },
    info: { es: "Listo", ca: "A punt", en: "Ready", de: "Bereit" },
    warning: { es: "Atención", ca: "Atenció", en: "Attention", de: "Achtung" },
    error: { es: "No se pudo", ca: "No s'ha pogut", en: "Couldn’t finish", de: "Nicht möglich" },
    pending: { es: "Procesando", ca: "Processant", en: "Processing", de: "Wird verarbeitet" }
  },
  details: {
    success: { es: "La acción quedó guardada.", ca: "L'acció s'ha desat.", en: "The action is saved.", de: "Die Aktion wurde gespeichert." },
    pending: { es: "Estamos guardando tu cambio.", ca: "Estem desant el canvi.", en: "Your change is being saved.", de: "Deine Änderung wird gespeichert." },
    warning: { es: "Revisa este cambio antes de continuar.", ca: "Revisa aquest canvi abans de continuar.", en: "Review this change before continuing.", de: "Prüfe diese Änderung, bevor du fortfährst." },
    error: { es: "La acción no cambió tu información previa.", ca: "L'acció no ha canviat la informació anterior.", en: "Nothing previous changed.", de: "Frühere Daten wurden nicht geändert." },
    partial: { es: "Solo parte del cambio se guardó.", ca: "Només una part del canvi s'ha desat.", en: "Only part of the change was saved.", de: "Nur ein Teil der Änderung wurde gespeichert." }
  },
  undo: {
    es: "Deshacer",
    ca: "Desfés",
    en: "Undo",
    de: "Rückgängig"
  },
  recovery: {
    es: "Inténtalo otra vez.",
    ca: "Torna-ho a provar.",
    en: "Try again.",
    de: "Erneut versuchen."
  }
};

const feedbackActionDefaults: Record<FeedbackActionId, Pick<FeedbackNotice, "kind" | "placement" | "intensity" | "reversible" | "needsConfirmation">> = {
  "auth.sign-in": { kind: "success", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "auth.sign-up": { kind: "success", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "auth.sign-out": { kind: "info", placement: "toast", intensity: 1, reversible: false, needsConfirmation: false },
  "auth.session-expired": { kind: "warning", placement: "dialog", intensity: 4, reversible: false, needsConfirmation: true },
  "onboarding.save": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "onboarding.complete": { kind: "success", placement: "hero", intensity: 4, reversible: false, needsConfirmation: false },
  "workout.set": { kind: "success", placement: "inline", intensity: 1, reversible: true, needsConfirmation: false },
  "workout.swap": { kind: "warning", placement: "inline", intensity: 2, reversible: true, needsConfirmation: true },
  "workout.finish": { kind: "success", placement: "hero", intensity: 4, reversible: false, needsConfirmation: true },
  "nutrition.meal": { kind: "success", placement: "inline", intensity: 1, reversible: true, needsConfirmation: false },
  "nutrition.water": { kind: "info", placement: "inline", intensity: 1, reversible: true, needsConfirmation: false },
  "nutrition.supplement": { kind: "info", placement: "inline", intensity: 1, reversible: true, needsConfirmation: false },
  "progress.measurement": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "progress.photo": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "progress.photo-remove": { kind: "warning", placement: "dialog", intensity: 4, reversible: false, needsConfirmation: true },
  "checkin.answer": { kind: "success", placement: "inline", intensity: 1, reversible: true, needsConfirmation: false },
  "checkin.submit": { kind: "success", placement: "hero", intensity: 4, reversible: false, needsConfirmation: true },
  "checkin.review": { kind: "info", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "ai.recommendation": { kind: "info", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "program-change.recommendation": { kind: "info", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "program-change.proposal": { kind: "info", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "program-change.apply": { kind: "success", placement: "hero", intensity: 4, reversible: false, needsConfirmation: true },
  "program-change.reject": { kind: "warning", placement: "toast", intensity: 2, reversible: false, needsConfirmation: true },
  "profile.save": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "profile.locale": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "profile.notifications": { kind: "success", placement: "inline", intensity: 2, reversible: true, needsConfirmation: false },
  "coach.review": { kind: "info", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false },
  "coach.decision": { kind: "success", placement: "toast", intensity: 2, reversible: false, needsConfirmation: false }
};

export function resolveFeedbackLevel(placement: FeedbackPlacement, intensity: FeedbackIntensity): FeedbackLevel {
  if (placement === "hero" || placement === "dialog" || intensity >= 4) {
    return "L4";
  }

  if (placement === "toast" || intensity === 3) {
    return "L3";
  }

  if (placement === "inline" || intensity === 2) {
    return "L2";
  }

  return "L1";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocaleValue(locale: Locale, dictionary: Record<Locale, string>) {
  return dictionary[locale] ?? dictionary.en;
}

function buildActionLabel(locale: Locale, actionId: FeedbackActionId) {
  return getLocaleValue(locale, feedbackCopy.actionLabels[actionId]);
}

function buildStateTitle(locale: Locale, kind: FeedbackKind) {
  return getLocaleValue(locale, feedbackCopy.titles[kind]);
}

function buildStateDetail(locale: Locale, kind: FeedbackKind) {
  const detailKey = kind === "info" ? "success" : kind;
  return getLocaleValue(locale, feedbackCopy.details[detailKey] ?? feedbackCopy.details.success);
}

export function buildFeedbackNotice(locale: Locale, intent: FeedbackIntent): FeedbackNotice {
  const defaults = feedbackActionDefaults[intent.actionId];
  const actionLabel = buildActionLabel(locale, intent.actionId);
  const kind = intent.kind ?? defaults.kind;
  const title = intent.title || `${actionLabel} ${buildStateTitle(locale, kind).toLowerCase()}`;
  const detail = intent.detail ?? buildStateDetail(locale, kind);

  return {
    id: createId(),
    actionId: intent.actionId,
    kind,
    placement: intent.placement ?? defaults.placement,
    intensity: intent.intensity ?? defaults.intensity,
    title,
    detail,
    undoLabel: intent.undoLabel ?? (defaults.reversible ? feedbackCopy.undo[locale] : null),
    timestamp: new Date().toISOString(),
    dedupeKey: `${intent.actionId}:${kind}:${intent.title}:${intent.detail ?? ""}`,
    reversible: intent.reversible ?? defaults.reversible,
    needsConfirmation: intent.needsConfirmation ?? defaults.needsConfirmation,
    ariaLive: kind === "error" || kind === "warning" ? "assertive" : "polite"
  };
}

export function buildFeedbackStatus(locale: Locale, actionId: FeedbackActionId, kind: FeedbackKind, detail?: string | null) {
  return buildFeedbackNotice(locale, {
    actionId,
    kind,
    detail: detail ?? buildStateDetail(locale, kind)
  });
}

export function buildFeedbackError(locale: Locale, actionId: FeedbackActionId, detail?: string | null) {
  return buildFeedbackNotice(locale, {
    actionId,
    kind: "error",
    detail: detail ?? `${buildStateDetail(locale, "error")} ${feedbackCopy.recovery[locale]}`,
    needsConfirmation: false
  });
}

export function serializeFeedbackMemory(state: FeedbackMemoryState) {
  return JSON.stringify({
    recent: state.recent.slice(0, 20),
    lastByAction: Object.fromEntries(Object.entries(state.lastByAction))
  });
}

export function reviveFeedbackMemory(rawValue: string | null) {
  if (!rawValue) {
    return { recent: [], lastByAction: {} } satisfies FeedbackMemoryState;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<FeedbackMemoryState>;
    const recent = Array.isArray(parsed.recent) ? parsed.recent.slice(0, 20) : [];
    const lastByAction = parsed.lastByAction && typeof parsed.lastByAction === "object" ? parsed.lastByAction : {};

    return {
      recent,
      lastByAction
    } satisfies FeedbackMemoryState;
  } catch {
    return { recent: [], lastByAction: {} } satisfies FeedbackMemoryState;
  }
}

export function createInitialFeedbackMemory(): FeedbackMemoryState {
  return { recent: [], lastByAction: {} };
}

export function clearFeedbackMemoryForAction(state: FeedbackMemoryState, actionId: FeedbackActionId): FeedbackMemoryState {
  const recent = state.recent.filter((notice) => notice.actionId !== actionId);
  const lastByAction = { ...state.lastByAction };
  delete lastByAction[actionId];

  return {
    recent,
    lastByAction
  };
}

export function feedbackMemoryStorageKey() {
  return "athlexforce-feedback-memory-v1";
}

export function getFeedbackActionLabel(locale: Locale, actionId: FeedbackActionId) {
  return buildActionLabel(locale, actionId);
}

export function getFeedbackActionDefaults(actionId: FeedbackActionId) {
  return feedbackActionDefaults[actionId];
}
