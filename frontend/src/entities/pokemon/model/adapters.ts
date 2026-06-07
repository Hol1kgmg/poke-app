import { brand } from "#/shared/lib/branded";

import type { Pokemon, PokemonId, PokemonName } from "./types";

type RawPokemon = {
  id: number;
  name: string;
};

export const toPokemon = (raw: RawPokemon): Pokemon => ({
  id: brand<PokemonId>(raw.id),
  name: brand<PokemonName>(raw.name),
});
