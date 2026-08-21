"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAuthStore } from "@/components/auth-provider";
import { mapAuthErrorMessage } from "@/lib/auth/auth-errors";

export default function ForgotPasswordPage() {
  const auth = useAuthStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    const error = await auth.requestPasswordReset(email);
    setSubmitting(false);
    setStatus(error ? mapAuthErrorMessage(error) : "Check your inbox for the reset link.");
  }

  return (
    <Screen shellClassName="onboarding-shell" topbar={<header className="topbar center"><BrandLogo variant="full" width={156} alt="AthlexForce" /></header>}>
      <main className="content">
        <section className="section">
          <div className="eyebrow" style={{ color: "#b6ff00" }}>ACCOUNT RECOVERY</div>
          <h1 className="headline-xl" style={{ marginTop: 12 }}>Reset your password</h1>
          <p className="body-lg muted" style={{ marginTop: 12 }}>
            We&apos;ll send a secure reset link to your email address.
          </p>
        </section>

        <section className="section">
          <Card className="p-16 onboarding-callout">
            <form className="stack" onSubmit={handleSubmit}>
              <label className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">Email</span>
                <input className="input-field focus-ring" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <PrimaryButton className="focus-ring" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </PrimaryButton>
              {status ? <p className="caption" style={{ marginTop: 4 }}>{status}</p> : null}
            </form>
          </Card>
        </section>

        <div className="page-cta">
          <SecondaryButton className="focus-ring" onClick={() => window.history.back()}>Back</SecondaryButton>
          <Link href="/entry" className="button-primary focus-ring">Back to sign in</Link>
        </div>
      </main>
    </Screen>
  );
}

