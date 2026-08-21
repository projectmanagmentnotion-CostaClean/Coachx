"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/components/auth-provider";
import { RemoteAvatar } from "@/components/remote-avatar";
import { useTranslator } from "@/components/locale-provider";
import { useProfileSettingsStore } from "@/components/profile-settings-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { writeWorkspacePreference } from "@/lib/auth/session-policy";
import type { CoachProfilesRow } from "@/lib/supabase/database.types";

export function AppMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthStore();
  const { saved } = useProfileSettingsStore();
  const { t } = useTranslator();
  const [isCoach, setIsCoach] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    sheetRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    let active = true;

    async function hydrateCoachState() {
      if (!open || !auth.user?.id) {
        setIsCoach(false);
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        setIsCoach(false);
        return;
      }

      const { data } = await client.from("coach_profiles").select("id,status").eq("user_id", auth.user.id).maybeSingle();
      if (!active) {
        return;
      }

      const coachProfile = data as CoachProfilesRow | null;
      setIsCoach(Boolean(coachProfile && coachProfile.status === "active"));
    }

    void hydrateCoachState();

    return () => {
      active = false;
    };
  }, [auth.user?.id, open]);

  const coachItems = useMemo(
    () =>
      isCoach
        ? [
            { href: "/coach", label: t("coach.dashboard"), detail: t("coach.quickLinks") },
            { href: "/coach/profile", label: t("coach.profile"), detail: t("coach.profileDetail") }
          ]
        : [],
    [isCoach, t]
  );

  const primaryItems = [
    { href: "/", label: t("nav.today"), icon: "today" },
    { href: "/calendar", label: t("nav.calendar"), icon: "calendar_today" },
    { href: "/nutrition", label: t("nav.nutrition"), icon: "restaurant" },
    { href: "/progress", label: t("nav.progress"), icon: "insights" },
    { href: "/program", label: t("common.program"), icon: "view_agenda" }
  ];

  const secondaryItems = [
    { href: "/profile", label: t("common.profile"), detail: t("profile.hubDetail") },
    { href: "/profile/preferences", label: t("common.settings"), detail: t("profile.settingsDetail") },
    { href: "/profile/notifications", label: t("common.notifications"), detail: t("profile.notificationsDetail") },
    { href: "/profile/security", label: t("profile.security"), detail: t("profile.securityDetail") }
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="app-menu" role="presentation">
      <button aria-label="Close menu" className="app-menu__backdrop" onClick={onClose} type="button" />
      <aside aria-labelledby="app-menu-title" aria-modal="true" className="app-menu__sheet" ref={sheetRef} role="dialog" tabIndex={-1}>
        <div className="app-menu__header">
          <div className="app-menu__brand">
            <div className="app-menu__title-row">
              <div className="eyebrow" id="app-menu-title" style={{ color: "#c6c6c7" }}>
                ATHLEXFORCE
              </div>
              <button className="tap-target focus-ring app-menu__close" onClick={onClose} type="button" aria-label="Close menu">
                <span className="icon" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          <div className="app-menu__profile">
            <RemoteAvatar name={saved.profile.name} avatarPath={saved.profile.avatarPath ?? null} size={48} className="profile-avatar" />
            <div style={{ minWidth: 0 }}>
              <div className="body-md" style={{ fontWeight: 700 }}>
                {saved.profile.name}
              </div>
              <div className="caption" style={{ marginTop: 4 }}>
                  {auth.user?.email ?? t("auth.signedInAthlete")}
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="app-menu__body">
          <div className="app-menu__section">
            <div className="eyebrow">{t("common.primary")}</div>
            <div className="app-menu__list">
              {primaryItems.map((item) => (
                <Link key={item.href} className="app-menu__item focus-ring" href={item.href} onClick={onClose}>
                  <span className="icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="app-menu__section">
            <div className="eyebrow">{t("common.secondary")}</div>
            <div className="app-menu__list">
              {secondaryItems.map((item) => (
                <Link key={item.href} className="app-menu__item app-menu__item--stack focus-ring" href={item.href} onClick={onClose}>
                  <span className="body-md" style={{ fontWeight: 700 }}>
                    {item.label}
                  </span>
                  <span className="caption">{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="app-menu__section">
            <div className="eyebrow">{t("common.switchWorkspace")}</div>
            <div className="app-menu__list">
              <button
                type="button"
                className={`app-menu__item focus-ring ${!pathname.startsWith("/coach") ? "is-current" : ""}`.trim()}
                onClick={() => {
                  writeWorkspacePreference("athlete");
                  onClose();
                  router.push("/");
                }}
              >
                <span className="icon" aria-hidden="true">
                  fitness_center
                </span>
                <span>{t("common.athleteWorkspace")}</span>
              </button>
              {isCoach ? (
                <button
                  type="button"
                  className={`app-menu__item focus-ring ${pathname.startsWith("/coach") ? "is-current" : ""}`.trim()}
                  onClick={() => {
                    writeWorkspacePreference("coach");
                    onClose();
                    router.push("/coach");
                  }}
                >
                  <span className="icon" aria-hidden="true">
                    admin_panel_settings
                  </span>
                  <span>{t("common.coachWorkspace")}</span>
                </button>
              ) : null}
            </div>
          </div>

        {coachItems.length > 0 ? (
          <div className="app-menu__section">
            <div className="eyebrow">{t("coach.dashboardTitle")}</div>
            <div className="app-menu__list">
              {coachItems.map((item) => (
                  <Link key={item.href} className="app-menu__item app-menu__item--stack focus-ring" href={item.href} onClick={onClose}>
                    <span className="body-md" style={{ fontWeight: 700 }}>
                      {item.label}
                    </span>
                    <span className="caption">{item.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="app-menu__footer">
          <button
            className="button-secondary focus-ring"
            type="button"
            onClick={async () => {
              await auth.signOut();
              onClose();
              router.push("/entry");
            }}
          >
            {t("common.signOut")}
          </button>
        </div>
      </aside>
    </div>
  );
}
