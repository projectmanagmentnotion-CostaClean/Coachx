"use client";

import { useSyncExternalStore } from "react";
import { getCurrentLocalDateKey } from "@/lib/program-service";

function subscribeToCivilDate(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(intervalId);
}

export function useCurrentLocalDateKey() {
  return useSyncExternalStore<string | null>(subscribeToCivilDate, getCurrentLocalDateKey, () => null);
}
