export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function readEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function isCoachxDemoMode() {
  if (!isSupabaseConfigured()) {
    return true;
  }

  return process.env.NEXT_PUBLIC_COACHX_DEMO_MODE === "true";
}

export function getSupabaseConfigSummary() {
  const config = getSupabaseConfig();

  if (!config) {
    return "AthlexForce sign-in is unavailable.";
  }

  return "AthlexForce sign-in is ready.";
}
