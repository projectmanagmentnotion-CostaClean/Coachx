# AthlexForce Inputs & Intensity Specification (v1.1)

## 1. Numeric Input System
Canonical fields for Weight, Reps, and other athletic metrics.
- **Touch Target**: 44px minimum height.
- **States**:
  - **Default**: bg-#121212, border-white/10.
  - **Focus**: border-#B6FF00, 1px solid ring.
  - **Editing**: Active numeric keyboard entry.
  - **Valid/Settled**: Success state indicator.
  - **Invalid**: border-#FF4D4F, "ENTER A VALID VALUE" helper text.
  - **Saving**: Local inline pulse (220-380ms).
  - **Saved**: Success check/state.
  - **Read-only**: Low-emphasis state for coach prescriptions.

## 2. Stepper Controls
Compact +/- controls for rapid adjustment.
- **Dimensions**: 44px hit area per button.
- **Behavior**: Single tap for increments; long-press for rapid scroll (accelerated).
- **Editable Center**: Tapping the value opens the native numeric keyboard.

## 3. Effort & Intensity (RIR/RPE)
Subjective logging of training intensity.
- **RIR (Reps in Reserve)**: Discrete 0-5+ scale.
  - 0: MAX EFFORT
  - 1: VERY HARD
  - 2: HARD
  - 3: CONTROLLED
- **RPE Slider**: Discrete 6-10 scale.
  - **Thumb Size**: 28px visible circle.
  - **Hit Area**: 44px vertical height.
  - **Track**: 4px height.
  - **Snap**: 100-180ms (power3.out).

## 4. Plan vs. Actual Logic
- **Goal**: Maintain data integrity without confusion.
- **Coach-Managed**: Plan is immutable (Read-only). Athlete logs "YOU DID" (Actual).
- **Self-Managed**: Plan is visible for reference; logging "Actual" does NOT automatically overwrite the original prescription.

## 5. Persistence & Feedback
- **Truthful Value**: UI must always reflect the last known successful save.
- **Error/Retry**: If a save fails, show "TRY AGAIN". Do not treat unsaved data as "Truth".

## 6. Mobile & Accessibility
- **Keyboard**: Use native numeric/decimal keyboard ONLY.
- **Reduced Motion**: Swap snaps/slides for 150ms fades and instant value updates.
- **Sizing**: Support 375px, 390px, and 430px widths without clipping or cramped layouts.
