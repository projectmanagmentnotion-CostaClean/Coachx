"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";
import type { CoachActionTargetType, CoachActionType } from "@/lib/supabase/database.types";

export interface CoachActionButtonConfig {
  label: string;
  actionType: CoachActionType;
  status?: string;
}

export function CoachActionPanel({
  athleteId,
  targetType,
  targetId,
  actions,
  noteLabel = null,
  notePlaceholder = "Add a short coach note"
}: {
  athleteId: string;
  targetType: CoachActionTargetType;
  targetId: string;
  actions: CoachActionButtonConfig[];
  noteLabel?: string | null;
  notePlaceholder?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitAction(action: CoachActionButtonConfig) {
    setLoadingAction(action.actionType);
    setError(null);

    try {
      const response = await fetch(`/api/coach/athletes/${athleteId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          actionType: action.actionType,
          status: action.status,
          note: note.trim() ? note.trim() : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Coach action failed (${response.status}).`);
      }

      setNote("");
      publishFeedbackSuccess("coach.review", "Coach action saved", "The athlete record reflects your review.");
      router.refresh();
    } catch (submitError) {
      publishFeedbackError("coach.review", "Coach action could not be saved", "The athlete record is unchanged.");
      setError(submitError instanceof Error ? submitError.message : "Coach action failed.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <Card className="p-16" style={{ background: "var(--background-charcoal)" }}>
      <div className="eyebrow">Coach actions</div>
      {noteLabel ? (
        <label className="stack" style={{ gap: 8, marginTop: 12 }}>
          <span className="caption">{noteLabel}</span>
          <textarea
            className="coach-note-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={notePlaceholder}
            rows={3}
          />
        </label>
      ) : null}

      <div className="stack" style={{ gap: 10, marginTop: 12 }}>
        {actions.map((action) => (
          <PrimaryButton key={action.actionType} className="focus-ring" onClick={() => void submitAction(action)} disabled={loadingAction !== null}>
            {loadingAction === action.actionType ? "Saving..." : action.label}
          </PrimaryButton>
        ))}
        <SecondaryButton className="focus-ring" onClick={() => setNote("")} disabled={!note.trim()}>
          Clear note
        </SecondaryButton>
      </div>

      {error ? (
        <p className="caption" style={{ marginTop: 10, color: "var(--accent-primary)" }}>
          {error}
        </p>
      ) : null}
    </Card>
  );
}
