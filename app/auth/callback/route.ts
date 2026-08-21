import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveSafeInternalPath } from "@/lib/auth/session-policy";

export async function GET(request: NextRequest) {
  const nextPath = resolveSafeInternalPath(request.nextUrl.searchParams.get("next"), "/");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const recoveryRedirectUrl = new URL("/reset-password", request.url);
  const callbackRedirectUrl = new URL(nextPath, request.url);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(type === "recovery" ? recoveryRedirectUrl : callbackRedirectUrl);
  }

  if (errorDescription) {
    return NextResponse.redirect(new URL("/entry?auth=error", request.url));
  }

  const response = NextResponse.redirect(type === "recovery" ? recoveryRedirectUrl : callbackRedirectUrl);
  const supabase = createSupabaseRouteClient(request, response);

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/entry?auth=error", request.url));
    }
  }

  return response;
}
