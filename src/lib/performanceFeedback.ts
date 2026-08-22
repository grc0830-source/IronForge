import type { PerformanceType } from "./performanceMetrics";

export type SetTargetFeedback = {
  explanation: string;
  label: "TARGET MET" | "TARGET EXCEEDED" | "BELOW TARGET";
  status: "met" | "exceeded" | "missed";
};

type SetTargetFeedbackInput = {
  actualDurationSeconds: number | null;
  actualMetricValue: number | null;
  actualReps: number;
  actualWeight: number;
  performanceType: PerformanceType;
  targetDurationSeconds: number | null;
  targetMetricValue: number | null;
  targetReps: number | null;
  targetWeight: number | null;
};

export function getSetTargetFeedback(
  input: SetTargetFeedbackInput,
): SetTargetFeedback | null {
  let actual: number;
  let target: number;
  let exceeded = false;

  if (input.performanceType === "reps") {
    if (input.targetReps === null || input.targetWeight === null) return null;

    const met =
      input.actualReps >= input.targetReps &&
      input.actualWeight >= input.targetWeight;
    exceeded =
      met &&
      (input.actualReps > input.targetReps ||
        input.actualWeight > input.targetWeight);

    if (!met) {
      return {
        explanation:
          "That was below today’s target. Keep the next effort controlled; one set does not define the session.",
        label: "BELOW TARGET",
        status: "missed",
      };
    }
  } else if (input.performanceType === "time") {
    if (
      input.actualDurationSeconds === null ||
      input.targetDurationSeconds === null
    ) return null;
    actual = input.actualDurationSeconds;
    target = input.targetDurationSeconds;
    exceeded = actual > target;

    if (actual < target) {
      return {
        explanation:
          "That was below today’s duration target. Prioritize position and quality before adding time.",
        label: "BELOW TARGET",
        status: "missed",
      };
    }
  } else {
    if (input.actualMetricValue === null || input.targetMetricValue === null) {
      return null;
    }
    actual = input.actualMetricValue;
    target = input.targetMetricValue;
    exceeded = actual > target;

    if (actual < target) {
      return {
        explanation:
          "That was below today’s target. Stay consistent and use the next set to gather more information.",
        label: "BELOW TARGET",
        status: "missed",
      };
    }
  }

  return exceeded
    ? {
        explanation:
          "You exceeded today’s recommendation. Keep the next effort repeatable instead of chasing a large jump.",
        label: "TARGET EXCEEDED",
        status: "exceeded",
      }
    : {
        explanation:
          "You matched today’s recommendation. Repeat it with the same quality before progressing again.",
        label: "TARGET MET",
        status: "met",
      };
}
