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
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const offset = Number(url.searchParams.get("offset") ?? "0");
          const limit = Number(url.searchParams.get("limit") ?? "30");

          const listRes = await fetch(`${POKEAPI}/pokemon?offset=${offset}&limit=${limit}`);
          if (!listRes.ok) return new Response(`PokeAPI error: ${listRes.status}`, { status: 502 });
          const listData = (await listRes.json()) as RawPokemonListResponse;

          const items = await Promise.all(
            listData.results.map(async (pokemon, index) => {
              const id = offset + index + 1;
              const speciesRes = await fetch(`${POKEAPI}/pokemon-species/${id}`);
              if (!speciesRes.ok) throw new Error(`PokeAPI species error: id=${id}`);
              const species = (await speciesRes.json()) as RawSpeciesResponse;
              return { id, name: pokemon.name, names: species.names };
            }),
          );

          return Response.json(items);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Internal error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
