"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { useProgramStore } from "@/components/program-provider";
import { useOnboardingStore } from "@/components/onboarding-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  applySnapshotToProgram,
  buildProfileReview,
  createNotificationSettings,
  createProfileSnapshot,
  getProfileSectionOrder,
  profileStorageKey,
  reviveProfileSettingsState,
  serializeProfileSettingsState,
  type NotificationCategoryId,
  type NotificationPermissionState,
  type NotificationSettings,
  type ProfileEditSection,
  type ProfileImpactReview,
  type ProfileSettingsState,
  type ProfileSnapshot,
  type ReminderIntensity
} from "@/lib/profile-settings-data";
import { buildProfileSnapshotFromOnboarding, loadAthleteSnapshot, mapOnboardingStatus, resolveAthleteSnapshotLocale, saveAthleteSnapshot } from "@/lib/athlete-service";
import { loadNotificationPreferences, saveNotificationPreferences } from "@/lib/notification-service";
import { publishFeedbackError, publishFeedbackSuccess } from "@/components/feedback-provider";

const localeFeedbackCopy: Record<ProfileSnapshot["profile"]["locale"], { successTitle: string; successDetail: string; errorTitle: string; errorDetail: string }> = {
  es: {
    successTitle: "Idioma guardado",
    successDetail: "Se aplicó al instante.",
    errorTitle: "No se pudo guardar el idioma",
    errorDetail: "Se mantiene el idioma actual."
  },
  ca: {
    successTitle: "Idioma desat",
    successDetail: "S'ha aplicat a l'instant.",
    errorTitle: "No s'ha pogut desar l'idioma",
    errorDetail: "Es manté l'idioma actual."
  },
  en: {
    successTitle: "Language saved",
    successDetail: "Applied instantly.",
    errorTitle: "Language could not be saved",
    errorDetail: "The current language stays in place."
  },
  de: {
    successTitle: "Sprache gespeichert",
    successDetail: "Wird sofort angewendet.",
    errorTitle: "Sprache konnte nicht gespeichert werden",
    errorDetail: "Die aktuelle Sprache bleibt erhalten."
  }
};

interface ProfileSettingsStoreValue extends ProfileSettingsState {
  commitProfileSnapshot: (nextSnapshot: ProfileSnapshot) => ProfileImpactReview;
  commitLocale: (locale: ProfileSnapshot["profile"]["locale"]) => void;
  commitNotifications: (nextNotifications: NotificationSettings) => void;
  updateNotificationCategory: (categoryId: NotificationCategoryId, enabled: boolean) => void;
  setNotificationPermission: (permission: NotificationPermissionState) => void;
  setReminderIntensity: (intensity: ReminderIntensity) => void;
  setQuietHours: (patch: Partial<NotificationSettings["quietHours"]>) => void;
  clearPendingReview: () => void;
  applyPendingReview: () => void;
  markSaveError: (message: string) => void;
  resetProfileSettings: () => void;
  sectionOrder: Array<{ id: ProfileEditSection; label: string; route: string; summary: string }>;
}

const ProfileSettingsContext = createContext<ProfileSettingsStoreValue | null>(null);

export function ProfileSettingsProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const { setLocale, locale } = useLocale();
  const authRef = useRef(auth);
  const programStore = useProgramStore();
  const programStoreRef = useRef(programStore);
  const onboarding = useOnboardingStore();
  const onboardingRef = useRef(onboarding);
  const [state, setState] = useState<ProfileSettingsState>(() => reviveProfileSettingsState(null));

  useEffect(() => {
    onboardingRef.current = onboarding;
  }, [onboarding]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    programStoreRef.current = programStore;
  }, [programStore]);

  useEffect(() => {
    if (!auth.ready || auth.isConfigured || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileStorageKey, serializeProfileSettingsState(state));
  }, [auth.isConfigured, auth.ready, state]);

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;

    async function hydrateFromRemote() {
      const client = getSupabaseBrowserClient();
      const currentAuth = authRef.current;

      if (!currentAuth.isConfigured || !currentAuth.user || !client) {
        if (!currentAuth.isConfigured && typeof window !== "undefined") {
          setState(reviveProfileSettingsState(window.localStorage.getItem(profileStorageKey)));
        }
        return;
      }

      try {
        const [remote, notificationResult] = await Promise.all([
          loadAthleteSnapshot(client, currentAuth.user.id),
          loadNotificationPreferences(client, currentAuth.user.id, state.notifications.permission)
        ]);
        if (!active) {
          return;
        }

        if (remote.source === "default") {
          await saveAthleteSnapshot(
            client,
            currentAuth.user.id,
            state.saved,
            mapOnboardingStatus(onboardingRef.current.state.progress.status),
            onboardingRef.current.state.progress.status === "complete" ? new Date().toISOString() : null
          );
          if (notificationResult.source === "default") {
            await saveNotificationPreferences(client, currentAuth.user.id, notificationResult.settings);
          }
          return;
        }

        const nextNotifications = notificationResult.settings;
        const nextSaved = {
          ...remote.snapshot,
          profile: {
            ...remote.snapshot.profile,
            locale: resolveAthleteSnapshotLocale(remote, onboardingRef.current.state.profile.locale)
          }
        };
        setState((current) => ({
          ...current,
          saved: nextSaved,
          notifications: nextNotifications,
          pendingReview: null,
          saveState: "saved",
          saveError: null,
          lastSavedLabel: "Loaded"
        }));
        setLocale(nextSaved.profile.locale);
        onboardingRef.current.setProfile(remote.snapshot.profile);
        onboardingRef.current.setGoals(remote.snapshot.goals);
        onboardingRef.current.setTrainingPreferences(remote.snapshot.trainingPreferences);
        onboardingRef.current.setScheduleLifestyle(remote.snapshot.scheduleLifestyle);
        onboardingRef.current.setHealthLimitations(remote.snapshot.healthLimitations);
        onboardingRef.current.setNutritionPreferences(remote.snapshot.nutritionPreferences);
        onboardingRef.current.setProgram(applySnapshotToProgram(onboardingRef.current.program, remote.snapshot));
        if (!remote.preferencesPresent) {
          await saveAthleteSnapshot(
            client,
            currentAuth.user.id,
            nextSaved,
            mapOnboardingStatus(onboardingRef.current.state.progress.status),
            onboardingRef.current.state.progress.status === "complete" ? new Date().toISOString() : null
          );
        }
        if (notificationResult.source === "default") {
          await saveNotificationPreferences(client, currentAuth.user.id, nextNotifications);
        }
      } catch {
        if (active) {
          setState((current) => ({
            ...current,
            saveState: "error",
            saveError: "Unable to load your saved profile."
          }));
        }
      }
    }

    void hydrateFromRemote();

    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.ready, auth.user?.id, locale]);

  async function persistSnapshot(nextSnapshot: ProfileSnapshot) {
    const client = getSupabaseBrowserClient();
    const currentAuth = authRef.current;

    if (!currentAuth.isConfigured || !currentAuth.user || !client) {
      return;
    }

    await saveAthleteSnapshot(
      client,
      currentAuth.user.id,
      nextSnapshot,
      mapOnboardingStatus(onboardingRef.current.state.progress.status),
      onboardingRef.current.state.progress.status === "complete" ? new Date().toISOString() : null
    );
  }

  const value = useMemo<ProfileSettingsStoreValue>(() => {
    const commitProfileSnapshot: ProfileSettingsStoreValue["commitProfileSnapshot"] = (nextSnapshot) => {
      const currentOnboarding = onboardingRef.current;
      const review = buildProfileReview(state.saved, nextSnapshot, programStoreRef.current.program ?? currentOnboarding.program);
      setState((current) => ({
        ...current,
        saved: nextSnapshot,
        pendingReview: review,
        saveState: "saved",
        saveError: null,
        lastSavedLabel: "Saved just now"
      }));
      void persistSnapshot(nextSnapshot)
        .then(() => {
          publishFeedbackSuccess(
            "profile.save",
            review.classification === "NO_IMPACT" ? "Profile saved" : "Profile saved for review",
            review.classification === "NO_IMPACT"
              ? "Your profile is ready."
              : "Your current program stays unchanged until you confirm the review."
          );
        })
        .catch(() => {
          publishFeedbackError("profile.save", "Profile could not be saved", "Your previous profile is still intact.");
          setState((current) => ({
            ...current,
            saveState: "error",
            saveError: "Unable to save your profile."
          }));
        });
      return review;
    };

    const commitLocale: ProfileSettingsStoreValue["commitLocale"] = (nextLocale) => {
      const nextSnapshot: ProfileSnapshot = {
        ...state.saved,
        profile: {
          ...state.saved.profile,
          locale: nextLocale
        }
      };

      setLocale(nextLocale);
      setState((current) => ({
        ...current,
        saved: nextSnapshot,
        pendingReview: null,
        saveState: "saved",
        saveError: null,
        lastSavedLabel: "Language saved"
      }));
      const client = getSupabaseBrowserClient();
      const currentAuth = authRef.current;
      if (currentAuth.isConfigured && currentAuth.user && client) {
        void saveAthleteSnapshot(
          client,
          currentAuth.user.id,
          nextSnapshot,
          mapOnboardingStatus(onboardingRef.current.state.progress.status),
          onboardingRef.current.state.progress.status === "complete" ? new Date().toISOString() : null
        )
          .then(() => {
            const copy = localeFeedbackCopy[nextLocale];
            publishFeedbackSuccess("profile.locale", copy.successTitle, copy.successDetail);
          })
          .catch(() => {
            const copy = localeFeedbackCopy[nextLocale];
            publishFeedbackError("profile.locale", copy.errorTitle, copy.errorDetail);
            setState((current) => ({
              ...current,
              saveState: "error",
              saveError: "Unable to save your language preference."
            }));
          });
      }
    };

    const commitNotifications: ProfileSettingsStoreValue["commitNotifications"] = (nextNotifications) => {
      setState((current) => ({
        ...current,
        notifications: nextNotifications,
        saveState: "saved",
        saveError: null,
        pendingReview: null,
        lastSavedLabel: "Notifications saved"
      }));

      const client = getSupabaseBrowserClient();
      const currentAuth = authRef.current;
      if (currentAuth.isConfigured && currentAuth.user && client) {
        void saveNotificationPreferences(client, currentAuth.user.id, nextNotifications)
          .then(() => {
            publishFeedbackSuccess("profile.notifications", "Notification preferences saved", "Your notification preferences are ready.");
          })
          .catch(() => {
            publishFeedbackError("profile.notifications", "Notification preferences could not be saved", "Your current preferences stay in place.");
            setState((current) => ({
              ...current,
              saveState: "error",
              saveError: "Unable to save your notification preferences."
            }));
          });
      }
    };

    const updateNotificationCategory: ProfileSettingsStoreValue["updateNotificationCategory"] = (categoryId, enabled) => {
      setState((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          categories: current.notifications.categories.map((category) => (category.id === categoryId ? { ...category, enabled } : category))
        },
        saveState: "saved",
        saveError: null,
        pendingReview: null,
        lastSavedLabel: "Notification saved"
      }));
    };

    const setNotificationPermission: ProfileSettingsStoreValue["setNotificationPermission"] = (permission) => {
      setState((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          permission
        }
      }));
    };

    const setReminderIntensity: ProfileSettingsStoreValue["setReminderIntensity"] = (intensity) => {
      setState((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          intensity
        }
      }));
    };

    const setQuietHours: ProfileSettingsStoreValue["setQuietHours"] = (patch) => {
      setState((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          quietHours: {
            ...current.notifications.quietHours,
            ...patch
          }
        }
      }));
    };

    const clearPendingReview: ProfileSettingsStoreValue["clearPendingReview"] = () => {
      setState((current) => ({
        ...current,
        pendingReview: null
      }));
    };

    const applyPendingReview: ProfileSettingsStoreValue["applyPendingReview"] = () => {
      if (!state.pendingReview) {
        return;
      }

      const currentOnboarding = onboardingRef.current;
      currentOnboarding.setProfile(state.saved.profile);
      currentOnboarding.setGoals(state.saved.goals);
      currentOnboarding.setTrainingPreferences(state.saved.trainingPreferences);
      currentOnboarding.setScheduleLifestyle(state.saved.scheduleLifestyle);
      currentOnboarding.setHealthLimitations(state.saved.healthLimitations);
      currentOnboarding.setNutritionPreferences(state.saved.nutritionPreferences);
      currentOnboarding.setProgram(applySnapshotToProgram(programStoreRef.current.program ?? currentOnboarding.program, state.saved));

      setState((current) => ({
        ...current,
        pendingReview: null,
        saveState: "saved",
        saveError: null,
        lastSavedLabel: "Program update applied"
      }));
      publishFeedbackSuccess("program-change.apply", "Program updated", "Your approved change is now active.");
    };

    const markSaveError: ProfileSettingsStoreValue["markSaveError"] = (message) => {
      setState((current) => ({
        ...current,
        saveState: "error",
        saveError: message
      }));
    };

    const resetProfileSettings: ProfileSettingsStoreValue["resetProfileSettings"] = () => {
      const snapshot = createProfileSnapshot();
      const notifications = createNotificationSettings();
      setState({
        saved: snapshot,
        notifications,
        pendingReview: null,
        saveState: "idle",
        saveError: null,
        lastSavedLabel: "Draft not saved yet"
      });

      if (!authRef.current.isConfigured && typeof window !== "undefined") {
        window.localStorage.setItem(
          profileStorageKey,
          serializeProfileSettingsState({
            saved: snapshot,
            notifications,
            pendingReview: null,
            saveState: "idle",
            saveError: null,
            lastSavedLabel: "Draft not saved yet"
          })
        );
      }
    };

    return {
      ...state,
      commitProfileSnapshot,
      commitLocale,
      commitNotifications,
      updateNotificationCategory,
      setNotificationPermission,
      setReminderIntensity,
      setQuietHours,
      clearPendingReview,
      applyPendingReview,
      markSaveError,
      resetProfileSettings,
      sectionOrder: getProfileSectionOrder(locale)
    };
  }, [state, locale]);

  return <ProfileSettingsContext.Provider value={value}>{children}</ProfileSettingsContext.Provider>;
}

export function useProfileSettingsStore() {
  const context = useContext(ProfileSettingsContext);

  if (!context) {
    throw new Error("useProfileSettingsStore must be used within ProfileSettingsProvider");
  }

  return context;
}
