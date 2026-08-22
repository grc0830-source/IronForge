import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROGRESSION_RULES,
  getExerciseRecommendation,
  getMetricProgressionRecommendation,
  getRepsFirstSuggestion,
} from "../src/lib/progression.ts";

test("adds a rep when performance meets the default RIR rule", () => {
  const suggestion = getRepsFirstSuggestion({
    repMax: 12,
    repMin: 8,
    reps: 10,
    repsInReserve: 2,
    weight: 100,
    weightUnit: "lb",
  });

  assert.equal(suggestion.reps, 11);
  assert.equal(suggestion.weight, 100);
});

test("uses the default weight increase at the top of a rep range", () => {
  const suggestion = getRepsFirstSuggestion({
    repMax: 12,
    repMin: 8,
    reps: 12,
    repsInReserve: 2,
    weight: 100,
    weightUnit: "lb",
  });

  assert.equal(suggestion.reps, 8);
  assert.equal(suggestion.weight, 105);
  assert.match(suggestion.explanation, /5 lb/);
});

test("applies an athlete's custom RIR threshold and weight increments", () => {
  const rules = {
    minimumRepsInReserve: 3,
    weightIncrease: { kg: 1.25, lb: 2.5 },
  };

  const hold = getRepsFirstSuggestion(
    {
      repMax: 10,
      repMin: 6,
      reps: 10,
      repsInReserve: 2,
      weight: 80,
      weightUnit: "kg",
    },
    rules,
  );
  const progress = getRepsFirstSuggestion(
    {
      repMax: 10,
      repMin: 6,
      reps: 10,
      repsInReserve: 3,
      weight: 80,
      weightUnit: "kg",
    },
    rules,
  );

  assert.equal(hold.weight, 80);
  assert.equal(progress.weight, 81.25);
  assert.match(progress.explanation, /3 reps in reserve/);
  assert.match(progress.explanation, /1.25 kg/);
});

test("rejects invalid athlete progression rules", () => {
  assert.throws(
    () =>
      getRepsFirstSuggestion(
        {
          reps: 8,
          repsInReserve: 2,
          weight: 100,
          weightUnit: "lb",
        },
        {
          ...DEFAULT_PROGRESSION_RULES,
          minimumRepsInReserve: -1,
        },
      ),
    /minimumRepsInReserve/,
  );
});

test("holds performance when RIR is low or missing", () => {
  for (const repsInReserve of [1, null]) {
    const suggestion = getRepsFirstSuggestion({
      repMax: 12,
      repMin: 8,
      reps: 10,
      repsInReserve,
      weight: 100,
      weightUnit: "lb",
    });

    assert.equal(suggestion.reps, 10);
    assert.equal(suggestion.weight, 100);
  }
});


test("uses the limiting working set from the most recent workout", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-18T12:03:00Z", reps: 10, repsInReserve: 2, sessionId: "latest", weight: 100, weightUnit: "lb" },
      { performedAt: "2026-08-18T12:02:00Z", reps: 9, repsInReserve: 1, sessionId: "latest", weight: 100, weightUnit: "lb" },
      { performedAt: "2026-08-11T12:00:00Z", reps: 12, repsInReserve: 3, sessionId: "older", weight: 100, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
  );

  assert.ok(recommendation);
  assert.equal(recommendation.reps, 9);
  assert.equal(recommendation.weight, 100);
  assert.equal(recommendation.basedOnSetCount, 2);
  assert.match(recommendation.explanation, /2 working sets/);
});

test("ignores lighter backoff sets when choosing the next target", () => {
  const recommendation = getExerciseRecommendation([
    { performedAt: "2026-08-18T12:03:00Z", reps: 12, repsInReserve: 3, sessionId: "latest", weight: 80, weightUnit: "kg" },
    { performedAt: "2026-08-18T12:01:00Z", reps: 8, repsInReserve: 2, sessionId: "latest", weight: 100, weightUnit: "kg" },
  ]);

  assert.ok(recommendation);
  assert.equal(recommendation.reps, 9);
  assert.equal(recommendation.weight, 100);
  assert.equal(recommendation.basedOnSetCount, 1);
});

test("returns no recommendation without exercise history", () => {
  assert.equal(getExerciseRecommendation([]), null);
});

test("recommends a small deload after three high-effort stalled workouts", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-18T12:00:00Z", reps: 8, repsInReserve: 0, sessionId: "latest", weight: 100, weightUnit: "lb" },
      { performedAt: "2026-08-11T12:00:00Z", reps: 8, repsInReserve: 1, sessionId: "middle", weight: 100, weightUnit: "lb" },
      { performedAt: "2026-08-04T12:00:00Z", reps: 9, repsInReserve: 1, sessionId: "oldest", weight: 100, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
  );

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "deload");
  assert.equal(recommendation.weight, 95);
  assert.equal(recommendation.reps, 8);
  assert.equal(recommendation.basedOnWorkoutCount, 3);
  assert.match(recommendation.explanation, /3 workouts/);
  assert.match(recommendation.explanation, /high effort/);
});

test("does not infer fatigue when RIR is missing", () => {
  const recommendation = getExerciseRecommendation([
    { performedAt: "2026-08-18T12:00:00Z", reps: 8, repsInReserve: null, sessionId: "latest", weight: 100, weightUnit: "lb" },
    { performedAt: "2026-08-11T12:00:00Z", reps: 8, repsInReserve: 1, sessionId: "middle", weight: 100, weightUnit: "lb" },
    { performedAt: "2026-08-04T12:00:00Z", reps: 9, repsInReserve: 1, sessionId: "oldest", weight: 100, weightUnit: "lb" },
  ]);

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "hold");
  assert.equal(recommendation.weight, 100);
  assert.equal(recommendation.basedOnWorkoutCount, 1);
});

test("does not deload when reps are improving", () => {
  const recommendation = getExerciseRecommendation([
    { performedAt: "2026-08-18T12:00:00Z", reps: 10, repsInReserve: 1, sessionId: "latest", weight: 100, weightUnit: "lb" },
    { performedAt: "2026-08-11T12:00:00Z", reps: 9, repsInReserve: 1, sessionId: "middle", weight: 100, weightUnit: "lb" },
    { performedAt: "2026-08-04T12:00:00Z", reps: 8, repsInReserve: 1, sessionId: "oldest", weight: 100, weightUnit: "lb" },
  ]);

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "hold");
  assert.equal(recommendation.weight, 100);
});

test("one low recovery day does not override supported progression", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-18T12:00:00Z", reps: 10, repsInReserve: 3, sessionId: "latest", weight: 100, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
    DEFAULT_PROGRESSION_RULES,
    [
      { band: "recover", checkinDate: "2026-08-20", score: 35 },
      { band: "ready", checkinDate: "2026-08-19", score: 72 },
    ],
  );

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "progress");
  assert.equal(recommendation.reps, 11);
  assert.equal(recommendation.recoveryContext, "single_low");
  assert.match(recommendation.explanation, /one low day does not override/);
});

test("repeated low recovery suppresses progression to a hold", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-18T12:00:00Z", reps: 12, repsInReserve: 3, sessionId: "latest", weight: 100, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
    DEFAULT_PROGRESSION_RULES,
    [
      { band: "recover", checkinDate: "2026-08-20", score: 30 },
      { band: "maintain", checkinDate: "2026-08-19", score: 52 },
      { band: "recover", checkinDate: "2026-08-18", score: 38 },
    ],
  );

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "hold");
  assert.equal(recommendation.weight, 100);
  assert.equal(recommendation.reps, 12);
  assert.equal(recommendation.recoveryContext, "repeated_low");
  assert.match(recommendation.explanation, /recovery alone does not trigger a deload/);
});

test("high readiness does not create progression without training support", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-18T12:00:00Z", reps: 9, repsInReserve: 1, sessionId: "latest", weight: 100, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
    DEFAULT_PROGRESSION_RULES,
    [
      { band: "high_readiness", checkinDate: "2026-08-20", score: 92 },
    ],
  );

  assert.ok(recommendation);
  assert.equal(recommendation.strategy, "hold");
  assert.equal(recommendation.weight, 100);
  assert.equal(recommendation.reps, 9);
  assert.equal(recommendation.recoveryContext, "none");
});

test("ignores warm-up sets when calculating the next target", () => {
  const recommendation = getExerciseRecommendation(
    [
      { performedAt: "2026-08-20T12:02:00Z", reps: 12, repsInReserve: 5, sessionId: "latest", setType: "warmup", weight: 135, weightUnit: "lb" },
      { performedAt: "2026-08-20T12:01:00Z", reps: 8, repsInReserve: 1, sessionId: "latest", setType: "working", weight: 225, weightUnit: "lb" },
    ],
    { repMax: 12, repMin: 8 },
  );

  assert.ok(recommendation);
  assert.equal(recommendation.weight, 225);
  assert.equal(recommendation.reps, 8);
  assert.equal(recommendation.strategy, "hold");
  assert.equal(recommendation.basedOnSetCount, 1);
});

test("returns no recommendation when history contains only warm-ups", () => {
  const recommendation = getExerciseRecommendation([
    { performedAt: "2026-08-20T12:00:00Z", reps: 10, repsInReserve: 4, sessionId: "latest", setType: "warmup", weight: 95, weightUnit: "lb" },
  ]);

  assert.equal(recommendation, null);
});

test("ignores drop sets when calculating the next target", () => {
  const recommendation = getExerciseRecommendation([
    { performedAt: "2026-08-21T12:02:00Z", reps: 12, repsInReserve: 3, sessionId: "latest", setVariant: "drop", weight: 180, weightUnit: "lb" },
    { performedAt: "2026-08-21T12:01:00Z", reps: 8, repsInReserve: 1, sessionId: "latest", setVariant: "standard", weight: 225, weightUnit: "lb" },
  ]);

  assert.ok(recommendation);
  assert.equal(recommendation.weight, 225);
  assert.equal(recommendation.reps, 8);
  assert.equal(recommendation.basedOnSetCount, 1);
});


test("progresses timed, distance, calorie, and round targets conservatively", () => {
  const time = getMetricProgressionRecommendation([
    { durationSeconds: 60, metricUnit: null, metricValue: null, performedAt: "2026-08-21T12:00:00Z", performanceType: "time" },
  ]);
  const distance = getMetricProgressionRecommendation([
    { durationSeconds: null, metricUnit: "meters", metricValue: 1000, performedAt: "2026-08-21T12:00:00Z", performanceType: "distance" },
  ]);
  const calories = getMetricProgressionRecommendation([
    { durationSeconds: null, metricUnit: "calories", metricValue: 12, performedAt: "2026-08-21T12:00:00Z", performanceType: "calories" },
  ]);
  const rounds = getMetricProgressionRecommendation([
    { durationSeconds: null, metricUnit: "rounds", metricValue: 5, performedAt: "2026-08-21T12:00:00Z", performanceType: "rounds" },
  ]);

  assert.equal(time?.durationSeconds, 65);
  assert.equal(distance?.metricValue, 1050);
  assert.equal(calories?.metricValue, 13);
  assert.equal(rounds?.metricValue, 6);
  assert.equal(distance?.strategy, "progress");
});

test("repeated low recovery holds a metric target steady", () => {
  const recommendation = getMetricProgressionRecommendation(
    [
      { durationSeconds: null, metricUnit: "meters", metricValue: 500, performedAt: "2026-08-21T12:00:00Z", performanceType: "distance" },
    ],
    [
      { band: "recover", checkinDate: "2026-08-21", score: 30 },
      { band: "recover", checkinDate: "2026-08-20", score: 35 },
    ],
  );

  assert.equal(recommendation?.metricValue, 500);
  assert.equal(recommendation?.strategy, "hold");
  assert.match(recommendation?.explanation ?? "", /recovery/);
});
