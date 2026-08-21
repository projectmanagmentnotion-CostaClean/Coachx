"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, IconButton, PrimaryButton, Section } from "@/components/ui";
import { Screen } from "@/components/screen";
import { useProgramStore } from "@/components/program-provider";
import { useTranslator } from "@/components/locale-provider";
import { useCurrentLocalDateKey } from "@/components/use-current-local-date-key";

function addMonths(dateKey: string, delta: number) {
  const source = new Date(`${dateKey}T00:00:00Z`);
  const next = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + delta, 1));
  return next.toISOString().slice(0, 10);
}

function formatDateKey(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.length >= 10 ? value.slice(0, 10) : fallback;
}

function formatMonthLabel(dateKey: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateKey}T00:00:00Z`));
}

function dayMarkerLabel(locale: string, day: { completed: boolean; isAdHoc: boolean; hasActivity: boolean }) {
  const copy = {
    en: { completed: "Completed", adhoc: "Ad-hoc", scheduled: "Scheduled", empty: "Empty" },
    es: { completed: "Completado", adhoc: "Extra", scheduled: "Programado", empty: "Vacío" },
    ca: { completed: "Completat", adhoc: "Extra", scheduled: "Programat", empty: "Buit" },
    de: { completed: "Abgeschlossen", adhoc: "Ad-hoc", scheduled: "Geplant", empty: "Leer" }
  }[locale as "en" | "es" | "ca" | "de"] ?? { completed: "Completed", adhoc: "Ad-hoc", scheduled: "Scheduled", empty: "Empty" };

  if (day.completed) {
    return copy.completed;
  }

  if (day.isAdHoc) {
    return copy.adhoc;
  }

  if (day.hasActivity) {
    return copy.scheduled;
  }

  return copy.empty;
}

function CalendarActionSheet({
  mode,
  locale,
  dateKey,
  onClose,
  onConfirm,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  targetDate,
  setTargetDate,
  saving
}: {
  mode: "add" | "move";
  locale: string;
  dateKey: string;
  onClose: () => void;
  onConfirm: () => void;
  templates: Array<{ id: string; name: string; focus: string; estimated_duration_minutes: number }>;
  selectedTemplateId: string;
  setSelectedTemplateId: (value: string) => void;
  targetDate: string;
  setTargetDate: (value: string) => void;
  saving: boolean;
}) {
  const copy = {
    en: { addTitle: "Add workout", moveTitle: "Move workout", addSubtitle: "Choose an existing workout for this day.", moveSubtitle: "Pick a new date for the current workout.", date: "Date", currentTarget: "Current target:", chooseWorkout: "Choose workout", cancel: "Cancel", saving: "Saving...", save: "Save workout", move: "Move workout" },
    es: { addTitle: "Añadir entrenamiento", moveTitle: "Mover entrenamiento", addSubtitle: "Elige un entrenamiento existente para este día.", moveSubtitle: "Elige una nueva fecha para el entrenamiento actual.", date: "Fecha", currentTarget: "Objetivo actual:", chooseWorkout: "Elegir entrenamiento", cancel: "Cancelar", saving: "Guardando...", save: "Guardar entrenamiento", move: "Mover entrenamiento" },
    ca: { addTitle: "Afegeix entrenament", moveTitle: "Mou entrenament", addSubtitle: "Tria un entrenament existent per a aquest dia.", moveSubtitle: "Tria una nova data per a l'entrenament actual.", date: "Data", currentTarget: "Objectiu actual:", chooseWorkout: "Tria entrenament", cancel: "Cancel·la", saving: "Desant...", save: "Desa entrenament", move: "Mou entrenament" },
    de: { addTitle: "Training hinzufügen", moveTitle: "Training verschieben", addSubtitle: "Wähle ein vorhandenes Training für diesen Tag.", moveSubtitle: "Wähle ein neues Datum für das aktuelle Training.", date: "Datum", currentTarget: "Aktuelles Ziel:", chooseWorkout: "Training wählen", cancel: "Abbrechen", saving: "Speichern...", save: "Training speichern", move: "Training verschieben" }
  }[locale as "en" | "es" | "ca" | "de"] ?? { addTitle: "Add workout", moveTitle: "Move workout", addSubtitle: "Choose an existing workout for this day.", moveSubtitle: "Pick a new date for the current workout.", date: "Date", currentTarget: "Current target:", chooseWorkout: "Choose workout", cancel: "Cancel", saving: "Saving...", save: "Save workout", move: "Move workout" };

  const title = mode === "add" ? copy.addTitle : copy.moveTitle;
  const subtitle = mode === "add" ? copy.addSubtitle : copy.moveSubtitle;

  return (
    <div className="app-menu" role="presentation">
      <button aria-label="Close dialog" className="app-menu__backdrop" onClick={onClose} type="button" />
      <aside aria-labelledby="calendar-action-title" aria-modal="true" className="app-menu__sheet" role="dialog" tabIndex={-1}>
        <div className="app-menu__header">
          <div className="app-menu__title-row">
            <div>
              <div className="eyebrow" id="calendar-action-title" style={{ color: "#c6c6c7" }}>
                {title.toUpperCase()}
              </div>
              <p className="caption" style={{ marginTop: 6 }}>
                {subtitle}
              </p>
            </div>
            <button className="tap-target focus-ring app-menu__close" onClick={onClose} type="button" aria-label="Close dialog">
              <span className="icon" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </div>

        <div className="app-menu__section">
          <div className="eyebrow">{copy.date}</div>
          <input className="input-field" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} min="2026-01-01" />
          <div className="caption" style={{ marginTop: 8 }}>
            {copy.currentTarget} {dateKey}
          </div>
        </div>

        {mode === "add" ? (
          <div className="app-menu__section">
            <div className="eyebrow">{copy.chooseWorkout}</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`list-card focus-ring ${selectedTemplateId === template.id ? "selected" : ""}`.trim()}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="body-md" style={{ fontWeight: 700 }}>
                      {template.name}
                    </div>
                    <div className="caption" style={{ marginTop: 4 }}>
                      {template.focus}
                    </div>
                  </div>
                  <span className="pill">{template.estimated_duration_minutes} min</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="app-menu__footer">
          <button className="button-secondary focus-ring" type="button" onClick={onClose}>
            {copy.cancel}
          </button>
          <button className="button-primary focus-ring" type="button" onClick={onConfirm} disabled={saving || (mode === "add" && !selectedTemplateId)}>
            {saving ? copy.saving : mode === "add" ? copy.save : copy.move}
          </button>
        </div>
      </aside>
    </div>
  );
}

function CalendarContent({ todayKey }: { todayKey: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCalendarDays, getDaySummary, monthLabel, selectedDateKey, weekdays, templates, activePhase, scheduleWorkoutOnDate, rescheduleWorkoutDay } = useProgramStore();
  const { t, locale } = useTranslator();
  const summaryDateKey = formatDateKey(searchParams.get("date"), selectedDateKey ?? todayKey);
  const viewMonthKey = formatDateKey(searchParams.get("month"), `${summaryDateKey.slice(0, 7)}-01`);
  const days = getCalendarDays(viewMonthKey, summaryDateKey, todayKey);
  const day = getDaySummary(summaryDateKey);
  const [sheetMode, setSheetMode] = useState<"add" | "move" | null>(null);
  const [targetDate, setTargetDate] = useState(summaryDateKey);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sheetMode) {
      return;
    }

    setTargetDate(summaryDateKey);
    setSelectedTemplateId((current) => current || templates[0]?.id || "");
  }, [sheetMode, summaryDateKey, templates]);

  const monthTitle = useMemo(() => formatMonthLabel(viewMonthKey, locale), [locale, viewMonthKey]);

  const updateCalendarQuery = (nextMonthKey: string, nextDateKey: string) => {
    router.replace(`/calendar?month=${nextMonthKey}&date=${nextDateKey}`);
  };

  const openToday = () => updateCalendarQuery(`${todayKey.slice(0, 7)}-01`, todayKey);

  const openAddSheet = () => {
    setSheetMode("add");
  };

  const openMoveSheet = () => {
    setSheetMode("move");
  };

  const confirmSheet = async () => {
    if (!day || !summaryDateKey) {
      return;
    }

    setSaving(true);
    try {
      if (sheetMode === "add") {
        const template = templates.find((entry) => entry.id === selectedTemplateId) ?? templates[0];
        if (!template || !activePhase) {
          return;
        }

          await scheduleWorkoutOnDate({
            scheduledDate: targetDate,
            workoutTemplateId: template.id,
            plannedDurationMinutes: template.estimated_duration_minutes,
            programPhaseId: activePhase.id,
            origin: "ad-hoc"
          });
        updateCalendarQuery(`${targetDate.slice(0, 7)}-01`, targetDate);
        router.push(`/day/${targetDate}`);
      } else if (sheetMode === "move" && day.scheduledWorkoutId) {
        await rescheduleWorkoutDay(day.scheduledWorkoutId, targetDate);
        updateCalendarQuery(`${targetDate.slice(0, 7)}-01`, targetDate);
        router.push(`/day/${targetDate}`);
      }

      setSheetMode(null);
    } finally {
      setSaving(false);
    }
  };

  if (!day) {
    return null;
  }

  return (
    <>
      <Screen
        activeTab="calendar"
        shellClassName="screen-shell calendar-shell"
        topbar={
          <header className="topbar center">
            <div className="eyebrow" style={{ margin: 0, color: "#c6c6c7" }}>
              {t("calendar.title")}
            </div>
          </header>
        }
      >
        <main className="content tight">
          <section className="calendar-toolbar">
            <div className="calendar-month-row">
              <IconButton icon="chevron_left" label={t("calendar.previousMonth")} onClick={() => updateCalendarQuery(addMonths(viewMonthKey, -1), summaryDateKey)} />
              <h1 className="headline-md" style={{ textTransform: "uppercase", letterSpacing: "0.03em", textAlign: "center" }}>
                {monthLabel ? formatMonthLabel(viewMonthKey, locale) : monthTitle}
              </h1>
              <IconButton icon="chevron_right" label={t("calendar.nextMonth")} onClick={() => updateCalendarQuery(addMonths(viewMonthKey, 1), summaryDateKey)} />
              <button className="button-secondary focus-ring" type="button" onClick={openToday} style={{ minHeight: 36, padding: "0 12px", whiteSpace: "nowrap" }}>
                {t("common.today")}
              </button>
            </div>

            <div className="calendar-weekdays">
              {weekdays.map((weekday) => (
                <div key={weekday} className="calendar-label" style={{ textAlign: "center" }}>
                  {weekday}
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="calendar-grid">
              {days.map((dayCell) => (
                <Link
                  key={dayCell.key}
                  href={`/day/${dayCell.key}`}
                  className={`day-cell focus-ring ${dayCell.isSelected ? "selected" : ""} ${dayCell.isDimmed ? "dimmed" : ""}`.trim()}
                  aria-label={`${dayCell.label} ${dayCell.day} ${dayMarkerLabel(locale, dayCell)}`}
                  aria-current={dayCell.isSelected ? "date" : undefined}
                >
                  <span className="body-md" style={{ color: dayCell.isToday ? "var(--text-primary)" : "inherit" }}>
                    {dayCell.day}
                  </span>
                  {dayCell.completed ? (
                    <span className="day-marker day-marker--completed" aria-hidden="true">
                      check
                    </span>
                  ) : dayCell.isAdHoc ? (
                    <span className="day-marker day-marker--adhoc" aria-hidden="true">
                      edit
                    </span>
                  ) : dayCell.hasActivity ? (
                    <span className="day-dot" aria-hidden="true" />
                  ) : null}
                </Link>
              ))}
            </div>
          </section>

          <Section title="" meta="">
            <Card className="p-16 elevated" style={{ background: "var(--background-charcoal)" }}>
              <div className="row" style={{ marginBottom: 16 }}>
                <div>
                  <div className="headline-md" style={{ fontSize: 14, lineHeight: "20px", textTransform: "uppercase" }}>
                    {day.calendarLabel}
                  </div>
                </div>
                <span className="accent" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 700, textTransform: "uppercase" }}>
                  {day.phase}
                </span>
              </div>

              <div className="row start" style={{ gap: 16 }}>
                <div className="card" style={{ width: 72, height: 120, borderRadius: 12, background: "var(--surface-default)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="headline-md" style={{ marginBottom: 4 }}>
                    {day.workoutTitle}
                  </div>
                  <div className="body-md muted">{day.workoutType}</div>
                  <div className="caption" style={{ marginTop: 4 }}>
                    {day.workoutCount} · {day.duration}
                  </div>
                </div>
              </div>

              <div className="fade-line" style={{ margin: "16px 0" }} />

              <div className="grid-2">
                <div>
                  <div className="row" style={{ justifyContent: "flex-start", gap: 6, marginBottom: 8 }}>
                    <span className="icon muted" style={{ fontSize: 18 }}>
                      restaurant
                    </span>
                    <span className="body-md">{t("calendar.nutrition")}</span>
                  </div>
                  <div className="body-md" style={{ fontWeight: 700 }}>
                    {day.nutritionCalories}
                  </div>
                  <div className="caption" style={{ marginTop: 4 }}>
                    {day.macros}
                  </div>
                </div>
                <div>
                  <div className="row" style={{ justifyContent: "flex-start", gap: 6, marginBottom: 8 }}>
                    <span className="icon muted" style={{ fontSize: 18 }}>
                      favorite
                    </span>
                    <span className="body-md">{t("calendar.cardioHabits")}</span>
                  </div>
                  <div className="body-md">{day.cardio}</div>
                  <div className="caption" style={{ marginTop: 4 }}>
                    {day.habits}
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <button className="button-secondary focus-ring" type="button" onClick={openAddSheet}>
                  {locale === "es" ? "Añadir entrenamiento" : locale === "ca" ? "Afegeix entrenament" : locale === "de" ? "Training hinzufügen" : "Add workout"}
                </button>
                {!day.isRestDay ? (
                  <button className="button-secondary focus-ring" type="button" onClick={openMoveSheet}>
                    {locale === "es" ? "Mover entrenamiento" : locale === "ca" ? "Mou entrenament" : locale === "de" ? "Training verschieben" : "Move workout"}
                  </button>
                ) : null}
              </div>
            </Card>
          </Section>

          <div className="sticky-action">
            <PrimaryButton href={`/day/${day.dateKey}`}>{t("calendar.viewDay")}</PrimaryButton>
          </div>
        </main>
      </Screen>

      {sheetMode ? (
          <CalendarActionSheet
          mode={sheetMode}
          locale={locale}
          dateKey={summaryDateKey}
          onClose={() => setSheetMode(null)}
          onConfirm={confirmSheet}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          targetDate={targetDate}
          setTargetDate={setTargetDate}
          saving={saving}
        />
      ) : null}
    </>
  );
}

export default function CalendarPage() {
  const todayKey = useCurrentLocalDateKey();
  return todayKey ? <CalendarContent todayKey={todayKey} /> : null;
}


