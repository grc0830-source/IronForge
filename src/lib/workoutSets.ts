import {
  formatMetricValue,
  type MetricUnit,
  type PerformanceType,
} from "./performanceMetrics.ts";
import type {
  LoggedSet,
  PlannedExercise,
} from "../hooks/useWorkoutSession";

export type WorkoutSetGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
};

export function orderExerciseSets(sets: LoggedSet[]): LoggedSet[] {
  const standardSets = sets
    .filter((set) => set.set_variant === "standard")
    .sort((left, right) => left.set_number - right.set_number);
  const dropSets = sets.filter((set) => set.set_variant === "drop");
  const ordered: LoggedSet[] = [];

  for (const standardSet of standardSets) {
    ordered.push(standardSet);
    ordered.push(
      ...dropSets
        .filter((set) => set.parent_set_id === standardSet.id)
        .sort((left, right) => left.set_number - right.set_number),
    );
  }

  ordered.push(
    ...dropSets
      .filter(
        (set) =>
          !standardSets.some(
            (standardSet) => standardSet.id === set.parent_set_id,
          ),
      )
      .sort((left, right) => left.set_number - right.set_number),
  );

  return ordered;
}

export function groupWorkoutSets(
  sets: LoggedSet[],
  plannedExerciseIds: string[] = [],
): WorkoutSetGroup[] {
  const groups = new Map<string, WorkoutSetGroup>();

  for (const set of sets) {
    const existing = groups.get(set.exercise_id);

    if (existing) {
      existing.sets.push(set);
      continue;
    }

    groups.set(set.exercise_id, {
      exerciseId: set.exercise_id,
      exerciseName: set.exercise_name,
      sets: [set],
    });
  }

  const planOrder = new Map(
    plannedExerciseIds.map((exerciseId, index) => [exerciseId, index]),
  );

  return [...groups.values()]
    .map((group, firstSeenIndex) => ({
      firstSeenIndex,
      group: {
        ...group,
        sets: orderExerciseSets(group.sets),
      },
    }))
    .sort((left, right) => {
      const leftPosition = planOrder.get(left.group.exerciseId);
      const rightPosition = planOrder.get(right.group.exerciseId);

      if (leftPosition !== undefined && rightPosition !== undefined) {
        return leftPosition - rightPosition;
      }

      if (leftPosition !== undefined) {
        return -1;
      }

      if (rightPosition !== undefined) {
        return 1;
      }

      return left.firstSeenIndex - right.firstSeenIndex;
    })
    .map(({ group }) => group);
}

export type NextWorkoutSet = {
  completedSets: number;
  exercise: PlannedExercise;
  lastSet: LoggedSet | null;
  setNumber: number;
};

export function getNextWorkoutSet(
  sets: LoggedSet[],
  plannedExercises: PlannedExercise[],
): NextWorkoutSet | null {
  const orderedExercises = [...plannedExercises].sort(
    (left, right) => left.position - right.position,
  );
  const completedCount = (exercise: PlannedExercise) =>
    sets.filter(
      (set) =>
        set.exercise_id === exercise.exercise_id &&
        set.set_variant === "standard",
    ).length;

  for (const exercise of orderedExercises) {
    const block = exercise.superset_group
      ? orderedExercises.filter(
          (item) => item.superset_group === exercise.superset_group,
        )
      : [exercise];
    const firstPosition = Math.min(...block.map((item) => item.position));

    if (exercise.position !== firstPosition) {
      continue;
    }

    const nextExercise = block
      .filter((item) => completedCount(item) < item.target_sets)
      .sort((left, right) => {
        const countDifference =
          completedCount(left) - completedCount(right);
        return countDifference !== 0
          ? countDifference
          : left.position - right.position;
      })[0];

    if (!nextExercise) {
      continue;
    }

    const exerciseSets = sets
      .filter(
        (set) =>
          set.exercise_id === nextExercise.exercise_id &&
          set.set_variant === "standard",
      )
      .sort((left, right) => left.set_number - right.set_number);

    return {
      completedSets: exerciseSets.length,
      exercise: nextExercise,
      lastSet: exerciseSets.at(-1) ?? null,
      setNumber: exerciseSets.length + 1,
    };
  }

  return null;
}

export function formatSetPerformance(set: LoggedSet): string {
  if (
    ["distance", "calories", "rounds"].includes(set.performance_type) &&
    set.metric_value != null &&
    set.metric_unit != null
  ) {
    const metric = formatMetricValue(
      set.performance_type,
      set.metric_value,
      set.metric_unit,
    );
    return set.weight > 0
      ? `${set.weight} ${set.weight_unit} × ${metric}`
      : metric;
  }

  if (set.performance_type === "time" && set.duration_seconds !== null) {
    const minutes = Math.floor(set.duration_seconds / 60);
    const seconds = set.duration_seconds % 60;
    const duration =
      minutes > 0
        ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
        : `${seconds}s`;

    return set.weight > 0
      ? `${set.weight} ${set.weight_unit} × ${duration}`
      : duration;
  }

  return `${set.weight} ${set.weight_unit} × ${set.reps} reps`;
}

type ExerciseTarget = {
  performance_type: PerformanceType;
  rep_max: number;
  rep_min: number;
  target_duration_seconds: number | null;
  target_metric_unit?: MetricUnit | null;
  target_metric_value?: number | null;
  target_rir: number;
  target_sets: number;
};

export function formatExerciseTarget(target: ExerciseTarget): string {
  if (
    ["distance", "calories", "rounds"].includes(target.performance_type) &&
    target.target_metric_value != null &&
    target.target_metric_unit != null
  ) {
    return `${target.target_sets} sets × ${formatMetricValue(
      target.performance_type,
      target.target_metric_value,
      target.target_metric_unit,
    )}`;
  }

  if (
    target.performance_type === "time" &&
    target.target_duration_seconds !== null
  ) {
    const minutes = Math.floor(target.target_duration_seconds / 60);
    const seconds = target.target_duration_seconds % 60;
    const duration =
      minutes > 0
        ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
        : `${seconds}s`;

    return `${target.target_sets} sets × ${duration}`;
  }

  return (
    `${target.target_sets} sets × ${target.rep_min}–` +
    `${target.rep_max} reps • ${target.target_rir} RIR`
  );
}
