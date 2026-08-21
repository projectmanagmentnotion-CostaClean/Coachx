import { NutritionScreen } from "@/components/nutrition-screen";

interface NutritionPageProps {
  params: Promise<{ date: string }>;
  searchParams?: Promise<{ state?: "ready" | "loading" | "empty" | "error" }>;
}

export default async function DayNutritionPage({ params, searchParams }: NutritionPageProps) {
  const [{ date }, resolvedSearchParams = {}] = await Promise.all([params, searchParams]);
  const mode = resolvedSearchParams.state ?? "ready";

  return <NutritionScreen dateKey={date} mode={mode} />;
}
