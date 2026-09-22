import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TYPE_COLORS } from "../constants/typeColors";
import { formatPokemonName } from "../services/pokeapi";
import { PokemonListItem } from "../types/pokemon";

type PokemonCardProps = {
  pokemon: PokemonListItem;
  favorite: boolean;
  inTeam?: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onTypePress: (type: string) => void;
  onToggleTeam?: () => void;
};

export default function PokemonCard({
  pokemon,
  favorite,
  inTeam = false,
  onPress,
  onToggleFavorite,
  onTypePress,
  onToggleTeam,
}: PokemonCardProps) {
  const primaryColor = TYPE_COLORS[pokemon.types[0]] ?? "#7B7F8C";

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ดูรายละเอียด ${pokemon.name}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.mainPressable,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.imageArea, { backgroundColor: primaryColor }]}>
          <View style={styles.ballOutline}>
            <View style={styles.ballLine} />
            <View style={styles.ballCenter} />
          </View>

          <View style={styles.numberPill}>
            <Text style={styles.number}>
              #{String(pokemon.id).padStart(3, "0")}
            </Text>
          </View>

          <Image source={{ uri: pokemon.image }} style={styles.image} />
        </View>

        <View style={styles.infoArea}>
          <Text numberOfLines={1} style={styles.name}>
            {formatPokemonName(pokemon.name)}
          </Text>

          <View style={styles.typeRow}>
            {pokemon.types.map((type) => (
              <Pressable
                key={type}
                onPress={() => onTypePress(type)}
                style={[
                  styles.typeBadge,
                  { borderColor: TYPE_COLORS[type] ?? "#7B7F8C" },
                ]}
              >
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: TYPE_COLORS[type] ?? "#7B7F8C" },
                  ]}
                />
                <Text style={styles.typeText}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          favorite ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"
        }
        onPress={onToggleFavorite}
        hitSlop={8}
        style={styles.favoriteButton}
      >
        <Ionicons
          name={favorite ? "heart" : "heart-outline"}
          size={21}
          color={favorite ? "#D62828" : "#6A6D77"}
        />
      </Pressable>

      {onToggleTeam && (
        <Pressable
          onPress={onToggleTeam}
          style={[
            styles.teamAction,
            inTeam && styles.removeTeamAction,
          ]}
        >
          <Ionicons
            name={inTeam ? "remove-circle-outline" : "add-circle-outline"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.teamActionText}>
            {inTeam ? "นำออกจากทีม" : "เพิ่มเข้าทีม"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E5E0D4",
    backgroundColor: "#FFFFFF",
    shadowColor: "#372525",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  mainPressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  imageArea: {
    height: 132,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ballOutline: {
    position: "absolute",
    right: -23,
    bottom: -37,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 7,
    borderColor: "#FFFFFF30",
  },
  ballLine: {
    position: "absolute",
    top: 55,
    left: -5,
    width: 140,
    height: 10,
    backgroundColor: "#FFFFFF30",
  },
  ballCenter: {
    position: "absolute",
    top: 40,
    left: 43,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 7,
    borderColor: "#FFFFFF30",
  },
  numberPill: {
    position: "absolute",
    left: 10,
    top: 10,
    zIndex: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#1E2027AA",
  },
  number: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  image: {
    width: 118,
    height: 118,
  },
  infoArea: {
    minHeight: 83,
    padding: 11,
  },
  name: {
    paddingRight: 29,
    color: "#252832",
    fontSize: 16,
    fontWeight: "900",
  },
  favoriteButton: {
    position: "absolute",
    right: 9,
    top: 143,
    zIndex: 3,
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F3EB",
  },
  typeRow: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  typeText: {
    color: "#555963",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  teamAction: {
    paddingVertical: 10,
    backgroundColor: "#D62828",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeTeamAction: {
    backgroundColor: "#252832",
  },
  teamActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
