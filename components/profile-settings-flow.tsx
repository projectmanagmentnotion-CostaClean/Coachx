"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useAuthStore } from "@/components/auth-provider";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { ChoiceButton, PillToggle } from "@/components/onboarding-ui";
import { useOnboardingStore } from "@/components/onboarding-provider";
import { useProfileSettingsStore } from "@/components/profile-settings-provider";
import { useProgramStore } from "@/components/program-provider";
import { useTranslator } from "@/components/locale-provider";
import { type GoalPriority } from "@/lib/onboarding-data";
import { type NotificationCategory, type NotificationSettings, type ProfileSnapshot } from "@/lib/profile-settings-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProfileAvatar, validateProfileAvatarFile } from "@/lib/profile-avatar";
import { LanguageSelector } from "@/components/language-selector";

function ProfileHeader({
  backHref,
  title,
  subtitle,
  brand = false,
  rightAction
}: {
  backHref: string;
  title: string;
  subtitle?: string;
  brand?: boolean;
  rightAction?: ReactNode;
}) {
  return (
    <header className="topbar" style={{ alignItems: "flex-start", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}>
      <Link href={backHref} aria-label="Go back" className="tap-target focus-ring" style={{ flex: "0 0 auto" }}>
        <span className="icon" aria-hidden="true">
          arrow_back
        </span>
      </Link>
      <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
        {brand ? (
          <BrandLogo variant="horizontal" width={154} alt="AthlexForce" style={{ margin: "2px auto 0" }} />
        ) : null}
        <h1
          className="headline-md"
          style={{
            margin: brand ? "2px 0 0" : "0",
            fontSize: brand ? 22 : 30,
            lineHeight: brand ? "28px" : "34px",
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            textWrap: "balance"
          }}
        >
          {title}
        </h1>
        {subtitle ? <p className="caption" style={{ marginTop: 6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>{subtitle}</p> : null}
      </div>
      <div style={{ width: 44, display: "flex", justifyContent: "flex-end" }}>
        {rightAction ?? null}
      </div>
    </header>
  );
}

function EditorShell({
  backHref,
  title,
  subtitle,
  brand = false,
  children,
  rightAction
}: {
  backHref: string;
  title: string;
  subtitle?: string;
  brand?: boolean;
  children: ReactNode;
  rightAction?: ReactNode;
}) {
  return (
    <Screen shellClassName="screen-shell" topbar={<ProfileHeader backHref={backHref} title={title} subtitle={subtitle} brand={brand} rightAction={rightAction} />}>
      <main className="content tight">{children}</main>
    </Screen>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  className = ""
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-16 ${className}`.trim()}>
      <div className="stack" style={{ gap: 12 }}>
        <div>
          <div className="eyebrow">{title}</div>
          {subtitle ? <p className="caption" style={{ marginTop: 6 }}>{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

function profileSettingsCopyFor(locale: string) {
  return (
    {
      en: {
        languageTitle: "Language",
        languageSubtitle: "App-wide language preference",
        languageCopy: "Choose the language used across athlete navigation and settings.",
        profileSaved: "Profile saved",
        notificationsTitle: "Notifications",
        notificationsSubtitle: "Choose what AthlexForce should remind you about.",
        notificationsHeroTitle: "AthlexForce Notifications",
        notificationsHeroSubtitle: "Training, progress and coaching reminders.",
        notificationsPaused: "Delivery is paused. Your reminder preferences stay stored.",
        permission: "Permission",
        reminderIntensity: "Reminder intensity",
        quietHours: "Quiet hours",
        quietHoursEnabled: "Quiet hours enabled",
        categories: "Categories",
        timezonePrefix: "Timezone:",
        notRequested: "Not requested",
        notRequestedDetail: "No browser/iOS permission yet",
        allowed: "Allowed",
        allowedDetail: "Notifications can be delivered",
        denied: "Denied",
        deniedDetail: "Delivery is blocked by the device",
        minimal: "Minimal",
        minimalDetail: "Only the essential prompts",
        recommended: "Recommended",
        recommendedDetail: "Balanced support",
        moreSupport: "More support",
        moreSupportDetail: "Extra guidance without spam"
      },
      es: {
        languageTitle: "Idioma",
        languageSubtitle: "Preferencia de idioma de toda la app",
        languageCopy: "Elige el idioma que se usará en la navegación y los ajustes del atleta.",
        profileSaved: "Perfil guardado",
        notificationsTitle: "Notificaciones",
        notificationsSubtitle: "Elige qué debe recordarte AthlexForce.",
        notificationsHeroTitle: "Notificaciones de AthlexForce",
        notificationsHeroSubtitle: "Recordatorios de entrenamiento, progreso y coaching.",
        notificationsPaused: "La entrega está en pausa. Tus preferencias de recordatorio siguen guardadas.",
        permission: "Permiso",
        reminderIntensity: "Intensidad de recordatorios",
        quietHours: "Horas de silencio",
        quietHoursEnabled: "Horas de silencio activadas",
        categories: "Categorías",
        timezonePrefix: "Zona horaria:",
        notRequested: "No solicitado",
        notRequestedDetail: "Sin permiso del navegador/iOS todavía",
        allowed: "Permitido",
        allowedDetail: "Se pueden entregar notificaciones",
        denied: "Denegado",
        deniedDetail: "El dispositivo bloquea la entrega",
        minimal: "Mínimo",
        minimalDetail: "Solo los avisos esenciales",
        recommended: "Recomendado",
        recommendedDetail: "Apoyo equilibrado",
        moreSupport: "Más apoyo",
        moreSupportDetail: "Guía extra sin saturar"
      },
      ca: {
        languageTitle: "Idioma",
        languageSubtitle: "Preferència d'idioma de tota l'app",
        languageCopy: "Tria l'idioma que s'utilitzarà a la navegació i els ajustos de l'atleta.",
        profileSaved: "Perfil desat",
        notificationsTitle: "Notificacions",
        notificationsSubtitle: "Tria què t'ha de recordar AthlexForce.",
        notificationsHeroTitle: "Notificacions d'AthlexForce",
        notificationsHeroSubtitle: "Recordatoris d'entrenament, progrés i coaching.",
        notificationsPaused: "L'enviament està en pausa. Les teves preferències de recordatori continuen desades.",
        permission: "Permís",
        reminderIntensity: "Intensitat dels recordatoris",
        quietHours: "Hores de silenci",
        quietHoursEnabled: "Hores de silenci activades",
        categories: "Categories",
        timezonePrefix: "Zona horària:",
        notRequested: "No sol·licitat",
        notRequestedDetail: "Encara no hi ha permís del navegador/iOS",
        allowed: "Permès",
        allowedDetail: "Es poden lliurar notificacions",
        denied: "Denegat",
        deniedDetail: "El dispositiu bloqueja l'enviament",
        minimal: "Mínim",
        minimalDetail: "Només els avisos essencials",
        recommended: "Recomanat",
        recommendedDetail: "Suport equilibrat",
        moreSupport: "Més suport",
        moreSupportDetail: "Guia extra sense saturar"
      },
      de: {
        languageTitle: "Sprache",
        languageSubtitle: "App-weite Spracheinstellung",
        languageCopy: "Wähle die Sprache für Navigation und Einstellungen der Athletenansicht.",
        profileSaved: "Profil gespeichert",
        notificationsTitle: "Benachrichtigungen",
        notificationsSubtitle: "Wähle aus, woran dich AthlexForce erinnern soll.",
        notificationsHeroTitle: "AthlexForce-Benachrichtigungen",
        notificationsHeroSubtitle: "Erinnerungen für Training, Fortschritt und Coaching.",
        notificationsPaused: "Die Zustellung ist pausiert. Deine Erinnerungs-Einstellungen bleiben gespeichert.",
        permission: "Berechtigung",
        reminderIntensity: "Erinnerungsintensität",
        quietHours: "Ruhezeiten",
        quietHoursEnabled: "Ruhezeiten aktiviert",
        categories: "Kategorien",
        timezonePrefix: "Zeitzone:",
        notRequested: "Nicht angefragt",
        notRequestedDetail: "Noch keine Browser-/iOS-Berechtigung",
        allowed: "Erlaubt",
        allowedDetail: "Benachrichtigungen können zugestellt werden",
        denied: "Verweigert",
        deniedDetail: "Die Zustellung ist auf dem Gerät blockiert",
        minimal: "Minimal",
        minimalDetail: "Nur die wichtigsten Hinweise",
        recommended: "Empfohlen",
        recommendedDetail: "Ausgewogene Unterstützung",
        moreSupport: "Mehr Unterstützung",
        moreSupportDetail: "Zusätzliche Hinweise ohne Spam"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      languageTitle: "Language",
      languageSubtitle: "App-wide language preference",
      languageCopy: "Choose the language used across athlete navigation and settings.",
      profileSaved: "Profile saved",
      notificationsTitle: "Notifications",
      notificationsSubtitle: "Choose what AthlexForce should remind you about.",
      notificationsHeroTitle: "AthlexForce Notifications",
      notificationsHeroSubtitle: "Training, progress and coaching reminders.",
      notificationsPaused: "Delivery is paused. Your reminder preferences stay stored.",
      permission: "Permission",
      reminderIntensity: "Reminder intensity",
      quietHours: "Quiet hours",
      quietHoursEnabled: "Quiet hours enabled",
      categories: "Categories",
      timezonePrefix: "Timezone:",
      notRequested: "Not requested",
      notRequestedDetail: "No browser/iOS permission yet",
      allowed: "Allowed",
      allowedDetail: "Notifications can be delivered",
      denied: "Denied",
      deniedDetail: "Delivery is blocked by the device",
      minimal: "Minimal",
      minimalDetail: "Only the essential prompts",
      recommended: "Recommended",
      recommendedDetail: "Balanced support",
      moreSupport: "More support",
      moreSupportDetail: "Extra guidance without spam"
    }
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  suffix
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="stack" style={{ gap: 8 }}>
      <div className="eyebrow">{label}</div>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <input
          className="input-field"
          type={type}
          inputMode={inputMode}
          value={String(value)}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <div className="caption" style={{ whiteSpace: "nowrap" }}>{suffix}</div> : null}
      </div>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="stack" style={{ gap: 8 }}>
      <div className="eyebrow">{label}</div>
      <textarea
        className="input-field"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: rows * 28, paddingTop: 12, paddingBottom: 12, resize: "vertical" }}
      />
    </label>
  );
}

function ChoiceGrid({
  items,
  selected,
  onSelect,
  oneColumn = false
}: {
  items: Array<{ id: string; label: string; description?: string }>;
  selected: string;
  onSelect: (value: string) => void;
  oneColumn?: boolean;
}) {
  return (
    <div className={`onboarding-choice-grid ${oneColumn ? "one-column" : ""}`.trim()}>
      {items.map((item) => (
        <ChoiceButton
          key={item.id}
          label={item.label}
          description={item.description}
          selected={selected === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

function TogglePills({
  items,
  selected,
  onToggle
}: {
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <PillToggle key={item.id} label={item.label} selected={selected.includes(item.id)} onClick={() => onToggle(item.id)} />
      ))}
    </div>
  );
}

function SwitchRow({
  title,
  subtitle,
  checked,
  onToggle,
  disabled = false
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      className="card focus-ring"
      onClick={disabled ? undefined : onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 16,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <div className="row" style={{ gap: 16, alignItems: "center" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="body-md" style={{ fontSize: 18, fontWeight: 500 }}>
            {title}
          </div>
          {subtitle ? <p className="caption" style={{ marginTop: 8 }}>{subtitle}</p> : null}
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 60,
            height: 34,
            borderRadius: 9999,
            background: checked ? "var(--accent-primary)" : "#2d2d2d",
            position: "relative",
            flex: "0 0 auto",
            transition: "background 180ms ease"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: checked ? 30 : 4,
              width: 26,
              height: 26,
              borderRadius: 9999,
              background: checked ? "#050505" : "#f7f7f7",
              transition: "left 180ms ease, background 180ms ease"
            }}
          />
        </div>
      </div>
    </button>
  );
}

function UnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="progress-modal" role="presentation">
      <div className="progress-modal__backdrop" onClick={onKeepEditing} aria-hidden="true" />
      <div className="progress-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
        <div className="stack" style={{ gap: 12 }}>
          <div className="eyebrow">Unsaved changes</div>
          <h2 className="headline-md" id="unsaved-title">
            Leave without saving?
          </h2>
          <p className="caption">Changes on this screen will be lost if you leave now.</p>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            <button className="button-primary focus-ring" type="button" onClick={onDiscard}>
              Discard
            </button>
            <button className="button-secondary focus-ring" type="button" onClick={onKeepEditing}>
              Keep editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useUnsavedGuard(isDirty: boolean, backHref: string) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onPopState = () => {
      pendingHrefRef.current = backHref;
      setConfirmOpen(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [backHref, isDirty]);

  const handleBack = () => {
    if (isDirty) {
      pendingHrefRef.current = backHref;
      setConfirmOpen(true);
      return;
    }

    router.push(backHref);
  };

  const discard = () => {
    setConfirmOpen(false);
    const href = pendingHrefRef.current ?? backHref;
    pendingHrefRef.current = null;
    router.push(href);
  };

  return { confirmOpen, handleBack, discard, keepEditing: () => setConfirmOpen(false) };
}

function dirtyFromState(previous: ProfileSnapshot, next: ProfileSnapshot) {
  return JSON.stringify(previous) !== JSON.stringify(next);
}

function useSyncedProfileDraft(saved: ProfileSnapshot) {
  const [draft, setDraft] = useState(saved);
  const lastSavedRef = useRef(saved);

  useEffect(() => {
    if (JSON.stringify(draft) === JSON.stringify(lastSavedRef.current)) {
      setDraft(saved);
    }

    lastSavedRef.current = saved;
  }, [draft, saved]);

  return [draft, setDraft] as const;
}

function saveButtonLabel(saveState: "idle" | "saved" | "error") {
  if (saveState === "error") {
    return "Try again";
  }

  if (saveState === "saved") {
    return "Saved";
  }

  return "Save changes";
}

function EditorFooter({
  dirty,
  saveState,
  onSave,
  onSecondary,
  secondaryLabel = "Back"
}: {
  dirty: boolean;
  saveState: "idle" | "saved" | "error";
  onSave: () => void;
  onSecondary: () => void;
  secondaryLabel?: string;
}) {
  return (
    <div className="stack" style={{ gap: 12, paddingTop: 8 }}>
      <SecondaryButton className="focus-ring" onClick={onSecondary}>
        {secondaryLabel}
      </SecondaryButton>
      <PrimaryButton className="focus-ring" onClick={onSave} disabled={!dirty && saveState === "idle"}>
        {saveButtonLabel(saveState)}
      </PrimaryButton>
    </div>
  );
}

function GoalPriorityRow({
  label,
  index,
  total,
  onMoveUp,
  onMoveDown
}: {
  label: GoalPriority;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="onboarding-reorder-row">
      <div className="onboarding-reorder-index">{index + 1}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="body-md" style={{ fontWeight: 700 }}>
          {label}
        </div>
      </div>
      <button className="tap-target focus-ring" aria-label={`Move ${label} up`} type="button" onClick={onMoveUp} disabled={index === 0}>
        <span className="icon" aria-hidden="true">arrow_upward</span>
      </button>
      <button className="tap-target focus-ring" aria-label={`Move ${label} down`} type="button" onClick={onMoveDown} disabled={index === total - 1}>
        <span className="icon" aria-hidden="true">arrow_downward</span>
      </button>
    </div>
  );
}

export function ProfilePreferencesIndexScreen() {
  const { saved, pendingReview, sectionOrder } = useProfileSettingsStore();
  const { locale } = useTranslator();
  const copy = profileSettingsCopyFor(locale);

  return (
    <Screen
      shellClassName="screen-shell"
      topbar={
        <header className="topbar" style={{ justifyContent: "center" }}>
          <Link href="/profile" aria-label="Go back" className="tap-target focus-ring" style={{ position: "absolute", left: 16 }}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <h1 className="headline-md" style={{ margin: 0, fontSize: 32, lineHeight: "34px", letterSpacing: "-0.04em", textTransform: "uppercase", textAlign: "center", maxWidth: 240 }}>
            Profile & Preferences
          </h1>
        </header>
      }
    >
      <main className="content tight">
        <section className="section stack">
          {sectionOrder.map((section) => (
            <Link key={section.id} href={section.route} className="focus-ring">
              <Card className="p-16" style={{ borderRadius: 20 }}>
                <div className="row" style={{ alignItems: "center", gap: 16 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="body-md" style={{ fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                      {section.label}
                    </div>
                    <p className="body-md" style={{ marginTop: 10, color: "var(--text-muted)" }}>
                      {section.summary}
                    </p>
                  </div>
                  <span className="icon" aria-hidden="true" style={{ color: "var(--text-muted)" }}>
                    chevron_right
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        <section className="section">
          <Card className="p-16" style={{ borderRadius: 20, background: "var(--surface-elevated)" }}>
            <div className="row" style={{ alignItems: "center", gap: 12 }}>
              <span className="icon" aria-hidden="true" style={{ color: "var(--accent-primary)" }}>
                check_circle
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="caption" style={{ marginBottom: 4 }}>
                  {pendingReview ? "Program update pending" : "No pending program updates"}
                </div>
                <div className="body-md" style={{ fontWeight: 700 }}>
                  {pendingReview ? pendingReview.title : `${saved.profile.name} · ${copy.profileSaved}`}
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </Screen>
  );
}

export function ProfilePersonalInfoScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const [lastReview, setLastReview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const save = () => {
    const review = commitProfileSnapshot(draft);
    setLastReview(review.summary);
    router.push("/profile/program-impact-review");
  };

  const handleAvatarSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setAvatarError(null);

    if (!file) {
      return;
    }

    const validationError = validateProfileAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveAvatar = async () => {
    if (!pendingAvatarFile) {
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client || !saved.profile) {
      setAvatarError("Avatar upload is unavailable right now.");
      return;
    }

    setSavingAvatar(true);
    setAvatarError(null);

    try {
      if (!auth.user?.id) {
        setAvatarError("Avatar upload is unavailable right now.");
        return;
      }

      const result = await uploadProfileAvatar(client, auth.user?.id ?? "", pendingAvatarFile);
      const nextDraft = {
        ...draft,
        profile: {
          ...draft.profile,
          avatarPath: result.storagePath
        }
      };
      setDraft(nextDraft);
      commitProfileSnapshot(nextDraft);
      setPendingAvatarFile(null);
      setAvatarPreview(null);
      setLastReview("Profile photo updated.");
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Avatar upload failed.");
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <EditorShell backHref="/profile/preferences" title="Profile" subtitle="Question 1 of 4" brand>
      <section className="section">
        <Card className="p-16 profile-photo-card" style={{ borderRadius: 20 }}>
          <div className="profile-photo-card__layout">
            <div className="profile-photo-card__preview">
              {avatarPreview?.startsWith("blob:") ? (
                <div className="remote-avatar profile-avatar profile-avatar--large" style={{ width: 88, height: 88 }}>
                  <img className="remote-avatar__img" src={avatarPreview} alt={`${draft.profile.name} preview`} width={88} height={88} />
                </div>
              ) : (
                <RemoteAvatar name={draft.profile.name} avatarPath={draft.profile.avatarPath ?? null} size={88} className="profile-avatar profile-avatar--large" />
              )}
            </div>
            <div className="profile-photo-card__content">
                <div className="eyebrow">Profile photo</div>
                <div className="caption" style={{ marginTop: 6 }}>
                  JPG, PNG, or WebP. Stored remotely in a private bucket.
                </div>
                <div className="profile-photo-card__actions">
                  <button className="button-secondary focus-ring profile-utility-button" type="button" onClick={() => fileInputRef.current?.click()}>
                    Choose photo
                  </button>
                  {pendingAvatarFile ? (
                    <button className="button-primary focus-ring profile-utility-button" type="button" onClick={saveAvatar} disabled={savingAvatar}>
                      {savingAvatar ? "Saving..." : "Save"}
                    </button>
                  ) : null}
                  {draft.profile.avatarPath ? (
                    <button
                      className="button-secondary focus-ring profile-utility-button profile-utility-button--secondary"
                      type="button"
                      onClick={() => {
                        if (avatarPreview?.startsWith("blob:")) {
                          URL.revokeObjectURL(avatarPreview);
                        }
                        setPendingAvatarFile(null);
                        setAvatarPreview(null);
                        const nextDraft = { ...draft, profile: { ...draft.profile, avatarPath: null } };
                        setDraft(nextDraft);
                        commitProfileSnapshot(nextDraft);
                        setLastReview("Profile photo removed.");
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {avatarError ? (
                  <p className="caption" style={{ marginTop: 10, color: "#ff8f8f" }}>
                    {avatarError}
                  </p>
                ) : null}
            </div>
          </div>
          <input ref={fileInputRef} accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarSelection} type="file" />
        </Card>
      </section>

      <section className="section">
        <Card className="p-16 profile-personal-card" style={{ borderRadius: 20 }}>
          <div className="profile-personal-fields">
            <TextField label="Name" value={draft.profile.name} onChange={(value) => setDraft((current) => ({ ...current, profile: { ...current.profile, name: value } }))} />
            <div className="profile-personal-metrics">
              <TextField label="Age" type="number" inputMode="numeric" value={draft.profile.age} onChange={(value) => setDraft((current) => ({ ...current, profile: { ...current.profile, age: Number(value || 0) } }))} />
              <div>
                <TextField label="Height" type="number" inputMode="decimal" suffix="cm" value={draft.profile.heightCm} onChange={(value) => setDraft((current) => ({ ...current, profile: { ...current.profile, heightCm: Number(value || 0) } }))} />
              </div>
              <div>
                <TextField label="Weight" type="number" inputMode="decimal" suffix="kg" value={draft.profile.weightKg} onChange={(value) => setDraft((current) => ({ ...current, profile: { ...current.profile, weightKg: Number(value || 0) } }))} />
              </div>
            </div>
            <ChoiceGrid
              oneColumn
              selected={draft.profile.unitSystem}
              onSelect={(value) => setDraft((current) => ({ ...current, profile: { ...current.profile, unitSystem: value as "metric" | "imperial" } }))}
              items={[
                { id: "metric", label: "Metric", description: "Centimeters and kilograms" },
                { id: "imperial", label: "Imperial", description: "Feet, inches, and pounds" }
              ]}
            />
          </div>
        </Card>
      </section>

      {lastReview ? (
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">Saved review</div>
            <p className="body-md" style={{ marginTop: 8 }}>{lastReview}</p>
          </Card>
        </section>
      ) : null}

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

export function ProfileLanguageScreen() {
  const { saved, commitLocale } = useProfileSettingsStore();
  const { locale } = useTranslator();
  const copy = profileSettingsCopyFor(locale);

  return (
    <EditorShell backHref="/profile/preferences" title={copy.languageTitle} subtitle={copy.languageSubtitle}>
      <section className="section">
        <Card className="p-16 language-settings-card" style={{ borderRadius: 20 }}>
          <p className="caption language-settings-card__copy">{copy.languageCopy}</p>
          <LanguageSelector value={saved.profile.locale} onChange={commitLocale} compact />
        </Card>
      </section>
    </EditorShell>
  );
}

export function ProfileGoalsScreen() {
  const router = useRouter();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  const save = () => {
    commitProfileSnapshot(draft);
    router.push("/profile/program-impact-review");
  };

  const togglePriority = (fromIndex: number, toIndex: number) => {
    setDraft((current) => {
      const next = [...current.goals.priorities];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return { ...current, goals: { ...current.goals, priorities: next as GoalPriority[] } };
    });
  };

  return (
    <EditorShell backHref="/profile/preferences" title={t("onboarding.goalsTitle")} subtitle={t("onboarding.goalsCaption")} brand>
      <section className="section stack">
        <ChoiceGrid
          oneColumn
          selected={draft.goals.mainGoal}
          onSelect={(value) => setDraft((current) => ({ ...current, goals: { ...current.goals, mainGoal: value } }))}
          items={[
            { id: "Body Recomposition", label: "Body Recomposition", description: "Build muscle while tightening up shape" },
            { id: "Build Muscle", label: "Build Muscle", description: "Increase size and strength" },
            { id: "Strength", label: "Strength", description: "Prioritize load progression" },
            { id: "Performance", label: "Performance", description: "Keep conditioning and energy high" }
          ]}
        />

        <Card className="p-16">
          <div className="eyebrow">Priorities</div>
          <p className="caption" style={{ marginTop: 6 }}>Reorder the muscle emphasis. Changes stay immediate in the draft.</p>
          <div className="stack" style={{ marginTop: 12 }}>
            {draft.goals.priorities.map((priority, index) => (
              <GoalPriorityRow
                key={priority}
                label={priority}
                index={index}
                total={draft.goals.priorities.length}
                onMoveUp={() => togglePriority(index, Math.max(0, index - 1))}
                onMoveDown={() => togglePriority(index, Math.min(draft.goals.priorities.length - 1, index + 1))}
              />
            ))}
          </div>
        </Card>
      </section>

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

export function ProfileTrainingPreferencesScreen() {
  const router = useRouter();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  const toggleDay = (day: string) => {
    setDraft((current) => ({
      ...current,
      trainingPreferences: {
        ...current.trainingPreferences,
        preferredDays: current.trainingPreferences.preferredDays.includes(day)
          ? current.trainingPreferences.preferredDays.filter((item) => item !== day)
          : [...current.trainingPreferences.preferredDays, day]
      }
    }));
  };

  const toggleEquipment = (item: string) => {
    setDraft((current) => ({
      ...current,
      trainingPreferences: {
        ...current.trainingPreferences,
        equipment: current.trainingPreferences.equipment.includes(item)
          ? current.trainingPreferences.equipment.filter((entry) => entry !== item)
          : [...current.trainingPreferences.equipment, item]
      }
    }));
  };

  const save = () => {
    commitProfileSnapshot(draft);
    router.push("/profile/program-impact-review");
  };

  return (
    <EditorShell backHref="/profile/preferences" title={t("onboarding.trainingPreferencesTitle")} subtitle={t("onboarding.trainingPreferencesSubtitle")} brand>
      <section className="section stack">
        <SectionCard title="Training days">
          <TextField
            label="Days / week"
            type="number"
            inputMode="numeric"
            value={draft.trainingPreferences.daysPerWeek}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                trainingPreferences: { ...current.trainingPreferences, daysPerWeek: Math.max(1, Math.min(7, Number(value || 0))) }
              }))
            }
          />
          <div className="caption" style={{ marginTop: 8 }}>
            {draft.trainingPreferences.preferredDays.join(", ")}
          </div>
        </SectionCard>

        <SectionCard title="Session duration">
          <TextField label="Duration" value={draft.trainingPreferences.duration} onChange={(value) => setDraft((current) => ({ ...current, trainingPreferences: { ...current.trainingPreferences, duration: value } }))} />
        </SectionCard>

        <SectionCard title="Training location">
          <ChoiceGrid
            oneColumn
            selected={draft.trainingPreferences.location}
            onSelect={(value) => setDraft((current) => ({ ...current, trainingPreferences: { ...current.trainingPreferences, location: value } }))}
            items={[
              { id: "Full gym", label: "Full gym", description: "Commercial gym access" },
              { id: "Home", label: "Home", description: "Minimal equipment" },
              { id: "Hybrid", label: "Hybrid", description: "Mix of gym and home" }
            ]}
          />
        </SectionCard>

        <SectionCard title="Equipment">
          <TogglePills
            items={[
              { id: "Barbell", label: "Barbell" },
              { id: "Dumbbells", label: "Dumbbells" },
              { id: "Cable", label: "Cable" },
              { id: "Machine", label: "Machine" }
            ]}
            selected={draft.trainingPreferences.equipment}
            onToggle={toggleEquipment}
          />
        </SectionCard>

        <SectionCard title="Style and guidance">
          <TextField label="Style" value={draft.trainingPreferences.style} onChange={(value) => setDraft((current) => ({ ...current, trainingPreferences: { ...current.trainingPreferences, style: value } }))} />
          <TextField label="Cardio preference" value={draft.trainingPreferences.cardioPreference} onChange={(value) => setDraft((current) => ({ ...current, trainingPreferences: { ...current.trainingPreferences, cardioPreference: value } }))} />
          <TextField label="Guidance preference" value={draft.trainingPreferences.guidancePreference} onChange={(value) => setDraft((current) => ({ ...current, trainingPreferences: { ...current.trainingPreferences, guidancePreference: value } }))} />
        </SectionCard>

        <SectionCard title="Preferred days">
          <TogglePills
            items={[
              { id: "Mon", label: "Mon" },
              { id: "Tue", label: "Tue" },
              { id: "Wed", label: "Wed" },
              { id: "Thu", label: "Thu" },
              { id: "Fri", label: "Fri" },
              { id: "Sat", label: "Sat" },
              { id: "Sun", label: "Sun" }
            ]}
            selected={draft.trainingPreferences.preferredDays}
            onToggle={toggleDay}
          />
        </SectionCard>
      </section>

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

export function ProfileScheduleLifestyleScreen() {
  const router = useRouter();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  const save = () => {
    commitProfileSnapshot(draft);
    router.push("/profile/program-impact-review");
  };

  return (
    <EditorShell backHref="/profile/preferences" title={t("onboarding.scheduleTitle")} subtitle={t("onboarding.scheduleSubtitle")} brand>
      <section className="section stack">
        <SectionCard title="Work and energy">
          <TextAreaField label="Work schedule" value={draft.scheduleLifestyle.workSchedule} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, workSchedule: value } }))} />
          <TextField label="Activity level" value={draft.scheduleLifestyle.activityLevel} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, activityLevel: value } }))} />
          <TextField label="Available training time" value={draft.scheduleLifestyle.availableTrainingTime} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, availableTrainingTime: value } }))} />
        </SectionCard>

        <SectionCard title="Recovery rhythm">
          <TextField label="Wake time" value={draft.scheduleLifestyle.wakeTime} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, wakeTime: value } }))} />
          <TextField label="Bed time" value={draft.scheduleLifestyle.bedTime} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, bedTime: value } }))} />
          <TextField label="Sleep quality" value={draft.scheduleLifestyle.sleepQuality} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, sleepQuality: value } }))} />
          <TextField label="Stress" value={draft.scheduleLifestyle.stress} onChange={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, stress: value } }))} />
        </SectionCard>

        <SectionCard title="Notifications">
          <ChoiceGrid
            oneColumn
            selected={draft.scheduleLifestyle.reminderPreference}
            onSelect={(value) => setDraft((current) => ({ ...current, scheduleLifestyle: { ...current.scheduleLifestyle, reminderPreference: value as "push" | "email" | "both" | "none" } }))}
            items={[
              { id: "push", label: "Push", description: "AthlexForce mobile reminders" },
              { id: "email", label: "Email", description: "Simple inbox reminders" },
              { id: "both", label: "Both", description: "Push and email" },
              { id: "none", label: "None", description: "Pause reminders" }
            ]}
          />
        </SectionCard>
      </section>

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

export function ProfileNutritionPreferencesScreen() {
  const router = useRouter();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  const toggleList = (field: keyof ProfileSnapshot["nutritionPreferences"], value: string) => {
    setDraft((current) => {
      const nextList = current.nutritionPreferences[field] as string[];
      const updated = nextList.includes(value) ? nextList.filter((item) => item !== value) : [...nextList, value];
      return {
        ...current,
        nutritionPreferences: {
          ...current.nutritionPreferences,
          [field]: updated
        } as ProfileSnapshot["nutritionPreferences"]
      };
    });
  };

  const save = () => {
    commitProfileSnapshot(draft);
    router.push("/profile/program-impact-review");
  };

  return (
    <EditorShell backHref="/profile/preferences" title={t("onboarding.nutritionTitle")} subtitle={t("onboarding.nutritionSubtitle")} brand>
      <section className="section stack">
        <SectionCard title="Routine">
          <TextField label="Meal frequency" value={draft.nutritionPreferences.mealFrequency} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, mealFrequency: value } }))} />
          <TextField label="Meal times" value={draft.nutritionPreferences.mealTimes} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, mealTimes: value } }))} />
          <TextField label="Breakfast preference" value={draft.nutritionPreferences.breakfastPreference} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, breakfastPreference: value } }))} />
          <TextField label="Pre-workout eating" value={draft.nutritionPreferences.preWorkoutEating} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, preWorkoutEating: value } }))} />
        </SectionCard>

        <SectionCard title="Safety first">
          <TextField label="Allergies" value={draft.nutritionPreferences.allergies.join(", ")} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, allergies: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
          <TextField label="Intolerances" value={draft.nutritionPreferences.intolerances.join(", ")} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, intolerances: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
          <TextField label="Restrictions" value={draft.nutritionPreferences.restrictions.join(", ")} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, restrictions: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
        </SectionCard>

        <SectionCard title="Preference profile">
          <TextField label="Budget" value={draft.nutritionPreferences.budget} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, budget: value } }))} />
          <TextField label="Meal prep" value={draft.nutritionPreferences.mealPrep} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, mealPrep: value } }))} />
          <TextField label="Flexibility" value={draft.nutritionPreferences.flexibility} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, flexibility: value } }))} />
          <TextField label="Variety" value={draft.nutritionPreferences.variety} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, variety: value } }))} />
          <TextField label="Support preference" value={draft.nutritionPreferences.supportPreference} onChange={(value) => setDraft((current) => ({ ...current, nutritionPreferences: { ...current.nutritionPreferences, supportPreference: value } }))} />
        </SectionCard>
      </section>

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

export function ProfileHealthLimitationsScreen() {
  const router = useRouter();
  const { saved, commitProfileSnapshot, saveState } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [draft, setDraft] = useSyncedProfileDraft(saved);
  const guard = useUnsavedGuard(dirtyFromState(saved, draft), "/profile/preferences");

  const save = () => {
    commitProfileSnapshot(draft);
    router.push("/profile/program-impact-review");
  };

  const toggleLimit = (field: "movementLimitations" | "romLimitations", value: string) => {
    setDraft((current) => {
      const currentList = current.healthLimitations[field];
      const updated = currentList.includes(value) ? currentList.filter((item) => item !== value) : [...currentList, value];
      return {
        ...current,
        healthLimitations: {
          ...current.healthLimitations,
          [field]: updated
        }
      };
    });
  };

  return (
    <EditorShell backHref="/profile/preferences" title={t("onboarding.healthTitle")} subtitle={t("onboarding.healthSubtitle")} brand>
      <section className="section stack">
        <SwitchRow
          title="Active pain"
          subtitle={draft.healthLimitations.currentPain || "None"}
          checked={draft.healthLimitations.currentPain.trim().length > 0 && draft.healthLimitations.currentPain.toLowerCase() !== "none"}
          onToggle={() =>
            setDraft((current) => ({
              ...current,
              healthLimitations: {
                ...current.healthLimitations,
                currentPain: current.healthLimitations.currentPain.trim().length > 0 ? "None" : "Knee pain during deep flexion"
              }
            }))
          }
        />

        <Card className="p-16">
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="eyebrow">Movement limitations</div>
              <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                {draft.healthLimitations.movementLimitations.length} active
              </div>
              <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {draft.healthLimitations.movementLimitations.map((item) => (
                  <span key={item} className="pill" style={{ minHeight: 28 }}>{item}</span>
                ))}
              </div>
            </div>
            <span className="icon" aria-hidden="true">
              chevron_right
            </span>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {["Lumbar", "Knee", "Hip", "Shoulder"].map((item) => (
              <PillToggle key={item} label={item} selected={draft.healthLimitations.movementLimitations.includes(item)} onClick={() => toggleLimit("movementLimitations", item)} />
            ))}
          </div>
        </Card>

        <SectionCard title="Injury history">
          <TextAreaField label="Injury history" value={draft.healthLimitations.injuryHistory} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, injuryHistory: value } }))} />
          <TextAreaField label="ROM limitations" value={draft.healthLimitations.romLimitations.join(", ")} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, romLimitations: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
          <TextAreaField label="Warning symptoms" value={draft.healthLimitations.warningSymptoms} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, warningSymptoms: value } }))} />
        </SectionCard>

        <SectionCard title="Context">
          <TextAreaField label="Surgery history" value={draft.healthLimitations.surgeryHistory} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, surgeryHistory: value } }))} />
          <TextAreaField label="Medication context" value={draft.healthLimitations.medicationContext} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, medicationContext: value } }))} />
          <TextAreaField label="Digestion" value={draft.healthLimitations.digestion} onChange={(value) => setDraft((current) => ({ ...current, healthLimitations: { ...current.healthLimitations, digestion: value } }))} />
        </SectionCard>
      </section>

      <section className="section">
        <EditorFooter dirty={dirtyFromState(saved, draft)} saveState={saveState} onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}

function NotificationRow({
  category,
  onToggle,
  disabled
}: {
  category: NotificationCategory;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={category.enabled}
      className="card focus-ring"
      onClick={disabled ? undefined : onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 16,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <div className="row" style={{ alignItems: "center", gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="body-md" style={{ fontWeight: 700 }}>
            {category.label}
          </div>
          <p className="caption" style={{ marginTop: 8 }}>{category.description}</p>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 60,
            height: 34,
            borderRadius: 9999,
            background: category.enabled ? "var(--accent-primary)" : "#2d2d2d",
            position: "relative",
            flex: "0 0 auto"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: category.enabled ? 30 : 4,
              width: 26,
              height: 26,
              borderRadius: 9999,
              background: category.enabled ? "#050505" : "#f7f7f7"
            }}
          />
        </div>
      </div>
    </button>
  );
}

export function ProfileNotificationsScreen() {
  const router = useRouter();
  const { notifications, commitNotifications } = useProfileSettingsStore();
  const { locale } = useTranslator();
  const copy = profileSettingsCopyFor(locale);
  const startLabel = locale === "es" ? "Inicio" : locale === "ca" ? "Inici" : locale === "de" ? "Start" : "Start";
  const endLabel = locale === "es" ? "Fin" : locale === "ca" ? "Fi" : locale === "de" ? "Ende" : "End";
  const adaptiveAlertsTitle = locale === "es" ? "Alertas adaptativas" : locale === "ca" ? "Alertes adaptatives" : locale === "de" ? "Adaptive Hinweise" : "Adaptive alerts";
  const adaptiveAlertsCopy =
    locale === "es"
      ? "Calendario, entrenamiento y recordatorios de check-in se coordinan con el estado del atleta."
      : locale === "ca"
        ? "Calendari, entrenament i recordatoris de check-in es coordinen amb l'estat de l'atleta."
        : locale === "de"
          ? "Kalender-, Workout- und Check-in-Erinnerungen bleiben mit dem Athletenstatus abgestimmt."
          : "Calendar, workout, and check-in reminders stay coordinated with the athlete state.";
  const adaptiveAlertsDetail =
    locale === "es"
      ? "Las preferencias de recordatorio se guardan de forma remota y se pueden restaurar despues de cambiar el interruptor principal."
      : locale === "ca"
        ? "Les preferencies de recordatori es guarden remotament i es poden restaurar despres de canviar l'interruptor principal."
        : locale === "de"
          ? "Die Erinnerungs-Einstellungen werden remote gespeichert und koennen nach dem Umschalten wiederhergestellt werden."
          : "Reminder preferences are stored remotely and can be restored after toggling the master switch.";
  const [draft, setDraft] = useState<NotificationSettings>(notifications);
  const dirty = JSON.stringify(notifications) !== JSON.stringify(draft);
  const guard = useUnsavedGuard(dirty, "/profile");

  const save = () => {
    commitNotifications(draft);
    router.push("/profile");
  };

  return (
    <EditorShell backHref="/profile" title={copy.notificationsTitle} subtitle={copy.notificationsSubtitle} brand={false}>
      <section className="section stack">
        <Card className="p-16" style={{ background: "var(--surface-elevated)" }}>
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="headline-md" style={{ fontSize: 28 }}>{copy.notificationsHeroTitle}</div>
              <p className="caption" style={{ marginTop: 10 }}>
                {copy.notificationsHeroSubtitle}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.masterEnabled}
              className="focus-ring"
              onClick={() => setDraft((current) => ({ ...current, masterEnabled: !current.masterEnabled }))}
              style={{
                width: 70,
                height: 42,
                borderRadius: 9999,
                background: draft.masterEnabled ? "var(--accent-primary)" : "#2d2d2d",
                position: "relative"
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 5,
                  left: draft.masterEnabled ? 36 : 5,
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  background: draft.masterEnabled ? "#050505" : "#f7f7f7"
                }}
              />
            </button>
          </div>
          {!draft.masterEnabled ? (
            <p className="caption" style={{ marginTop: 12 }}>
              {copy.notificationsPaused}
            </p>
          ) : null}
        </Card>

        <SectionCard title={copy.permission}>
          <ChoiceGrid
            oneColumn
            selected={draft.permission}
            onSelect={(value) => setDraft((current) => ({ ...current, permission: value as NotificationSettings["permission"] }))}
            items={[
              { id: "not-requested", label: copy.notRequested, description: copy.notRequestedDetail },
              { id: "allowed", label: copy.allowed, description: copy.allowedDetail },
              { id: "denied", label: copy.denied, description: copy.deniedDetail }
            ]}
          />
        </SectionCard>

        <SectionCard title={copy.reminderIntensity}>
          <ChoiceGrid
            oneColumn
            selected={draft.intensity}
            onSelect={(value) => setDraft((current) => ({ ...current, intensity: value as NotificationSettings["intensity"] }))}
            items={[
              { id: "minimal", label: copy.minimal, description: copy.minimalDetail },
              { id: "recommended", label: copy.recommended, description: copy.recommendedDetail },
              { id: "more-support", label: copy.moreSupport, description: copy.moreSupportDetail }
            ]}
          />
        </SectionCard>

        <SectionCard title={copy.quietHours}>
          <div className="stack" style={{ gap: 12 }}>
            <SwitchRow
              title={copy.quietHoursEnabled}
              subtitle={`${draft.quietHours.start} - ${draft.quietHours.end}`}
              checked={draft.quietHours.enabled}
              onToggle={() => setDraft((current) => ({ ...current, quietHours: { ...current.quietHours, enabled: !current.quietHours.enabled } }))}
            />
            <div className="row" style={{ gap: 12 }}>
              <div style={{ flex: 1 }}>
                <TextField label={startLabel} value={draft.quietHours.start} onChange={(value) => setDraft((current) => ({ ...current, quietHours: { ...current.quietHours, start: value } }))} />
              </div>
              <div style={{ flex: 1 }}>
                <TextField label={endLabel} value={draft.quietHours.end} onChange={(value) => setDraft((current) => ({ ...current, quietHours: { ...current.quietHours, end: value } }))} />
              </div>
            </div>
            <div className="caption">
              {copy.timezonePrefix} {draft.quietHours.timezone}
            </div>
          </div>
        </SectionCard>

        <div className="stack" style={{ gap: 12 }}>
          <div className="eyebrow">{copy.categories}</div>
          {draft.categories.map((category) => (
            <NotificationRow
              key={category.id}
              category={category}
              onToggle={() =>
                setDraft((current) => ({
                  ...current,
                  categories: current.categories.map((item) => (item.id === category.id ? { ...item, enabled: !item.enabled } : item))
                }))
              }
              disabled={!draft.masterEnabled}
            />
          ))}
        </div>

        <SectionCard title={adaptiveAlertsTitle}>
          <div className="body-md" style={{ fontWeight: 700 }}>
            {adaptiveAlertsCopy}
          </div>
          <p className="caption" style={{ marginTop: 8 }}>
            {adaptiveAlertsDetail}
          </p>
        </SectionCard>
      </section>

      <section className="section">
        <EditorFooter dirty={dirty} saveState="idle" onSave={save} onSecondary={guard.handleBack} />
      </section>

      <UnsavedChangesDialog open={guard.confirmOpen} onDiscard={guard.discard} onKeepEditing={guard.keepEditing} />
    </EditorShell>
  );
}
export function ProfileImpactReviewScreen() {
  const router = useRouter();
  const { pendingReview, saved, applyPendingReview, clearPendingReview } = useProfileSettingsStore();
  const program = useProgramStore().program ?? useOnboardingStore().program;
  const review = pendingReview ?? {
    classification: "NO_IMPACT" as const,
    title: "No program change required.",
    summary: "The profile is saved and the active program can stay as-is.",
    whatChanged: [],
    currentProgram: [program.phaseLabel, program.goal, program.duration],
    potentialImpact: ["No meaningful difference from the saved profile."],
    recommendedAction: "No further update is needed."
  };

  const canApply = review.classification === "PROGRAM_ADJUSTMENT_RECOMMENDED" || review.classification === "MINOR_REVIEW";

  return (
    <Screen
      shellClassName="screen-shell"
      topbar={
        <header className="topbar" style={{ justifyContent: "space-between" }}>
          <BrandLogo variant="horizontal" width={132} alt="AthlexForce" />
          <button aria-label="Close" className="tap-target focus-ring" type="button" onClick={() => router.push("/profile/preferences")}>
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
        </header>
      }
    >
      <main className="content tight">
        <section className="section" style={{ textAlign: "center" }}>
          <div className="card p-16" style={{ borderRadius: 20, minHeight: 160, display: "grid", placeItems: "center" }}>
            <div className="stack" style={{ gap: 12, width: "100%" }}>
              <div style={{ width: 96, height: 96, margin: "0 auto", borderRadius: 9999, background: "rgba(182,255,0,0.1)", display: "grid", placeItems: "center" }}>
                <span className="icon" style={{ color: "var(--accent-primary)", fontSize: 40 }} aria-hidden="true">
                  analytics
                </span>
              </div>
              <h1 className="headline-md" style={{ textTransform: "uppercase", margin: 0 }}>
                {review.title}
              </h1>
              <p className="body-md" style={{ color: "var(--text-muted)", margin: 0 }}>
                {review.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">What changed</div>
            <div className="stack" style={{ gap: 10, marginTop: 12 }}>
              {review.whatChanged.length > 0 ? (
                review.whatChanged.map((change) => (
                  <div key={`${change.field}-${change.before}`} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 104 }}>
                      <div className="eyebrow" style={{ marginBottom: 4 }}>{change.field}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div className="body-md" style={{ fontWeight: 700 }}>{change.before}</div>
                      <div className="caption" style={{ marginTop: 4 }}>â†’ {change.after}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="caption">No field changes detected.</p>
              )}
            </div>
          </Card>
        </section>

        <section className="section stack">
          <SectionCard title="Current program">
            {review.currentProgram.map((line) => (
              <div key={line} className="body-md" style={{ fontWeight: 700 }}>
                {line}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Potential impact">{review.potentialImpact[0]}</SectionCard>
          <SectionCard title="Recommended action">{review.recommendedAction}</SectionCard>
        </section>

        <section className="section">
          <div className="stack" style={{ gap: 12 }}>
            {canApply ? (
              <PrimaryButton
                className="focus-ring"
                onClick={() => {
                  applyPendingReview();
                  router.push("/profile");
                }}
              >
                Apply program update
              </PrimaryButton>
            ) : (
              <PrimaryButton className="focus-ring" onClick={() => router.push("/profile")}>Done</PrimaryButton>
            )}
            <SecondaryButton
              className="focus-ring"
              onClick={() => {
                clearPendingReview();
                router.push("/profile");
              }}
            >
              {review.classification === "NO_IMPACT" ? "Back" : "Save profile only"}
            </SecondaryButton>
          </div>
        </section>
      </main>
    </Screen>
  );
}
