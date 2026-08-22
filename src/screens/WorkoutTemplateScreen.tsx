import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useState } from "react";
import {
  type TemplateExercise,
  useWorkoutTemplate,
} from "../hooks/useWorkoutTemplate";
import { formatExerciseTarget } from "../lib/workoutSets";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
type TemplateExerciseCardProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  exercise: TemplateExercise;
  isMoving: boolean;
  onDelete: (exercise: TemplateExercise) => void;
  onEdit: (exercise: TemplateExercise) => void;
  onToggleSuperset: (exercise: TemplateExercise) => void;
  previousExercise: TemplateExercise | null;
  onMove: (
    exercise: TemplateExercise,
    direction: "up" | "down",
  ) => void;
};

function TemplateExerciseCard({
  canMoveDown,
  canMoveUp,
  exercise,
  isMoving,
  onDelete,
  onEdit,
  onMove,
  onToggleSuperset,
  previousExercise,
}: TemplateExerciseCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.position}>{exercise.position}</Text>
        <Text style={styles.exerciseName}>
          {exercise.exercise_name}
        </Text>
      </View>

      <Text style={styles.target}>
{formatExerciseTarget(exercise)}
      </Text>
      <Text style={styles.rir}>{exercise.target_rir} target RIR</Text>
      {exercise.superset_group ? (
        <Text style={styles.supersetBadge}>SUPERSET</Text>
      ) : null}

      {previousExercise ? (
        <Pressable
          onPress={() => onToggleSuperset(exercise)}
          style={styles.supersetButton}
        >
          <Text style={styles.supersetButtonText}>
            {exercise.superset_group &&
            exercise.superset_group === previousExercise.superset_group
              ? "Remove superset"
              : `Superset with ${previousExercise.exercise_name}`}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.moveActions}>
        <Pressable
          disabled={!canMoveUp || isMoving}
          onPress={() => onMove(exercise, "up")}
          style={[
            styles.moveButton,
            (!canMoveUp || isMoving) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.moveButtonText}>↑ Move up</Text>
        </Pressable>

        <Pressable
          disabled={!canMoveDown || isMoving}
          onPress={() => onMove(exercise, "down")}
          style={[
            styles.moveButton,
            (!canMoveDown || isMoving) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.moveButtonText}>↓ Move down</Text>
        </Pressable>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => onEdit(exercise)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit exercise</Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(exercise)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete exercise</Text>
        </Pressable>
      </View>
    </View>
  );
}
export default function WorkoutTemplateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Array.isArray(id) ? id[0] : id;
  const { session } = useAuth();
  const [movingExerciseId, setMovingExerciseId] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const {
    errorMessage,
    isLoading,
    refreshTemplate,
    template,
    templateExercises,
  } = useWorkoutTemplate(templateId);
     function handleEditTemplate() {
    if (!template) {
      return;
    }

    router.push({
      pathname: "/new-template",
      params: {
        name: template.name,
        notes: template.notes ?? "",
        templateId: template.id,
      },
    });
  }
 async function handleToggleSuperset(exercise: TemplateExercise) {
    if (!session?.user.id || !templateId) {
      return;
    }

    const exerciseIndex = templateExercises.findIndex(
      (item) => item.id === exercise.id,
    );
    const previousExercise = templateExercises[exerciseIndex - 1];

    if (!previousExercise) {
      return;
    }

    const isRemoving =
      exercise.superset_group !== null &&
      exercise.superset_group === previousExercise.superset_group;
    const supersetGroup = isRemoving
      ? null
      : [previousExercise.id, exercise.id].sort().join(":");

    const { error } = await supabase
      .from("workout_template_exercises")
      .update({ superset_group: supersetGroup })
      .in("id", [previousExercise.id, exercise.id])
      .eq("template_id", templateId)
      .eq("user_id", session.user.id);

    if (error) {
      Alert.alert("Unable to update superset", error.message);
      return;
    }

    await refreshTemplate();
  }

 function handleEditExercise(exercise: TemplateExercise) {
    router.push({
      pathname: "/template/[id]/add-exercise",
      params: {
        exerciseId: exercise.exercise_id,
        id: templateId,
        performanceType: exercise.performance_type,
        repMax: String(exercise.rep_max),
        repMin: String(exercise.rep_min),
        targetDurationSeconds:
          exercise.target_duration_seconds === null
            ? ""
            : String(exercise.target_duration_seconds),
        targetMetricUnit: exercise.target_metric_unit ?? undefined,
        targetMetricValue:
          exercise.target_metric_value === null
            ? ""
            : String(exercise.target_metric_value),
        targetRir: String(exercise.target_rir),
        targetSets: String(exercise.target_sets),
        templateExerciseId: exercise.id,
      },
    });
  }
    async function handleMoveExercise(
    exercise: TemplateExercise,
    direction: "up" | "down",
  ) {
    setMovingExerciseId(exercise.id);

    const { data, error } = await supabase.rpc(
      "move_workout_template_exercise",
      {
        p_direction: direction,
        p_exercise_id: exercise.id,
      },
    );

    setMovingExerciseId(null);

    if (error) {
      Alert.alert("Unable to move exercise", error.message);
      return;
    }

    if (data) {
      await refreshTemplate();
    }
  }

  function handleStartWorkout() {
    if (!session?.user.id || !template) {
      Alert.alert(
        "Unable to start workout",
        "Your user session or template is missing.",
      );
      return;
    }

    if (templateExercises.length === 0) {
      Alert.alert(
        "Add an exercise first",
        "A template needs at least one exercise.",
      );
      return;
    }

    const userId = session.user.id;
    const templateName = template.name;

    Alert.alert(
      `Start ${templateName}?`,
      `${templateExercises.length} exercises will be added to the workout.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          text: "Start",
          onPress: async () => {
            setIsStarting(true);

            const { data: workout, error: workoutError } =
              await supabase
                .from("workout_sessions")
                .insert({
                  name: templateName,
                  user_id: userId,
                })
                .select("id")
                .single();

            if (workoutError || !workout) {
              setIsStarting(false);
              Alert.alert(
                "Unable to start workout",
                workoutError?.message ?? "The workout was not created.",
              );
              return;
            }

            const snapshots = templateExercises.map((exercise) => ({
              exercise_id: exercise.exercise_id,
              performance_type: exercise.performance_type,
              position: exercise.position,
              rep_max: exercise.rep_max,
              rep_min: exercise.rep_min,
              session_id: workout.id,
              superset_group: exercise.superset_group,
              target_duration_seconds: exercise.target_duration_seconds,
              target_metric_unit: exercise.target_metric_unit,
              target_metric_value: exercise.target_metric_value,
              target_rir: exercise.target_rir,
              target_sets: exercise.target_sets,
              user_id: userId,
            }));

            const { error: snapshotError } = await supabase
              .from("workout_session_exercises")
              .insert(snapshots);

            if (snapshotError) {
              await supabase
                .from("workout_sessions")
                .delete()
                .eq("id", workout.id)
                .eq("user_id", userId);

              setIsStarting(false);
              Alert.alert(
                "Unable to start workout",
                snapshotError.message,
              );
              return;
            }

            setIsStarting(false);
            router.replace({
              pathname: "/workout/[id]",
              params: { id: workout.id },
            });
          },
        },
      ],
    );
  }

  function handleDeleteExercise(exercise: TemplateExercise) {
    if (!session?.user.id || !templateId) {
      Alert.alert(
        "Unable to delete exercise",
        "Your user session or template is missing.",
      );
      return;
    }

    Alert.alert(
      "Delete exercise?",
      `${exercise.exercise_name} will be removed from this template.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            const { data, error } = await supabase
              .from("workout_template_exercises")
              .delete()
              .eq("id", exercise.id)
              .eq("template_id", templateId)
              .eq("user_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to delete exercise",
                error?.message ?? "The exercise was not removed.",
              );
              return;
            }

            await refreshTemplate();
          },
        },
      ],
    );
  }
    function handleDeleteTemplate() {
    if (!session?.user.id || !templateId || !template) {
      Alert.alert(
        "Unable to delete template",
        "Your user session or template is missing.",
      );
      return;
    }

    Alert.alert(
      "Delete template?",
      `${template.name} and its configured exercises will be deleted. Existing workouts will not be changed.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            setIsDeleting(true);

            const { data, error } = await supabase
              .from("workout_templates")
              .delete()
              .eq("id", templateId)
              .eq("user_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              setIsDeleting(false);
              Alert.alert(
                "Unable to delete template",
                error?.message ?? "The template was not removed.",
              );
              return;
            }

            router.replace("/training");
          },
        },
      ],
    );
  }

  if (isLoading && !template) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.error}>
          {errorMessage ?? "Template not found."}
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
        data={templateExercises}
        keyExtractor={(exercise) => exercise.id}
        onRefresh={() => void refreshTemplate()}
        refreshing={isLoading}
        renderItem={({ index, item }) => (
        <TemplateExerciseCard
            canMoveDown={index < templateExercises.length - 1}
            canMoveUp={index > 0}
            exercise={item}
            isMoving={movingExerciseId === item.id}
            onDelete={handleDeleteExercise}
            onEdit={handleEditExercise}
            onMove={handleMoveExercise}
            onToggleSuperset={handleToggleSuperset}
            previousExercise={templateExercises[index - 1] ?? null}
          />
        )}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.replace("/training")}
              style={styles.navigation}
            >
              <Text style={styles.navigationText}>‹ Training</Text>
            </Pressable>

            <Text style={styles.eyebrow}>WORKOUT TEMPLATE</Text>
            <Text style={styles.title}>{template.name}</Text>
            <Text style={styles.subtitle}>
              {template.notes ??
                "Build an ordered routine with progression targets."}
            </Text>
                          <Pressable
              onPress={handleEditTemplate}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                Edit template details
              </Text>
            </Pressable>
              <Pressable
                disabled={
                  isStarting || templateExercises.length === 0
                }
                onPress={handleStartWorkout}
                style={[
                  styles.startButton,
                  (isStarting ||
                    templateExercises.length === 0) &&
                    styles.buttonDisabled,
                ]}
              >
                {isStarting ? (
                  <ActivityIndicator color="#0B0B0B" />
                ) : (
                  <Text style={styles.startButtonText}>
                    Start workout
                  </Text>
                )}
              </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/template/[id]/add-exercise",
                  params: { id: templateId },
                })
              }
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add exercise</Text>
            </Pressable>
            <Pressable
              disabled={isDeleting}
              onPress={handleDeleteTemplate}
              style={[
                styles.deleteTemplateButton,
                isDeleting && styles.buttonDisabled,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color="#F87171" />
              ) : (
                <Text style={styles.deleteTemplateText}>
                  Delete template
                </Text>
              )}
            </Pressable>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>
              Exercises ({templateExercises.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptyText}>
              Add the first exercise and define its sets, rep range,
              and target RIR.
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
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 8,
  },
  startButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
  },
  startButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  addButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 26,
    minHeight: 52,
  },
  addButtonText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
  },
    deleteTemplateButton: {
    alignItems: "center",
    borderColor: "#F87171",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 26,
    minHeight: 52,
  },
  deleteTemplateText: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  position: {
    color: "#F97316",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 12,
    minWidth: 22,
  },
  exerciseName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  target: {
    color: "#D1D5DB",
    fontSize: 15,
    marginTop: 10,
  },
  rir: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 5,
  },
  supersetBadge: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 8,
  },
  supersetButton: {
    borderColor: "#A78BFA",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  supersetButtonText: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  moveActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  moveButton: {
    borderColor: "#6B7280",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moveButtonText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
    cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    alignSelf: "flex-start",
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
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
});
