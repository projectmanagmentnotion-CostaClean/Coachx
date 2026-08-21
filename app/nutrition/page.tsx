"use client";

import { useSearchParams } from "next/navigation";
import { NutritionScreen } from "@/components/nutrition-screen";
import { useCurrentLocalDateKey } from "@/components/use-current-local-date-key";
import { resolveDateKeyOrCurrentLocal } from "@/lib/program-service";

export default function NutritionPage() {
  const searchParams = useSearchParams();
  const currentDateKey = useCurrentLocalDateKey();
  const requestedDate = searchParams.get("date");
  const requestedMode = searchParams.get("state");
  const mode = requestedMode === "loading" || requestedMode === "empty" || requestedMode === "error" ? requestedMode : "ready";

  if (!currentDateKey) {
    return null;
  }

  const dateKey = resolveDateKeyOrCurrentLocal(requestedDate, currentDateKey);

  return <NutritionScreen dateKey={dateKey} mode={mode} />;
}
