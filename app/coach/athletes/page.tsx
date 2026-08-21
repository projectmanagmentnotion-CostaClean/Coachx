import Link from "next/link";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { Card, Section } from "@/components/ui";
import { loadCoachDashboard } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export default async function CoachAthletesPage() {
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

  const dashboard = await loadCoachDashboard(session.client, session.userId).catch(() => null);
  const athletes = dashboard?.athletes ?? [];

  return (
    <CoachPanelShell activeTab="athletes">
      <section className="section">
        <div className="eyebrow">Assigned athletes</div>
        <h1 className="headline-lg" style={{ marginTop: 8 }}>
          {athletes.length} athlete{athletes.length === 1 ? "" : "s"}
        </h1>
        <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Only athletes assigned to this coach are shown here.
        </p>
      </section>

      <Section title="Athlete list" meta="All assigned athletes">
        <div className="stack">
          {athletes.length > 0 ? (
            athletes.map((athlete) => (
              <Link key={athlete.athleteId} href={`/coach/athletes/${athlete.athleteId}`} className="list-card focus-ring">
                <div style={{ flex: 1 }}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {athlete.displayName}
                  </div>
                  <div className="caption">{athlete.phaseLabel} · {athlete.goal}</div>
                  <div className="caption" style={{ marginTop: 6 }}>
                    {athlete.latestCheckInLabel} · {athlete.latestRecommendationStatus} · {athlete.latestProposalStatus}
                  </div>
                </div>
                <span className="progress-chip">{athlete.attentionReasons.length > 0 ? "Needs attention" : "Stable"}</span>
              </Link>
            ))
          ) : (
            <Card className="p-16">
              <p className="caption">No assigned athletes yet.</p>
            </Card>
          )}
        </div>
      </Section>
    </CoachPanelShell>
  );
}

