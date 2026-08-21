export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AthleteOnboardingStatus = "not_started" | "in_progress" | "completed";
export type ProgramStatus = "proposed" | "active" | "completed" | "archived";
export type ProgramPhaseStatus = "upcoming" | "active" | "completed" | "archived";
export type ScheduledWorkoutStatus = "scheduled" | "completed" | "skipped" | "rescheduled" | "cancelled";
export type WorkoutSessionStatus = "in_progress" | "completed" | "abandoned";
export type WorkoutSessionExerciseStatus = "planned" | "completed" | "skipped";
export type WorkoutSetStatus = "planned" | "completed" | "skipped";
export type NutritionPlanStatus = "proposed" | "active" | "completed" | "archived";
export type NutritionDayType = "training" | "rest" | "custom";
export type NutritionDayStatus = "planned" | "in_progress" | "completed";
export type NutritionMealSelectionStatus = "selected" | "eaten" | "skipped";
export type NutritionSupplementStatus = "pending" | "completed";
export type NutritionMeasurementBasis = "raw" | "cooked" | "prepared" | "serving" | "unit";
export type ProgressEntryType = "measurement" | "photo" | "combined" | "checkpoint";
export type ProgressEntrySource = "manual" | "onboarding_baseline" | "phase_review" | "other";
export type ProgressMeasurementKey = "waist" | "hips" | "thigh";
export type ProgressPhotoPose = "front" | "side" | "back";
export type WeeklyCheckinStatus = "not_started" | "in_progress" | "completed" | "submitted" | "reviewed";
export type WeeklyCheckinResponseType = "scale" | "boolean" | "text" | "single_choice" | "multiple_choice" | "numeric";
export type WeeklyCheckinReviewStatus = "pending" | "needs_attention" | "reviewed" | "acknowledged";
export type WeeklyCheckinRecommendationType = "none" | "light_review" | "coach_review" | "program_adjustment";
export type NotificationReminderIntensity = "minimal" | "recommended" | "more-support";
export type CoachRecommendationContextType = "weekly_checkin" | "phase_review" | "profile_review" | "onboarding" | "manual";
export type CoachRecommendationSource = "openai" | "fallback";
export type CoachRecommendationGenerationStatus = "generated" | "fallback" | "failed";
export type CoachRecommendationApplicationStatus = "recommended" | "reviewing" | "applied" | "rejected";
export type CoachProfileStatus = "active" | "paused" | "archived";
export type CoachAssignmentStatus = "invited" | "pending" | "active" | "paused" | "ended" | "revoked";
export type CoachActionType =
  | "checkin_reviewed"
  | "checkin_acknowledged"
  | "followup_requested"
  | "recommendation_approved"
  | "recommendation_rejected"
  | "proposal_approved"
  | "proposal_rejected"
  | "note_added";
export type CoachActionTargetType = "weekly_checkin" | "recommendation" | "proposal" | "athlete";
export type ProgramChangeType =
  | "exercise_swap"
  | "set_adjustment"
  | "rep_range_adjustment"
  | "load_guidance"
  | "volume_adjustment"
  | "workout_reschedule"
  | "workout_frequency_adjustment"
  | "recovery_adjustment"
  | "phase_extension"
  | "phase_transition";
export type ProgramChangeStatus = "draft" | "proposed" | "needs_review" | "approved" | "rejected" | "applied" | "failed" | "superseded" | "expired";
export type ProgramChangeTargetEntityType = "workout_template_exercise" | "scheduled_workout" | "program_phase";
export type ProgramChangeEventSource = "ai" | "deterministic" | "athlete" | "coach";

export interface ProgramsRow {
  id: string;
  user_id: string;
  status: ProgramStatus;
  name: string;
  goal: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramsInsert {
  id?: string;
  user_id: string;
  status?: ProgramStatus;
  name?: string;
  goal?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramsUpdate {
  status?: ProgramStatus;
  name?: string;
  goal?: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

export interface ProgramPhasesRow {
  id: string;
  program_id: string;
  name: string;
  phase_number: number;
  goal: string;
  start_date: string;
  end_date: string;
  status: ProgramPhaseStatus;
  week_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramPhasesInsert {
  id?: string;
  program_id: string;
  name: string;
  phase_number: number;
  goal: string;
  start_date: string;
  end_date: string;
  status?: ProgramPhaseStatus;
  week_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramPhasesUpdate {
  name?: string;
  phase_number?: number;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status?: ProgramPhaseStatus;
  week_count?: number;
  updated_at?: string;
}

export interface WorkoutTemplatesRow {
  id: string;
  phase_id: string;
  name: string;
  code: string;
  focus: string;
  estimated_duration_minutes: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplatesInsert {
  id?: string;
  phase_id: string;
  name: string;
  code: string;
  focus: string;
  estimated_duration_minutes: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutTemplatesUpdate {
  name?: string;
  code?: string;
  focus?: string;
  estimated_duration_minutes?: number;
  sort_order?: number;
  updated_at?: string;
}

export interface WorkoutTemplateExercisesRow {
  id: string;
  workout_template_id: string;
  exercise_key: string;
  sort_order: number;
  sets: number;
  rep_min: number;
  rep_max: number;
  rir_min: number;
  rir_max: number;
  rest_seconds: number;
  notes: string | null;
  prescription_metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercisesInsert {
  id?: string;
  workout_template_id: string;
  exercise_key: string;
  sort_order: number;
  sets: number;
  rep_min: number;
  rep_max: number;
  rir_min: number;
  rir_max: number;
  rest_seconds: number;
  notes?: string | null;
  prescription_metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutTemplateExercisesUpdate {
  exercise_key?: string;
  sort_order?: number;
  sets?: number;
  rep_min?: number;
  rep_max?: number;
  rir_min?: number;
  rir_max?: number;
  rest_seconds?: number;
  notes?: string | null;
  prescription_metadata?: Json;
  updated_at?: string;
}

export interface ScheduledWorkoutsRow {
  id: string;
  user_id: string;
  program_phase_id: string;
  workout_template_id: string;
  scheduled_date: string;
  status: ScheduledWorkoutStatus;
  planned_duration_minutes: number;
  adjustment_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledWorkoutsInsert {
  id?: string;
  user_id: string;
  program_phase_id: string;
  workout_template_id: string;
  scheduled_date: string;
  status?: ScheduledWorkoutStatus;
  planned_duration_minutes: number;
  adjustment_metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledWorkoutsUpdate {
  program_phase_id?: string;
  workout_template_id?: string;
  scheduled_date?: string;
  status?: ScheduledWorkoutStatus;
  planned_duration_minutes?: number;
  adjustment_metadata?: Json | null;
  updated_at?: string;
}

export interface WorkoutSessionsRow {
  id: string;
  user_id: string;
  scheduled_workout_id: string | null;
  workout_template_id: string | null;
  status: WorkoutSessionStatus;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  session_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionsInsert {
  id?: string;
  user_id: string;
  scheduled_workout_id?: string | null;
  workout_template_id?: string | null;
  status?: WorkoutSessionStatus;
  started_at?: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
  session_metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSessionsUpdate {
  scheduled_workout_id?: string | null;
  workout_template_id?: string | null;
  status?: WorkoutSessionStatus;
  started_at?: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
  session_metadata?: Json | null;
  updated_at?: string;
}

export interface WorkoutSessionExercisesRow {
  id: string;
  workout_session_id: string;
  prescribed_template_exercise_id: string | null;
  prescribed_exercise_key: string;
  performed_exercise_key: string;
  sort_order: number;
  target_sets: number | null;
  rep_min: number | null;
  rep_max: number | null;
  rir_min: number | null;
  rir_max: number | null;
  rest_seconds: number | null;
  notes: string | null;
  swap_reason: string | null;
  status: WorkoutSessionExerciseStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionExercisesInsert {
  id?: string;
  workout_session_id: string;
  prescribed_template_exercise_id?: string | null;
  prescribed_exercise_key: string;
  performed_exercise_key: string;
  sort_order: number;
  target_sets?: number | null;
  rep_min?: number | null;
  rep_max?: number | null;
  rir_min?: number | null;
  rir_max?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  swap_reason?: string | null;
  status?: WorkoutSessionExerciseStatus;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSessionExercisesUpdate {
  prescribed_template_exercise_id?: string | null;
  prescribed_exercise_key?: string;
  performed_exercise_key?: string;
  sort_order?: number;
  target_sets?: number | null;
  rep_min?: number | null;
  rep_max?: number | null;
  rir_min?: number | null;
  rir_max?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  swap_reason?: string | null;
  status?: WorkoutSessionExerciseStatus;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

export interface WorkoutSetsRow {
  id: string;
  workout_session_exercise_id: string;
  set_number: number;
  status: WorkoutSetStatus;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSetsInsert {
  id?: string;
  workout_session_exercise_id: string;
  set_number: number;
  status?: WorkoutSetStatus;
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSetsUpdate {
  status?: WorkoutSetStatus;
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
  completed_at?: string | null;
  notes?: string | null;
  updated_at?: string;
}

export interface AthleteProfilesRow {
  id: string;
  display_name: string;
  age_years: number | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  unit_system: "metric" | "imperial";
  locale: "es" | "ca" | "en" | "de";
  avatar_path: string | null;
  onboarding_status: AthleteOnboardingStatus;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AthleteProfilesInsert {
  id: string;
  display_name?: string;
  age_years?: number | null;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  unit_system?: "metric" | "imperial";
  locale?: "es" | "ca" | "en" | "de";
  avatar_path?: string | null;
  onboarding_status?: AthleteOnboardingStatus;
  onboarding_completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AthleteProfilesUpdate {
  display_name?: string;
  age_years?: number | null;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  unit_system?: "metric" | "imperial";
  locale?: "es" | "ca" | "en" | "de";
  avatar_path?: string | null;
  onboarding_status?: AthleteOnboardingStatus;
  onboarding_completed_at?: string | null;
  updated_at?: string;
}

export interface AthletePreferencesRow {
  id: string;
  user_id: string;
  goals: Json;
  training_preferences: Json;
  schedule_lifestyle: Json;
  health_limitations: Json;
  nutrition_preferences: Json;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AthletePreferencesInsert {
  id?: string;
  user_id: string;
  goals?: Json;
  training_preferences?: Json;
  schedule_lifestyle?: Json;
  health_limitations?: Json;
  nutrition_preferences?: Json;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AthletePreferencesUpdate {
  goals?: Json;
  training_preferences?: Json;
  schedule_lifestyle?: Json;
  health_limitations?: Json;
  nutrition_preferences?: Json;
  version?: number;
  updated_at?: string;
}

export interface NutritionPlansRow {
  id: string;
  user_id: string;
  program_id: string | null;
  status: NutritionPlanStatus;
  name: string;
  daily_calorie_target: number;
  protein_target_g: number;
  carb_target_g: number;
  fat_target_g: number;
  fiber_target_g: number | null;
  water_target_ml: number | null;
  started_at: string;
  ended_at: string | null;
  plan_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionPlansInsert {
  id?: string;
  user_id: string;
  program_id?: string | null;
  status?: NutritionPlanStatus;
  name: string;
  daily_calorie_target: number;
  protein_target_g: number;
  carb_target_g: number;
  fat_target_g: number;
  fiber_target_g?: number | null;
  water_target_ml?: number | null;
  started_at?: string;
  ended_at?: string | null;
  plan_metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionPlansUpdate {
  program_id?: string | null;
  status?: NutritionPlanStatus;
  name?: string;
  daily_calorie_target?: number;
  protein_target_g?: number;
  carb_target_g?: number;
  fat_target_g?: number;
  fiber_target_g?: number | null;
  water_target_ml?: number | null;
  started_at?: string;
  ended_at?: string | null;
  plan_metadata?: Json | null;
  updated_at?: string;
}

export interface NutritionDaysRow {
  id: string;
  user_id: string;
  nutrition_plan_id: string;
  program_phase_id: string | null;
  scheduled_workout_id: string | null;
  calendar_date: string;
  day_type: NutritionDayType;
  status: NutritionDayStatus;
  calorie_target: number;
  protein_target_g: number;
  carb_target_g: number;
  fat_target_g: number;
  water_target_ml: number | null;
  day_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionDaysInsert {
  id?: string;
  user_id: string;
  nutrition_plan_id: string;
  program_phase_id?: string | null;
  scheduled_workout_id?: string | null;
  calendar_date: string;
  day_type?: NutritionDayType;
  status?: NutritionDayStatus;
  calorie_target: number;
  protein_target_g: number;
  carb_target_g: number;
  fat_target_g: number;
  water_target_ml?: number | null;
  day_metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionDaysUpdate {
  nutrition_plan_id?: string;
  program_phase_id?: string | null;
  scheduled_workout_id?: string | null;
  calendar_date?: string;
  day_type?: NutritionDayType;
  status?: NutritionDayStatus;
  calorie_target?: number;
  protein_target_g?: number;
  carb_target_g?: number;
  fat_target_g?: number;
  water_target_ml?: number | null;
  day_metadata?: Json | null;
  updated_at?: string;
}

export interface NutritionMealSlotsRow {
  id: string;
  nutrition_day_id: string;
  slot_key: string;
  name: string;
  sort_order: number;
  target_calories: number;
  target_protein_g: number;
  target_carb_g: number;
  target_fat_g: number;
  notes: string | null;
  slot_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionMealSlotsInsert {
  id?: string;
  nutrition_day_id: string;
  slot_key: string;
  name: string;
  sort_order: number;
  target_calories: number;
  target_protein_g: number;
  target_carb_g: number;
  target_fat_g: number;
  notes?: string | null;
  slot_metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionMealSlotsUpdate {
  slot_key?: string;
  name?: string;
  sort_order?: number;
  target_calories?: number;
  target_protein_g?: number;
  target_carb_g?: number;
  target_fat_g?: number;
  notes?: string | null;
  slot_metadata?: Json | null;
  updated_at?: string;
}

export interface NutritionMealOptionsRow {
  id: string;
  meal_slot_id: string;
  option_key: string;
  name: string;
  description: string;
  ingredients: Json;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion_notes: string | null;
  measurement_basis: NutritionMeasurementBasis;
  allergen_metadata: Json | null;
  restriction_metadata: Json | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NutritionMealOptionsInsert {
  id?: string;
  meal_slot_id: string;
  option_key: string;
  name: string;
  description: string;
  ingredients?: Json;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion_notes?: string | null;
  measurement_basis?: NutritionMeasurementBasis;
  allergen_metadata?: Json | null;
  restriction_metadata?: Json | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionMealOptionsUpdate {
  option_key?: string;
  name?: string;
  description?: string;
  ingredients?: Json;
  calories?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  portion_notes?: string | null;
  measurement_basis?: NutritionMeasurementBasis;
  allergen_metadata?: Json | null;
  restriction_metadata?: Json | null;
  sort_order?: number;
  updated_at?: string;
}

export interface NutritionDaySelectionsRow {
  id: string;
  user_id: string;
  nutrition_day_id: string;
  meal_slot_id: string;
  meal_option_id: string;
  status: NutritionMealSelectionStatus;
  selected_at: string;
  eaten_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionDaySelectionsInsert {
  id?: string;
  user_id: string;
  nutrition_day_id: string;
  meal_slot_id: string;
  meal_option_id: string;
  status?: NutritionMealSelectionStatus;
  selected_at?: string;
  eaten_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionDaySelectionsUpdate {
  meal_option_id?: string;
  status?: NutritionMealSelectionStatus;
  selected_at?: string;
  eaten_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

export interface NutritionHydrationLogsRow {
  id: string;
  user_id: string;
  nutrition_day_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionHydrationLogsInsert {
  id?: string;
  user_id: string;
  nutrition_day_id: string;
  amount_ml: number;
  logged_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionHydrationLogsUpdate {
  amount_ml?: number;
  logged_at?: string;
  updated_at?: string;
}

export interface NutritionSupplementLogsRow {
  id: string;
  user_id: string;
  nutrition_day_id: string;
  supplement_key: string;
  label: string;
  dosage: string;
  status: NutritionSupplementStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionSupplementLogsInsert {
  id?: string;
  user_id: string;
  nutrition_day_id: string;
  supplement_key: string;
  label: string;
  dosage: string;
  status?: NutritionSupplementStatus;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionSupplementLogsUpdate {
  label?: string;
  dosage?: string;
  status?: NutritionSupplementStatus;
  completed_at?: string | null;
  updated_at?: string;
}

export interface ProgressEntriesRow {
  id: string;
  user_id: string;
  entry_date: string;
  entry_type: ProgressEntryType;
  weight_kg: number | null;
  notes: string | null;
  source: ProgressEntrySource;
  created_at: string;
  updated_at: string;
}

export interface ProgressEntriesInsert {
  id?: string;
  user_id: string;
  entry_date: string;
  entry_type: ProgressEntryType;
  weight_kg?: number | null;
  notes?: string | null;
  source: ProgressEntrySource;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressEntriesUpdate {
  entry_date?: string;
  entry_type?: ProgressEntryType;
  weight_kg?: number | null;
  notes?: string | null;
  source?: ProgressEntrySource;
  updated_at?: string;
}

export interface ProgressMeasurementsRow {
  id: string;
  progress_entry_id: string;
  measurement_key: ProgressMeasurementKey;
  value_cm: number;
  created_at: string;
  updated_at: string;
}

export interface ProgressMeasurementsInsert {
  id?: string;
  progress_entry_id: string;
  measurement_key: ProgressMeasurementKey;
  value_cm: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressMeasurementsUpdate {
  measurement_key?: ProgressMeasurementKey;
  value_cm?: number;
  updated_at?: string;
}

export interface ProgressPhotosRow {
  id: string;
  user_id: string;
  progress_entry_id: string;
  pose: ProgressPhotoPose;
  storage_bucket: string;
  storage_path: string;
  captured_at: string | null;
  uploaded_at: string;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressPhotosInsert {
  id?: string;
  user_id: string;
  progress_entry_id: string;
  pose: ProgressPhotoPose;
  storage_bucket: string;
  storage_path: string;
  captured_at?: string | null;
  uploaded_at?: string;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressPhotosUpdate {
  pose?: ProgressPhotoPose;
  storage_bucket?: string;
  storage_path?: string;
  captured_at?: string | null;
  uploaded_at?: string;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  updated_at?: string;
}

export interface WeeklyCheckinsRow {
  id: string;
  user_id: string;
  program_id: string | null;
  program_phase_id: string | null;
  week_start_date: string;
  week_end_date: string;
  status: WeeklyCheckinStatus;
  started_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  overall_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckinsInsert {
  id?: string;
  user_id: string;
  program_id?: string | null;
  program_phase_id?: string | null;
  week_start_date: string;
  week_end_date: string;
  status?: WeeklyCheckinStatus;
  started_at?: string | null;
  completed_at?: string | null;
  submitted_at?: string | null;
  overall_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyCheckinsUpdate {
  program_id?: string | null;
  program_phase_id?: string | null;
  week_start_date?: string;
  week_end_date?: string;
  status?: WeeklyCheckinStatus;
  started_at?: string | null;
  completed_at?: string | null;
  submitted_at?: string | null;
  overall_notes?: string | null;
  updated_at?: string;
}

export interface WeeklyCheckinResponsesRow {
  id: string;
  user_id: string;
  weekly_checkin_id: string;
  question_key: string;
  response_type: WeeklyCheckinResponseType;
  numeric_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  choice_value: string | null;
  json_value: Json | null;
  answered_at: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckinResponsesInsert {
  id?: string;
  user_id: string;
  weekly_checkin_id: string;
  question_key: string;
  response_type: WeeklyCheckinResponseType;
  numeric_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  choice_value?: string | null;
  json_value?: Json | null;
  answered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyCheckinResponsesUpdate {
  user_id?: string;
  weekly_checkin_id?: string;
  question_key?: string;
  response_type?: WeeklyCheckinResponseType;
  numeric_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  choice_value?: string | null;
  json_value?: Json | null;
  answered_at?: string;
  updated_at?: string;
}

export interface WeeklyCheckinReviewsRow {
  id: string;
  user_id: string;
  weekly_checkin_id: string;
  status: WeeklyCheckinReviewStatus;
  review_reason: Json;
  review_notes: string | null;
  recommendation_type: WeeklyCheckinRecommendationType | null;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

export interface WeeklyCheckinReviewsInsert {
  id?: string;
  user_id: string;
  weekly_checkin_id: string;
  status?: WeeklyCheckinReviewStatus;
  review_reason?: Json;
  review_notes?: string | null;
  recommendation_type?: WeeklyCheckinRecommendationType | null;
  created_at?: string;
  reviewed_at?: string | null;
  updated_at?: string;
}

export interface WeeklyCheckinReviewsUpdate {
  user_id?: string;
  weekly_checkin_id?: string;
  status?: WeeklyCheckinReviewStatus;
  review_reason?: Json;
  review_notes?: string | null;
  recommendation_type?: WeeklyCheckinRecommendationType | null;
  reviewed_at?: string | null;
  updated_at?: string;
}

export interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  master_enabled: boolean;
  workout_enabled: boolean;
  meals_enabled: boolean;
  checkin_enabled: boolean;
  sleep_enabled: boolean;
  workout_lead_minutes: number;
  hydration_interval_minutes: number;
  in_app_enabled: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  timezone: string | null;
  workout_reminders_enabled: boolean;
  program_updates_enabled: boolean;
  weekly_check_in_enabled: boolean;
  measurements_enabled: boolean;
  progress_photos_enabled: boolean;
  phase_reviews_enabled: boolean;
  nutrition_reminders_enabled: boolean;
  hydration_enabled: boolean;
  supplements_enabled: boolean;
  sleep_routine_enabled: boolean;
  adaptive_alerts_enabled: boolean;
  reminder_intensity: NotificationReminderIntensity;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  preferred_timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesInsert {
  id?: string;
  user_id: string;
  master_enabled?: boolean;
  workout_enabled?: boolean;
  meals_enabled?: boolean;
  checkin_enabled?: boolean;
  sleep_enabled?: boolean;
  workout_lead_minutes?: number;
  hydration_interval_minutes?: number;
  in_app_enabled?: boolean;
  quiet_start?: string | null;
  quiet_end?: string | null;
  timezone?: string | null;
  workout_reminders_enabled?: boolean;
  program_updates_enabled?: boolean;
  weekly_check_in_enabled?: boolean;
  measurements_enabled?: boolean;
  progress_photos_enabled?: boolean;
  phase_reviews_enabled?: boolean;
  nutrition_reminders_enabled?: boolean;
  hydration_enabled?: boolean;
  supplements_enabled?: boolean;
  sleep_routine_enabled?: boolean;
  adaptive_alerts_enabled?: boolean;
  reminder_intensity?: NotificationReminderIntensity;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  preferred_timezone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferencesUpdate {
  user_id?: string;
  master_enabled?: boolean;
  workout_enabled?: boolean;
  meals_enabled?: boolean;
  checkin_enabled?: boolean;
  sleep_enabled?: boolean;
  workout_lead_minutes?: number;
  hydration_interval_minutes?: number;
  in_app_enabled?: boolean;
  quiet_start?: string | null;
  quiet_end?: string | null;
  timezone?: string | null;
  workout_reminders_enabled?: boolean;
  program_updates_enabled?: boolean;
  weekly_check_in_enabled?: boolean;
  measurements_enabled?: boolean;
  progress_photos_enabled?: boolean;
  phase_reviews_enabled?: boolean;
  nutrition_reminders_enabled?: boolean;
  hydration_enabled?: boolean;
  supplements_enabled?: boolean;
  sleep_routine_enabled?: boolean;
  adaptive_alerts_enabled?: boolean;
  reminder_intensity?: NotificationReminderIntensity;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  preferred_timezone?: string | null;
  updated_at?: string;
}

export interface PushSubscriptionsRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  active: boolean;
  last_success_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionsInsert {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time?: string | null;
  active?: boolean;
  last_success_at?: string | null;
  failure_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PushSubscriptionsUpdate {
  user_id?: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  expiration_time?: string | null;
  active?: boolean;
  last_success_at?: string | null;
  failure_count?: number;
  updated_at?: string;
}

export type NotificationReminderCategory = "workout" | "meals" | "hydration" | "supplements" | "check-in" | "sleep";
export type NotificationReminderStatus = "scheduled" | "ready" | "processing" | "sent" | "delivered" | "clicked" | "dismissed" | "snoozed" | "failed" | "expired" | "cancelled";
export type NotificationDeliveryAttemptResult = "sent" | "delivered" | "expired" | "gone" | "failed" | "ignored";

export interface NotificationRemindersRow {
  id: string;
  user_id: string;
  category: NotificationReminderCategory;
  source_table: string | null;
  source_id: string | null;
  source_reference: string | null;
  destination_path: string;
  title: string;
  body: string;
  status: NotificationReminderStatus;
  scheduled_for: string;
  sent_at: string | null;
  delivered_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
  snoozed_until: string | null;
  dedupe_key: string;
  payload: Json;
  created_at: string;
  updated_at: string;
}

export interface NotificationRemindersInsert {
  id?: string;
  user_id: string;
  category: NotificationReminderCategory;
  source_table?: string | null;
  source_id?: string | null;
  source_reference?: string | null;
  destination_path: string;
  title: string;
  body: string;
  status?: NotificationReminderStatus;
  scheduled_for: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  clicked_at?: string | null;
  dismissed_at?: string | null;
  snoozed_until?: string | null;
  dedupe_key: string;
  payload?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationRemindersUpdate {
  user_id?: string;
  category?: NotificationReminderCategory;
  source_table?: string | null;
  source_id?: string | null;
  source_reference?: string | null;
  destination_path?: string;
  title?: string;
  body?: string;
  status?: NotificationReminderStatus;
  scheduled_for?: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  clicked_at?: string | null;
  dismissed_at?: string | null;
  snoozed_until?: string | null;
  dedupe_key?: string;
  payload?: Json;
  updated_at?: string;
}

export interface NotificationDeliveryAttemptsRow {
  id: string;
  notification_reminder_id: string;
  user_id: string;
  push_subscription_id: string | null;
  attempted_at: string;
  result: NotificationDeliveryAttemptResult;
  status_code: number | null;
  error_code: string | null;
  error_detail: string | null;
  created_at: string;
}

export interface NotificationDeliveryAttemptsInsert {
  id?: string;
  notification_reminder_id: string;
  user_id: string;
  push_subscription_id?: string | null;
  attempted_at?: string;
  result: NotificationDeliveryAttemptResult;
  status_code?: number | null;
  error_code?: string | null;
  error_detail?: string | null;
  created_at?: string;
}

export interface NotificationDeliveryAttemptsUpdate {
  notification_reminder_id?: string;
  user_id?: string;
  push_subscription_id?: string | null;
  attempted_at?: string;
  result?: NotificationDeliveryAttemptResult;
  status_code?: number | null;
  error_code?: string | null;
  error_detail?: string | null;
  created_at?: string;
}

export interface CoachProfilesRow {
  id: string;
  user_id: string;
  display_name: string;
  status: CoachProfileStatus;
  business_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachProfilesInsert {
  id?: string;
  user_id: string;
  display_name?: string;
  status?: CoachProfileStatus;
  business_name?: string | null;
  avatar_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CoachProfilesUpdate {
  display_name?: string;
  status?: CoachProfileStatus;
  business_name?: string | null;
  avatar_path?: string | null;
  updated_at?: string;
}

export interface CoachAthleteAssignmentsRow {
  id: string;
  coach_user_id: string;
  athlete_user_id: string;
  status: CoachAssignmentStatus;
  assigned_at: string;
  ended_at: string | null;
  invitation_token_hash: string | null;
  invitation_expires_at: string | null;
  invitation_created_at: string | null;
  invitation_accepted_at: string | null;
  invitation_revoked_at: string | null;
  invitation_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachAthleteAssignmentsInsert {
  id?: string;
  coach_user_id: string;
  athlete_user_id: string;
  status?: CoachAssignmentStatus;
  assigned_at?: string;
  ended_at?: string | null;
  invitation_token_hash?: string | null;
  invitation_expires_at?: string | null;
  invitation_created_at?: string | null;
  invitation_accepted_at?: string | null;
  invitation_revoked_at?: string | null;
  invitation_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CoachAthleteAssignmentsUpdate {
  status?: CoachAssignmentStatus;
  assigned_at?: string;
  ended_at?: string | null;
  invitation_token_hash?: string | null;
  invitation_expires_at?: string | null;
  invitation_created_at?: string | null;
  invitation_accepted_at?: string | null;
  invitation_revoked_at?: string | null;
  invitation_note?: string | null;
  updated_at?: string;
}

export interface CoachReviewNotesRow {
  id: string;
  coach_user_id: string;
  athlete_user_id: string;
  weekly_checkin_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface CoachReviewNotesInsert {
  id?: string;
  coach_user_id: string;
  athlete_user_id: string;
  weekly_checkin_id: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface CoachReviewNotesUpdate {
  note?: string;
  updated_at?: string;
}

export interface CoachActionEventsRow {
  id: string;
  coach_user_id: string;
  athlete_user_id: string;
  action_type: CoachActionType;
  target_type: CoachActionTargetType;
  target_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface CoachActionEventsInsert {
  id?: string;
  coach_user_id: string;
  athlete_user_id: string;
  action_type: CoachActionType;
  target_type: CoachActionTargetType;
  target_id?: string | null;
  metadata?: Json;
  created_at?: string;
}

export interface CoachActionEventsUpdate {
  target_id?: string | null;
  metadata?: Json;
}

export interface AiRecommendationsRow {
  id: string;
  user_id: string;
  context_type: CoachRecommendationContextType;
  context_key: string;
  source: CoachRecommendationSource;
  generation_status: CoachRecommendationGenerationStatus;
  model: string;
  prompt_version: string;
  title: string;
  summary: string;
  recommendation_type: WeeklyCheckinRecommendationType;
  recommendation_payload: Json;
  context_snapshot: Json;
  application_status: CoachRecommendationApplicationStatus;
  applied_at: string | null;
  applied_change_summary: Json | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiRecommendationsInsert {
  id?: string;
  user_id: string;
  context_type: CoachRecommendationContextType;
  context_key: string;
  source?: CoachRecommendationSource;
  generation_status?: CoachRecommendationGenerationStatus;
  model: string;
  prompt_version?: string;
  title: string;
  summary: string;
  recommendation_type: WeeklyCheckinRecommendationType;
  recommendation_payload: Json;
  context_snapshot: Json;
  application_status?: CoachRecommendationApplicationStatus;
  applied_at?: string | null;
  applied_change_summary?: Json | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AiRecommendationsUpdate {
  context_type?: CoachRecommendationContextType;
  context_key?: string;
  source?: CoachRecommendationSource;
  generation_status?: CoachRecommendationGenerationStatus;
  model?: string;
  prompt_version?: string;
  title?: string;
  summary?: string;
  recommendation_type?: WeeklyCheckinRecommendationType;
  recommendation_payload?: Json;
  context_snapshot?: Json;
  application_status?: CoachRecommendationApplicationStatus;
  applied_at?: string | null;
  applied_change_summary?: Json | null;
  error_message?: string | null;
  updated_at?: string;
}

export interface ProgramChangeProposalsRow {
  id: string;
  user_id: string;
  recommendation_id: string | null;
  program_id: string | null;
  program_phase_id: string | null;
  change_type: ProgramChangeType;
  status: ProgramChangeStatus;
  target_entity_type: ProgramChangeTargetEntityType;
  target_entity_id: string | null;
  change_command: Json;
  before_snapshot: Json;
  after_snapshot: Json;
  reason: string;
  validation_result: Json;
  source_updated_at: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  applied_at: string | null;
  rejected_at: string | null;
}

export interface ProgramChangeProposalsInsert {
  id?: string;
  user_id: string;
  recommendation_id?: string | null;
  program_id?: string | null;
  program_phase_id?: string | null;
  change_type: ProgramChangeType;
  status?: ProgramChangeStatus;
  target_entity_type: ProgramChangeTargetEntityType;
  target_entity_id?: string | null;
  change_command: Json;
  before_snapshot: Json;
  after_snapshot: Json;
  reason: string;
  validation_result: Json;
  source_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
  applied_at?: string | null;
  rejected_at?: string | null;
}

export interface ProgramChangeProposalsUpdate {
  recommendation_id?: string | null;
  program_id?: string | null;
  program_phase_id?: string | null;
  change_type?: ProgramChangeType;
  status?: ProgramChangeStatus;
  target_entity_type?: ProgramChangeTargetEntityType;
  target_entity_id?: string | null;
  change_command?: Json;
  before_snapshot?: Json;
  after_snapshot?: Json;
  reason?: string;
  validation_result?: Json;
  source_updated_at?: string | null;
  updated_at?: string;
  approved_at?: string | null;
  applied_at?: string | null;
  rejected_at?: string | null;
}

export interface ProgramChangeEventsRow {
  id: string;
  user_id: string;
  program_id: string | null;
  proposal_id: string;
  recommendation_id: string | null;
  change_type: ProgramChangeType;
  before_snapshot: Json;
  after_snapshot: Json;
  source: ProgramChangeEventSource;
  applied_at: string;
  created_at: string;
}

export interface ProgramChangeEventsInsert {
  id?: string;
  user_id: string;
  program_id?: string | null;
  proposal_id: string;
  recommendation_id?: string | null;
  change_type: ProgramChangeType;
  before_snapshot: Json;
  after_snapshot: Json;
  source?: ProgramChangeEventSource;
  applied_at?: string;
  created_at?: string;
}

export interface ProgramChangeEventsUpdate {
  program_id?: string | null;
  recommendation_id?: string | null;
  change_type?: ProgramChangeType;
  before_snapshot?: Json;
  after_snapshot?: Json;
  source?: ProgramChangeEventSource;
  applied_at?: string;
}

export interface Database {
  public: {
    Tables: {
      athlete_profiles: {
        Row: AthleteProfilesRow;
        Insert: AthleteProfilesInsert;
        Update: AthleteProfilesUpdate;
        Relationships: [];
      };
      athlete_preferences: {
        Row: AthletePreferencesRow;
        Insert: AthletePreferencesInsert;
        Update: AthletePreferencesUpdate;
        Relationships: [];
      };
      nutrition_plans: {
        Row: NutritionPlansRow;
        Insert: NutritionPlansInsert;
        Update: NutritionPlansUpdate;
        Relationships: [];
      };
      nutrition_days: {
        Row: NutritionDaysRow;
        Insert: NutritionDaysInsert;
        Update: NutritionDaysUpdate;
        Relationships: [];
      };
      nutrition_meal_slots: {
        Row: NutritionMealSlotsRow;
        Insert: NutritionMealSlotsInsert;
        Update: NutritionMealSlotsUpdate;
        Relationships: [];
      };
      nutrition_meal_options: {
        Row: NutritionMealOptionsRow;
        Insert: NutritionMealOptionsInsert;
        Update: NutritionMealOptionsUpdate;
        Relationships: [];
      };
      nutrition_day_selections: {
        Row: NutritionDaySelectionsRow;
        Insert: NutritionDaySelectionsInsert;
        Update: NutritionDaySelectionsUpdate;
        Relationships: [];
      };
      nutrition_hydration_logs: {
        Row: NutritionHydrationLogsRow;
        Insert: NutritionHydrationLogsInsert;
        Update: NutritionHydrationLogsUpdate;
        Relationships: [];
      };
      nutrition_supplement_logs: {
        Row: NutritionSupplementLogsRow;
        Insert: NutritionSupplementLogsInsert;
        Update: NutritionSupplementLogsUpdate;
        Relationships: [];
      };
      progress_entries: {
        Row: ProgressEntriesRow;
        Insert: ProgressEntriesInsert;
        Update: ProgressEntriesUpdate;
        Relationships: [];
      };
      progress_measurements: {
        Row: ProgressMeasurementsRow;
        Insert: ProgressMeasurementsInsert;
        Update: ProgressMeasurementsUpdate;
        Relationships: [];
      };
      progress_photos: {
        Row: ProgressPhotosRow;
        Insert: ProgressPhotosInsert;
        Update: ProgressPhotosUpdate;
        Relationships: [];
      };
      weekly_checkins: {
        Row: WeeklyCheckinsRow;
        Insert: WeeklyCheckinsInsert;
        Update: WeeklyCheckinsUpdate;
        Relationships: [];
      };
      weekly_checkin_responses: {
        Row: WeeklyCheckinResponsesRow;
        Insert: WeeklyCheckinResponsesInsert;
        Update: WeeklyCheckinResponsesUpdate;
        Relationships: [];
      };
      weekly_checkin_reviews: {
        Row: WeeklyCheckinReviewsRow;
        Insert: WeeklyCheckinReviewsInsert;
        Update: WeeklyCheckinReviewsUpdate;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferencesRow;
        Insert: NotificationPreferencesInsert;
        Update: NotificationPreferencesUpdate;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionsRow;
        Insert: PushSubscriptionsInsert;
        Update: PushSubscriptionsUpdate;
        Relationships: [];
      };
      notification_reminders: {
        Row: NotificationRemindersRow;
        Insert: NotificationRemindersInsert;
        Update: NotificationRemindersUpdate;
        Relationships: [];
      };
      notification_delivery_attempts: {
        Row: NotificationDeliveryAttemptsRow;
        Insert: NotificationDeliveryAttemptsInsert;
        Update: NotificationDeliveryAttemptsUpdate;
        Relationships: [];
      };
      coach_profiles: {
        Row: CoachProfilesRow;
        Insert: CoachProfilesInsert;
        Update: CoachProfilesUpdate;
        Relationships: [];
      };
      coach_athlete_assignments: {
        Row: CoachAthleteAssignmentsRow;
        Insert: CoachAthleteAssignmentsInsert;
        Update: CoachAthleteAssignmentsUpdate;
        Relationships: [];
      };
      coach_review_notes: {
        Row: CoachReviewNotesRow;
        Insert: CoachReviewNotesInsert;
        Update: CoachReviewNotesUpdate;
        Relationships: [];
      };
      coach_action_events: {
        Row: CoachActionEventsRow;
        Insert: CoachActionEventsInsert;
        Update: CoachActionEventsUpdate;
        Relationships: [];
      };
      ai_recommendations: {
        Row: AiRecommendationsRow;
        Insert: AiRecommendationsInsert;
        Update: AiRecommendationsUpdate;
        Relationships: [];
      };
      program_change_proposals: {
        Row: ProgramChangeProposalsRow;
        Insert: ProgramChangeProposalsInsert;
        Update: ProgramChangeProposalsUpdate;
        Relationships: [];
      };
      program_change_events: {
        Row: ProgramChangeEventsRow;
        Insert: ProgramChangeEventsInsert;
        Update: ProgramChangeEventsUpdate;
        Relationships: [];
      };
      programs: {
        Row: ProgramsRow;
        Insert: ProgramsInsert;
        Update: ProgramsUpdate;
        Relationships: [];
      };
      program_phases: {
        Row: ProgramPhasesRow;
        Insert: ProgramPhasesInsert;
        Update: ProgramPhasesUpdate;
        Relationships: [];
      };
      workout_templates: {
        Row: WorkoutTemplatesRow;
        Insert: WorkoutTemplatesInsert;
        Update: WorkoutTemplatesUpdate;
        Relationships: [];
      };
      workout_template_exercises: {
        Row: WorkoutTemplateExercisesRow;
        Insert: WorkoutTemplateExercisesInsert;
        Update: WorkoutTemplateExercisesUpdate;
        Relationships: [];
      };
      scheduled_workouts: {
        Row: ScheduledWorkoutsRow;
        Insert: ScheduledWorkoutsInsert;
        Update: ScheduledWorkoutsUpdate;
        Relationships: [];
      };
      workout_sessions: {
        Row: WorkoutSessionsRow;
        Insert: WorkoutSessionsInsert;
        Update: WorkoutSessionsUpdate;
        Relationships: [];
      };
      workout_session_exercises: {
        Row: WorkoutSessionExercisesRow;
        Insert: WorkoutSessionExercisesInsert;
        Update: WorkoutSessionExercisesUpdate;
        Relationships: [];
      };
      workout_sets: {
        Row: WorkoutSetsRow;
        Insert: WorkoutSetsInsert;
        Update: WorkoutSetsUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_workout_session: {
        Args: {
          p_workout_session_id: string;
          p_duration_seconds?: number | null;
          p_notes?: string | null;
        };
        Returns: WorkoutSessionsRow;
      };
      apply_program_change_proposal: {
        Args: {
          p_proposal_id: string;
        };
        Returns: ProgramChangeProposalsRow;
      };
      coach_can_access_athlete: {
        Args: {
          target_athlete_id: string;
        };
        Returns: boolean;
      };
      coach_create_assignment_invitation: {
        Args: {
          p_athlete_user_id: string;
          p_expires_at?: string | null;
          p_note?: string | null;
        };
        Returns: string;
      };
      coach_accept_assignment_invitation: {
        Args: {
          p_token: string;
        };
        Returns: CoachAthleteAssignmentsRow;
      };
      get_my_coach_relationship: {
        Args: Record<string, never>;
        Returns: Json;
      };
      coach_mark_checkin_reviewed: {
        Args: {
          p_weekly_checkin_id: string;
          p_action: string;
          p_note?: string | null;
        };
        Returns: WeeklyCheckinReviewsRow;
      };
      coach_decide_recommendation: {
        Args: {
          p_recommendation_id: string;
          p_decision: string;
        };
        Returns: AiRecommendationsRow;
      };
      coach_decide_program_change_proposal: {
        Args: {
          p_proposal_id: string;
          p_decision: string;
        };
        Returns: ProgramChangeProposalsRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
