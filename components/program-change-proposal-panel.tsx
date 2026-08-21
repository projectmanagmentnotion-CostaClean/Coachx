"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useProgramStore } from "@/components/program-provider";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";
import type { CoachRecommendationRecordView } from "@/lib/ai/schemas";
import {
  buildProgramChangeCommandOptions,
  proposalStatusLabel,
  type ProgramChangeCommand,
  type ProgramChangeProposalRecordView
} from "@/lib/recommendations/change-proposal-service";

type RecommendationContextType = "phase_review" | "profile_review";

function SnapshotCard({
  label,
  snapshot
}: {
  label: string;
  snapshot: ProgramChangeProposalRecordView["beforeSnapshot"] | ProgramChangeProposalRecordView["afterSnapshot"];
}) {
  return (
    <Card className="p-16" style={{ background: "var(--background-charcoal)" }}>
      <div className="eyebrow">{label}</div>
      <div className="headline-md" style={{ marginTop: 8, textTransform: "uppercase" }}>
        {snapshot.headline}
      </div>
      <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
        {snapshot.subheadline}
      </div>
      {snapshot.details.length > 0 ? (
        <ul className="progress-dialog-list" style={{ marginTop: 10 }}>
          {snapshot.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <div className="progress-review-grid" style={{ marginTop: 12 }}>
        {snapshot.metrics.map((metric) => (
          <Card key={metric.label} className="p-16">
            <div className="caption">{metric.label.toUpperCase()}</div>
            <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
              {metric.value}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function ChoiceChip({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={`progress-choice-chip ${active ? "active" : ""}`.trim()} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function ProgramChangeProposalPanel({
  contextKey,
  contextType = "phase_review",
  title = "Structured recommendation"
}: {
  contextKey: string;
  contextType?: RecommendationContextType;
  title?: string;
}) {
  const { bundle, reloadProgram } = useProgramStore();
  const [recommendation, setRecommendation] = useState<CoachRecommendationRecordView | null>(null);
  const [proposal, setProposal] = useState<ProgramChangeProposalRecordView | null>(null);
  const [selectedCommandType, setSelectedCommandType] = useState<ProgramChangeCommand["type"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => `/api/coach/recommendations?contextType=${encodeURIComponent(contextType)}&contextKey=${encodeURIComponent(contextKey)}`,
    [contextKey, contextType]
  );

  const commandOptions = useMemo(() => buildProgramChangeCommandOptions(bundle, recommendation), [bundle, recommendation]);
  const selectedOption = useMemo(
    () => commandOptions.find((option) => option.command.type === selectedCommandType) ?? commandOptions[0] ?? null,
    [commandOptions, selectedCommandType]
  );
  const payload = recommendation?.payload ?? null;

  useEffect(() => {
    let active = true;

    async function loadRecommendation() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Unable to load recommendation (${response.status}).`);
        }

      const data = (await response.json()) as { recommendation: CoachRecommendationRecordView | null };
      if (!active) {
        return;
      }

      setRecommendation(data.recommendation ?? null);
      if (data.recommendation) {
        publishFeedbackSuccess("ai.recommendation", "Recommendation ready", "You can review the next step now.");
      }
    } catch (loadError) {
      if (active) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load recommendation.");
      }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecommendation();

    return () => {
      active = false;
    };
  }, [endpoint]);

  useEffect(() => {
    let active = true;

    async function loadProposal() {
      if (!recommendation?.id) {
        setProposal(null);
        return;
      }

      setProposalLoading(true);
      try {
        const response = await fetch(`/api/program-change-proposals?recommendationId=${encodeURIComponent(recommendation.id)}`, {
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error(`Unable to load proposal (${response.status}).`);
        }

        const data = (await response.json()) as { proposal: ProgramChangeProposalRecordView | null };
        if (!active) {
          return;
        }

        setProposal(data.proposal ?? null);
        setSelectedCommandType(data.proposal?.changeCommand.type ?? commandOptions[0]?.command.type ?? null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load proposal.");
        }
      } finally {
        if (active) {
          setProposalLoading(false);
        }
      }
    }

    void loadProposal();

    return () => {
      active = false;
    };
  }, [commandOptions, recommendation?.id]);

  useEffect(() => {
    if (!selectedCommandType && commandOptions[0]) {
      setSelectedCommandType(commandOptions[0].command.type);
    }
  }, [commandOptions, selectedCommandType]);

  const generateRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coach/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contextType, contextKey })
      });

      if (!response.ok) {
        throw new Error(`Unable to generate recommendation (${response.status}).`);
      }

      const data = (await response.json()) as { recommendation: CoachRecommendationRecordView };
      setRecommendation(data.recommendation);
      setProposal(null);
      publishFeedbackSuccess("ai.recommendation", "Recommendation ready", "You can review the next step now.");
    } catch (generateError) {
      publishFeedbackError("ai.recommendation", "Recommendation could not be loaded", "A safe retry is available.");
      setError(generateError instanceof Error ? generateError.message : "Unable to generate recommendation.");
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!recommendation || !selectedOption) {
      return;
    }

    setProposalLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/program-change-proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recommendationId: recommendation.id,
          command: selectedOption.command
        })
      });

      if (!response.ok) {
        throw new Error(`Unable to create proposal (${response.status}).`);
      }

      const data = (await response.json()) as { proposal: ProgramChangeProposalRecordView };
      setProposal(data.proposal);
      setSelectedCommandType(data.proposal.changeCommand.type);
      await reloadProgram();
      publishFeedbackSuccess("program-change.proposal", "Proposal ready", "Before and after are now visible.");
    } catch (proposalError) {
      publishFeedbackError("program-change.proposal", "Proposal could not be created", "Your recommendation stays intact.");
      setError(proposalError instanceof Error ? proposalError.message : "Unable to create proposal.");
    } finally {
      setProposalLoading(false);
    }
  };

  const applyProposal = async () => {
    if (!proposal) {
      return;
    }

    setApplyLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/program-change-proposals/${proposal.id}/apply`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Unable to apply proposal (${response.status}).`);
      }

      const data = (await response.json()) as { proposal: ProgramChangeProposalRecordView };
      setProposal(data.proposal);
      await reloadProgram();
      publishFeedbackSuccess("program-change.apply", "Program updated", "Your approved change is now active.");
    } catch (applyError) {
      publishFeedbackError("program-change.apply", "Program change could not be applied", "Your current program is unchanged.");
      setError(applyError instanceof Error ? applyError.message : "Unable to apply proposal.");
    } finally {
      setApplyLoading(false);
    }
  };

  const rejectRecommendationOrProposal = async () => {
    if (proposal) {
      const response = await fetch(`/api/program-change-proposals/${proposal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "rejected" })
      });

      if (!response.ok) {
        setError(`Unable to reject proposal (${response.status}).`);
        return;
      }

      const data = (await response.json()) as { proposal: ProgramChangeProposalRecordView | null };
      setProposal(data.proposal ?? null);
      publishFeedbackSuccess("program-change.reject", "Proposal dismissed", "The current program stays in place.");
      return;
    }

    if (!recommendation) {
      return;
    }

    const response = await fetch("/api/coach/recommendations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recommendationId: recommendation.id,
        applicationStatus: "rejected"
      })
    });

    if (!response.ok) {
      setError(`Unable to reject recommendation (${response.status}).`);
      return;
    }

    const data = (await response.json()) as { recommendation: CoachRecommendationRecordView };
    setRecommendation(data.recommendation);
    publishFeedbackSuccess("program-change.reject", "Recommendation dismissed", "The current program stays in place.");
  };

  return (
    <Card className="p-16">
      <div className="row start">
        <div>
          <div className="eyebrow">COACH INSIGHT</div>
          <div className="headline-md" style={{ marginTop: 6 }}>
            {title}
          </div>
        </div>
        <span className="progress-chip progress-chip--accent">{recommendation ? "REVIEW" : "READY"}</span>
      </div>
      <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
        Recommendations are for review only. The active program changes only after you confirm a proposal.
      </p>

      {recommendation ? (
        <div className="stack" style={{ gap: 14, marginTop: 14 }}>
          <div>
            <div className="headline-md" style={{ textTransform: "uppercase" }}>
              {recommendation.title}
            </div>
            <p className="body-md" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {recommendation.summary}
            </p>
          </div>

          <div className="progress-review-grid">
            {(payload?.keySignals ?? []).slice(0, 3).map((signal) => (
              <Card key={signal} className="p-16">
                <div className="caption">Signal</div>
                <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                  {signal}
                </div>
              </Card>
            ))}
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <div className="eyebrow">What worked</div>
            <ul className="progress-dialog-list">
              {(payload?.whatWorked ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <div className="eyebrow">Focus next</div>
            <ul className="progress-dialog-list">
              {(payload?.focusNext ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <Card className="p-16" style={{ background: "var(--background-charcoal)" }}>
            <div className="eyebrow">Change details</div>
            <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
              {payload?.application.reason ?? "Review-only until explicitly confirmed."}
            </div>
            <p className="caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
              Status: {recommendation.applicationStatus.toUpperCase()}
            </p>
            {recommendation.fallbackReason ? (
              <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
                Context note: {recommendation.fallbackReason}
              </p>
            ) : null}
          </Card>

          <Card className="p-16">
            <div className="row start">
              <div>
                <div className="eyebrow">Proposal review</div>
                <div className="body-md" style={{ marginTop: 6, fontWeight: 700 }}>
                  Select a safe command and review the change.
                </div>
              </div>
              <span className="progress-chip progress-chip--accent">
                {proposal ? proposalStatusLabel(proposal.status).toUpperCase() : proposalLoading ? "LOADING" : "READY"}
              </span>
            </div>

            {commandOptions.length > 0 ? (
              <div className="stack" style={{ gap: 10, marginTop: 12 }}>
                <div className="progress-choice-row">
                  {commandOptions.map((option) => (
                    <ChoiceChip
                      key={option.command.type}
                      active={selectedOption?.command.type === option.command.type}
                      onClick={() => setSelectedCommandType(option.command.type)}
                    >
                      {option.title}
                    </ChoiceChip>
                  ))}
                </div>

                {selectedOption ? (
                  <Card className="p-16" style={{ background: "var(--background-charcoal)" }}>
                    <div className="eyebrow">Selected command</div>
                    <div className="headline-md" style={{ marginTop: 8, textTransform: "uppercase" }}>
                      {selectedOption.title}
                    </div>
                    <div className="body-md" style={{ marginTop: 8, fontWeight: 700 }}>
                      {selectedOption.summary}
                    </div>
                    <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
                      {selectedOption.note}
                    </p>
                    <p className="caption" style={{ marginTop: 6, lineHeight: 1.6 }}>
                      Why this fits: {selectedOption.validationHint}
                    </p>
                  </Card>
                ) : null}

                <div className="stack" style={{ gap: 10 }}>
                  <PrimaryButton className="focus-ring" onClick={() => void createProposal()} disabled={proposalLoading || !selectedOption}>
                    {proposalLoading ? "Creating review..." : proposal ? "Refresh review" : "Create proposal"}
                  </PrimaryButton>
                  <SecondaryButton className="focus-ring" onClick={() => void rejectRecommendationOrProposal()} disabled={proposalLoading || loading || !recommendation}>
                    Dismiss
                  </SecondaryButton>
                </div>
              </div>
            ) : (
              <p className="caption" style={{ marginTop: 12, lineHeight: 1.6 }}>
                No safe command is available for the current program state.
              </p>
            )}
          </Card>

          {proposal ? (
            <div className="stack" style={{ gap: 12 }}>
              <SnapshotCard label="Before" snapshot={proposal.beforeSnapshot} />
              <SnapshotCard label="After" snapshot={proposal.afterSnapshot} />

              <Card className="p-16" style={{ background: "var(--background-charcoal)" }}>
                <div className="row start">
                  <div className="eyebrow" style={{ margin: 0 }}>
                    Validation
                  </div>
                  <span className="progress-chip progress-chip--accent">{proposal.validationResult.status.toUpperCase()}</span>
                </div>
                {proposal.validationResult.messages.length > 0 ? (
                  <ul className="progress-dialog-list" style={{ marginTop: 10 }}>
                    {proposal.validationResult.messages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
                {proposal.validationResult.safetyFlags.length > 0 ? (
                  <ul className="progress-dialog-list" style={{ marginTop: 10 }}>
                    {proposal.validationResult.safetyFlags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                ) : null}
              </Card>

              <div className="stack" style={{ gap: 10 }}>
                <PrimaryButton className="focus-ring" onClick={() => void applyProposal()} disabled={applyLoading || proposal.status !== "proposed" || proposal.validationResult.status !== "approved"}>
                  {applyLoading ? "Applying change..." : "Apply change"}
                </PrimaryButton>
                <SecondaryButton className="focus-ring" onClick={() => void rejectRecommendationOrProposal()} disabled={applyLoading}>
                  Reject proposal
                </SecondaryButton>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="caption" style={{ marginTop: 12, lineHeight: 1.6 }}>
          No recommendation is ready yet.
        </p>
      )}

      {error ? (
        <p className="caption" style={{ marginTop: 12, color: "var(--accent-primary)" }}>
          {error}
        </p>
      ) : null}

      <div className="stack" style={{ gap: 10, marginTop: 16 }}>
        <PrimaryButton className="focus-ring" onClick={() => void generateRecommendation()} disabled={loading}>
          {loading ? "Generating..." : recommendation ? "Refresh recommendation" : "Generate recommendation"}
        </PrimaryButton>
        <Link className="button-secondary focus-ring" href="/profile/program-impact-review">
          REVIEW PROFILE IMPACT
        </Link>
      </div>
    </Card>
  );
}
