import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePremiumEntitlement } from "../hooks/usePremiumEntitlement";

const PREMIUM_FEATURES = [
  {
    title: "Conversational coaching",
    description: "Ask questions about your training, recovery, and program.",
  },
  {
    title: "Personalized programs",
    description: "Build templates around your goals, style, history, and equipment.",
  },
  {
    title: "Adaptive adjustments",
    description: "Turn performance and readiness trends into explainable changes.",
  },
  {
    title: "Deeper trend analysis",
    description: "Connect workouts, recovery, and nutrition without losing context.",
  },
];

export default function AiCoachScreen() {
  const router = useRouter();
  const {
    errorMessage,
    hasAiCoachAccess,
    isLoading,
    refreshEntitlement,
  } = usePremiumEntitlement();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Back to profile"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Profile</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.eyebrow}>FORTOMNIA AI COACH</Text>
          <Text style={styles.title}>A coach that learns how you train.</Text>
          <Text style={styles.subtitle}>
            Premium coaching will build on Fortomnia&apos;s free, explainable
            training intelligence—not replace it.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#F97316" />
            <Text style={styles.statusText}>Checking access…</Text>
          </View>
        ) : hasAiCoachAccess ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeLabel}>AI COACH ACCESS ACTIVE</Text>
            <Text style={styles.activeTitle}>You&apos;re ready for launch.</Text>
            <Text style={styles.activeText}>
              Your premium entitlement is active. The coaching conversation
              will appear here when the protected AI service is released.
            </Text>
          </View>
        ) : (
          <View style={styles.lockedCard}>
            <Text style={styles.lockIcon}>◆</Text>
            <View style={styles.lockedContent}>
              <Text style={styles.lockedTitle}>Premium preview</Text>
              <Text style={styles.lockedText}>
                Subscriptions are not on sale yet. Your current workout logging,
                progression targets, readiness insights, and macro estimates
                remain available without premium.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>What premium will unlock</Text>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <Text style={styles.featureMarker}>✓</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.freeCard}>
          <Text style={styles.freeLabel}>ALWAYS USEFUL</Text>
          <Text style={styles.freeTitle}>Core intelligence stays free.</Text>
          <Text style={styles.freeText}>
            Fortomnia&apos;s deterministic recommendations remain available
            even if you never subscribe, cancel later, or the AI service is
            temporarily unavailable.
          </Text>
        </View>

        {errorMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
            Unable to check premium access right now. Your free features are
            unaffected.
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void refreshEntitlement()}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshText}>Refresh access</Text>
        </Pressable>

        {!hasAiCoachAccess ? (
          <View
            accessibilityLabel="Subscriptions coming soon"
            accessibilityRole="text"
            style={styles.comingSoonButton}
          >
            <Text style={styles.comingSoonText}>Subscriptions coming soon</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#0B0B0B", flex: 1 },
  content: { paddingBottom: 40, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8 },
  backText: { color: "#F97316", fontSize: 16, fontWeight: "700" },
  hero: {
    backgroundColor: "#15100C",
    borderColor: "#4A2D12",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    overflow: "hidden",
    padding: 22,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F97316",
    borderRadius: 999,
    marginBottom: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: "#0B0B0B", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  eyebrow: { color: "#F97316", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", lineHeight: 35, marginTop: 8 },
  subtitle: { color: "#B8BDC7", fontSize: 15, lineHeight: 22, marginTop: 12 },
  statusCard: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 16,
  },
  statusText: { color: "#D1D5DB", fontSize: 14 },
  activeCard: {
    backgroundColor: "#102117",
    borderColor: "#245C35",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    padding: 17,
  },
  activeLabel: { color: "#4ADE80", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  activeTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 7 },
  activeText: { color: "#B8C9BD", fontSize: 14, lineHeight: 20, marginTop: 7 },
  lockedCard: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    marginTop: 18,
    padding: 17,
  },
  lockIcon: { color: "#F97316", fontSize: 18 },
  lockedContent: { flex: 1 },
  lockedTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  lockedText: { color: "#9CA3AF", fontSize: 13, lineHeight: 19, marginTop: 6 },
  sectionTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", marginBottom: 12, marginTop: 28 },
  featureCard: {
    backgroundColor: "#151515",
    borderColor: "#2B2B2B",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 15,
  },
  featureMarker: { color: "#F97316", fontSize: 16, fontWeight: "900" },
  featureContent: { flex: 1 },
  featureTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  featureDescription: { color: "#8F96A3", fontSize: 13, lineHeight: 18, marginTop: 4 },
  freeCard: {
    backgroundColor: "#111B24",
    borderColor: "#243746",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    padding: 17,
  },
  freeLabel: { color: "#60A5FA", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  freeTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 7 },
  freeText: { color: "#AAB8C6", fontSize: 13, lineHeight: 19, marginTop: 6 },
  error: { color: "#F87171", fontSize: 13, lineHeight: 19, marginTop: 16 },
  refreshButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    paddingVertical: 13,
  },
  refreshText: { color: "#F97316", fontSize: 14, fontWeight: "800" },
  comingSoonButton: {
    alignItems: "center",
    backgroundColor: "#292929",
    borderRadius: 12,
    marginTop: 10,
    opacity: 0.75,
    paddingVertical: 15,
  },
  comingSoonText: { color: "#D1D5DB", fontSize: 15, fontWeight: "800" },
});
