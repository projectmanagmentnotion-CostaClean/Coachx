"use client";

import { useId, useMemo } from "react";
import {
  formatNumericInput,
  getNumericCopy,
  getRirOptionCopy,
  getRpeLabel,
  normalizeNumericInput,
  parseNumericInput,
  RIR_VALUES,
  RPE_VALUES,
  stepNumericInput,
  type SupportedLocale
} from "@/lib/numeric-input";

export type NumericControlState = "default" | "focus" | "editing" | "valid" | "invalid" | "saving" | "saved" | "read-only";

export interface NumericControlProps {
  locale: SupportedLocale;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  decimals?: number;
  min?: number;
  max?: number;
  fallback?: number;
  inputMode?: "numeric" | "decimal";
  state?: NumericControlState;
  helper?: string;
  error?: string | null;
  status?: string;
  readOnly?: boolean;
  disabled?: boolean;
  density?: "compact" | "hero";
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function stateLabel(locale: SupportedLocale, state: NumericControlState) {
  const copy = getNumericCopy(locale);

  switch (state) {
    case "saving":
      return copy.saving;
    case "saved":
      return copy.saved;
    case "read-only":
      return copy.readOnly;
    case "invalid":
      return copy.enterValidNumber;
    default:
      return "";
  }
}

export function NumericControl({
  locale,
  label,
  unit,
  value,
  onChange,
  step = 1,
  decimals = 1,
  min,
  max,
  fallback,
  inputMode = "decimal",
  state = "default",
  helper,
  error,
  status,
  readOnly = false,
  disabled = false,
  density = "compact",
  className = "",
  onFocus,
  onBlur
}: NumericControlProps) {
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const helperId = `${baseId}-helper`;
  const resolvedState: NumericControlState = readOnly ? "read-only" : error ? "invalid" : state;
  const nextHelper = error ?? helper ?? "";

  const describedBy = [helper || error ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const currentValue = useMemo(() => normalizeNumericInput(value), [value]);

  return (
    <div className={`numeric-control numeric-control--${density} ${className}`.trim()} data-state={resolvedState}>
      <div className="numeric-control__header">
        <label className="numeric-control__label" htmlFor={baseId}>
          {label}
        </label>
        {status ? <span className="numeric-control__status">{status}</span> : null}
      </div>
      <div className="numeric-control__body">
        <button
          aria-label={`${label} decrease`}
          className="numeric-control__stepper focus-ring"
          disabled={disabled || readOnly}
          type="button"
          onClick={() => onChange(stepNumericInput(currentValue, -step, { decimals, fallback, min, max }))}
        >
          -
        </button>
        <label className="numeric-control__field">
          <input
            id={baseId}
            aria-describedby={describedBy}
            aria-invalid={resolvedState === "invalid" ? "true" : undefined}
            autoComplete="off"
            className="numeric-control__input focus-ring"
            inputMode={inputMode}
            pattern="[0-9]*[.,]?[0-9]*"
            readOnly={readOnly}
            type="text"
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
          />
          <span className="numeric-control__unit">{unit}</span>
        </label>
        <button
          aria-label={`${label} increase`}
          className="numeric-control__stepper focus-ring"
          disabled={disabled || readOnly}
          type="button"
          onClick={() => onChange(stepNumericInput(currentValue, step, { decimals, fallback, min, max }))}
        >
          +
        </button>
      </div>
      <div className="numeric-control__footer">
        <span id={helperId} className={`numeric-control__message ${error ? "numeric-control__message--error" : ""}`.trim()}>
          {nextHelper}
        </span>
        <span className="numeric-control__hint" aria-hidden="true">
          {formatNumericInput(parseNumericInput(value, { allowBlank: true }).value ?? null, decimals)}
        </span>
      </div>
      {error ? (
        <span id={errorId} className="sr-only">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export interface RirControlProps {
  locale: SupportedLocale;
  value: number | null;
  onChange: (value: number) => void;
  state?: NumericControlState;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  helper?: string;
}

export function RirControl({
  locale,
  value,
  onChange,
  state = "default",
  readOnly = false,
  disabled = false,
  className = "",
  helper
}: RirControlProps) {
  const labelId = useId();
  const resolvedState: NumericControlState = readOnly ? "read-only" : state;
  const copy = getNumericCopy(locale);
  const nextHelper = helper ?? "";

  return (
    <div className={`numeric-rir ${className}`.trim()} data-state={resolvedState}>
      <div className="numeric-control__header">
        <label className="numeric-control__label" id={labelId}>
          RIR
        </label>
        <span className="numeric-control__status">{stateLabel(locale, resolvedState) || copy.saved}</span>
      </div>
      <div className="numeric-rir__options" role="radiogroup" aria-labelledby={labelId}>
        {RIR_VALUES.map((optionValue) => {
          const optionCopy = getRirOptionCopy(locale, optionValue);
          const selected = value === optionValue;
          return (
            <button
              key={optionValue}
              aria-pressed={selected}
              className="numeric-rir__option focus-ring"
              data-selected={selected ? "true" : "false"}
              disabled={disabled || readOnly}
              type="button"
              onClick={() => onChange(optionValue)}
            >
              <span className="numeric-rir__value">{optionCopy.label}</span>
              <span className="numeric-rir__label">{optionCopy.description}</span>
            </button>
          );
        })}
      </div>
      <div className="numeric-control__footer">
        <span className="numeric-control__message">{nextHelper}</span>
      </div>
    </div>
  );
}

export interface IntensitySliderProps {
  locale: SupportedLocale;
  value: number | null;
  onChange: (value: number) => void;
  state?: NumericControlState;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  helper?: string;
}

export function IntensitySlider({
  locale,
  value,
  onChange,
  state = "default",
  readOnly = false,
  disabled = false,
  className = "",
  helper
}: IntensitySliderProps) {
  const labelId = useId();
  const resolvedState: NumericControlState = readOnly ? "read-only" : state;

  return (
    <div className={`numeric-intensity-slider ${className}`.trim()} data-state={resolvedState}>
      <div className="numeric-control__header">
        <label className="numeric-control__label" id={labelId}>
          RPE
        </label>
        <span className="numeric-control__status">{stateLabel(locale, resolvedState)}</span>
      </div>
      <label className="numeric-intensity-slider__track" aria-labelledby={labelId}>
        <span className="numeric-intensity-slider__value" aria-hidden="true">
          {value ?? "—"}
        </span>
        <input
          aria-valuetext={value ? `RPE ${value}` : undefined}
          className="numeric-intensity-slider__input focus-ring"
          disabled={disabled || readOnly}
          max={10}
          min={6}
          step={1}
          type="range"
          value={value ?? 8}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
      <div className="numeric-control__footer">
        <span className="numeric-control__message">{helper ?? getRpeLabel(locale, (value ?? 8) as (typeof RPE_VALUES)[number])}</span>
      </div>
      <div className="numeric-intensity-slider__ticks" aria-hidden="true">
        {RPE_VALUES.map((tick) => (
          <span key={tick} className={`numeric-intensity-slider__tick ${value === tick ? "is-active" : ""}`.trim()}>
            {getRpeLabel(locale, tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
