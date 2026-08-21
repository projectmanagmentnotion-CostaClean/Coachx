"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslator } from "@/components/locale-provider";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useCheckInStore } from "@/components/checkin-provider";
import type { WeeklyCheckinQuestionDefinition } from "@/lib/checkin-data";

function CheckInTopbar({ title }: { title: string }) {
  return (
    <header className="progress-review-topbar">
      <Link href="/progress" className="progress-review-topbar__button focus-ring" aria-label="Close screen">
        <span className="icon" aria-hidden="true">
          close
        </span>
      </Link>
      <BrandLogo variant="mark" width={34} alt="AthlexForce" />
      <span className="progress-review-topbar__label">{title}</span>
    </header>
  );
}

function ScaleChoiceRow({
  question,
  value,
  onSelect,
  disabled = false
}: {
  question: WeeklyCheckinQuestionDefinition;
  value: number | null;
  onSelect: (next: number) => void;
  disabled?: boolean;
}) {
  if (!question.scale) {
    return null;
  }

  const labels = [question.scale.minimumLabel, "", "", "", question.scale.maximumLabel];

  return (
    <div className="progress-choice-row" role="radiogroup" aria-label={question.title}>
      {Array.from({ length: question.scale.maximum - question.scale.minimum + 1 }, (_, index) => {
        const nextValue = question.scale ? question.scale.minimum + index : index + 1;
        return (
          <button
            key={nextValue}
            type="button"
            className={`progress-choice-chip ${value === nextValue ? "active" : ""}`.trim()}
            disabled={disabled}
            aria-pressed={value === nextValue}
            onClick={() => onSelect(nextValue)}
          >
            <span>{nextValue}</span>
            {labels[index] ? <span className="caption" style={{ marginTop: 4 }}>{labels[index]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoiceRow({
  question,
  value,
  onSelect,
  disabled = false
}: {
  question: WeeklyCheckinQuestionDefinition;
  value: string | null;
  onSelect: (next: string) => void;
  disabled?: boolean;
}) {
  if (!question.options) {
    return null;
  }

  return (
    <div className="progress-choice-row" role="radiogroup" aria-label={question.title}>
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`progress-choice-chip ${value === option.id ? "active" : ""}`.trim()}
          disabled={disabled}
          aria-pressed={value === option.id}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function WeeklyCheckInScreen() {
  const router = useRouter();
  const { t } = useTranslator();
  const store = useCheckInStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (store.currentQuestionIndex >= 0) {
      setActiveIndex(store.currentQuestionIndex);
    }
  }, [store.currentQuestionIndex, store.checkin?.id]);

  useEffect(() => {
    const note = store.responses.find((response) => response.question_key === "weekly_notes");
    setNoteDraft(note?.text_value ?? "");
  }, [store.responses, store.checkin?.id]);

  const answeredMap = useMemo(() => new Map(store.responses.map((response) => [response.question_key, response])), [store.responses]);
  const currentQuestion = store.questions[activeIndex] ?? store.questions[store.questions.length - 1];
  const coreQuestionsComplete = store.questions
    .filter((question) => question.key !== "weekly_notes")
    .every((question) => answeredMap.has(question.key));
  const canSubmit = coreQuestionsComplete && currentQuestion.key === "weekly_notes";
  const currentAnswer = answeredMap.get(currentQuestion.key) ?? null;

  const moveNext = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      if (noteDraft.trim() && currentAnswer?.text_value !== noteDraft.trim()) {
        await store.saveResponse({
          questionKey: "weekly_notes",
          responseType: "text",
          textValue: noteDraft.trim()
        });
      }
      await store.submitCheckIn(noteDraft.trim() || null);
      router.push("/progress/check-in/completion");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save weekly check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveScaleAnswer = async (nextValue: number) => {
    if (!currentQuestion.scale) {
      return;
    }

    setSavingKey(currentQuestion.key);
    setActionError(null);
    try {
      await store.saveResponse({
        questionKey: currentQuestion.key,
        responseType: "scale",
        numericValue: nextValue
      });
      await moveNext();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save weekly check-in.");
    } finally {
      setSavingKey(null);
    }
  };

  const saveChoiceAnswer = async (nextValue: string) => {
    setSavingKey(currentQuestion.key);
    setActionError(null);
    try {
      await store.saveResponse({
        questionKey: currentQuestion.key,
        responseType: "single_choice",
        choiceValue: nextValue
      });
      await moveNext();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save weekly check-in.");
    } finally {
      setSavingKey(null);
    }
  };

  const saveNote = async () => {
    setSavingKey(currentQuestion.key);
    setActionError(null);
    try {
      await store.saveResponse({
        questionKey: "weekly_notes",
        responseType: "text",
        textValue: noteDraft.trim() || null
      });
      setActiveIndex(store.questions.length - 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save weekly check-in.");
    } finally {
      setSavingKey(null);
    }
  };

  if (store.loading) {
    return (
      <Screen shellClassName="progress-flow-shell" topbar={<CheckInTopbar title={t("common.review").toUpperCase()} />}>
        <main className="content tight">
          <section className="section">
            <Card className="p-16 elevated">
              <div className="eyebrow">{t("common.loading")} {t("common.review").toLowerCase()}</div>
              <div className="headline-md" style={{ marginTop: 10 }}>
                Restoring your answers
              </div>
            </Card>
          </section>
        </main>
      </Screen>
    );
  }

  if (store.error) {
    return (
      <Screen shellClassName="progress-flow-shell" topbar={<CheckInTopbar title="WEEKLY CHECK-IN" />}>
        <main className="content tight">
          <section className="section">
            <Card className="p-16 elevated">
              <div className="eyebrow">Unable to load</div>
              <p className="body-md" style={{ marginTop: 10 }}>
                {store.error}
              </p>
              <div className="stack" style={{ marginTop: 16 }}>
                <PrimaryButton className="focus-ring" onClick={() => void store.reloadCheckIn()}>
                  Try again
                </PrimaryButton>
                <SecondaryButton className="focus-ring" onClick={() => router.push("/progress")}>
                {t("common.back")} {t("common.progress").toLowerCase()}
                </SecondaryButton>
              </div>
            </Card>
          </section>
        </main>
      </Screen>
    );
  }

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<CheckInTopbar title={t("common.review").toUpperCase()} />}>
      <main className="content tight">
        <section className="section progress-hero">
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {t("common.review")}
          </h1>
          <p className="caption" style={{ marginTop: 8 }}>
            Week of {store.weekStartDate} to {store.weekEndDate}
          </p>
          <div className="progress-phase-timeline progress-phase-timeline--review" style={{ marginTop: 12 }}>
            <span className="accent">{store.currentQuestionIndex + 1} / {store.questions.length}</span>
            <span>{store.checkin?.status?.replaceAll("_", " ").toUpperCase() ?? "IN PROGRESS"}</span>
            <span>{store.source === "remote" ? "Saved" : "Draft"}</span>
          </div>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="row start">
              <div>
              <div className="eyebrow">{t("common.review")}</div>
                <div className="headline-md" style={{ marginTop: 6 }}>
                  {store.summary?.adherencePercent.training ?? 0}% training · {store.summary?.adherencePercent.nutrition ?? 0}% nutrition
                </div>
              </div>
              <span className="progress-chip progress-chip--accent">
                {store.summary?.review.recommendationLabel ?? "Pending"}
              </span>
            </div>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {store.summary?.review.summary ?? "Your answers and adherence context are being captured."}
            </p>
          </Card>
        </section>

        <section className="section">
          <Card className="p-16 elevated">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {currentQuestion.title}
            </div>
            <h2 className="headline-md" style={{ margin: 0 }}>
              {currentQuestion.prompt}
            </h2>
            {currentQuestion.helperText ? (
              <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
                {currentQuestion.helperText}
              </p>
            ) : null}

            <div style={{ marginTop: 18 }}>
              {currentQuestion.responseType === "scale" ? (
                <ScaleChoiceRow
                  question={currentQuestion}
                  value={currentAnswer?.numeric_value ?? null}
                  disabled={savingKey === currentQuestion.key || submitting}
                  onSelect={(nextValue) => void saveScaleAnswer(nextValue)}
                />
              ) : currentQuestion.responseType === "single_choice" ? (
                <SingleChoiceRow
                  question={currentQuestion}
                  value={currentAnswer?.choice_value ?? null}
                  disabled={savingKey === currentQuestion.key || submitting}
                  onSelect={(nextValue) => void saveChoiceAnswer(nextValue)}
                />
              ) : (
                <div className="stack" style={{ gap: 12 }}>
                  <textarea
                    aria-label={currentQuestion.title}
                    className="input-field"
                    rows={5}
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add a short note"
                  />
                  <PrimaryButton
                    className="focus-ring"
                    disabled={savingKey === currentQuestion.key || submitting}
                    onClick={() => void saveNote()}
                  >
                    Save note
                  </PrimaryButton>
                </div>
              )}
            </div>
          </Card>
        </section>

        {actionError ? (
          <section className="section">
            <Card className="p-16">
              <div className="eyebrow">{t("common.error")}</div>
              <p className="caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
                {actionError}
              </p>
            </Card>
          </section>
        ) : null}

        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">What is already saved</div>
            <div className="stack" style={{ gap: 10, marginTop: 12 }}>
              {store.questions
                .filter((question) => question.key !== "weekly_notes")
                .map((question) => {
                  const response = answeredMap.get(question.key);
                  const label =
                    response?.numeric_value != null
                      ? String(response.numeric_value)
                      : response?.choice_value ?? response?.text_value ?? "Not answered";
                  return (
                    <div key={question.key} className="row" style={{ alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="body-md" style={{ fontWeight: 700 }}>
                          {question.title}
                        </div>
                        <div className="caption" style={{ marginTop: 4 }}>
                          {label}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="progress-mini-action focus-ring"
                        onClick={() => setActiveIndex(store.questions.findIndex((item) => item.key === question.key))}
                      >
                  {t("common.edit")}
                      </button>
                    </div>
                  );
                })}
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="stack" style={{ gap: 12 }}>
            {canSubmit ? (
              <PrimaryButton className="focus-ring" onClick={() => void moveNext()} disabled={submitting}>
                Submit check-in
              </PrimaryButton>
            ) : null}
              <SecondaryButton className="focus-ring" onClick={() => router.push("/progress")}>
              {t("common.back")} {t("common.progress").toLowerCase()}
              </SecondaryButton>
          </div>
        </section>
      </main>
    </Screen>
  );
}

export function WeeklyCheckInCompletionScreen() {
  const router = useRouter();
  const { t } = useTranslator();
  const store = useCheckInStore();
  const review = store.review
    ? {
        status: store.review.status,
        recommendationType: store.review.recommendation_type ?? store.summary?.review.recommendationType ?? "none",
        summary:
          typeof store.review.review_reason === "object" && store.review.review_reason && "summary" in store.review.review_reason
            ? String((store.review.review_reason as Record<string, unknown>).summary ?? store.summary?.review.summary ?? "")
            : store.summary?.review.summary ?? "",
        recommendationLabel: store.summary?.review.recommendationLabel ?? "Pending"
      }
    : store.summary?.review ?? { status: "pending", recommendationType: "none", summary: "No review yet.", recommendationLabel: "Pending" };

  const keySignals = [
    { label: "Training", value: `${store.summary?.adherencePercent.training ?? 0}%` },
    { label: "Nutrition", value: `${store.summary?.adherencePercent.nutrition ?? 0}%` },
    { label: "Progress entries", value: String(store.summary?.counts.progressEntries ?? 0) }
  ];

  const noteResponse = store.responses.find((response) => response.question_key === "weekly_notes");
  const painResponse = store.responses.find((response) => response.question_key === "pain_discomfort");

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<CheckInTopbar title={t("common.review").toUpperCase()} />}>
      <main className="content tight">
        <section className="section">
          <Card className="p-16 elevated" style={{ background: "var(--background-charcoal)" }}>
            <div className="eyebrow">{t("common.success")}</div>
            <h1 className="headline-lg" style={{ marginTop: 8, textTransform: "uppercase" }}>
              {t("common.review")}
            </h1>
            <p className="caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {store.checkin?.submitted_at ? `Submitted at ${new Date(store.checkin.submitted_at).toLocaleString()}.` : t("common.success")}
            </p>
          </Card>
        </section>

        <section className="section">
          <div className="grid-3">
            {keySignals.map((signal) => (
              <Card key={signal.label} className="p-16">
                <div className="eyebrow">{signal.label}</div>
                <div className="headline-md" style={{ marginTop: 8 }}>
                  {signal.value}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">{t("common.review")}</div>
            <div className="headline-md" style={{ marginTop: 8 }}>
              {review.recommendationLabel}
            </div>
            <p className="caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {review.summary}
            </p>
            {painResponse?.choice_value ? (
              <div className="caption" style={{ marginTop: 10 }}>
                {t("common.progress")}: {painResponse.choice_value}
              </div>
            ) : null}
            {noteResponse?.text_value ? (
              <div className="caption" style={{ marginTop: 6 }}>
                {t("common.review")}: {noteResponse.text_value}
              </div>
            ) : null}
          </Card>
        </section>

        <section className="section">
          <Card className="p-16">
            <div className="eyebrow">{t("common.save")}</div>
            <div className="stack" style={{ gap: 10, marginTop: 12 }}>
              {store.questions.map((question) => {
                const response = store.responses.find((item) => item.question_key === question.key);
                const value =
                  response?.numeric_value != null
                    ? String(response.numeric_value)
                    : response?.choice_value ?? response?.text_value ?? response?.boolean_value?.toString() ?? "Not answered";

                return (
                  <div key={question.key} className="row" style={{ alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="body-md" style={{ fontWeight: 700 }}>
                        {question.title}
                      </div>
                      <div className="caption" style={{ marginTop: 4 }}>
                        {value}
                      </div>
                    </div>
                    <span className="caption">{response?.answered_at ? t("common.save") : t("common.loading")}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="stack" style={{ gap: 12 }}>
            {store.review?.status === "acknowledged" ? (
              <Card className="p-16">
                <div className="eyebrow">{t("common.approve")}</div>
                <p className="caption" style={{ marginTop: 8 }}>
                  The review state is stored remotely and can later be consumed by the coach workflow.
                </p>
              </Card>
            ) : (
              <PrimaryButton className="focus-ring" onClick={() => void store.acknowledgeReview()}>
              {t("common.approve")}
            </PrimaryButton>
          )}
          <SecondaryButton className="focus-ring" onClick={() => router.push("/progress")}>
              {t("common.back")} {t("common.progress").toLowerCase()}
          </SecondaryButton>
          </div>
        </section>
      </main>
    </Screen>
  );
}
