"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { bootstrapLocale, getCurrentLocale, getTranslation, setCurrentLocale, subscribeLocale } from "@/lib/i18n";

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootstrapLocale();
  }, []);

  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return children;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, getCurrentLocale, getCurrentLocale);

  return {
    locale,
    setLocale: setCurrentLocale
  };
}

export function useResolvedLocale() {
  return getCurrentLocale();
}

export function getLocaleFlag(locale: string) {
  switch (locale) {
    case "es":
      return "/flags/es.svg";
    case "ca":
      return "/flags/ca.svg";
    case "en":
      return "/flags/gb.svg";
    case "de":
      return "/flags/de.svg";
    default:
      return "";
  }
}

export function useTranslator() {
  const { locale } = useLocale();

  return {
    locale,
    t: (path: string) => getTranslation(locale, path)
  };
}
