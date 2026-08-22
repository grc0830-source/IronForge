# Fortomnia Release Readiness

Last updated: August 21, 2026

## Automated validation

- [x] TypeScript compilation passes with `npx tsc --noEmit`.
- [x] Expo Doctor passes all 18 checks.
- [x] Automated decision-engine tests pass.
- [x] Progression logic is covered by tests.
- [x] Readiness scoring is covered by tests.
- [x] Supplement scheduling is covered by tests.
- [x] Add automated checks to GitHub Actions.

## Data security

- [x] Row-level security is enabled on every public app table.
- [x] Every public app table has appropriate RLS policies.
- [x] Anonymous and public table privileges were reviewed.
- [x] User-owned records cascade when an account is deleted.
- [x] No service-role keys or private keys are tracked.
- [x] Only `.env.example` is tracked by Git.
- [x] Secure account deletion is available in the app.
- [x] Re-test account deletion using the final release build.

## Dependencies

- [x] Applied all compatible non-breaking npm security updates.
- [x] Updated `brace-expansion` to the patched version.
- [x] Confirmed Expo SDK 54 dependencies are compatible.
- [x] Re-ran tests, TypeScript, and Expo Doctor after updates.
- [ ] Upgrade Expo in a dedicated future milestone.
- [ ] Re-evaluate remaining transitive audit findings after upgrading Expo.

The remaining npm audit findings are inherited through Expo and Metro build tooling. Resolving them currently requires the breaking Expo 57 upgrade. Do not use `npm audit fix --force` on the SDK 54 release branch.

## Account lifecycle

- [x] Account registration works.
- [x] Email confirmation works.
- [x] Sign-in and sign-out work.
- [x] Account deletion works.
- [x] User-owned database records use deletion cascades.
- [x] Merge and complete the password-recovery release flow.
- [x] Test password recovery in the final native build.

## App functionality

- [x] Complete a workout and verify workout history.
- [x] Create, edit, archive, and reuse a workout template.
- [x] Create and archive a custom exercise.
- [x] Add, edit, and delete nutrition entries.
- [x] Update nutrition goals.
- [x] Create, edit, log, skip, and archive a supplement protocol.
- [x] Create and update a recovery check-in.
- [x] Verify readiness scores and seven-day recovery history.
- [x] Confirm body-weight values and units display correctly.
- [x] Verify pull-to-refresh behavior on primary screens.
- [x] Verify empty, loading, error, and offline states.

## iPhone beta testing

- [x] Create a new iOS internal build from the release candidate.
- [x] Install and launch the build on a physical iPhone.
- [x] Verify the Fortomnia icon and splash screen.
- [x] Test a fresh account from registration through deletion.
- [x] Test an existing account after reinstalling the app.
- [x] Test keyboard behavior and scrolling on every form.
- [x] Test light and dark device settings.
- [x] Test with larger accessibility text.
- [x] Check VoiceOver labels on important controls.
- [ ] Verify layouts on at least one smaller iPhone.
- [x] Record all release-blocking defects: none found.

## App Store preparation

- [x] App name, emblem, icons, and tagline are prepared.
- [x] App Store metadata draft exists.
- [x] Privacy policy draft exists.
- [x] Terms of Use draft exists.
- [x] Support and account-deletion documents exist.
- [x] Encryption exemption is declared in the Expo configuration.
- [x] Replace the support email placeholder in every policy.
- [x] Enter legal-owner and App Review details directly in App Store Connect; keep private review credentials out of the repository.
- [ ] Obtain appropriate legal review of public policies.
- [ ] Publish privacy, terms, support, and deletion pages.
- [x] Create final App Store screenshots.
- [x] Complete Apple App Privacy answers.
- [ ] Add the App Store support and privacy URLs.
- [x] Prepare and verify the App Review account.
- [x] Upload the release candidate to TestFlight.
- [ ] Complete external TestFlight testing.
- [ ] Submit the approved build for App Review.

## Brand and website

- [x] `fortomnia.com` is secured.
- [ ] Secure additional priority Fortomnia domains.
- [ ] Complete trademark review and filing.
- [x] Create the Fortomnia website.
- [x] Connect fortomnia.com and validate HTTPS.
- [ ] Publish public legal and support pages.
- [x] Configure a monitored support email address.
- [x] Configure domain email authentication and delivery.
- [ ] Add website and policy URLs to App Store Connect.

## Milestone 14 release-candidate verification

The checked iPhone items above describe the frozen Milestone 13 App Store submission. Milestone 14 adds training intelligence, Android support, multi-metric workouts, Imperial measurements, post-set feedback, and workout recaps. These changes require a fresh device pass before release.

- [x] GitHub Actions passes on the current Milestone 14 branch.
- [x] Android preview and production build profiles are explicit.
- [x] Multi-metric progression and feedback have automated coverage.
- [x] Imperial/Metric conversions have automated coverage.
- [ ] Install the exact Milestone 14 release build on a physical iPhone.
- [ ] Install the exact Milestone 14 preview build on a physical Android phone.
- [ ] Complete the cross-platform smoke matrix in `docs/MILESTONE_14_DEVICE_TEST_MATRIX.md`.
- [ ] Verify a fresh account, email confirmation, password reset, sign-out, and account deletion on the release build.
- [ ] Verify coaching targets, post-set feedback, workout completion, and recap on both platforms.
- [ ] Verify Imperial and Metric profile/nutrition flows on both platforms.
- [ ] Test airplane-mode launch and recovery after reconnecting.
- [ ] Record and resolve every release-blocking defect.
- [ ] Tag the exact approved commit used for store builds.

## Release approval

The release candidate is ready for App Store submission only when:

- All release-blocking items above are complete.
- Automated checks pass on the exact submitted commit.
- Physical-device beta testing passes.
- Public legal and support URLs are live.
- No unresolved critical or high-risk application defects remain.
