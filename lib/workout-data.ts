import type { MuscleGroup } from "@/lib/coachx-data";

import type { SupportedLocale } from "@/lib/numeric-input";

export type WorkoutEquipment = "barbell" | "machine" | "smith" | "dumbbells" | "cable" | "bodyweight";
export type CompatibilityLabel = "EXCELLENT" | "GOOD";

export interface SetPrescription {
  setNumber: number;
  previous: string;
  kilograms: string;
  reps: string;
  rir?: string;
  completed: boolean;
  workoutSetId?: string;
  status?: "planned" | "completed" | "skipped";
  completedAt?: string | null;
  notes?: string | null;
}

export interface CompletedSet {
  setNumber: number;
  kilograms: number;
  reps: number;
  rir?: number;
  performedAt: string;
}

export interface WorkoutWorkflowState {
  activeExerciseId: string | null;
  activeSetNumber: number | null;
  restEndsAt: string | null;
  pausedAt: string | null;
  pauseAccumulatedMs: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  equipment: WorkoutEquipment;
  summary: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  thumbnail?: string;
  heroImage?: string;
  label: string;
  programSets: number;
  programReps: string;
  programRir: string;
  restSeconds: number;
  lastPerformance: string;
  progressionTarget: string;
  setup: string[];
  howToDo: string[];
  coachCues: string[];
  commonMistakes: string[];
  alternatives: string[];
}

export interface ExerciseAlternative {
  id: string;
  exerciseId: string;
  label: CompatibilityLabel;
  equipment: WorkoutEquipment;
  summary: string;
  lastPerformance: string;
  note?: string;
}

export interface SessionExercise {
  id: string;
  sessionExerciseId?: string;
  prescribedTemplateExerciseId?: string | null;
  prescribedExerciseId: string;
  performedExerciseId: string;
  order: number;
  totalExercises: number;
  totalSets: number;
  targetRir: string;
  restSeconds: number;
  lastComparableSession: string;
  suggestedTarget: string;
  sets: SetPrescription[];
  completedSets: CompletedSet[];
  status?: "planned" | "completed" | "skipped";
  startedAt?: string | null;
  completedAt?: string | null;
  swapReason?: string | null;
}

export interface RestTimerState {
  exerciseId: string;
  setNumber: number;
  secondsRemaining: number;
  active: boolean;
  endsAt?: string | null;
}

export interface SessionAdjustmentState {
  reason: string;
  selectedTime: "20 min" | "30 min" | "45 min" | null;
  recommendation: string;
  applied: boolean;
}

export interface SafetySelectionState {
  feeling: "muscle burn" | "soreness" | "discomfort" | "pain" | "not sure" | null;
  location: string;
  intensity: number;
  movementPhase: string;
  action: string;
}

export interface WorkoutSummaryState {
  duration: string;
  exercisesCompleted: string;
  setsCompleted: string;
  totalVolume: string;
  averageRir?: string | null;
  insight: string;
  nextTime: Array<{ label: string; detail: string }>;
  feedback: Array<"Too Easy" | "Good" | "Challenging">;
}

export interface WorkoutSessionState {
  id: string;
  workoutSessionId?: string;
  scheduledWorkoutId?: string | null;
  workoutTemplateId?: string | null;
  dateLabel: string;
  workoutLabel: string;
  phaseLabel: string;
  subtitle: string;
  totalExercises: number;
  totalSets: number;
  lastSessionLabel: string;
  workoutType: string;
  targetRir: string;
  exercises: SessionExercise[];
  restTimer: RestTimerState | null;
  adjustment: SessionAdjustmentState;
  safety: SafetySelectionState;
  summary: WorkoutSummaryState;
  status?: "in_progress" | "completed" | "abandoned";
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  notes?: string | null;
  sessionMetadata?: Record<string, unknown> | null;
  workflow?: WorkoutWorkflowState;
  saveState?: "idle" | "pending" | "saved" | "error";
  saveError?: string | null;
  source?: "demo" | "remote" | "cache";
  persistence?: {
    workoutSessionId: string;
    scheduledWorkoutId: string | null;
    workoutTemplateId: string | null;
    status: "in_progress" | "completed" | "abandoned";
    startedAt: string | null;
    completedAt: string | null;
    durationSeconds: number | null;
    notes: string | null;
    sessionMetadata: Record<string, unknown> | null;
  };
}

export const coachxExerciseCatalog: ExerciseDefinition[] = [
  {
    id: "barbell-hip-thrust",
    name: "Hip Thrust",
    equipment: "barbell",
    summary: "Glute-focused hip extension with a stable barbell setup.",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    label: "BARBELL",
    programSets: 4,
    programReps: "8-10",
    programRir: "1-2",
    restSeconds: 120,
    lastPerformance: "80 kg | 10, 10, 9, 8",
    progressionTarget: "Maintain 80 kg and reach 10 reps across all 4 sets.",
    setup: [
      "Bench height: just below shoulder blades",
      "Feet planted so shins sit vertical at the top",
      "Bar centered over the hip crease"
    ],
    howToDo: [
      "Upper back supported on the bench.",
      "Drive hips upward while keeping ribs controlled.",
      "Finish with full hip extension without overextending the lower back."
    ],
    coachCues: [
      "Drive through the whole foot.",
      "Keep ribs down.",
      "Squeeze glutes at the top."
    ],
    commonMistakes: [
      "Overextending the lower back",
      "Feet too far forward",
      "Losing control on the descent"
    ],
    alternatives: ["glute-drive-machine", "smith-hip-thrust", "dumbbell-hip-thrust", "cable-pull-through"]
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    equipment: "dumbbells",
    summary: "Hinge-focused posterior chain exercise with a long eccentric.",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["back", "core"],
    label: "DUMBBELLS",
    programSets: 3,
    programReps: "8-10",
    programRir: "1-2",
    restSeconds: 120,
    lastPerformance: "30 kg dumbbells | 10, 10, 9",
    progressionTarget: "Stay at 30 kg and reach all 10s.",
    setup: [
      "Soft knees and stacked ribs",
      "Dumbbells start high on the thighs",
      "Shoulders stay packed before the hinge"
    ],
    howToDo: [
      "Hinge back with the hips and keep the spine neutral.",
      "Lower until hamstrings feel loaded but control stays intact.",
      "Drive up by pushing the hips forward."
    ],
    coachCues: ["Think long hamstrings.", "Keep the weights close.", "Own the bottom position."],
    commonMistakes: ["Turning it into a squat", "Rounding the spine", "Dropping too deep"],
    alternatives: ["barbell-hip-thrust", "glute-drive-machine", "cable-pull-through"]
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    equipment: "dumbbells",
    summary: "Single-leg strength work with a strong glute and quad demand.",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    label: "DUMBBELLS",
    programSets: 3,
    programReps: "10-12 each leg",
    programRir: "1-2",
    restSeconds: 90,
    lastPerformance: "18 kg | 12, 12, 11",
    progressionTarget: "Add 1 rep to each set before adding load.",
    setup: [
      "Rear foot elevated on a stable bench",
      "Front foot far enough to keep the heel planted",
      "Torso slightly inclined"
    ],
    howToDo: ["Descend under control.", "Drive through the front foot.", "Keep hips level."],
    coachCues: ["Track the knee over the foot.", "Stay tall through the torso.", "Use the glute to stand."],
    commonMistakes: ["Too short a stance", "Pushing off the back leg", "Rushing the bottom"],
    alternatives: ["walking-lunge", "romanian-deadlift", "barbell-hip-thrust"],
    thumbnail: undefined
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    equipment: "machine",
    summary: "Knee flexion isolation for hamstrings.",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["calves"],
    label: "MACHINE",
    programSets: 3,
    programReps: "12-15",
    programRir: "1-2",
    restSeconds: 75,
    lastPerformance: "42 kg | 15, 14, 13",
    progressionTarget: "Hit 15 reps across all sets.",
    setup: ["Align the knee joint with the machine axis", "Set the pad just above the ankle", "Brace the torso against the pad"],
    howToDo: ["Curl smoothly.", "Pause at peak contraction.", "Lower under control."],
    coachCues: ["Keep hips pinned.", "Squeeze through the hamstrings.", "Avoid bouncing the stack."],
    commonMistakes: ["Lifting the hips", "Using momentum", "Cutting the range short"],
    alternatives: ["cable-pull-through", "walking-lunge", "romanian-deadlift"],
    thumbnail: undefined
  },
  {
    id: "cable-kickback",
    name: "Cable Kickback",
    equipment: "cable",
    summary: "Short-range glute isolation with continuous tension.",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    label: "CABLE",
    programSets: 3,
    programReps: "12-15",
    programRir: "1-2",
    restSeconds: 60,
    lastPerformance: "15 kg | 15, 14, 13",
    progressionTarget: "Add 1-2 reps per set.",
    setup: ["Chest tall, pelvis neutral", "Cable cuff stays low", "Support hand stable on the frame"],
    howToDo: ["Extend the leg back with the glute.", "Pause at full extension.", "Return without shifting the torso."],
    coachCues: ["Keep the pelvis square.", "Move from the hip.", "Avoid twisting open."],
    commonMistakes: ["Swinging the leg", "Arching the back", "Using too much load"],
    alternatives: ["glute-drive-machine", "smith-hip-thrust", "walking-lunge"],
    thumbnail: undefined
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    equipment: "bodyweight",
    summary: "Dynamic unilateral lower-body movement for glutes and quads.",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    label: "BODYWEIGHT",
    programSets: 2,
    programReps: "20 steps",
    programRir: "1-2",
    restSeconds: 75,
    lastPerformance: "Bodyweight | 20 steps",
    progressionTarget: "Hold the same steps with cleaner control.",
    setup: ["Stand tall with a soft core brace", "Step long enough to keep the front heel planted", "Keep the torso stacked"],
    howToDo: ["Step forward.", "Drop under control.", "Drive through the front leg and continue walking."],
    coachCues: ["Own the step length.", "Stay balanced.", "Push the floor away."],
    commonMistakes: ["Short step length", "Knee collapse", "Leaning excessively forward"],
    alternatives: ["bulgarian-split-squat", "romanian-deadlift", "barbell-hip-thrust"],
    thumbnail: undefined
  },
  {
    id: "glute-drive-machine",
    name: "Glute Drive Machine",
    equipment: "machine",
    summary: "Machine-based hip extension with a fixed path.",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    label: "EXCELLENT",
    programSets: 4,
    programReps: "8-10",
    programRir: "1-2",
    restSeconds: 120,
    lastPerformance: "70 kg | 10, 10, 10, 9",
    progressionTarget: "Match hip thrust output with more stability.",
    setup: ["Seat the pelvis firmly", "Pad sits in the hip crease", "Feet placed for vertical shins at lockout"],
    howToDo: ["Drive through the heels.", "Lock the glutes.", "Control the eccentric."],
    coachCues: ["Keep the ribs down.", "Do not overarch.", "Pause at the top."],
    commonMistakes: ["Rushing reps", "Short lockout", "Overusing the lower back"],
    alternatives: ["barbell-hip-thrust", "smith-hip-thrust", "dumbbell-hip-thrust"],
    thumbnail: undefined
  },
  {
    id: "smith-hip-thrust",
    name: "Smith Hip Thrust",
    equipment: "smith",
    summary: "Stable hip thrust variation on the Smith machine.",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    label: "EXCELLENT",
    programSets: 4,
    programReps: "8-10",
    programRir: "1-2",
    restSeconds: 120,
    lastPerformance: "85 kg | 8, 8, 8, 8",
    progressionTarget: "Build stability and then push the top set.",
    setup: ["Bar path aligned with the pelvis", "Bench fixed behind the shoulders", "Feet set for the top lockout"],
    howToDo: ["Lower under control.", "Drive hips upward.", "Hold the glute squeeze briefly."],
    coachCues: ["Keep the bar path clean.", "Own the lockout.", "Stay braced."],
    commonMistakes: ["Feet too close", "Overextending the spine", "Touching down too fast"],
    alternatives: ["barbell-hip-thrust", "glute-drive-machine", "dumbbell-hip-thrust"],
    thumbnail: undefined
  },
  {
    id: "dumbbell-hip-thrust",
    name: "Dumbbell Hip Thrust",
    equipment: "dumbbells",
    summary: "Simple hip extension with lighter loading potential.",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    label: "GOOD",
    programSets: 3,
    programReps: "10-12",
    programRir: "1-2",
    restSeconds: 90,
    lastPerformance: "40 kg | 12, 12, 11",
    progressionTarget: "Increase reps before jumping load.",
    setup: ["Dumbbell centered over the hips", "Bench height matches shoulder support", "Feet set for a strong top position"],
    howToDo: ["Press the hips upward.", "Keep the DB stable.", "Control the lowering phase."],
    coachCues: ["Stay stacked.", "Use the glutes, not the back.", "Finish tall."],
    commonMistakes: ["Letting the dumbbell roll", "Walking feet too far out", "Cutting the lockout short"],
    alternatives: ["barbell-hip-thrust", "smith-hip-thrust", "glute-drive-machine"],
    thumbnail: undefined
  },
  {
    id: "cable-pull-through",
    name: "Cable Pull Through",
    equipment: "cable",
    summary: "Cable hip hinge with strong glute and hamstring emphasis.",
    primaryMuscles: ["glutes", "hamstrings"],
    secondaryMuscles: ["core", "back"],
    label: "GOOD",
    programSets: 3,
    programReps: "12-15",
    programRir: "1-2",
    restSeconds: 75,
    lastPerformance: "25 kg | 15, 15, 14",
    progressionTarget: "Add load or 1 rep per set.",
    setup: ["Cable low and between the legs", "Step forward to tension the stack", "Brace and hinge back"],
    howToDo: ["Hinge through the hips.", "Snap the hips forward.", "Keep the arms as hooks."],
    coachCues: ["Push hips through.", "Stay long through the spine.", "Own the tension."],
    commonMistakes: ["Squatting the movement", "Pulling with the arms", "Rounding at the bottom"],
    alternatives: ["barbell-hip-thrust", "romanian-deadlift", "glute-drive-machine"],
    thumbnail: undefined
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "machine",
    summary: "Vertical pull for back and lats.",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps"],
    label: "GOOD",
    programSets: 3,
    programReps: "8-12",
    programRir: "1-2",
    restSeconds: 90,
    lastPerformance: "45 kg | 12, 11, 10",
    progressionTarget: "Keep the chest tall and match the top reps.",
    setup: ["Thigh pads locked", "Hands outside shoulder width", "Chest lifted before the pull"],
    howToDo: ["Pull elbows down.", "Bring the bar to upper chest.", "Control the return."],
    coachCues: ["Drive elbows to ribs.", "Keep the neck relaxed.", "Avoid leaning too far back."],
    commonMistakes: ["Swinging the torso", "Pulling behind the neck", "Half reps"],
    alternatives: ["romanian-deadlift", "cable-pull-through"],
    thumbnail: undefined
  },
  {
    id: "chest-press",
    name: "Chest Press",
    equipment: "machine",
    summary: "Controlled pressing movement for chest and triceps.",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    label: "GOOD",
    programSets: 3,
    programReps: "8-12",
    programRir: "1-2",
    restSeconds: 90,
    lastPerformance: "32 kg | 12, 11, 10",
    progressionTarget: "Keep form clean and build the top set.",
    setup: ["Seat position keeps handles mid-chest", "Shoulders pinned", "Feet stable"],
    howToDo: ["Press smoothly.", "Pause near lockout.", "Return under control."],
    coachCues: ["Keep shoulders packed.", "Do not flare excessively.", "Stay balanced through the torso."],
    commonMistakes: ["Bouncing the stack", "Rushing the lowering phase", "Losing scapular control"],
    alternatives: ["barbell-hip-thrust", "lat-pulldown"],
    thumbnail: undefined
  }
];

export const coachxExerciseAlternativeMap: Record<string, ExerciseAlternative[]> = {
  "barbell-hip-thrust": [
    { id: "glute-drive-machine", exerciseId: "glute-drive-machine", label: "EXCELLENT", equipment: "machine", summary: "Same movement pattern and primary muscle emphasis.", lastPerformance: "70 kg | 10 · 10 · 10 · 9" },
    { id: "smith-hip-thrust", exerciseId: "smith-hip-thrust", label: "EXCELLENT", equipment: "smith", summary: "Stable hip extension pattern with greater control.", lastPerformance: "85 kg | 8 · 8 · 8 · 8" },
    { id: "dumbbell-hip-thrust", exerciseId: "dumbbell-hip-thrust", label: "GOOD", equipment: "dumbbells", summary: "Same hip extension pattern with lower loading potential.", lastPerformance: "40 kg | 12 · 12 · 11" },
    { id: "cable-pull-through", exerciseId: "cable-pull-through", label: "GOOD", equipment: "cable", summary: "Hip hinge with a strong glute and hamstring bias.", lastPerformance: "25 kg | 15 · 15 · 14" }
  ]
};

const localizedProgressionTargets: Record<string, Partial<Record<SupportedLocale, string>>> = {
  "Maintain 80 kg and reach 10 reps across all 4 sets.": {
    es: "Mantén 80 kg y llega a 10 repeticiones en las 4 series.",
    ca: "Mantén 80 kg i arriba a 10 repeticions a les 4 sèries.",
    de: "Halte 80 kg und erreiche 10 Wiederholungen in allen 4 Sätzen."
  },
  "Stay at 30 kg and reach all 10s.": {
    es: "Mantente en 30 kg y completa todas las series con 10.",
    ca: "Mantén-te en 30 kg i completa totes les sèries amb 10.",
    de: "Bleib bei 30 kg und erreiche in allen Sätzen 10."
  },
  "Add 1 rep to each set before adding load.": {
    es: "Añade 1 repetición por serie antes de subir carga.",
    ca: "Afegeix 1 repetició per sèrie abans d'augmentar la càrrega.",
    de: "Erhöhe jede Serie um 1 Wiederholung, bevor du Gewicht erhöhst."
  },
  "Hit 15 reps across all sets.": {
    es: "Llega a 15 repeticiones en todas las series.",
    ca: "Arriba a 15 repeticions en totes les sèries.",
    de: "Erreiche 15 Wiederholungen über alle Sätze."
  },
  "Add 1-2 reps per set.": {
    es: "Añade 1-2 repeticiones por serie.",
    ca: "Afegeix 1-2 repeticions per sèrie.",
    de: "Füge pro Satz 1-2 Wiederholungen hinzu."
  },
  "Hold the same steps with cleaner control.": {
    es: "Mantén los mismos pasos con más control.",
    ca: "Mantén els mateixos passos amb més control.",
    de: "Halte die gleichen Schritte mit sauberer Kontrolle."
  },
  "Keep the same steps with cleaner control.": {
    es: "Mantén los mismos pasos con más control.",
    ca: "Mantén els mateixos passos amb més control.",
    de: "Halte die gleichen Schritte mit sauberer Kontrolle."
  },
  "Match hip thrust output with more stability.": {
    es: "Iguala el rendimiento del hip thrust con más estabilidad.",
    ca: "Iguala el rendiment del hip thrust amb més estabilitat.",
    de: "Erreiche die Hip-Thrust-Leistung mit mehr Stabilität."
  },
  "Build stability and then push the top set.": {
    es: "Primero consolida la estabilidad y luego empuja la serie top.",
    ca: "Primer consolida l'estabilitat i després empeny la sèrie top.",
    de: "Baue zuerst Stabilität auf und drücke dann den Top-Satz."
  },
  "Increase reps before jumping load.": {
    es: "Sube repeticiones antes de aumentar la carga.",
    ca: "Augmenta repeticions abans de pujar la càrrega.",
    de: "Erhöhe zuerst die Wiederholungen, bevor du das Gewicht steigerst."
  },
  "Add load or 1 rep per set.": {
    es: "Sube carga o añade 1 repetición por serie.",
    ca: "Afegeix càrrega o 1 repetició per sèrie.",
    de: "Erhöhe das Gewicht oder füge pro Satz 1 Wiederholung hinzu."
  },
  "Keep the chest tall and match the top reps.": {
    es: "Mantén el pecho alto e iguala las repeticiones de la mejor serie.",
    ca: "Mantén el pit alt i iguala les repeticions de la millor sèrie.",
    de: "Halte die Brust aufrecht und gleiche die Top-Wiederholungen an."
  },
  "Keep form clean and build the top set.": {
    es: "Mantén la técnica limpia y construye la serie top.",
    ca: "Mantén la tècnica neta i construeix la sèrie top.",
    de: "Halte die Form sauber und arbeite den Top-Satz aus."
  }
};

export function getExerciseDefinition(exerciseId: string) {
  return coachxExerciseCatalog.find((exercise) => exercise.id === exerciseId) ?? coachxExerciseCatalog[0];
}

export function getExerciseProgressionTarget(locale: SupportedLocale, progressionTarget: string) {
  return localizedProgressionTargets[progressionTarget]?.[locale] ?? progressionTarget;
}

export function getWorkoutExercise(session: WorkoutSessionState, exerciseId: string) {
  return session.exercises.find((exercise) => exercise.id === exerciseId) ?? session.exercises[0];
}

export function getWorkoutAlternativeCards(exerciseId: string) {
  return coachxExerciseAlternativeMap[exerciseId] ?? [];
}

function createSetRows(previousValues: Array<[number, string, string, string]>) {
  return previousValues.map(([setNumber, previous, kilograms, reps]) => ({
    setNumber,
    previous,
    kilograms,
    reps,
    rir: "1-2",
    completed: false
  }));
}

export function createDemoWorkoutSession(): WorkoutSessionState {
  const dateLabel = "Saturday, August 8, 2026";
  return {
    id: "coachx-demo-session",
    dateLabel,
    workoutLabel: "GLUTES + HAMSTRINGS",
    phaseLabel: "WORKOUT A",
    subtitle: "6 exercises ≈ 68 min | Hypertrophy | Target RIR 1–2",
    totalExercises: 6,
    totalSets: 19,
    lastSessionLabel: "LAST SESSION JULY 31 | COMPLETED · 66 MIN",
    workoutType: "GLUTES + HAMSTRINGS",
    targetRir: "1-2",
    exercises: [
      {
        id: "hip-thrust",
        prescribedExerciseId: "barbell-hip-thrust",
        performedExerciseId: "barbell-hip-thrust",
        order: 1,
        totalExercises: 6,
        totalSets: 4,
        targetRir: "1-2",
        restSeconds: 120,
        lastComparableSession: "80 kg | 10, 10, 9, 8",
        suggestedTarget: "Maintain 80 kg and reach 10 reps across all 4 sets.",
        sets: createSetRows([
          [1, "80x10", "80", "10"],
          [2, "80x10", "80", "10"],
          [3, "80x9", "80", "9"],
          [4, "80x8", "80", "8"]
        ]),
        completedSets: []
      },
      {
        id: "romanian-deadlift",
        prescribedExerciseId: "romanian-deadlift",
        performedExerciseId: "romanian-deadlift",
        order: 2,
        totalExercises: 6,
        totalSets: 3,
        targetRir: "1-2",
        restSeconds: 120,
        lastComparableSession: "30 kg dumbbells | 10, 10, 9",
        suggestedTarget: "Match 30 kg and add a cleaner top set.",
        sets: createSetRows([
          [1, "30x10", "30", "10"],
          [2, "30x10", "30", "10"],
          [3, "30x9", "30", "9"]
        ]),
        completedSets: []
      },
      {
        id: "bulgarian-split-squat",
        prescribedExerciseId: "bulgarian-split-squat",
        performedExerciseId: "bulgarian-split-squat",
        order: 3,
        totalExercises: 6,
        totalSets: 3,
        targetRir: "1-2",
        restSeconds: 90,
        lastComparableSession: "18 kg | 12, 12, 11",
        suggestedTarget: "Add 1 rep to each set before adding load.",
        sets: createSetRows([
          [1, "18x12", "18", "12"],
          [2, "18x12", "18", "12"],
          [3, "18x11", "18", "11"]
        ]),
        completedSets: []
      },
      {
        id: "seated-leg-curl",
        prescribedExerciseId: "seated-leg-curl",
        performedExerciseId: "seated-leg-curl",
        order: 4,
        totalExercises: 6,
        totalSets: 3,
        targetRir: "1-2",
        restSeconds: 75,
        lastComparableSession: "42 kg | 15, 14, 13",
        suggestedTarget: "Hit 15 reps across all sets.",
        sets: createSetRows([
          [1, "42x15", "42", "15"],
          [2, "42x14", "42", "14"],
          [3, "42x13", "42", "13"]
        ]),
        completedSets: []
      },
      {
        id: "cable-kickback",
        prescribedExerciseId: "cable-kickback",
        performedExerciseId: "cable-kickback",
        order: 5,
        totalExercises: 6,
        totalSets: 3,
        targetRir: "1-2",
        restSeconds: 60,
        lastComparableSession: "15 kg | 15, 14, 13",
        suggestedTarget: "Add 1-2 reps per set.",
        sets: createSetRows([
          [1, "15x15", "15", "15"],
          [2, "15x14", "15", "14"],
          [3, "15x13", "15", "13"]
        ]),
        completedSets: []
      },
      {
        id: "walking-lunge",
        prescribedExerciseId: "walking-lunge",
        performedExerciseId: "walking-lunge",
        order: 6,
        totalExercises: 6,
        totalSets: 2,
        targetRir: "1-2",
        restSeconds: 75,
        lastComparableSession: "Bodyweight | 20 steps",
        suggestedTarget: "Keep the same steps with cleaner control.",
        sets: createSetRows([
          [1, "BWx20", "BW", "20"],
          [2, "BWx20", "BW", "20"]
        ]),
        completedSets: []
      }
    ],
    restTimer: null,
    workflow: {
      activeExerciseId: "hip-thrust",
      activeSetNumber: 1,
      restEndsAt: null,
      pausedAt: null,
      pauseAccumulatedMs: 0
    },
    adjustment: {
      reason: "I can't train today",
      selectedTime: "30 min",
      recommendation: "Lower-priority work is removed while the main objective stays intact.",
      applied: false
    },
    safety: {
      feeling: null,
      location: "lower back",
      intensity: 5,
      movementPhase: "top of movement",
      action: "Use an alternative exercise"
    },
    summary: {
      duration: "68 min",
      exercisesCompleted: "6 / 6",
      setsCompleted: "19",
      totalVolume: "4,820 kg",
      averageRir: "1.6",
      insight: "Strong session. You increased Hip Thrust load while staying inside the target rep range.",
      nextTime: [
        { label: "HIP THRUST: 85 kg", detail: "Target: 10 reps across all sets" },
        { label: "ROMANIAN DEADLIFT: 30 kg", detail: "Target: Add 1–2 total reps" }
      ],
      feedback: ["Too Easy", "Good", "Challenging"]
    }
  };
}

export function countCompletedSets(session: WorkoutSessionState) {
  return session.exercises.reduce((total, exercise) => total + exercise.completedSets.length, 0);
}

export function countCompletedExercises(session: WorkoutSessionState) {
  return session.exercises.filter((exercise) => exercise.completedSets.length >= exercise.totalSets).length;
}
