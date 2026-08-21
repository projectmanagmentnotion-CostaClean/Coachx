"use client";

import { useParams } from "next/navigation";
import { ExerciseDetailExperience } from "@/components/exercise-detail-experience";

function resolveParam(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

export default function WorkoutExerciseDetailPage() {
  const params = useParams<{ sessionId: string; exerciseId: string }>();
  const sessionId = resolveParam(params.sessionId);
  const exerciseId = resolveParam(params.exerciseId) || "barbell-hip-thrust";

  return (
    <ExerciseDetailExperience
      exerciseId={exerciseId}
      backHref={`/workout/${sessionId}/exercise/${exerciseId}`}
      source="workout"
    />
  );
}
