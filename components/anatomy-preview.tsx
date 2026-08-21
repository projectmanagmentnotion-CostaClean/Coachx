import type { MuscleGroup } from "@/lib/coachx-data";
import { resolveAnatomyVisual } from "@/lib/anatomy";

interface AnatomyPreviewProps {
  focus: MuscleGroup[];
  className?: string;
}

export function AnatomyPreview({ focus, className = "" }: AnatomyPreviewProps) {
  const visual = resolveAnatomyVisual(focus);

  return (
    <div className={`anatomy-preview ${className}`.trim()}>
      <div className="anatomy-preview__figure" aria-hidden="true">
        <div className={`anatomy-preview__silhouette ${visual.orientation}`} />
        <div className="anatomy-preview__highlight" />
        <div className="anatomy-preview__caption">
          <div className="body-md" style={{ fontWeight: 700 }}>
            {visual.title}
          </div>
        </div>
      </div>
      <div className="anatomy-preview__focus">
        <span className="eyebrow" style={{ margin: 0 }}>
          {visual.focusLabel}
        </span>
      </div>
    </div>
  );
}
