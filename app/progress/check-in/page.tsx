import { CheckInProvider } from "@/components/checkin-provider";
import { WeeklyCheckInScreen } from "@/components/checkin-flow";

function resolveDateKey(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

interface WeeklyCheckInPageProps {
  searchParams?: Promise<{ week?: string }>;
}

export default async function WeeklyCheckInPage({ searchParams }: WeeklyCheckInPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const week = resolveDateKey(resolvedSearchParams.week);

  return (
    <CheckInProvider dateKey={week}>
      <WeeklyCheckInScreen />
    </CheckInProvider>
  );
}
