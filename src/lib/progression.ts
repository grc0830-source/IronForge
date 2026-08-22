export type ProgressionInput = {
  repMax?: number;
  repMin?: number;
  reps: number;
  repsInReserve: number | null;
  weight: number;
  weightUnit: "lb" | "kg";
};

export type AthleteProgressionRules = {
  minimumRepsInReserve: number;
  weightIncrease: Record<ProgressionInput["weightUnit"], number>;
};

export type ProgressionSuggestion = {
  explanation: string;
  reps: number;
  weight: number;
  weightUnit: "lb" | "kg";
};

export type RecentExerciseSet = {
  performedAt: string;
  reps: number;
  repsInReserve: number | null;
  sessionId: string;
  setType?: "warmup" | "working";
  setVariant?: "standard" | "drop";
  weight: number;
  weightUnit: ProgressionInput["weightUnit"];
};

export type ReadinessSnapshot = {
  band: "recover" | "maintain" | "ready" | "high_readiness";
  checkinDate: string;
  score: number;
};

export type ExerciseRecommendation = ProgressionSuggestion & {
  basedOnSetCount: number;
  basedOnWorkoutCount: number;
  performedAt: string;
  recoveryContext: "none" | "single_low" | "repeated_low";
  strategy: "progress" | "hold" | "deload";
};

export const DEFAULT_PROGRESSION_RULES: AthleteProgressionRules = {
  minimumRepsInReserve: 2,
  weightIncrease: {
    kg: 2.5,
    lb: 5,
  },
};

function validateRules(rules: AthleteProgressionRules): void {
  if (
    !Number.isFinite(rules.minimumRepsInReserve) ||
    rules.minimumRepsInReserve < 0
  ) {
    throw new RangeError("minimumRepsInReserve must be a non-negative number");
  }

  for (const unit of ["lb", "kg"] as const) {
    if (
      !Number.isFinite(rules.weightIncrease[unit]) ||
      rules.weightIncrease[unit] <= 0
    ) {
      throw new RangeError(`weightIncrease.${unit} must be greater than zero`);
    }
  }
}

export function getRepsFirstSuggestion(
  input: ProgressionInput,
  rules: AthleteProgressionRules = DEFAULT_PROGRESSION_RULES,
): ProgressionSuggestion {
  validateRules(rules);

  const canProgress =
    input.repsInReserve !== null &&
    input.repsInReserve >= rules.minimumRepsInReserve;

  const hasRepRange =
    input.repMin !== undefined &&
    input.repMax !== undefined &&
    input.repMin <= input.repMax;

  if (canProgress && hasRepRange && input.reps >= input.repMax!) {
    const weightIncrease = rules.weightIncrease[input.weightUnit];

    return {
      explanation:
        `You reached the top of the rep range with at least ${rules.minimumRepsInReserve} reps in reserve. ` +
        `Increase the weight by ${weightIncrease} ${input.weightUnit} and return to the range minimum.`,
      reps: input.repMin!,
      weight: Number((input.weight + weightIncrease).toFixed(2)),
      weightUnit: input.weightUnit,
    };
  }

  if (canProgress) {
    const nextReps = hasRepRange
      ? Math.min(input.reps + 1, input.repMax!)
      : input.reps + 1;

    return {
      explanation:
        `You had at least ${rules.minimumRepsInReserve} reps in reserve, so aim for one more rep.`,
      reps: nextReps,
      weight: input.weight,
      weightUnit: input.weightUnit,
    };
  }

  return {
    explanation:
      `Repeat this performance until you have at least ${rules.minimumRepsInReserve} reps in reserve.`,
    reps: input.reps,
    weight: input.weight,
    weightUnit: input.weightUnit,
  };
}


type WorkoutPerformance = {
  limitingSet: RecentExerciseSet;
  performedAt: string;
  workingSetCount: number;
};

function getWorkoutPerformance(
  sets: RecentExerciseSet[],
): WorkoutPerformance {
  const performedAt = sets.reduce(
    (latest, set) =>
      new Date(set.performedAt).getTime() > new Date(latest).getTime()
        ? set.performedAt
        : latest,
    sets[0].performedAt,
  );
  const workingWeight = Math.max(...sets.map((set) => set.weight));
  const workingSets = sets.filter((set) => set.weight === workingWeight);
  const limitingSet = workingSets.reduce((current, set) => {
    if (set.reps !== current.reps) {
      return set.reps < current.reps ? set : current;
    }

    const currentRir = current.repsInReserve ?? -1;
    const setRir = set.repsInReserve ?? -1;
    return setRir < currentRir ? set : current;
  });

  return {
    limitingSet,
    performedAt,
    workingSetCount: workingSets.length,
  };
}

function getRecentWorkoutPerformances(
  recentSets: RecentExerciseSet[],
): WorkoutPerformance[] {
  const sortedSets = [...recentSets].sort(
    (left, right) =>
      new Date(right.performedAt).getTime() -
      new Date(left.performedAt).getTime(),
  );
  const sessions = new Map<string, RecentExerciseSet[]>();

  for (const set of sortedSets) {
    const sessionKey = `${set.sessionId}:${set.weightUnit}`;
    const sessionSets = sessions.get(sessionKey) ?? [];
    sessionSets.push(set);
    sessions.set(sessionKey, sessionSets);
  }

  return [...sessions.values()]
    .map(getWorkoutPerformance)
    .sort(
      (left, right) =>
        new Date(right.performedAt).getTime() -
        new Date(left.performedAt).getTime(),
    );
}

function hasFatiguePattern(
  workouts: WorkoutPerformance[],
  rules: AthleteProgressionRules,
): boolean {
  const recentWorkouts = workouts.slice(0, 3);

  if (recentWorkouts.length < 3) {
    return false;
  }

  const [latest, previous, oldest] = recentWorkouts;
  const sameWorkingWeight = recentWorkouts.every(
    ({ limitingSet }) =>
      limitingSet.weight === latest.limitingSet.weight &&
      limitingSet.weightUnit === latest.limitingSet.weightUnit,
  );
  const consistentlyHighEffort = recentWorkouts.every(
    ({ limitingSet }) =>
      limitingSet.repsInReserve !== null &&
      limitingSet.repsInReserve < rules.minimumRepsInReserve,
  );
  const repsAreNotImproving =
    latest.limitingSet.reps <= previous.limitingSet.reps &&
    previous.limitingSet.reps <= oldest.limitingSet.reps;

  return sameWorkingWeight && consistentlyHighEffort && repsAreNotImproving;
}

function getRecoveryContext(
  readinessHistory: ReadinessSnapshot[],
): ExerciseRecommendation["recoveryContext"] {
  const recentReadiness = [...readinessHistory]
    .sort((left, right) => right.checkinDate.localeCompare(left.checkinDate))
    .slice(0, 3);
  const latestReadiness = recentReadiness[0];

  if (!latestReadiness || latestReadiness.band !== "recover") {
    return "none";
  }

  const recoverCount = recentReadiness.filter(
    (readiness) => readiness.band === "recover",
  ).length;

  return recoverCount >= 2 ? "repeated_low" : "single_low";
}

function getRecoveryExplanation(
  recoveryContext: ExerciseRecommendation["recoveryContext"],
): string {
  if (recoveryContext === "repeated_low") {
    return (
      " Two of your recent recovery check-ins, including today, are in Recover. " +
      "Hold the last performance and reassess after your warm-up; recovery alone does not trigger a deload."
    );
  }

  if (recoveryContext === "single_low") {
    return (
      " Today's Recover check-in adds caution, but one low day does not override your training trend. " +
      "Reassess after your warm-up."
    );
  }

  return "";
}

export function getExerciseRecommendation(
  recentSets: RecentExerciseSet[],
  repRange: Pick<ProgressionInput, "repMax" | "repMin"> = {},
  rules: AthleteProgressionRules = DEFAULT_PROGRESSION_RULES,
  readinessHistory: ReadinessSnapshot[] = [],
): ExerciseRecommendation | null {
  const workingSets = recentSets.filter(
    (set) =>
      set.setType !== "warmup" && set.setVariant !== "drop",
  );

  if (workingSets.length === 0) {
    return null;
  }

  validateRules(rules);

  const workouts = getRecentWorkoutPerformances(workingSets);
  const latestWorkout = workouts[0];
  const limitingSet = latestWorkout.limitingSet;
  const setLabel = latestWorkout.workingSetCount === 1 ? "set" : "sets";
  const recoveryContext = getRecoveryContext(readinessHistory);

  if (hasFatiguePattern(workouts, rules)) {
    const weightDecrease = rules.weightIncrease[limitingSet.weightUnit];
    const deloadWeight = Math.max(
      0,
      Number((limitingSet.weight - weightDecrease).toFixed(2)),
    );
    const targetReps = repRange.repMin ?? limitingSet.reps;

    return {
      basedOnSetCount: latestWorkout.workingSetCount,
      basedOnWorkoutCount: 3,
      explanation:
        `The last 3 workouts at ${limitingSet.weight} ${limitingSet.weightUnit} were all high effort without a rep improvement. ` +
        `Reduce the weight by ${weightDecrease} ${limitingSet.weightUnit} for this workout and rebuild from there.` +
        (recoveryContext === "repeated_low"
          ? " Repeated low recovery check-ins reinforce this recovery target."
          : ""),
      performedAt: latestWorkout.performedAt,
      recoveryContext,
      reps: targetReps,
      strategy: "deload",
      weight: deloadWeight,
      weightUnit: limitingSet.weightUnit,
    };
  }

  const suggestion = getRepsFirstSuggestion(
    {
      ...repRange,
      reps: limitingSet.reps,
      repsInReserve: limitingSet.repsInReserve,
      weight: limitingSet.weight,
      weightUnit: limitingSet.weightUnit,
    },
    rules,
  );
  const trainingStrategy =
    suggestion.weight > limitingSet.weight ||
    suggestion.reps > limitingSet.reps
      ? "progress"
      : "hold";
  const shouldHoldForRecovery =
    recoveryContext === "repeated_low" && trainingStrategy === "progress";
  const strategy = shouldHoldForRecovery ? "hold" : trainingStrategy;
  const recoveryExplanation = getRecoveryExplanation(recoveryContext);

  return {
    ...suggestion,
    basedOnSetCount: latestWorkout.workingSetCount,
    basedOnWorkoutCount: 1,
    explanation:
      `Based on ${latestWorkout.workingSetCount} working ${setLabel} from your last workout. ` +
      suggestion.explanation +
      recoveryExplanation,
    performedAt: latestWorkout.performedAt,
    recoveryContext,
    reps: shouldHoldForRecovery ? limitingSet.reps : suggestion.reps,
    strategy,
    weight: shouldHoldForRecovery ? limitingSet.weight : suggestion.weight,
  };
}


export type MetricProgressionSet = {
  durationSeconds: number | null;
  metricUnit: "meters" | "kilometers" | "miles" | "yards" | "calories" | "rounds" | null;
  metricValue: number | null;
  performedAt: string;
  performanceType: "time" | "distance" | "calories" | "rounds";
};

export type MetricProgressionRecommendation = {
  durationSeconds: number | null;
  explanation: string;
  metricUnit: MetricProgressionSet["metricUnit"];
  metricValue: number | null;
  performanceType: MetricProgressionSet["performanceType"];
  recoveryContext: ExerciseRecommendation["recoveryContext"];
  strategy: "progress" | "hold";
};

export function getMetricProgressionRecommendation(
  recentSets: MetricProgressionSet[],
  readinessHistory: ReadinessSnapshot[] = [],
): MetricProgressionRecommendation | null {
  const latestSet = [...recentSets]
    .filter((set) =>
      set.performanceType === "time"
        ? set.durationSeconds !== null && set.durationSeconds > 0
        : set.metricValue !== null && set.metricValue > 0,
    )
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt))[0];

  if (!latestSet) return null;

  const recoveryContext = getRecoveryContext(readinessHistory);
  const shouldHold = recoveryContext === "repeated_low";
  const strategy = shouldHold ? "hold" : "progress";
  const recoveryExplanation =
    recoveryContext === "repeated_low"
      ? " Repeated low recovery check-ins hold the target steady today."
      : recoveryContext === "single_low"
        ? " One low recovery day does not override supported progression."
        : "";

  if (latestSet.performanceType === "time") {
    const current = latestSet.durationSeconds!;
    const next = shouldHold ? current : Math.max(current + 5, Math.round(current * 1.05));

    return {
      durationSeconds: next,
      explanation:
        (shouldHold
          ? `Hold at ${current} seconds and prioritize a clean, controlled effort.`
          : `Add a small duration challenge from ${current} to ${next} seconds.`) +
        recoveryExplanation,
      metricUnit: null,
      metricValue: null,
      performanceType: "time",
      recoveryContext,
      strategy,
    };
  }

  const current = latestSet.metricValue!;
  const next = shouldHold
    ? current
    : latestSet.performanceType === "rounds" ||
        latestSet.performanceType === "calories"
      ? current + 1
      : Math.round(current * 1.05 * 10) / 10;

  const label =
    latestSet.performanceType === "distance"
      ? latestSet.metricUnit ?? "meters"
      : latestSet.performanceType;

  return {
    durationSeconds: null,
    explanation:
      (shouldHold
        ? `Hold at ${current} ${label} and focus on execution.`
        : `Build gradually from ${current} to ${next} ${label}.`) +
      recoveryExplanation,
    metricUnit: latestSet.metricUnit,
    metricValue: next,
    performanceType: latestSet.performanceType,
    recoveryContext,
    strategy,
  };
}
