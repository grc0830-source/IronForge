export const ENTITLEMENT_KEYS = ["ai_coach"] as const;
export const ENTITLEMENT_STATUSES = [
  "active",
  "grace_period",
  "expired",
  "revoked",
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export type Entitlement = {
  entitlement_key: EntitlementKey;
  expires_at: string | null;
  status: EntitlementStatus;
};

export function isEntitlementActive(
  entitlement: Entitlement | null | undefined,
  now = new Date(),
): boolean {
  if (
    !entitlement ||
    !["active", "grace_period"].includes(entitlement.status)
  ) {
    return false;
  }

  if (!entitlement.expires_at) {
    return true;
  }

  const expiresAt = new Date(entitlement.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
}
