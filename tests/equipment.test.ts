import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyEquipment,
  equipmentIsAvailable,
} from "../src/lib/equipment.ts";

test("classifies functional and cardio equipment", () => {
  assert.equal(classifyEquipment("Medicine Ball"), "functional");
  assert.equal(classifyEquipment("Plyo Box"), "functional");
  assert.equal(classifyEquipment("SkiErg"), "cardio");
});

test("unknown custom equipment requires full-gym access", () => {
  assert.equal(equipmentIsAvailable("Specialty Device", ["bodyweight"]), false);
  assert.equal(equipmentIsAvailable("Specialty Device", ["full_gym"]), true);
});
