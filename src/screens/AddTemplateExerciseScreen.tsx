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
import { getTemplateTargetDefaults } from "../lib/coachProfile";
import {
  defaultMetricUnit,
  DISTANCE_UNITS,
  getExerciseMetricDefaults,
  PERFORMANCE_LABELS,
  PERFORMANCE_TYPES,
  type MetricUnit,
  type PerformanceType,
} from "../lib/performanceMetrics";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function AddTemplateExerciseScreen() {
    const router = useRouter();
  const {
    exerciseId: exerciseIdParam,
    id,
    performanceType: performanceTypeParam,
    repMax: repMaxParam,
    repMin: repMinParam,
    targetDurationSeconds: targetDurationSecondsParam,
    targetMetricUnit: targetMetricUnitParam,
    targetMetricValue: targetMetricValueParam,
    targetRir: targetRirParam,
    targetSets: targetSetsParam,
    templateExerciseId: templateExerciseIdParam,
  } = useLocalSearchParams<{
    exerciseId?: string;
    id: string;
    performanceType?: PerformanceType;
    repMax?: string;
    repMin?: string;
    targetDurationSeconds?: string;
    targetMetricUnit?: MetricUnit;
    targetMetricValue?: string;
    targetRir?: string;
    targetSets?: string;
    templateExerciseId?: string;
  }>();

  const templateId = Array.isArray(id) ? id[0] : id;
  const initialExerciseId = Array.isArray(exerciseIdParam)
    ? exerciseIdParam[0]
    : exerciseIdParam;
  const editingExerciseId = Array.isArray(templateExerciseIdParam)
    ? templateExerciseIdParam[0]
    : templateExerciseIdParam;
  const initialPerformanceType = Array.isArray(performanceTypeParam)
    ? performanceTypeParam[0]
    : performanceTypeParam;
  const initialTargetMetricValue = Array.isArray(targetMetricValueParam)
    ? targetMetricValueParam[0]
    : targetMetricValueParam;
  const initialTargetMetricUnit = Array.isArray(targetMetricUnitParam)
    ? targetMetricUnitParam[0]
    : targetMetricUnitParam;
  const initialTargetDuration = Array.isArray(targetDurationSecondsParam)
    ? targetDurationSecondsParam[0]
    : targetDurationSecondsParam;
  const initialRepMax = Array.isArray(repMaxParam)
    ? repMaxParam[0]
    : repMaxParam;
  const initialRepMin = Array.isArray(repMinParam)
    ? repMinParam[0]
    : repMinParam;
  const initialTargetRir = Array.isArray(targetRirParam)
    ? targetRirParam[0]
    : targetRirParam;
  const initialTargetSets = Array.isArray(targetSetsParam)
    ? targetSetsParam[0]
    : targetSetsParam;
  const isEditing = Boolean(editingExerciseId);

  const { session } = useAuth();
  const { exercises, isLoading } = useExercises();
  const { profile } = useProfile();

    const [exerciseId, setExerciseId] = useState<string | null>(
    initialExerciseId ?? null,
  );
  const [performanceType, setPerformanceType] = useState<PerformanceType>(
    PERFORMANCE_TYPES.includes(initialPerformanceType as PerformanceType)
      ? (initialPerformanceType as PerformanceType)
      : "reps",
  );
  const [targetMetricValue, setTargetMetricValue] = useState(
    initialTargetMetricValue ?? "",
  );
  const [targetMetricUnit, setTargetMetricUnit] = useState<MetricUnit>(
    initialTargetMetricUnit ?? "meters",
  );
  const [targetDurationSeconds, setTargetDurationSeconds] = useState(
    initialTargetDuration ?? "30",
  );
  const [targetSets, setTargetSets] = useState(
    initialTargetSets ?? "3",
  );
  const [repMin, setRepMin] = useState(initialRepMin ?? "8");
  const [repMax, setRepMax] = useState(initialRepMax ?? "12");
  const [targetRir, setTargetRir] = useState(
    initialTargetRir ?? "2",
  );
  const [hasAppliedCoachDefaults, setHasAppliedCoachDefaults] =
    useState(false);
  const [metricDefaultExplanation, setMetricDefaultExplanation] =
    useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (
      profile &&
      !isEditing &&
      !hasAppliedCoachDefaults &&
      repMinParam === undefined &&
      repMaxParam === undefined
    ) {
      const defaults = getTemplateTargetDefaults(
        profile.training_goals,
        profile.training_style,
      );
      setTargetSets(String(defaults.targetSets));
      setRepMin(String(defaults.repMin));
      setRepMax(String(defaults.repMax));
      setTargetRir(String(defaults.targetRir));
      setHasAppliedCoachDefaults(true);
    }
  }, [
    hasAppliedCoachDefaults,
    isEditing,
    profile,
    repMaxParam,
    repMinParam,
  ]);

  useEffect(() => {
    if (!exerciseId && exercises.length > 0) {
      setExerciseId(exercises[0].id);
    }
  }, [exerciseId, exercises]);

  useEffect(() => {
    if (isEditing || performanceTypeParam !== undefined || !exerciseId) {
      return;
    }

    const exercise = exercises.find((item) => item.id === exerciseId);

    if (!exercise) {
      return;
    }

    const defaults = getExerciseMetricDefaults(exercise);
    setPerformanceType(defaults.performanceType);
    setTargetDurationSeconds(
      String(defaults.targetDurationSeconds ?? 30),
    );
    setTargetMetricUnit(defaults.targetMetricUnit ?? "meters");
    setTargetMetricValue(
      defaults.targetMetricValue === null
        ? ""
        : String(defaults.targetMetricValue),
    );
    setMetricDefaultExplanation(defaults.explanation);
  }, [exerciseId, exercises, isEditing, performanceTypeParam]);

  async function handleSave() {
    if (!session?.user.id || !templateId || !exerciseId) {
      setErrorMessage("Template, user, or exercise is missing.");
      return;
    }

    const parsedSets = Number(targetSets);
    const parsedDuration = Number(targetDurationSeconds);
    const parsedMetricValue = Number(targetMetricValue);
    const parsedMin = Number(repMin);
    const parsedMax = Number(repMax);
    const parsedRir = Number(targetRir);

    if (
      !Number.isInteger(parsedSets) ||
      parsedSets < 1 ||
      parsedSets > 20
    ) {
      setErrorMessage("Target sets must be from 1 to 20.");
      return;
    }

    if (
      performanceType === "reps" &&
      (!Number.isInteger(parsedMin) ||
        !Number.isInteger(parsedMax) ||
        parsedMin < 1 ||
        parsedMax > 100 ||
        parsedMin > parsedMax)
    ) {
      setErrorMessage("Enter a valid rep range from 1 to 100.");
      return;
    }

    if (
      performanceType === "time" &&
      (!Number.isInteger(parsedDuration) ||
        parsedDuration < 1 ||
        parsedDuration > 86400)
    ) {
      setErrorMessage("Duration must be from 1 to 86,400 seconds.");
      return;
    }

    if (
      ["distance", "calories", "rounds"].includes(performanceType) &&
      (!Number.isFinite(parsedMetricValue) || parsedMetricValue <= 0)
    ) {
      setErrorMessage("Metric target must be greater than zero.");
      return;
    }

    const savedMetricValue =
      ["distance", "calories", "rounds"].includes(performanceType)
        ? parsedMetricValue
        : null;
    const savedMetricUnit =
      performanceType === "distance"
        ? targetMetricUnit
        : defaultMetricUnit(performanceType);

    const savedMin = performanceType === "reps" ? parsedMin : 1;
    const savedMax = performanceType === "reps" ? parsedMax : 1;
    const savedDuration =
      performanceType === "time" ? parsedDuration : null;

    if (
      !Number.isInteger(parsedRir) ||
      parsedRir < 0 ||
      parsedRir > 10
    ) {
      setErrorMessage("Target RIR must be from 0 to 10.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
       if (isEditing && editingExerciseId) {
      const { data, error } = await supabase
        .from("workout_template_exercises")
        .update({
          exercise_id: exerciseId,
          performance_type: performanceType,
          rep_max: savedMax,
          rep_min: savedMin,
          target_duration_seconds: savedDuration,
          target_metric_unit: savedMetricUnit,
          target_metric_value: savedMetricValue,
          target_rir: parsedRir,
          target_sets: parsedSets,
        })
        .eq("id", editingExerciseId)
        .eq("template_id", templateId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        if (error?.code === "23505") {
          setErrorMessage("This exercise is already in the template.");
        } else {
          setErrorMessage(
            error?.message ?? "The template exercise was not updated.",
          );
        }
        return;
      }

      router.replace({
        pathname: "/template/[id]",
        params: { id: templateId },
      });
      return;
    }

    const { data: latestExercise, error: positionError } =
      await supabase
        .from("workout_template_exercises")
        .select("position")
        .eq("template_id", templateId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (positionError) {
      setErrorMessage(positionError.message);
      setIsSaving(false);
      return;
    }

    const nextPosition = (latestExercise?.position ?? 0) + 1;

    const { error } = await supabase
      .from("workout_template_exercises")
      .insert({
        exercise_id: exerciseId,
        target_metric_unit: savedMetricUnit,
        target_metric_value: savedMetricValue,
        performance_type: performanceType,
        position: nextPosition,
        rep_max: savedMax,
        rep_min: savedMin,
        target_duration_seconds: savedDuration,
        target_rir: parsedRir,
        target_sets: parsedSets,
        template_id: templateId,
        user_id: session.user.id,
      });

    setIsSaving(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("This exercise is already in the template.");
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    router.replace({
      pathname: "/template/[id]",
      params: { id: templateId },
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
              pathname: "/template/[id]",
              params: { id: templateId },
            })
          }
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Template</Text>
        </Pressable>

        <Text style={styles.eyebrow}>WORKOUT TEMPLATE</Text>
                <Text style={styles.title}>
          {isEditing ? "Edit exercise" : "Add exercise"}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? "Update the exercise and its progression targets."
            : "Choose an exercise and define its progression range."}
        </Text>

        <Text style={styles.label}>Exercise</Text>

        <ExercisePicker
            exercises={exercises}
            onSelect={setExerciseId}
            selectedExerciseId={exerciseId}
          />

        {profile && !isEditing ? (
          <View style={styles.coachDefaultCard}>
            <Text style={styles.coachDefaultEyebrow}>COACH DEFAULTS</Text>
            <Text style={styles.coachDefaultText}>
              {getTemplateTargetDefaults(
                profile.training_goals,
                profile.training_style,
              ).explanation}
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Performance target</Text>
        {metricDefaultExplanation && !isEditing ? (
          <Text style={styles.metricDefaultText}>
            Suggested: {metricDefaultExplanation} You can change this anytime.
          </Text>
        ) : null}
        <View style={styles.metricOptions}>
          {PERFORMANCE_TYPES.map((option) => (
            <Pressable
              key={option}
              onPress={() => setPerformanceType(option)}
              style={[
                styles.metricButton,
                performanceType === option && styles.metricButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.metricText,
                  performanceType === option && styles.metricTextSelected,
                ]}
              >
                {PERFORMANCE_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Target sets</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setTargetSets}
          selectTextOnFocus
          style={styles.input}
          value={targetSets}
        />

        {performanceType === "reps" ? (
          <>
            <Text style={styles.label}>Rep range</Text>
            <View style={styles.rangeRow}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setRepMin}
                selectTextOnFocus
                style={[styles.input, styles.rangeInput]}
                value={repMin}
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setRepMax}
                selectTextOnFocus
                style={[styles.input, styles.rangeInput]}
                value={repMax}
              />
            </View>
          </>
        ) : performanceType === "time" ? (
          <>
            <Text style={styles.label}>Target duration (seconds)</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setTargetDurationSeconds}
              selectTextOnFocus
              style={styles.input}
              value={targetDurationSeconds}
            />
          </>
        ) : null}

        {["distance", "calories", "rounds"].includes(performanceType) ? (
          <>
            <Text style={styles.label}>
              {performanceType === "distance"
                ? "Target distance"
                : performanceType === "calories"
                  ? "Target calories"
                  : "Target rounds"}
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setTargetMetricValue}
              placeholder={performanceType === "distance" ? "500" : "5"}
              placeholderTextColor="#727885"
              style={styles.input}
              value={targetMetricValue}
            />
            {performanceType === "distance" ? (
              <View style={styles.metricOptions}>
                {DISTANCE_UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => setTargetMetricUnit(unit)}
                    style={[
                      styles.metricButton,
                      targetMetricUnit === unit && styles.metricButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.metricText,
                        targetMetricUnit === unit && styles.metricTextSelected,
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

        <Text style={styles.label}>Target RIR</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setTargetRir}
          selectTextOnFocus
          style={styles.input}
          value={targetRir}
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
  {isEditing ? "Save changes" : "Add to template"}
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
  coachDefaultCard: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  coachDefaultEyebrow: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  coachDefaultText: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  metricDefaultText: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  metricOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricButton: {
    alignItems: "center",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
  },
  metricButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  metricText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
  },
  metricTextSelected: {
    color: "#0B0B0B",
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
  rangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    color: "#9CA3AF",
    marginBottom: 20,
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
