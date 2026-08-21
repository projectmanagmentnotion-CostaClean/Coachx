"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAuthStore } from "@/components/auth-provider";
import { mapAuthErrorMessage } from "@/lib/auth/auth-errors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => password.length >= 8 && password === confirmPassword, [confirmPassword, password]);

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      setStatus("Open the reset link from your email to continue.");
    }
  }, [auth.loading, auth.user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    if (password !== confirmPassword) {
      setSubmitting(false);
      setStatus("Passwords do not match.");
      return;
    }

    const error = await auth.updatePassword(password);
    setSubmitting(false);

    if (error) {
      setStatus(mapAuthErrorMessage(error));
      return;
    }

    await auth.signOut();
    router.replace("/entry?auth=password-updated");
  }

  return (
    <Screen shellClassName="onboarding-shell" topbar={<header className="topbar center"><BrandLogo variant="full" width={156} alt="AthlexForce" /></header>}>
      <main className="content">
        <section className="section">
          <div className="eyebrow" style={{ color: "#b6ff00" }}>ACCOUNT RECOVERY</div>
          <h1 className="headline-xl" style={{ marginTop: 12 }}>Choose a new password</h1>
          <p className="body-lg muted" style={{ marginTop: 12 }}>
            Set a new password for your AthlexForce account.
          </p>
        </section>

        <section className="section">
          <Card className="p-16 onboarding-callout">
            <form className="stack" onSubmit={handleSubmit}>
              <label className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">New password</span>
                <input className="input-field focus-ring" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              </label>
              <label className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">Confirm password</span>
                <input className="input-field focus-ring" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
              </label>
              <PrimaryButton className="focus-ring" type="submit" disabled={submitting || !canSubmit}>
                {submitting ? "Saving..." : "Update password"}
              </PrimaryButton>
              {status ? <p className="caption" style={{ marginTop: 4 }}>{status}</p> : null}
            </form>
          </Card>
        </section>

        <div className="page-cta">
          <SecondaryButton className="focus-ring" onClick={() => router.back()}>Back</SecondaryButton>
          <Link href="/entry" className="button-primary focus-ring">Back to sign in</Link>
        </div>
      </main>
    </Screen>
  );
}

