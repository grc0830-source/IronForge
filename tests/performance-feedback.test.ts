import assert from "node:assert/strict";
import test from "node:test";

import { getSetTargetFeedback } from "../src/lib/performanceFeedback.ts";

test("recognizes met, exceeded, and missed strength targets", () => {
  const base = {
    actualDurationSeconds: null,
    actualMetricValue: null,
    performanceType: "reps" as const,
    targetDurationSeconds: null,
    targetMetricValue: null,
    targetReps: 8,
    targetWeight: 100,
  };

  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 8, actualWeight: 100 })?.status,
    "met",
  );
  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 9, actualWeight: 100 })?.status,
    "exceeded",
  );
  assert.equal(
    getSetTargetFeedback({ ...base, actualReps: 7, actualWeight: 100 })?.status,
    "missed",
  );
});

test("compares time and metric performances with their targets", () => {
  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: 65,
      actualMetricValue: null,
      actualReps: 1,
      actualWeight: 0,
      performanceType: "time",
      targetDurationSeconds: 60,
      targetMetricValue: null,
      targetReps: null,
      targetWeight: null,
    })?.status,
    "exceeded",
  );

  assert.equal(
    getSetTargetFeedback({
      actualDurationSeconds: null,
      actualMetricValue: 500,
      actualReps: 1,
      actualWeight: 0,
      performanceType: "distance",
      targetDurationSeconds: null,
      targetMetricValue: 500,
      targetReps: null,
      targetWeight: null,
    })?.status,
    "met",
  );
});
