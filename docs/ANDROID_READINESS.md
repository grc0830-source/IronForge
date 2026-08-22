# Android Readiness

This checklist tracks Android work for the Fortomnia app in the `ironforge` Expo project.

## Confirmed application identity

- Expo owner: `body-app`
- Expo slug: `ironforge`
- EAS project ID: `48a69035-01c0-431f-8543-f47065f75bba`
- Android application ID: `com.grc0830source.fortomnia`
- Display name: Fortomnia
- Custom URL scheme: `fortomnia`

The Android application ID becomes permanent after the first Google Play upload. Confirm it again before creating the Play Console application. Do not use the separate `IronForgeApp` Expo project for these builds.

## Build profiles

### Internal device build

The `android-preview` profile creates an APK that can be installed directly on Android devices:

```sh
eas build --platform android --profile android-preview
```

This is the next build to create. It does not publish to Google Play.

### Google Play build

The `android-production` profile creates an Android App Bundle for Google Play:

```sh
eas build --platform android --profile android-production
```

Do not submit this build until internal device testing is complete and the Play Console listing is ready.

## Internal test pass

Test on at least one physical Android phone and, when practical, a current Android emulator.

- [ ] Install, launch, background, resume, and cold-start the app
- [ ] Create an account, sign in, sign out, and restore an existing session
- [ ] Verify password reset and custom-scheme links
- [ ] Start, resume, and complete a workout
- [ ] Add, edit, and delete sets
- [ ] Verify the previous-set and next-target cards
- [ ] Verify progression, hold, and recovery recommendations
- [ ] Exercise Android system back navigation throughout the app
- [ ] Exercise the keyboard on every form and confirm fields/buttons remain reachable
- [ ] Check small-screen layout, status-bar spacing, and edge-to-edge content
- [ ] Verify pounds and kilograms
- [ ] Verify offline and failed-network states
- [ ] Verify account deletion and privacy/support links
- [ ] Confirm the launcher icon, adaptive icon mask, splash screen, and dark theme

Record device model, Android version, build URL, and any defects for each pass.

## Google Play preparation

- [ ] Create the Play Console application using `com.grc0830source.fortomnia`
- [ ] Complete app access instructions for authenticated content
- [ ] Complete Data safety using the same actual data practices as the iOS privacy disclosures
- [ ] Complete content rating and target-audience declarations
- [ ] Add privacy-policy and account-deletion URLs
- [ ] Prepare phone screenshots, short description, full description, and feature graphic
- [ ] Upload the production app bundle to Internal testing first
- [ ] Add testers and complete an internal test pass
- [ ] Review Google Play testing requirements before planning production release
- [ ] Promote through closed/open testing only after defects are resolved

## Release gate

Android is ready for broader testing only when:

1. GitHub quality checks pass.
2. The internal APK passes the test checklist.
3. The production app bundle uploads without signing or manifest errors.
4. Authentication, workout logging, and training recommendations behave consistently with iOS.
5. Privacy, account deletion, and Play Console declarations are complete and accurate.
