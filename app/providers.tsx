"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { ProgramProvider } from "@/components/program-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { FeedbackProvider } from "@/components/feedback-provider";
import { ProfileSettingsProvider } from "@/components/profile-settings-provider";
import { ProgressProvider } from "@/components/progress-provider";
import { WorkoutProvider } from "@/components/workout-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <FeedbackProvider>
          <WorkoutProvider>
            <ProgressProvider>
              <ProgramProvider>
                <OnboardingProvider>
                  <ProfileSettingsProvider>{children}</ProfileSettingsProvider>
                </OnboardingProvider>
              </ProgramProvider>
            </ProgressProvider>
          </WorkoutProvider>
        </FeedbackProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}
