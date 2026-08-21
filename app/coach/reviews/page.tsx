import Link from "next/link";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { Card, Section } from "@/components/ui";
import { loadCoachDashboard } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export default async function CoachReviewsPage() {
  const session = await loadCoachSessionContext();
  if (!session?.isCoach) {
    return (
      <CoachPanelShell activeTab="reviews">
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
  if (!dashboard) {
    return (
      <CoachPanelShell activeTab="reviews">
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">Reviews unavailable</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              Review data is not ready yet
            </h1>
          </Card>
        </section>
      </CoachPanelShell>
    );
  }

  return (
    <CoachPanelShell activeTab="reviews">
      <section className="section">
        <div className="eyebrow">Review queue</div>
        <h1 className="headline-lg" style={{ marginTop: 8 }}>
          {dashboard.pendingReviews.length} check-in{dashboard.pendingReviews.length === 1 ? "" : "s"}
        </h1>
        <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Pending review items are grouped by athlete and attention state.
        </p>
      </section>

      <Section title="Needs review">
        <div className="stack">
          {dashboard.pendingReviews.length > 0 ? (
            dashboard.pendingReviews.map((athlete) => (
              <Link key={athlete.athleteId} href={`/coach/athletes/${athlete.athleteId}/check-ins`} className="list-card focus-ring">
                <div>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {athlete.displayName}
                  </div>
                  <div className="caption">{athlete.phaseLabel} · {athlete.latestCheckInLabel}</div>
                </div>
                <span className="progress-chip">{athlete.attentionReasons.length > 0 ? "Attention" : "Review"}</span>
              </Link>
            ))
          ) : (
            <Card className="p-16">
              <p className="caption">No check-ins need review right now.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title="Other queues">
        <div className="stack">
          <Card className="p-16">
            <div className="eyebrow">Recommendations</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {dashboard.pendingRecommendations.length}
            </div>
          </Card>
          <Card className="p-16">
            <div className="eyebrow">Proposals</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {dashboard.pendingProposals.length}
            </div>
          </Card>
        </div>
      </Section>
    </CoachPanelShell>
  );
}
