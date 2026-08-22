export const TRAINING_GOALS = [
  "strength",
  "muscle",
  "fat_loss",
  "athleticism",
  "general_fitness",
] as const;

export const TRAINING_STYLES = [
  "bodybuilding",
  "powerlifting",
  "powerbuilding",
  "functional",
  "mixed",
] as const;

export type TrainingGoal = (typeof TRAINING_GOALS)[number];
export type TrainingStyle = (typeof TRAINING_STYLES)[number];

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  athleticism: "Athletic performance",
  fat_loss: "Fat loss",
  general_fitness: "General fitness",
  muscle: "Build muscle",
  strength: "Build strength",
};

export const TRAINING_STYLE_LABELS: Record<TrainingStyle, string> = {
  bodybuilding: "Bodybuilding",
  functional: "Functional",
  mixed: "Mixed",
  powerbuilding: "Powerbuilding",
  powerlifting: "Powerlifting",
};

export function parseFavoriteAthletes(value: string): string[] {
  const unique = new Map<string, string>();

  for (const item of value.split(",")) {
    const athlete = item.trim();

    if (athlete) {
      const normalizedName = athlete.toLocaleLowerCase();

      if (!unique.has(normalizedName)) {
        unique.set(normalizedName, athlete);
      }
    }
  }

  return [...unique.values()].slice(0, 10);
}

export function buildCoachProfileSummary(
  goals: TrainingGoal[],
  style: TrainingStyle,
  favoriteAthletes: string[],
): string {
  const goalText =
    goals.length > 0
      ? goals.map((goal) => TRAINING_GOAL_LABELS[goal]).join(", ")
      : "your selected goals";
  const inspirationText =
    favoriteAthletes.length > 0
      ? ` Inspiration: ${favoriteAthletes.join(", ")}.`
      : "";

  return (
    `Fortomnia will prioritize ${goalText.toLocaleLowerCase()} using a ` +
    `${TRAINING_STYLE_LABELS[style].toLocaleLowerCase()} approach.` +
    inspirationText
  );
}

export type TemplateTargetDefaults = {
  explanation: string;
  repMax: number;
  repMin: number;
  targetRir: number;
  targetSets: number;
};

export function getTemplateTargetDefaults(
  goals: TrainingGoal[],
  style: TrainingStyle,
): TemplateTargetDefaults {
  if (style === "powerlifting" || goals.includes("strength")) {
    return {
      explanation:
        "Lower reps and more working sets emphasize strength practice.",
      repMax: 5,
      repMin: 3,
      targetRir: 2,
      targetSets: 4,
    };
  }

  if (style === "bodybuilding" || goals.includes("muscle")) {
    return {
      explanation:
        "Moderate reps and controlled effort emphasize hypertrophy volume.",
      repMax: 12,
      repMin: 8,
      targetRir: 2,
      targetSets: 3,
    };
  }

  if (style === "functional" || goals.includes("athleticism")) {
    return {
      explanation:
        "Moderate reps leave room for quality, speed, and technical work.",
      repMax: 8,
      repMin: 5,
      targetRir: 3,
      targetSets: 3,
    };
  }

  if (goals.includes("fat_loss")) {
    return {
      explanation:
        "Moderate-to-high reps support training volume while dieting.",
      repMax: 15,
      repMin: 10,
      targetRir: 3,
      targetSets: 3,
    };
  }

  return {
    explanation:
      "A balanced rep range supports general strength and muscle development.",
    repMax: 10,
    repMin: 6,
    targetRir: 2,
    targetSets: 3,
  };
}
