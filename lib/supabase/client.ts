"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { readRememberSessionPreference } from "@/lib/auth/session-policy";

const browserClients = new Map<string, SupabaseClient<Database>>();

export function getSupabaseBrowserClient(rememberSession = readRememberSessionPreference()) {
  const cacheKey = rememberSession ? "remember" : "session";
  const cachedClient = browserClients.get(cacheKey);
  if (cachedClient) {
    return cachedClient;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const browserClient = createBrowserClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: rememberSession
    }
  });
  browserClients.set(cacheKey, browserClient);
  return browserClient;
}
