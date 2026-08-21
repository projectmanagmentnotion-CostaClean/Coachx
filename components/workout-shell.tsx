import Link from "next/link";
import type { ReactNode } from "react";
import { Screen } from "@/components/screen";

interface WorkoutShellProps {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  shellClassName?: string;
}

export function WorkoutShell({
  title,
  subtitle,
  backHref = "/",
  rightAction,
  children,
  shellClassName = ""
}: WorkoutShellProps) {
  return (
    <Screen
      shellClassName={`screen-shell workout-shell ${shellClassName}`.trim()}
      topbar={
        <header className="topbar workout-topbar">
          <Link href={backHref} className="tap-target workout-topbar__back focus-ring" aria-label="Go back">
            <span className="icon" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <div className="workout-topbar__copy">
            <div className="eyebrow workout-topbar__title" style={{ margin: 0 }}>
              {title}
            </div>
            {subtitle ? <div className="caption workout-topbar__subtitle">{subtitle}</div> : null}
          </div>
          <div className="workout-topbar__action">{rightAction ?? <span className="tap-target" />}</div>
        </header>
      }
    >
      {children}
    </Screen>
  );
}
