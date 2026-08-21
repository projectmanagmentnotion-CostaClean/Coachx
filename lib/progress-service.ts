import type { SupabaseClient } from "@supabase/supabase-js";
import { createProgressDemoState, type MeasurementHistory, type MeasurementType, type PhotoPose, type ProgressState, type ProgressTrendsState } from "@/lib/progress-data";
import { formatDate, getCurrentLocale } from "@/lib/i18n";
import type {
  Database,
  ProgressEntriesInsert,
  ProgressEntriesRow,
  ProgressMeasurementsInsert,
  ProgressMeasurementsRow,
  ProgressPhotosInsert,
  ProgressPhotosRow
} from "@/lib/supabase/database.types";

export type ProgressEntryType = "measurement" | "photo" | "combined" | "checkpoint";
export type ProgressEntrySource = "manual" | "onboarding_baseline" | "phase_review" | "other";

export interface ProgressPersistedSnapshot {
  entries: ProgressEntriesRow[];
  measurements: ProgressMeasurementsRow[];
  photos: ProgressPhotosRow[];
}

export interface ProgressLoadResult {
  state: ProgressState;
  source: "remote" | "fallback";
}

export interface ProgressPhotoUploadResult {
  entry: ProgressEntriesRow;
  photo: ProgressPhotosRow;
  signedUrl: string | null;
}

const PROGRESS_PHOTO_BUCKET = "progress-photos";
const MEASUREMENT_TYPES: MeasurementType[] = ["weight", "waist", "hips", "thigh"];
const PHOTO_POSES: PhotoPose[] = ["front", "side", "back"];

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist/i.test(message) || /relation/i.test(message)));
}

function formatDateLabel(dateKey: string) {
  return formatDate(new Date(`${dateKey}T00:00:00.000Z`), {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    locale: getCurrentLocale()
  });
}

function formatMonthDayLabel(dateKey: string) {
  return formatDate(new Date(`${dateKey}T00:00:00.000Z`), {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    locale: getCurrentLocale()
  }).toUpperCase();
}

function normalizeDateKey(dateKey: string) {
  return dateKey.slice(0, 10);
}

function getMeasurementUnit(type: MeasurementType) {
  return type === "weight" ? "kg" : "cm";
}

function buildMeasurementHistory(entries: ProgressPersistedSnapshot) {
  const historyMap = new Map<MeasurementType, MeasurementHistory>();
  const entryDateMap = new Map(entries.entries.map((entry) => [entry.id, entry.entry_date] as const));

  for (const type of MEASUREMENT_TYPES) {
    historyMap.set(type, { type, entries: [] });
  }

  for (const entry of entries.entries.slice().sort((left, right) => left.entry_date.localeCompare(right.entry_date))) {
    if (typeof entry.weight_kg === "number") {
      const current = historyMap.get("weight");
      current?.entries.push({
        type: "weight",
        value: entry.weight_kg,
        unit: "kg",
        dateKey: entry.entry_date
      });
    }
  }

  for (const measurement of entries.measurements) {
    const current = historyMap.get(measurement.measurement_key);
    if (!current) {
      continue;
    }

    current.entries.push({
      type: measurement.measurement_key,
      value: Number(measurement.value_cm),
      unit: getMeasurementUnit(measurement.measurement_key),
      dateKey: entryDateMap.get(measurement.progress_entry_id) ?? measurement.created_at.slice(0, 10)
    });
  }

  return Array.from(historyMap.values()).map((history) => ({
    ...history,
    entries: history.entries
      .slice()
      .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
  }));
}

function computeLatestRow(history: MeasurementHistory) {
  const latest = history.entries.at(-1) ?? null;
  const previous = history.entries.at(-2) ?? null;
  if (!latest) {
    return null;
  }

  return {
    type: history.type,
    label: history.type === "weight" ? "Weight" : history.type === "waist" ? "Waist" : history.type === "hips" ? "Hips" : "Thigh",
    unit: latest.unit,
    previousValue: previous?.value ?? null,
    currentValue: latest.value,
    previousDate: previous ? formatDateLabel(previous.dateKey) : null,
    currentDate: formatDateLabel(latest.dateKey),
    difference: previous ? Number((latest.value - previous.value).toFixed(1)) : null
  };
}

function buildTrendStateFromHistory(state: ProgressState): ProgressTrendsState {
  const latestWeight = state.measurement.histories.find((history) => history.type === "weight")?.entries.at(-1) ?? null;
  const latestWaist = state.measurement.histories.find((history) => history.type === "waist")?.entries.at(-1) ?? null;
  const previousWeight = state.measurement.histories.find((history) => history.type === "weight")?.entries.at(-2) ?? null;
  const previousWaist = state.measurement.histories.find((history) => history.type === "waist")?.entries.at(-2) ?? null;

  const weightValue = latestWeight ? `${latestWeight.value.toFixed(1)} kg` : state.trends.keyMetrics[0]?.value ?? "";
  const waistValue = latestWaist ? `${latestWaist.value.toFixed(1)} cm` : state.trends.keyMetrics[1]?.value ?? "";
  const weightDelta = latestWeight && previousWeight ? `${latestWeight.value <= previousWeight.value ? "↓" : "↑"} ${previousWeight.value.toFixed(1)}` : state.trends.keyMetrics[0]?.delta ?? "";
  const waistDelta = latestWaist && previousWaist ? `${latestWaist.value <= previousWaist.value ? "↓" : "↑"} ${previousWaist.value.toFixed(1)}` : state.trends.keyMetrics[1]?.delta ?? "";

  const historyPoints = state.measurement.histories.find((history) => history.type === "waist")?.entries.slice(-4) ?? [];
  const trendSeries = [
    {
      ...state.trends.bodyTrendSeries[0],
      points: historyPoints.length
        ? historyPoints.map((entry) => ({
            label: formatMonthDayLabel(entry.dateKey),
            value: entry.value,
            display: entry.value.toFixed(1)
          }))
        : state.trends.bodyTrendSeries[0].points
    }
  ];

  return {
    ...state.trends,
    keyMetrics: [
      { ...state.trends.keyMetrics[0], value: weightValue, delta: weightDelta },
      { ...state.trends.keyMetrics[1], value: waistValue, delta: waistDelta, accent: true },
      ...state.trends.keyMetrics.slice(2)
    ],
    bodyTrendSeries: trendSeries,
    currentTrendSummary:
      latestWeight && latestWaist
        ? `Weight is ${latestWeight.value <= (previousWeight?.value ?? latestWeight.value) ? "down" : "steady"} while waist has moved to ${latestWaist.value.toFixed(1)} cm.`
        : state.trends.currentTrendSummary,
    coachInsight:
      latestWeight && latestWaist
        ? "Persisted measurements are now driving the progress trend instead of demo-only state."
        : state.trends.coachInsight
  };
}

function buildCheckpointSkeletons(baseState: ProgressState) {
  return baseState.photos.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    photos: {
      front: { ...checkpoint.photos.front, storagePath: checkpoint.photos.front.storagePath ?? null, image: checkpoint.photos.front.image ?? null, updatedAt: checkpoint.photos.front.updatedAt ?? null },
      side: { ...checkpoint.photos.side, storagePath: checkpoint.photos.side.storagePath ?? null, image: checkpoint.photos.side.image ?? null, updatedAt: checkpoint.photos.side.updatedAt ?? null },
      back: { ...checkpoint.photos.back, storagePath: checkpoint.photos.back.storagePath ?? null, image: checkpoint.photos.back.image ?? null, updatedAt: checkpoint.photos.back.updatedAt ?? null }
    }
  }));
}

export function buildProgressEntriesPayload(state: ProgressState, source: ProgressEntrySource = "manual") {
  const latestDefinition = state.measurement.definitions.find((definition) => definition.todayValue.trim()) ?? state.measurement.definitions[0];
  const entryDate = normalizeDateKey(state.measurement.currentDateKey);
  const entryType: ProgressEntryType = "measurement";

  const entry: ProgressEntriesInsert = {
    user_id: "",
    entry_date: entryDate,
    entry_type: entryType,
    weight_kg: latestDefinition?.type === "weight" && latestDefinition.todayValue.trim() ? Number(latestDefinition.todayValue) : null,
    notes: null,
    source
  };

  const measurements: ProgressMeasurementsInsert[] = state.measurement.definitions
    .filter((definition) => definition.type !== "weight" && definition.todayValue.trim())
    .map((definition) => ({
      progress_entry_id: "",
      measurement_key: definition.type as Exclude<MeasurementType, "weight">,
      value_cm: Number(definition.todayValue)
    }));

  return { entry, measurements };
}

export function buildProgressStateFromPersistedSnapshot(baseState: ProgressState, snapshot: ProgressPersistedSnapshot) {
  const nextState: ProgressState = structuredClone(baseState);
  const histories = buildMeasurementHistory(snapshot);
  const latestRows = histories.map((history) => computeLatestRow(history)).filter(Boolean);
  const latestEntry = snapshot.entries.slice().sort((left, right) => left.entry_date.localeCompare(right.entry_date)).at(-1) ?? null;
  const baselineEntry = snapshot.entries.find((entry) => entry.source === "onboarding_baseline") ?? snapshot.entries[0] ?? null;
  const checkpointSkeletons = buildCheckpointSkeletons(baseState);
  const sortedPhotosByEntry = new Map<string, ProgressPhotosRow[]>();

  for (const photo of snapshot.photos) {
    const bucket = sortedPhotosByEntry.get(photo.progress_entry_id) ?? [];
    bucket.push(photo);
    sortedPhotosByEntry.set(photo.progress_entry_id, bucket);
  }

  const entryToCheckpoint = new Map<string, ProgressState["photos"]["checkpoints"][number]["checkpoint"]>();
  if (baselineEntry) {
    entryToCheckpoint.set(baselineEntry.id, "baseline");
  }
  if (latestEntry) {
    entryToCheckpoint.set(latestEntry.id, snapshot.entries.length > 1 ? "week-4" : "baseline");
  }

  nextState.measurement = {
    ...nextState.measurement,
    histories,
    definitions: nextState.measurement.definitions.map((definition) => {
      const history = histories.find((candidate) => candidate.type === definition.type);
      const latest = history?.entries.at(-1) ?? null;
      return {
        ...definition,
        lastValue: latest?.value ?? definition.lastValue,
        lastDate: latest ? formatDateLabel(latest.dateKey) : definition.lastDate,
        todayValue: latest ? latest.value.toFixed(1).replace(/\.0$/, "") : definition.todayValue
      };
    }),
    lastSavedRows: latestRows.map((row) => row ?? undefined).filter((row): row is NonNullable<typeof row> => Boolean(row)),
    savedAt: latestEntry?.updated_at ?? nextState.measurement.savedAt
  };

  nextState.photos = {
    ...nextState.photos,
    checkpoints: checkpointSkeletons.map((checkpoint) => {
      const entryId = Array.from(entryToCheckpoint.entries()).find(([, mapped]) => mapped === checkpoint.checkpoint)?.[0] ?? null;
      const photos = entryId ? sortedPhotosByEntry.get(entryId) ?? [] : [];
      const nextCheckpoint = { ...checkpoint };

      for (const pose of PHOTO_POSES) {
        const remotePhoto = photos.find((item) => item.pose === pose);
        if (!remotePhoto) {
          continue;
        }

        nextCheckpoint.photos[pose] = {
          ...nextCheckpoint.photos[pose],
          status: "captured",
          image: remotePhoto.storage_path,
          storagePath: remotePhoto.storage_path,
          updatedAt: remotePhoto.updated_at,
          width: remotePhoto.width ?? null,
          height: remotePhoto.height ?? null,
          mimeType: remotePhoto.mime_type ?? null,
          fileSizeBytes: remotePhoto.file_size_bytes ?? null
        };
      }

      return nextCheckpoint;
    }),
    selectedCheckpoint: snapshot.entries.length > 1 ? "week-4" : baselineEntry ? "baseline" : nextState.photos.selectedCheckpoint
  };

  nextState.trends = buildTrendStateFromHistory(nextState);

  if (latestEntry) {
    nextState.day = {
      ...nextState.day,
      dateKey: latestEntry.entry_date,
      dateLabel: formatDateLabel(latestEntry.entry_date)
    };
  }

  return nextState;
}

export async function loadPersistedProgressSnapshot(client: SupabaseClient<Database>, userId: string) {
  const entriesResult = await (client.from("progress_entries") as any).select("*").eq("user_id", userId).order("entry_date", { ascending: true });

  if (entriesResult.error) {
    if (isMissingRelationError(entriesResult.error)) {
      return null;
    }

    throw entriesResult.error;
  }

  const entries = (entriesResult.data ?? []) as ProgressEntriesRow[];
  const entryIds = entries.map((entry) => entry.id);

  const [measurementsResult, photosResult] = await Promise.all([
    entryIds.length
      ? (client.from("progress_measurements") as any).select("*").in("progress_entry_id", entryIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    entryIds.length
      ? (client.from("progress_photos") as any).select("*").in("progress_entry_id", entryIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (measurementsResult.error) {
    if (isMissingRelationError(measurementsResult.error)) {
      return null;
    }

    throw measurementsResult.error;
  }

  if (photosResult.error) {
    if (isMissingRelationError(photosResult.error)) {
      return null;
    }

    throw photosResult.error;
  }

  return {
    entries,
    measurements: (measurementsResult.data ?? []) as ProgressMeasurementsRow[],
    photos: (photosResult.data ?? []) as ProgressPhotosRow[]
  } satisfies ProgressPersistedSnapshot;
}

export async function hydrateProgressPhotoSignedUrl(client: SupabaseClient<Database>, storagePath: string | null) {
  if (!storagePath) {
    return null;
  }

  const { data, error } = await client.storage.from(PROGRESS_PHOTO_BUCKET).createSignedUrl(storagePath, 60 * 30);
  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }

    throw error;
  }

  return data?.signedUrl ?? null;
}

export async function saveProgressMeasurements(client: SupabaseClient<Database>, userId: string, state: ProgressState) {
  const entryDate = normalizeDateKey(state.measurement.currentDateKey);
  const weightDefinition = state.measurement.definitions.find((definition) => definition.type === "weight") ?? null;
  const weightValue = weightDefinition?.todayValue.trim() ? Number(weightDefinition.todayValue) : null;
  const progressEntriesTable = client.from("progress_entries") as any;
  const progressMeasurementsTable = client.from("progress_measurements") as any;
  const { data: existingEntryData, error: existingEntryError } = await progressEntriesTable
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .eq("source", "manual")
    .maybeSingle();
  const existingEntry = existingEntryData as unknown as ProgressEntriesRow | null;

  if (existingEntryError) {
    if (isMissingRelationError(existingEntryError)) {
      return null;
    }

    throw existingEntryError;
  }

  const entryPayload: ProgressEntriesInsert = {
    user_id: userId,
    entry_date: entryDate,
    entry_type: "measurement",
    weight_kg: weightValue ?? existingEntry?.weight_kg ?? null,
    notes: null,
    source: "manual"
  };

  const { data: savedEntryData, error: entryError } = await progressEntriesTable
    .upsert(entryPayload, { onConflict: "user_id,entry_date,source" })
    .select("*")
    .single();
  const savedEntry = savedEntryData as unknown as ProgressEntriesRow;

  if (entryError) {
    if (isMissingRelationError(entryError)) {
      return null;
    }

    throw entryError;
  }

  const payloads = state.measurement.definitions
    .filter((definition) => definition.type !== "weight" && definition.todayValue.trim())
    .map((definition) => ({
      progress_entry_id: savedEntry.id,
      measurement_key: definition.type as Exclude<MeasurementType, "weight">,
      value_cm: Number(definition.todayValue)
    }));

  if (payloads.length > 0) {
    const { error: measurementError } = await progressMeasurementsTable
      .upsert(payloads, { onConflict: "progress_entry_id,measurement_key" });

    if (measurementError) {
      if (isMissingRelationError(measurementError)) {
        return null;
      }

      throw measurementError;
    }
  }

  return savedEntry;
}

export async function seedProgressBaseline(client: SupabaseClient<Database>, userId: string, baselineDateKey: string, sourceState = createProgressDemoState()) {
  const entryDate = normalizeDateKey(baselineDateKey);
  const progressEntriesTable = client.from("progress_entries") as any;
  const progressMeasurementsTable = client.from("progress_measurements") as any;
  const progressPhotosTable = client.from("progress_photos") as any;
  const baselineMeasurementMap = new Map(
    sourceState.measurement.histories.map((history) => [history.type, history.entries.at(-1)?.value ?? null] as const)
  );
  const baselineCheckpoint = sourceState.photos.checkpoints.find((checkpoint) => checkpoint.checkpoint === "baseline") ?? sourceState.photos.checkpoints[0];
  const { data: savedEntryData, error: entryError } = await progressEntriesTable
    .upsert(
      {
        user_id: userId,
        entry_date: entryDate,
        entry_type: "checkpoint",
        weight_kg: baselineMeasurementMap.get("weight"),
        notes: "Baseline seeded from onboarding",
        source: "onboarding_baseline"
      } satisfies ProgressEntriesInsert,
      { onConflict: "user_id,entry_date,source" }
    )
    .select("*")
    .single();
  const savedEntry = savedEntryData as unknown as ProgressEntriesRow;

  if (entryError) {
    if (isMissingRelationError(entryError)) {
      return null;
    }

    throw entryError;
  }

  const baselineMeasurements = ["waist", "hips", "thigh"]
    .map((measurementKey) => {
      const value = baselineMeasurementMap.get(measurementKey as MeasurementType);
      if (typeof value !== "number") {
        return null;
      }

      return {
        progress_entry_id: savedEntry.id,
        measurement_key: measurementKey as Exclude<MeasurementType, "weight">,
        value_cm: value
      } satisfies ProgressMeasurementsInsert;
    })
    .filter((item): item is ProgressMeasurementsInsert => Boolean(item));

  if (baselineMeasurements.length > 0) {
    const { error: measurementError } = await progressMeasurementsTable
      .upsert(baselineMeasurements, { onConflict: "progress_entry_id,measurement_key" });

    if (measurementError) {
      if (isMissingRelationError(measurementError)) {
        return null;
      }

      throw measurementError;
    }
  }

  const photoPayloads: ProgressPhotosInsert[] = [];
  const uploadedPaths: string[] = [];

  for (const pose of PHOTO_POSES) {
    const sourcePhoto = baselineCheckpoint?.photos[pose];
    if (!sourcePhoto || (sourcePhoto.status !== "captured" && sourcePhoto.status !== "retake")) {
      continue;
    }

    const sourcePath = sourcePhoto.image ?? `/progress-photo-${pose}.svg`;
    const response = await fetch(sourcePath);
    const blob = await response.blob();
    const storagePath = `${userId}/${savedEntry.id}/${pose}/${createId()}.svg`;
    const uploadResult = await client.storage.from(PROGRESS_PHOTO_BUCKET).upload(storagePath, blob, {
      contentType: "image/svg+xml",
      upsert: false
    });

    if (uploadResult.error) {
      if (isMissingRelationError(uploadResult.error)) {
        return null;
      }

      if (uploadedPaths.length > 0) {
        await client.storage.from(PROGRESS_PHOTO_BUCKET).remove(uploadedPaths);
      }
      throw uploadResult.error;
    }

    uploadedPaths.push(storagePath);

    photoPayloads.push({
      user_id: userId,
      progress_entry_id: savedEntry.id,
      pose,
      storage_bucket: PROGRESS_PHOTO_BUCKET,
      storage_path: storagePath,
      captured_at: null,
      width: null,
      height: null,
      mime_type: "image/svg+xml",
      file_size_bytes: blob.size
    });
  }

  if (photoPayloads.length > 0) {
    const { error: photoError } = await progressPhotosTable.upsert(photoPayloads, { onConflict: "progress_entry_id,pose" });
    if (photoError) {
      if (isMissingRelationError(photoError)) {
        return null;
      }

      await client.storage.from(PROGRESS_PHOTO_BUCKET).remove(uploadedPaths);
      throw photoError;
    }
  }

  return savedEntry;
}

export async function uploadProgressPhoto(
  client: SupabaseClient<Database>,
  userId: string,
  pose: PhotoPose,
  file: File,
  entryDateKey: string
): Promise<ProgressPhotoUploadResult | null> {
  const entryDate = normalizeDateKey(entryDateKey);
  const progressEntriesTable = client.from("progress_entries") as any;
  const progressPhotosTable = client.from("progress_photos") as any;
  const { data: entryData, error: entryError } = await progressEntriesTable
    .upsert(
      {
        user_id: userId,
        entry_date: entryDate,
        entry_type: "photo",
        weight_kg: null,
        notes: null,
        source: "manual"
      } satisfies ProgressEntriesInsert,
      { onConflict: "user_id,entry_date,source" }
    )
    .select("*")
    .single();
  const entry = entryData as unknown as ProgressEntriesRow;

  if (entryError) {
    if (isMissingRelationError(entryError)) {
      return null;
    }

    throw entryError;
  }

  const extension = file.name.includes(".") ? file.name.split(".").at(-1)?.toLowerCase() ?? "jpg" : "jpg";
  const storagePath = `${userId}/${entry.id}/${pose}/${createId()}.${extension}`;
  const existingResult = await progressPhotosTable
    .select("*")
    .eq("progress_entry_id", entry.id)
    .eq("pose", pose)
    .maybeSingle();
  const existingPhoto = existingResult.data as unknown as ProgressPhotosRow | null;

  if (existingResult.error) {
    if (isMissingRelationError(existingResult.error)) {
      return null;
    }

    throw existingResult.error;
  }

  const uploadResult = await client.storage.from(PROGRESS_PHOTO_BUCKET).upload(storagePath, file, {
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (uploadResult.error) {
    if (isMissingRelationError(uploadResult.error)) {
      return null;
    }

    throw uploadResult.error;
  }

  const photoRow: ProgressPhotosInsert = {
    user_id: userId,
    progress_entry_id: entry.id,
    pose,
    storage_bucket: PROGRESS_PHOTO_BUCKET,
    storage_path: storagePath,
    captured_at: new Date().toISOString(),
    width: null,
    height: null,
    mime_type: file.type || null,
    file_size_bytes: file.size
  };

  const { data: savedPhotoData, error: photoError } = await progressPhotosTable
    .upsert(photoRow, { onConflict: "progress_entry_id,pose" })
    .select("*")
    .single();
  const savedPhoto = savedPhotoData as unknown as ProgressPhotosRow;

  if (photoError) {
    if (isMissingRelationError(photoError)) {
      return null;
    }

    await client.storage.from(PROGRESS_PHOTO_BUCKET).remove([storagePath]);
    throw photoError;
  }

  if (existingPhoto?.storage_path && existingPhoto.storage_path !== storagePath) {
    await client.storage.from(PROGRESS_PHOTO_BUCKET).remove([existingPhoto.storage_path]);
  }

  const signedUrl = await hydrateProgressPhotoSignedUrl(client, savedPhoto.storage_path);

  return {
    entry,
    photo: savedPhoto,
    signedUrl
  };
}

export async function deleteProgressPhoto(client: SupabaseClient<Database>, userId: string, pose: PhotoPose, entryDateKey: string) {
  const entryDate = normalizeDateKey(entryDateKey);
  const progressEntriesTable = client.from("progress_entries") as any;
  const progressPhotosTable = client.from("progress_photos") as any;
  const { data: entryData, error: entryError } = await progressEntriesTable
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .eq("source", "manual")
    .maybeSingle();
  const entry = entryData as unknown as ProgressEntriesRow | null;

  if (entryError) {
    if (isMissingRelationError(entryError)) {
      return null;
    }

    throw entryError;
  }

  if (!entry) {
    return null;
  }

  const { data: photoData, error: photoError } = await progressPhotosTable
    .select("*")
    .eq("progress_entry_id", entry.id)
    .eq("pose", pose)
    .maybeSingle();
  const photo = photoData as unknown as ProgressPhotosRow | null;

  if (photoError) {
    if (isMissingRelationError(photoError)) {
      return null;
    }

    throw photoError;
  }

  if (!photo) {
    return null;
  }

  const { error: deleteError } = await progressPhotosTable.delete().eq("id", photo.id);
  if (deleteError) {
    if (isMissingRelationError(deleteError)) {
      return null;
    }

    throw deleteError;
  }

  if (photo.storage_path) {
    await client.storage.from(PROGRESS_PHOTO_BUCKET).remove([photo.storage_path]);
  }

  return photo;
}

export async function loadProgressState(client: SupabaseClient<Database>, userId: string, fallbackState = createProgressDemoState()): Promise<ProgressLoadResult> {
  const snapshot = await loadPersistedProgressSnapshot(client, userId);

  if (!snapshot) {
    return { state: fallbackState, source: "fallback" };
  }

  const nextState = buildProgressStateFromPersistedSnapshot(fallbackState, snapshot);
  const hydratedPhotos = await Promise.all(
    nextState.photos.checkpoints.map(async (checkpoint) =>
      Promise.all(
        PHOTO_POSES.map(async (pose) => {
          const photo = checkpoint.photos[pose];
          if (!photo.storagePath) {
            return photo;
          }

          const signedUrl = await hydrateProgressPhotoSignedUrl(client, photo.storagePath);
          return {
            ...photo,
            image: signedUrl ?? photo.image ?? `/progress-photo-${pose}.svg`,
            storagePath: photo.storagePath
          };
        })
      )
    )
  );

  return {
    state: {
      ...nextState,
      photos: {
        ...nextState.photos,
        checkpoints: nextState.photos.checkpoints.map((checkpoint, index) => ({
          ...checkpoint,
          photos: {
            front: hydratedPhotos[index][0],
            side: hydratedPhotos[index][1],
            back: hydratedPhotos[index][2]
          }
        }))
      }
    },
    source: "remote"
  };
}

export function getProgressPhotoBucket() {
  return PROGRESS_PHOTO_BUCKET;
}

export function getProgressEntryDisplayDate(entryDate: string) {
  return formatDateLabel(entryDate);
}

export function groupProgressMeasurementsByType(snapshot: ProgressPersistedSnapshot) {
  return buildMeasurementHistory(snapshot);
}
