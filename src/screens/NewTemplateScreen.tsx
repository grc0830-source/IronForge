import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

  export default function NewTemplateScreen() {
  const router = useRouter();
  const {
    name: nameParam,
    notes: notesParam,
    templateId: templateIdParam,
  } = useLocalSearchParams<{
    name?: string;
    notes?: string;
    templateId?: string;
  }>();

  const templateId = Array.isArray(templateIdParam)
    ? templateIdParam[0]
    : templateIdParam;
  const initialName = Array.isArray(nameParam) ? nameParam[0] : nameParam;
  const initialNotes = Array.isArray(notesParam)
    ? notesParam[0]
    : notesParam;
  const isEditing = Boolean(templateId);

  const { session } = useAuth();
  const [name, setName] = useState(initialName ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
      useEffect(() => {
    setName(initialName ?? "");
    setNotes(initialNotes ?? "");
    setErrorMessage(null);
  }, [initialName, initialNotes, templateId]);

    async function handleSaveTemplate() {
    const trimmedName = name.trim();
    const trimmedNotes = notes.trim();

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Template name is required.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    if (isEditing && templateId) {
      const { data, error } = await supabase
        .from("workout_templates")
        .update({
          name: trimmedName,
          notes: trimmedNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", templateId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsCreating(false);

      if (error || !data) {
        if (error?.code === "23505") {
          setErrorMessage("You already have a template with this name.");
        } else {
          setErrorMessage(
            error?.message ?? "The template was not updated.",
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

    const { error } = await supabase
      .from("workout_templates")
      .insert({
        name: trimmedName,
        notes: trimmedNotes || null,
        user_id: session.user.id,
      });

    setIsCreating(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("You already have a template with this name.");
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    Alert.alert(
      "Template created",
      `${trimmedName} was created successfully.`,
      [
        {
          text: "OK",
          onPress: () => router.replace("/training"),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>
  {isEditing ? "Edit template" : "Create template"}
</Text>
<Text style={styles.subtitle}>
  {isEditing
    ? "Update the template name and notes."
    : "Save a reusable routine. Exercises and targets come next."}
</Text>

        {!isEditing ? (
          <Pressable
            accessibilityHint="Builds editable templates from your coaching profile"
            accessibilityLabel="Build my program with Fortomnia"
            accessibilityRole="button"
            onPress={() => router.push("/program-builder")}
            style={styles.builderButton}
          >
            <Text style={styles.builderLabel}>FREE TRAINING INTELLIGENCE</Text>
            <Text style={styles.builderTitle}>Build my program</Text>
            <Text style={styles.builderDescription}>
              Generate 2–5 explainable workout templates from your goals and
              training style.
            </Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Template name</Text>
        <TextInput
          accessibilityLabel="Template name"
          autoCapitalize="words"
          autoFocus
          onChangeText={setName}
          placeholder="Push Day, Leg Day, Upper Body..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={name}
        />
                  <Text style={styles.label}>Notes</Text>
        <TextInput
          accessibilityLabel="Template notes"
          multiline
          onChangeText={setNotes}
          placeholder="Describe the workout focus or training goals..."
          placeholderTextColor="#727885"
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={notes}
        />

        {errorMessage ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel={
            isEditing ? "Save template changes" : "Create template"
          }
          accessibilityRole="button"
          accessibilityState={{
            busy: isCreating,
            disabled: isCreating,
          }}
          disabled={isCreating}
          onPress={handleSaveTemplate}
          style={[
            styles.createButton,
            isCreating && styles.disabled,
          ]}
        >
          {isCreating ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.createText}>
             {isEditing ? "Save changes" : "Create template"}
           </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel={
            isEditing ? "Cancel editing template" : "Cancel new template"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: isCreating }}
          disabled={isCreating}
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    marginTop: 8,
  },
  builderButton: {
    backgroundColor: "#15100C",
    borderColor: "#F97316",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 26,
    padding: 17,
  },
  builderLabel: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  builderTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  builderDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  notesInput: {
    minHeight: 110,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  createText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
});
