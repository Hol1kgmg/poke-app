import { createFileRoute } from "@tanstack/react-router";

import type { RawMatchResult } from "#/features/diagnose-pokemon/types";

type RawPokemonResponse = {
  name: string;
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  sprites: { front_default: string };
};

type RawPokemonSpeciesResponse = {
  egg_groups: { name: string }[];
  color: { name: string };
  shape: { name: string };
  names: { name: string; language: { name: string } }[];
};

const POKEAPI = "https://pokeapi.co/api/v2";

async function fetchPokemonData(id: number): Promise<{
  pokemon: RawPokemonResponse;
  species: RawPokemonSpeciesResponse;
}> {
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${POKEAPI}/pokemon/${id}`),
    fetch(`${POKEAPI}/pokemon-species/${id}`),
  ]);
  if (!pokemonRes.ok || !speciesRes.ok) {
    throw new Error(`PokeAPI error for id=${id}`);
  }
  const [pokemon, species] = await Promise.all([
    pokemonRes.json() as Promise<RawPokemonResponse>,
    speciesRes.json() as Promise<RawPokemonSpeciesResponse>,
  ]);
  return { pokemon, species };
}

function getJapaneseName(species: RawPokemonSpeciesResponse, fallback: string): string {
  const jaHrkt = species.names.find((n) => n.language.name === "ja-Hrkt");
  if (jaHrkt !== undefined) return jaHrkt.name;
  const ja = species.names.find((n) => n.language.name === "ja");
  if (ja !== undefined) return ja.name;
  return fallback;
}

async function calcScore(
  id_a: number,
  id_b: number,
  dataA: { pokemon: RawPokemonResponse; species: RawPokemonSpeciesResponse },
  dataB: { pokemon: RawPokemonResponse; species: RawPokemonSpeciesResponse },
): Promise<number> {
  const [firstData, secondData] = id_a < id_b ? [dataA, dataB] : [dataB, dataA];
  const parts = [
    firstData.pokemon.types.map((t) => t.type.name).join(","),
    firstData.pokemon.abilities.map((a) => a.ability.name).join(","),
    firstData.species.egg_groups.map((g) => g.name).join(","),
    firstData.species.color.name,
    firstData.species.shape.name,
    secondData.pokemon.types.map((t) => t.type.name).join(","),
    secondData.pokemon.abilities.map((a) => a.ability.name).join(","),
    secondData.species.egg_groups.map((g) => g.name).join(","),
    secondData.species.color.name,
    secondData.species.shape.name,
  ];
  const str = parts.join("|");
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Math.round((new Uint8Array(hashBuffer)[0] / 255) * 100);
}

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { id_a, id_b } = (await request.json()) as { id_a: number; id_b: number };

        const [dataA, dataB] = await Promise.all([
          fetchPokemonData(id_a),
          fetchPokemonData(id_b),
        ]);

        const score = await calcScore(id_a, id_b, dataA, dataB);

        const result: RawMatchResult = {
          score,
          name_a: getJapaneseName(dataA.species, dataA.pokemon.name),
          name_b: getJapaneseName(dataB.species, dataB.pokemon.name),
          img_a: dataA.pokemon.sprites.front_default,
          img_b: dataB.pokemon.sprites.front_default,
        };

        return Response.json(result);
      },
    },
  },
});
