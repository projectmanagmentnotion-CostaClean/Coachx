const rememberSessionStorageKey = "athlexforce-remember-session";
export type WorkspacePreference = "athlete" | "coach";
export type IdentityIntent = "self_managed" | "coach_managed" | "coach";

const workspacePreferenceStorageKey = "athlexforce-workspace";
const identityIntentStorageKey = "athlexforce-identity-intent";
const trustedAppOrigins = [
  "http://localhost:3000",
  "https://coachxsync1.vercel.app",
  "https://coachxsync1-zeta.vercel.app"
] as const;

export function readRememberSessionPreference(defaultValue = true) {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(rememberSessionStorageKey);
  if (stored == null) {
    return defaultValue;
  }

  return stored !== "false";
}

export function writeRememberSessionPreference(rememberSession: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(rememberSessionStorageKey, rememberSession ? "true" : "false");
}

function readCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function writeCookieValue(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secureAttribute = typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
}

export function readWorkspacePreference(defaultValue: WorkspacePreference = "athlete"): WorkspacePreference {
  const stored = readCookieValue(workspacePreferenceStorageKey);
  return stored === "coach" ? "coach" : defaultValue;
}

export function writeWorkspacePreference(workspace: WorkspacePreference) {
  writeCookieValue(workspacePreferenceStorageKey, workspace);
}

export function readIdentityIntent(defaultValue: IdentityIntent | null = null): IdentityIntent | null {
  const stored = readCookieValue(identityIntentStorageKey);
  return stored === "self_managed" || stored === "coach_managed" || stored === "coach" ? stored : defaultValue;
}

export function writeIdentityIntent(identityIntent: IdentityIntent) {
  writeCookieValue(identityIntentStorageKey, identityIntent);
}

export function getRememberSessionPreferenceLabel(rememberSession: boolean) {
  return rememberSession ? "Keep me signed in" : "Sign out when this browser session ends";
}

export function resolveSafeInternalPath(nextPath: string | null | undefined, fallback = "/") {
  if (!nextPath || typeof nextPath !== "string") {
    return fallback;
  }

  if (!nextPath.startsWith("/")) {
    return fallback;
  }

  if (nextPath.startsWith("//") || nextPath.includes("://")) {
    return fallback;
  }

  return nextPath;
}

export function isTrustedAppOrigin(origin: string | null | undefined) {
  return typeof origin === "string" && trustedAppOrigins.includes(origin as (typeof trustedAppOrigins)[number]);
}

export function resolveTrustedAppOrigin(origin: string | null | undefined) {
  return isTrustedAppOrigin(origin) ? origin : null;
}

export function buildTrustedAppUrl(origin: string | null | undefined, pathname: string, fallback = "/") {
  const trustedOrigin = resolveTrustedAppOrigin(origin);
  if (!trustedOrigin) {
    return null;
  }

  return `${trustedOrigin}${resolveSafeInternalPath(pathname, fallback)}`;
}

