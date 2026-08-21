const errorPatterns = [
  { pattern: /cancel/i, message: "Sign-in was cancelled. Nothing changed." },
  { pattern: /denied/i, message: "Google access was denied. Try again." },
  { pattern: /invalid login/i, message: "That email and password don't match." },
  { pattern: /invalid/i, message: "The sign-in details look invalid." },
  { pattern: /expired/i, message: "Your session ended. Sign in again and we'll pick up where you left off." },
  { pattern: /network|fetch/i, message: "Couldn't connect. Try again." },
  { pattern: /email.*sent/i, message: "Check your inbox for the reset link." },
  { pattern: /password/i, message: "That password could not be updated." }
] as const;

export function mapAuthErrorMessage(rawMessage: string | null | undefined, fallback = "Something went wrong. Try again.") {
  const normalized = rawMessage?.trim();
  if (!normalized) {
    return fallback;
  }

  for (const entry of errorPatterns) {
    if (entry.pattern.test(normalized)) {
      return entry.message;
    }
  }

  return fallback;
}

