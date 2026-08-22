import type { LoggedSet } from "../hooks/useWorkoutSession";
import type { WorkoutRecommendation } from "../hooks/useWorkoutRecommendations";
import { getSetTargetFeedback } from "./performanceFeedback.ts";

export type WorkoutRecap = {
  evaluatedSets: number;
  exceeded: number;
  exercisesTrained: number;
  met: number;
  missed: number;
  nextDirection: string;
  workingSets: number;
};

export function buildWorkoutRecap(
  sets: LoggedSet[],
  recommendations: Record<string, WorkoutRecommendation>,
): WorkoutRecap {
  const workingSets = sets.filter(
    (set) => set.set_type === "working" && set.set_variant === "standard",
  );
  let exceeded = 0;
  let met = 0;
  let missed = 0;
  let recoveryAdjusted = 0;

  for (const set of workingSets) {
    const recommendation = recommendations[set.exercise_id];
    if (!recommendation) continue;
    if (recommendation.strategy === "hold") recoveryAdjusted += 1;

    const feedback = getSetTargetFeedback({
      actualDurationSeconds: set.duration_seconds,
      actualMetricValue: set.metric_value ?? null,
      actualReps: set.reps,
      actualWeight: set.weight,
      performanceType: recommendation.performanceType,
      targetDurationSeconds: recommendation.durationSeconds,
      targetMetricValue: recommendation.metricValue,
      targetReps: recommendation.reps,
      targetWeight: recommendation.weight,
    });

    if (feedback?.status === "exceeded") exceeded += 1;
    if (feedback?.status === "met") met += 1;
    if (feedback?.status === "missed") missed += 1;
  }

  const evaluatedSets = exceeded + met + missed;
  const nextDirection =
    recoveryAdjusted > 0
      ? "Recovery shaped today’s targets. Keep the next session conservative until readiness improves."
      : exceeded > missed
        ? "Performance supported progression. Fortomnia will use these results to shape the next targets."
        : missed > exceeded
          ? "Keep the next targets steady and focus on repeatable execution before progressing."
          : evaluatedSets > 0
            ? "You delivered a steady session. Repeat this quality and let the next workout confirm progression."
            : "This session is now part of your training history and will improve future recommendations.";

  return {
    evaluatedSets,
    exceeded,
    exercisesTrained: new Set(workingSets.map((set) => set.exercise_id)).size,
    met,
    missed,
    nextDirection,
    workingSets: workingSets.length,
  };
}
