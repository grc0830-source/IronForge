# Milestone 14 Device Test Matrix

Use the exact commit and build identifiers intended for release. Record Pass, Fail, or Blocked for every row; do not treat the frozen Milestone 13 submission as coverage for Milestone 14.

## Build record

| Item | iPhone | Android |
| --- | --- | --- |
| Commit SHA |  |  |
| EAS build ID |  |  |
| App version/build number |  |  |
| Device and OS version |  |  |
| Tester |  |  |
| Test date |  |  |

## Installation and startup

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Clean install succeeds |  |  |  |
| App icon and splash render correctly |  |  |  |
| Cold launch succeeds |  |  |  |
| Returning from background restores the session |  |  |  |
| Airplane-mode launch shows a recoverable state |  |  |  |
| Reconnecting restores data without restarting |  |  |  |

## Account lifecycle

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Create a fresh account |  |  |  |
| Confirm email and return to Fortomnia |  |  |  |
| Sign in and sign out |  |  |  |
| Request and complete password reset |  |  |  |
| Reinstall and restore an existing session |  |  |  |
| Delete the test account and verify sign-out |  |  |  |

## Training intelligence

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Generate or open a workout template |  |  |  |
| Exercise cards show today’s targets |  |  |  |
| “Log recommended set” prefills correctly |  |  |  |
| Strength target feedback is correct |  |  |  |
| Time target feedback is correct |  |  |  |
| Distance target feedback is correct |  |  |  |
| Calorie target feedback is correct |  |  |  |
| Round target feedback is correct |  |  |  |
| Warm-ups and drop sets are not evaluated |  |  |  |
| Low-readiness targets hold conservatively |  |  |  |
| Completing a workout shows the recap |  |  |  |
| Recap totals and next direction are correct |  |  |  |

## Measurements and forms

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Imperial profile preference saves |  |  |  |
| Nutrition accepts pounds and feet/inches |  |  |  |
| Metric profile and nutrition values save |  |  |  |
| Switching systems converts existing values |  |  |  |
| Keyboard does not hide active fields or buttons |  |  |  |
| Forms remain usable with large accessibility text |  |  |  |

## Release decision

Release only when every critical row passes on both platforms, the exact commit passes GitHub Actions, and no unresolved crash, data-loss, authentication, or account-deletion defect remains.

- iPhone approval: ____________________
- Android approval: ____________________
- Final approved commit: ____________________
- Release decision/date: ____________________
