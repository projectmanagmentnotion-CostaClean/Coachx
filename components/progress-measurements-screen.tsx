"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { NumericControl } from "@/components/numeric-controls";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useProgressStore } from "@/components/progress-provider";
import { formatProgressDifference, formatProgressMeasurement } from "@/components/progress-provider";
import type { MeasurementType } from "@/lib/progress-data";
import { useTranslator } from "@/components/locale-provider";
import { buildContextualSuccessTimeline } from "@/motion/feedback";
import { useReducedMotion } from "@/motion/useReducedMotion";

const measurementOrder: MeasurementType[] = ["weight", "waist", "hips", "thigh"];
const measurementLabels: Record<MeasurementType, string> = {
  weight: "Weight",
  waist: "Waist",
  hips: "Hips",
  thigh: "Thigh"
};

function resolveSupportedLocale(locale: string) {
  return locale === "es" || locale === "ca" || locale === "de" ? locale : "en";
}

function ProgressTopbar({ closeHref }: { closeHref: string }) {
  return (
    <header className="progress-topbar">
      <Link href={closeHref} className="progress-topbar__button focus-ring" aria-label="Close screen">
        <span className="icon" aria-hidden="true">
          arrow_back
        </span>
      </Link>
      <BrandLogo variant="mark" width={34} alt="AthlexForce" />
      <span className="progress-topbar__spacer" aria-hidden="true" />
    </header>
  );
}

function ProgressDialog({
  title,
  description,
  onClose,
  children
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="measurement-dialog-title" aria-describedby="measurement-dialog-description">
      <div className="progress-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="progress-modal__sheet" ref={dialogRef}>
        <div className="row start" style={{ marginBottom: 14 }}>
          <div>
            <h2 id="measurement-dialog-title" className="headline-md">
              {title}
            </h2>
            <p id="measurement-dialog-description" className="caption" style={{ marginTop: 6 }}>
              {description}
            </p>
          </div>
          <button ref={closeRef} className="tap-target focus-ring" type="button" onClick={onClose} aria-label="Close dialog">
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="stack">{children}</div>
      </div>
    </div>
  );
}

function MeasurementCard({
  locale,
  type,
  children,
  active,
  error,
  lastValue,
  lastDate,
  difference,
  unit,
  onInfo,
  value,
  onChange
}: {
  locale: "en" | "es" | "ca" | "de";
  type: MeasurementType;
  children?: ReactNode;
  active?: boolean;
  error?: string;
  lastValue: string;
  lastDate: string;
  difference: string | null;
  unit: string;
  onInfo?: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  const accent = type === "waist";

  return (
    <Card className={`progress-measurement-card p-16 ${accent ? "progress-measurement-card--accent" : ""}`.trim()}>
      <div className="row start" style={{ marginBottom: 10 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4, color: accent ? "var(--accent-primary)" : undefined }}>
            {measurementLabels[type].toUpperCase()}
          </div>
          <p className="caption">
            Last: {lastValue} · {lastDate}
          </p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {difference ? (
            <span className={`progress-chip ${accent ? "progress-chip--accent" : ""}`.trim()}>
              <span className="icon filled" aria-hidden="true" style={{ fontSize: 14 }}>
                {difference.startsWith("-") ? "trending_down" : "trending_up"}
              </span>
              {difference.replace("-", "")}
            </span>
          ) : null}
          {onInfo ? (
            <button className="tap-target focus-ring" type="button" aria-label={`How to measure ${measurementLabels[type]}`} onClick={onInfo}>
              <span className="icon" aria-hidden="true">
                info
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <NumericControl
        className="progress-measurement-control"
        decimals={1}
        error={error}
        inputMode="decimal"
        label={`${measurementLabels[type]} measurement`}
        locale={locale}
        min={0.1}
        state={active ? "editing" : "default"}
        unit={unit.toUpperCase()}
        value={value}
        onChange={onChange}
      />

      {children}
    </Card>
  );
}

function MeasurementGuidance({ onClose }: { onClose: () => void }) {
  return (
    <ProgressDialog
      title="For better comparisons"
      description="Use the same conditions each time so the changes stay objective."
      onClose={onClose}
    >
      <ul className="progress-dialog-list">
        <li>Measure at the same time of day.</li>
        <li>Keep hydration and food timing similar.</li>
        <li>Use the same measuring location.</li>
        <li>Keep posture relaxed and consistent.</li>
        <li>Use the same unit and measuring tape.</li>
      </ul>
    </ProgressDialog>
  );
}

export function ProgressMeasurementsScreen() {
  const router = useRouter();
  const { locale } = useTranslator();
  const { state, updateMeasurementDraft, saveMeasurements, dismissMeasurementErrors, measurementRows } = useProgressStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const submittedRef = useRef(false);
  const supportedLocale = resolveSupportedLocale(locale);

  const errors = state.measurement.validationErrors;

  const save = async () => {
    const result = await saveMeasurements();
    if (!result.ok) {
      return;
    }

    submittedRef.current = true;
    router.push("/progress/measurements/success");
  };

  useEffect(() => {
    if (submittedRef.current) {
      dismissMeasurementErrors();
    }
  }, [dismissMeasurementErrors]);

  return (
    <Screen
      shellClassName="progress-flow-shell"
      topbar={<ProgressTopbar closeHref="/progress" />}
    >
      <main className="content tight">
        <section className="section progress-hero">
          <div className="progress-hero__eyebrow">
            <span>PHASE 1</span>
            <span>•</span>
            <span>{state.measurement.weekLabel.toUpperCase()}</span>
            <span>•</span>
            <span>LAST: JULY 11</span>
          </div>
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            UPDATE MEASUREMENTS
          </h1>
          <p className="body-md muted" style={{ marginTop: 12 }}>
            Use similar conditions each time for better comparisons.
          </p>
        </section>

        <section className="section">
          <Card className="progress-banner p-16">
            <div className="eyebrow" style={{ marginBottom: 6, color: "var(--accent-primary)" }}>
              CURRENT CHECKPOINT
            </div>
            <div className="body-lg">{state.measurement.currentCheckpointLabel}</div>
          </Card>
        </section>

        <section className="stack">
          {measurementOrder.map((type) => {
            const definition = state.measurement.definitions.find((item) => item.type === type);
            const row = measurementRows.find((item) => item.type === type);
            if (!definition || !row) {
              return null;
            }

            const lastLabel = formatProgressMeasurement(row.previousValue, row.unit);
            const currentDifference =
              row.currentValue !== null && row.difference !== null ? formatProgressDifference(row.difference, row.unit).replace(".0", "") : null;

            return (
              <MeasurementCard
                key={type}
                active={type === "waist"}
                difference={type === "waist" && row.difference !== null ? `↓ ${Math.abs(row.difference).toFixed(1)} ${row.unit.toUpperCase()}` : currentDifference}
                error={errors[type]}
                lastDate="July 11"
                lastValue={lastLabel.replace(` ${row.unit}`, "")}
                locale={supportedLocale}
                onChange={(value) => updateMeasurementDraft(type, value)}
                onInfo={() => setHelpOpen(true)}
                type={type}
                unit={row.unit}
                value={definition.todayValue}
              >
                {type === "weight" ? null : null}
              </MeasurementCard>
            );
          })}

        <button className="progress-add-button focus-ring" type="button" onClick={() => setHelpOpen(true)}>
            <span className="icon" aria-hidden="true">
              add
            </span>
            ADD MEASUREMENT
          </button>
        </section>

        <section className="section">
          <Card className="progress-note-card p-16">
            <div className="row start" style={{ alignItems: "flex-start" }}>
              <span className="icon filled accent" aria-hidden="true" style={{ marginTop: 2 }}>
                lightbulb
              </span>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6, color: "var(--accent-primary)" }}>
                  FOR BETTER COMPARISONS
                </div>
                <ul className="progress-dialog-list">
                  <li>Measure at the same time of day.</li>
                  <li>Maintain consistent hydration levels.</li>
                  <li>Keep a relaxed posture, avoid flexing.</li>
                  <li>Use the exact same measuring tape.</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <div className="progress-fixed-actions">
        <button className="button-primary focus-ring" type="button" onClick={save}>
          SAVE MEASUREMENTS
        </button>
        <SecondaryButton className="focus-ring" onClick={() => router.push("/progress/measurements/success")}>
          SKIP MISSING VALUES
        </SecondaryButton>
      </div>

      {helpOpen ? <MeasurementGuidance onClose={() => setHelpOpen(false)} /> : null}
    </Screen>
  );
}

function SummaryRow({
  label,
  previousValue,
  currentValue,
  unit,
  previousDate,
  currentDate
}: {
  label: string;
  previousValue: number | null;
  currentValue: number | null;
  unit: string;
  previousDate: string | null;
  currentDate: string | null;
}) {
  return (
    <div className="progress-summary-row">
      <span className="eyebrow" style={{ margin: 0 }}>
        {label}
      </span>
      <div className="progress-summary-row__values">
        <span className="caption">{previousValue === null ? "NO PREVIOUS DATA" : `${previousValue.toFixed(1)} ${unit}`}</span>
        <span className="icon muted" aria-hidden="true">
          arrow_forward
        </span>
        <span className={currentValue === null ? "caption" : "body-md"}>
          {currentValue === null ? "NO UPDATE" : `${currentValue.toFixed(1)} ${unit}`}
        </span>
      </div>
      <div className="caption" style={{ textAlign: "right", marginTop: 4 }}>
        {previousDate ?? "—"} · {currentDate ?? "—"}
      </div>
    </div>
  );
}

export function ProgressMeasurementSuccessScreen() {
  const { state } = useProgressStore();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const successHeroRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = successHeroRef.current;
    if (!root) {
      return undefined;
    }

    const context = buildContextualSuccessTimeline({ root, reducedMotion }, "[data-feedback-success]");
    return () => context.revert();
  }, [reducedMotion]);

  return (
    <Screen
      activeTab="progress"
      shellClassName="progress-flow-shell"
      topbar={
        <header className="progress-topbar progress-topbar--success">
          <button className="progress-topbar__button focus-ring" type="button" aria-label="Close success screen" onClick={() => router.push("/progress")}>
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
          <BrandLogo variant="mark" width={34} alt="AthlexForce" />
          <span className="progress-topbar__spacer" aria-hidden="true" />
        </header>
      }
    >
      <main className="content tight">
        <section ref={successHeroRef} className="section progress-success-hero" data-feedback-success="true">
          <div className="progress-success-hero__icon">
            <span className="icon filled accent" aria-hidden="true" style={{ fontSize: 32 }}>
              check_circle
            </span>
          </div>
          <h1 className="headline-md" style={{ textTransform: "uppercase", textAlign: "center" }}>
            MEASUREMENTS UPDATED
          </h1>
        </section>

        <section className="section">
          <Card className="progress-summary-card">
            {state.measurement.lastSavedRows.map((row) => (
              <SummaryRow
                key={row.type}
                currentDate={row.currentDate}
                currentValue={row.currentValue}
                label={row.label.toUpperCase()}
                previousDate={row.previousDate}
                previousValue={row.previousValue}
                unit={row.unit}
              />
            ))}
          </Card>
        </section>

        <section className="section">
          <Card className="progress-insight-card p-16">
            <div className="row start" style={{ marginBottom: 8 }}>
              <span className="icon filled accent" aria-hidden="true" style={{ fontSize: 18 }}>
                auto_awesome
              </span>
              <div className="eyebrow" style={{ margin: 0, color: "var(--accent-primary)" }}>
                ATHLEXFORCE INSIGHT
              </div>
            </div>
            <p className="body-md" style={{ lineHeight: 1.6 }}>
              Your waist decreased while body weight remained stable, which supports a positive recomposition trend.
            </p>
          </Card>
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            NEXT STEPS
          </div>
          <div className="stack">
            <Card className="progress-next-card p-16">
              <div className="row start">
                <div>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    PROGRESS PHOTOS
                  </div>
                  <p className="caption" style={{ marginTop: 4 }}>
                    Due today. Front · Side · Back.
                  </p>
                </div>
                <Link href="/progress/photos" className="progress-mini-action focus-ring">
                  ADD PHOTOS
                </Link>
              </div>
            </Card>
            <Card className="progress-next-card progress-next-card--muted p-16">
              <div className="row start">
                <div className="row start" style={{ gap: 12 }}>
                  <span className="icon" aria-hidden="true">
                    assignment
                  </span>
                  <div className="body-md" style={{ color: "var(--text-secondary)" }}>
                    WEEKLY CHECK-IN
                  </div>
                </div>
                <div className="caption">Next: ~3 min flow</div>
              </div>
            </Card>
          </div>
        </section>

        <div className="progress-fixed-cta">
          <PrimaryButton href="/progress" className="focus-ring">
            VIEW PROGRESS
          </PrimaryButton>
        </div>
      </main>
    </Screen>
  );
}
