import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isCoachxDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";
import { isProtectedAthleteRoute, isProtectedCoachRoute } from "@/lib/auth/navigation";
import { loadIdentityResolution, resolveAuthenticatedLandingRoute } from "@/lib/auth/identity-resolver";
import type { IdentityIntent, WorkspacePreference } from "@/lib/auth/session-policy";

function readWorkspacePreferenceFromRequest(request: NextRequest): WorkspacePreference | null {
  const value = request.cookies.get("athlexforce-workspace")?.value;
  return value === "coach" || value === "athlete" ? value : null;
}

function readIdentityIntentFromRequest(request: NextRequest): IdentityIntent | null {
  const value = request.cookies.get("athlexforce-identity-intent")?.value;
  return value === "self_managed" || value === "coach_managed" || value === "coach" ? value : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured() || isCoachxDemoMode()) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseRouteClient(request, response);

  if (!supabase) {
    return NextResponse.next();
  }

  const athleteClient = supabase as SupabaseClient<any>;
  const {
    data: { user }
  } = await athleteClient.auth.getUser();

  if (!user) {
    if (isProtectedCoachRoute(pathname) || isProtectedAthleteRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/entry";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  const identity = await loadIdentityResolution(athleteClient, user.id, {
    preferredWorkspace: readWorkspacePreferenceFromRequest(request),
    identityIntent: readIdentityIntentFromRequest(request)
  }).catch(() => null);

  if (!identity) {
    return response;
  }

  const landingRoute = resolveAuthenticatedLandingRoute(identity);

  if (isProtectedCoachRoute(pathname)) {
    if (!identity.coachCapability) {
      if (identity.identityIntent === "coach") {
        return response;
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/entry";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === "/coach" || pathname === "/coach/") {
      return response;
    }

    return response;
  }

  if (pathname === "/" || pathname === "/entry" || pathname === "/login") {
    if (landingRoute !== pathname) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = landingRoute;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname.startsWith("/onboarding") && identity.athleteProfile?.onboarding_status === "completed" && landingRoute !== "/onboarding") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = landingRoute;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (identity.athleteProfile?.onboarding_status !== "completed" && isProtectedAthleteRoute(pathname) && !pathname.startsWith("/onboarding")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/onboarding") && landingRoute === "/coach") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/coach";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|manifest.json|robots.txt|sitemap.xml).*)"]
};
