"use client";

import Link from "next/link";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, Section } from "@/components/ui";
import { AnalyticsChartCard } from "@/components/analytics-chart";
import { ProgressImmersionCard } from "@/components/progress-immersion-card";
import { useTranslator } from "@/components/locale-provider";
import type { PerformanceAnalyticsDashboard } from "@/lib/performance-analytics";

interface ProgressTrendsScreenProps {
  dashboard: PerformanceAnalyticsDashboard;
  basePath: string;
}

function RangeSelector({ dashboard, basePath }: ProgressTrendsScreenProps) {
  return (
    <div className="analytics-range-row" role="tablist" aria-label={dashboard.copy.rangeLabel}>
      {Object.entries(dashboard.copy.rangeOptions).map(([rangeId, label]) => {
        const active = dashboard.range.id === rangeId;
        return (
          <Link
            key={rangeId}
            href={`${basePath}?range=${rangeId}`}
            className={`analytics-range-chip focus-ring ${active ? "active" : ""}`.trim()}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function ProgressTrendsScreen({ dashboard, basePath }: ProgressTrendsScreenProps) {
  const { t } = useTranslator();
  const hasData = dashboard.dataCoverage.workouts + dashboard.dataCoverage.progressEntries + dashboard.dataCoverage.nutritionDays + dashboard.dataCoverage.checkIns > 0;

  return (
    <Screen
      activeTab="progress"
      shellClassName="progress-analytics-shell"
      topbar={
        <header className="progress-trend-topbar analytics-topbar">
          <Link href="/progress" className="progress-trend-topbar__back focus-ring" aria-label={t("common.back")}>
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <div>
            <h1 className="headline-md">{dashboard.copy.title}</h1>
            <p className="caption" style={{ marginTop: 4 }}>
              {dashboard.copy.subtitle}
            </p>
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="row start">
            <div>
              <h1 className="headline-lg">{dashboard.copy.title}</h1>
              <p className="caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
                {dashboard.copy.subtitle}
              </p>
            </div>
            <Link href="/progress" className="progress-mini-action focus-ring">
              {dashboard.copy.heroLabel}
            </Link>
          </div>
        </section>

        <section className="section">
          <RangeSelector dashboard={dashboard} basePath={basePath} />
        </section>

        <section className="section">
          <ProgressImmersionCard
            immersion={dashboard.immersion}
            compact
            action={
              <div className="stack">
                <PrimaryButton href="/progress" className="focus-ring">
                  {dashboard.copy.heroLabel}
                </PrimaryButton>
                <Link href="/progress/phase-review" className="button-secondary focus-ring">
                  {dashboard.copy.nextFocusSection}
                </Link>
              </div>
            }
          />
        </section>

        <section className="section">
          <Card className="analytics-hero-card p-16 elevated" style={{ background: "var(--background-charcoal)" }}>
            <div className="row start" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {dashboard.copy.heroLabel}
                </div>
                <h2 className="headline-md" style={{ marginBottom: 8 }}>
                  {dashboard.statusLabel}
                </h2>
                <p className="body-md" style={{ lineHeight: 1.6 }}>
                  {dashboard.summary}
                </p>
              </div>
              <span className={`analytics-chip analytics-chip--${dashboard.status === "attention" ? "warning" : "accent"}`.trim()}>
                {dashboard.range.label}
              </span>
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="grid-2">
            {dashboard.metrics.map((metric) => (
              <Card key={metric.id} className={`analytics-metric-card p-16 ${metric.tone === "accent" ? "accent" : ""}`.trim()}>
                <div className="caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {metric.label}
                </div>
                <div className="headline-md" style={{ marginTop: 8 }}>
                  {metric.value}
                </div>
                <div className="caption" style={{ marginTop: 8, color: "var(--accent-primary)" }}>
                  {metric.delta}
                </div>
                <div className="caption" style={{ marginTop: 8, lineHeight: 1.5 }}>
                  {metric.detail}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="section">
          <AnalyticsChartCard
            title={dashboard.charts.training.title}
            subtitle={dashboard.charts.training.subtitle}
            unit={dashboard.charts.training.unit}
            series={dashboard.charts.training.series[0] ?? { id: "training-empty", label: dashboard.charts.training.title, unit: "kg", accent: "#B6FF00", points: [] }}
            pointsLabel={dashboard.copy.dataPoints}
            emptyTitle={dashboard.charts.training.emptyTitle}
            emptyCopy={dashboard.charts.training.emptyCopy}
            chartTone="accent"
          />
        </section>

        <section className="section">
          <div className="grid-2">
            <AnalyticsChartCard
              title={dashboard.charts.weight.title}
              subtitle={dashboard.charts.weight.subtitle}
              unit={dashboard.charts.weight.unit}
              series={dashboard.charts.weight.series[0] ?? { id: "weight-empty", label: dashboard.charts.weight.title, unit: "kg", accent: "#FFFFFF", points: [] }}
              pointsLabel={dashboard.copy.dataPoints}
              emptyTitle={dashboard.charts.weight.emptyTitle}
              emptyCopy={dashboard.charts.weight.emptyCopy}
            />
            <AnalyticsChartCard
              title={dashboard.charts.waist.title}
              subtitle={dashboard.charts.waist.subtitle}
              unit={dashboard.charts.waist.unit}
              series={dashboard.charts.waist.series[0] ?? { id: "waist-empty", label: dashboard.charts.waist.title, unit: "cm", accent: "#B6FF00", points: [] }}
              pointsLabel={dashboard.copy.dataPoints}
              emptyTitle={dashboard.charts.waist.emptyTitle}
              emptyCopy={dashboard.charts.waist.emptyCopy}
              chartTone="accent"
            />
          </div>
        </section>

        <section className="section">
          <div className="grid-2">
            <AnalyticsChartCard
              title={dashboard.charts.nutrition.title}
              subtitle={dashboard.charts.nutrition.subtitle}
              unit={dashboard.charts.nutrition.unit}
              series={dashboard.charts.nutrition.series[0] ?? { id: "nutrition-empty", label: dashboard.charts.nutrition.title, unit: "%", accent: "#FFFFFF", points: [] }}
              pointsLabel={dashboard.copy.dataPoints}
              emptyTitle={dashboard.charts.nutrition.emptyTitle}
              emptyCopy={dashboard.charts.nutrition.emptyCopy}
              targetValue={dashboard.immersion.targets.find((target) => target.kind === "nutrition_adherence")?.target ?? null}
              targetLabel={dashboard.immersion.targets.find((target) => target.kind === "nutrition_adherence")?.label ?? null}
              targetState={dashboard.immersion.targets.find((target) => target.kind === "nutrition_adherence")?.state ?? null}
            />
            <AnalyticsChartCard
              title={dashboard.charts.recovery.title}
              subtitle={dashboard.charts.recovery.subtitle}
              unit={dashboard.charts.recovery.unit}
              series={dashboard.charts.recovery.series[0] ?? { id: "recovery-empty", label: dashboard.charts.recovery.title, unit: "%", accent: "#FFFFFF", points: [] }}
              pointsLabel={dashboard.copy.dataPoints}
              emptyTitle={dashboard.charts.recovery.emptyTitle}
              emptyCopy={dashboard.charts.recovery.emptyCopy}
              chartTone="accent"
            />
          </div>
        </section>

        <Section title={dashboard.copy.coverageSection} meta={String(dashboard.dataCoverage.workouts + dashboard.dataCoverage.nutritionDays + dashboard.dataCoverage.progressEntries + dashboard.dataCoverage.checkIns)}>
          <div className="grid-2">
            <Card className="analytics-summary-card p-16">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {dashboard.copy.recentSessions}
              </div>
              <div className="stack">
                {dashboard.recentSessions.length > 0 ? (
                  dashboard.recentSessions.map((session) => (
                    <div key={`${session.label}-${session.detail}`}>
                      <div className="body-md" style={{ fontWeight: 700 }}>
                        {session.label}
                      </div>
                      <div className="caption" style={{ marginTop: 4 }}>
                        {session.detail}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="caption">{dashboard.copy.limitedHistory}</p>
                )}
              </div>
            </Card>

            <Card className="analytics-summary-card p-16">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {dashboard.copy.checkInSection}
              </div>
              <h3 className="body-md" style={{ fontWeight: 700 }}>
                {dashboard.recentCheckInLabel}
              </h3>
              <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
                {dashboard.recentCheckInSummary}
              </p>
              {dashboard.recentCheckInSignals.length > 0 ? (
                <div className="stack" style={{ marginTop: 12 }}>
                  {dashboard.recentCheckInSignals.slice(0, 4).map((signal) => (
                    <span key={signal} className="progress-chip">
                      {signal}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>
        </Section>

        {hasData ? null : (
          <section className="section">
            <Card className="analytics-empty p-16">
              <h3 className="body-md" style={{ fontWeight: 700 }}>
                {dashboard.copy.emptyTitle}
              </h3>
              <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
                {dashboard.copy.emptyCopy}
              </p>
            </Card>
          </section>
        )}

        <div className="stack">
          <PrimaryButton href="/progress" className="focus-ring">
            {dashboard.copy.heroLabel}
          </PrimaryButton>
          <Link href="/progress/phase-review" className="button-secondary focus-ring">
            {dashboard.copy.nextFocusSection}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
