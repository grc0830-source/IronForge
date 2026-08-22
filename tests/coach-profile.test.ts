import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCoachProfileSummary,
  getTemplateTargetDefaults,
  parseFavoriteAthletes,
} from "../src/lib/coachProfile.ts";

test("normalizes and deduplicates favorite athletes", () => {
  assert.deepEqual(
    parseFavoriteAthletes(
      " Arnold Schwarzenegger, Serena Williams, arnold schwarzenegger ",
    ),
    ["Arnold Schwarzenegger", "Serena Williams"],
  );
});

test("limits favorite-athlete inspirations to ten", () => {
  const athletes = Array.from(
    { length: 12 },
    (_, index) => `Athlete ${index + 1}`,
  );

  assert.equal(parseFavoriteAthletes(athletes.join(",")).length, 10);
});

test("builds an explainable coaching direction", () => {
  const summary = buildCoachProfileSummary(
    ["strength", "muscle"],
    "powerbuilding",
    ["Arnold Schwarzenegger"],
  );

  assert.match(summary, /build strength, build muscle/);
  assert.match(summary, /powerbuilding approach/);
  assert.match(summary, /Arnold Schwarzenegger/);
});

test("strength goals produce strength-oriented template defaults", () => {
  const defaults = getTemplateTargetDefaults(["strength"], "mixed");

  assert.equal(defaults.targetSets, 4);
  assert.equal(defaults.repMin, 3);
  assert.equal(defaults.repMax, 5);
});

test("bodybuilding style produces hypertrophy-oriented defaults", () => {
  const defaults = getTemplateTargetDefaults(
    ["general_fitness"],
    "bodybuilding",
  );

  assert.equal(defaults.repMin, 8);
  assert.equal(defaults.repMax, 12);
});
