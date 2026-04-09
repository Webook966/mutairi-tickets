import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: color + "18" }]}>
      <Ionicons name={name} size={focused ? 23 : 21} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { currentUser, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/(auth)/");
    }
  }, [currentUser, isLoading]);

  if (!currentUser) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : Platform.OS === "web" ? 70 : 68,
          paddingBottom: Platform.OS === "ios" ? 26 : Platform.OS === "web" ? 8 : 8,
          paddingTop: 6,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: "حجز تذكرة",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "ticket" : "ticket-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-tickets"
        options={{
          title: "تذاكري",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "albums" : "albums-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "المحفظة",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "حسابي",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "person-circle" : "person-circle-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 38,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
