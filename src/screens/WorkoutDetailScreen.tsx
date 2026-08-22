import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  type LoggedSet,
  type PlannedExercise,
  useWorkoutSession,
} from "../hooks/useWorkoutSession";
import {
  type WorkoutRecommendation,
  useWorkoutRecommendations,
} from "../hooks/useWorkoutRecommendations";

import {
  formatExerciseTarget,
  formatSetPerformance,
  getNextWorkoutSet,
  groupWorkoutSets,
} from "../lib/workoutSets";
import { getSetTargetFeedback } from "../lib/performanceFeedback";
import { buildWorkoutRecap } from "../lib/workoutRecap";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";

type SetCardProps = {
  canModify: boolean;
  onDelete: (set: LoggedSet) => void;
  onDropSet: (set: LoggedSet) => void;
  onEdit: (set: LoggedSet) => void;
  recommendation: WorkoutRecommendation | null;
  set: LoggedSet;
};

function SetCard({
  canModify,
  onDelete,
  onDropSet,
  onEdit,
  recommendation,
  set,
}: SetCardProps) {
  const feedback =
    recommendation &&
    set.set_type === "working" &&
    set.set_variant === "standard"
      ? getSetTargetFeedback({
          actualDurationSeconds: set.duration_seconds,
          actualMetricValue: set.metric_value ?? null,
          actualReps: set.reps,
          actualWeight: set.weight,
          performanceType: recommendation.performanceType,
          targetDurationSeconds: recommendation.durationSeconds,
          targetMetricValue: recommendation.metricValue,
          targetReps: recommendation.reps,
          targetWeight: recommendation.weight,
        })
      : null;
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.exerciseName}>{set.exercise_name}</Text>
        <View style={styles.setLabels}>
          <Text
            style={[
              styles.setTypeBadge,
              set.set_type === "warmup" && styles.warmupBadge,
            ]}
          >
            {set.set_variant === "drop"
              ? "DROP SET"
              : set.set_type === "warmup"
                ? "WARM-UP"
                : "WORKING"}
          </Text>
          <Text style={styles.setNumber}>SET {set.set_number}</Text>
        </View>
      </View>

      <Text style={styles.performance}>
{formatSetPerformance(set)}
      </Text>

      {feedback ? (
        <View
          style={[
            styles.feedbackCard,
            feedback.status === "exceeded" && styles.feedbackExceeded,
            feedback.status === "missed" && styles.feedbackMissed,
          ]}
        >
          <Text style={styles.feedbackLabel}>{feedback.label}</Text>
          <Text style={styles.feedbackText}>{feedback.explanation}</Text>
        </View>
      ) : null}

      {set.reps_in_reserve !== null ? (
        <Text style={styles.rir}>
          {set.reps_in_reserve} reps in reserve
        </Text>
      ) : null}

      {canModify ? (
        <View style={styles.setActions}>
          {set.set_type === "working" &&
          set.set_variant === "standard" ? (
            <Pressable
              onPress={() => onDropSet(set)}
              style={styles.dropSetButton}
            >
              <Text style={styles.dropSetButtonText}>Add drop set</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => onEdit(set)}
            style={styles.editSetButton}
          >
            <Text style={styles.editSetText}>Edit set</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(set)}
            style={styles.deleteSetButton}
          >
            <Text style={styles.deleteSetText}>Delete set</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
type PlannedExerciseCardProps = {
  canLog: boolean;
  completedSets: number;
  exercise: PlannedExercise;
  onLog: (
    exercise: PlannedExercise,
    recommendation: WorkoutRecommendation | null,
  ) => void;
  recommendation: WorkoutRecommendation | null;
};

function PlannedExerciseCard({
  canLog,
  completedSets,
  exercise,
  onLog,
  recommendation,
}: PlannedExerciseCardProps) {
  const targetReached = completedSets >= exercise.target_sets;

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planPosition}>{exercise.position}</Text>
        <Text style={styles.planExerciseName}>
          {exercise.exercise_name}
        </Text>
      </View>

      <Text style={styles.planTarget}>
{formatExerciseTarget(exercise)}
      </Text>

      {recommendation ? (
        <View style={styles.planRecommendation}>
          <Text style={styles.planRecommendationLabel}>
            {recommendation.strategy === "hold"
              ? "RECOVERY-AWARE TARGET"
              : "TODAY'S TARGET"}
          </Text>
          <Text style={styles.planRecommendationTarget}>
            {recommendation.targetText}
          </Text>
          <Text style={styles.planRecommendationExplanation}>
            {recommendation.explanation}
          </Text>
        </View>
      ) : null}

      <Text style={styles.planProgress}>
        {completedSets} of {exercise.target_sets} sets logged
      </Text>

      {canLog && !targetReached ? (
        <Pressable
          onPress={() => onLog(exercise, recommendation)}
          style={styles.planLogButton}
        >
          <Text style={styles.planLogText}>
            {recommendation ? "Log recommended set" : "Log next set"}
          </Text>
        </Pressable>
      ) : targetReached ? (
        <Text style={styles.planComplete}>TARGET COMPLETE</Text>
      ) : null}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;
  const { session } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const {
    errorMessage,
    isLoading,
    plannedExercises,
    refreshWorkout,
    sets,
    workout,
  } = useWorkoutSession(workoutId);
  const nextWorkoutSet = getNextWorkoutSet(sets, plannedExercises);
  const { recommendations } = useWorkoutRecommendations(
    plannedExercises,
    workoutId,
  );
  const workoutRecap = buildWorkoutRecap(sets, recommendations);

  function handleLogNextSet() {
    if (!nextWorkoutSet) {
      return;
    }

    const { exercise, lastSet } = nextWorkoutSet;

    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        durationSeconds: String(
          lastSet?.duration_seconds ??
            exercise.target_duration_seconds ??
            "",
        ),
        exerciseId: exercise.exercise_id,
        id: workoutId,
        metricUnit:
          lastSet?.metric_unit ?? exercise.target_metric_unit ?? undefined,
        metricValue: String(
          lastSet?.metric_value ?? exercise.target_metric_value ?? "",
        ),
        performanceType:
          lastSet?.performance_type ?? exercise.performance_type,
        repMax: String(exercise.rep_max),
        repMin: String(exercise.rep_min),
        reps: String(lastSet?.reps ?? exercise.rep_min),
        rir: String(
          lastSet?.reps_in_reserve ?? exercise.target_rir,
        ),
        ...(lastSet ? { weight: String(lastSet.weight) } : {}),
      },
    });
  }

  function handleAddDropSet(set: LoggedSet) {
    const reducedWeight = Number((set.weight * 0.8).toFixed(2));

    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        durationSeconds:
          set.duration_seconds === null
            ? ""
            : String(set.duration_seconds),
        exerciseId: set.exercise_id,
        id: workoutId,
        parentSetId: set.id,
        metricUnit: set.metric_unit ?? undefined,
        metricValue: set.metric_value === null ? "" : String(set.metric_value),
        performanceType: set.performance_type,
        reps: String(set.reps),
        rir: "",
        setType: "working",
        setVariant: "drop",
        weight: String(reducedWeight),
      },
    });
  }

  function handleLogAnotherSet(set: LoggedSet) {
    const plannedExercise = plannedExercises.find(
      (exercise) => exercise.exercise_id === set.exercise_id,
    );

    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        durationSeconds:
          set.duration_seconds === null
            ? ""
            : String(set.duration_seconds),
        exerciseId: set.exercise_id,
        id: workoutId,
        metricUnit: set.metric_unit ?? undefined,
        metricValue: set.metric_value === null ? "" : String(set.metric_value),
        performanceType: set.performance_type,
        reps: String(set.reps),
        rir:
          set.reps_in_reserve === null
            ? ""
            : String(set.reps_in_reserve),
        setType: set.set_type,
        setVariant: set.set_variant,
        ...(set.parent_set_id
          ? { parentSetId: set.parent_set_id }
          : {}),
        weight: String(set.weight),
        ...(plannedExercise
          ? {
              repMax: String(plannedExercise.rep_max),
              repMin: String(plannedExercise.rep_min),
            }
          : {}),
      },
    });
  }

  function handleLogPlannedExercise(
    exercise: PlannedExercise,
    recommendation: WorkoutRecommendation | null,
  ) {
    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        durationSeconds:
          recommendation?.durationSeconds !== null &&
          recommendation?.durationSeconds !== undefined
            ? String(recommendation.durationSeconds)
            : exercise.target_duration_seconds === null
              ? ""
              : String(exercise.target_duration_seconds),
        exerciseId: exercise.exercise_id,
        id: workoutId,
        metricUnit:
          recommendation?.metricUnit ??
          exercise.target_metric_unit ??
          undefined,
        metricValue:
          recommendation?.metricValue !== null &&
          recommendation?.metricValue !== undefined
            ? String(recommendation.metricValue)
            : exercise.target_metric_value === null
              ? ""
              : String(exercise.target_metric_value),
        performanceType: exercise.performance_type,
        repMax: String(exercise.rep_max),
        repMin: String(exercise.rep_min),
        reps: String(recommendation?.reps ?? exercise.rep_min),
        rir: String(exercise.target_rir),
        ...(recommendation?.weight !== null &&
        recommendation?.weight !== undefined
          ? { weight: String(recommendation.weight) }
          : {}),
      },
    });
  }

    function handleEditSet(set: LoggedSet) {
    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        durationSeconds:
          set.duration_seconds === null
            ? ""
            : String(set.duration_seconds),
        exerciseId: set.exercise_id,
        id: workoutId,
        metricUnit: set.metric_unit ?? undefined,
        metricValue: set.metric_value === null ? "" : String(set.metric_value),
        performanceType: set.performance_type,
        reps: String(set.reps),
        rir:
          set.reps_in_reserve === null
            ? ""
            : String(set.reps_in_reserve),
        setId: set.id,
        setType: set.set_type,
        setVariant: set.set_variant,
        ...(set.parent_set_id
          ? { parentSetId: set.parent_set_id }
          : {}),
        weight: String(set.weight),
      },
    });
  }
    function handleCompleteWorkout() {

    if (!session?.user.id || !workoutId) {
      Alert.alert("Unable to complete workout", "Your session is missing.");
      return;
    }

    Alert.alert(
      "Complete workout?",
      "You can still view this workout after completing it.",
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Complete",
          onPress: async () => {
            setIsCompleting(true);

            const { data, error } = await supabase
              .from("workout_sessions")
              .update({
                completed_at: new Date().toISOString(),
              })
              .eq("id", workoutId)
              .eq("user_id", session.user.id)
              .is("completed_at", null)
              .select("id")
              .maybeSingle();

            setIsCompleting(false);

            if (error || !data) {
              Alert.alert(
                "Unable to complete workout",
                error?.message ?? "The workout was not updated.",
              );
              return;
            }

            await refreshWorkout();
          },
        },
      ],
    );
  }
    function handleDeleteSet(set: LoggedSet) {
    if (!session?.user.id || !workoutId || workout?.completed_at) {
      Alert.alert(
        "Unable to delete set",
        "Only sets in an active workout can be deleted.",
      );
      return;
    }

    Alert.alert(
      "Delete set?",
      `${set.exercise_name}: ${formatSetPerformance(set)}`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            const { error } = await supabase
              .from("workout_sets")
              .delete()
              .eq("id", set.id)
              .eq("user_id", session.user.id);

            if (error) {
              Alert.alert("Unable to delete set", error.message);
              return;
            }

            await refreshWorkout();
          },
        },
      ],
    );
  }
if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

    if (!workout) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.error}>
          {errorMessage ?? "Workout not found."}
        </Text>

        <Pressable
          onPress={() => router.replace("/training")}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Return to Training</Text>
        </Pressable>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={groupWorkoutSets(
          sets,
          plannedExercises.map((exercise) => exercise.exercise_id),
        )}
        keyExtractor={(group) => group.exerciseId}
        onRefresh={() => void refreshWorkout()}
        refreshing={isLoading}
        renderItem={({ item: group }) => (
          <View style={styles.exerciseGroup}>
            <Text style={styles.groupExerciseName}>
              {group.exerciseName}
            </Text>
            <Text style={styles.groupSetCount}>
              {group.sets.length} {group.sets.length === 1 ? "set" : "sets"}
            </Text>
            {group.sets.map((set) => (
              <SetCard
                canModify={!workout.completed_at}
                key={set.id}
                onDelete={handleDeleteSet}
                onDropSet={handleAddDropSet}
                onEdit={handleEditSet}
                recommendation={
                  recommendations[set.exercise_id] ?? null
                }
                set={set}
              />
            ))}
            {!workout.completed_at ? (
              <Pressable
                onPress={() =>
                  handleLogAnotherSet(
                    group.sets[group.sets.length - 1],
                  )
                }
                style={styles.groupNextSetButton}
              >
                <Text style={styles.groupNextSetText}>
                  Log next set
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.replace("/training")}
              style={styles.navigation}
            >
              <Text style={styles.navigationText}>‹ Training</Text>
            </Pressable>

            <Text style={styles.eyebrow}>
            {workout.completed_at ? "COMPLETED WORKOUT" : "ACTIVE WORKOUT"}
           </Text>
            <Text style={styles.title}>{workout.name}</Text>
            <Text style={styles.date}>
              Started{" "}
              {new Date(workout.started_at).toLocaleString()}
            </Text>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>{sets.length}</Text>
              <Text style={styles.summaryLabel}>logged sets</Text>
            </View>

            {workout.completed_at ? (
              <View style={styles.recapCard}>
                <Text style={styles.recapEyebrow}>WORKOUT COMPLETE</Text>
                <Text style={styles.recapTitle}>Strong work. Here’s the recap.</Text>
                <View style={styles.recapStats}>
                  <View style={styles.recapStat}>
                    <Text style={styles.recapNumber}>
                      {workoutRecap.workingSets}
                    </Text>
                    <Text style={styles.recapStatLabel}>working sets</Text>
                  </View>
                  <View style={styles.recapStat}>
                    <Text style={styles.recapNumber}>
                      {workoutRecap.exercisesTrained}
                    </Text>
                    <Text style={styles.recapStatLabel}>exercises</Text>
                  </View>
                </View>
                {workoutRecap.evaluatedSets > 0 ? (
                  <View style={styles.recapResults}>
                    <Text style={styles.recapResult}>
                      {workoutRecap.exceeded} exceeded
                    </Text>
                    <Text style={styles.recapResult}>
                      {workoutRecap.met} met
                    </Text>
                    <Text style={styles.recapResult}>
                      {workoutRecap.missed} below
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.recapDirection}>
                  {workoutRecap.nextDirection}
                </Text>
                <Pressable
                  onPress={() => router.replace("/training")}
                  style={styles.recapDoneButton}
                >
                  <Text style={styles.recapDoneText}>Done</Text>
                </Pressable>
              </View>
            ) : null}

            {!workout.completed_at && nextWorkoutSet ? (
              <View style={styles.nextSetCard}>
                <Text style={styles.nextSetEyebrow}>UP NEXT</Text>
                <Text style={styles.nextSetTitle}>
                  {nextWorkoutSet.exercise.exercise_name}
                </Text>
                <Text style={styles.nextSetProgress}>
                  Set {nextWorkoutSet.setNumber} of{" "}
                  {nextWorkoutSet.exercise.target_sets}
                </Text>
                <Text style={styles.nextSetTarget}>
                  {nextWorkoutSet.lastSet
                    ? `${formatSetPerformance(nextWorkoutSet.lastSet)} prefilled`
                    : formatExerciseTarget(nextWorkoutSet.exercise)}
                </Text>
                <Pressable
                  onPress={handleLogNextSet}
                  style={styles.nextSetButton}
                >
                  <Text style={styles.nextSetButtonText}>
                    Log next set
                  </Text>
                </Pressable>
              </View>
            ) : null}
              {plannedExercises.length > 0 ? (
                <View style={styles.planList}>
                  <Text style={styles.sectionTitle}>Workout plan</Text>

                                    {plannedExercises.map((exercise) => (
                    <PlannedExerciseCard
                      canLog={!workout.completed_at}
                      completedSets={
                        sets.filter(
                          (set) =>
                            set.exercise_id === exercise.exercise_id,
                        ).length
                      }
                      exercise={exercise}
                      key={exercise.id}
                      onLog={handleLogPlannedExercise}
                      recommendation={
                        recommendations[exercise.exercise_id] ?? null
                      }
                    />
                  ))}
                </View>
              ) : null}
                              {!workout.completed_at ? (
                <>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/workout/[id]/add-set",
                        params: { id: workoutId },
                      })
                    }
                    style={styles.logSetButton}
                  >
                    <Text style={styles.logSetText}>Log set</Text>
                  </Pressable>

                  <Pressable
                    disabled={isCompleting}
                    onPress={handleCompleteWorkout}
                    style={[
                      styles.completeButton,
                      isCompleting && styles.buttonDisabled,
                    ]}
                  >
                    {isCompleting ? (
                      <ActivityIndicator color="#F97316" />
                    ) : (
                      <Text style={styles.completeText}>
                        Complete workout
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : null}
            <Text style={styles.sectionTitle}>Workout sets</Text>
          </View>
        }
            ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No sets logged yet</Text>
            <Text style={styles.emptyText}>
              The next step is selecting an exercise and recording
              weight, reps, and RIR.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
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
  date: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 22,
    marginTop: 8,
  },
  recapCard: {
    backgroundColor: "#15120F",
    borderColor: "#F97316",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  recapEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  recapTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 7,
  },
  recapStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  recapStat: {
    backgroundColor: "#171717",
    borderRadius: 10,
    flex: 1,
    padding: 12,
  },
  recapNumber: {
    color: "#F97316",
    fontSize: 24,
    fontWeight: "800",
  },
  recapStatLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  recapResults: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  recapResult: {
    backgroundColor: "#21170D",
    borderRadius: 999,
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  recapDirection: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 15,
  },
  recapDoneButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 12,
  },
  recapDoneText: {
    color: "#0B0B0B",
    fontSize: 15,
    fontWeight: "800",
  },
  summary: {
    alignItems: "baseline",
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 26,
    padding: 18,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 15,
  },
    nextSetCard: {
    backgroundColor: "#21170D",
    borderColor: "#F97316",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  nextSetEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  nextSetTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  nextSetProgress: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
  },
  nextSetTarget: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 6,
  },
  nextSetButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 12,
  },
  nextSetButtonText: {
    color: "#0B0B0B",
    fontSize: 15,
    fontWeight: "800",
  },
  planList: {
    marginBottom: 18,
  },
    planCard: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  planHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  planPosition: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 10,
    minWidth: 20,
  },
  planExerciseName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  planSuperset: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 8,
  },
  planTarget: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 8,
  },
    planRecommendation: {
    backgroundColor: "#171717",
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 11,
  },
  planRecommendationLabel: {
    color: "#F97316",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  planRecommendationTarget: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },
  planRecommendationExplanation: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  planProgress: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
  },
  planLogButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 9,
  },
  planLogText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
  },
  planComplete: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  exerciseGroup: {
    backgroundColor: "#121212",
    borderColor: "#292929",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  groupExerciseName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  groupSetCount: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 12,
    marginTop: 3,
  },
  groupNextSetButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
    paddingVertical: 11,
  },
  groupNextSetText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
  },
  setCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  setHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  setLabels: {
    alignItems: "flex-end",
    gap: 4,
  },
  setTypeBadge: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  warmupBadge: {
    color: "#FBBF24",
  },
  setNumber: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  performance: {
    color: "#D1D5DB",
    fontSize: 16,
    marginTop: 10,
  },
  feedbackCard: {
    backgroundColor: "#10231B",
    borderColor: "#34D399",
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  feedbackExceeded: {
    backgroundColor: "#21170D",
    borderColor: "#F97316",
  },
  feedbackMissed: {
    backgroundColor: "#211414",
    borderColor: "#F87171",
  },
  feedbackLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  feedbackText: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  rir: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 5,
  },
      setActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  dropSetButton: {
    borderColor: "#A78BFA",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropSetButtonText: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "700",
  },
  editSetButton: {
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editSetText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteSetButton: {
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteSetText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
    textAlign: "center",
  },
  backButton: {
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backText: {
    color: "#F97316",
    fontWeight: "700",
  },
  logSetButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  logSetText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
    completeButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  completeText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
