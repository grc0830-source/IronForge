import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ExercisePicker } from "../components/ExercisePicker";
import { useExercises } from "../hooks/useExercises";
import { useProfile } from "../hooks/useProfile";
import { usePreviousExerciseSet } from "../hooks/usePreviousExerciseSet";
import { useRecoveryCheckIns } from "../hooks/useRecoveryCheckIns";
import {
  defaultMetricUnit,
  DISTANCE_UNITS,
  PERFORMANCE_LABELS,
  PERFORMANCE_TYPES,
  type MetricUnit,
  type PerformanceType,
} from "../lib/performanceMetrics";
import {
  DEFAULT_PROGRESSION_RULES,
  getExerciseRecommendation,
  getMetricProgressionRecommendation,
} from "../lib/progression";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function AddSetScreen() {
  const router = useRouter();
    const {
    exerciseId: initialExerciseId,
    durationSeconds: initialDurationSeconds,
    id,
    metricUnit: initialMetricUnit,
    metricValue: initialMetricValue,
    parentSetId: initialParentSetId,
    performanceType: initialPerformanceType,
    repMax: initialRepMax,
    repMin: initialRepMin,
    reps: initialReps,
    rir: initialRir,
    setId,
    setType: initialSetType,
    setVariant: initialSetVariant,
    weight: initialWeight,
  } = useLocalSearchParams<{
    durationSeconds?: string;
    exerciseId?: string;
    id: string;
    metricUnit?: MetricUnit;
    metricValue?: string;
    parentSetId?: string;
    performanceType?: PerformanceType;
    repMax?: string;
    repMin?: string;
    reps?: string;
    rir?: string;
    setId?: string;
    setType?: "warmup" | "working";
    setVariant?: "standard" | "drop";
    weight?: string;
  }>();

  const workoutId = Array.isArray(id) ? id[0] : id;
  const editingSetId = Array.isArray(setId) ? setId[0] : setId;
  const isEditing = Boolean(editingSetId);

  const { session } = useAuth();
  const { exercises, isLoading } = useExercises();
  const { profile } = useProfile();
  const { days: recoveryDays } = useRecoveryCheckIns();

  const [exerciseId, setExerciseId] = useState<string | null>(
    initialExerciseId ?? null,
  );
  const parentSetId = Array.isArray(initialParentSetId)
    ? initialParentSetId[0]
    : initialParentSetId;
  const [setVariant, setSetVariant] = useState<"standard" | "drop">(
    initialSetVariant === "drop" ? "drop" : "standard",
  );
  const [performanceType, setPerformanceType] = useState<PerformanceType>(
    PERFORMANCE_TYPES.includes(initialPerformanceType as PerformanceType)
      ? (initialPerformanceType as PerformanceType)
      : "reps",
  );
  const [metricValue, setMetricValue] = useState(initialMetricValue ?? "");
  const [metricUnit, setMetricUnit] = useState<MetricUnit>(
    initialMetricUnit ?? "meters",
  );
  const [durationSeconds, setDurationSeconds] = useState(
    initialDurationSeconds ?? "",
  );
  const [setType, setSetType] = useState<"warmup" | "working">(
    initialSetType === "warmup" ? "warmup" : "working",
  );
  const [weight, setWeight] = useState(initialWeight ?? "0");
  const [reps, setReps] = useState(initialReps ?? "");
  const [rir, setRir] = useState(initialRir ?? "2");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    isLoadingPrevious,
    previousError,
    previousSet,
    previousSets,
  } = usePreviousExerciseSet(exerciseId, workoutId, performanceType);

  const parsedRepMin = initialRepMin === undefined
    ? undefined
    : Number(initialRepMin);
  const parsedRepMax = initialRepMax === undefined
    ? undefined
    : Number(initialRepMax);
  const progressionSuggestion = getExerciseRecommendation(
    previousSets.map((set) => ({
      performedAt: set.performed_at,
      reps: set.reps,
      repsInReserve: set.reps_in_reserve,
      sessionId: set.session_id,
      weight: set.weight,
      weightUnit: set.weight_unit,
    })),
    {
      repMax:
        parsedRepMax !== undefined && Number.isFinite(parsedRepMax)
          ? parsedRepMax
          : undefined,
      repMin:
        parsedRepMin !== undefined && Number.isFinite(parsedRepMin)
          ? parsedRepMin
          : undefined,
    },
    DEFAULT_PROGRESSION_RULES,
    recoveryDays.map((day) => ({
      band: day.readiness.band,
      checkinDate: day.checkin_date,
      score: day.readiness.score,
    })),
  );
  const metricProgressionSuggestion =
    performanceType === "reps"
      ? null
      : getMetricProgressionRecommendation(
          previousSets.map((set) => ({
            durationSeconds: set.duration_seconds,
            metricUnit: set.metric_unit,
            metricValue: set.metric_value,
            performedAt: set.performed_at,
            performanceType: set.performance_type as
              | "time"
              | "distance"
              | "calories"
              | "rounds",
          })),
          recoveryDays.map((day) => ({
            band: day.readiness.band,
            checkinDate: day.checkin_date,
            score: day.readiness.score,
          })),
        );

  function applyProgressionSuggestion() {
    if (!progressionSuggestion) {
      return;
    }

    setWeight(String(progressionSuggestion.weight));
    setReps(String(progressionSuggestion.reps));
  }

  function applyMetricProgressionSuggestion() {
    if (!metricProgressionSuggestion) return;

    if (metricProgressionSuggestion.performanceType === "time") {
      setDurationSeconds(
        String(metricProgressionSuggestion.durationSeconds ?? ""),
      );
    } else {
      setMetricValue(String(metricProgressionSuggestion.metricValue ?? ""));
      if (metricProgressionSuggestion.metricUnit) {
        setMetricUnit(metricProgressionSuggestion.metricUnit);
      }
    }
  }

   useEffect(() => {
    if (!exerciseId && exercises.length > 0) {
      setExerciseId(exercises[0].id);
    }
  }, [exerciseId, exercises]);

  async function handleSave() {
    if (!session?.user.id || !workoutId || !exerciseId) {
      setErrorMessage("Workout, user, or exercise is missing.");
      return;
    }

    if (setVariant === "drop" && !parentSetId) {
      setErrorMessage(
        "Start a drop set from an existing working set so it stays linked.",
      );
      return;
    }

    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    const parsedDurationSeconds = Number(durationSeconds);
    const parsedMetricValue = Number(metricValue);
    const parsedRir = rir.trim() === "" ? null : Number(rir);

    if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setErrorMessage("Weight must be zero or greater.");
      return;
    }

    if (
      performanceType === "reps" &&
      (!Number.isInteger(parsedReps) || parsedReps <= 0)
    ) {
      setErrorMessage("Reps must be a positive whole number.");
      return;
    }

    if (
      performanceType === "time" &&
      (!Number.isInteger(parsedDurationSeconds) ||
        parsedDurationSeconds <= 0)
    ) {
      setErrorMessage("Duration must be a positive whole number of seconds.");
      return;
    }

    if (
      ["distance", "calories", "rounds"].includes(performanceType) &&
      (!Number.isFinite(parsedMetricValue) || parsedMetricValue <= 0)
    ) {
      setErrorMessage("Metric value must be greater than zero.");
      return;
    }

    const savedMetricValue =
      ["distance", "calories", "rounds"].includes(performanceType)
        ? parsedMetricValue
        : null;
    const savedMetricUnit =
      performanceType === "distance"
        ? metricUnit
        : defaultMetricUnit(performanceType);

    const savedReps = performanceType === "reps" ? parsedReps : 1;
    const savedDuration =
      performanceType === "time" ? parsedDurationSeconds : null;

    if (
      parsedRir !== null &&
      (!Number.isInteger(parsedRir) ||
        parsedRir < 0 ||
        parsedRir > 10)
    ) {
      setErrorMessage("RIR must be a whole number from 0 to 10.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

        const { data: activeWorkout, error: workoutError } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", session.user.id)
      .is("completed_at", null)
      .maybeSingle();

    if (workoutError || !activeWorkout) {
      setErrorMessage(
        workoutError?.message ?? "Completed workouts cannot be changed.",
      );
      setIsSaving(false);
      return;
    }

    if (isEditing && editingSetId) {
      const { data, error } = await supabase
        .from("workout_sets")
        .update({
          duration_seconds: savedDuration,
          metric_unit: savedMetricUnit,
          metric_value: savedMetricValue,
          exercise_id: exerciseId,
          parent_set_id: setVariant === "drop" ? parentSetId : null,
          performance_type: performanceType,
          reps: savedReps,
          reps_in_reserve: parsedRir,
          set_type: setType,
          set_variant: setVariant,
          weight: parsedWeight,
          weight_unit: profile?.preferred_weight_unit ?? "lb",
        })
        .eq("id", editingSetId)
        .eq("session_id", workoutId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "The set was not updated.",
        );
        return;
      }

      router.replace({
        pathname: "/workout/[id]",
        params: { id: workoutId },
      });
      return;
    }
      const { data: latestSet, error: latestSetError } =
      await supabase
        .from("workout_sets")
        .select("set_number")
        .eq("session_id", workoutId)
        .eq("exercise_id", exerciseId)
        .order("set_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestSetError) {
      setErrorMessage(latestSetError.message);
      setIsSaving(false);
      return;
    }

    const nextSetNumber = (latestSet?.set_number ?? 0) + 1;

    const { error } = await supabase
      .from("workout_sets")
      .insert({
        duration_seconds: savedDuration,
        metric_unit: savedMetricUnit,
        metric_value: savedMetricValue,
        exercise_id: exerciseId,
        parent_set_id: setVariant === "drop" ? parentSetId : null,
        performance_type: performanceType,
        reps: savedReps,
        reps_in_reserve: parsedRir,
        session_id: workoutId,
        set_number: nextSetNumber,
        set_type: setType,
        set_variant: setVariant,
        user_id: session.user.id,
        weight: parsedWeight,
        weight_unit: profile?.preferred_weight_unit ?? "lb",
      });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace({
      pathname: "/workout/[id]",
      params: { id: workoutId },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
  automaticallyAdjustKeyboardInsets
  contentContainerStyle={styles.content}
  keyboardDismissMode="interactive"
  keyboardShouldPersistTaps="handled"
        >
        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/workout/[id]",
              params: { id: workoutId },
            })
          }
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Workout</Text>
        </Pressable>

                  <Text style={styles.eyebrow}>FORTOMNIA</Text>
          <Text style={styles.title}>
            {isEditing ? "Edit set" : "Log set"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Correct the exercise or performance values."
              : "Choose an exercise and record your performance."}
          </Text>

        <Text style={styles.label}>Exercise</Text>

          <ExercisePicker
          exercises={exercises}
          onSelect={setExerciseId}
          selectedExerciseId={exerciseId}
        />
        {setVariant === "drop" ? (
          <View style={styles.dropSetBanner}>
            <Text style={styles.dropSetEyebrow}>DROP SET</Text>
            <Text style={styles.dropSetText}>
              This set is linked to the working set you selected.
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Performance</Text>
        <View style={styles.setTypeOptions}>
          {PERFORMANCE_TYPES.map((option) => (
            <Pressable
              key={option}
              onPress={() => setPerformanceType(option)}
              style={[
                styles.setTypeButton,
                performanceType === option && styles.setTypeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.setTypeText,
                  performanceType === option && styles.setTypeTextSelected,
                ]}
              >
                {PERFORMANCE_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Set type</Text>
        <View style={styles.setTypeOptions}>
          {(["warmup", "working"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setSetType(option)}
              style={[
                styles.setTypeButton,
                setType === option && styles.setTypeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.setTypeText,
                  setType === option && styles.setTypeTextSelected,
                ]}
              >
                {option === "warmup" ? "Warm-up" : "Working"}
              </Text>
            </Pressable>
          ))}
        </View>
                  <View style={styles.previousCard}>
            <Text style={styles.previousEyebrow}>PREVIOUS SET</Text>

            {isLoadingPrevious ? (
              <ActivityIndicator color="#F97316" size="small" />
            ) : previousError ? (
              <Text style={styles.previousError}>{previousError}</Text>
            ) : previousSet ? (
              <>
                <Text style={styles.previousPerformance}>
                  {previousSet.weight} {previousSet.weight_unit} ×{" "}
                  {previousSet.reps} reps
                </Text>
                <Text style={styles.previousDetails}>
                  {new Date(
                    previousSet.performed_at,
                  ).toLocaleDateString()}
                  {previousSet.reps_in_reserve !== null
                    ? ` • ${previousSet.reps_in_reserve} RIR`
                    : ""}
                </Text>
              </>
            ) : (
              <Text style={styles.previousEmpty}>
                No previous workout data for this exercise.
              </Text>
            )}
          </View>
                  {!isEditing && performanceType === "reps" && progressionSuggestion ? (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionEyebrow}>
                {progressionSuggestion.strategy === "deload"
                  ? "RECOVERY TARGET"
                  : progressionSuggestion.recoveryContext === "repeated_low"
                    ? "RECOVERY-AWARE TARGET"
                    : "NEXT TARGET"}
              </Text>
              <Text style={styles.suggestionPerformance}>
                {progressionSuggestion.weight}{" "}
                {progressionSuggestion.weightUnit} ×{" "}
                {progressionSuggestion.reps} reps
              </Text>
              <Text style={styles.suggestionExplanation}>
                {progressionSuggestion.explanation}
              </Text>

              <Pressable
                onPress={applyProgressionSuggestion}
                style={styles.useTargetButton}
              >
                <Text style={styles.useTargetText}>Use target</Text>
              </Pressable>
            </View>
          ) : null}
          {!isEditing && performanceType !== "reps" && metricProgressionSuggestion ? (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionEyebrow}>
                {metricProgressionSuggestion.recoveryContext === "repeated_low"
                  ? "RECOVERY-AWARE TARGET"
                  : "NEXT TARGET"}
              </Text>
              <Text style={styles.suggestionPerformance}>
                {metricProgressionSuggestion.performanceType === "time"
                  ? `${metricProgressionSuggestion.durationSeconds} seconds`
                  : `${metricProgressionSuggestion.metricValue} ${metricProgressionSuggestion.metricUnit ?? metricProgressionSuggestion.performanceType}`}
              </Text>
              <Text style={styles.suggestionExplanation}>
                {metricProgressionSuggestion.explanation}
              </Text>
              <Pressable
                onPress={applyMetricProgressionSuggestion}
                style={styles.useTargetButton}
              >
                <Text style={styles.useTargetText}>Use target</Text>
              </Pressable>
            </View>
          ) : null}

        <Text style={styles.label}>
          Weight ({profile?.preferred_weight_unit ?? "lb"})
        </Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setWeight}
          selectTextOnFocus
          style={styles.input}
          value={weight}
        />

        {performanceType === "reps" ? (
          <>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setReps}
              placeholder="8"
              placeholderTextColor="#727885"
              style={styles.input}
              value={reps}
            />
          </>
        ) : performanceType === "time" ? (
          <>
            <Text style={styles.label}>Duration (seconds)</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setDurationSeconds}
              placeholder="30"
              placeholderTextColor="#727885"
              style={styles.input}
              value={durationSeconds}
            />
          </>
        ) : null}

        {["distance", "calories", "rounds"].includes(performanceType) ? (
          <>
            <Text style={styles.label}>
              {performanceType === "distance"
                ? "Distance"
                : performanceType === "calories"
                  ? "Calories"
                  : "Rounds"}
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setMetricValue}
              placeholder={performanceType === "distance" ? "500" : "5"}
              placeholderTextColor="#727885"
              style={styles.input}
              value={metricValue}
            />
            {performanceType === "distance" ? (
              <View style={styles.setTypeOptions}>
                {DISTANCE_UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => setMetricUnit(unit)}
                    style={[
                      styles.setTypeButton,
                      metricUnit === unit && styles.setTypeButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.setTypeText,
                        metricUnit === unit && styles.setTypeTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.label}>Reps in reserve</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setRir}
          placeholder="2"
          placeholderTextColor="#727885"
          style={styles.input}
          value={rir}
        />

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
              <Text style={styles.saveText}>
                {isEditing ? "Save changes" : "Save set"}
              </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
  },
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  navigation: {
    alignSelf: "flex-start",
    paddingBottom: 18,
    paddingTop: 18,
  },
  navigationText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    marginTop: 8,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  dropSetBanner: {
    backgroundColor: "#24143B",
    borderColor: "#A78BFA",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  dropSetEyebrow: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  dropSetText: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 5,
  },
  setTypeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  setTypeButton: {
    alignItems: "center",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
  },
  setTypeButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  setTypeText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
  },
  setTypeTextSelected: {
    color: "#0B0B0B",
  },
  previousCard: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  previousEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  previousPerformance: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  previousDetails: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
  },
  previousEmpty: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  previousError: {
    color: "#F87171",
    fontSize: 13,
  },
  suggestionCard: {
    backgroundColor: "#21170D",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  suggestionEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  suggestionPerformance: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  suggestionExplanation: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  useTargetButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  useTargetText: {
    color: "#0B0B0B",
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 17,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
});
