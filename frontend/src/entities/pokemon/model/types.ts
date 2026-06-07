import type { Branded } from "#/shared/lib/branded";

export type PokemonId = Branded<number, "PokemonId">;
export type PokemonName = Branded<string, "PokemonName">;

export type Pokemon = {
  id: PokemonId;
  name: PokemonName;
};
