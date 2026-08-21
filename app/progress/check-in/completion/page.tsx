import { CheckInProvider } from "@/components/checkin-provider";
import { WeeklyCheckInCompletionScreen } from "@/components/checkin-flow";

function resolveDateKey(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

interface WeeklyCheckInCompletionPageProps {
  searchParams?: Promise<{ week?: string }>;
}

export default async function WeeklyCheckInCompletionPage({ searchParams }: WeeklyCheckInCompletionPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const week = resolveDateKey(resolvedSearchParams.week);

  return (
    <CheckInProvider dateKey={week}>
      <WeeklyCheckInCompletionScreen />
    </CheckInProvider>
  );
}
