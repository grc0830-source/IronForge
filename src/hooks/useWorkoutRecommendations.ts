import { useEffect, useMemo, useState } from "react";

import type { PlannedExercise } from "./useWorkoutSession";
import { useRecoveryCheckIns } from "./useRecoveryCheckIns";
import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";
import {
  DEFAULT_PROGRESSION_RULES,
  getExerciseRecommendation,
  getMetricProgressionRecommendation,
  type ReadinessSnapshot,
} from "../lib/progression";
import { supabase } from "../lib/supabase";

type HistoryRow = {
  duration_seconds: number | null;
  exercise_id: string;
  metric_unit: MetricUnit | null;
  metric_value: number | string | null;
  performed_at: string;
  performance_type: PerformanceType;
  reps: number;
  reps_in_reserve: number | null;
  session_id: string;
  weight: number | string;
  weight_unit: "lb" | "kg";
};

export type WorkoutRecommendation = {
  durationSeconds: number | null;
  explanation: string;
  metricUnit: MetricUnit | null;
  metricValue: number | null;
  performanceType: PerformanceType;
  reps: number | null;
  strategy: "progress" | "hold" | "deload";
  targetText: string;
  weight: number | null;
};

export function useWorkoutRecommendations(
  plannedExercises: PlannedExercise[],
  currentWorkoutId: string | undefined,
) {
  const { days } = useRecoveryCheckIns();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const exerciseIds = useMemo(
    () => plannedExercises.map((exercise) => exercise.exercise_id),
    [plannedExercises],
  );
  const exerciseKey = exerciseIds.join(",");

  useEffect(() => {
    let isCurrent = true;

    async function loadHistory() {
      if (!currentWorkoutId || exerciseIds.length === 0) {
        setHistory([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("workout_sets")
        .select(
          "exercise_id, session_id, performance_type, duration_seconds, metric_value, metric_unit, reps, reps_in_reserve, weight, weight_unit, performed_at",
        )
        .in("exercise_id", exerciseIds)
        .neq("session_id", currentWorkoutId)
        .eq("set_type", "working")
        .eq("set_variant", "standard")
        .order("performed_at", { ascending: false })
        .limit(100);

      if (isCurrent) {
        setHistory(error ? [] : ((data ?? []) as HistoryRow[]));
        setIsLoading(false);
      }
    }

    void loadHistory();

    return () => {
      isCurrent = false;
    };
  }, [currentWorkoutId, exerciseKey]);

  const recommendations = useMemo(() => {
    const result: Record<string, WorkoutRecommendation> = {};
    const readiness: ReadinessSnapshot[] = days.map((day) => ({
      band: day.readiness.band,
      checkinDate: day.checkin_date,
      score: day.readiness.score,
    }));

    for (const exercise of plannedExercises) {
      const matching = history.filter(
        (set) =>
          set.exercise_id === exercise.exercise_id &&
          set.performance_type === exercise.performance_type,
      );

      if (exercise.performance_type === "reps") {
        const recommendation = getExerciseRecommendation(
          matching.map((set) => ({
            performedAt: set.performed_at,
            reps: set.reps,
            repsInReserve: set.reps_in_reserve,
            sessionId: set.session_id,
            weight: Number(set.weight),
            weightUnit: set.weight_unit,
          })),
          { repMax: exercise.rep_max, repMin: exercise.rep_min },
          DEFAULT_PROGRESSION_RULES,
          readiness,
        );

        if (recommendation) {
          result[exercise.exercise_id] = {
            durationSeconds: null,
            explanation: recommendation.explanation,
            metricUnit: null,
            metricValue: null,
            performanceType: "reps",
            reps: recommendation.reps,
            strategy: recommendation.strategy,
            targetText: `${recommendation.weight} ${recommendation.weightUnit} × ${recommendation.reps} reps`,
            weight: recommendation.weight,
          };
        }

        continue;
      }

      const recommendation = getMetricProgressionRecommendation(
        matching.map((set) => ({
          durationSeconds: set.duration_seconds,
          metricUnit: set.metric_unit,
          metricValue:
            set.metric_value === null ? null : Number(set.metric_value),
          performedAt: set.performed_at,
          performanceType: set.performance_type as
            | "time"
            | "distance"
            | "calories"
            | "rounds",
        })),
        readiness,
      );

      if (recommendation) {
        const targetText =
          recommendation.performanceType === "time"
            ? `${recommendation.durationSeconds} seconds`
            : `${recommendation.metricValue} ${recommendation.metricUnit ?? recommendation.performanceType}`;

        result[exercise.exercise_id] = {
          durationSeconds: recommendation.durationSeconds,
          explanation: recommendation.explanation,
          metricUnit: recommendation.metricUnit,
          metricValue: recommendation.metricValue,
          performanceType: recommendation.performanceType,
          reps: null,
          strategy: recommendation.strategy,
          targetText,
          weight: null,
        };
      }
    }

    return result;
  }, [days, history, plannedExercises]);

  return { isLoading, recommendations };
}
