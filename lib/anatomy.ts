import type { MuscleGroup } from "@/lib/coachx-data";

export type AnatomyOrientation = "anterior" | "posterior" | "neutral";

export interface AnatomyVisual {
  key: string;
  title: string;
  orientation: AnatomyOrientation;
  focusLabel: string;
  approvalNote: string;
}

const anatomyVisualByFocus: Record<string, AnatomyVisual> = {
  "glutes+hamstrings": {
    key: "posterior-lower-body",
    title: "Posterior lower-body focus",
    orientation: "posterior",
    focusLabel: "Glutes + Hamstrings",
    approvalNote: "Approved posterior asset pending"
  },
  "quadriceps+calves": {
    key: "anterior-lower-body",
    title: "Lower-body focus",
    orientation: "neutral",
    focusLabel: "Quadriceps + Calves",
    approvalNote: "Approved lower-body asset pending"
  },
  "chest+triceps": {
    key: "anterior-upper-body",
    title: "Upper-body push focus",
    orientation: "anterior",
    focusLabel: "Chest + Triceps",
    approvalNote: "Approved upper-body asset pending"
  },
  "shoulders+triceps": {
    key: "anterior-upper-body",
    title: "Upper-body press focus",
    orientation: "anterior",
    focusLabel: "Shoulders + Triceps",
    approvalNote: "Approved upper-body asset pending"
  },
  "back+lats": {
    key: "posterior-upper-body",
    title: "Upper-body pull focus",
    orientation: "posterior",
    focusLabel: "Back + Lats",
    approvalNote: "Approved upper-body asset pending"
  },
  "core": {
    key: "neutral-core",
    title: "Core focus",
    orientation: "neutral",
    focusLabel: "Core",
    approvalNote: "Approved core asset pending"
  }
};

function createFocusKey(focus: MuscleGroup[]) {
  return focus.slice().sort().join("+");
}

export function resolveAnatomyVisual(focus: MuscleGroup[]): AnatomyVisual {
  const exact = anatomyVisualByFocus[createFocusKey(focus)];
  if (exact) {
    return exact;
  }

  if (focus.includes("glutes") || focus.includes("hamstrings") || focus.includes("quadriceps") || focus.includes("calves")) {
    return anatomyVisualByFocus["glutes+hamstrings"];
  }

  if (focus.includes("back") || focus.includes("lats")) {
    return anatomyVisualByFocus["back+lats"];
  }

  if (focus.includes("chest") || focus.includes("triceps") || focus.includes("shoulders") || focus.includes("biceps")) {
    return anatomyVisualByFocus["chest+triceps"];
  }

  return anatomyVisualByFocus.core;
}
