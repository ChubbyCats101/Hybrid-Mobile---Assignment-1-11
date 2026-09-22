import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.ball}>
        <View style={styles.ballTop} />
        <View style={styles.ballLine} />
        <View style={styles.ballCenter}>
          <Ionicons name={icon} size={28} color="#D62828" />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="flash" size={16} color="#302B20" />
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 38,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  ball: {
    width: 96,
    height: 96,
    marginBottom: 20,
    overflow: "hidden",
    borderRadius: 48,
    borderWidth: 6,
    borderColor: "#252832",
    backgroundColor: "#FFFFFF",
  },
  ballTop: {
    width: "100%",
    height: "50%",
    backgroundColor: "#D62828",
  },
  ballLine: {
    position: "absolute",
    top: 41,
    width: "100%",
    height: 8,
    backgroundColor: "#252832",
  },
  ballCenter: {
    position: "absolute",
    top: 25,
    left: 25,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 6,
    borderColor: "#252832",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#252832",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    maxWidth: 310,
    marginTop: 8,
    color: "#777B85",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    minWidth: 150,
    paddingVertical: 12,
    paddingHorizontal: 19,
    borderRadius: 14,
    backgroundColor: "#F7C948",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#302B20",
    fontSize: 14,
    fontWeight: "900",
  },
});
