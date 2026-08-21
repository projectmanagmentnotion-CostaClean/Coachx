"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslator, getLocaleFlag } from "@/components/locale-provider";
import { supportedLocales, type Locale } from "@/lib/i18n";

const LANGUAGE_META: Record<Locale, { flagSrc: string }> = {
  es: { flagSrc: getLocaleFlag("es") },
  ca: { flagSrc: getLocaleFlag("ca") },
  en: { flagSrc: getLocaleFlag("en") },
  de: { flagSrc: getLocaleFlag("de") }
};

type LanguageSelectorProps = {
  value: Locale;
  onChange: (locale: Locale) => void;
  compact?: boolean;
};

export function LanguageSelector({ value, onChange, compact = false }: LanguageSelectorProps) {
  const { locale, t } = useTranslator();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Record<Locale, HTMLButtonElement | null>>({
    es: null,
    ca: null,
    en: null,
    de: null
  });
  const menuId = useId();
  const [open, setOpen] = useState(false);

  const label = t("common.language");
  const selectedLocale = useMemo(() => supportedLocales.find((entry) => entry === value) ?? "es", [value]);
  const selectedName = t(`locale.${selectedLocale}`);
  const selectedFlagSrc = LANGUAGE_META[selectedLocale].flagSrc;
  const appliedInstantlyCopy =
    {
      en: "Applied instantly",
      es: "Se aplica al instante",
      ca: "S'aplica a l'instant",
      de: "Wird sofort angewendet"
    }[locale as "en" | "es" | "ca" | "de"] ?? "Applied instantly";

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const current = optionRefs.current[value];
    current?.focus();
  }, [open, value]);

  const options = useMemo(
    () =>
      supportedLocales.map((locale) => ({
        locale,
        name: t(`locale.${locale}`),
        flagSrc: LANGUAGE_META[locale].flagSrc
      })),
    [t]
  );

  const selectLocale = (locale: Locale) => {
    onChange(locale);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={`language-selector ${compact ? "language-selector--compact" : ""}`.trim()}>
      <div className={`language-selector__label-row ${compact ? "language-selector__label-row--compact" : ""}`.trim()}>
        <div className="eyebrow language-selector__eyebrow">{label}</div>
      </div>

      <button
        ref={triggerRef}
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="language-selector__trigger focus-ring"
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="language-selector__trigger-copy">
          <span className="language-selector__selection">
            <img className="language-selector__flag" src={selectedFlagSrc} alt="" aria-hidden="true" draggable={false} />
            <span className="language-selector__value">{selectedName}</span>
          </span>
          <span className="caption language-selector__status">{appliedInstantlyCopy}</span>
        </span>
        <span className="icon language-selector__chevron" aria-hidden="true">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div id={menuId} className="language-selector__menu elevated" role="radiogroup" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.locale === value;

            return (
              <button
                key={option.locale}
                ref={(element) => {
                  optionRefs.current[option.locale] = element;
                }}
                aria-checked={isSelected}
                className={`language-selector__option focus-ring ${isSelected ? "selected" : ""}`.trim()}
                onClick={() => selectLocale(option.locale)}
                role="radio"
                type="button"
              >
                <span className="language-selector__option-copy">
                  <img className="language-selector__flag language-selector__flag--option" src={option.flagSrc} alt="" aria-hidden="true" draggable={false} />
                  <span className="language-selector__option-text">
                    <span className="language-selector__option-name">{option.name}</span>
                    <span className="caption language-selector__option-code">{option.locale.toUpperCase()}</span>
                  </span>
                </span>
                <span className="language-selector__option-check" aria-hidden="true">
                  {isSelected ? "check" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
