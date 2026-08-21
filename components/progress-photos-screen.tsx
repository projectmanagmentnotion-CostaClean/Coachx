"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslator } from "@/components/locale-provider";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useProgressStore } from "@/components/progress-provider";
import { type ComparisonMode, type PhotoPose } from "@/lib/progress-data";

const poseOrder: PhotoPose[] = ["front", "side", "back"];
const poseLabels: Record<PhotoPose, string> = {
  front: "Front",
  side: "Side",
  back: "Back"
};

function photoSrc(pose: PhotoPose) {
  return `/progress-photo-${pose}.svg`;
}

function poseHref(pose: PhotoPose) {
  return `/progress/photos/capture/${pose}`;
}

function ProgressTopbar({ closeHref, onHelp }: { closeHref: string; onHelp?: () => void }) {
  const { t } = useTranslator();
  return (
    <header className="progress-topbar progress-topbar--photos">
      <Link href={closeHref} className="progress-topbar__button focus-ring" aria-label={t("common.close")}>
        <span className="icon" aria-hidden="true">
          close
        </span>
      </Link>
      <BrandLogo variant="mark" width={34} alt="AthlexForce" />
      <button className="progress-topbar__button focus-ring" type="button" aria-label={t("common.help")} onClick={onHelp}>
        <span className="icon" aria-hidden="true">
          help
        </span>
      </button>
    </header>
  );
}

function ProgressDialog({
  title,
  description,
  onClose,
  children
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="progress-photo-dialog-title" aria-describedby="progress-photo-dialog-description">
      <div className="progress-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="progress-modal__sheet">
        <div className="row start" style={{ marginBottom: 14 }}>
          <div>
            <h2 id="progress-photo-dialog-title" className="headline-md">
              {title}
            </h2>
            <p id="progress-photo-dialog-description" className="caption" style={{ marginTop: 6 }}>
              {description}
            </p>
          </div>
          <button className="tap-target focus-ring" type="button" onClick={onClose} aria-label="Close dialog">
            <span className="icon" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="stack">{children}</div>
      </div>
    </div>
  );
}

function PhotoCard({
  pose,
  status,
  onOpen
}: {
  pose: PhotoPose;
  status: string;
  onOpen: () => void;
}) {
  return (
    <button className="progress-photo-entry-card focus-ring" type="button" onClick={onOpen}>
      <span className="progress-photo-entry-card__index">{pose === "front" ? "01" : pose === "side" ? "02" : "03"}</span>
      <img alt="" aria-hidden="true" className="progress-photo-entry-card__image" src={photoSrc(pose)} />
      <div className="progress-photo-entry-card__overlay">
        <div className="progress-photo-entry-card__icon">
          <span className="icon" aria-hidden="true">
            photo_camera
          </span>
        </div>
        <div className="progress-photo-entry-card__label">CAPTURE {poseLabels[pose].toUpperCase()}</div>
        <div className="caption" style={{ color: "var(--text-muted)" }}>
          {status}
        </div>
      </div>
    </button>
  );
}

export function ProgressPhotosEntryScreen() {
  const router = useRouter();
  const { state } = useProgressStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const selectedCheckpoint = state.photos.checkpoints.find((checkpoint) => checkpoint.checkpoint === state.photos.selectedCheckpoint) ?? state.photos.checkpoints[0];
  const capturedCount = poseOrder.filter((pose) => selectedCheckpoint.photos[pose].status === "captured" || selectedCheckpoint.photos[pose].status === "retake").length;

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<ProgressTopbar closeHref="/progress" onHelp={() => setHelpOpen(true)} />}>
      <main className="content tight">
        <section className="section progress-hero">
          <div className="progress-hero__eyebrow">
            <span>PHASE 1</span>
            <span>•</span>
            <span>WEEK 4</span>
          </div>
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            PROGRESS PHOTOS
          </h1>
          <p className="body-md muted" style={{ marginTop: 12 }}>
            Consistent photos make physical changes easier to compare over time.
          </p>
        </section>

        <section className="section">
          <Card className="progress-checkpoint-summary p-16">
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                LAST CHECKPOINT
              </div>
              <div className="body-lg" style={{ color: "var(--text-primary)" }}>
                {state.photos.checkpoints[0].dateLabel}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                TODAY
              </div>
              <div className="body-lg" style={{ color: "var(--accent-primary)" }}>
                {state.measurement.currentDateLabel}
              </div>
            </div>
          </Card>
        </section>

        <section className="section">
          <div className="row start" style={{ marginBottom: 12 }}>
            <h2 className="headline-md">Capture</h2>
            <span className="progress-chip progress-chip--accent">{capturedCount} / 3 PHOTOS</span>
          </div>

          <div className="progress-photo-strip">
            {poseOrder.map((pose) => (
              <PhotoCard
                key={pose}
                onOpen={() => router.push(poseHref(pose))}
                pose={pose}
                status={selectedCheckpoint.photos[pose].status === "captured" ? "Captured" : "Missing"}
              />
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="progress-privacy-card p-16">
            <div className="row start" style={{ alignItems: "flex-start" }}>
              <span className="icon" aria-hidden="true" style={{ marginTop: 2 }}>
                lock
              </span>
              <div>
                <div className="body-md" style={{ fontWeight: 700 }}>
                  PRIVATE BY DEFAULT
                </div>
                <p className="caption" style={{ marginTop: 4 }}>
                  Your progress photos are only used for your progress tracking and are stored securely.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <div className="progress-fixed-actions">
        <PrimaryButton href={poseHref("front")} className="focus-ring">
          START PHOTOS
        </PrimaryButton>
        <SecondaryButton className="focus-ring" onClick={() => router.push("/progress")}>
          NOT NOW
        </SecondaryButton>
      </div>

      {helpOpen ? (
        <ProgressDialog
          title="Photo preparation"
          description="Keep the capture consistent so the comparison stays useful."
          onClose={() => setHelpOpen(false)}
        >
          <ul className="progress-dialog-list">
            <li>Same lighting.</li>
            <li>Similar distance.</li>
            <li>Relaxed posture.</li>
            <li>Similar clothing.</li>
            <li>Consistency matters more than perfection.</li>
          </ul>
        </ProgressDialog>
      ) : null}
    </Screen>
  );
}

function PoseStatusChip({ pose, status }: { pose: PhotoPose; status: string }) {
  return (
    <div className="progress-pose-chip">
      <span className="caption" style={{ color: "var(--text-secondary)" }}>
        {poseLabels[pose].toUpperCase()}
      </span>
      <span className="body-md">{status}</span>
    </div>
  );
}

export function ProgressPhotoCaptureScreen({ pose }: { pose: PhotoPose }) {
  const router = useRouter();
  const { state, savePhotoCapture, retakePhoto, markPhotoMissing, setSelectedPhotoCheckpoint } = useProgressStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const checkpoint = state.photos.checkpoints.find((item) => item.checkpoint === state.photos.selectedCheckpoint) ?? state.photos.checkpoints[1];
  const photo = checkpoint.photos[pose];
  const isCaptured = photo.status === "captured" || photo.status === "retake";
  const nextPose = pose === "front" ? "side" : pose === "side" ? "back" : "front";
  const imageSrc = previewUrl ?? photo.image ?? photoSrc(pose);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openFilePicker = () => fileInputRef.current?.click();

  const onFileSelected = (file: File | null) => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(file ? window.URL.createObjectURL(file) : null);
  };

  const saveCapture = async () => {
    if (!selectedFile) {
      openFilePicker();
      return;
    }

    setSaving(true);
    const result = await savePhotoCapture(pose, selectedFile);
    setSaving(false);

    if (result.ok) {
      setSelectedFile(null);
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedPhotoCheckpoint(state.photos.selectedCheckpoint);
      router.push("/progress/photos/compare");
    }
  };

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<ProgressTopbar closeHref="/progress/photos" onHelp={() => setHelpOpen(true)} />}>
      <main className="content tight">
        <section className="section progress-hero">
          <div className="progress-hero__eyebrow">
            <span>PHASE 1</span>
            <span>•</span>
            <span>WEEK 4</span>
          </div>
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {isCaptured ? `REVIEW ${poseLabels[pose].toUpperCase()}` : `CAPTURE ${poseLabels[pose].toUpperCase()}`}
          </h1>
          <p className="body-md muted" style={{ marginTop: 12 }}>
            Same lighting, similar distance, relaxed posture, similar clothing. Consistency matters more than perfection.
          </p>
        </section>

        <section className="section">
          <Card className="progress-checkpoint-summary p-16">
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                LAST CHECKPOINT
              </div>
              <div className="body-lg" style={{ color: "var(--text-primary)" }}>
                {state.photos.checkpoints[0].dateLabel}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                TODAY
              </div>
              <div className="body-lg" style={{ color: "var(--accent-primary)" }}>
                {state.measurement.currentDateLabel}
              </div>
            </div>
          </Card>
        </section>

        <section className="section">
          <Card className="progress-photo-stage p-16">
            <div className="progress-photo-stage__image-wrap">
              <img alt={`${poseLabels[pose]} progress photo placeholder`} className="progress-photo-stage__image" src={imageSrc} />
              <div className="progress-photo-stage__badge">
                <span className="icon filled" aria-hidden="true" style={{ fontSize: 18 }}>
                  photo_camera
                </span>
                {isCaptured ? "CAPTURED" : `CAPTURE ${poseLabels[pose].toUpperCase()}`}
              </div>
              <span className="progress-photo-stage__index">{pose === "front" ? "01" : pose === "side" ? "02" : "03"}</span>
            </div>
            <div className="progress-photo-stage__footer">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>
                  {poseLabels[pose].toUpperCase()}
                </div>
                <div className="caption">{selectedFile ? selectedFile.name : "Private by default · saved remotely in the private bucket"}</div>
              </div>
              <button className="tap-target focus-ring" type="button" aria-label="Open photo guidance" onClick={() => setHelpOpen(true)}>
                <span className="icon" aria-hidden="true">
                  help
                </span>
              </button>
            </div>
          </Card>
        </section>

        <input
          ref={fileInputRef}
          accept="image/*"
          aria-label={`${poseLabels[pose]} progress photo`}
          style={{ position: "absolute", inset: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />

        <section className="section">
          <div className="stack">
            {poseOrder.map((checkPose) => (
              <PoseStatusChip
                key={checkPose}
                pose={checkPose}
                status={
                  checkpoint.photos[checkPose].status === "captured"
                    ? "captured"
                    : checkpoint.photos[checkPose].status === "retake"
                      ? "retake"
                      : "missing"
                }
              />
            ))}
          </div>
        </section>
      </main>

      <div className="progress-fixed-actions">
        {isCaptured ? (
          <>
            <PrimaryButton className="focus-ring" onClick={saveCapture} disabled={saving}>
              {saving ? "SAVING..." : selectedFile ? "SAVE PHOTO" : "REPLACE PHOTO"}
            </PrimaryButton>
            <SecondaryButton className="focus-ring" onClick={() => retakePhoto(pose)}>
              RETAKE
            </SecondaryButton>
          </>
        ) : (
          <>
            <PrimaryButton className="focus-ring" onClick={saveCapture} disabled={saving}>
              {saving ? "SAVING..." : selectedFile ? "SAVE PHOTO" : "CAPTURE PHOTO"}
            </PrimaryButton>
            <SecondaryButton className="focus-ring" onClick={() => void markPhotoMissing(pose)}>
              MARK MISSING
            </SecondaryButton>
          </>
        )}
        <SecondaryButton className="focus-ring" onClick={() => router.push(`/progress/photos/capture/${nextPose}`)}>
          NEXT POSE
        </SecondaryButton>
      </div>

      {helpOpen ? (
        <ProgressDialog
          title="Photo preparation"
          description="Keep the capture consistent so the comparison stays useful."
          onClose={() => setHelpOpen(false)}
        >
          <ul className="progress-dialog-list">
            <li>Same lighting.</li>
            <li>Similar distance.</li>
            <li>Relaxed posture.</li>
            <li>Similar clothing.</li>
            <li>Consistency matters more than perfection.</li>
          </ul>
        </ProgressDialog>
      ) : null}
    </Screen>
  );
}

function SegmentButton({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={`progress-segment ${active ? "active" : ""}`.trim()} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function ComparisonPanel({
  pose,
  mode,
  baselineLabel,
  currentLabel,
  baselineSrc,
  currentSrc,
  onModeChange
}: {
  pose: PhotoPose;
  mode: ComparisonMode;
  baselineLabel: string;
  currentLabel: string;
  baselineSrc: string;
  currentSrc: string;
  onModeChange: (mode: ComparisonMode) => void;
}) {
  const [sliderPosition, setSliderPosition] = useState(56);

  if (mode === "slider") {
    return (
      <div className="progress-compare-panel">
        <div className="progress-compare-slider">
          <img alt={`${baselineLabel} baseline ${poseLabels[pose]} progress photo`} className="progress-compare-slider__image baseline" src={baselineSrc} />
          <div className="progress-compare-slider__current" style={{ width: `${sliderPosition}%` }}>
            <img alt={`${currentLabel} current ${poseLabels[pose]} progress photo`} className="progress-compare-slider__image current" src={currentSrc} />
          </div>
          <div className="progress-compare-slider__labels">
            <span className="progress-label">BASELINE</span>
            <span className="progress-label progress-label--accent">CURRENT</span>
          </div>
        </div>
        <label className="progress-slider-control">
          <span className="caption">Drag to compare</span>
          <input
            aria-label="Compare slider"
            min={0}
            max={100}
            type="range"
            value={sliderPosition}
            onChange={(event) => setSliderPosition(Number(event.target.value))}
          />
        </label>
        <SecondaryButton className="focus-ring" onClick={() => onModeChange("side-by-side")}>
          SIDE BY SIDE
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="progress-compare-grid">
      <div className="progress-compare-card">
        <img alt={`Baseline ${poseLabels[pose]} photo`} className="progress-compare-card__image baseline" src={baselineSrc} />
        <div className="progress-compare-card__label">BASELINE</div>
      </div>
      <div className="progress-compare-card progress-compare-card--accent">
        <img alt={`Current ${poseLabels[pose]} photo`} className="progress-compare-card__image current" src={currentSrc} />
        <div className="progress-compare-card__label progress-compare-card__label--accent">CURRENT</div>
      </div>
      <SecondaryButton className="focus-ring progress-compare-grid__toggle" onClick={() => onModeChange("slider")}>
        COMPARE SLIDER
      </SecondaryButton>
    </div>
  );
}

export function ProgressPhotoComparisonScreen() {
  const { state, setComparisonMode, setComparisonPose } = useProgressStore();
  const currentCheckpoint = state.photos.checkpoints.find((checkpoint) => checkpoint.checkpoint === "week-4") ?? state.photos.checkpoints[1];
  const baselineCheckpoint = state.photos.checkpoints[0];
  const baselinePhoto = baselineCheckpoint.photos[state.photos.comparisonPose];
  const currentPhoto = currentCheckpoint.photos[state.photos.comparisonPose];
  const baselineSrc = baselinePhoto.image ?? photoSrc(state.photos.comparisonPose);
  const currentSrc = currentPhoto.image ?? photoSrc(state.photos.comparisonPose);

  const netChange = [
    { label: "Weight", current: "62.8", previous: "63.0", unit: "kg", accent: false },
    { label: "Waist", current: "72.8", previous: "74.0", unit: "cm", accent: true },
    { label: "Hip Thrust", current: "90", previous: "80", unit: "kg", accent: false },
    { label: "Training", current: "92%", previous: "Target >90%", unit: "adh", accent: false }
  ];

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<ProgressTopbar closeHref="/progress/photos" />}>
      <main className="content tight">
        <section className="section progress-hero">
          <div className="progress-hero__eyebrow">
            <span>COMPARE PROGRESS</span>
          </div>
          <h1 className="headline-md">COMPARE PROGRESS</h1>
        </section>

        <section className="section">
          <Card className="progress-compare-selector p-16">
            <div className="progress-compare-selector__line" aria-hidden="true" />
            <button className="progress-compare-selector__panel focus-ring" type="button" onClick={() => setComparisonPose("front")}>
              <div className="caption" style={{ color: "var(--text-secondary)" }}>
                FROM
              </div>
              <div className="body-md" style={{ color: "var(--text-primary)" }}>
                {baselineCheckpoint.dateLabel}
              </div>
              <div className="caption">Baseline</div>
            </button>
            <button className="progress-compare-selector__center focus-ring" type="button" aria-label="Switch comparison direction">
              <span className="icon" aria-hidden="true">
                arrow_forward
              </span>
            </button>
            <button className="progress-compare-selector__panel focus-ring" type="button" onClick={() => setComparisonPose("front")}>
              <div className="caption" style={{ color: "var(--text-secondary)" }}>
                TO
              </div>
              <div className="body-md" style={{ color: "var(--text-primary)" }}>
                {currentCheckpoint.dateLabel}
              </div>
              <div className="caption" style={{ color: "var(--accent-primary)" }}>
                Week 4
              </div>
            </button>
          </Card>
        </section>

        <section className="section">
          <div className="progress-segment-row">
            <SegmentButton active={state.photos.comparisonPose === "front"} onClick={() => setComparisonPose("front")}>
              FRONT
            </SegmentButton>
            <SegmentButton active={state.photos.comparisonPose === "side"} onClick={() => setComparisonPose("side")}>
              SIDE
            </SegmentButton>
            <SegmentButton active={state.photos.comparisonPose === "back"} onClick={() => setComparisonPose("back")}>
              BACK
            </SegmentButton>
          </div>
        </section>

        <section className="section">
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="caption" style={{ color: "var(--text-secondary)" }}>
              CURRENT VIEW
            </div>
            <button className="progress-compare-toggle focus-ring" type="button" onClick={() => setComparisonMode(state.photos.comparisonMode === "side-by-side" ? "slider" : "side-by-side")}>
              <span className="icon" aria-hidden="true">
                compare
              </span>
              {state.photos.comparisonMode === "side-by-side" ? "COMPARE SLIDER" : "SIDE BY SIDE"}
            </button>
          </div>

          <ComparisonPanel
            baselineLabel={baselineCheckpoint.dateLabel}
            baselineSrc={baselineSrc}
            currentLabel={currentCheckpoint.dateLabel}
            mode={state.photos.comparisonMode}
            onModeChange={setComparisonMode}
            currentSrc={currentSrc}
            pose={state.photos.comparisonPose}
          />
        </section>

        <section className="section">
          <div className="progress-trend-strip">
            <div className="progress-trend-strip__eyebrow">
              <span>4 WEEKS</span>
              <span>NET CHANGE</span>
            </div>
            <div className="progress-trend-strip__grid">
              {netChange.map((item) => (
                <div key={item.label} className={`progress-trend-tile ${item.accent ? "accent" : ""}`.trim()}>
                  <div className="caption">{item.label}</div>
                  <div className="headline-md" style={{ marginTop: 4 }}>
                    {item.current} <span className="caption">{item.unit}</span>
                  </div>
                  <div className="caption" style={{ marginTop: 4, color: "var(--accent-primary)" }}>
                    {item.previous}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Screen>
  );
}
