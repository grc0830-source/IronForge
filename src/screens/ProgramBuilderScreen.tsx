import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useExercises } from "../hooks/useExercises";
import { useProfile } from "../hooks/useProfile";
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_OPTIONS,
  type EquipmentOption,
} from "../lib/equipment";
import {
  generateWorkoutProgram,
  type GeneratedTemplate,
} from "../lib/programGenerator";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

const DAY_OPTIONS = [2, 3, 4, 5] as const;

export default function ProgramBuilderScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { errorMessage: exerciseError, exercises, isLoading } = useExercises();
  const { errorMessage: profileError, profile } = useProfile();
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [availableEquipment, setAvailableEquipment] = useState<
    EquipmentOption[]
  >(["full_gym"]);
  const [hasLoadedEquipment, setHasLoadedEquipment] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !hasLoadedEquipment) {
      setAvailableEquipment(
        profile.available_equipment.length > 0
          ? profile.available_equipment
          : ["full_gym"],
      );
      setHasLoadedEquipment(true);
    }
  }, [hasLoadedEquipment, profile]);

  function toggleEquipment(option: EquipmentOption) {
    setAvailableEquipment((current) => {
      if (option === "full_gym") return ["full_gym"];

      const withoutFullGym = current.filter((item) => item !== "full_gym");
      if (withoutFullGym.includes(option)) {
        const next = withoutFullGym.filter((item) => item !== option);
        return next.length > 0 ? next : ["bodyweight"];
      }
      return [...withoutFullGym, option];
    });
  }

  const program = useMemo<GeneratedTemplate[]>(() => {
    if (!profile || exercises.length === 0) return [];

    try {
      return generateWorkoutProgram(
        exercises,
        daysPerWeek,
        profile.training_goals,
        profile.training_style,
        availableEquipment,
      );
    } catch {
      return [];
    }
  }, [availableEquipment, daysPerWeek, exercises, profile]);

  async function handleCreateProgram() {
    if (!session?.user.id || !profile) {
      setErrorMessage("Your profile or session is still loading.");
      return;
    }
    if (program.length === 0) {
      setErrorMessage("A program could not be built from the exercise library.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    const createdTemplateIds: string[] = [];

    const { error: equipmentSaveError } = await supabase
      .from("profiles")
      .update({
        available_equipment: availableEquipment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (equipmentSaveError) {
      setIsCreating(false);
      setErrorMessage(equipmentSaveError.message);
      return;
    }

    try {
      for (const template of program) {
        const { data: createdTemplate, error: templateError } = await supabase
          .from("workout_templates")
          .insert({
            name: template.name,
            notes: template.explanation,
            user_id: session.user.id,
          })
          .select("id")
          .single();

        if (templateError || !createdTemplate) {
          throw new Error(
            templateError?.code === "23505"
              ? `${template.name} already exists. Rename or delete the existing template before generating this program.`
              : templateError?.message ?? "A template could not be created.",
          );
        }

        createdTemplateIds.push(createdTemplate.id);

        const { error: exerciseInsertError } = await supabase
          .from("workout_template_exercises")
          .insert(
            template.exercises.map((exercise) => ({
              exercise_id: exercise.exerciseId,
              performance_type: "reps",
              position: exercise.position,
              rep_max: exercise.repMax,
              rep_min: exercise.repMin,
              target_duration_seconds: null,
              target_rir: exercise.targetRir,
              target_sets: exercise.targetSets,
              template_id: createdTemplate.id,
              user_id: session.user.id,
            })),
          );

        if (exerciseInsertError) {
          throw new Error(exerciseInsertError.message);
        }
      }
    } catch (error) {
      if (createdTemplateIds.length > 0) {
        await supabase
          .from("workout_templates")
          .delete()
          .in("id", createdTemplateIds)
          .eq("user_id", session.user.id);
      }

      setIsCreating(false);
      setErrorMessage(
        error instanceof Error ? error.message : "The program was not created.",
      );
      return;
    }

    setIsCreating(false);
    Alert.alert(
      "Program created",
      `${program.length} editable workout templates are ready in Training.`,
      [{ text: "View templates", onPress: () => router.replace("/training") }],
    );
  }

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Create template</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FREE TRAINING INTELLIGENCE</Text>
        <Text style={styles.title}>Build my program</Text>
        <Text style={styles.subtitle}>
          Fortomnia uses your saved goals and training style to build an
          explainable starting program. Every template and target stays editable.
        </Text>

        <Text style={styles.sectionTitle}>Training days per week</Text>
        <View style={styles.dayRow}>
          {DAY_OPTIONS.map((days) => {
            const selected = daysPerWeek === days;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={days}
                onPress={() => setDaysPerWeek(days)}
                style={[styles.dayButton, selected && styles.dayButtonSelected]}
              >
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                  {days}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Available equipment</Text>
        <Text style={styles.sectionHint}>
          Programs will only use exercises that match these choices.
        </Text>
        <View style={styles.equipmentWrap}>
          {EQUIPMENT_OPTIONS.map((option) => {
            const selected = availableEquipment.includes(option);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => toggleEquipment(option)}
                style={[
                  styles.equipmentButton,
                  selected && styles.equipmentButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.equipmentText,
                    selected && styles.equipmentTextSelected,
                  ]}
                >
                  {EQUIPMENT_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>BUILT FROM YOUR PROFILE</Text>
          <Text style={styles.profileText}>
            {profile.training_style.replaceAll("_", " ")} •{" "}
            {profile.training_goals
              .map((goal) => goal.replaceAll("_", " "))
              .join(", ")}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Program preview</Text>
        {program.map((template) => (
          <View key={template.name} style={styles.templateCard}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateExplanation}>{template.explanation}</Text>
            {template.exercises.map((exercise) => (
              <View key={exercise.exerciseId} style={styles.exerciseRow}>
                <View style={styles.position}>
                  <Text style={styles.positionText}>{exercise.position}</Text>
                </View>
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseTarget}>
                    {exercise.targetSets} sets • {exercise.repMin}–
                    {exercise.repMax} reps • {exercise.targetRir} RIR
                  </Text>
                  <Text style={styles.exerciseWhy}>{exercise.explanation}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {exerciseError || profileError || errorMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage ?? exerciseError ?? profileError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isCreating, disabled: isCreating || program.length === 0 }}
          disabled={isCreating || program.length === 0}
          onPress={handleCreateProgram}
          style={[
            styles.createButton,
            (isCreating || program.length === 0) && styles.disabled,
          ]}
        >
          {isCreating ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.createText}>
              Create {program.length} editable templates
            </Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          This is a general training starting point, not medical advice. Review
          exercise suitability and adjust volume for your experience and recovery.
        </Text>
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
  screen: { backgroundColor: "#0B0B0B", flex: 1 },
  content: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 18 },
  backButton: { alignSelf: "flex-start", paddingVertical: 10 },
  backText: { color: "#F97316", fontSize: 16, fontWeight: "700" },
  eyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 14,
  },
  title: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", marginTop: 8 },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    marginTop: 9,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 13,
  },
  dayRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  dayButton: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  dayButtonSelected: { backgroundColor: "#F97316", borderColor: "#F97316" },
  dayText: { color: "#D1D5DB", fontSize: 17, fontWeight: "800" },
  dayTextSelected: { color: "#0B0B0B" },
  sectionHint: {
    color: "#8F96A3",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: -7,
  },
  equipmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  equipmentButton: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  equipmentButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  equipmentText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
  },
  equipmentTextSelected: {
    color: "#0B0B0B",
  },
  profileCard: {
    backgroundColor: "#15100C",
    borderColor: "#4A2D12",
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 28,
    padding: 15,
  },
  profileLabel: { color: "#F97316", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  profileText: { color: "#D1D5DB", fontSize: 14, lineHeight: 20, marginTop: 6, textTransform: "capitalize" },
  templateCard: {
    backgroundColor: "#151515",
    borderColor: "#2B2B2B",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  templateName: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  templateExplanation: { color: "#9CA3AF", fontSize: 13, lineHeight: 19, marginBottom: 14, marginTop: 6 },
  exerciseRow: {
    borderTopColor: "#292929",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 11,
    paddingVertical: 12,
  },
  position: {
    alignItems: "center",
    backgroundColor: "#2B1A0E",
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  positionText: { color: "#F97316", fontSize: 12, fontWeight: "900" },
  exerciseContent: { flex: 1 },
  exerciseName: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  exerciseTarget: { color: "#D1D5DB", fontSize: 12, marginTop: 4 },
  exerciseWhy: { color: "#777F8C", fontSize: 11, lineHeight: 16, marginTop: 4 },
  error: { color: "#F87171", lineHeight: 20, marginBottom: 16 },
  createButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 54,
  },
  disabled: { opacity: 0.5 },
  createText: { color: "#0B0B0B", fontSize: 16, fontWeight: "900" },
  disclaimer: {
    color: "#727885",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 14,
    textAlign: "center",
  },
});
