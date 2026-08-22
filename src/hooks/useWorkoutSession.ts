import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";
import { supabase } from "../lib/supabase";

export type LoggedSet = {
  duration_seconds: number | null;
  metric_unit?: MetricUnit | null;
  metric_value?: number | null;
  exercise_id: string;
  exercise_name: string;
  id: string;
  parent_set_id: string | null;
  performance_type: PerformanceType;
  set_variant: "standard" | "drop";
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  set_type: "warmup" | "working";
  weight: number;
  weight_unit: "lb" | "kg";
};
export type PlannedExercise = {
  superset_group: string | null;
  performance_type: PerformanceType;
  exercise_id: string;
  exercise_name: string;
  id: string;
  position: number;
  rep_max: number;
  rep_min: number;
  target_duration_seconds: number | null;
  target_metric_unit?: MetricUnit | null;
  target_metric_value?: number | null;
  target_rir: number;
  target_sets: number;
};
export type WorkoutDetail = {
  completed_at: string | null;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
};

type WorkoutSetRow = {
  duration_seconds: number | null;
  metric_unit?: MetricUnit | null;
  metric_value?: number | null;
  exercise_id: string;
  exercises:
  | { name: string }
  | { name: string }[]
  | null;
  id: string;
  parent_set_id: string | null;
  performance_type: PerformanceType;
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  set_type: "warmup" | "working";
  set_variant: "standard" | "drop";
  weight: number | string;
  weight_unit: "lb" | "kg";
};
type PlannedExerciseRow = {
  superset_group: string | null;
  performance_type: PerformanceType;
  exercise_id: string;
  exercises:
    | { name: string }
    | { name: string }[]
    | null;
  id: string;
  position: number;
  rep_max: number;
  rep_min: number;
  target_duration_seconds: number | null;
  target_metric_unit?: MetricUnit | null;
  target_metric_value?: number | null;
  target_rir: number;
  target_sets: number;
};
export function useWorkoutSession(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [plannedExercises, setPlannedExercises] =
    useState<PlannedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!workoutId) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [workoutResult, setsResult, planResult] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, name, started_at, completed_at, notes")
        .eq("id", workoutId)
        .single(),

      supabase
        .from("workout_sets")
        .select(
          `
            id,
            exercise_id,
            duration_seconds,
            metric_unit,
            metric_value,
            parent_set_id,
            performance_type,
            set_number,
            set_variant,
            set_type,
            reps,
            weight,
            weight_unit,
            reps_in_reserve,
            exercises (name)
          `,
        )
        .eq("session_id", workoutId)
        .order("set_number"),
          supabase
        .from("workout_session_exercises")
        .select(
          `
            id,
            exercise_id,
            position,
            superset_group,
            performance_type,
            target_duration_seconds,
            target_metric_unit,
            target_metric_value,
            target_sets,
            rep_min,
            rep_max,
            target_rir,
            exercises (name)
          `,
        )
        .eq("session_id", workoutId)
        .order("position"),
]);

    if (workoutResult.error) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(workoutResult.error.message);
      setIsLoading(false);
      return;
    }

    if (setsResult.error) {
      setWorkout(workoutResult.data as WorkoutDetail);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(setsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (planResult.error) {
      setWorkout(workoutResult.data as WorkoutDetail);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(planResult.error.message);
      setIsLoading(false);
      return;
    }
    const normalizedSets = (setsResult.data as WorkoutSetRow[]).map(
  (set) => {
    const exercise = Array.isArray(set.exercises)
      ? set.exercises[0]
      : set.exercises;

    return {
      duration_seconds: set.duration_seconds,
      metric_unit: set.metric_unit,
      metric_value: set.metric_value == null ? null : Number(set.metric_value),
      exercise_id: set.exercise_id,
      exercise_name: exercise?.name ?? "Unknown exercise",
      id: set.id,
      parent_set_id: set.parent_set_id,
      performance_type: set.performance_type,
      reps: set.reps,
      reps_in_reserve: set.reps_in_reserve,
      set_number: set.set_number,
      set_type: set.set_type,
      set_variant: set.set_variant,
      weight: Number(set.weight),
      weight_unit: set.weight_unit,
    };
  },
);

        const normalizedPlannedExercises = (
      planResult.data as PlannedExerciseRow[]
    ).map((item) => {
      const exercise = Array.isArray(item.exercises)
        ? item.exercises[0]
        : item.exercises;

      return {
        exercise_id: item.exercise_id,
        exercise_name: exercise?.name ?? "Unknown exercise",
        id: item.id,
        performance_type: item.performance_type,
        position: item.position,
        rep_max: item.rep_max,
        rep_min: item.rep_min,
        superset_group: item.superset_group,
        target_duration_seconds: item.target_duration_seconds,
        target_metric_unit: item.target_metric_unit,
        target_metric_value:
          item.target_metric_value == null ? null : Number(item.target_metric_value),
        target_rir: item.target_rir,
        target_sets: item.target_sets,
      };
    });
      setWorkout(workoutResult.data as WorkoutDetail);
    setSets(normalizedSets);
    setPlannedExercises(normalizedPlannedExercises);
    setIsLoading(false);
  }, [workoutId]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkout();
    }, [loadWorkout]),
  );

  return {
    errorMessage,
    isLoading,
    plannedExercises,
    refreshWorkout: loadWorkout,
    sets,
    workout,
  };
}
