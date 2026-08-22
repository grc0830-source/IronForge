import assert from "node:assert/strict";
import test from "node:test";

import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
} from "../src/lib/measurementUnits.ts";

test("converts body weight between kilograms and pounds", () => {
  assert.equal(kgToLb(80), 176.4);
  assert.equal(lbToKg(176.4), 80);
});

test("converts height between centimeters and feet/inches", () => {
  assert.deepEqual(cmToFeetInches(177.8), { feet: 5, inches: 10 });
  assert.equal(feetInchesToCm(5, 10), 177.8);
});

test("handles height rounding across the next foot", () => {
  assert.deepEqual(cmToFeetInches(182.8), { feet: 6, inches: 0 });
  assert.ok(Number.isNaN(feetInchesToCm(-1, 10)));
});
