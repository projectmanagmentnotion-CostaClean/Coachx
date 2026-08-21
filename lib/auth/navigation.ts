import type { AthleteOnboardingStatus } from "@/lib/supabase/database.types";

export const protectedAthleteRoutePrefixes = [
  "/",
  "/calendar",
  "/day",
  "/onboarding",
  "/progress",
  "/profile",
  "/program",
  "/workout",
  "/exercises"
];

export const protectedCoachRoutePrefixes = ["/coach"];

export const publicRoutePrefixes = [
  "/entry",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png"
];

export function isPublicRoute(pathname: string) {
  return publicRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isProtectedAthleteRoute(pathname: string) {
  if (isPublicRoute(pathname)) {
    return false;
  }

  return protectedAthleteRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isProtectedCoachRoute(pathname: string) {
  return protectedCoachRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveAthleteRouteForStatus(status: AthleteOnboardingStatus | null | undefined) {
  if (!status || status === "not_started") {
    return "/entry";
  }

  if (status === "in_progress") {
    return "/onboarding";
  }

  return "/";
}
