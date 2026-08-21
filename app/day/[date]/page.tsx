"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AnatomyPreview } from "@/components/anatomy-preview";
import { RemoteAvatar } from "@/components/remote-avatar";
import { useTranslator } from "@/components/locale-provider";
import { useProfileSettingsStore } from "@/components/profile-settings-provider";
import { useProgramStore } from "@/components/program-provider";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, Section } from "@/components/ui";

function resolveDateKey(param: string | string[] | undefined, fallback: string) {
  if (Array.isArray(param)) {
    return param[0] ?? fallback;
  }

  return param ?? fallback;
}

export default function DayDetailPage() {
  const params = useParams<{ date?: string | string[] }>();
  const { t } = useTranslator();
  const { saved } = useProfileSettingsStore();
  const { getDaySummary, selectedDateKey } = useProgramStore();
  const dateKey = resolveDateKey(params.date, selectedDateKey ?? "2026-08-08");
  const day = getDaySummary(dateKey);

  if (!day) {
    return null;
  }

  const monthDateKey = `${day.dateKey.slice(0, 7)}-01`;

  return (
    <Screen
      activeTab="today"
      shellClassName="screen-shell"
      topbar={
        <header className="topbar center">
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <RemoteAvatar
              name={saved.profile.name}
              avatarPath={saved.profile.avatarPath ?? null}
              size={32}
              className="profile-avatar profile-avatar--small"
            />
            <div style={{ textAlign: "left" }}>
              <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
                Day Detail
              </div>
              <div className="caption" style={{ marginTop: 2 }}>
                {saved.profile.name}
              </div>
            </div>
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="row start">
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {saved.profile.name}
              </div>
              <h1 className="headline-lg">{day.dateLabel}</h1>
              <p className="caption" style={{ marginTop: 8 }}>
                {day.phase} · {day.workoutTitle}
              </p>
            </div>
            <span className="pill">{day.duration}</span>
          </div>
        </section>

        <section className="section">
          <Card className="p-16 elevated" style={{ background: "var(--background-charcoal)" }}>
            <div className="row" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Workout focus</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {day.workoutTitle}
                </div>
              </div>
              <span className="accent" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {day.workoutType}
              </span>
            </div>

            <AnatomyPreview focus={day.muscleFocus} />

            <div className="grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="headline-md">{day.workoutCount}</div>
                <div className="caption" style={{ marginTop: 4 }}>
                  Session volume
                </div>
              </div>
              <div>
                <div className="headline-md">{day.duration}</div>
                <div className="caption" style={{ marginTop: 4 }}>
                  Total time
                </div>
              </div>
              <div>
                <div className="headline-md">{day.cardio}</div>
                <div className="caption" style={{ marginTop: 4 }}>
                  Cardio block
                </div>
              </div>
            </div>
          </Card>
        </section>

        <Section title="Workout" meta={day.primaryTarget}>
          <div className="stack">
            {day.movements.map((movement) => (
              <Link
                key={movement.name}
                href={day.scheduledWorkoutId ? `/workout/${day.scheduledWorkoutId}` : `/calendar?date=${day.dateKey}&month=${monthDateKey}`}
                className="list-card focus-ring"
              >
                <span className="icon accent filled" aria-hidden="true">
                  {movement.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {movement.name}
                  </div>
                  <div className="caption" style={{ marginTop: 4 }}>
                    {movement.prescription}
                  </div>
                </div>
                <span className="icon muted" aria-hidden="true">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Nutrition" meta={day.calendarLabel}>
          <Card className="p-16">
            <div className="row start">
              <div>
                <div className="eyebrow">Calories</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {day.nutritionCalories}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>
                  {day.macros}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="eyebrow">Habits</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {day.habits}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href={`/nutrition?date=${day.dateKey}`} className="workout-secondary-button focus-ring">
                Open Nutrition
              </Link>
            </div>
          </Card>
        </Section>

        <Section title="Coach insight" meta="Session cues">
          <Card className="p-16">
            <p className="body-md" style={{ color: "var(--text-secondary)" }}>
              {day.coachInsight}
            </p>
          </Card>
        </Section>

        <div className="stack">
          {day.isRestDay ? (
            <PrimaryButton href={`/calendar?date=${day.dateKey}&month=${monthDateKey}`} className="focus-ring">
              Add Workout
            </PrimaryButton>
          ) : (
            <PrimaryButton href={`/workout/${day.scheduledWorkoutId}`} className="focus-ring">
              Start Workout
            </PrimaryButton>
          )}
          {!day.isRestDay ? (
            <Link href={`/calendar?date=${day.dateKey}&month=${monthDateKey}`} className="workout-secondary-button focus-ring">
              Move Workout
            </Link>
          ) : null}
          <Link href="/calendar" className="workout-secondary-button focus-ring">
            {t("common.back")} {t("common.calendar")}
          </Link>
        </div>
      </main>
    </Screen>
  );
}
