import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import * as ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libDir = path.join(repoRoot, "lib");
const tempDir = await mkdtemp(path.join(tmpdir(), "coachx-media-tests-"));

function rewriteAliasImport(specifier, currentOutputPath) {
  const currentDir = path.dirname(currentOutputPath);
  const relativeSourcePath = specifier.slice("@/lib/".length);
  const targetPath = path.join(tempDir, `${relativeSourcePath}.mjs`);
  const relativePath = path.relative(currentDir, targetPath).replaceAll(path.sep, "/").replace(/\.mjs$/, "");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

async function transpileLibraryChain() {
  const sourceFiles = ["media/types.ts", "media/exercise-media.ts", "media/meal-media.ts", "media/index.ts"];

  for (const fileName of sourceFiles) {
    const sourcePath = path.join(libDir, fileName);
    const sourceText = await readFile(sourcePath, "utf8");
    const outputPath = path.join(tempDir, fileName.replace(/\.ts$/, ".mjs"));
    const rewrittenSource = sourceText.replace(/from\s+["'](@\/lib\/[^"']+)["']/g, (_, specifier) => `from "${rewriteAliasImport(specifier, outputPath)}"`);

    const transpiled = ts.transpileModule(rewrittenSource, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.Preserve,
        esModuleInterop: true
      },
      fileName
    }).outputText;

    const outputText = transpiled
      .replace(/from "((?:\.{1,2}\/)[^"]+)"/g, (_, specifier) => `from "${specifier.endsWith(".mjs") ? specifier : `${specifier}.mjs`}"`)
      .replace(/from '((?:\.{1,2}\/)[^']+)'/g, (_, specifier) => `from '${specifier.endsWith(".mjs") ? specifier : `${specifier}.mjs`}'`);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, outputText, "utf8");
  }

  return import(pathToFileURL(path.join(tempDir, "media/index.mjs")).href);
}

const media = await transpileLibraryChain();

test("known exercise key resolves the approved family", () => {
  const resolved = media.resolveExerciseHeroMedia({
    exerciseKey: "barbell-hip-thrust",
    exerciseName: "Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell"
  });

  assert.equal(resolved.state, "mapped");
  assert.ok(resolved.asset?.src.includes("hip_thrust"));
});

test("unknown exercise resolves to a branded fallback", () => {
  const resolved = media.resolveExerciseThumbnailMedia({
    exerciseKey: "unknown-exercise",
    exerciseName: "Unknown Exercise",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    equipment: "machine"
  });

  assert.equal(resolved.state, "missing");
  assert.equal(resolved.asset, null);
  assert.equal(resolved.fallback.kind, "exercise");
});

test("START and END resolve independently", () => {
  const start = media.resolveExerciseStartMedia({
    exerciseKey: "romanian-deadlift",
    exerciseName: "Romanian Deadlift",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
    equipment: "dumbbells"
  });
  const end = media.resolveExerciseEndMedia({
    exerciseKey: "romanian-deadlift",
    exerciseName: "Romanian Deadlift",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
    equipment: "dumbbells"
  });

  assert.equal(start.state, "mapped");
  assert.equal(end.state, "mapped");
  assert.notStrictEqual(start.variant, end.variant);
  assert.notStrictEqual(start.asset?.objectPosition, end.asset?.objectPosition);
  assert.equal(start.asset?.src, end.asset?.src);
});

test("missing END does not crash and falls back safely", () => {
  const resolved = media.resolveExerciseEndMedia({
    exerciseKey: "not-in-registry",
    exerciseName: "No Asset Exercise",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
    equipment: "cable"
  });

  assert.equal(resolved.state, "missing");
  assert.equal(resolved.asset, null);
});

test("known meal key resolves the approved family", () => {
  const resolved = media.resolveMealHeroMedia({
    mealKey: "eggs-avocado-toast",
    mealName: "Eggs & Avocado Toast",
    macroHint: "450 kcal · 34P / 29C / 21F",
    prepTimeHint: "10 min"
  });

  assert.equal(resolved.state, "mapped");
  assert.ok(resolved.asset?.src.includes("nutrition-breakfast"));
});

test("unknown meal resolves to a branded fallback", () => {
  const resolved = media.resolveMealThumbnailMedia({
    mealKey: "chicken-rice-bowl",
    mealName: "Chicken Rice Bowl",
    macroHint: "650 kcal · 45P / 75C / 18F",
    prepTimeHint: "15 min"
  });

  assert.equal(resolved.state, "missing");
  assert.equal(resolved.asset, null);
  assert.equal(resolved.fallback.kind, "meal");
});

test("localized display names do not affect media resolution", () => {
  const english = media.resolveExerciseThumbnailMedia({
    exerciseKey: "barbell-hip-thrust",
    exerciseName: "Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell"
  });
  const spanish = media.resolveExerciseThumbnailMedia({
    exerciseKey: "barbell-hip-thrust",
    exerciseName: "Empuje de cadera",
    primaryMuscles: ["glúteos"],
    secondaryMuscles: ["isquiotibiales"],
    equipment: "barra"
  });

  assert.equal(english.asset?.src, spanish.asset?.src);
});

test("load-error state can fall back safely", () => {
  const resolved = media.resolveMealHeroMedia({
    mealKey: "eggs-avocado-toast",
    mealName: "Eggs & Avocado Toast",
    macroHint: "450 kcal · 34P / 29C / 21F",
    prepTimeHint: "10 min"
  });

  const errored = media.markMealMediaLoadError(resolved);
  assert.equal(errored.state, "load_error");
  assert.equal(errored.asset, null);
});

test("wrong exercise family is not substituted", () => {
  const resolved = media.resolveExerciseHeroMedia({
    exerciseKey: "romanian-deadlift",
    exerciseName: "Romanian Deadlift",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
    equipment: "dumbbells"
  });

  assert.equal(resolved.asset?.src.includes("romanian_deadlift"), true);
  assert.equal(resolved.asset?.src.includes("hip_thrust"), false);
});

test("resolver is deterministic", () => {
  const one = media.resolveExerciseThumbnailMedia({
    exerciseKey: "barbell-hip-thrust",
    exerciseName: "Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell"
  });
  const two = media.resolveExerciseThumbnailMedia({
    exerciseKey: "barbell-hip-thrust",
    exerciseName: "Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell"
  });

  assert.deepEqual(one, two);
});

await rm(tempDir, { recursive: true, force: true });
