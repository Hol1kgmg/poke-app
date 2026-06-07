# Server Function Rules

Full reference: [docs/coding-guide.md](../docs/coding-guide.md), [docs/layer-architecture-guide.md](../docs/layer-architecture-guide.md)

## Placement and Call Sites

| Type | Define in | Call from |
|---|---|---|
| Read (GET) | `entities/xxx/api/index.ts` | `app/` loaders only |
| Mutation (POST/PUT/DELETE) | `features/xxx/serverFn.ts` | Same feature's components/hooks only |
| Response adapter | `entities/xxx/model/adapters.ts` | `app/` loader (Read) or `features/xxx/` (after Mutation) |

## Read serverFns

```ts
// ✅ entities/pokemon/api/index.ts
export const fetchPokemon = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    const raw = await fetch(`/api/pokemon/${data}`).then(r => r.json());
    return toPokemon(raw as RawPokemon);
  });
```

- Must include `inputValidator` (omit only when there are no arguments)
- Called only from `app/` loaders — never from UI components directly

```ts
// ❌ Calling Read serverFn from a component
const pokemon = await fetchPokemon({ data: 1 }); // prohibited in widgets/features
```

## Mutation serverFns

```ts
// ✅ features/toggle-favorite/serverFn.ts
export const toggleFavoriteFn = createServerFn({ method: "POST" })
  .inputValidator((data: { pokemonId: PokemonId }) => data)
  .handler(async ({ data }) => { /* ... */ });
```

- Owned exclusively by the feature that defines it
- Other features must NOT call it — define independently if needed (duplication is acceptable)
- Must NOT be placed in `entities/xxx/api/` — that directory is Read-only

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
