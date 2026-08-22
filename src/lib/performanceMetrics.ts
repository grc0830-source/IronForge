export const PERFORMANCE_TYPES = [
  "reps",
  "time",
  "distance",
  "calories",
  "rounds",
] as const;

export type PerformanceType = (typeof PERFORMANCE_TYPES)[number];
export type MetricUnit =
  | "meters"
  | "kilometers"
  | "miles"
  | "yards"
  | "calories"
  | "rounds";

export const PERFORMANCE_LABELS: Record<PerformanceType, string> = {
  calories: "Calories",
  distance: "Distance",
  reps: "Repetitions",
  rounds: "Rounds",
  time: "Time",
};

export const DISTANCE_UNITS: MetricUnit[] = [
  "meters",
  "kilometers",
  "miles",
  "yards",
];

export function defaultMetricUnit(type: PerformanceType): MetricUnit | null {
  if (type === "distance") return "meters";
  if (type === "calories") return "calories";
  if (type === "rounds") return "rounds";
  return null;
}

export function formatMetricValue(
  type: PerformanceType,
  value: number,
  unit: MetricUnit,
): string {
  if (type === "calories") return `${value} cal`;
  if (type === "rounds") return `${value} rounds`;

  const labels: Record<MetricUnit, string> = {
    calories: "cal",
    kilometers: "km",
    meters: "m",
    miles: "mi",
    rounds: "rounds",
    yards: "yd",
  };
  return `${value} ${labels[unit]}`;
}


export type ExerciseMetricInput = {
  equipment: string | null;
  movement_pattern: string;
  name: string;
};

export type ExerciseMetricDefaults = {
  explanation: string;
  performanceType: PerformanceType;
  targetDurationSeconds: number | null;
  targetMetricUnit: MetricUnit | null;
  targetMetricValue: number | null;
};

export function getExerciseMetricDefaults(
  exercise: ExerciseMetricInput,
): ExerciseMetricDefaults {
  const searchable = `${exercise.name} ${exercise.equipment ?? ""}`.toLowerCase();
  const matches = (...terms: string[]) =>
    terms.some((term) => searchable.includes(term));

  if (matches("circuit", "amrap", "rounds")) {
    return {
      explanation: "Circuit-style work is easiest to track by completed rounds.",
      performanceType: "rounds",
      targetDurationSeconds: null,
      targetMetricUnit: "rounds",
      targetMetricValue: 3,
    };
  }

  if (matches("rower", "rowing machine", "ski erg", "skierg", "air bike", "assault bike")) {
    return {
      explanation: "Erg work defaults to calories for a simple, machine-readable target.",
      performanceType: "calories",
      targetDurationSeconds: null,
      targetMetricUnit: "calories",
      targetMetricValue: 10,
    };
  }

  if (
    exercise.movement_pattern === "carry" ||
    matches("run", "walk", "swim", "sprint", "carry", "sled")
  ) {
    return {
      explanation: "Locomotion work defaults to distance so progress stays comparable.",
      performanceType: "distance",
      targetDurationSeconds: null,
      targetMetricUnit: "meters",
      targetMetricValue: 400,
    };
  }

  if (matches("plank", "hold", "hang", "wall sit", "isometric")) {
    return {
      explanation: "Static work defaults to time because duration is the key performance measure.",
      performanceType: "time",
      targetDurationSeconds: 30,
      targetMetricUnit: null,
      targetMetricValue: null,
    };
  }

  return {
    explanation: "Strength exercises default to repetitions for straightforward progression.",
    performanceType: "reps",
    targetDurationSeconds: null,
    targetMetricUnit: null,
    targetMetricValue: null,
  };
}
