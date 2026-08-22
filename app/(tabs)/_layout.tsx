import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: "#0B0B0B",
        },
        tabBarActiveTintColor: "#F97316",
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "#262626",
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={size}
            />
          ),
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "barbell" : "barbell-outline"}
              size={size}
            />
          ),
          title: "Training",
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "restaurant" : "restaurant-outline"}
              size={size}
            />
          ),
          title: "Nutrition",
        }}
      />

      <Tabs.Screen
        name="supplements"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "medical" : "medical-outline"}
              size={size}
            />
          ),
          title: "Supps",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "person" : "person-outline"}
              size={size}
            />
          ),
          title: "Profile",
        }}
      />

      <Tabs.Screen name="ai-coach" options={{ href: null }} />
      <Tabs.Screen name="program-builder" options={{ href: null }} />
      <Tabs.Screen name="new-workout" options={{ href: null }} />
      <Tabs.Screen name="new-template" options={{ href: null }} />
      <Tabs.Screen
        name="new-nutrition-entry"
        options={{ href: null }}
      />
      <Tabs.Screen name="nutrition-goals" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="exercise" options={{ href: null }} />
      <Tabs.Screen name="template" options={{ href: null }} />
      <Tabs.Screen name="new-exercise" options={{ href: null }} />
      <Tabs.Screen name="new-supplement" options={{ href: null }} />
      <Tabs.Screen name="exercise-library" options={{ href: null }} />
      <Tabs.Screen name="recovery" options={{ href: null }} />
      <Tabs.Screen name="recovery-check-in" options={{ href: null }} />
      <Tabs.Screen name="legal" options={{ href: null }} />
    </Tabs>
  );
}
