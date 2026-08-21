"use client";

import { useParams } from "next/navigation";
import { ExerciseDetailExperience } from "@/components/exercise-detail-experience";

function resolveExerciseId(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

export default function ExerciseDetailPage() {
  const params = useParams<{ exerciseId: string }>();
  const exerciseId = resolveExerciseId(params.exerciseId) || "barbell-hip-thrust";

  return (
    <ExerciseDetailExperience
      exerciseId={exerciseId}
      backHref="/exercises"
      source="library"
    />
  );
}
