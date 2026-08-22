# Fortomnia Build Objectives

This document captures product objectives and backlog ideas for Fortomnia. Items are grouped for planning, not yet committed to a release. Final scope, priority, and acceptance criteria should be defined before implementation.

## Training intelligence and coaching

- Personalize AI-coach onboarding by asking about:
  - Primary training goals
  - Preferred training style
  - Favorite athletes or physique/performance inspirations
- Expand the exercise library.
- Support exercise targets based on either repetitions or time.
- Let users classify sets as warm-up or working sets.
- Support advanced set structures, including:
  - Drop sets
  - Supersets
- Add a clear **Next set** action from the exercise workflow.
- Group sets for the same exercise together within a workout.
- Define and explore an anabolic/catabolic feature. Possible interpretations must be evaluated before implementation, such as an educational recovery indicator, nutrition state, or training-readiness concept. It must not present unsupported medical claims.

## Nutrition

- Ask users how many meals they eat per day when setting nutrition goals.
- Allocate daily nutrition targets across the selected number of meals instead of assuming breakfast, lunch, and dinner.
- Support calorie goals that vary by day.
- Add barcode scanning for foods.

## Supplements

- Add barcode scanning for supplements.
- Clear the supplement form after successful submission.
- Support selecting multiple supplement schedule days and recurring patterns, including examples such as Monday/Wednesday/Friday.
- Define what **biweekly** means in scheduling before implementation: twice per week or every two weeks.

## Forms and workflow quality

- Fix the custom-exercise form so it clears after successful submission.
- Verify that failed submissions retain the user's entered values.
- Keep exercise and supplement form behavior consistent.

## Notifications

Add configurable reminders for:

- Meals and nutrition logging
- Supplements
- Workouts
- End-of-day review/check-in

Notification design must include permission handling, time-zone behavior, quiet hours, per-category controls, and clear opt-out settings.

## Health integrations

- Add Apple HealthKit integration.
- Define the first data types to read or write before implementation.
- Evaluate the corresponding Android health integration so platform support remains intentional.

## Gym and equipment collaboration

- Add gym-specific features; define the concrete member and gym-operator workflows before implementation.
- Let users select the equipment available at their gym.
- Use equipment availability to filter exercises and personalize workout recommendations.
- Explore collaboration features for participating gyms, without coupling core workout tracking to a specific facility.

## Proposed delivery sequence

### Milestone 14 — Training intelligence

- Exercise grouping within workouts
- Warm-up versus working-set classification
- Rep- or time-based exercise targets
- Next-set workflow
- Drop-set and superset foundations
- AI-coach goal discovery and explainable recommendations

### Near-term product quality

- Clear custom-exercise and supplement forms after successful submission
- Multi-day supplement scheduling
- Meal-count-based nutrition targets
- Variable calorie goals
- Notification foundations

### Platform and expansion work

- Food and supplement barcode scanning
- HealthKit and Android health integration
- Exercise-library expansion
- Gym equipment selection and collaboration features
- Anabolic/catabolic concept discovery and safety review

## Definition questions

Before these objectives become implementation tickets, resolve:

1. Which AI-coach goals and athlete inspirations should affect programming, and how?
2. Should time-based exercises use total duration, intervals, or both?
3. How should supersets and drop sets affect progression recommendations?
4. Does biweekly mean twice weekly, every two weeks, or should both be supported?
5. Which nutrition values should be distributed per meal: calories only or all macros?
6. Which HealthKit data should Fortomnia read, write, or both?
7. What does a “specific gym” collaboration need to provide beyond equipment availability?
8. What user benefit is intended by “anabolic/catabolic,” and can it be delivered without implying a medical measurement?
