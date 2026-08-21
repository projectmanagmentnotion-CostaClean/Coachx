"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  buildMeasurementHistory,
  computeMeasurementDifference,
  createProgressDemoState,
  formatMeasurementDifference,
  formatMeasurementValue,
  getMeasurementDefinition,
  getMeasurementRows,
  getPhotoCheckpoint,
  parseMeasurementInput,
  type AthleteFeedback,
  type ComparisonMode,
  type MeasurementState,
  type MeasurementType,
  type PhotoPose,
  type ProgressState
} from "@/lib/progress-data";
import { getNumericValidationMessage } from "@/lib/numeric-input";
import { useAuthStore } from "@/components/auth-provider";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteProgressPhoto,
  loadProgressState,
  saveProgressMeasurements as persistProgressMeasurements,
  uploadProgressPhoto
} from "@/lib/progress-service";

interface ProgressStoreValue {
  state: ProgressState;
  measurementRows: ReturnType<typeof getMeasurementRows>;
  updateMeasurementDraft: (type: MeasurementType, value: string) => void;
  saveMeasurements: () => Promise<{ ok: boolean; errors: string[] }>;
  dismissMeasurementErrors: () => void;
  setComparisonPose: (pose: PhotoPose) => void;
  setComparisonMode: (mode: ComparisonMode) => void;
  capturePhoto: (pose: PhotoPose) => void;
  retakePhoto: (pose: PhotoPose) => void;
  markPhotoMissing: (pose: PhotoPose) => Promise<void>;
  savePhotoCapture: (pose: PhotoPose, file: File) => Promise<{ ok: boolean; error: string | null }>;
  setSelectedPhotoCheckpoint: (checkpoint: ProgressState["photos"]["selectedCheckpoint"]) => void;
  setGuidanceVisible: (visible: boolean) => void;
  setAthleteFeedback: (value: AthleteFeedback) => void;
  setGoalDecision: (value: "KEEP" | "ADJUST") => void;
  setPriorityDecision: (value: "KEEP" | "ADJUST") => void;
  savePhaseReview: () => void;
  resetProgressDemo: () => void;
}

const ProgressStoreContext = createContext<ProgressStoreValue | null>(null);
const STORAGE_KEY_PREFIX = "coachx-progress-state-v1";

function progressStorageKey(userId: string | null) {
  return `${STORAGE_KEY_PREFIX}:${userId ?? "demo"}`;
}

function reviveState(rawValue: string | null) {
  if (!rawValue) {
    return createProgressDemoState();
  }

  try {
    const parsed = JSON.parse(rawValue) as ProgressState;
    const base = createProgressDemoState();

    return {
      ...base,
      ...parsed,
      photos: {
        ...base.photos,
        ...parsed.photos,
        checkpoints: parsed.photos.checkpoints.map((checkpoint, index) => {
          const baseCheckpoint = base.photos.checkpoints[index] ?? base.photos.checkpoints[0];
          return {
            ...baseCheckpoint,
            ...checkpoint,
            photos: {
              front: {
                ...baseCheckpoint.photos.front,
                ...checkpoint.photos.front,
                image: checkpoint.photos.front.image && checkpoint.photos.front.image.includes("progress-photo-") ? "/progress-photo-front.svg" : checkpoint.photos.front.image
              },
              side: {
                ...baseCheckpoint.photos.side,
                ...checkpoint.photos.side,
                image: checkpoint.photos.side.image && checkpoint.photos.side.image.includes("progress-photo-") ? "/progress-photo-side.svg" : checkpoint.photos.side.image
              },
              back: {
                ...baseCheckpoint.photos.back,
                ...checkpoint.photos.back,
                image: checkpoint.photos.back.image && checkpoint.photos.back.image.includes("progress-photo-") ? "/progress-photo-back.svg" : checkpoint.photos.back.image
              }
            }
          };
        })
      }
    };
  } catch {
    return createProgressDemoState();
  }
}

function updateMeasurementDraft(measurement: MeasurementState, type: MeasurementType, value: string) {
  return {
    ...measurement,
    definitions: measurement.definitions.map((definition) => (definition.type === type ? { ...definition, todayValue: value } : definition)),
    validationErrors: {
      ...measurement.validationErrors,
      [type]: undefined
    }
  };
}

function updateCheckpointPhoto(
  state: ProgressState,
  pose: PhotoPose,
  patch: Partial<ProgressState["photos"]["checkpoints"][number]["photos"][PhotoPose]>
) {
  return {
    ...state,
    photos: {
      ...state.photos,
      checkpoints: state.photos.checkpoints.map((checkpoint) => {
        if (checkpoint.checkpoint !== state.photos.selectedCheckpoint) {
          return checkpoint;
        }

        const photo = checkpoint.photos[pose];
        return {
          ...checkpoint,
          photos: {
            ...checkpoint.photos,
            [pose]: {
              ...photo,
              ...patch
            }
          }
        };
      })
    }
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const { locale } = useLocale();
  const authRef = useRef(auth);
  const [state, setState] = useState<ProgressState>(() => createProgressDemoState());

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;

    async function hydrate() {
      const client = getSupabaseBrowserClient();
      const userId = authRef.current.user?.id ?? null;
      const localState = reviveState(window.localStorage.getItem(progressStorageKey(userId)));

      if (!authRef.current.isConfigured || !authRef.current.user || !client) {
        setState(localState);
        return;
      }

      try {
        const remote = await loadProgressState(client, authRef.current.user.id, localState);
        if (!active) {
          return;
        }

        setState(remote.state);
        window.localStorage.setItem(progressStorageKey(authRef.current.user.id), JSON.stringify(remote.state));
      } catch {
        if (active) {
          setState(localState);
        }
      }
    }

    void hydrate();

    const syncState = () => {
      const userId = authRef.current.user?.id ?? null;
      setState(reviveState(window.localStorage.getItem(progressStorageKey(userId))));
    };

    window.addEventListener("coachx-progress-state-updated", syncState);

    return () => {
      active = false;
      window.removeEventListener("coachx-progress-state-updated", syncState);
    };
  }, [auth.ready, auth.user?.id, auth.isConfigured]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    const userId = auth.user?.id ?? null;
    window.localStorage.setItem(progressStorageKey(userId), JSON.stringify(state));
  }, [auth.ready, auth.user?.id, state]);

  const value = useMemo<ProgressStoreValue>(() => {
    const measurementRows = getMeasurementRows(state.measurement);

    const updateMeasurementDraftAction: ProgressStoreValue["updateMeasurementDraft"] = (type, value) => {
      setState((current) => ({
        ...current,
        measurement: updateMeasurementDraft(current.measurement, type, value)
      }));
    };

    const saveMeasurements: ProgressStoreValue["saveMeasurements"] = async () => {
      const errors: string[] = [];
      const nextValidationErrors: MeasurementState["validationErrors"] = {};
      const updates: Partial<Record<MeasurementType, number>> = {};

      state.measurement.definitions.forEach((definition) => {
        const parsed = parseMeasurementInput(definition.todayValue, definition.min, definition.max);
        if (!parsed.valid) {
          if (definition.todayValue.trim()) {
            const reason = parsed.reason ?? "invalid";
            const message = getNumericValidationMessage(locale as "en" | "es" | "ca" | "de", reason, {
              min: definition.min,
              max: definition.max
            });
            nextValidationErrors[definition.type] = message;
            errors.push(`${definition.label}: ${message}`);
          }
          return;
        }

        updates[definition.type] = parsed.value;
      });

      if (errors.length > 0) {
        setState((current) => ({
          ...current,
          measurement: {
            ...current.measurement,
            validationErrors: nextValidationErrors
          }
        }));
        return { ok: false, errors };
      }

      const rows = state.measurement.definitions
        .map((definition) => {
          const parsed = updates[definition.type] ?? null;
          const previousValue = getMeasurementDefinition(state.measurement, definition.type).lastValue;
          const existingRow = state.measurement.lastSavedRows.find((row) => row.type === definition.type) ?? null;
          const currentValue = definition.todayValue.trim() ? parsed : existingRow?.currentValue ?? null;

          return {
            type: definition.type,
            label: definition.label,
            unit: definition.unit,
            previousValue,
            currentValue,
            previousDate: definition.lastDate,
            currentDate: definition.todayValue.trim() ? state.measurement.currentDateLabel : existingRow?.currentDate ?? null,
            difference: computeMeasurementDifference(previousValue, currentValue)
          };
        })
        .filter((row) => row.currentValue !== null || row.previousValue !== null);

      const nextState = {
        ...state,
        measurement: {
          ...state.measurement,
          histories: buildMeasurementHistory(state.measurement, updates),
          lastSavedRows: rows,
          savedAt: new Date().toISOString(),
          validationErrors: {}
        }
      };

      setState(nextState);

      const client = getSupabaseBrowserClient();
      const userId = authRef.current.user?.id ?? null;

      if (client && authRef.current.isConfigured && userId) {
        try {
          await persistProgressMeasurements(client, userId, nextState);
          publishFeedbackSuccess("progress.measurement", "Measurement saved", "Your trend view is up to date.");
        } catch {
          publishFeedbackError("progress.measurement", "Measurement could not be saved", "Your current values are still here.");
          // Keep the optimistic local state if remote persistence is temporarily unavailable.
        }
      }

      return { ok: true, errors: [] };
    };

    const dismissMeasurementErrors: ProgressStoreValue["dismissMeasurementErrors"] = () => {
      setState((current) => ({
        ...current,
        measurement: {
          ...current.measurement,
          validationErrors: {}
        }
      }));
    };

    const setComparisonPose: ProgressStoreValue["setComparisonPose"] = (pose) => {
      setState((current) => ({
        ...current,
        photos: {
          ...current.photos,
          comparisonPose: pose
        }
      }));
    };

    const setComparisonMode: ProgressStoreValue["setComparisonMode"] = (mode) => {
      setState((current) => ({
        ...current,
        photos: {
          ...current.photos,
          comparisonMode: mode
        }
      }));
    };

    const capturePhoto: ProgressStoreValue["capturePhoto"] = (pose) => {
      setState((current) =>
        updateCheckpointPhoto(current, pose, {
          status: "captured",
          image: `/progress-photo-${pose}.svg`,
          storagePath: null,
          mimeType: null,
          fileSizeBytes: null,
          width: null,
          height: null,
          updatedAt: new Date().toISOString()
        })
      );
    };

    const retakePhoto: ProgressStoreValue["retakePhoto"] = (pose) => {
      setState((current) =>
        updateCheckpointPhoto(current, pose, {
          status: "retake",
          image: `/progress-photo-${pose}.svg`,
          updatedAt: new Date().toISOString()
        })
      );
    };

    const savePhotoCapture: ProgressStoreValue["savePhotoCapture"] = async (pose, file) => {
      const client = getSupabaseBrowserClient();
      const userId = authRef.current.user?.id ?? null;
      const previewUrl = typeof window !== "undefined" ? window.URL.createObjectURL(file) : `/progress-photo-${pose}.svg`;

      if (!client || !authRef.current.isConfigured || !userId) {
        setState((current) =>
          updateCheckpointPhoto(current, pose, {
            status: "captured",
            image: previewUrl,
            storagePath: null,
            mimeType: file.type || null,
            fileSizeBytes: file.size,
            width: null,
            height: null,
            updatedAt: new Date().toISOString()
          })
        );
        return { ok: true, error: null };
      }

      try {
        const result = await uploadProgressPhoto(client, userId, pose, file, state.measurement.currentDateKey);
        if (!result) {
          throw new Error("Progress photo tables are not available.");
        }

        setState((current) =>
          updateCheckpointPhoto(current, pose, {
            status: "captured",
            image: result.signedUrl ?? previewUrl,
            storagePath: result.photo.storage_path,
            mimeType: (result.photo.mime_type ?? file.type) || null,
            fileSizeBytes: result.photo.file_size_bytes ?? file.size,
            width: result.photo.width ?? null,
            height: result.photo.height ?? null,
            updatedAt: result.photo.updated_at
          })
        );
        publishFeedbackSuccess("progress.photo", "Photo added", "Your progress photo is ready.");

        return { ok: true, error: null };
      } catch {
        setState((current) =>
          updateCheckpointPhoto(current, pose, {
            status: "captured",
            image: previewUrl,
            storagePath: null,
            mimeType: file.type || null,
            fileSizeBytes: file.size,
            width: null,
            height: null,
            updatedAt: new Date().toISOString()
          })
        );
        publishFeedbackError("progress.photo", "Photo could not be uploaded", "Your local preview stays in place.");

        return { ok: true, error: null };
      }
    };

    const markPhotoMissing: ProgressStoreValue["markPhotoMissing"] = async (pose) => {
      const client = getSupabaseBrowserClient();
      const userId = authRef.current.user?.id ?? null;

      if (client && authRef.current.isConfigured && userId) {
        try {
          await deleteProgressPhoto(client, userId, pose, state.measurement.currentDateKey);
          publishFeedbackSuccess("progress.photo-remove", "Photo removed", "The photo was removed from this checkpoint.");
        } catch {
          // Best-effort cleanup only; the local state still reflects the user's action.
        }
      }

      setState((current) =>
        updateCheckpointPhoto(current, pose, {
          status: "missing",
          image: null,
          storagePath: null,
          mimeType: null,
          fileSizeBytes: null,
          width: null,
          height: null,
          updatedAt: new Date().toISOString()
        })
      );
    };

    const setSelectedPhotoCheckpoint: ProgressStoreValue["setSelectedPhotoCheckpoint"] = (checkpoint) => {
      setState((current) => ({
        ...current,
        photos: {
          ...current.photos,
          selectedCheckpoint: checkpoint
        }
      }));
    };

    const setGuidanceVisible: ProgressStoreValue["setGuidanceVisible"] = (visible) => {
      setState((current) => ({
        ...current,
        photos: {
          ...current.photos,
          guidanceVisible: visible
        }
      }));
    };

    const setAthleteFeedback: ProgressStoreValue["setAthleteFeedback"] = (value) => {
      setState((current) => ({
        ...current,
        phaseReview: {
          ...current.phaseReview,
          athleteFeedback: current.phaseReview.athleteFeedback.map((feedback, index) => (index === 0 ? { ...feedback, value } : feedback))
        }
      }));
    };

    const setGoalDecision: ProgressStoreValue["setGoalDecision"] = (value) => {
      setState((current) => ({
        ...current,
        phaseReview: {
          ...current.phaseReview,
          mainGoalDecision: {
            ...current.phaseReview.mainGoalDecision,
            current: value
          }
        }
      }));
    };

    const setPriorityDecision: ProgressStoreValue["setPriorityDecision"] = (value) => {
      setState((current) => ({
        ...current,
        phaseReview: {
          ...current.phaseReview,
          priorityDecision: {
            ...current.phaseReview.priorityDecision,
            current: value
          }
        }
      }));
    };

    const savePhaseReview: ProgressStoreValue["savePhaseReview"] = () => {
      setState((current) => ({
        ...current,
        phaseReview: {
          ...current.phaseReview,
          status: "COACH REVIEW REQUIRED"
        }
      }));
      publishFeedbackSuccess("progress.measurement", "Phase review saved", "Your latest review is recorded.");
    };

    const resetProgressDemo: ProgressStoreValue["resetProgressDemo"] = () => {
      const demo = createProgressDemoState();
      setState(demo);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(progressStorageKey(authRef.current.user?.id ?? null), JSON.stringify(demo));
        window.dispatchEvent(new Event("coachx-progress-state-updated"));
      }
    };

    return {
      state,
      measurementRows,
      updateMeasurementDraft: updateMeasurementDraftAction,
      saveMeasurements,
      dismissMeasurementErrors,
      setComparisonPose,
      setComparisonMode,
      capturePhoto,
      retakePhoto,
      markPhotoMissing,
      savePhotoCapture,
      setSelectedPhotoCheckpoint,
      setGuidanceVisible,
      setAthleteFeedback,
      setGoalDecision,
      setPriorityDecision,
      savePhaseReview,
      resetProgressDemo
    };
  }, [state, locale]);

  return <ProgressStoreContext.Provider value={value}>{children}</ProgressStoreContext.Provider>;
}

export function useProgressStore() {
  const context = useContext(ProgressStoreContext);

  if (!context) {
    throw new Error("useProgressStore must be used within ProgressProvider");
  }

  return context;
}

export function formatProgressMeasurement(value: number | null, unit: string) {
  return formatMeasurementValue(value, unit);
}

export function formatProgressDifference(value: number | null, unit: string) {
  return formatMeasurementDifference(value, unit);
}

export function getProgressPhotoCheckpointLabel(checkpoint: ProgressState["photos"]["selectedCheckpoint"]) {
  return getPhotoCheckpoint(createProgressDemoState().photos, checkpoint).label;
}
