import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultMetricUnit,
  formatMetricValue,
  getExerciseMetricDefaults,
} from "../src/lib/performanceMetrics.ts";

test("chooses safe default units for new metrics", () => {
  assert.equal(defaultMetricUnit("distance"), "meters");
  assert.equal(defaultMetricUnit("calories"), "calories");
  assert.equal(defaultMetricUnit("rounds"), "rounds");
  assert.equal(defaultMetricUnit("reps"), null);
});

test("formats distance, calorie, and round performance", () => {
  assert.equal(formatMetricValue("distance", 500, "meters"), "500 m");
  assert.equal(formatMetricValue("distance", 3.1, "miles"), "3.1 mi");
  assert.equal(formatMetricValue("calories", 20, "calories"), "20 cal");
  assert.equal(formatMetricValue("rounds", 5, "rounds"), "5 rounds");
});


test("selects distance defaults for locomotion and carries", () => {
  assert.deepEqual(
    getExerciseMetricDefaults({
      equipment: null,
      movement_pattern: "conditioning",
      name: "Outdoor Run",
    }),
    {
      explanation: "Locomotion work defaults to distance so progress stays comparable.",
      performanceType: "distance",
      targetDurationSeconds: null,
      targetMetricUnit: "meters",
      targetMetricValue: 400,
    },
  );

  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Dumbbells",
      movement_pattern: "carry",
      name: "Farmer Carry",
    }).performanceType,
    "distance",
  );
});

test("selects calories, time, rounds, and reps by exercise context", () => {
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Rower",
      movement_pattern: "conditioning",
      name: "Rowing Machine",
    }).performanceType,
    "calories",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Bodyweight",
      movement_pattern: "other",
      name: "Plank Hold",
    }).performanceType,
    "time",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: null,
      movement_pattern: "conditioning",
      name: "Bodyweight AMRAP",
    }).performanceType,
    "rounds",
  );
  assert.equal(
    getExerciseMetricDefaults({
      equipment: "Barbell",
      movement_pattern: "squat",
      name: "Back Squat",
    }).performanceType,
    "reps",
  );
});
