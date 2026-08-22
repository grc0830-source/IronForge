import assert from "node:assert/strict";
import test from "node:test";

import { getMacroRecommendation } from "../src/lib/macroRecommendation.ts";

test("builds a complete maintenance macro estimate", () => {
  const result = getMacroRecommendation({
    activityLevel: "moderate",
    age: 35,
    calorieDirection: "maintain",
    equationSex: "male",
    heightCm: 180,
    trainingGoals: ["strength"],
    weightKg: 90,
  });

  assert.ok(result.calories > 2000);
  assert.equal(result.proteinGrams, 162);
  assert.ok(result.carbsGrams > 0);
  assert.ok(result.fatGrams > 0);
  assert.ok(result.fiberGrams > 0);
});

test("uses a higher protein factor during fat loss", () => {
  const result = getMacroRecommendation({
    activityLevel: "light",
    age: 40,
    calorieDirection: "lose",
    equationSex: "female",
    heightCm: 165,
    trainingGoals: ["fat_loss"],
    weightKg: 70,
  });

  assert.equal(result.proteinGrams, 140);
});

test("rejects questionnaire values outside adult guardrails", () => {
  assert.throws(
    () =>
      getMacroRecommendation({
        activityLevel: "moderate",
        age: 17,
        calorieDirection: "maintain",
        equationSex: "male",
        heightCm: 175,
        trainingGoals: ["general_fitness"],
        weightKg: 75,
      }),
    /Age/,
  );
});
