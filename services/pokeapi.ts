import { PokemonDetail, PokemonListItem, PokemonApiResponse } from "../types/pokemon";

const API_BASE_URL = "https://pokeapi.co/api/v2";
const DETAIL_BATCH_SIZE = 20;

let pokemonListCache: PokemonListItem[] | null = null;
const pokemonDetailCache = new Map<string, PokemonDetail>();

function mapPokemon(data: PokemonApiResponse): PokemonDetail {
  return {
    id: data.id,
    name: data.name,
    image:
      data.sprites.other["official-artwork"].front_default ??
      data.sprites.front_default ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
    types: data.types
      .sort((a, b) => a.slot - b.slot)
      .map((item) => item.type.name),
    height: data.height,
    weight: data.weight,
    abilities: data.abilities.map((item) => item.ability.name),
    stats: data.stats.map((item) => ({
      name: item.stat.name,
      value: item.base_stat,
    })),
  };
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokeAPI ตอบกลับด้วยสถานะ ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchPokemonList(
  limit = 151
): Promise<PokemonListItem[]> {
  if (pokemonListCache && pokemonListCache.length >= limit) {
    return pokemonListCache.slice(0, limit);
  }

  const list = await requestJson<{
    results: Array<{ name: string; url: string }>;
  }>(`${API_BASE_URL}/pokemon?limit=${limit}&offset=0`);

  const details: PokemonDetail[] = [];

  // แบ่งโหลดเป็นชุดเพื่อลดจำนวน request ที่ยิงพร้อมกัน
  for (let index = 0; index < list.results.length; index += DETAIL_BATCH_SIZE) {
    const batch = list.results.slice(index, index + DETAIL_BATCH_SIZE);
    const batchDetails = await Promise.all(
      batch.map((item) => fetchPokemonByName(item.name))
    );
    details.push(...batchDetails);
  }

  pokemonListCache = details
    .sort((a, b) => a.id - b.id)
    .map(({ id, name, image, types }) => ({ id, name, image, types }));

  return pokemonListCache;
}

export async function fetchPokemonByName(
  name: string
): Promise<PokemonDetail> {
  const normalizedName = name.trim().toLowerCase();
  const cached = pokemonDetailCache.get(normalizedName);

  if (cached) {
    return cached;
  }

  const data = await requestJson<PokemonApiResponse>(
    `${API_BASE_URL}/pokemon/${encodeURIComponent(normalizedName)}`
  );

  const mapped = mapPokemon(data);
  pokemonDetailCache.set(normalizedName, mapped);

  return mapped;
}

export function formatPokemonName(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
