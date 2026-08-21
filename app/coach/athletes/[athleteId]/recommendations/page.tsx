import Link from "next/link";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { CoachActionPanel } from "@/components/coach-action-panel";
import { Card, Section } from "@/components/ui";
import { loadCoachAthleteDetail } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export const dynamic = "force-dynamic";

export default async function CoachAthleteRecommendationsPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
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

  const detail = await loadCoachAthleteDetail(session.client, session.userId, athleteId).catch(() => null);
  if (!detail) {
    return (
      <CoachPanelShell activeTab="reviews">
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">Athlete unavailable</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              This athlete is not assigned to you
            </h1>
          </Card>
        </section>
      </CoachPanelShell>
    );
  }

  return (
    <CoachPanelShell activeTab="reviews">
      <section className="section">
        <div className="eyebrow">Recommendation review</div>
        <h1 className="headline-lg" style={{ marginTop: 8 }}>
          {detail.summary.displayName}
        </h1>
        <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Review recommendation state and any proposal records that already exist.
        </p>
      </section>

      <Section title="Recommendations">
        <div className="stack">
          {detail.recentRecommendations.length > 0 ? (
            detail.recentRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="p-16">
                <div className="row start">
                  <div>
                    <div className="eyebrow">{recommendation.source === "openai" ? "Live insight" : "Saved insight"}</div>
                    <div className="headline-md" style={{ marginTop: 6 }}>
                      {recommendation.title}
                    </div>
                  </div>
                  <span className="progress-chip">{recommendation.applicationStatus}</span>
                </div>
                <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
                  {recommendation.summary}
                </p>
                <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                  {recommendation.payload.keySignals.slice(0, 3).map((signal: string) => (
                    <span key={signal} className="progress-chip">
                      {signal}
                    </span>
                  ))}
                </div>
                <CoachActionPanel
                  athleteId={athleteId}
                  targetType="recommendation"
                  targetId={recommendation.id}
                  actions={[
                    { label: "Approve recommendation", actionType: "recommendation_approved", status: "reviewing" },
                    { label: "Reject recommendation", actionType: "recommendation_rejected", status: "rejected" }
                  ]}
                />
              </Card>
            ))
          ) : (
            <Card className="p-16">
              <p className="caption">No recommendations are available for this athlete yet.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title="Program change proposals">
        <div className="stack">
          {detail.recentProposals.length > 0 ? (
            detail.recentProposals.map((proposal) => (
              <Card key={proposal.id} className="p-16">
                <div className="row start">
                  <div>
                    <div className="eyebrow">{proposal.changeType.replaceAll("_", " ")}</div>
                    <div className="headline-md" style={{ marginTop: 6 }}>
                      {proposal.beforeSnapshot.headline}
                    </div>
                  </div>
                  <span className="progress-chip">{proposal.status}</span>
                </div>
                <div className="grid-2" style={{ marginTop: 12 }}>
                  <Card className="p-16">
                    <div className="caption">Before</div>
                    <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                      {proposal.beforeSnapshot.subheadline}
                    </div>
                  </Card>
                  <Card className="p-16">
                    <div className="caption">After</div>
                    <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                      {proposal.afterSnapshot.subheadline}
                    </div>
                  </Card>
                </div>
                <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
                  {proposal.reason}
                </p>
                <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                  {proposal.validationResult.messages.map((message) => (
                    <span key={message} className="progress-chip">
                      {message}
                    </span>
                  ))}
                </div>
                <CoachActionPanel
                  athleteId={athleteId}
                  targetType="proposal"
                  targetId={proposal.id}
                  actions={[
                    { label: "Approve proposal", actionType: "proposal_approved", status: "approved" },
                    { label: "Reject proposal", actionType: "proposal_rejected", status: "rejected" }
                  ]}
                />
              </Card>
            ))
          ) : (
            <Card className="p-16">
              <p className="caption">No program change proposals are available yet.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title="Navigation">
        <div className="stack">
          <Link className="list-card focus-ring" href={`/coach/athletes/${athleteId}`}>
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Back to athlete
              </div>
              <div className="caption">Return to the bounded athlete summary.</div>
            </div>
          </Link>
        </div>
      </Section>
    </CoachPanelShell>
  );
}
