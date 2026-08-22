import type { TrainingGoal } from "./coachProfile";

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "very_active",
] as const;
export const CALORIE_DIRECTIONS = ["lose", "maintain", "gain"] as const;

export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type CalorieDirection = (typeof CALORIE_DIRECTIONS)[number];
export type EquationSex = "female" | "male";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  light: "Lightly active",
  moderate: "Moderately active",
  sedentary: "Mostly sedentary",
  very_active: "Very active",
};

export const CALORIE_DIRECTION_LABELS: Record<CalorieDirection, string> = {
  gain: "Gain gradually",
  lose: "Lose gradually",
  maintain: "Maintain",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  light: 1.375,
  moderate: 1.55,
  sedentary: 1.2,
  very_active: 1.725,
};

export type MacroRecommendationInput = {
  activityLevel: ActivityLevel;
  age: number;
  calorieDirection: CalorieDirection;
  equationSex: EquationSex;
  heightCm: number;
  trainingGoals: TrainingGoal[];
  weightKg: number;
};

export type MacroRecommendation = {
  calories: number;
  carbsGrams: number;
  explanation: string;
  fatGrams: number;
  fiberGrams: number;
  proteinGrams: number;
};

export function getMacroRecommendation(
  input: MacroRecommendationInput,
): MacroRecommendation {
  if (!Number.isInteger(input.age) || input.age < 18 || input.age > 100) {
    throw new RangeError("Age must be from 18 to 100.");
  }
  if (!Number.isFinite(input.heightCm) || input.heightCm < 120 || input.heightCm > 230) {
    throw new RangeError("Height must be from 120 to 230 cm.");
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 30 || input.weightKg > 350) {
    throw new RangeError("Weight must be from 30 to 350 kg.");
  }

  const sexConstant = input.equationSex === "male" ? 5 : -161;
  const restingCalories =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.age +
    sexConstant;
  const maintenance =
    restingCalories * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const directionMultiplier =
    input.calorieDirection === "lose"
      ? 0.9
      : input.calorieDirection === "gain"
        ? 1.1
        : 1;
  const calories = Math.round(maintenance * directionMultiplier);
  const proteinFactor =
    input.calorieDirection === "lose"
      ? 2
      : input.trainingGoals.includes("muscle") ||
          input.trainingGoals.includes("strength")
        ? 1.8
        : 1.6;
  const proteinGrams = Math.round(input.weightKg * proteinFactor);
  const fatGrams = Math.round((calories * 0.25) / 9);
  const carbsGrams = Math.max(
    0,
    Math.round((calories - proteinGrams * 4 - fatGrams * 9) / 4),
  );
  const fiberGrams = Math.round((calories / 1000) * 14);

  return {
    calories,
    carbsGrams,
    explanation:
      "Estimated with Mifflin–St Jeor, an activity multiplier, a 10% goal adjustment, and training-focused protein. Treat this as a starting point and adjust from real trends.",
    fatGrams,
    fiberGrams,
    proteinGrams,
  };
}
