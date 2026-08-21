"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  activateProgram,
  baselineSeed,
  createOnboardingDemoState,
  createProgramProposal,
  finalizeOnboarding as finalizeOnboardingState,
  getEntryDestination,
  getResumeOnboardingRoute,
  isNutritionChoiceAllowed,
  markStepComplete,
  reorderPriorityItems,
  type GoalProfile,
  shouldRequireCoachReview,
  type AthleteProfile,
  type BaselinePose,
  type GoalPriority,
  type HealthLimitations,
  type NutritionPreferences,
  type OnboardingState,
  type OnboardingStepId,
  type ProgramState,
  type ScheduleLifestyle,
  type TrainingExperience,
  type TrainingPreferences
} from "@/lib/onboarding-data";
import { getInitialLocale } from "@/lib/i18n";
import { useAuthStore } from "@/components/auth-provider";
import { useProgramStore } from "@/components/program-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildProfileSnapshotFromOnboarding,
  loadAthleteSnapshot,
  mapOnboardingStatus,
  mergeRemoteSnapshotIntoOnboardingState,
  saveAthleteSnapshot
} from "@/lib/athlete-service";
import { createProgressDemoState, type ProgressState } from "@/lib/progress-data";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";
import type { MeasurementType } from "@/lib/progress-data";
import { seedProgressBaseline } from "@/lib/progress-service";

interface OnboardingStoreValue {
  state: OnboardingState;
  program: ProgramState;
  entryDestination: string;
  resumeRoute: string;
  startStep: (step: OnboardingStepId) => void;
  completeStep: (step: OnboardingStepId) => void;
  setProfile: (patch: Partial<AthleteProfile>) => void;
  setGoals: (patch: Partial<GoalProfile>) => void;
  setMainGoal: (goal: string) => void;
  reorderPriorities: (fromIndex: number, toIndex: number) => void;
  setTrainingExperience: (patch: Partial<TrainingExperience>) => void;
  setTrainingPreferences: (patch: Partial<TrainingPreferences>) => void;
  setScheduleLifestyle: (patch: Partial<ScheduleLifestyle>) => void;
  setHealthLimitations: (patch: Partial<HealthLimitations>) => void;
  setNutritionPreferences: (patch: Partial<NutritionPreferences>) => void;
  setBaselineMeasurement: (type: Extract<MeasurementType, "weight" | "waist" | "hips" | "thigh">, value: string) => void;
  setBaselinePhoto: (pose: BaselinePose, status: "captured" | "missing" | "retake") => void;
  setResumeStep: (step: OnboardingStepId) => void;
  setCurrentStep: (step: OnboardingStepId) => void;
  setGoalDecision: (value: "KEEP" | "ADJUST") => void;
  setPriorityDecision: (value: "KEEP" | "ADJUST") => void;
  setAthleteFeedback: (value: "Very Good" | "Good" | "Mixed" | "Too Hard" | "Too Easy" | "Not Sure") => void;
  setProgram: (patch: Partial<ProgramState>) => void;
  createProgramProposal: () => void;
  activateProgram: () => void;
  finalizeOnboarding: () => void;
  resetOnboarding: () => void;
  requiresCoachReview: boolean;
  canUseNutritionChoice: (choice: { tags: string[]; ingredients?: string[]; allergens?: string[] }) => boolean;
}

const OnboardingStoreContext = createContext<OnboardingStoreValue | null>(null);
const STORAGE_KEY = "coachx-demo-onboarding-state-v1";
const PROGRESS_STORAGE_KEY_PREFIX = "coachx-progress-state-v1";
const PROGRESS_BASELINE_DATE_KEY = "2026-08-08";

function progressStorageKey(userId: string | null) {
  return `${PROGRESS_STORAGE_KEY_PREFIX}:${userId ?? "demo"}`;
}

function reviveState(rawValue: string | null) {
  if (!rawValue) {
    return createOnboardingDemoState();
  }

  try {
    const parsed = JSON.parse(rawValue) as OnboardingState;
    return {
      ...createOnboardingDemoState(),
      ...parsed,
      progress: {
        ...createOnboardingDemoState().progress,
        ...parsed.progress
      },
      program: {
        ...createOnboardingDemoState().program,
        ...parsed.program
      }
    };
  } catch {
    return createOnboardingDemoState();
  }
}

function updateProgramActivation() {
  const progress = createProgressDemoState();
  const dateKey = "2026-08-08";
  return {
    ...progress,
    measurement: {
      ...progress.measurement,
      checkpoint: "week-4",
      currentDateLabel: "August 8",
      currentDateKey: dateKey,
      savedAt: new Date().toISOString()
    },
    photos: {
      ...progress.photos,
      selectedCheckpoint: "week-4"
    }
  };
}

function updateMeasurementBaseline(seed: typeof baselineSeed): ProgressState {
  const progress = createProgressDemoState();
  return {
    ...progress,
    measurement: {
      ...progress.measurement,
      definitions: progress.measurement.definitions.map((definition) => {
        const measurement = seed.measurements.find((item) => item.type === definition.type);
        return measurement ? { ...definition, lastValue: Number(measurement.value), lastDate: measurement.dateLabel } : definition;
      }),
      histories: progress.measurement.histories.map((history) => {
        const measurement = seed.measurements.find((item) => item.type === history.type);
        if (!measurement) {
          return history;
        }

        return {
          ...history,
          entries: [
            {
              type: history.type,
              value: Number(measurement.value),
              unit: measurement.unit,
              dateKey: "2026-08-08"
            }
          ]
        };
      })
    },
    photos: {
      ...progress.photos,
      checkpoints: progress.photos.checkpoints.map((checkpoint) =>
        checkpoint.checkpoint === "baseline"
          ? {
              ...checkpoint,
              photos: {
                ...checkpoint.photos,
                front: { ...checkpoint.photos.front, status: "captured" as const, image: "/progress-photo-front.svg" },
                side: { ...checkpoint.photos.side, status: "captured" as const, image: "/progress-photo-side.svg" },
                back: { ...checkpoint.photos.back, status: "missing" as const, image: null }
              }
            }
          : checkpoint
      )
    }
  };
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const authRef = useRef(auth);
  const programStore = useProgramStore();
  const programStoreRef = useRef(programStore);
  const programActivationRequestedRef = useRef(false);
  const [state, setState] = useState<OnboardingState>(() => createOnboardingDemoState(getInitialLocale()));

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    programStoreRef.current = programStore;
  }, [programStore]);

  useEffect(() => {
    setState(reviveState(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;

    async function hydrateFromRemote() {
      const client = getSupabaseBrowserClient();

      const currentAuth = authRef.current;

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        setState(reviveState(window.localStorage.getItem(STORAGE_KEY)));
        return;
      }

      try {
        const remote = await loadAthleteSnapshot(client, currentAuth.user.id);
        if (!active) {
          return;
        }

        if (remote.source === "default") {
          const localState = reviveState(window.localStorage.getItem(STORAGE_KEY));
          setState(localState);
          await saveAthleteSnapshot(
            client,
            currentAuth.user.id,
            buildProfileSnapshotFromOnboarding(localState),
            mapOnboardingStatus(localState.progress.status),
            localState.progress.status === "complete" ? new Date().toISOString() : null
          );
          return;
        }

        setState((current) => mergeRemoteSnapshotIntoOnboardingState(current, remote));
        if (!remote.preferencesPresent) {
          await saveAthleteSnapshot(
            client,
            currentAuth.user.id,
            remote.snapshot,
            remote.onboardingStatus,
            remote.onboardingCompletedAt
          );
        }
      } catch {
        if (active) {
          setState(reviveState(window.localStorage.getItem(STORAGE_KEY)));
        }
      }
    }

    void hydrateFromRemote();

    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.ready, auth.user?.id]);

  useEffect(() => {
    if (!auth.ready || !auth.isConfigured || !auth.user || state.progress.status !== "complete") {
      programActivationRequestedRef.current = false;
      return;
    }

    if (programStoreRef.current.source === "remote") {
      return;
    }

    if (programActivationRequestedRef.current) {
      return;
    }

    programActivationRequestedRef.current = true;
    void programStoreRef.current.activateProgram(state.program);
  }, [auth.isConfigured, auth.ready, auth.user?.id, state.progress.status, state.program]);

  async function persistCurrentSnapshot(nextState: OnboardingState) {
    const client = getSupabaseBrowserClient();
    const currentAuth = authRef.current;

    if (!currentAuth.isConfigured || !currentAuth.user || !client) {
      return;
    }

    await saveAthleteSnapshot(
      client,
      currentAuth.user.id,
      buildProfileSnapshotFromOnboarding(nextState),
      mapOnboardingStatus(nextState.progress.status),
      nextState.progress.status === "complete" ? new Date().toISOString() : null
    );
  }

  const value = useMemo<OnboardingStoreValue>(() => {
    const entryDestination = getEntryDestination(state.progress);
    const resumeRoute = getResumeOnboardingRoute(state.progress);

    const startStep: OnboardingStoreValue["startStep"] = (step) => {
      setState((current) => {
        if (current.progress.currentStep === step && current.progress.resumeStep === step) {
          return current;
        }

        return {
          ...current,
          progress: {
            ...current.progress,
            currentStep: step,
            resumeStep: step,
            status: current.progress.status === "complete" ? "complete" : "in-progress"
          }
        };
      });
    };

    const completeStep: OnboardingStoreValue["completeStep"] = (step) => {
      setState((current) => markStepComplete(current, step));
    };

    const setProfile: OnboardingStoreValue["setProfile"] = (patch) => {
      setState((current) => ({
        ...current,
        profile: {
          ...current.profile,
          ...patch
        }
      }));
    };

    const setGoals: OnboardingStoreValue["setGoals"] = (patch) => {
      setState((current) => ({
        ...current,
        goals: {
          ...current.goals,
          ...patch,
          priorities: patch.priorities ? [...patch.priorities] : current.goals.priorities
        }
      }));
    };

    const setMainGoal: OnboardingStoreValue["setMainGoal"] = (goal) => {
      setState((current) => ({
        ...current,
        goals: {
          ...current.goals,
          mainGoal: goal
        }
      }));
    };

    const reorderPriorities: OnboardingStoreValue["reorderPriorities"] = (fromIndex, toIndex) => {
      setState((current) => ({
        ...current,
        goals: {
          ...current.goals,
          priorities: reorderPriorityItems(current.goals.priorities, fromIndex, toIndex)
        }
      }));
    };

    const setTrainingExperience: OnboardingStoreValue["setTrainingExperience"] = (patch) => {
      setState((current) => ({
        ...current,
        trainingExperience: {
          ...current.trainingExperience,
          ...patch
        }
      }));
    };

    const setTrainingPreferences: OnboardingStoreValue["setTrainingPreferences"] = (patch) => {
      setState((current) => ({
        ...current,
        trainingPreferences: {
          ...current.trainingPreferences,
          ...patch
        }
      }));
    };

    const setScheduleLifestyle: OnboardingStoreValue["setScheduleLifestyle"] = (patch) => {
      setState((current) => ({
        ...current,
        scheduleLifestyle: {
          ...current.scheduleLifestyle,
          ...patch
        }
      }));
    };

    const setHealthLimitations: OnboardingStoreValue["setHealthLimitations"] = (patch) => {
      setState((current) => ({
        ...current,
        healthLimitations: {
          ...current.healthLimitations,
          ...patch,
          coachReviewRequired: shouldRequireCoachReview({
            ...current.healthLimitations,
            ...patch,
            coachReviewRequired: current.healthLimitations.coachReviewRequired || Boolean(patch.coachReviewRequired)
          })
        }
      }));
    };

    const setNutritionPreferences: OnboardingStoreValue["setNutritionPreferences"] = (patch) => {
      setState((current) => ({
        ...current,
        nutritionPreferences: {
          ...current.nutritionPreferences,
          ...patch
        }
      }));
    };

    const setBaselineMeasurement: OnboardingStoreValue["setBaselineMeasurement"] = (type, value) => {
      setState((current) => ({
        ...current,
        baseline: {
          ...current.baseline,
          measurements: current.baseline.measurements.map((measurement) =>
            measurement.type === type ? { ...measurement, value } : measurement
          )
        }
      }));
    };

    const setBaselinePhoto: OnboardingStoreValue["setBaselinePhoto"] = (pose, status) => {
      setState((current) => ({
        ...current,
        baseline: {
          ...current.baseline,
          photos: {
            ...current.baseline.photos,
            poses: current.baseline.photos.poses.map((item) => (item.pose === pose ? { ...item, status } : item))
          }
        }
      }));
    };

    const setResumeStep: OnboardingStoreValue["setResumeStep"] = (step) => {
      setState((current) => ({
        ...current,
        progress: {
          ...current.progress,
          resumeStep: step
        }
      }));
    };

    const setCurrentStep: OnboardingStoreValue["setCurrentStep"] = (step) => {
      setState((current) => ({
        ...current,
        progress: {
          ...current.progress,
          currentStep: step,
          status: current.progress.status === "complete" ? "complete" : "in-progress"
        }
      }));
    };

    const setGoalDecision: OnboardingStoreValue["setGoalDecision"] = (value) => {
      setState((current) => ({
        ...current,
        program: {
          ...current.program,
          recommendation: {
            ...current.program.recommendation,
            summary: value === "KEEP" ? current.program.recommendation.summary : `${current.program.recommendation.summary} — adjust focus`
          }
        }
      }));
    };

    const setPriorityDecision: OnboardingStoreValue["setPriorityDecision"] = (value) => {
      setState((current) => ({
        ...current,
        program: {
          ...current.program,
          recommendation: {
            ...current.program.recommendation,
            changes:
              value === "KEEP"
                ? current.program.recommendation.changes
                : [...current.program.recommendation.changes, "Revisit priority emphasis before activation"]
          }
        }
      }));
    };

    const setAthleteFeedback: OnboardingStoreValue["setAthleteFeedback"] = (value) => {
      setState((current) => ({
        ...current,
        program: {
          ...current.program,
          recentAdjustments: [`Athlete feedback: ${value}`]
        }
      }));
    };

    const setProgram: OnboardingStoreValue["setProgram"] = (patch) => {
      setState((current) => ({
        ...current,
        program: {
          ...current.program,
          ...patch
        }
      }));
    };

    const createProgramProposalAction: OnboardingStoreValue["createProgramProposal"] = () => {
      setState((current) => ({
        ...current,
        program: createProgramProposal(current)
      }));
    };

    const activateProgramAction: OnboardingStoreValue["activateProgram"] = () => {
      const seed = updateMeasurementBaseline(baselineSeed);
      const userId = authRef.current.user?.id ?? null;
      window.localStorage.setItem(progressStorageKey(userId), JSON.stringify(seed));
      window.dispatchEvent(new Event("coachx-progress-state-updated"));
      const client = getSupabaseBrowserClient();
      if (client && authRef.current.isConfigured && authRef.current.user) {
        void seedProgressBaseline(client, authRef.current.user.id, PROGRESS_BASELINE_DATE_KEY, seed).catch(() => undefined);
      }
      setState((current) => ({
        ...current,
        program: activateProgram(createProgramProposal(current)),
        progress: {
          ...current.progress,
          currentStep: "program",
          completedSteps: Array.from(new Set([...current.progress.completedSteps, "program"])),
          resumeStep: "program",
          status: "complete"
        }
      }));
      publishFeedbackSuccess("onboarding.complete", "Onboarding complete", "Your plan is ready to review.");
    };

    const finalizeOnboardingAction: OnboardingStoreValue["finalizeOnboarding"] = () => {
      const seed = updateMeasurementBaseline(baselineSeed);
      const userId = authRef.current.user?.id ?? null;
      window.localStorage.setItem(progressStorageKey(userId), JSON.stringify(seed));
      window.dispatchEvent(new Event("coachx-progress-state-updated"));
      setState((current) => {
        const nextState = finalizeOnboardingState(current);
        const client = getSupabaseBrowserClient();
        if (client && authRef.current.isConfigured && authRef.current.user) {
          void seedProgressBaseline(client, authRef.current.user.id, PROGRESS_BASELINE_DATE_KEY, seed).catch(() => undefined);
        }
        void persistCurrentSnapshot(nextState)
          .then(() => {
            publishFeedbackSuccess("onboarding.complete", "Onboarding complete", "Your profile and plan are saved.");
          })
          .catch(() => {
            publishFeedbackError("onboarding.complete", "Onboarding could not be saved", "Your current setup is still here.");
          });
        return nextState;
      });
    };

    const resetOnboardingAction: OnboardingStoreValue["resetOnboarding"] = () => {
      const demo = createOnboardingDemoState();
      setState(demo);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      window.localStorage.setItem(progressStorageKey(authRef.current.user?.id ?? null), JSON.stringify(updateMeasurementBaseline(baselineSeed)));
      window.dispatchEvent(new Event("coachx-progress-state-updated"));
      window.dispatchEvent(new Event("coachx-progress-state-updated"));
    };

    return {
      state,
      program: state.program,
      entryDestination,
      resumeRoute,
      startStep,
      completeStep,
      setProfile,
      setGoals,
      setMainGoal,
      reorderPriorities,
      setTrainingExperience,
      setTrainingPreferences,
      setScheduleLifestyle,
      setHealthLimitations,
      setNutritionPreferences,
      setBaselineMeasurement,
      setBaselinePhoto,
      setResumeStep,
      setCurrentStep,
      setGoalDecision,
      setPriorityDecision,
      setAthleteFeedback,
      setProgram,
      createProgramProposal: createProgramProposalAction,
      activateProgram: activateProgramAction,
      finalizeOnboarding: finalizeOnboardingAction,
      resetOnboarding: resetOnboardingAction,
      requiresCoachReview: shouldRequireCoachReview(state.healthLimitations),
      canUseNutritionChoice: (choice) => isNutritionChoiceAllowed(choice, state.nutritionPreferences)
    };
  }, [state]);

  return <OnboardingStoreContext.Provider value={value}>{children}</OnboardingStoreContext.Provider>;
}

export function useOnboardingStore() {
  const context = useContext(OnboardingStoreContext);

  if (!context) {
    throw new Error("useOnboardingStore must be used within OnboardingProvider");
  }

  return context;
}

export function getOnboardingLink(step: OnboardingStepId) {
  switch (step) {
    case "entry": return "/entry";
    case "intro": return "/onboarding";
    case "profile": return "/onboarding/profile";
    case "goals": return "/onboarding/goals";
    case "training-experience": return "/onboarding/training-experience";
    case "training-preferences": return "/onboarding/training-preferences";
    case "schedule": return "/onboarding/schedule";
    case "health": return "/onboarding/health";
    case "nutrition": return "/onboarding/nutrition";
    case "baseline": return "/onboarding/baseline";
    case "review": return "/onboarding/review";
    case "building-plan": return "/onboarding/building-plan";
    case "plan-ready": return "/onboarding/plan-ready";
    case "program": return "/program";
  }
}
