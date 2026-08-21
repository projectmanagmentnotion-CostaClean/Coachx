"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { Screen } from "@/components/screen";
import { useProgramStore } from "@/components/program-provider";
import { useTranslator } from "@/components/locale-provider";

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="program-section-card">
      <div className="eyebrow">{title}</div>
      <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
        {children}
      </div>
    </Card>
  );
}

export default function ProgramPage() {
  const { program, loading, ready } = useProgramStore();
  const { t } = useTranslator();

  if (loading || !ready || !program) {
    return null;
  }

  return (
    <Screen
      activeTab={undefined}
      shellClassName="screen-shell"
      topbar={
        <header className="topbar center">
          <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
            {t("program.overview")}
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="eyebrow">{t("program.myProgram")}</div>
          <h1 className="headline-lg" style={{ marginTop: 6 }}>
            {program.phaseLabel} · {program.status.toUpperCase()}
          </h1>
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
          <SectionCard title={t("program.weeklyStructure")}>{program.weeklyStructure.join(" · ")}</SectionCard>
          <SectionCard title={t("program.workoutTemplates")}>{program.workoutTemplates.join(" · ")}</SectionCard>
          <SectionCard title={t("program.keyMovements")}>{program.keyMovements.join(" · ")}</SectionCard>
        </section>

        <section className="section stack">
          <SectionCard title={t("program.progression")}>{program.progressionSystem}</SectionCard>
          <SectionCard title={t("program.nutrition")}>{program.nutrition}</SectionCard>
          <SectionCard title={t("program.cardio")}>{program.cardio}</SectionCard>
          <SectionCard title={t("program.recovery")}>{program.recovery}</SectionCard>
          <SectionCard title={t("program.habits")}>{program.habits}</SectionCard>
          <SectionCard title={t("program.checkIn")}>{program.checkIn}</SectionCard>
          <SectionCard title={t("program.reviewTimeline")}>{program.baselineTimeline.join(" · ")}</SectionCard>
        </section>

        <section className="section stack">
          <Card className="program-section-card">
            <div className="eyebrow">{t("program.recentAdjustments")}</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {program.recentAdjustments.map((item) => (
                <div key={item} className="row">
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </Screen>
  );
}
