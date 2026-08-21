"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/motion/useReducedMotion";
import { useLocale } from "@/components/locale-provider";
import {
  clearFeedbackMemoryForAction,
  buildFeedbackNotice,
  createInitialFeedbackMemory,
  feedbackMemoryStorageKey,
  getFeedbackActionDefaults,
  getFeedbackActionLabel,
  reviveFeedbackMemory,
  serializeFeedbackMemory,
  resolveFeedbackLevel,
  type FeedbackKind,
  type FeedbackActionId,
  type FeedbackIntent,
  type FeedbackMemoryState,
  type FeedbackNotice
} from "@/lib/feedback";

interface FeedbackStoreValue {
  memory: FeedbackMemoryState;
  recent: FeedbackNotice[];
  emitFeedback: (intent: FeedbackIntent) => string;
  emitPending: (actionId: FeedbackActionId, title: string, detail?: string | null) => string;
  emitSuccess: (actionId: FeedbackActionId, title: string, detail?: string | null) => string;
  emitError: (actionId: FeedbackActionId, title: string, detail?: string | null) => string;
  clearFeedback: () => void;
  clearFeedbackForAction: (actionId: FeedbackActionId) => void;
  dismissFeedback: (id: string) => void;
}

const FeedbackContext = createContext<FeedbackStoreValue | null>(null);
const FEEDBACK_EVENT_NAME = "athlexforce-feedback";
const FEEDBACK_CLEAR_EVENT_NAME = "athlexforce-feedback-clear";
const SUCCESS_DISPLAY_MS = 2200;
const INFO_DISPLAY_MS = 2200;
const WARNING_DISPLAY_MS = 2800;
const ERROR_DISPLAY_MS = 2800;
const PENDING_DISPLAY_MS = 2400;
const HERO_DISPLAY_MS = 3600;

function hasWindow() {
  return typeof window !== "undefined";
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const dismissTimersRef = useRef(new Map<string, number>());
  const recentRef = useRef<FeedbackNotice[]>([]);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [memory, setMemory] = useState<FeedbackMemoryState>(() => {
    if (!hasWindow()) {
      return createInitialFeedbackMemory();
    }

    return reviveFeedbackMemory(window.sessionStorage.getItem(feedbackMemoryStorageKey()));
  });
  const [queue, setQueue] = useState<FeedbackNotice[]>(() => memory.recent.slice(0, 4));

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    window.sessionStorage.setItem(feedbackMemoryStorageKey(), serializeFeedbackMemory(memory));
  }, [memory]);

  useEffect(() => {
    recentRef.current = memory.recent;
  }, [memory.recent]);

  useEffect(() => {
    if (hasWindow()) {
      setPortalRoot(document.body);
    }
  }, []);

  useEffect(() => {
    setQueue([]);
    setMemory(createInitialFeedbackMemory());
    for (const timerId of dismissTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    dismissTimersRef.current.clear();
  }, [pathname]);

  const enqueueNotice = useCallback(
    (notice: FeedbackNotice) => {
      setMemory((current) => {
        const cleared = clearFeedbackMemoryForAction(current, notice.actionId);
        const recent = [notice, ...cleared.recent.filter((entry) => entry.dedupeKey !== notice.dedupeKey)].slice(0, 20);
        return {
          recent,
          lastByAction: {
            ...cleared.lastByAction,
            [notice.actionId]: notice
          }
        };
      });

      setQueue((current) => {
        const deduped = current.filter((entry) => entry.actionId !== notice.actionId && entry.dedupeKey !== notice.dedupeKey);
        return [notice, ...deduped].slice(0, 3);
      });

      if (!reducedMotion && hasWindow()) {
        const displayMs =
          notice.placement === "hero"
            ? HERO_DISPLAY_MS
            : notice.kind === "success"
              ? SUCCESS_DISPLAY_MS
              : notice.kind === "info"
                ? INFO_DISPLAY_MS
                : notice.kind === "warning"
                  ? WARNING_DISPLAY_MS
                  : notice.kind === "error"
                    ? ERROR_DISPLAY_MS
                    : PENDING_DISPLAY_MS;
        const timerId = window.setTimeout(() => {
          setQueue((current) => current.filter((entry) => entry.id !== notice.id));
          dismissTimersRef.current.delete(notice.id);
        }, displayMs);
        dismissTimersRef.current.set(notice.id, timerId);
      }
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    const handleFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<FeedbackIntent>;
      if (!customEvent.detail?.actionId) {
        return;
      }

      const notice = buildFeedbackNotice(locale, customEvent.detail);
      enqueueNotice(notice);
    };

    window.addEventListener(FEEDBACK_EVENT_NAME, handleFeedback as EventListener);
    return () => window.removeEventListener(FEEDBACK_EVENT_NAME, handleFeedback as EventListener);
  }, [enqueueNotice, locale]);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    const handleClearFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<Pick<FeedbackIntent, "actionId">>;
      if (!customEvent.detail?.actionId) {
        return;
      }

      const actionId = customEvent.detail.actionId;
      setMemory((current) => clearFeedbackMemoryForAction(current, actionId));
      setQueue((current) => current.filter((entry) => entry.actionId !== actionId));
      for (const notice of recentRef.current.filter((entry) => entry.actionId === actionId)) {
        const timerId = dismissTimersRef.current.get(notice.id);
        if (timerId) {
          window.clearTimeout(timerId);
          dismissTimersRef.current.delete(notice.id);
        }
      }
    };

    window.addEventListener(FEEDBACK_CLEAR_EVENT_NAME, handleClearFeedback as EventListener);
    return () => window.removeEventListener(FEEDBACK_CLEAR_EVENT_NAME, handleClearFeedback as EventListener);
  }, []);

  const emitFeedback = useCallback(
    (intent: FeedbackIntent) => {
      const notice = buildFeedbackNotice(locale, intent);
      enqueueNotice(notice);
      return notice.id;
    },
    [enqueueNotice, locale]
  );

  const emitSuccess = useCallback(
    (actionId: FeedbackActionId, title: string, detail?: string | null) => {
      return emitFeedback({ actionId, title, detail, kind: "success" });
    },
    [emitFeedback]
  );

  const emitPending = useCallback(
    (actionId: FeedbackActionId, title: string, detail?: string | null) => {
      return emitFeedback({ actionId, title, detail, kind: "pending" });
    },
    [emitFeedback]
  );

  const emitError = useCallback(
    (actionId: FeedbackActionId, title: string, detail?: string | null) => {
      return emitFeedback({ actionId, title, detail, kind: "error" });
    },
    [emitFeedback]
  );

  const dismissFeedback = useCallback((id: string) => {
    setQueue((current) => current.filter((entry) => entry.id !== id));
    const timerId = dismissTimersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      dismissTimersRef.current.delete(id);
    }
  }, []);

  const clearFeedbackForAction = useCallback((actionId: FeedbackActionId) => {
    setMemory((current) => clearFeedbackMemoryForAction(current, actionId));
    setQueue((current) => current.filter((entry) => entry.actionId !== actionId));
    for (const [noticeId, timerId] of dismissTimersRef.current.entries()) {
      if (recentRef.current.some((notice) => notice.id === noticeId && notice.actionId === actionId)) {
        window.clearTimeout(timerId);
        dismissTimersRef.current.delete(noticeId);
      }
    }
  }, []);

  const clearFeedback = useCallback(() => {
    setQueue([]);
    for (const timerId of dismissTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    dismissTimersRef.current.clear();
  }, []);

  const value = useMemo<FeedbackStoreValue>(
    () => ({
      memory,
      recent: queue,
      emitFeedback,
      emitPending,
      emitSuccess,
      emitError,
      clearFeedback,
      clearFeedbackForAction,
      dismissFeedback
    }),
    [clearFeedback, clearFeedbackForAction, dismissFeedback, emitError, emitFeedback, emitPending, emitSuccess, memory, queue]
  );

  const trayLayer = (
    <>
      <FeedbackTray notices={queue.filter((notice) => notice.placement === "hero")} onDismiss={dismissFeedback} variant="hero" />
      <FeedbackTray notices={queue.filter((notice) => notice.placement !== "hero")} onDismiss={dismissFeedback} variant="tray" />
    </>
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {portalRoot ? createPortal(trayLayer, portalRoot) : null}
    </FeedbackContext.Provider>
  );
}

function FeedbackTray({
  notices,
  onDismiss,
  variant
}: {
  notices: FeedbackNotice[];
  onDismiss: (id: string) => void;
  variant: "tray" | "hero";
}) {
  if (notices.length === 0) {
    return null;
  }

  return (
    <div className={`feedback-tray feedback-tray--${variant}`.trim()} aria-live="polite" aria-relevant="additions removals">
      {notices.map((notice) => {
        const feedbackLevel = resolveFeedbackLevel(notice.placement, notice.intensity);

        return (
          <article
            key={notice.id}
            className={`feedback-toast feedback-toast--${notice.kind} feedback-toast--${notice.placement} feedback-toast--${feedbackLevel.toLowerCase()}`}
            role={notice.ariaLive === "assertive" ? "alert" : "status"}
            data-feedback-level={feedbackLevel}
            data-feedback-kind={notice.kind}
          >
            <div className="feedback-toast__icon" aria-hidden="true">
              <FeedbackToastIcon kind={notice.kind} />
            </div>
            <div className="feedback-toast__content">
              <div className="feedback-toast__title">{notice.title}</div>
              {notice.detail ? <p className="feedback-toast__detail">{notice.detail}</p> : null}
            </div>
            <div className="feedback-toast__actions">
              <button className="feedback-toast__close focus-ring" type="button" aria-label="Dismiss feedback" onClick={() => onDismiss(notice.id)}>
                ×
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FeedbackToastIcon({ kind }: { kind: FeedbackKind }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (kind === "error") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6" />
        <path d="M15 9l-6 6" />
      </svg>
    );
  }

  if (kind === "warning") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 4 3.8 19h16.4z" />
        <path d="M12 9v4" />
        <path d="M12 16.5h.01" />
      </svg>
    );
  }

  if (kind === "pending") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" opacity="0.35" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 12.5 2.6 2.6L16.5 8.7" />
    </svg>
  );
}

export function useFeedbackStore() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedbackStore must be used within FeedbackProvider");
  }

  return context;
}

export function publishFeedback(intent: FeedbackIntent) {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent<FeedbackIntent>(FEEDBACK_EVENT_NAME, { detail: intent }));
}

export function publishFeedbackClear(actionId: FeedbackActionId) {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent<Pick<FeedbackIntent, "actionId">>(FEEDBACK_CLEAR_EVENT_NAME, { detail: { actionId } }));
}

export function publishFeedbackError(actionId: FeedbackActionId, title: string, detail?: string | null) {
  publishFeedback({ actionId, title, detail, kind: "error" });
}

export function publishFeedbackPending(actionId: FeedbackActionId, title: string, detail?: string | null) {
  publishFeedback({ actionId, title, detail, kind: "pending" });
}

export function publishFeedbackSuccess(actionId: FeedbackActionId, title: string, detail?: string | null) {
  publishFeedback({ actionId, title, detail, kind: "success" });
}

export function getFeedbackTrayCopy(locale: Parameters<typeof getFeedbackActionLabel>[0], actionId: FeedbackActionId) {
  return {
    actionLabel: getFeedbackActionLabel(locale, actionId),
    defaults: getFeedbackActionDefaults(actionId)
  };
}
