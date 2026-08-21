import Link from "next/link";
import { RemoteAvatar } from "@/components/remote-avatar";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { Card, PrimaryButton, Section } from "@/components/ui";
import { loadCoachAthleteDetail } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export const dynamic = "force-dynamic";

export default async function CoachAthleteDetailPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
  const session = await loadCoachSessionContext();
  if (!session?.isCoach) {
    return (
      <CoachPanelShell activeTab="athletes">
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">Access denied</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              Coach access required
            </h1>
          </Card>
        </section>
      </CoachPanelShell>
    );
  }

  const detail = await loadCoachAthleteDetail(session.client, session.userId, athleteId).catch(() => null);
  if (!detail) {
    return (
      <CoachPanelShell activeTab="athletes">
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">Athlete unavailable</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              This athlete is not assigned to you
            </h1>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Assigned athlete access is required before profile and review data can be shown.
            </p>
          </Card>
        </section>
      </CoachPanelShell>
    );
  }

  return (
    <CoachPanelShell activeTab="athletes">
      <section className="section">
        <div className="row start">
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">Athlete review</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              {detail.summary.displayName}
            </h1>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {detail.summary.phaseLabel} · {detail.summary.goal}
            </p>
          </div>
          <RemoteAvatar
            name={detail.summary.displayName}
            avatarPath={detail.athleteProfile?.avatar_path ?? detail.profileSnapshot.profile.avatarPath ?? null}
            size={52}
            className="profile-avatar"
          />
        </div>
      </section>

      <Section title="Profile">
        <div className="grid-2">
          <Card className="p-16">
            <div className="eyebrow">Goal</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {detail.profileSnapshot.goals.mainGoal}
            </div>
            <div className="caption" style={{ marginTop: 8 }}>
              Priority focus: {detail.profileSnapshot.goals.priorities.join(" · ")}
            </div>
          </Card>
          <Card className="p-16">
            <div className="eyebrow">Restrictions</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {detail.profileSnapshot.healthLimitations.coachReviewRequired ? "Coach review required" : "No active coach review flag"}
            </div>
            <div className="caption" style={{ marginTop: 8 }}>
              {detail.profileSnapshot.healthLimitations.currentPain ?? "No pain reported"}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Program">
        <div className="stack">
          {detail.activeProgram ? (
            <>
              <Card className="p-16">
                <div className="eyebrow">Current phase</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {detail.activeProgram.activePhase?.name ?? "No phase"}
                </div>
                <p className="caption" style={{ marginTop: 8 }}>
                  {detail.activeProgram.activeProgram?.status ?? "unknown"} · {detail.activeProgram.activeProgram?.goal ?? "No goal"}
                </p>
              </Card>
              <div className="grid-3">
                <Card className="p-16">
                  <div className="eyebrow">Workout</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {detail.activeProgram.scheduledWorkouts[0]?.scheduled_date ?? "No schedule"}
                  </div>
                </Card>
                <Card className="p-16">
                  <div className="eyebrow">Templates</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {detail.activeProgram.templates.length}
                  </div>
                </Card>
                <Card className="p-16">
                  <div className="eyebrow">History</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {detail.recentWorkoutSessions.length}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-16">
              <p className="caption">No active program is available for this athlete.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title="Training">
        <div className="grid-2">
          <Card className="p-16">
            <div className="eyebrow">Recent completion</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {detail.recentWorkoutSessions[0]?.status ?? "No recent session"}
            </div>
            <div className="caption" style={{ marginTop: 8 }}>
              {detail.recentWorkoutSessions[0]?.completed_at ?? detail.recentWorkoutSessions[0]?.started_at ?? "No timestamp"}
            </div>
          </Card>
          <Card className="p-16">
            <div className="eyebrow">Adherence</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {detail.summary.trainingAdherenceLabel ?? "No check-in yet"}
            </div>
            <div className="caption" style={{ marginTop: 8 }}>
              {detail.summary.nutritionAdherenceLabel ?? "Nutrition not yet reviewed"}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Nutrition">
        <Card className="p-16">
          <div className="eyebrow">Recent days</div>
          <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
            {detail.nutritionDays.length} day snapshot{detail.nutritionDays.length === 1 ? "" : "s"}
          </div>
          <div className="caption" style={{ marginTop: 8 }}>
            Latest target: {detail.nutritionDays[0]?.calorie_target ?? "—"} kcal
          </div>
        </Card>
      </Section>

      <Section title="Progress">
        <Card className="p-16">
          <div className="eyebrow">Latest trend</div>
          <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
            {detail.recentProgressEntries[0]?.entry_type ?? "No progress entry"}
          </div>
          <div className="caption" style={{ marginTop: 8 }}>
            {detail.recentProgressEntries[0]?.entry_date ?? "No entry date"} · {detail.recentProgressEntries[0]?.weight_kg ?? "—"} kg
          </div>
        </Card>
      </Section>

      <Section title="Actions">
        <div className="stack">
          <Link href={`/coach/athletes/${athleteId}/check-ins`} className="list-card focus-ring">
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Check-ins
              </div>
              <div className="caption">Review the latest submitted check-in.</div>
            </div>
          </Link>
          <Link href={`/coach/athletes/${athleteId}/recommendations`} className="list-card focus-ring">
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Recommendations
              </div>
              <div className="caption">Review recommendation and proposal records.</div>
            </div>
          </Link>
          <PrimaryButton href="/coach/athletes">Back to athletes</PrimaryButton>
        </div>
      </Section>
    </CoachPanelShell>
  );
}
