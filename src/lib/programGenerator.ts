import type {
  Exercise,
  ExerciseMovementPattern,
} from "../hooks/useExercises";
import {
  equipmentIsAvailable,
  type EquipmentOption,
} from "./equipment.ts";
import {
  getTemplateTargetDefaults,
  type TrainingGoal,
  type TrainingStyle,
} from "./coachProfile.ts";

type ProgramExercise = {
  exerciseId: string;
  exerciseName: string;
  explanation: string;
  position: number;
  repMax: number;
  repMin: number;
  targetRir: number;
  targetSets: number;
};

export type GeneratedTemplate = {
  explanation: string;
  exercises: ProgramExercise[];
  name: string;
};

type DayDefinition = {
  name: string;
  patterns: ExerciseMovementPattern[];
};

const PROGRAM_SPLITS: Record<number, DayDefinition[]> = {
  2: [
    {
      name: "Full Body A",
      patterns: ["squat", "horizontal_push", "horizontal_pull", "hinge", "vertical_pull"],
    },
    {
      name: "Full Body B",
      patterns: ["hinge", "vertical_push", "vertical_pull", "lunge", "horizontal_pull"],
    },
  ],
  3: [
    {
      name: "Full Body A",
      patterns: ["squat", "horizontal_push", "horizontal_pull", "hinge", "isolation"],
    },
    {
      name: "Full Body B",
      patterns: ["hinge", "vertical_push", "vertical_pull", "lunge", "isolation"],
    },
    {
      name: "Full Body C",
      patterns: ["squat", "horizontal_push", "horizontal_pull", "lunge", "vertical_pull"],
    },
  ],
  4: [
    {
      name: "Upper A",
      patterns: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "isolation"],
    },
    {
      name: "Lower A",
      patterns: ["squat", "hinge", "lunge", "isolation"],
    },
    {
      name: "Upper B",
      patterns: ["vertical_push", "vertical_pull", "horizontal_push", "horizontal_pull", "isolation"],
    },
    {
      name: "Lower B",
      patterns: ["hinge", "squat", "lunge", "isolation"],
    },
  ],
  5: [
    {
      name: "Push",
      patterns: ["horizontal_push", "vertical_push", "isolation", "isolation"],
    },
    {
      name: "Pull",
      patterns: ["horizontal_pull", "vertical_pull", "isolation", "isolation"],
    },
    {
      name: "Legs",
      patterns: ["squat", "hinge", "lunge", "isolation", "isolation"],
    },
    {
      name: "Upper",
      patterns: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "isolation"],
    },
    {
      name: "Lower",
      patterns: ["hinge", "squat", "lunge", "isolation"],
    },
  ],
};

export function generateWorkoutProgram(
  exercises: Exercise[],
  daysPerWeek: number,
  goals: TrainingGoal[],
  style: TrainingStyle,
  availableEquipment: EquipmentOption[] = ["full_gym"],
): GeneratedTemplate[] {
  const days = PROGRAM_SPLITS[daysPerWeek];

  if (!days) {
    throw new RangeError("Choose between 2 and 5 training days.");
  }

  const available = exercises
    .filter(
      (exercise) =>
        !exercise.is_archived &&
        equipmentIsAvailable(exercise.equipment, availableEquipment),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (available.length < 4) {
    throw new RangeError(
      "At least four exercises matching your equipment are required.",
    );
  }

  const target = getTemplateTargetDefaults(goals, style);
  const patternCursor = new Map<ExerciseMovementPattern, number>();

  return days.map((day) => {
    const selectedIds = new Set<string>();
    const selected = day.patterns.flatMap((pattern) => {
      const matches = available.filter(
        (exercise) =>
          exercise.movement_pattern === pattern &&
          !selectedIds.has(exercise.id),
      );
      const fallback = available.filter(
        (exercise) => !selectedIds.has(exercise.id),
      );
      const candidates = matches.length > 0 ? matches : fallback;

      if (candidates.length === 0) {
        return [];
      }

      const cursor = patternCursor.get(pattern) ?? 0;
      const exercise = candidates[cursor % candidates.length];
      patternCursor.set(pattern, cursor + 1);
      selectedIds.add(exercise.id);

      const isIsolation = exercise.movement_pattern === "isolation";
      return [{
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        explanation:
          matches.length > 0
            ? `Selected for the ${pattern.replaceAll("_", " ")} movement pattern.`
            : "Selected as the best available exercise to complete the session.",
        position: selectedIds.size,
        repMax: isIsolation ? Math.max(12, target.repMax) : target.repMax,
        repMin: isIsolation ? Math.max(8, target.repMin) : target.repMin,
        targetRir: target.targetRir,
        targetSets: isIsolation ? Math.min(3, target.targetSets) : target.targetSets,
      }];
    });

    return {
      explanation: `${target.explanation} This day balances ${day.patterns
        .map((pattern) => pattern.replaceAll("_", " "))
        .join(", ")}.`,
      exercises: selected,
      name: `Fortomnia ${day.name}`,
    };
  });
}
