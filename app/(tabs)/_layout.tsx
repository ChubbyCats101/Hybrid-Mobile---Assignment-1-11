import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons name={name} color={color} size={22} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      initialRouteName="events"
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#183F38" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 21,
        },
        tabBarActiveTintColor: "#21584B",
        tabBarInactiveTintColor: "#7B7D86",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 7,
          paddingBottom: 8 + insets.bottom,
          borderTopWidth: 3,
          borderTopColor: "#F7C948",
          backgroundColor: "#FFFFFF",
          elevation: 12,
        },
        sceneStyle: {
          backgroundColor: "#F5F2E9",
        },
      }}
    >
      <Tabs.Screen name="events" options={{ title: "กิจกรรม", tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} focused={focused} /> }} />
      <Tabs.Screen
        name="pokedex"
        options={{
          title: "Pokédex",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "grid" : "grid-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="pokemon-favorites"
        options={{
          title: "โปเกมอนโปรด",
          href: null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "heart" : "heart-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen name="camera" options={{ title: "กล้อง", tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'camera' : 'camera-outline'} color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: "โปรไฟล์ / ทริป", tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} /> }} />
      <Tabs.Screen name="favorites" options={{ title: "กิจกรรมโปรด", tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'heart' : 'heart-outline'} color={color} focused={focused} /> }} />
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="team"
        options={{
          title: "My Team",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapFocused: {
    backgroundColor: "#FDE8E7",
  },
});
