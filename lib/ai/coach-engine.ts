import { zodTextFormat } from "openai/helpers/zod";
import type { OpenAI } from "openai";
import { coachRecommendationPayloadSchema, type CoachRecommendationContext, type CoachRecommendationPayload } from "@/lib/ai/schemas";

export interface CoachRecommendationResult {
  payload: CoachRecommendationPayload;
  source: "openai" | "fallback";
  model: string;
  generationStatus: "generated" | "fallback" | "failed";
  errorMessage: string | null;
}

const recommendationFormat = zodTextFormat(coachRecommendationPayloadSchema, "coachx_coach_recommendation");

function compactList(items: string[], maximum = 4) {
  return items.filter(Boolean).slice(0, maximum);
}

function buildBaseSignals(context: CoachRecommendationContext) {
  return [
    `${context.athlete.displayName}: ${context.athlete.goal}`,
    `Program: ${context.program.phaseLabel} · ${context.program.currentWorkoutLabel}`,
    `Check-in: ${context.checkIn.reviewLabel}`,
    `Progress: ${context.progress.trendSummary}`
  ];
}

export function buildFallbackRecommendation(context: CoachRecommendationContext, reason: string | null = null): CoachRecommendationPayload {
  const safetySignals = [
    ...(context.athlete.healthSnapshot.coachReviewRequired ? ["Health context requires coach review."] : []),
    ...(context.athlete.healthSnapshot.currentPain ? [`Current pain noted: ${context.athlete.healthSnapshot.currentPain}.`] : []),
    ...(context.checkIn.triggerKeys.length > 0 ? [`Weekly check-in trigger keys: ${context.checkIn.triggerKeys.join(", ")}.`] : []),
    ...(context.nutrition.safetyHighlights.length > 0 ? [`Nutrition safety notes: ${context.nutrition.safetyHighlights.join(", ")}.`] : [])
  ];

  const requiresCoachReview =
    context.athlete.healthSnapshot.coachReviewRequired ||
    Boolean(context.athlete.healthSnapshot.currentPain) ||
    context.checkIn.triggerKeys.includes("pain_discomfort") ||
    context.checkIn.triggerKeys.includes("recovery");

  const recommendationType = requiresCoachReview
    ? "coach_review"
    : context.checkIn.adherence.training != null && context.checkIn.adherence.training < 70
      ? "light_review"
      : context.checkIn.adherence.nutrition != null && context.checkIn.adherence.nutrition < 70
        ? "light_review"
        : "none";

  return {
    source: "fallback",
    title: requiresCoachReview ? "Coach review required" : recommendationType === "light_review" ? "Light review recommended" : "Phase looks stable",
    summary: requiresCoachReview
      ? "A safety-sensitive signal is present. Keep the current program stable and review the context before applying anything."
      : recommendationType === "light_review"
        ? "The current plan looks usable, but the recent signals suggest a light review before making changes."
        : "The current phase appears stable. Keep the plan in place and continue monitoring the same signals.",
    recommendationType,
    confidence: requiresCoachReview ? 0.88 : recommendationType === "light_review" ? 0.74 : 0.62,
    keySignals: compactList(buildBaseSignals(context)),
    whatWorked: compactList([
      `Goal remains ${context.athlete.goal}.`,
      `Current phase is ${context.program.phaseLabel}.`,
      `Recent progress trend: ${context.progress.trendSummary}`
    ]),
    whatHeldBack: compactList([
      ...safetySignals,
      ...(context.checkIn.adherence.training != null ? [`Training adherence: ${context.checkIn.adherence.training}%.`] : []),
      ...(context.checkIn.adherence.nutrition != null ? [`Nutrition adherence: ${context.checkIn.adherence.nutrition}%.`] : [])
    ]),
    focusNext: compactList([
      "Keep the active program unchanged until the review is explicitly approved.",
      context.nutrition.mealProgress.hydrationTargetMl ? "Stay within the current hydration target." : "Keep hydration consistent.",
      context.progress.latestMeasurements.length > 0 ? "Continue tracking the same measurement set." : "Collect another stable measurement point."
    ]),
    safetyNotes: compactList([
      requiresCoachReview ? "Do not auto-apply any changes while safety signals are present." : "No safety-sensitive escalation was detected in this summary.",
      ...safetySignals
    ]),
    nextPhase: {
      title: requiresCoachReview ? "Stabilize and review" : "Phase 2",
      duration: "8 weeks",
      summary: requiresCoachReview
        ? "Hold the current program, review the flagged context, and confirm whether changes are appropriate."
        : "Build on the current phase with the same athlete context and a modest progression focus.",
      changes: compactList([
        requiresCoachReview ? "Keep the active program unchanged until review." : "Maintain the current training frequency.",
        requiresCoachReview ? "Confirm the safety signal before progressing." : "Retain the same nutrition and recovery structure.",
        requiresCoachReview ? "Validate the next step with a coach." : "Progress only after the current signals stay stable."
      ], 3),
      firstWorkout: context.program.currentWorkoutLabel,
      nutrition: context.nutrition.planName ? `${context.nutrition.planName} targets stay in place.` : "Keep the current nutrition targets in place.",
      cardio: "Keep the current cardio structure stable.",
      recovery: "Preserve the current recovery rhythm and sleep pattern.",
      checkIn: "Review the next check-in after the same athlete context is confirmed.",
    },
    application: {
      status: "recommended",
      canApplyAutomatically: false,
      reason: "CoachX recommendations remain review-only until the athlete or coach explicitly confirms an applied change."
    },
    fallbackReason: reason
  };
}

export async function generateCoachRecommendation(
  openAIClient: OpenAI | null,
  model: string,
  context: CoachRecommendationContext
): Promise<CoachRecommendationResult> {
  if (!openAIClient) {
    return {
      payload: buildFallbackRecommendation(context, "OpenAI is not configured."),
      source: "fallback",
      model: "fallback",
      generationStatus: "fallback",
      errorMessage: "OpenAI is not configured."
    };
  }

  try {
    const response = await openAIClient.responses.create({
      model,
      instructions:
        `You are the AthlexForce Coach Engine. Return one concise, structured recommendation in ${context.athlete.locale}. Use only the provided athlete context. Do not diagnose medical conditions. Do not instruct the app to mutate the active program automatically. Recommendations are review-only until a human confirms them.`,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(context)
            }
          ]
        }
      ],
      text: {
        format: recommendationFormat
      }
    });

    const parsed = coachRecommendationPayloadSchema.parse(JSON.parse(response.output_text));

    return {
      payload: parsed,
      source: "openai",
      model,
      generationStatus: "generated",
      errorMessage: null
    };
  } catch (error) {
    return {
      payload: buildFallbackRecommendation(context, error instanceof Error ? error.message : "OpenAI request failed."),
      source: "fallback",
      model,
      generationStatus: "fallback",
      errorMessage: error instanceof Error ? error.message : "OpenAI request failed."
    };
  }
}
