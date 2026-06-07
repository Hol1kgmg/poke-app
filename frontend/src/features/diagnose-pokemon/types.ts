import type { PokemonName } from "#/entities/pokemon/model/types";

export type MatchRequest = { id_a: number; id_b: number };

export type RawMatchResult = {
  score: number;
  name_a: string;
  name_b: string;
  img_a: string;
  img_b: string;
};

export type MatchResult = {
  score: number;
  nameA: PokemonName;
  nameB: PokemonName;
  imgA: string;
  imgB: string;
};
