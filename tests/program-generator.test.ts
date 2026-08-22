import assert from "node:assert/strict";
import test from "node:test";

import type { Exercise } from "../src/hooks/useExercises.ts";
import { generateWorkoutProgram } from "../src/lib/programGenerator.ts";

const patterns = [
  "squat",
  "hinge",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "lunge",
  "isolation",
] as const;

const exercises = patterns.flatMap((movementPattern, patternIndex) =>
  Array.from({ length: 3 }, (_, index) => ({
    aliases: [],
    created_at: "2026-08-21T00:00:00.000Z",
    equipment: index === 0 ? "barbell" : "dumbbell",
    id: `${movementPattern}-${index}`,
    instructions: null,
    is_archived: false,
    is_unilateral: false,
    movement_pattern: movementPattern,
    muscle_group: "Test",
    name: `Exercise ${patternIndex}-${index}`,
    owner_id: null,
    secondary_muscles: [],
  })),
) satisfies Exercise[];

test("generates the requested number of editable templates", () => {
  const program = generateWorkoutProgram(
    exercises,
    4,
    ["strength"],
    "powerlifting",
  );

  assert.equal(program.length, 4);
  assert.equal(program[0].name, "Fortomnia Upper A");
  assert.ok(program.every((template) => template.exercises.length >= 4));
  assert.ok(program.every((template) =>
    template.exercises.every((exercise) => exercise.targetSets === 4 || exercise.targetSets === 3),
  ));
});

test("uses different matching exercises across repeated patterns", () => {
  const program = generateWorkoutProgram(
    exercises,
    3,
    ["muscle"],
    "bodybuilding",
  );
  const squatIds = program
    .flatMap((template) => template.exercises)
    .filter((exercise) => exercise.explanation.includes("squat"))
    .map((exercise) => exercise.exerciseId);

  assert.equal(new Set(squatIds).size, squatIds.length);
});

test("rejects unsupported schedules and insufficient libraries", () => {
  assert.throws(
    () => generateWorkoutProgram(exercises, 1, ["strength"], "mixed"),
    /between 2 and 5/,
  );
  assert.throws(
    () => generateWorkoutProgram(exercises.slice(0, 3), 3, ["strength"], "mixed"),
    /four exercises matching your equipment/,
  );
});

test("filters generated programs to selected equipment", () => {
  const program = generateWorkoutProgram(
    exercises,
    3,
    ["general_fitness"],
    "mixed",
    ["dumbbell"],
  );

  const selectedIds = program.flatMap((template) =>
    template.exercises.map((exercise) => exercise.exerciseId),
  );
  assert.ok(selectedIds.every((id) => {
    const exercise = exercises.find((item) => item.id === id);
    return exercise?.equipment === "barbell" ? false : true;
  }));
});
