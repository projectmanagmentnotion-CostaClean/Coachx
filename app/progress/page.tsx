import { cookies } from "next/headers";
import { PerformanceAnalyticsScreen } from "@/components/performance-analytics-screen";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { getInitialLocale, localeCookieName } from "@/lib/i18n";
import { buildEmptyPerformanceAnalyticsDashboard, loadPerformanceAnalyticsDashboard } from "@/lib/performance-analytics";

interface ProgressPageProps {
  searchParams?: Promise<{ range?: string }>;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const cookieStore = await cookies();
  const locale = getInitialLocale(cookieStore.get(localeCookieName)?.value);
  const resolvedSearchParams = (await searchParams) ?? {};
  const client = await createSupabaseServerComponentClient();

  if (!client) {
    return <PerformanceAnalyticsScreen dashboard={buildEmptyPerformanceAnalyticsDashboard(locale, resolvedSearchParams.range)} basePath="/progress" />;
  }

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    return <PerformanceAnalyticsScreen dashboard={buildEmptyPerformanceAnalyticsDashboard(locale, resolvedSearchParams.range)} basePath="/progress" />;
  }

  const dashboard = await loadPerformanceAnalyticsDashboard(client, user.id, locale, resolvedSearchParams.range);
  return <PerformanceAnalyticsScreen dashboard={dashboard} basePath="/progress" />;
}
