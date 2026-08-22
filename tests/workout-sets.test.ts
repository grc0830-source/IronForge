import assert from "node:assert/strict";
import test from "node:test";

import type { LoggedSet } from "../src/hooks/useWorkoutSession.ts";
import {
  formatSetPerformance,
  groupWorkoutSets,
  orderExerciseSets,
} from "../src/lib/workoutSets.ts";

function set(
  id: string,
  exerciseId: string,
  exerciseName: string,
  setNumber: number,
): LoggedSet {
  return {
    duration_seconds: null,
    exercise_id: exerciseId,
    exercise_name: exerciseName,
    id,
    parent_set_id: null,
    performance_type: "reps",
    reps: 8,
    reps_in_reserve: 2,
    set_number: setNumber,
    set_type: "working",
    set_variant: "standard",
    weight: 100,
    weight_unit: "lb",
  };
}

test("groups interleaved workout sets by exercise", () => {
  const groups = groupWorkoutSets([
    set("bench-1", "bench", "Bench Press", 1),
    set("row-1", "row", "Barbell Row", 2),
    set("bench-2", "bench", "Bench Press", 3),
  ]);

  assert.deepEqual(
    groups.map((group) => ({
      exerciseId: group.exerciseId,
      setIds: group.sets.map((item) => item.id),
    })),
    [
      { exerciseId: "bench", setIds: ["bench-1", "bench-2"] },
      { exerciseId: "row", setIds: ["row-1"] },
    ],
  );
});

test("uses workout-plan order and keeps unplanned exercises afterward", () => {
  const groups = groupWorkoutSets(
    [
      set("curl-1", "curl", "Curl", 3),
      set("bench-2", "bench", "Bench Press", 2),
      set("row-1", "row", "Barbell Row", 1),
      set("bench-1", "bench", "Bench Press", 1),
    ],
    ["bench", "row"],
  );

  assert.deepEqual(
    groups.map((group) => group.exerciseId),
    ["bench", "row", "curl"],
  );
  assert.deepEqual(
    groups[0]?.sets.map((item) => item.id),
    ["bench-1", "bench-2"],
  );
});

test("does not mutate the source set order", () => {
  const sets = [
    set("bench-2", "bench", "Bench Press", 2),
    set("bench-1", "bench", "Bench Press", 1),
  ];

  groupWorkoutSets(sets);

  assert.deepEqual(
    sets.map((item) => item.id),
    ["bench-2", "bench-1"],
  );
});

test("formats time-based performance in minutes and seconds", () => {
  const timedSet: LoggedSet = {
    ...set("plank-1", "plank", "Plank", 1),
    duration_seconds: 95,
    performance_type: "time",
    reps: 1,
    weight: 0,
  };

  assert.equal(formatSetPerformance(timedSet), "1m 35s");
});

test("includes load when formatting a weighted timed set", () => {
  const timedSet: LoggedSet = {
    ...set("carry-1", "carry", "Farmer Carry", 1),
    duration_seconds: 45,
    performance_type: "time",
    reps: 1,
    weight: 70,
  };

  assert.equal(formatSetPerformance(timedSet), "70 lb × 45s");
});

test("places drop sets directly after their parent set", () => {
  const first = set("bench-1", "bench", "Bench Press", 1);
  const second = set("bench-2", "bench", "Bench Press", 2);
  const drop: LoggedSet = {
    ...set("bench-drop", "bench", "Bench Press", 3),
    parent_set_id: first.id,
    set_variant: "drop",
    weight: 80,
  };

  assert.deepEqual(
    orderExerciseSets([first, second, drop]).map((item) => item.id),
    ["bench-1", "bench-drop", "bench-2"],
  );
});
