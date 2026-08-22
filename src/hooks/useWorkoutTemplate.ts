import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";
import { supabase } from "../lib/supabase";

export type TemplateExercise = {
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

export type WorkoutTemplateDetail = {
  id: string;
  name: string;
  notes: string | null;
};

type TemplateExerciseRow = {
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

export function useWorkoutTemplate(templateId: string | undefined) {
  const [template, setTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [templateExercises, setTemplateExercises] =
    useState<TemplateExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      setTemplateExercises([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [templateResult, exercisesResult] = await Promise.all([
      supabase
        .from("workout_templates")
        .select("id, name, notes")
        .eq("id", templateId)
        .single(),

      supabase
        .from("workout_template_exercises")
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
        .eq("template_id", templateId)
        .order("position"),
    ]);

    if (templateResult.error) {
      setTemplate(null);
      setTemplateExercises([]);
      setErrorMessage(templateResult.error.message);
      setIsLoading(false);
      return;
    }

    if (exercisesResult.error) {
      setTemplate(templateResult.data as WorkoutTemplateDetail);
      setTemplateExercises([]);
      setErrorMessage(exercisesResult.error.message);
      setIsLoading(false);
      return;
    }

    const normalizedExercises = (
      exercisesResult.data as TemplateExerciseRow[]
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

    setTemplate(templateResult.data as WorkoutTemplateDetail);
    setTemplateExercises(normalizedExercises);
    setIsLoading(false);
  }, [templateId]);

  useFocusEffect(
    useCallback(() => {
      void loadTemplate();
    }, [loadTemplate]),
  );

  return {
    errorMessage,
    isLoading,
    refreshTemplate: loadTemplate,
    template,
    templateExercises,
  };
}
