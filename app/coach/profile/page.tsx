import { CoachPanelShell } from "@/components/coach-panel-shell";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Card, Section } from "@/components/ui";
import { loadCoachSessionContext } from "@/lib/coach/coach-auth-service";

export default async function CoachProfilePage() {
  const session = await loadCoachSessionContext();
  if (!session?.isCoach) {
    return (
      <CoachPanelShell activeTab="profile">
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

  return (
    <CoachPanelShell activeTab="profile">
      <section className="section">
        <div className="profile-identity">
          <RemoteAvatar
            name={session.coachProfile?.display_name ?? "Coach"}
            avatarPath={session.coachProfile?.avatar_path ?? null}
            size={56}
            className="profile-avatar"
          />
          <div className="profile-identity__copy">
            <div className="eyebrow">Coach profile</div>
            <h1 className="headline-md">{session.coachProfile?.display_name ?? "Coach"}</h1>
            <p className="caption profile-identity__context">Coach · {session.coachProfile?.status ?? "active"}</p>
          </div>
        </div>
      </section>

      <Section title="Access">
        <div className="grid-2">
          <Card className="p-16">
            <div className="eyebrow">Role</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              Coach
            </div>
          </Card>
          <Card className="p-16">
            <div className="eyebrow">State</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
              {session.coachProfile?.status ?? "active"}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Notes">
        <Card className="p-16">
          <p className="caption" style={{ lineHeight: 1.6 }}>
            This slice only establishes the foundation. Invitations, communication, and broader coach management come later.
          </p>
        </Card>
      </Section>
    </CoachPanelShell>
  );
}
