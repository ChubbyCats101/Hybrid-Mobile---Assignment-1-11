export type PokemonListItem = {
  id: number;
  name: string;
  image: string;
  types: string[];
};

export type PokemonStat = {
  name: string;
  value: number;
};

export type PokemonDetail = PokemonListItem & {
  height: number;
  weight: number;
  abilities: string[];
  stats: PokemonStat[];
};

export type PokemonApiResponse = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other: {
      "official-artwork": {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
};
