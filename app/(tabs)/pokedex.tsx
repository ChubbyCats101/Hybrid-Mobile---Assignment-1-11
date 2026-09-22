import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import EmptyState from "../../components/EmptyState";
import PokemonCard from "../../components/PokemonCard";
import PokemonSearchBar from "../../components/PokemonSearchBar";
import TypeFilter from "../../components/TypeFilter";
import { usePokemonApp } from "../../contexts/PokemonAppContext";
import { fetchPokemonList } from "../../services/pokeapi";
import { PokemonListItem } from "../../types/pokemon";
import { Action } from "../../components/JourneyUI";

const POKEMON_LIMIT = 151;

export default function PokedexScreen() {
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const { isFavorite, toggleFavorite } = usePokemonApp();

  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const incomingType = Array.isArray(params.type) ? params.type[0] : params.type;
    if (incomingType) {
      setSelectedTypes([incomingType.toLowerCase()]);
    }
  }, [params.type]);

  const toggleType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

  const loadPokemon = async (isRefresh = false) => {
    try {
      setError("");
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await fetchPokemonList(POKEMON_LIMIT);
      setPokemon(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลโปเกมอนได้"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPokemon();
  }, []);

  const availableTypes = useMemo(() => {
    return [...new Set(pokemon.flatMap((item) => item.types))].sort();
  }, [pokemon]);

  const filteredPokemon = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return pokemon.filter((item) => {
      const matchesName =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery);

      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some((type) => item.types.includes(type));

      return matchesName && matchesType;
    });
  }, [pokemon, query, selectedTypes]);

  if (loading) {
    return (
      <View style={styles.center}>
        <PokeballSpinner />
        <ActivityIndicator
          size="small"
          color="#D62828"
          style={styles.activity}
        />
        <Text style={styles.loadingText}>กำลังเปิด Pokédex...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline-outline"
          title="โหลดข้อมูลไม่สำเร็จ"
          message={`${error}\nแตะปุ่มด้านล่างเพื่อลองใหม่`}
          actionLabel="ลองอีกครั้ง"
          onAction={() => void loadPokemon()}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredPokemon}
      keyExtractor={(item) => item.name}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.column}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadPokemon(true)}
          tintColor="#D62828"
        />
      }
      ListHeaderComponent={
        <View>
          <View style={{ padding: 16, gap: 10 }}><Action title="← กิจกรรม PokéJourney" onPress={() => router.push('/events')} /><Action secondary title="โปเกมอนโปรด / เตรียมทีม" onPress={() => router.push('/pokemon-favorites')} /></View>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroBallTop} />
            <View style={styles.heroBallLine} />
            <View style={styles.heroBallCenter}>
              <View style={styles.heroBallCenterInner} />
            </View>

            <View style={styles.regionBadge}>
              <Text style={styles.regionText}>KANTO REGION</Text>
            </View>

            <Text style={styles.heroTitle}>Pokédex</Text>
            <Text style={styles.heroSubtitle}>
              ค้นหาโปเกมอนและสร้างทีมในฝันของคุณ
            </Text>

            <View style={styles.dexCounter}>
              <Text style={styles.dexCounterLabel}>REGISTERED</Text>
              <Text style={styles.dexCounterValue}>
                {String(pokemon.length).padStart(3, "0")}
              </Text>
            </View>
          </View>

          <View style={styles.searchSection}>
            <PokemonSearchBar
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery("")}
            />

            <Text style={styles.filterTitle}>ค้นหาตามประเภท</Text>
            <TypeFilter
              types={availableTypes}
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              onClear={clearTypes}
            />
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultTitle}>Pokémon List</Text>
            <Text style={styles.resultText}>
              พบทั้งหมด {filteredPokemon.length} รายการ
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <PokemonCard
          pokemon={item}
          favorite={isFavorite(item.name)}
          onPress={() => router.push(`/pokemon/${item.name}`)}
          onToggleFavorite={() => void toggleFavorite(item.name)}
          onTypePress={(type) => setSelectedTypes([type])}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="search-outline"
          title="ไม่พบโปเกมอน"
          message={
            query.trim()
              ? `ไม่พบชื่อที่ตรงกับ “${query.trim()}”`
              : "ไม่มีโปเกมอนในประเภทที่เลือก"
          }
          actionLabel="ล้างตัวกรอง"
          onAction={() => {
            setQuery("");
            clearTypes();
          }}
        />
      }
    />
  );
}

function PokeballSpinner() {
  return (
    <View style={styles.spinnerBall}>
      <View style={styles.spinnerTop} />
      <View style={styles.spinnerLine} />
      <View style={styles.spinnerCenter}>
        <View style={styles.spinnerCenterInner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F2E9",
    padding: 24,
  },
  activity: {
    marginTop: 18,
  },
  loadingText: {
    marginTop: 9,
    color: "#575B65",
    fontSize: 15,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 34,
    backgroundColor: "#F5F2E9",
    flexGrow: 1,
  },
  column: {
    gap: 12,
    paddingHorizontal: 16,
  },
  hero: {
    minHeight: 225,
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 28,
    overflow: "hidden",
    backgroundColor: "#D62828",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -40,
    top: -45,
    backgroundColor: "#EF5350",
  },
  heroBallTop: {
    position: "absolute",
    right: -30,
    bottom: -62,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FFFFFF22",
    borderWidth: 8,
    borderColor: "#FFFFFF32",
  },
  heroBallLine: {
    position: "absolute",
    right: -18,
    bottom: 27,
    width: 185,
    height: 13,
    backgroundColor: "#FFFFFF35",
  },
  heroBallCenter: {
    position: "absolute",
    right: 48,
    bottom: -3,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#D62828",
    borderWidth: 10,
    borderColor: "#FFFFFF42",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBallCenterInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF55",
  },
  regionBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "#F7C948",
  },
  regionText: {
    color: "#302B20",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 15,
    color: "#FFFFFF",
    fontSize: 39,
    lineHeight: 45,
    fontWeight: "900",
    letterSpacing: -1,
  },
  heroSubtitle: {
    width: "72%",
    marginTop: 5,
    color: "#FFEDEE",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  dexCounter: {
    position: "absolute",
    right: 23,
    top: 34,
    alignItems: "flex-end",
  },
  dexCounterLabel: {
    color: "#FFD9D9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  dexCounterValue: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
  },
  searchSection: {
    marginTop: -18,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#4A2020",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  filterTitle: {
    marginTop: 14,
    marginLeft: 2,
    color: "#343742",
    fontSize: 13,
    fontWeight: "900",
  },
  resultRow: {
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultTitle: {
    color: "#252832",
    fontSize: 21,
    fontWeight: "900",
  },
  resultText: {
    marginTop: 3,
    color: "#777B85",
    fontSize: 12,
    fontWeight: "600",
  },
  spinnerBall: {
    width: 86,
    height: 86,
    overflow: "hidden",
    borderRadius: 43,
    borderWidth: 6,
    borderColor: "#252832",
    backgroundColor: "#FFFFFF",
  },
  spinnerTop: {
    width: "100%",
    height: "50%",
    backgroundColor: "#D62828",
  },
  spinnerLine: {
    position: "absolute",
    top: 36,
    width: "100%",
    height: 8,
    backgroundColor: "#252832",
  },
  spinnerCenter: {
    position: "absolute",
    top: 25,
    left: 25,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 6,
    borderColor: "#252832",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerCenterInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
});

