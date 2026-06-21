import { createFileRoute } from "@tanstack/react-router";

type RawPokemonListResponse = {
  results: { name: string; url: string }[];
};

type RawSpeciesResponse = {
  names: { name: string; language: { name: string } }[];
};

const POKEAPI = "https://pokeapi.co/api/v2";

export const Route = createFileRoute("/api/pokemon-list")({
  server: {
    handlers: {
      GET: async () => {
        const listRes = await fetch(`${POKEAPI}/pokemon?limit=151`);
        if (!listRes.ok) throw new Error(`PokeAPI error: ${listRes.status}`);
        const listData = (await listRes.json()) as RawPokemonListResponse;

        const items = await Promise.all(
          listData.results.map(async (pokemon, index) => {
            const id = index + 1;
            const speciesRes = await fetch(`${POKEAPI}/pokemon-species/${id}`);
            if (!speciesRes.ok) throw new Error(`PokeAPI species error: id=${id}`);
            const species = (await speciesRes.json()) as RawSpeciesResponse;
            return { id, name: pokemon.name, names: species.names };
          }),
        );

        return Response.json(items);
      },
    },
  },
});
