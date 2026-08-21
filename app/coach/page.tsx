import Link from "next/link";
import { cookies } from "next/headers";
import { RemoteAvatar } from "@/components/remote-avatar";
import { CoachPanelShell } from "@/components/coach-panel-shell";
import { Card, PrimaryButton, Section, StatTile } from "@/components/ui";
import { loadCoachDashboard } from "@/lib/coach/coach-dashboard-service";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";
import { getInitialLocale, getTranslation, localeCookieName, type Locale } from "@/lib/i18n";

function AccessDenied({ locale, pending }: { locale: Locale; pending: boolean }) {
  const t = (path: string) => getTranslation(locale, path);

  return (
    <CoachPanelShell activeTab="dashboard">
      <section className="section">
        <Card className="p-16">
          {pending ? (
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{t("coach.pendingRequestReceived")}</div>
              <h1 className="headline-lg" style={{ marginTop: 8 }}>
                {t("coach.pendingTitle")}
              </h1>
              <p className="caption" style={{ lineHeight: 1.6 }}>
                {t("coach.pendingCopy")}
              </p>
              <p className="caption">{t("coach.pendingRequestDetail")}</p>
              <div style={{ marginTop: 8 }}>
                <PrimaryButton href="/">{t("coach.pendingBackToAthlete")}</PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{t("coach.accessDeniedTitle")}</div>
              <h1 className="headline-lg" style={{ marginTop: 8 }}>
                {t("coach.dashboardTitle")}
              </h1>
              <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
                {t("coach.accessDeniedCopy")}
              </p>
              <div style={{ marginTop: 16 }}>
                <PrimaryButton href="/entry">{t("common.close")}</PrimaryButton>
              </div>
            </div>
          )}
        </Card>
      </section>
    </CoachPanelShell>
  );
}

export default async function CoachDashboardPage() {
  const cookieStore = await cookies();
  const locale = getInitialLocale(cookieStore.get(localeCookieName)?.value);
  const t = (path: string) => getTranslation(locale, path);
  const pendingCoachIntent = cookieStore.get("athlexforce-identity-intent")?.value === "coach";
  const session = await loadCoachSessionContext();
  if (!session?.isCoach) {
    return <AccessDenied locale={locale} pending={pendingCoachIntent} />;
  }

  const dashboard = await loadCoachDashboard(session.client, session.userId).catch(() => null);
  if (!dashboard) {
    return (
      <CoachPanelShell activeTab="dashboard">
        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">{t("coach.dashboardTitle")}</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              {t("coach.dataNotReadyTitle")}
            </h1>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {t("coach.dataNotReadyCopy")}
            </p>
          </Card>
        </section>
      </CoachPanelShell>
    );
  }

  const coachAvatarPath = session.coachProfile?.avatar_path ?? null;

  return (
    <CoachPanelShell activeTab="dashboard">
      <section className="section">
        <div className="row start">
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">{t("coach.dashboardTitle")}</div>
            <h1 className="headline-lg" style={{ marginTop: 8 }}>
              {dashboard.coachName}
            </h1>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {t("coach.assignedAthletesOnly")}
            </p>
          </div>
          <RemoteAvatar name={dashboard.coachName} avatarPath={coachAvatarPath} size={52} className="profile-avatar" />
        </div>
      </section>

      <Section title={t("coach.needsAttention")} meta={`${dashboard.attentionQueue.length} needing attention`}>
        <div className="grid-3">
          <Card className="p-16">
            <StatTile label="Athletes" value={String(dashboard.athletes.length)} meta="Assigned" />
          </Card>
          <Card className="p-16">
            <StatTile label="Reviews" value={String(dashboard.pendingReviews.length)} meta="Awaiting review" />
          </Card>
          <Card className="p-16">
            <StatTile label="Actions" value={String(dashboard.pendingRecommendations.length + dashboard.pendingProposals.length)} meta="Pending decisions" />
          </Card>
        </div>
      </Section>

      <Section title={t("coach.needsAttention")} meta="Deterministic triage">
        <div className="stack">
          {dashboard.attentionQueue.length > 0 ? (
            dashboard.attentionQueue.map((athlete) => (
              <Card key={athlete.athleteId} className="p-16">
                <div className="row start">
                  <div>
                    <div className="headline-md">{athlete.displayName}</div>
                    <p className="caption" style={{ marginTop: 6 }}>
                      {athlete.phaseLabel} · {athlete.goal}
                    </p>
                  </div>
                  <Link className="button-secondary focus-ring" href={`/coach/athletes/${athlete.athleteId}`}>
                    REVIEW
                  </Link>
                </div>
                <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                  {athlete.attentionReasons.slice(0, 3).map((reason) => (
                    <span key={reason} className="progress-chip">
                      {reason}
                    </span>
                  ))}
                </div>
                <p className="caption" style={{ marginTop: 10 }}>
                  Last activity: {athlete.lastActivityAt ?? "No recent activity"}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-16">
              <p className="caption">No athletes need attention right now.</p>
            </Card>
          )}
        </div>
      </Section>

      <Section title={t("coach.quickLinks")}>
        <div className="stack">
          <Link className="list-card focus-ring" href="/coach/athletes">
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Athletes
              </div>
              <div className="caption">Open the full assigned athlete list.</div>
            </div>
          </Link>
          <Link className="list-card focus-ring" href="/coach/reviews">
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Reviews
              </div>
              <div className="caption">Check-ins, recommendations, and proposals.</div>
            </div>
          </Link>
          <Link className="list-card focus-ring" href="/coach/profile">
            <div>
              <div className="body-md" style={{ fontWeight: 700 }}>
                Profile
              </div>
              <div className="caption">Coach profile and access details.</div>
            </div>
          </Link>
        </div>
      </Section>
    </CoachPanelShell>
  );
}
