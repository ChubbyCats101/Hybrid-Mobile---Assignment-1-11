import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

const FAVORITES_KEY = "@pokedex-team-builder/favorites";
const TEAM_KEY = "@pokedex-team-builder/team";
const MAX_TEAM_SIZE = 6;

type PokemonAppContextValue = {
  favorites: string[];
  team: string[];
  hydrated: boolean;
  isFavorite: (name: string) => boolean;
  toggleFavorite: (name: string) => Promise<void>;
  isInTeam: (name: string) => boolean;
  toggleTeamMember: (name: string) => Promise<void>;
};

const PokemonAppContext = createContext<PokemonAppContextValue | undefined>(
  undefined
);

export function PokemonAppProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [team, setTeam] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restoreData = async () => {
      try {
        const [savedFavorites, savedTeam] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(TEAM_KEY),
        ]);

        setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
        setTeam(savedTeam ? JSON.parse(savedTeam) : []);
      } catch {
        Alert.alert(
          "แจ้งเตือน",
          "ไม่สามารถอ่านข้อมูลรายการโปรดหรือทีมที่เคยบันทึกไว้ได้"
        );
      } finally {
        setHydrated(true);
      }
    };

    void restoreData();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(TEAM_KEY, JSON.stringify(team));
  }, [team, hydrated]);

  const normalizeName = (name: string) => name.trim().toLowerCase();

  const isFavorite = useCallback(
    (name: string) => favorites.includes(normalizeName(name)),
    [favorites]
  );

  const toggleFavorite = useCallback(async (name: string) => {
    const normalized = normalizeName(name);

    setFavorites((current) =>
      current.includes(normalized)
        ? current.filter((item) => item !== normalized)
        : [...current, normalized]
    );
  }, []);

  const isInTeam = useCallback(
    (name: string) => team.includes(normalizeName(name)),
    [team]
  );

  const toggleTeamMember = useCallback(
    async (name: string) => {
      const normalized = normalizeName(name);

      setTeam((current) => {
        if (current.includes(normalized)) {
          return current.filter((item) => item !== normalized);
        }

        if (current.length >= MAX_TEAM_SIZE) {
          Alert.alert(
            "ทีมเต็มแล้ว",
            "หนึ่งทีมสามารถมีโปเกมอนได้สูงสุด 6 ตัว"
          );
          return current;
        }

        return [...current, normalized];
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      favorites,
      team,
      hydrated,
      isFavorite,
      toggleFavorite,
      isInTeam,
      toggleTeamMember,
    }),
    [
      favorites,
      team,
      hydrated,
      isFavorite,
      toggleFavorite,
      isInTeam,
      toggleTeamMember,
    ]
  );

  return (
    <PokemonAppContext.Provider value={value}>
      {children}
    </PokemonAppContext.Provider>
  );
}

export function usePokemonApp() {
  const context = useContext(PokemonAppContext);

  if (!context) {
    throw new Error(
      "usePokemonApp must be used inside PokemonAppProvider"
    );
  }

  return context;
}
