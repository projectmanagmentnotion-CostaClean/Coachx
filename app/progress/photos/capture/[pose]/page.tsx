import { ProgressPhotoCaptureScreen } from "@/components/progress-photos-screen";
import type { PhotoPose } from "@/lib/progress-data";

function isPhotoPose(value: string): value is PhotoPose {
  return value === "front" || value === "side" || value === "back";
}

export default async function PhotoCapturePage({
  params
}: {
  params: Promise<{ pose: string }>;
}) {
  const resolved = await params;
  const pose = isPhotoPose(resolved.pose) ? resolved.pose : "front";

  return <ProgressPhotoCaptureScreen pose={pose} />;
}

