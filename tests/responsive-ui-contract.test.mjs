import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readRepoFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

test("responsive UI contract is documented with the required viewport and QA rules", async () => {
  const contract = await readRepoFile("docs/RESPONSIVE_UI_CONTRACT.md");

  assert.match(contract, /375px/);
  assert.match(contract, /390px/);
  assert.match(contract, /430px/);
  assert.match(contract, /768px/);
  assert.match(contract, /sticky CTA/i);
  assert.match(contract, /no horizontal overflow/i);
  assert.match(contract, /pnpm build/i);
});

test("workout responsive shell keeps the browser scroll and sticky CTA contract in source", async () => {
  const css = await readRepoFile("app/globals.css");
  const workoutPage = await readRepoFile("app/workout/[sessionId]/exercise/[exerciseId]/page.tsx");
  const workoutOverview = await readRepoFile("app/workout/[sessionId]/page.tsx");
  const workoutData = await readRepoFile("lib/workout-data.ts");
  const numericControls = await readRepoFile("components/numeric-controls.tsx");

  assert.match(css, /\.screen > main \{/);
  assert.match(css, /overflow-y: auto;/);
  assert.match(css, /\.sticky-action--hidden \{/);
  assert.match(css, /\.workout-active-shell \{/);
  assert.match(css, /padding-bottom: calc\(224px \+ var\(--safe-bottom\)\);/);
  assert.match(css, /\.card\.workout-set-row--editing \{/);
  assert.match(css, /display: grid;/);
  assert.match(css, /background: transparent;/);

  assert.match(workoutPage, /stickyActionHidden/);
  assert.match(workoutPage, /requestAnimationFrame/);
  assert.match(workoutPage, /getExerciseProgressionTarget/);
  assert.match(workoutPage, /workout-set-row--editing/);
  assert.match(workoutPage, /previewExerciseBody/);
  assert.match(workoutOverview, /resumeSession/);

  assert.match(workoutData, /localizedProgressionTargets/);
  assert.match(workoutData, /getExerciseProgressionTarget/);
  assert.match(workoutData, /Keep the same steps with cleaner control\./);
  assert.match(workoutData, /Hold the same steps with cleaner control\./);

  assert.match(numericControls, /const nextHelper = error \?\? helper \?\? "";?/);
  assert.match(numericControls, /const nextHelper = helper \?\? "";?/);
});
