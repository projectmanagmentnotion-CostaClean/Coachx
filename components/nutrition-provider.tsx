"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { useProgramStore } from "@/components/program-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadIdentityResolution, type ManagementMode } from "@/lib/auth/identity-resolver";
import {
  applyMealSelection,
  addHydration,
  buildNutritionDayView,
  createNutritionStoreSnapshot,
  loadOrCreateNutritionStoreSnapshot,
  markMealCompleted,
  markMealEaten,
  nutritionStorageKey,
  persistNutritionStoreSnapshot,
  reviveNutritionStoreSnapshot,
  serializeNutritionStoreSnapshot,
  toggleSupplement,
  type NutritionStoreSnapshot
} from "@/lib/nutrition-service";
import type { NutritionDay } from "@/lib/nutrition-data";

interface NutritionStoreValue {
  day: NutritionDay;
  managementMode: ManagementMode;
  selectMealOption: (slotId: string, optionId: string) => void;
  markMealEaten: (slotId: string) => void;
  markMealCompleted: (slotId: string) => void;
  addHydration: (amountMl: number) => void;
  toggleSupplement: (reminderId: string) => void;
  resetNutritionDemo: () => void;
}

const NutritionStoreContext = createContext<NutritionStoreValue | null>(null);

export function NutritionProvider({ children, dateKey }: { children: ReactNode; dateKey: string }) {
  const auth = useAuthStore();
  const { locale } = useLocale();
  const programStore = useProgramStore();
  const authRef = useRef(auth);
  const programStoreRef = useRef(programStore);
  const hydratedRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const [managementMode, setManagementMode] = useState<ManagementMode>("self_managed");
  const [snapshot, setSnapshot] = useState<NutritionStoreSnapshot>(() =>
    createNutritionStoreSnapshot(dateKey, programStore.getDaySummary(dateKey), auth.user?.id ?? "demo-user", programStore.activeProgram?.id ?? null)
  );

  const programDaySummary = programStore.getDaySummary(dateKey);
  const programSignature = [
    programDaySummary?.scheduledWorkoutId ?? "rest",
    programDaySummary?.templateCode ?? "none",
    programDaySummary?.isRestDay ? "rest" : "training",
    programStore.activeProgram?.id ?? "program-none"
  ].join("|");

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    programStoreRef.current = programStore;
  }, [programStore]);

  useEffect(() => {
    if (!auth.ready || !programStore.ready) {
      return;
    }

    hydratedRef.current = false;
    remoteReadyRef.current = false;
    setManagementMode("self_managed");

    const currentAuth = authRef.current;
    const currentProgram = programStoreRef.current;
    const currentUser = currentAuth.user;
    const userId = currentUser?.id ?? "demo-user";
    const storageKey = nutritionStorageKey(currentAuth.user?.id ?? null, dateKey);
    const rawSnapshot = typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
    const revived = reviveNutritionStoreSnapshot(rawSnapshot, dateKey, currentProgram.getDaySummary(dateKey));
    const client = getSupabaseBrowserClient();

    if (!currentAuth.isConfigured || !currentUser || !client) {
      setSnapshot(
        createNutritionStoreSnapshot(
          dateKey,
          currentProgram.getDaySummary(dateKey),
          userId,
          currentProgram.activeProgram?.id ?? null
        )
      );
      hydratedRef.current = true;
      return;
    }

    let active = true;

    async function hydrateRemote() {
      try {
        if (currentAuth.user && client) {
          const identity = await loadIdentityResolution(client, currentAuth.user.id).catch(() => null);
          if (active && identity) {
            setManagementMode(identity.managementMode);
          }
        }

        const result = await loadOrCreateNutritionStoreSnapshot(
          client!,
          userId,
          dateKey,
          currentProgram.getDaySummary(dateKey),
          currentProgram.activeProgram?.id ?? null
        );

        if (!active) {
          return;
        }

        remoteReadyRef.current = true;
        setSnapshot(result.snapshot);
      } catch {
        if (!active) {
          return;
        }

        remoteReadyRef.current = false;
        setSnapshot({
          ...revived,
          plan: {
            ...revived.plan,
            userId
          },
          day: {
            ...revived.day,
            userId
          }
        });
      } finally {
        if (active) {
          hydratedRef.current = true;
        }
      }
    }

    void hydrateRemote();

    return () => {
      active = false;
    };
  }, [dateKey, auth.ready, auth.user?.id, programStore.ready, programSignature]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") {
      return;
    }

    const storageKey = nutritionStorageKey(authRef.current.user?.id ?? null, dateKey);
    window.localStorage.setItem(storageKey, serializeNutritionStoreSnapshot(snapshot));

    if (!remoteReadyRef.current) {
      return;
    }

    const client = getSupabaseBrowserClient();
    const currentAuth = authRef.current;
    if (!currentAuth.isConfigured || !currentAuth.user || !client) {
      return;
    }

    void persistNutritionStoreSnapshot(client, snapshot).catch(() => {
      remoteReadyRef.current = false;
    });
  }, [snapshot, dateKey]);

  const day = useMemo(() => buildNutritionDayView(snapshot), [snapshot, locale]);

  const value = useMemo<NutritionStoreValue>(() => {
    const selectMealOption: NutritionStoreValue["selectMealOption"] = (slotId, optionId) => {
      setSnapshot((current) => applyMealSelection(current, slotId, optionId));
    };

    const markMealEatenAction: NutritionStoreValue["markMealEaten"] = (slotId) => {
      setSnapshot((current) => markMealEaten(current, slotId));
    };

    const markMealCompletedAction: NutritionStoreValue["markMealCompleted"] = (slotId) => {
      setSnapshot((current) => markMealCompleted(current, slotId));
    };

    const addHydrationAction: NutritionStoreValue["addHydration"] = (amountMl) => {
      setSnapshot((current) => addHydration(current, amountMl));
    };

    const toggleSupplementAction: NutritionStoreValue["toggleSupplement"] = (reminderId) => {
      setSnapshot((current) => toggleSupplement(current, reminderId));
    };

    const resetNutritionDemo: NutritionStoreValue["resetNutritionDemo"] = () => {
      const currentAuth = authRef.current;
      const currentProgram = programStoreRef.current;
      const nextSnapshot = createNutritionStoreSnapshot(
        dateKey,
        currentProgram.getDaySummary(dateKey),
        currentAuth.user?.id ?? "demo-user",
        currentProgram.activeProgram?.id ?? null
      );
      setSnapshot(nextSnapshot);
      if (remoteReadyRef.current) {
        const client = getSupabaseBrowserClient();
        if (currentAuth.isConfigured && currentAuth.user && client) {
          void persistNutritionStoreSnapshot(client, nextSnapshot);
        }
      }
    };

    return {
      day,
      managementMode,
      selectMealOption,
      markMealEaten: markMealEatenAction,
      markMealCompleted: markMealCompletedAction,
      addHydration: addHydrationAction,
      toggleSupplement: toggleSupplementAction,
      resetNutritionDemo
    };
  }, [day, dateKey, locale, managementMode]);

  return <NutritionStoreContext.Provider value={value}>{children}</NutritionStoreContext.Provider>;
}

export function useNutritionSession() {
  const context = useContext(NutritionStoreContext);

  if (!context) {
    throw new Error("useNutritionSession must be used within a NutritionProvider");
  }

  return context;
}
