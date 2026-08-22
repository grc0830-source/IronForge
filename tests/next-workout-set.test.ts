import assert from "node:assert/strict";
import test from "node:test";

import type {
  LoggedSet,
  PlannedExercise,
} from "../src/hooks/useWorkoutSession.ts";
import {
  formatExerciseTarget,
  getNextWorkoutSet,
} from "../src/lib/workoutSets.ts";

function planned(
  id: string,
  name: string,
  position: number,
  targetSets = 3,
): PlannedExercise {
  return {
    superset_group: null,
    performance_type: "reps",
    exercise_id: id,
    exercise_name: name,
    id: `plan-${id}`,
    position,
    rep_max: 12,
    rep_min: 8,
    target_duration_seconds: null,
    target_rir: 2,
    target_sets: targetSets,
  };
}

function logged(
  id: string,
  exerciseId: string,
  setNumber: number,
  weight = 100,
): LoggedSet {
  return {
    duration_seconds: null,
    exercise_id: exerciseId,
    exercise_name: exerciseId,
    id,
    parent_set_id: null,
    performance_type: "reps",
    reps: 9,
    reps_in_reserve: 2,
    set_number: setNumber,
    set_type: "working",
    set_variant: "standard",
    weight,
    weight_unit: "lb",
  };
}

test("selects the first unfinished exercise in plan order", () => {
  const result = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("row-1", "row", 1),
      logged("bench-2", "bench", 2),
    ],
    [planned("row", "Row", 2), planned("bench", "Bench", 1)],
  );

  assert.ok(result);
  assert.equal(result.exercise.exercise_id, "bench");
  assert.equal(result.setNumber, 3);
  assert.equal(result.completedSets, 2);
  assert.equal(result.lastSet?.id, "bench-2");
});

test("advances to the next exercise after the target is complete", () => {
  const result = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("bench-2", "bench", 2),
    ],
    [
      planned("bench", "Bench", 1, 2),
      planned("row", "Row", 2, 3),
    ],
  );

  assert.ok(result);
  assert.equal(result.exercise.exercise_id, "row");
  assert.equal(result.setNumber, 1);
  assert.equal(result.lastSet, null);
});

test("returns no action when every planned target is complete", () => {
  const result = getNextWorkoutSet(
    [logged("bench-1", "bench", 1)],
    [planned("bench", "Bench", 1, 1)],
  );

  assert.equal(result, null);
});

test("formats a timed template target", () => {
  const target = {
    ...planned("plank", "Plank", 1),
    performance_type: "time" as const,
    rep_max: 1,
    rep_min: 1,
    target_duration_seconds: 90,
  };

  assert.equal(formatExerciseTarget(target), "3 sets × 1m 30s");
});

test("alternates the next set between superset exercises", () => {
  const bench = {
    ...planned("bench", "Bench", 1, 3),
    superset_group: "bench:row",
  };
  const row = {
    ...planned("row", "Row", 2, 3),
    superset_group: "bench:row",
  };

  const afterBench = getNextWorkoutSet(
    [logged("bench-1", "bench", 1)],
    [bench, row],
  );
  assert.equal(afterBench?.exercise.exercise_id, "row");

  const afterRow = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("row-1", "row", 1),
    ],
    [bench, row],
  );
  assert.equal(afterRow?.exercise.exercise_id, "bench");
  assert.equal(afterRow?.setNumber, 2);
});

test("moves past a completed superset block", () => {
  const bench = {
    ...planned("bench", "Bench", 1, 1),
    superset_group: "bench:row",
  };
  const row = {
    ...planned("row", "Row", 2, 1),
    superset_group: "bench:row",
  };
  const curl = planned("curl", "Curl", 3, 2);

  const result = getNextWorkoutSet(
    [
      logged("bench-1", "bench", 1),
      logged("row-1", "row", 1),
    ],
    [bench, row, curl],
  );

  assert.equal(result?.exercise.exercise_id, "curl");
});

test("drop sets do not complete planned set targets", () => {
  const working = logged("bench-1", "bench", 1);
  const drop = {
    ...logged("bench-drop", "bench", 2, 80),
    parent_set_id: working.id,
    set_variant: "drop" as const,
  };

  const result = getNextWorkoutSet(
    [working, drop],
    [planned("bench", "Bench", 1, 2)],
  );

  assert.equal(result?.exercise.exercise_id, "bench");
  assert.equal(result?.setNumber, 2);
  assert.equal(result?.lastSet?.id, "bench-1");
});
