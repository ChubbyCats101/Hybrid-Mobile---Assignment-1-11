import { Stack, router, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PokemonAppProvider } from "../contexts/PokemonAppContext";
import { AuthProvider } from "../contexts/AuthContext";
import { EventsProvider } from "../contexts/EventsContext";
import { observeReminders } from "../services/reminders";

function NotificationLinks() {
  const state = useRootNavigationState();
  useEffect(() => {
    if (!state?.key) return;
    return observeReminders(id => router.push({ pathname: '/events/[id]', params: { id } }));
  }, [state?.key]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
      <EventsProvider>
      <PokemonAppProvider>
        <NotificationLinks />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerTitleAlign: "center",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#183F38" },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontWeight: "900" },
            contentStyle: { backgroundColor: "#F5F2E9" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "บัญชีสมาชิก" }} />
          <Stack.Screen name="events/[id]" options={{ title: "รายละเอียดกิจกรรม" }} />
          <Stack.Screen name="register/[id]" options={{ title: "ลงทะเบียนทริป" }} />
          <Stack.Screen
            name="pokemon/[name]"
            options={{ title: "Pokémon Data" }}
          />
        </Stack>
      </PokemonAppProvider>
      </EventsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
