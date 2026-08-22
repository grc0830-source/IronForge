# Premium AI Coach Architecture

Fortomnia's deterministic workout recommendations, readiness insights, macro estimates, manual templates, and workout logging remain core product features. Conversational AI coaching and automatic program generation are planned as paid premium capabilities.

## Entitlement boundary

The `ai_coach` entitlement is stored in `public.user_entitlements`.

- Signed-in users may read only their own entitlement.
- Mobile clients cannot insert, update, or delete entitlements.
- Subscription verification must run in a trusted server environment.
- AI endpoints must check the entitlement again on the server for every request.
- Hiding or showing a button in the app is not an authorization boundary.

The entitlement supports active, billing grace-period, expired, and revoked states. Access also stops after `expires_at`, even if a stale row still says active.

## Planned purchase flow

1. The user purchases through Apple's App Store or Google Play.
2. A server receives and verifies the store transaction.
3. The server records the current product, source, expiration, and status.
4. The app refreshes the user's entitlement and unlocks the premium interface.
5. Every AI request rechecks access and applies usage limits before contacting an AI provider.

## Product split

### Core access

- Manual workout templates and logging
- Deterministic progression targets and explanations
- Recovery/readiness insights
- Editable nutrition estimates
- User-owned workout history

### Premium AI Coach

- Conversational coaching
- Personalized program and template generation
- Automatic program rebuilding
- Deeper trend interpretation
- Proactive training adjustments
- Athlete-inspired coaching context

Cancellation must never remove a user's workout history. Premium features should fall back gracefully to deterministic recommendations when access expires or the AI service is unavailable.

## Work still required

- Choose the subscription products and pricing
- Integrate StoreKit and Google Play Billing through an appropriate Expo-compatible service
- Add server-side receipt and webhook verification
- Add the protected AI Coach server endpoint
- Add cost limits, rate limits, privacy consent, and deletion behavior
- Build upgrade, restore-purchases, billing-status, and cancellation guidance screens
- Test renewals, refunds, billing grace periods, account transfers, and offline behavior
