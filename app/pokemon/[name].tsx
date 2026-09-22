import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import EmptyState from "../../components/EmptyState";
import { TYPE_COLORS } from "../../constants/typeColors";
import { usePokemonApp } from "../../contexts/PokemonAppContext";
import {
  fetchPokemonByName,
  formatPokemonName,
} from "../../services/pokeapi";
import { PokemonDetail } from "../../types/pokemon";

export default function PokemonDetailScreen() {
  const params = useLocalSearchParams<{ name?: string | string[] }>();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const {
    isFavorite,
    toggleFavorite,
    isInTeam,
    toggleTeamMember,
    team,
    hydrated,
  } = usePokemonApp();

  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!name) {
      setError("ไม่พบชื่อโปเกมอน");
      setLoading(false);
      return;
    }

    let active = true;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchPokemonByName(name);
        if (active) {
          setPokemon(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดรายละเอียดโปเกมอนได้"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      active = false;
    };
  }, [name]);

  if (loading || !hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E3350D" />
        <Text style={styles.loadingText}>กำลังโหลดรายละเอียด...</Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="alert-circle-outline"
          title="ไม่พบข้อมูลโปเกมอน"
          message={error || "โปรดลองเปิดใหม่อีกครั้ง"}
          actionLabel="กลับไป Pokédex"
          onAction={() => router.replace("/pokedex")}
        />
      </View>
    );
  }

  const favorite = isFavorite(pokemon.name);
  const inTeam = isInTeam(pokemon.name);
  const teamIsFull = team.length >= 6 && !inTeam;
  const primaryColor = TYPE_COLORS[pokemon.types[0]] ?? "#7B7F8C";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, { backgroundColor: `${primaryColor}22` }]}>
        <View style={styles.numberRow}>
          <Text style={styles.number}>
            #{String(pokemon.id).padStart(3, "0")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"
            }
            onPress={() => void toggleFavorite(pokemon.name)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={28}
              color={favorite ? "#E3350D" : "#5E626E"}
            />
          </Pressable>
        </View>

        <Image source={{ uri: pokemon.image }} style={styles.image} />

        <Text style={styles.name}>{formatPokemonName(pokemon.name)}</Text>

        <View style={styles.types}>
          {pokemon.types.map((type) => (
            <Pressable
              key={type}
              onPress={() =>
                router.push({ pathname: "/pokedex", params: { type } })
              }
              style={[
                styles.typeBadge,
                { backgroundColor: TYPE_COLORS[type] ?? "#7B7F8C" },
              ]}
            >
              <Text style={styles.typeText}>{type}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.quickStats}>
        <InfoBox
          label="ส่วนสูง"
          value={`${(pokemon.height / 10).toFixed(1)} m`}
        />
        <View style={styles.divider} />
        <InfoBox
          label="น้ำหนัก"
          value={`${(pokemon.weight / 10).toFixed(1)} kg`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abilities</Text>
        <View style={styles.abilityWrap}>
          {pokemon.abilities.map((ability) => (
            <View key={ability} style={styles.abilityChip}>
              <Text style={styles.abilityText}>
                {formatPokemonName(ability)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Base Stats</Text>
        {pokemon.stats.map((stat) => (
          <View key={stat.name} style={styles.statRow}>
            <Text style={styles.statName}>{formatPokemonName(stat.name)}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <View style={styles.statTrack}>
              <View
                style={[
                  styles.statFill,
                  {
                    width: `${Math.min((stat.value / 180) * 100, 100)}%`,
                    backgroundColor: primaryColor,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <Pressable
        disabled={teamIsFull}
        onPress={() => void toggleTeamMember(pokemon.name)}
        style={({ pressed }) => [
          styles.teamButton,
          inTeam && styles.removeButton,
          teamIsFull && styles.disabledButton,
          pressed && !teamIsFull && styles.pressed,
        ]}
      >
        <Ionicons
          name={inTeam ? "remove-circle-outline" : "add-circle-outline"}
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.teamButtonText}>
          {inTeam
            ? "นำออกจากทีม"
            : teamIsFull
              ? "ทีมเต็มแล้ว (6/6)"
              : `เพิ่มเข้าทีม (${team.length}/6)`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FC",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#666A76",
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
  },
  numberRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  number: {
    color: "#676B77",
    fontSize: 15,
    fontWeight: "900",
  },
  favoriteButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFCC",
  },
  image: {
    width: 220,
    height: 220,
  },
  name: {
    color: "#20222A",
    fontSize: 31,
    fontWeight: "900",
  },
  types: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 999,
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  quickStats: {
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
  },
  infoValue: {
    color: "#20222A",
    fontSize: 19,
    fontWeight: "900",
  },
  infoLabel: {
    marginTop: 4,
    color: "#858995",
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: "#E8E9EE",
  },
  section: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    marginBottom: 14,
    color: "#20222A",
    fontSize: 18,
    fontWeight: "900",
  },
  abilityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  abilityChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F0F1F5",
  },
  abilityText: {
    color: "#454955",
    fontSize: 13,
    fontWeight: "700",
  },
  statRow: {
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  statName: {
    width: 92,
    color: "#686C78",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    width: 36,
    color: "#20222A",
    fontSize: 13,
    fontWeight: "900",
  },
  statTrack: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#ECEEF2",
  },
  statFill: {
    height: "100%",
    borderRadius: 999,
  },
  teamButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#E3350D",
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    backgroundColor: "#484C58",
  },
  disabledButton: {
    backgroundColor: "#A5A8B1",
  },
  pressed: {
    opacity: 0.8,
  },
  teamButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});

