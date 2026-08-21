import { cookies } from "next/headers";
import { ProgressTrendsScreen } from "@/components/progress-trends-screen";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { getInitialLocale, localeCookieName } from "@/lib/i18n";
import { buildEmptyPerformanceAnalyticsDashboard, loadPerformanceAnalyticsDashboard } from "@/lib/performance-analytics";

interface ProgressTrendsPageProps {
  searchParams?: Promise<{ range?: string }>;
}

export default async function TrendsPage({ searchParams }: ProgressTrendsPageProps) {
  const cookieStore = await cookies();
  const locale = getInitialLocale(cookieStore.get(localeCookieName)?.value);
  const resolvedSearchParams = (await searchParams) ?? {};
  const client = await createSupabaseServerComponentClient();

  if (!client) {
    const fallback = buildEmptyPerformanceAnalyticsDashboard(locale, resolvedSearchParams.range);
    return <ProgressTrendsScreen dashboard={fallback} basePath="/progress/trends" />;
  }

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    const fallback = buildEmptyPerformanceAnalyticsDashboard(locale, resolvedSearchParams.range);
    return <ProgressTrendsScreen dashboard={fallback} basePath="/progress/trends" />;
  }

  const dashboard = await loadPerformanceAnalyticsDashboard(client, user.id, locale, resolvedSearchParams.range);
  return <ProgressTrendsScreen dashboard={dashboard} basePath="/progress/trends" />;
}
