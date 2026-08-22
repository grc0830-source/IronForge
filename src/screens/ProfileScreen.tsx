import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useProfile } from "../hooks/useProfile";
import {
  buildCoachProfileSummary,
  parseFavoriteAthletes,
  TRAINING_GOAL_LABELS,
  TRAINING_GOALS,
  TRAINING_STYLE_LABELS,
  TRAINING_STYLES,
  type TrainingGoal,
  type TrainingStyle,
} from "../lib/coachProfile";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

type WeightUnit = "lb" | "kg";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const {
    errorMessage: profileError,
    isLoading,
    profile,
    refreshProfile,
  } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>([
    "general_fitness",
  ]);
  const [trainingStyle, setTrainingStyle] =
    useState<TrainingStyle>("mixed");
  const [favoriteAthletes, setFavoriteAthletes] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name ?? "");
    setTrainingGoals(
      profile.training_goals.length > 0
        ? profile.training_goals
        : ["general_fitness"],
    );
    setTrainingStyle(profile.training_style);
    setFavoriteAthletes(profile.favorite_athletes.join(", "));
    setWeightUnit(profile.preferred_weight_unit);
  }, [profile]);

  function toggleTrainingGoal(goal: TrainingGoal) {
    setTrainingGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal],
    );
  }

  async function handleSave() {
    const trimmedName = displayName.trim();

    if (!session?.user.id) {
      setStatusMessage("No authenticated user was found.");
      return;
    }

    if (trainingGoals.length === 0) {
      setStatusMessage("Choose at least one training goal.");
      return;
    }

    const parsedAthletes = parseFavoriteAthletes(favoriteAthletes);

    if (!trimmedName) {
      setStatusMessage("Display name is required.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        favorite_athletes: parsedAthletes,
        preferred_weight_unit: weightUnit,
        training_goals: trainingGoals,
        training_style: trainingStyle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      setStatusMessage(error.message);
    } else {
      await refreshProfile();
      setStatusMessage("Profile saved.");
    }

    setIsSaving(false);
  }
function handleSignOut() {
  Alert.alert(
    "Sign out?",
    "You will need to sign in again to access your private data.",
    [
      {
        style: "cancel",
        text: "Cancel",
      },
      {
        style: "destructive",
        text: "Sign out",
        onPress: async () => {
          setIsSigningOut(true);

          try {
            await signOut();
          } catch (error) {
            Alert.alert(
              "Unable to sign out",
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
            );
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ],
  );
}
function handleDeleteAccount() {
  Alert.alert(
    "Delete account?",
    "This permanently deletes your account and all workouts, nutrition, supplements, templates, and custom exercises.",
    [
      {
        style: "cancel",
        text: "Cancel",
      },
      {
        style: "destructive",
        text: "Continue",
        onPress: () => {
          Alert.alert(
            "Delete permanently?",
            "This action cannot be undone.",
            [
              {
                style: "cancel",
                text: "Keep account",
              },
              {
                style: "destructive",
                text: "Delete permanently",
                onPress: async () => {
                  setIsDeletingAccount(true);
                  setStatusMessage(null);

                  const { error } = await supabase.functions.invoke(
                    "delete-account",
                  );

                  if (error) {
                    setIsDeletingAccount(false);
                    Alert.alert(
                      "Unable to delete account",
                      error.message,
                    );
                    return;
                  }

                  await supabase.auth.signOut({ scope: "local" });
                },
              },
            ],
          );
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
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Personalize how Fortomnia tracks your progress.
        </Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          autoCapitalize="words"
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#727885"
          style={styles.input}
          value={displayName}
        />

        <Text style={styles.label}>Preferred measurement system</Text>

        <View style={styles.unitRow}>
          {(["lb", "kg"] as WeightUnit[]).map((unit) => {
            const isSelected = weightUnit === unit;

            return (
              <Pressable
                  accessibilityLabel={`Use ${unit === "lb" ? "imperial" : "metric"} measurements`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                key={unit}
                onPress={() => setWeightUnit(unit)}
                style={[
                  styles.unitButton,
                  isSelected && styles.unitButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    isSelected && styles.unitTextSelected,
                  ]}
                >
                  {unit === "lb" ? "Imperial (lb, ft)" : "Metric (kg, cm)"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.coachSection}>
          <Text style={styles.coachEyebrow}>AI COACH PROFILE</Text>
          <Text style={styles.coachTitle}>What are you training for?</Text>
          <Text style={styles.coachDescription}>
            Choose every goal that should influence your recommendations.
          </Text>

          <View style={styles.choiceWrap}>
            {TRAINING_GOALS.map((goal) => {
              const isSelected = trainingGoals.includes(goal);

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={goal}
                  onPress={() => toggleTrainingGoal(goal)}
                  style={[
                    styles.choiceButton,
                    isSelected && styles.choiceButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isSelected && styles.choiceTextSelected,
                    ]}
                  >
                    {TRAINING_GOAL_LABELS[goal]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Preferred training style</Text>
          <View style={styles.choiceWrap}>
            {TRAINING_STYLES.map((style) => {
              const isSelected = trainingStyle === style;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={style}
                  onPress={() => setTrainingStyle(style)}
                  style={[
                    styles.choiceButton,
                    isSelected && styles.choiceButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isSelected && styles.choiceTextSelected,
                    ]}
                  >
                    {TRAINING_STYLE_LABELS[style]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Favorite athletes</Text>
          <TextInput
            accessibilityLabel="Favorite athletes"
            autoCapitalize="words"
            onChangeText={setFavoriteAthletes}
            placeholder="Arnold Schwarzenegger, Serena Williams"
            placeholderTextColor="#727885"
            style={styles.input}
            value={favoriteAthletes}
          />
          <Text style={styles.fieldHint}>
            Separate names with commas. Add up to 10 inspirations.
          </Text>

          <View style={styles.coachSummary}>
            <Text style={styles.coachSummaryLabel}>COACHING DIRECTION</Text>
            <Text style={styles.coachSummaryText}>
              {buildCoachProfileSummary(
                trainingGoals,
                trainingStyle,
                parseFavoriteAthletes(favoriteAthletes),
              )}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityHint="Opens the premium AI Coach preview"
          accessibilityLabel="AI Coach premium preview"
          accessibilityRole="button"
          onPress={() => router.push("/ai-coach")}
          style={styles.premiumCoachCard}
        >
          <View style={styles.premiumCoachContent}>
            <Text style={styles.premiumCoachLabel}>PREMIUM PREVIEW</Text>
            <Text style={styles.premiumCoachTitle}>Meet your future AI Coach</Text>
            <Text style={styles.premiumCoachDescription}>
              See what conversational coaching and adaptive programs will add.
              Core training intelligence stays free.
            </Text>
          </View>
          <Text accessibilityElementsHidden style={styles.premiumCoachArrow}>›</Text>
        </Pressable>

        {profileError ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.error}
            >
              {profileError}
            </Text>
        ) : null}

        {statusMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.status}
            >
              {statusMessage}
            </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSaving,
          disabled: isSaving || isSigningOut || isDeletingAccount,
          }}
          disabled={isSaving || isSigningOut || isDeletingAccount}
          onPress={handleSave}
          style={[
  styles.saveButton,
  (isSaving || isSigningOut || isDeletingAccount) &&
    styles.disabled,
]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.saveText}>Save profile</Text>
          )}
        </Pressable>
         <Pressable
            accessibilityHint="Opens Fortomnia policies and support information"
            accessibilityLabel="Privacy, terms, and support"
            accessibilityRole="button"
            onPress={() => router.push("/legal")}
            style={styles.legalButton}
          >
            <View style={styles.legalButtonContent}>
              <Text style={styles.legalButtonTitle}>
                Privacy, terms & support
              </Text>
              <Text style={styles.legalButtonDescription}>
                Policies, account deletion, and help
              </Text>
            </View>

            <Text accessibilityElementsHidden style={styles.legalButtonArrow}>
              ›
            </Text>
          </Pressable>
 <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSigningOut,
            disabled: isSaving || isSigningOut || isDeletingAccount
          }}
          disabled={isSaving || isSigningOut || isDeletingAccount}
          onPress={handleSignOut}
          style={[
            styles.signOutButton,
            (isSaving || isSigningOut) && styles.disabled,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#F97316" />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
<Pressable
  accessibilityLabel="Delete account permanently"
  accessibilityRole="button"
  accessibilityState={{
    busy: isDeletingAccount,
    disabled: isSaving || isSigningOut || isDeletingAccount,
  }}
  disabled={isSaving || isSigningOut || isDeletingAccount}
  onPress={handleDeleteAccount}
  style={[
    styles.deleteAccountButton,
    (isSaving || isSigningOut || isDeletingAccount) &&
      styles.disabled,
  ]}
>
  {isDeletingAccount ? (
    <ActivityIndicator color="#F87171" />
  ) : (
    <Text style={styles.deleteAccountText}>Delete account</Text>
  )}
</Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  unitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  unitButton: {
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  unitButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  unitText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "700",
  },
  unitTextSelected: {
    color: "#0B0B0B",
  },
  coachSection: {
    borderTopColor: "#333333",
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 24,
  },
  coachEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  coachTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 7,
  },
  coachDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 6,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },
  choiceButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  choiceButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  choiceText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  choiceTextSelected: {
    color: "#0B0B0B",
  },
  fieldHint: {
    color: "#727885",
    fontSize: 12,
    marginBottom: 20,
    marginTop: -16,
  },
  coachSummary: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 15,
  },
  coachSummaryLabel: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  coachSummaryText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  premiumCoachCard: {
    alignItems: "center",
    backgroundColor: "#15100C",
    borderColor: "#F97316",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    padding: 17,
  },
  premiumCoachContent: {
    flex: 1,
  },
  premiumCoachLabel: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  premiumCoachTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  premiumCoachDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  premiumCoachArrow: {
    color: "#F97316",
    fontSize: 30,
    marginLeft: 12,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  status: {
    color: "#D1D5DB",
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
  legalButton: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalButtonContent: {
    flex: 1,
  },
  legalButtonTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  legalButtonDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
  legalButtonArrow: {
    color: "#F97316",
    fontSize: 28,
    marginLeft: 12,
  },
  signOutButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 14,
  },
  signOutText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "600",
  },
deleteAccountButton: {
  alignItems: "center",
  borderColor: "#F87171",
  borderRadius: 12,
  borderWidth: 1,
  marginTop: 28,
  paddingVertical: 14,
},
deleteAccountText: {
  color: "#F87171",
  fontSize: 16,
  fontWeight: "700",
},
});
