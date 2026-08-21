"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/screen";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useProgramStore } from "@/components/program-provider";
import { useProgressStore } from "@/components/progress-provider";
import { useLocale } from "@/components/locale-provider";
import { ProgressImmersionCard } from "@/components/progress-immersion-card";
import { ProgramChangeProposalPanel } from "@/components/program-change-proposal-panel";
import type { AthleteFeedback } from "@/lib/progress-data";
import { buildPhaseAchievementImmersion } from "@/lib/motivational-immersion";

function copyFor(locale: string) {
  return (
    {
      en: {
        closeScreen: "Close screen",
        phaseReview: "PHASE REVIEW",
        comparePhotos: "COMPARE PHOTOS",
        outcome: "OUTCOME",
        startNow: "Start -> Now",
        trainingAdherence: "TRAINING ADHERENCE",
        visualProgress: "Visual Progress",
        strengthGains: "Strength Gains",
        insights: "ATHLEXFORCE INSIGHTS",
        insightBody: "Your current training structure is working well. Recovery, especially sleep, is the clearest opportunity for improvement moving into Phase 2.",
        whatWorked: "WHAT WORKED",
        whatHeldBack: "WHAT HELD YOU BACK",
        athleteFeedback: "ATHLETE FEEDBACK",
        goalPriority: "GOAL / PRIORITY CONFIRMATION",
        keepMainGoal: "KEEP MAIN GOAL",
        adjustGoal: "ADJUST GOAL",
        keepPriorities: "KEEP PRIORITIES",
        edit: "EDIT",
        recommendedNextPhase: "RECOMMENDED NEXT PHASE",
        buildPhase2: "BUILD PHASE 2",
        back: "BACK",
        week1: "WEEK 1",
        week8: "WEEK 8",
        veryGood: "Very Good",
        good: "Good",
        mixed: "Mixed",
        tooHard: "Too Hard",
        tooEasy: "Too Easy",
        notSure: "Not Sure",
        phaseBase: "W1 Base",
        phaseMid: "W4 Mid",
        phaseNow: "W8 Now",
        phaseOne: "Phase 1",
        weekOneOfEight: "Week 1 of 8"
      },
      es: {
        closeScreen: "Cerrar pantalla",
        phaseReview: "REVISIÓN DE FASE",
        comparePhotos: "COMPARAR FOTOS",
        outcome: "RESULTADO",
        startNow: "Inicio -> Ahora",
        trainingAdherence: "ADHERENCIA AL ENTRENAMIENTO",
        visualProgress: "Progreso visual",
        strengthGains: "Mejoras de fuerza",
        insights: "INSIGHTS DE ATHLEXFORCE",
        insightBody: "Tu estructura de entrenamiento actual funciona bien. La recuperación, especialmente el sueño, es la oportunidad más clara de mejora de cara a la Fase 2.",
        whatWorked: "QUÉ FUNCIONÓ",
        whatHeldBack: "QUÉ TE FRENÓ",
        athleteFeedback: "RETROALIMENTACIÓN DEL ATLETA",
        goalPriority: "CONFIRMACIÓN DE OBJETIVO / PRIORIDAD",
        keepMainGoal: "MANTENER OBJETIVO",
        adjustGoal: "AJUSTAR OBJETIVO",
        keepPriorities: "MANTENER PRIORIDADES",
        edit: "EDITAR",
        recommendedNextPhase: "SIGUIENTE FASE RECOMENDADA",
        buildPhase2: "CONSTRUIR FASE 2",
        back: "ATRÁS",
        week1: "SEMANA 1",
        week8: "SEMANA 8",
        veryGood: "Muy bien",
        good: "Bien",
        mixed: "Mixto",
        tooHard: "Demasiado duro",
        tooEasy: "Demasiado fácil",
        notSure: "No estoy seguro",
        phaseBase: "S1 Base",
        phaseMid: "S4 Media",
        phaseNow: "S8 Ahora",
        phaseOne: "Fase 1",
        weekOneOfEight: "Semana 1 de 8"
      },
      ca: {
        closeScreen: "Tanca la pantalla",
        phaseReview: "REVISIÓ DE FASE",
        comparePhotos: "COMPARA FOTOS",
        outcome: "RESULTAT",
        startNow: "Inici -> Ara",
        trainingAdherence: "ADHERÈNCIA A L'ENTRENAMENT",
        visualProgress: "Progrés visual",
        strengthGains: "Guanys de força",
        insights: "INSIGHTS D'ATHLEXFORCE",
        insightBody: "La teva estructura d'entrenament actual està funcionant bé. La recuperació, especialment el son, és l'oportunitat més clara de millora per a la Fase 2.",
        whatWorked: "QUÈ HA FUNCIONAT",
        whatHeldBack: "QUÈ T'HA FRENET",
        athleteFeedback: "RETROACCIÓ DE L'ATLETA",
        goalPriority: "CONFIRMACIÓ D'OBJECTIU / PRIORITAT",
        keepMainGoal: "MANTÉ L'OBJECTIU",
        adjustGoal: "AJUSTA L'OBJECTIU",
        keepPriorities: "MANTÉ PRIORITATS",
        edit: "EDITA",
        recommendedNextPhase: "SEGÜENT FASE RECOMANADA",
        buildPhase2: "CONSTRUEIX FASE 2",
        back: "ENRERE",
        week1: "SETMANA 1",
        week8: "SETMANA 8",
        veryGood: "Molt bé",
        good: "Bé",
        mixed: "Mixt",
        tooHard: "Massa dur",
        tooEasy: "Massa fàcil",
        notSure: "No ho sé",
        phaseBase: "S1 Base",
        phaseMid: "S4 Mitja",
        phaseNow: "S8 Ara",
        phaseOne: "Fase 1",
        weekOneOfEight: "Setmana 1 de 8"
      },
      de: {
        closeScreen: "Bildschirm schließen",
        phaseReview: "PHASENRÜCKBLICK",
        comparePhotos: "FOTOS VERGLEICHEN",
        outcome: "ERGEBNIS",
        startNow: "Start -> Jetzt",
        trainingAdherence: "TRAININGSADHÄRENZ",
        visualProgress: "Visueller Fortschritt",
        strengthGains: "Kraftzuwächse",
        insights: "ATHLEXFORCE EINBLICKE",
        insightBody: "Deine aktuelle Trainingsstruktur funktioniert gut. Die Erholung, insbesondere der Schlaf, ist die klarste Chance zur Verbesserung für Phase 2.",
        whatWorked: "WAS FUNKTIONIERT HAT",
        whatHeldBack: "WAS DICH GEBREMST HAT",
        athleteFeedback: "ATHLETENFEEDBACK",
        goalPriority: "ZIEL- / PRIORITÄTSBESTÄTIGUNG",
        keepMainGoal: "HAUPTZIEL BEIBEHALTEN",
        adjustGoal: "ZIEL ANPASSEN",
        keepPriorities: "PRIORITÄTEN BEIBEHALTEN",
        edit: "BEARBEITEN",
        recommendedNextPhase: "EMPFOHLENE NÄCHSTE PHASE",
        buildPhase2: "PHASE 2 AUFBAUEN",
        back: "ZURÜCK",
        week1: "WOCHE 1",
        week8: "WOCHE 8",
        veryGood: "Sehr gut",
        good: "Gut",
        mixed: "Gemischt",
        tooHard: "Zu hart",
        tooEasy: "Zu leicht",
        notSure: "Nicht sicher",
        phaseBase: "W1 Basis",
        phaseMid: "W4 Mitte",
        phaseNow: "W8 Jetzt",
        phaseOne: "Phase 1",
        weekOneOfEight: "Woche 1 von 8"
      }
    }[locale as "en" | "es" | "ca" | "de"] ?? {
      closeScreen: "Close screen",
      phaseReview: "PHASE REVIEW",
      comparePhotos: "COMPARE PHOTOS",
      outcome: "OUTCOME",
      startNow: "Start -> Now",
      trainingAdherence: "TRAINING ADHERENCE",
      visualProgress: "Visual Progress",
      strengthGains: "Strength Gains",
      insights: "ATHLEXFORCE INSIGHTS",
      insightBody: "Your current training structure is working well. Recovery, especially sleep, is the clearest opportunity for improvement moving into Phase 2.",
      whatWorked: "WHAT WORKED",
      whatHeldBack: "WHAT HELD YOU BACK",
      athleteFeedback: "ATHLETE FEEDBACK",
      goalPriority: "GOAL / PRIORITY CONFIRMATION",
      keepMainGoal: "KEEP MAIN GOAL",
      adjustGoal: "ADJUST GOAL",
      keepPriorities: "KEEP PRIORITIES",
      edit: "EDIT",
      recommendedNextPhase: "RECOMMENDED NEXT PHASE",
      buildPhase2: "BUILD PHASE 2",
      back: "BACK",
      week1: "WEEK 1",
      week8: "WEEK 8",
      veryGood: "Very Good",
      good: "Good",
      mixed: "Mixed",
      tooHard: "Too Hard",
      tooEasy: "Too Easy",
      notSure: "Not Sure",
      phaseBase: "W1 Base",
      phaseMid: "W4 Mid",
      phaseNow: "W8 Now",
      phaseOne: "Phase 1",
      weekOneOfEight: "Week 1 of 8"
    }
  );
}

const feedbackOptions: AthleteFeedback[] = ["Very Good", "Good", "Mixed", "Too Hard", "Too Easy", "Not Sure"];

function PhaseTopbar() {
  const { locale } = useLocale();
  const copy = copyFor(locale);

  return (
    <header className="progress-review-topbar">
      <Link href="/progress" className="progress-review-topbar__button focus-ring" aria-label={copy.closeScreen}>
        <span className="icon" aria-hidden="true">
          close
        </span>
      </Link>
      <BrandLogo variant="mark" width={34} alt="AthlexForce" />
      <span className="progress-review-topbar__label">{copy.phaseReview}</span>
    </header>
  );
}

function ChoiceChip({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={`progress-choice-chip ${active ? "active" : ""}`.trim()} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function PhotoCompareCard({ image, label, accent = false }: { image: string; label: string; accent?: boolean }) {
  return (
    <div className={`progress-review-photo ${accent ? "accent" : ""}`.trim()}>
      <img alt={label} className="progress-review-photo__image" src={image} />
      <span className="progress-review-photo__label">{label}</span>
    </div>
  );
}

function CoachRecommendationPanel({ contextKey }: { contextKey: string }) {
  return <ProgramChangeProposalPanel contextKey={contextKey} contextType="phase_review" />;
}

export function ProgressPhaseReviewScreen() {
  const { state, setAthleteFeedback, setGoalDecision, setPriorityDecision } = useProgressStore();
  const { activeProgram } = useProgramStore();
  const { locale } = useLocale();
  const copy = copyFor(locale);
  const review = state.phaseReview;
  const baselineFront = state.photos.checkpoints[0]?.photos.front.image ?? "/progress-photo-front.svg";
  const currentFront = state.photos.checkpoints[1]?.photos.front.image ?? "/progress-photo-front.svg";
  const recommendationContextKey = activeProgram?.id ?? "phase-review";
  const phaseImmersion = buildPhaseAchievementImmersion(locale, {
    phaseLabel: review.recommendation.title,
    phaseComplete: review.status === "NEXT PHASE",
    reviewSummary: review.summary,
    workoutSessionCount: 0
  });

  const localizedFeedback = {
    "Very Good": copy.veryGood,
    Good: copy.good,
    Mixed: copy.mixed,
    "Too Hard": copy.tooHard,
    "Too Easy": copy.tooEasy,
    "Not Sure": copy.notSure
  } as const;

  return (
    <Screen shellClassName="progress-flow-shell" topbar={<PhaseTopbar />}>
      <main className="content tight">
        <section className="section progress-hero">
          <h1 className="headline-lg" style={{ textTransform: "uppercase" }}>
            {review.label}
          </h1>
          <div className="progress-phase-timeline progress-phase-timeline--review">
            <span>{copy.phaseBase}</span>
            <span>{copy.phaseMid}</span>
            <span className="accent">{copy.phaseNow}</span>
          </div>
        </section>

        <section className="section">
          <ProgressImmersionCard
            immersion={phaseImmersion}
            action={
              <Link href="/progress/photos/compare" className="button-secondary focus-ring">
                {copy.comparePhotos}
              </Link>
            }
          />
        </section>

        <section className="section">
          <Card className="progress-review-outcome p-16">
            <div className="row start">
              <div className="eyebrow" style={{ margin: 0 }}>
                {copy.outcome}
              </div>
              <span className="progress-chip progress-chip--accent">{review.outcome}</span>
            </div>
            <p className="body-md" style={{ marginTop: 12, lineHeight: 1.6 }}>
              {review.summary}
            </p>
          </Card>
        </section>

        <section className="section">
          <h2 className="headline-md" style={{ marginBottom: 12 }}>
            {copy.startNow}
          </h2>
          <div className="progress-review-grid">
            {review.startMeasurements.map((item) => (
              <Card key={item.label} className="progress-review-metric p-16">
                <div className="caption">{item.label.toUpperCase()}</div>
                <div className="headline-md" style={{ marginTop: 8 }}>
                  {item.value}
                </div>
                <div className="caption" style={{ marginTop: 8, color: "var(--accent-primary)" }}>
                  {item.delta}
                </div>
              </Card>
            ))}
          </div>
          <Card className="progress-review-adherence p-16" style={{ marginTop: 16 }}>
            <div className="row start" style={{ marginBottom: 10 }}>
              <div className="eyebrow" style={{ margin: 0 }}>
                {copy.trainingAdherence}
              </div>
              <div className="headline-md" style={{ color: "var(--accent-primary)" }}>
                90%
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "90%" }} />
            </div>
          </Card>
        </section>

        <section className="section">
          <h2 className="headline-md" style={{ marginBottom: 12 }}>
            {copy.visualProgress}
          </h2>
          <div className="progress-review-photos">
            <PhotoCompareCard accent image={baselineFront} label={copy.week1} />
            <PhotoCompareCard accent image={currentFront} label={copy.week8} />
          </div>
          <Link className="progress-mini-action progress-mini-action--block focus-ring" href="/progress/photos/compare" style={{ marginTop: 12 }}>
            {copy.comparePhotos}
          </Link>
        </section>

        <section className="section">
          <h2 className="headline-md" style={{ marginBottom: 12 }}>
            {copy.strengthGains}
          </h2>
          <div className="stack">
            {[
              { label: "Hip Thrust", value: "95 kg", delta: "+18.7%" },
              { label: "RDL", value: "80 kg", delta: "+25.0%" }
            ].map((item) => (
              <Card key={item.label} className="progress-review-strength p-16">
                <div className="row start">
                  <div className="row start" style={{ gap: 12 }}>
                    <div className="progress-strength-card__icon" aria-hidden="true">
                      <span className="icon">fitness_center</span>
                    </div>
                    <div className="body-md" style={{ fontWeight: 700 }}>
                      {item.label}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="body-lg">
                      {item.value.split(" ")[0]} <span className="caption">{item.value.split(" ")[1]}</span>
                    </div>
                    <div className="caption" style={{ color: "var(--accent-primary)" }}>
                      {item.delta}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="section">
          <Card className="progress-insight-card p-16">
            <div className="row start" style={{ marginBottom: 8 }}>
              <span className="icon filled accent" aria-hidden="true">
                smart_toy
              </span>
              <h3 className="eyebrow" style={{ margin: 0, color: "var(--accent-primary)" }}>
                {copy.insights}
              </h3>
            </div>
            <p className="body-md" style={{ fontStyle: "italic", lineHeight: 1.6 }}>
              {copy.insightBody}
            </p>
          </Card>
        </section>

        <section className="section">
          <div className="stack">
            <Card className="progress-review-list p-16">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {copy.whatWorked}
              </div>
              <ul className="progress-dialog-list">
                {review.whatWorked.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card className="progress-review-list p-16">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {copy.whatHeldBack}
              </div>
              <ul className="progress-dialog-list">
                {review.whatHeldBack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {copy.athleteFeedback}
          </div>
          <div className="progress-choice-row">
            {feedbackOptions.map((feedback) => (
              <ChoiceChip key={feedback} active={review.athleteFeedback[0].value === feedback} onClick={() => setAthleteFeedback(feedback)}>
                {localizedFeedback[feedback]}
              </ChoiceChip>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="stack">
            <Card className="progress-review-list p-16">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                {copy.goalPriority}
              </div>
              <div className="progress-choice-row">
                <ChoiceChip active={review.mainGoalDecision.current === "KEEP"} onClick={() => setGoalDecision("KEEP")}>
                  {copy.keepMainGoal}
                </ChoiceChip>
                <ChoiceChip active={review.mainGoalDecision.current === "ADJUST"} onClick={() => setGoalDecision("ADJUST")}>
                  {copy.adjustGoal}
                </ChoiceChip>
              </div>
              <div className="progress-choice-row" style={{ marginTop: 10 }}>
                <ChoiceChip active={review.priorityDecision.current === "KEEP"} onClick={() => setPriorityDecision("KEEP")}>
                  {copy.keepPriorities}
                </ChoiceChip>
                <ChoiceChip active={review.priorityDecision.current === "ADJUST"} onClick={() => setPriorityDecision("ADJUST")}>
                  {copy.edit}
                </ChoiceChip>
              </div>
            </Card>
            <Card className="progress-review-list p-16">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {copy.recommendedNextPhase}
              </div>
              <div className="headline-md" style={{ textTransform: "uppercase" }}>
                {review.recommendation.title} — {review.recommendation.duration}
              </div>
              <p className="body-md" style={{ marginTop: 8 }}>
                {review.recommendation.summary}
              </p>
              <ul className="progress-dialog-list" style={{ marginTop: 12 }}>
                {review.recommendation.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="section">
          <CoachRecommendationPanel contextKey={recommendationContextKey} />
        </section>
      </main>

      <div className="progress-fixed-actions">
        <PrimaryButton href="/progress" className="focus-ring">
          {copy.buildPhase2}
        </PrimaryButton>
        <SecondaryButton className="focus-ring" onClick={() => window.history.back()}>
          {copy.back}
        </SecondaryButton>
      </div>
    </Screen>
  );
}
