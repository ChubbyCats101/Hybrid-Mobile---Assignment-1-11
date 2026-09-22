import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import EmptyState from "../../components/EmptyState";
import PokemonCard from "../../components/PokemonCard";
import { usePokemonApp } from "../../contexts/PokemonAppContext";
import { fetchPokemonByName } from "../../services/pokeapi";
import { PokemonListItem } from "../../types/pokemon";

export default function FavoritesScreen() {
  const { favorites, isFavorite, toggleFavorite, hydrated } = usePokemonApp();
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<'id' | 'name' | 'type'>('id');
  const isFirstLoad = useRef(true);

  // Undo state
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoPokemonName, setUndoPokemonName] = useState<string | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      if (!hydrated) return;
      if (favorites.length === 0) {
        setPokemon([]);
        isFirstLoad.current = false;
        return;
      }

      try {
        if (isFirstLoad.current) {
          setLoading(true);
        }

        const data = await Promise.all(
          favorites.map((name) => fetchPokemonByName(name))
        );
        if (active) {
          setPokemon(data);
        }
      } finally {
        if (active) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    void loadFavorites();

    return () => {
      active = false;
    };
  }, [favorites, hydrated]);

  const onRefresh = async () => {
    if (!hydrated) return;
    setRefreshing(true);
    try {
      const data = await Promise.all(
        favorites.map((name) => fetchPokemonByName(name))
      );
      setPokemon(data);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFavorite = (name: string) => {
    if (isFavorite(name)) {
      setUndoPokemonName(name);
      setUndoVisible(true);

      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setUndoVisible(false);
        setUndoPokemonName(null);
      }, 3000);
    }

    void toggleFavorite(name);
  };

  const handleUndo = () => {
    if (undoPokemonName) {
      void toggleFavorite(undoPokemonName);
      setUndoVisible(false);
      setUndoPokemonName(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const sortedPokemon = useMemo(() => {
    return [...pokemon].sort((a, b) => {
      if (sortOption === 'id') return a.id - b.id;
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'type') {
        const typeA = a.types[0] || '';
        const typeB = b.types[0] || '';
        return typeA.localeCompare(typeB);
      }
      return 0;
    });
  }, [pokemon, sortOption]);

  if (!hydrated || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E3350D" />
        <Text style={styles.loadingText}>กำลังโหลดรายการโปรด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPokemon}
        keyExtractor={(item) => item.name}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#E3350D"]} tintColor="#E3350D" />
        }
        contentContainerStyle={[
          styles.listContent,
          pokemon.length === 0 && styles.emptyContent,
        ]}
        columnWrapperStyle={pokemon.length > 0 ? styles.column : undefined}
        ListHeaderComponent={
          pokemon.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.title}>โปเกมอนที่ชื่นชอบ</Text>
              <Text style={styles.subtitle}>
                บันทึกไว้แล้ว {pokemon.length} ตัว
              </Text>

              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>เรียงโดย:</Text>
                <TouchableOpacity
                  style={[styles.sortChip, sortOption === 'id' && styles.sortChipActive]}
                  onPress={() => setSortOption('id')}
                >
                  <Text style={[styles.sortChipText, sortOption === 'id' && styles.sortChipTextActive]}>หมายเลข</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortChip, sortOption === 'name' && styles.sortChipActive]}
                  onPress={() => setSortOption('name')}
                >
                  <Text style={[styles.sortChipText, sortOption === 'name' && styles.sortChipTextActive]}>ชื่อ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortChip, sortOption === 'type' && styles.sortChipActive]}
                  onPress={() => setSortOption('type')}
                >
                  <Text style={[styles.sortChipText, sortOption === 'type' && styles.sortChipTextActive]}>ชนิด</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <PokemonCard
            pokemon={item}
            favorite={isFavorite(item.name)}
            onPress={() => router.push(`/pokemon/${item.name}`)}
            onToggleFavorite={() => handleToggleFavorite(item.name)}
            onTypePress={(type) =>
              router.push({ pathname: "/pokedex", params: { type } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="ยังไม่มีโปเกมอนที่ชื่นชอบ"
            message="กดรูปหัวใจบนการ์ดโปเกมอน แล้วรายการจะปรากฏที่หน้านี้"
            actionLabel="ไปที่ Pokédex"
            onAction={() => router.push("/pokedex")}
          />
        }
      />

      {undoVisible && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>ลบโปเกมอนออกจากรายการโปรดแล้ว</Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={styles.snackbarAction}>เลิกทำ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FC",
  },
  loadingText: {
    marginTop: 12,
    color: "#666A76",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#F7F8FC",
    flexGrow: 1,
  },
  emptyContent: {
    justifyContent: "center",
  },
  column: {
    gap: 12,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: "#20222A",
    fontSize: 27,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 5,
    color: "#777B87",
    fontSize: 14,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: "#666A76",
    fontWeight: "500",
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E8E9ED",
  },
  sortChipActive: {
    backgroundColor: "#E3350D",
  },
  sortChipText: {
    fontSize: 13,
    color: "#666A76",
    fontWeight: "600",
  },
  sortChipTextActive: {
    color: "#FFFFFF",
  },
  snackbar: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#333333",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  snackbarText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  snackbarAction: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

