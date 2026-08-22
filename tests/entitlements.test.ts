import assert from "node:assert/strict";
import test from "node:test";

import { isEntitlementActive } from "../src/lib/entitlements.ts";

const now = new Date("2026-08-21T12:00:00.000Z");

test("allows an active unexpired AI Coach entitlement", () => {
  assert.equal(
    isEntitlementActive(
      {
        entitlement_key: "ai_coach",
        expires_at: "2026-09-21T12:00:00.000Z",
        status: "active",
      },
      now,
    ),
    true,
  );
});

test("allows access during a server-approved billing grace period", () => {
  assert.equal(
    isEntitlementActive(
      {
        entitlement_key: "ai_coach",
        expires_at: "2026-08-22T12:00:00.000Z",
        status: "grace_period",
      },
      now,
    ),
    true,
  );
});

test("denies expired, revoked, and missing entitlements", () => {
  assert.equal(
    isEntitlementActive(
      {
        entitlement_key: "ai_coach",
        expires_at: "2026-08-20T12:00:00.000Z",
        status: "active",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isEntitlementActive(
      {
        entitlement_key: "ai_coach",
        expires_at: null,
        status: "revoked",
      },
      now,
    ),
    false,
  );
  assert.equal(isEntitlementActive(null, now), false);
});
