# BFF Request Rules

Full reference: [docs/layer-architecture-guide.md](../docs/layer-architecture-guide.md)

> **Note**: This file contains only the key rules needed for quick reference.
> Full details and rationale are in the guide above. When in doubt, read the guide.

## Placement and Call Sites

| Type | Define in | Call from |
|---|---|---|
| Read (GET) | `features/xxx/useXxx.ts` (useQuery) | Same feature's components only |
| Mutation (POST/PUT/DELETE) | `features/xxx/useXxx.ts` | Same feature's components only |
| BFF endpoint | `routes/api/xxx.ts` | `features/` via `fetch('/api/xxx')` |
| Response adapter | `entities/xxx/model/adapters.ts` | `features/xxx/useXxx.ts` after fetch |

## Read (useQuery)

```ts
// ✅ features/search-pokemon/useSearchPokemon.ts
export function useSearchPokemon(id: number) {
  return useQuery({
    queryKey: ["pokemon", id],
    queryFn: async () => {
      const res = await fetch(`/api/pokemon/${id}`);
      if (!res.ok) throw new Error(`BFF error: ${res.status}`);
      return toPokemon(await res.json());
    },
  });
}
```

- Defined in `features/xxx/useXxx.ts` — owned by this feature
- Called only from the same feature's components

```ts
// ❌ Fetching from entities or widgets
// entities/pokemon/ui/PokemonCard.tsx に fetch を書いてはいけない
```

## Mutation (fetch)

```ts
// ✅ features/toggle-favorite/useToggleFavorite.ts
export function useToggleFavorite() {
  const toggle = async (pokemonId: PokemonId) => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pokemonId }),
    });
    if (!res.ok) throw new Error(`BFF error: ${res.status}`);
  };
  return { toggle };
}
```

- Owned exclusively by the feature that defines it
- Other features must NOT call it — define independently if needed (duplication is acceptable)

## "use client" Boundary

Apply `"use client"` only to the minimum unit that needs state, events, or browser APIs.

```tsx
// ❌ Client-marking the whole block
"use client";
export function PokemonPanel({ pokemon }: Props) {
  return (
    <section>
      <PokemonCard pokemon={pokemon} />    {/* becomes client unnecessarily */}
      <FavoriteButton pokemonId={pokemon.id} />
    </section>
  );
}

// ✅ Extract only the interactive part
export function PokemonPanel({ pokemon }: Props) {
  return (
    <section>
      <PokemonCard pokemon={pokemon} />
      <FavoriteButton pokemonId={pokemon.id} />  {/* "use client" inside here only */}
    </section>
  );
}
```
