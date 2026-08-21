import Link from "next/link";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { CoachActionPanel } from "@/components/coach-action-panel";
import { Card, Section } from "@/components/ui";
import { getWeeklyCheckinQuestion } from "@/lib/checkin-data";
import { loadCoachAthleteDetail } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export const dynamic = "force-dynamic";

export default async function CoachAthleteCheckInsPage({ params }: { params: Promise<{ athleteId: string }> }) {
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

  const latestCheckIn = detail.latestWeeklyCheckin;

  return (
    <CoachPanelShell activeTab="reviews">
      <section className="section">
        <div className="eyebrow">Check-in review</div>
        <h1 className="headline-lg" style={{ marginTop: 8 }}>
          {detail.summary.displayName}
        </h1>
        <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Latest submitted weekly check-in and review context.
        </p>
      </section>

      {latestCheckIn ? (
        <>
          <Section title="Latest check-in" meta={`${latestCheckIn.status} · ${latestCheckIn.week_start_date} to ${latestCheckIn.week_end_date}`}>
            <div className="stack">
              {detail.latestWeeklyCheckinResponses.map((response) => {
                const question = getWeeklyCheckinQuestion(response.question_key);
                return (
                  <Card key={response.id} className="p-16">
                    <div className="eyebrow">{question?.title ?? response.question_key}</div>
                    <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                      {response.text_value ?? response.choice_value ?? response.numeric_value ?? response.boolean_value?.toString() ?? "—"}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>

          <Section title="Deterministic review">
            <Card className="p-16">
              <div className="eyebrow">Summary</div>
              <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                {detail.latestWeeklyCheckinReview?.recommendation_type ?? "none"}
              </div>
              <div className="caption" style={{ marginTop: 8 }}>
                {detail.latestWeeklyCheckinReview?.status ?? "pending"}
              </div>
            </Card>
          </Section>

          <Section title="Coach note">
            <CoachActionPanel
              athleteId={athleteId}
              targetType="weekly_checkin"
              targetId={latestCheckIn.id}
              noteLabel="Add a coach note or review context"
              actions={[
                { label: "Mark reviewed", actionType: "checkin_reviewed", status: "reviewed" },
                { label: "Acknowledge", actionType: "checkin_acknowledged", status: "acknowledged" },
                { label: "Needs follow-up", actionType: "followup_requested", status: "needs_attention" }
              ]}
            />
          </Section>
        </>
      ) : (
        <Section title="Latest check-in">
          <Card className="p-16">
            <p className="caption">No weekly check-in is available for this athlete yet.</p>
          </Card>
        </Section>
      )}

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
