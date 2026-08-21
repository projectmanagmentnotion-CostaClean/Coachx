"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui";
import { useAuthStore } from "@/components/auth-provider";
import { RemoteAvatar } from "@/components/remote-avatar";
import { useTranslator } from "@/components/locale-provider";
import { useProfileSettingsStore } from "@/components/profile-settings-provider";
import { useProgramStore } from "@/components/program-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadMyCoachRelationship, type CoachRelationshipSummary } from "@/lib/coach/coach-relationship-service";
import { readIdentityIntent, writeWorkspacePreference } from "@/lib/auth/session-policy";
import type { CoachProfilesRow } from "@/lib/supabase/database.types";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuthStore();
  const { saved, pendingReview } = useProfileSettingsStore();
  const { program } = useProgramStore();
  const { t } = useTranslator();
  const [relationship, setRelationship] = useState<CoachRelationshipSummary | null>(null);
  const [isActiveCoach, setIsActiveCoach] = useState(false);
  const identityIntent = readIdentityIntent();

  useEffect(() => {
    let active = true;

    async function hydrateRelationship() {
      if (!auth.ready || !auth.user) {
        setRelationship(null);
        setIsActiveCoach(false);
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        setRelationship(null);
        setIsActiveCoach(false);
        return;
      }

      const [relationshipResult, coachResult] = await Promise.all([
        loadMyCoachRelationship(client).catch(() => null),
        client.from("coach_profiles").select("id,status").eq("user_id", auth.user.id).maybeSingle()
      ]);

      if (!active) {
        return;
      }

      const coachProfile = coachResult.data as CoachProfilesRow | null;
      setIsActiveCoach(Boolean(coachProfile && coachProfile.status === "active"));

      setRelationship(relationshipResult);
    }

    void hydrateRelationship();

    return () => {
      active = false;
    };
  }, [auth.ready, auth.user?.id]);

  return (
    <Screen
      activeTab="profile"
      shellClassName="screen-shell"
      topbar={
        <header className="topbar center">
          <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
            {t("profile.hubTitle")}
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <div className="profile-identity">
            <RemoteAvatar name={saved.profile.name} avatarPath={saved.profile.avatarPath ?? null} size={56} className="profile-avatar" />
            <div className="profile-identity__copy">
              <h1 className="headline-md">{saved.profile.name}</h1>
              <p className="caption profile-identity__context">
                {t("common.profile")} · {program?.phaseLabel ?? t("program.overview")}
              </p>
              {auth.user?.email ? (
                <p className="caption profile-identity__email">
                  {t("profile.signedInAs")} {auth.user.email}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="row">
              <div>
                <div className="eyebrow">{t("profile.currentPlan")}</div>
                <h2 className="headline-md" style={{ marginTop: 6 }}>
                  {saved.goals.mainGoal}
                </h2>
              </div>
              <span className="pill">{program?.status === "active" ? t("profile.active") : t("profile.proposed")}</span>
            </div>
            <div className="grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="headline-md">{saved.trainingPreferences.daysPerWeek}</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>
                  {t("profile.daysPerWeek")}
                </div>
              </div>
              <div>
                <div className="headline-md">{saved.trainingPreferences.duration}</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>
                  {t("profile.duration")}
                </div>
              </div>
              <div>
                <div className="headline-md">{saved.trainingPreferences.location}</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>
                  {t("profile.location")}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{t("profile.workspaceMode")}</div>
              {relationship ? (
                <div className="stack" style={{ gap: 10 }}>
                  <div>
                    <div className="body-md" style={{ fontWeight: 700 }}>
                      {t("profile.coachManaged")}
                    </div>
                    <p className="caption" style={{ marginTop: 6 }}>
                      {t("profile.coachConnected")}
                    </p>
                  </div>
                  <div className="row start">
                    <RemoteAvatar
                      name={relationship.coachDisplayName}
                      avatarPath={relationship.coachAvatarPath}
                      size={44}
                      className="profile-avatar"
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="body-md" style={{ fontWeight: 700 }}>
                        {relationship.coachDisplayName}
                      </div>
                      <p className="caption">{t("profile.yourCoach")}</p>
                    </div>
                  </div>
                  <p className="caption">{t("profile.planSupervised")}</p>
                  {isActiveCoach ? (
                    <button
                      type="button"
                      className="button-secondary focus-ring"
                      onClick={() => {
                        writeWorkspacePreference("coach");
                        router.push("/coach");
                      }}
                    >
                      {t("profile.openCoachWorkspace")}
                    </button>
                  ) : null}
                </div>
              ) : identityIntent === "coach_managed" ? (
                <div className="stack" style={{ gap: 10 }}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {t("profile.coachManaged")}
                  </div>
                  <p className="caption">{t("profile.coachPending")}</p>
                  <p className="caption">{t("profile.planSupervised")}</p>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {t("profile.selfManaged")}
                  </div>
                  <p className="caption">{t("profile.hubDetail")}</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="section stack">
          <Link href="/profile/preferences" className="focus-ring">
            <Card className="p-16">
              <div className="row start">
                <div>
                  <div className="eyebrow">{t("profile.profileEditing")}</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {t("profile.profileEditing")}
                  </div>
                </div>
                <span className="icon" aria-hidden="true">
                  chevron_right
                </span>
              </div>
            </Card>
          </Link>

          <Link href="/profile/notifications" className="focus-ring">
            <Card className="p-16">
              <div className="row start">
                <div>
                  <div className="eyebrow">{t("profile.notifications")}</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {t("profile.notifications")}
                  </div>
                </div>
                <span className="icon" aria-hidden="true">
                  chevron_right
                </span>
              </div>
            </Card>
          </Link>

          <Link href="/program" className="focus-ring">
            <Card className="p-16">
              <div className="row start">
                <div>
                  <div className="eyebrow">{t("profile.programOverview")}</div>
                  <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                    {t("profile.programOverview")}
                  </div>
                </div>
                <span className="icon" aria-hidden="true">
                  chevron_right
                </span>
              </div>
            </Card>
          </Link>
        </section>

        <section className="section">
          <Card className="elevated p-16">
            <div className="row start">
              <div>
                <div className="eyebrow">{t("profile.hubTitle")}</div>
                <p className="body-md" style={{ marginTop: 6, color: "var(--text-secondary)" }}>
                  {t("profile.hubDetail")}
                </p>
                {pendingReview ? (
                  <p className="caption" style={{ marginTop: 10 }}>
                    Pending review: {pendingReview.title}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </section>

        <div className="stack">
          <Link href="/profile/preferences" className="button-secondary focus-ring" style={{ width: "100%" }}>
            {t("common.openSettings")}
          </Link>
          <Link href="/profile/security" className="button-secondary focus-ring" style={{ width: "100%" }}>
            {t("profile.security")}
          </Link>
          {isActiveCoach ? (
            <button
              type="button"
              className="button-secondary focus-ring"
              style={{ width: "100%" }}
              onClick={() => {
                writeWorkspacePreference("coach");
                router.push("/coach");
              }}
            >
              {t("profile.openCoachWorkspace")}
            </button>
          ) : null}
          {auth.isConfigured ? (
            <button
              className="button-secondary focus-ring"
              type="button"
              onClick={async () => {
                await auth.signOut();
                router.push("/entry");
              }}
              style={{ width: "100%" }}
            >
              {t("common.signOut")}
            </button>
          ) : null}
        </div>
      </main>
    </Screen>
  );
}
