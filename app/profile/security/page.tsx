"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/components/auth-provider";
import { useTranslator } from "@/components/locale-provider";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton } from "@/components/ui";

export default function ProfileSecurityPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const { t } = useTranslator();

  return (
    <Screen
      activeTab="profile"
      shellClassName="screen-shell"
      topbar={
        <header className="topbar center">
          <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
            {t("profile.security")}
          </div>
        </header>
      }
    >
      <main className="content tight">
        <section className="section">
          <Card className="p-16">
            <div className="stack" style={{ gap: 12 }}>
              <div>
                <div className="eyebrow">{t("profile.signedInAs")}</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {auth.user?.email ?? t("common.noData")}
                </div>
                <p className="caption" style={{ marginTop: 8 }}>
                  {t("profile.securityDetail")}
                </p>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <Link href="/profile" className="button-secondary focus-ring" style={{ width: "100%" }}>
                  {t("common.profile")}
                </Link>
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
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">{t("profile.security")}</div>
            <p className="caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {t("profile.securityDetail")}
            </p>
          </Card>
        </section>

        <PrimaryButton href="/profile" className="focus-ring">
          {t("common.back")}
        </PrimaryButton>
      </main>
    </Screen>
  );
}
