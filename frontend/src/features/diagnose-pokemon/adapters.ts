import { brand } from "#/shared/lib/branded";
import type { PokemonName } from "#/entities/pokemon/model/types";

import type { MatchResult, RawMatchResult } from "./types";

export const toMatchResult = (raw: unknown): MatchResult => {
  const r = raw as RawMatchResult;
  return {
    score: r.score,
    nameA: brand<PokemonName>(r.name_a),
    nameB: brand<PokemonName>(r.name_b),
    imgA: r.img_a,
    imgB: r.img_b,
  };
};
