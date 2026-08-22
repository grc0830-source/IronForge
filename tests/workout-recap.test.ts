import assert from "node:assert/strict";
import test from "node:test";

import { buildWorkoutRecap } from "../src/lib/workoutRecap.ts";

const recommendation = {
  durationSeconds: null,
  explanation: "Progress.",
  metricUnit: null,
  metricValue: null,
  performanceType: "reps" as const,
  reps: 8,
  strategy: "progress" as const,
  targetText: "100 lb × 8 reps",
  weight: 100,
};

function set(overrides: Record<string, unknown> = {}) {
  return {
    duration_seconds: null,
    exercise_id: "squat",
    exercise_name: "Squat",
    id: crypto.randomUUID(),
    metric_unit: null,
    metric_value: null,
    parent_set_id: null,
    performance_type: "reps" as const,
    reps: 8,
    reps_in_reserve: 2,
    set_number: 1,
    set_type: "working" as const,
    set_variant: "standard" as const,
    weight: 100,
    weight_unit: "lb" as const,
    ...overrides,
  };
}

test("summarizes met, exceeded, and missed working sets", () => {
  const recap = buildWorkoutRecap(
    [
      set(),
      set({ reps: 9 }),
      set({ reps: 7 }),
      set({ set_type: "warmup" }),
      set({ set_variant: "drop" }),
    ],
    { squat: recommendation },
  );

  assert.equal(recap.workingSets, 3);
  assert.equal(recap.evaluatedSets, 3);
  assert.equal(recap.met, 1);
  assert.equal(recap.exceeded, 1);
  assert.equal(recap.missed, 1);
  assert.equal(recap.exercisesTrained, 1);
});

test("calls out recovery-adjusted sessions", () => {
  const recap = buildWorkoutRecap(
    [set()],
    { squat: { ...recommendation, strategy: "hold" } },
  );

  assert.match(recap.nextDirection, /Recovery shaped/);
});
