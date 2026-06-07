# TypeScript Rules

Full reference: [docs/coding-guide.md](../docs/coding-guide.md)

## Branded Types

Domain identifiers (IDs, names, etc.) must be declared as Branded Types — never as raw primitives.

```ts
// ✅ Correct location: entities/xxx/model/types.ts
import type { Branded } from "#/shared/lib/branded";

export type PokemonId   = Branded<number, "PokemonId">;
export type PokemonName = Branded<string, "PokemonName">;
```

Use Branded Types in props to prevent accidentally passing the wrong ID type:

```ts
// ✅
type Props = { pokemonId: PokemonId };

// ❌ Raw primitives allow ID mix-ups
type Props = { pokemonId: number };
```

## Type Assertion Rules

| Usage | Allowed | Location |
|---|---|---|
| `as T` (converting BFF `unknown` response → Raw type) | ✅ | `adapters.ts` only |
| `brand<T>()` | ✅ | `adapters.ts` only |
| `as T` (anywhere else) | ❌ | — |
| `!` (Non-null assertion) | ❌ | — |

### adapters.ts — the only place for type casting

```ts
// ✅ entities/xxx/model/adapters.ts
export const toPokemon = (raw: RawPokemon): Pokemon => ({
  id:   brand<PokemonId>(raw.id),
  name: brand<PokemonName>(raw.name),
});
```

```ts
// ❌ Never call brand() inside components or hooks
```

## Non-null Assertion

Never use `!`. Replace with:
- Explicit `undefined` check: `if (value !== undefined)`
- Optional chaining: `value?.property`

## Raw Type Naming

BFF response types must use the `Raw` prefix:

```ts
type RawPokemon = { id: number; name: string };  // ✅
type Pokemon    = { id: PokemonId; name: PokemonName };  // internal domain type
```
