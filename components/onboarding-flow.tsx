"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type HTMLAttributes, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleMark } from "@/components/google-mark";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { OnboardingStickyActions, OnboardingStepHeader, ChoiceButton, PillToggle } from "@/components/onboarding-ui";
import { useOnboardingStore } from "@/components/onboarding-provider";
import { useAuthStore } from "@/components/auth-provider";
import { type OnboardingStepId, type BaselinePose } from "@/lib/onboarding-data";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale, useTranslator } from "@/components/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { acceptCoachInvitation, loadMyCoachRelationship, type CoachRelationshipSummary } from "@/lib/coach/coach-relationship-service";
import { readIdentityIntent, writeIdentityIntent, writeWorkspacePreference, type IdentityIntent } from "@/lib/auth/session-policy";
import type { CoachProfilesRow } from "@/lib/supabase/database.types";

function FlowShell({
  step,
  title,
  subtitle,
  backHref,
  children,
  rightLabel,
  rightHref
}: {
  step: OnboardingStepId;
  title: string;
  subtitle: string;
  backHref: string;
  children: ReactNode;
  rightLabel?: string;
  rightHref?: string;
}) {
  const { locale } = useLocale();
  const { t } = useTranslator();
  const { startStep } = useOnboardingStore();
  const sectionWord = locale === "es" ? "SECCIÓN" : locale === "ca" ? "SECCIÓ" : locale === "de" ? "ABSCHNITT" : "SECTION";
  const ofWord = locale === "de" ? "VON" : locale === "es" || locale === "ca" ? "DE" : "OF";
  const index = step === "entry" ? 1 : [
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
  ].indexOf(step) + 1;
  const total = 13;

  useEffect(() => {
    startStep(step);
  }, [startStep, step]);

  return (
    <Screen
      shellClassName="onboarding-shell"
      topbar={
        <OnboardingStepHeader
          title={title}
          subtitle={subtitle}
          stepLabel={step === "entry" ? t("auth.entryAthleteHeading").toUpperCase() : `${step.replace(/-/g, " ").toUpperCase()} · ${sectionWord} ${index} ${ofWord} ${total}`}
          backHref={backHref}
          rightLabel={rightLabel}
          rightHref={rightHref}
        />
      }
    >
      <main className="content tight">{children}</main>
    </Screen>
  );
}

function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      <h1 className="headline-lg">{title}</h1>
      {caption ? <p className="caption">{caption}</p> : null}
    </div>
  );
}

function MetricField({
  label,
  value,
  suffix,
  onChange,
  type = "text",
  inputMode
}: {
  label: string;
  value: string | number;
  suffix?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="onboarding-review-card" style={{ padding: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="workout-input"
          type={type}
          inputMode={inputMode}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <div className="caption" style={{ whiteSpace: "nowrap" }}>{suffix}</div> : null}
      </div>
    </label>
  );
}

function ToggleGroup({
  items,
  selected,
  onSelect,
  oneColumn = false
}: {
  items: Array<{ label: string; description?: string; id: string }>;
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
          selected={item.id === selected}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

function MultiToggle({
  items,
  selected,
  onToggle
}: {
  items: Array<{ label: string; id: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <PillToggle key={item.id} label={item.label} selected={selected.includes(item.id)} onClick={() => onToggle(item.id)} />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card className="program-section-card">
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

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
      <div style={{ minWidth: 104 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      </div>
      <div className="body-md" style={{ fontWeight: 500, textAlign: "right", flex: 1 }}>
        {value}
      </div>
    </div>
  );
}

export function EntryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entryDestination, setProfile } = useOnboardingStore();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslator();
  const auth = useAuthStore();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (auth.user && auth.ready) {
      router.replace(entryDestination);
    }
  }, [auth.ready, auth.user, entryDestination, router]);

  useEffect(() => {
    const authNotice = searchParams.get("auth");
    if (authNotice === "password-updated") {
      setStatus(t("auth.entryPasswordUpdated"));
    } else if (authNotice === "error") {
      setStatus(t("auth.entrySignInLinkError"));
    } else if (authNotice === "cancelled") {
      setStatus(t("auth.entryGoogleCancelled"));
    }
  }, [searchParams, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const error =
      mode === "sign-in" ? await auth.signInWithEmail(email, password) : await auth.signUpWithEmail(email, password);

    setSubmitting(false);

    if (error) {
      setStatus(error);
      return;
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setStatus(null);

    const error = await auth.signInWithGoogle();
    setGoogleLoading(false);

    if (error) {
      setStatus(error);
    }
  }

  async function handleForgotPassword() {
    router.push("/forgot-password");
  }

  if (auth.loading && auth.isConfigured) {
    return (
      <Screen shellClassName="onboarding-shell" topbar={<header className="topbar center"><BrandLogo variant="full" width={156} alt="AthlexForce" /></header>}>
        <main className="content">
          <section className="section">
            <div className="eyebrow" style={{ color: "#b6ff00" }}>{t("auth.entryAthleteHeading").toUpperCase()}</div>
            <h1 className="headline-xl" style={{ marginTop: 12 }}>{t("auth.entryWelcomeBack")}</h1>
            <p className="body-lg muted" style={{ marginTop: 12 }}>
              {t("auth.entryRestoringSession")}
            </p>
          </section>
          <section className="section">
            <Card className="p-16 onboarding-callout">
              <div className="stack" style={{ gap: 12 }}>
                <div className="eyebrow">{t("auth.entrySession")}</div>
                <div className="body-md" style={{ fontWeight: 700 }}>
                  {t("auth.entryCheckingSession")}
                </div>
                <p className="caption">{t("auth.entrySessionReady")}</p>
              </div>
            </Card>
          </section>
        </main>
      </Screen>
    );
  }

  return (
    <Screen shellClassName="onboarding-shell" topbar={<header className="topbar center"><BrandLogo variant="full" width={156} alt="AthlexForce" /></header>}>
      <main className="content">
        {auth.bootError ? (
          <section className="section">
            <Card className="p-16 onboarding-callout">
              <div className="stack" style={{ gap: 12 }}>
                <div className="eyebrow" style={{ color: "#ffd166" }}>{t("auth.entrySession").toUpperCase()}</div>
                <h2 className="headline-md" style={{ margin: 0 }}>{t("auth.entryBootErrorTitle")}</h2>
                <p className="caption">{t("auth.entryBootErrorSubtitle")}</p>
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="button-secondary focus-ring" onClick={auth.retrySessionRestore}>
                    {t("auth.entryBootErrorTryAgain")}
                  </button>
                  <button
                    type="button"
                    className="button-secondary focus-ring"
                    onClick={() => {
                      setMode("sign-in");
                      setStatus(null);
                    }}
                  >
                    {t("auth.entryBootErrorSignIn")}
                  </button>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        <section className="section">
          <div className="eyebrow" style={{ color: "#b6ff00" }}>{t("auth.entryAthleteHeading").toUpperCase()}</div>
          <h1 className="headline-xl" style={{ marginTop: 12 }}>{t("auth.entryWelcomeBack")}</h1>
          <p className="body-lg muted" style={{ marginTop: 12 }}>
            {t("auth.entryPlanWaiting")}
          </p>
        </section>

        <section className="section stack">
          <LanguageSelector
            compact
            value={locale}
            onChange={(nextLocale) => {
              setLocale(nextLocale);
              setProfile({ locale: nextLocale });
            }}
          />
          <Card className="p-16 onboarding-callout">
            <div className="stack" style={{ gap: 16 }}>
              <div className="stack" style={{ gap: 10 }}>
                <div className="eyebrow">{t("auth.entrySignInHeading")}</div>
                <p className="caption">{auth.isConfigured ? t("auth.entryStatusReady") : t("auth.entryStatusUnavailable")}</p>
                {status ? <p className="caption" style={{ color: "#ffd166" }}>{status}</p> : null}
              </div>

              <PrimaryButton className="focus-ring google-auth-button" onClick={handleGoogleSignIn} disabled={googleLoading || submitting}>
                <GoogleMark className="google-mark" />
                <span className="google-auth-button__label">{googleLoading ? t("auth.connectingGoogle") : t("auth.continueWithGoogle")}</span>
              </PrimaryButton>

              <div className="row" style={{ alignItems: "center", gap: 12 }}>
                <div className="auth-divider" aria-hidden="true" />
                <span className="caption" style={{ whiteSpace: "nowrap" }}>{t("auth.entryDivider")}</span>
                <div className="auth-divider" aria-hidden="true" />
              </div>

              <form className="stack" onSubmit={handleSubmit}>
                <label className="stack" style={{ gap: 8 }}>
                  <span className="eyebrow">{t("auth.email")}</span>
                  <input className="input-field focus-ring" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>

                <label className="stack" style={{ gap: 8 }}>
                  <span className="eyebrow">{t("auth.password")}</span>
                  <div className="row" style={{ alignItems: "stretch", gap: 8 }}>
                    <input
                      className="input-field focus-ring"
                      style={{ flex: 1 }}
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                    <SecondaryButton
                      className="focus-ring"
                      type="button"
                      style={{ minWidth: 44, paddingInline: 0 }}
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <span className="icon" aria-hidden="true">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </SecondaryButton>
                  </div>
                </label>

                <label className="row focus-ring" style={{ alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={auth.rememberSession}
                    onChange={(event) => auth.setRememberSessionPreference(event.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span className="body-md" style={{ fontWeight: 600 }}>
                    {t("auth.entryKeepSignedIn")}
                  </span>
                </label>

                <PrimaryButton className="focus-ring" type="submit" disabled={submitting}>
                  {submitting ? t("common.loading") : mode === "sign-in" ? t("auth.entrySignInButton") : t("auth.entryCreateAccount")}
                </PrimaryButton>
              </form>

              <div className="row" style={{ flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
                <button type="button" className="text-button focus-ring" onClick={handleForgotPassword}>
                  {t("auth.entryForgotPassword")}
                </button>
                {mode === "sign-in" ? (
                  <button type="button" className="auth-inline-action focus-ring" onClick={() => setMode("sign-up")}>
                    <span className="auth-inline-action__lead">{t("auth.entryNoAccountYet")}</span>
                    <span className="auth-inline-action__cta">{t("auth.entryCreateAccount")}</span>
                  </button>
                ) : (
                  <button type="button" className="text-button focus-ring" onClick={() => setMode("sign-in")}>
                    {t("auth.entryAlreadyHaveAccount")}
                  </button>
                )}
              </div>

              {mode === "sign-up" ? (
                <p className="caption">{t("auth.entrySignUpHelper")}</p>
              ) : (
                <p className="caption">{t("auth.entrySignInHelper")}</p>
              )}
            </div>
          </Card>
        </section>
      </main>
    </Screen>
  );
}

export function IdentityGatewayScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const { t } = useTranslator();
  const [identityIntent, setIdentityIntent] = useState<IdentityIntent | null>(() => readIdentityIntent());
  const [coachRelationship, setCoachRelationship] = useState<CoachRelationshipSummary | null>(null);
  const [isActiveCoach, setIsActiveCoach] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrateRelationship() {
      if (!auth.ready || !auth.user) {
        setCoachRelationship(null);
        setIsActiveCoach(false);
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        setCoachRelationship(null);
        setIsActiveCoach(false);
        return;
      }

      const [relationshipResult, coachResult] = await Promise.all([
        loadMyCoachRelationship(client).catch(() => null),
        client.from("coach_profiles").select("id,status").eq("user_id", auth.user.id).maybeSingle()
      ]);

      if (!active) {
        return;
      }

      setCoachRelationship(relationshipResult);
      const coachProfile = coachResult.data as CoachProfilesRow | null;
      setIsActiveCoach(Boolean(coachProfile && coachProfile.status === "active"));
    }

    void hydrateRelationship();

    return () => {
      active = false;
    };
  }, [auth.ready, auth.user?.id]);

  useEffect(() => {
    if (identityIntent === "coach" && isActiveCoach) {
      router.replace("/coach");
    }
  }, [identityIntent, isActiveCoach, router]);

  async function acceptInvite() {
    setInviteLoading(true);
    setInviteStatus(null);

    const token = inviteCode.trim();
    if (!token) {
      setInviteLoading(false);
      setInviteStatus(t("onboarding.identityGatewayInviteError"));
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setInviteLoading(false);
      setInviteStatus(t("onboarding.identityGatewayInviteError"));
      return;
    }

    try {
      await acceptCoachInvitation(client, token);
      const updatedRelationship = await loadMyCoachRelationship(client);
      setCoachRelationship(updatedRelationship);
      setIdentityIntent("coach_managed");
      writeIdentityIntent("coach_managed");
      writeWorkspacePreference("athlete");
      setInviteStatus(t("onboarding.identityGatewayInviteSuccess"));
    } catch {
      setInviteStatus(t("onboarding.identityGatewayInviteError"));
    } finally {
      setInviteLoading(false);
    }
  }

  function chooseIdentity(nextIntent: IdentityIntent) {
    setIdentityIntent(nextIntent);
    writeIdentityIntent(nextIntent);
    writeWorkspacePreference(nextIntent === "coach" ? "coach" : "athlete");
    setInviteStatus(null);

    if (nextIntent === "coach" && isActiveCoach) {
      router.push("/coach");
    }
  }

  if (identityIntent === null) {
    return (
      <FlowShell step="intro" title={t("onboarding.identityGatewayTitle")} subtitle={t("onboarding.identityGatewaySubtitle")} backHref="/entry" rightLabel={t("common.skip")} rightHref="/entry">
        <section className="section">
          <SectionTitle title={t("onboarding.identityGatewayTitle")} caption={t("onboarding.identityGatewaySubtitle")} />
        </section>

        <section className="section stack">
          <div className="onboarding-choice-grid one-column">
            <ChoiceButton
              label={t("onboarding.identityGatewayIndependentTitle")}
              description={t("onboarding.identityGatewayIndependentCopy")}
              selected={false}
              onClick={() => chooseIdentity("self_managed")}
            />
            <ChoiceButton
              label={t("onboarding.identityGatewayCoachManagedTitle")}
              description={t("onboarding.identityGatewayCoachManagedCopy")}
              selected={false}
              onClick={() => chooseIdentity("coach_managed")}
            />
            <ChoiceButton
              label={t("onboarding.identityGatewayCoachTitle")}
              description={t("onboarding.identityGatewayCoachCopy")}
              selected={false}
              onClick={() => chooseIdentity("coach")}
            />
          </div>
        </section>
      </FlowShell>
    );
  }

  if (identityIntent === "coach" && !isActiveCoach) {
    return (
      <FlowShell step="intro" title={t("onboarding.identityGatewayTitle")} subtitle={t("onboarding.identityGatewaySubtitle")} backHref="/entry" rightLabel={t("common.skip")} rightHref="/entry">
        <section className="section">
          <SectionTitle title={t("onboarding.identityGatewayPendingTitle")} caption={t("onboarding.identityGatewayPendingCopy")} />
        </section>

        <section className="section stack">
          <Card className="program-hero-card p-16">
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{t("coach.pendingRequestReceived")}</div>
              <p className="caption">{t("coach.pendingRequestDetail")}</p>
              <SecondaryButton
                className="focus-ring"
                onClick={() => {
                  chooseIdentity("self_managed");
                  router.replace("/onboarding");
                }}
              >
                {t("common.athleteWorkspace")}
              </SecondaryButton>
            </div>
          </Card>
        </section>
      </FlowShell>
    );
  }

  if (identityIntent === "coach_managed" && !coachRelationship) {
    return (
      <FlowShell step="intro" title={t("onboarding.identityGatewayTitle")} subtitle={t("onboarding.identityGatewaySubtitle")} backHref="/entry" rightLabel={t("common.skip")} rightHref="/entry">
        <section className="section">
          <SectionTitle title={t("onboarding.identityGatewayInviteTitle")} caption={t("onboarding.identityGatewayInviteCopy")} />
        </section>

        <section className="section stack">
          <Card className="program-hero-card p-16">
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{t("onboarding.identityGatewayInviteTitle")}</div>
              <input
                className="input-field focus-ring"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={t("onboarding.identityGatewayInvitePlaceholder")}
                autoComplete="one-time-code"
                inputMode="text"
              />
              {inviteStatus ? <p className="caption">{inviteStatus}</p> : null}
              <PrimaryButton className="focus-ring" onClick={acceptInvite} disabled={inviteLoading}>
                {inviteLoading ? t("common.loading") : t("onboarding.identityGatewayInviteButton")}
              </PrimaryButton>
              <SecondaryButton
                className="focus-ring"
                onClick={() => {
                  chooseIdentity("self_managed");
                  router.replace("/onboarding");
                }}
              >
                {t("onboarding.identityGatewayIndependentTitle")}
              </SecondaryButton>
            </div>
          </Card>
        </section>
      </FlowShell>
    );
  }

  return <OnboardingIntroScreen />;
}

export function OnboardingIntroScreen() {
  const router = useRouter();
  const { completeStep } = useOnboardingStore();

  return (
    <FlowShell step="intro" title="Onboarding" subtitle="Build the athlete setup before the plan is revealed." backHref="/entry" rightLabel="Skip" rightHref="/entry">
      <section className="section">
        <SectionTitle title="Start with the basics" caption="AthlexForce uses one consistent athlete context across profile, goals, training, nutrition, baseline, and the program reveal." />
      </section>

      <section className="section stack">
        <Card className="program-hero-card p-16">
          <div className="stack" style={{ gap: 14 }}>
            <div className="eyebrow">What we’ll set up</div>
            <div className="stack" style={{ gap: 10 }}>
              {["Profile", "Goals", "Training", "Schedule", "Health", "Nutrition", "Baseline"].map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                  <span className="icon muted" aria-hidden="true">check</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.push("/entry")}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("intro"); router.push("/onboarding/profile"); }}>Start onboarding</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { state, setProfile, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="profile" title="Profile" subtitle="Name, age, height, weight, and units." backHref="/onboarding">
      <section className="section">
              <SectionTitle title="What should we call you?" caption="Use the same athlete details throughout the flow." />
      </section>

      <section className="section stack">
        <Card className="program-hero-card p-16">
          <div className="stack" style={{ gap: 12 }}>
            <MetricField label="Name" value={state.profile.name} onChange={(value) => setProfile({ name: value })} />
            <div className="grid-2">
              <MetricField label="Age" value={state.profile.age} type="number" inputMode="numeric" onChange={(value) => setProfile({ age: Number(value || 0) })} />
              <MetricField label="Unit system" value={state.profile.unitSystem} onChange={(value) => setProfile({ unitSystem: value as "metric" | "imperial" })} />
            </div>
            <div className="grid-2">
              <MetricField label="Height" value={state.profile.heightCm} suffix="cm" type="number" inputMode="decimal" onChange={(value) => setProfile({ heightCm: Number(value || 0) })} />
              <MetricField label="Weight" value={state.profile.weightKg} suffix="kg" type="number" inputMode="decimal" onChange={(value) => setProfile({ weightKg: Number(value || 0) })} />
            </div>
          </div>
        </Card>
      </section>

      <section className="section">
        <Card className="p-16 onboarding-callout">
          <div className="eyebrow">Profile snapshot</div>
          <p className="body-md" style={{ marginTop: 8 }}>
            {state.profile.name} · {state.profile.heightCm} cm · {state.profile.weightKg} kg · {state.profile.unitSystem}
          </p>
        </Card>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("profile"); router.push("/onboarding/goals"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function GoalsScreen() {
  const router = useRouter();
  const { state, setMainGoal, reorderPriorities, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="goals" title="Goals" subtitle="Main goal and ordered priorities." backHref="/onboarding/profile">
      <section className="section">
        <SectionTitle title="Set the main goal" caption="Keep the visual language simple. Goal and priorities should read clearly on mobile." />
      </section>

      <section className="section stack">
        <ToggleGroup
          items={[
            { id: "Body Recomposition", label: "Body Recomposition" },
            { id: "Muscle Gain", label: "Muscle Gain" },
            { id: "Strength", label: "Strength" },
            { id: "Performance", label: "Performance" }
          ]}
          selected={state.goals.mainGoal}
          onSelect={setMainGoal}
          oneColumn
        />
      </section>

      <section className="section stack">
        <Card className="program-section-card">
          <div className="eyebrow">Priorities</div>
          <p className="caption" style={{ marginTop: 6 }}>Reorder the list. The current order updates immediately.</p>
          <div className="stack" style={{ marginTop: 14 }}>
            {state.goals.priorities.map((priority, index) => (
              <div key={priority} className="onboarding-reorder-row">
                <div className="onboarding-reorder-index">{index + 1}</div>
                <div className="body-md" style={{ fontWeight: 700, flex: 1 }}>{priority}</div>
                <button className="tap-target focus-ring" aria-label={`Move ${priority} up`} onClick={() => reorderPriorities(index, Math.max(0, index - 1))} type="button">
                  <span className="icon" aria-hidden="true">arrow_upward</span>
                </button>
                <button className="tap-target focus-ring" aria-label={`Move ${priority} down`} onClick={() => reorderPriorities(index, Math.min(state.goals.priorities.length - 1, index + 1))} type="button">
                  <span className="icon" aria-hidden="true">arrow_downward</span>
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("goals"); router.push("/onboarding/training-experience"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function TrainingExperienceScreen() {
  const router = useRouter();
  const { state, setTrainingExperience, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="training-experience" title="Training Experience" subtitle="Current frequency, confidence, loads, and movement familiarity." backHref="/onboarding/goals">
      <section className="section stack">
        <Card className="program-section-card">
          <div className="eyebrow">Experience summary</div>
          <div className="stack" style={{ gap: 10, marginTop: 12 }}>
            {[
              ["Training age", state.trainingExperience.trainingAge, "2-3 years"],
              ["Current frequency", state.trainingExperience.currentFrequency, "4 days / week"],
              ["Confidence", state.trainingExperience.confidence, "Intermediate"],
              ["Equipment", state.trainingExperience.equipmentFamiliarity, "Full gym"]
            ].map(([label, value]) => (
              <div key={label as string} className="row">
                <div className="eyebrow" style={{ margin: 0 }}>{label as string}</div>
                <div className="body-md" style={{ fontWeight: 700, textAlign: "right" }}>{value as string}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="section stack">
        <Card className="program-section-card">
          <div className="eyebrow">Familiarity</div>
          <div className="stack" style={{ gap: 12, marginTop: 12 }}>
            <MetricField label="Movement familiarity" value={state.trainingExperience.movementFamiliarity} onChange={(value) => setTrainingExperience({ movementFamiliarity: value })} />
            <MetricField label="Load familiarity" value={state.trainingExperience.loadFamiliarity} onChange={(value) => setTrainingExperience({ loadFamiliarity: value })} />
            <MetricField label="RIR familiarity" value={state.trainingExperience.rirFamiliarity} onChange={(value) => setTrainingExperience({ rirFamiliarity: value })} />
            <MetricField label="Technical confidence" value={state.trainingExperience.technicalConfidence} onChange={(value) => setTrainingExperience({ technicalConfidence: value })} />
          </div>
        </Card>
      </section>

      <section className="section stack">
        <Card className="program-section-card">
          <div className="eyebrow">Current lifts</div>
          <div className="stack" style={{ marginTop: 12 }}>
            {state.trainingExperience.currentKeyLifts.map((lift) => (
              <div key={lift} className="row">
                <div className="body-md" style={{ fontWeight: 700 }}>{lift}</div>
                <span className="icon muted" aria-hidden="true">fitness_center</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("training-experience"); router.push("/onboarding/training-preferences"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function TrainingPreferencesScreen() {
  const router = useRouter();
  const { state, setTrainingPreferences, completeStep } = useOnboardingStore();
  const preferences = state.trainingPreferences;

  return (
    <FlowShell step="training-preferences" title="Training Preferences" subtitle="Days, duration, equipment, variety, and rest preferences." backHref="/onboarding/training-experience">
      <section className="section stack">
        <SectionCard title="Training days" subtitle="Use the same weekly pattern for progression.">
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <PillToggle
                key={day}
                label={day}
                selected={preferences.preferredDays.includes(day)}
                onClick={() =>
                  setTrainingPreferences({
                    preferredDays: preferences.preferredDays.includes(day)
                      ? preferences.preferredDays.filter((item) => item !== day)
                      : [...preferences.preferredDays, day]
                  })
                }
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Preference summary">
          <div className="stack" style={{ gap: 10 }}>
            <ReviewLine label="Days / week" value={`${preferences.daysPerWeek}`} />
            <ReviewLine label="Duration" value={preferences.duration} />
            <ReviewLine label="Location" value={preferences.location} />
            <ReviewLine label="Style" value={preferences.style} />
            <ReviewLine label="Cardio" value={preferences.cardioPreference} />
          </div>
        </SectionCard>

        <SectionCard title="Repeatable anchors" subtitle="Variety should not become randomness.">
          <div className="stack" style={{ gap: 12 }}>
            <MetricField label="Favorite exercises" value={preferences.favoriteExercises.join(", ")} onChange={(value) => setTrainingPreferences({ favoriteExercises: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <MetricField label="Movements to avoid" value={preferences.movementsToAvoid.join(", ")} onChange={(value) => setTrainingPreferences({ movementsToAvoid: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <MetricField label="Guidance preference" value={preferences.guidancePreference} onChange={(value) => setTrainingPreferences({ guidancePreference: value })} />
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("training-preferences"); router.push("/onboarding/schedule"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function ScheduleLifestyleScreen() {
  const router = useRouter();
  const { state, setScheduleLifestyle, completeStep } = useOnboardingStore();
  const schedule = state.scheduleLifestyle;

  return (
    <FlowShell step="schedule" title="Schedule & Lifestyle" subtitle="Work pattern, sleep, stress, hydration, and training windows." backHref="/onboarding/training-preferences">
      <section className="section stack">
        <SectionCard title="Lifestyle summary">
          <div className="stack" style={{ gap: 10 }}>
            <ReviewLine label="Work schedule" value={schedule.workSchedule} />
            <ReviewLine label="Activity level" value={schedule.activityLevel} />
            <ReviewLine label="Steps" value={schedule.steps} />
            <ReviewLine label="Energy pattern" value={schedule.energyPattern} />
          </div>
        </SectionCard>

        <SectionCard title="Timing">
          <div className="grid-2">
            <MetricField label="Wake time" value={schedule.wakeTime} onChange={(value) => setScheduleLifestyle({ wakeTime: value })} />
            <MetricField label="Bed time" value={schedule.bedTime} onChange={(value) => setScheduleLifestyle({ bedTime: value })} />
          </div>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <MetricField label="Water" value={schedule.water} onChange={(value) => setScheduleLifestyle({ water: value })} />
            <MetricField label="Caffeine" value={schedule.caffeine} onChange={(value) => setScheduleLifestyle({ caffeine: value })} />
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("schedule"); router.push("/onboarding/health"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function HealthLimitationsScreen() {
  const router = useRouter();
  const { state, setHealthLimitations, completeStep, requiresCoachReview } = useOnboardingStore();
  const health = state.healthLimitations;

  return (
    <FlowShell step="health" title="Health & Limitations" subtitle="Keep this calm, private, and non-diagnostic." backHref="/onboarding/schedule">
      <section className="section stack">
        <Card className="program-section-card">
          <div className="eyebrow">Current context</div>
          <div className="stack" style={{ gap: 10, marginTop: 12 }}>
            <MetricField label="Injury history" value={health.injuryHistory} onChange={(value) => setHealthLimitations({ injuryHistory: value })} />
            <MetricField label="Current pain / discomfort" value={health.currentPain} onChange={(value) => setHealthLimitations({ currentPain: value })} />
            <MetricField label="Movement limitations" value={health.movementLimitations.join(", ")} onChange={(value) => setHealthLimitations({ movementLimitations: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <MetricField label="ROM limitations" value={health.romLimitations.join(", ")} onChange={(value) => setHealthLimitations({ romLimitations: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </div>
        </Card>

        {requiresCoachReview ? (
          <Card className="program-section-card">
            <div className="eyebrow">Coach review required</div>
            <p className="caption" style={{ marginTop: 8 }}>
              A significant limitation was entered. The plan stays visible and routes through review.
            </p>
          </Card>
        ) : null}
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("health"); router.push("/onboarding/nutrition"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function NutritionPreferencesScreen() {
  const router = useRouter();
  const { state, setNutritionPreferences, completeStep, canUseNutritionChoice } = useOnboardingStore();
  const nutrition = state.nutritionPreferences;

  return (
    <FlowShell step="nutrition" title="Nutrition Preferences" subtitle="Allergies, restrictions, routine, and flexibility." backHref="/onboarding/health">
      <section className="section stack">
        <SectionCard title="Safety priority" subtitle="Allergy and restriction safety overrides preference.">
          <div className="stack" style={{ gap: 10 }}>
            <ReviewLine label="Allergies" value={nutrition.allergies.join(", ") || "None"} />
            <ReviewLine label="Restrictions" value={nutrition.restrictions.join(", ") || "None"} />
            <ReviewLine label="Intolerances" value={nutrition.intolerances.join(", ") || "None"} />
            <ReviewLine label="Macro visibility" value={nutrition.macroVisibility} />
          </div>
        </SectionCard>

        <SectionCard title="Meal structure">
          <div className="stack" style={{ gap: 12 }}>
            <MetricField label="Meal frequency" value={nutrition.mealFrequency} onChange={(value) => setNutritionPreferences({ mealFrequency: value })} />
            <MetricField label="Meal times" value={nutrition.mealTimes} onChange={(value) => setNutritionPreferences({ mealTimes: value })} />
            <MetricField label="Breakfast preference" value={nutrition.breakfastPreference} onChange={(value) => setNutritionPreferences({ breakfastPreference: value })} />
            <MetricField label="Pre-workout eating" value={nutrition.preWorkoutEating} onChange={(value) => setNutritionPreferences({ preWorkoutEating: value })} />
          </div>
          <div className="caption" style={{ marginTop: 12 }}>
            Example allowed option: {canUseNutritionChoice({ tags: ["eggs", "toast"] }) ? "Eggs & toast" : "Blocked by safety"}
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("nutrition"); router.push("/onboarding/baseline"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function BaselineScreen() {
  const router = useRouter();
  const { state, setBaselineMeasurement, setBaselinePhoto, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="baseline" title="Baseline" subtitle="Measurements and optional private progress photos." backHref="/onboarding/nutrition">
      <section className="section stack">
        <SectionCard title="Measurements" subtitle="Use the same conditions each time.">
          <div className="stack" style={{ gap: 12 }}>
            {state.baseline.measurements.map((measurement) => (
              <MetricField
                key={measurement.type}
                label={measurement.type}
                value={measurement.value}
                suffix={measurement.unit}
                inputMode="decimal"
                onChange={(value) => setBaselineMeasurement(measurement.type as "weight" | "waist" | "hips" | "thigh", value)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Progress photos" subtitle="Private by default. Front, side, and back remain optional.">
          <div className="onboarding-choice-grid one-column" style={{ marginTop: 8 }}>
            {state.baseline.photos.poses.map((pose) => (
              <ChoiceButton
                key={pose.pose}
                label={pose.label}
                description={`${pose.status} · baseline`}
                selected={pose.status !== "missing"}
                onClick={() => setBaselinePhoto(pose.pose as BaselinePose, pose.status === "captured" ? "retake" : "captured")}
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("baseline"); router.push("/onboarding/review"); }}>Continue</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function FinalReviewScreen() {
  const router = useRouter();
  const { state, completeStep, createProgramProposal } = useOnboardingStore();

  return (
    <FlowShell step="review" title="Final Review" subtitle="Confirm the profile before the plan is built." backHref="/onboarding/baseline">
      <section className="section">
        <SectionTitle title="Final Review" caption="Confirm the profile before the plan is built." />
      </section>

      <section className="section stack">
        <Card className="program-hero-card p-16">
          <div className="stack" style={{ gap: 12 }}>
            <div className="eyebrow">Review summary</div>
            <ReviewLine label="Goal" value={state.goals.mainGoal} />
            <ReviewLine label="Priorities" value={state.goals.priorities.join(" · ")} />
            <ReviewLine label="Training" value={`${state.trainingPreferences.daysPerWeek} days / week · ${state.trainingPreferences.duration}`} />
            <ReviewLine label="Nutrition" value={state.nutritionPreferences.mealFrequency} />
            <ReviewLine label="Baseline" value={state.baseline.successDefinition} />
          </div>
        </Card>

        <SectionCard title="Edit sections">
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <Link href="/onboarding/profile" className="progress-mini-action">Profile</Link>
            <Link href="/onboarding/goals" className="progress-mini-action">Goals</Link>
            <Link href="/onboarding/schedule" className="progress-mini-action">Schedule</Link>
            <Link href="/onboarding/nutrition" className="progress-mini-action">Nutrition</Link>
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { createProgramProposal(); completeStep("review"); router.push("/onboarding/building-plan"); }}>Build my plan</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function BuildingPlanScreen() {
  const router = useRouter();
  const { state, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="building-plan" title="Building Your Plan" subtitle="A calm pause while your plan is being prepared." backHref="/onboarding/review" rightLabel="Next" rightHref="/onboarding/plan-ready">
      <section className="section stack">
        <Card className="program-hero-card p-16">
          <div className="stack" style={{ gap: 16 }}>
            <div className="eyebrow">Processing</div>
            <h1 className="headline-lg">Building your plan</h1>
            <p className="caption">The plan is built from the details you entered.</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "72%" }} />
            </div>
          </div>
        </Card>
        <SectionCard title="Plan details">
          <div className="stack" style={{ gap: 10 }}>
            {state.program.weeklyStructure.map((item) => (
              <div key={item} className="row">
                <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                <span className="icon muted" aria-hidden="true">sync</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("building-plan"); router.push("/onboarding/plan-ready"); }}>View plan reveal</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function PlanRevealScreen() {
  const router = useRouter();
  const { state, finalizeOnboarding, completeStep } = useOnboardingStore();

  return (
    <FlowShell step="plan-ready" title="Your Plan is Ready" subtitle="Phase 1 is proposed until you start the program." backHref="/onboarding/building-plan">
      <section className="section stack">
        <Card className="program-hero-card p-16">
          <div className="stack" style={{ gap: 12 }}>
            <span className="program-template-chip">{state.program.phaseLabel}</span>
            <h1 className="headline-lg">{state.program.goal}</h1>
            <p className="body-md muted">{state.program.whyItFits}</p>
          </div>
        </Card>

        <SectionCard title="Plan summary">
          <div className="stack" style={{ gap: 10 }}>
            <ReviewLine label="Duration" value={state.program.duration} />
            <ReviewLine label="Weekly structure" value={state.program.weeklyStructure.join(" · ")} />
            <ReviewLine label="First workout" value={state.program.firstWorkout} />
            <ReviewLine label="Nutrition" value={state.program.nutrition} />
            <ReviewLine label="Cardio" value={state.program.cardio} />
            <ReviewLine label="Recovery" value={state.program.recovery} />
            <ReviewLine label="Check-in" value={state.program.checkIn} />
          </div>
        </SectionCard>
      </section>

      <OnboardingStickyActions
        secondary={<SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>}
        primary={<PrimaryButton className="focus-ring" onClick={() => { completeStep("plan-ready"); finalizeOnboarding(); router.push("/"); }}>Start my program</PrimaryButton>}
      />
    </FlowShell>
  );
}

export function ProgramOverviewScreen() {
  const { program } = useOnboardingStore();

  return (
    <Screen
      activeTab={undefined}
      shellClassName="screen-shell"
      topbar={
        <header className="topbar center">
          <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
            Program Overview
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <SectionTitle title="My Program" caption={`${program.phaseLabel} · ${program.status.toUpperCase()}`} />
        </section>

        <section className="section stack">
          <Card className="program-hero-card p-16">
            <div className="stack" style={{ gap: 12 }}>
              <span className="program-template-chip">{program.goal}</span>
              <h2 className="headline-md">{program.duration}</h2>
              <p className="body-md muted">{program.whyItFits}</p>
            </div>
          </Card>
        </section>

        <section className="section stack">
          <SectionCard title="Weekly structure">
            <div className="stack" style={{ gap: 10 }}>
              {program.weeklyStructure.map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Workout templates">
            <div className="stack" style={{ gap: 10 }}>
              {program.workoutTemplates.map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Key movements">
            <div className="stack" style={{ gap: 10 }}>
              {program.keyMovements.map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="section stack">
          <SectionCard title="Progression">{program.progressionSystem}</SectionCard>
          <SectionCard title="Nutrition">{program.nutrition}</SectionCard>
          <SectionCard title="Cardio">{program.cardio}</SectionCard>
          <SectionCard title="Recovery">{program.recovery}</SectionCard>
          <SectionCard title="Habits">{program.habits}</SectionCard>
          <SectionCard title="Check-in">{program.checkIn}</SectionCard>
          <SectionCard title="Review timeline">{program.baselineTimeline.join(" · ")}</SectionCard>
        </section>

        <section className="section stack">
          <Card className="program-section-card">
            <div className="eyebrow">Recent adjustments</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {program.recentAdjustments.map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>{item}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </Screen>
  );
}
