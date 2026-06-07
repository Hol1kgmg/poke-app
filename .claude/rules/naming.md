# Naming Conventions

Full reference: [docs/coding-guide.md](../docs/coding-guide.md)

> **Note**: This file contains only the key rules needed for quick reference.
> Full details and rationale are in the guide above. When in doubt, read the guide.

## Files and Directories

| Target | Convention | Examples |
|---|---|---|
| Component files | PascalCase | `PokemonCard.tsx` |
| Style files | Same name as component | `PokemonCard.module.css` |
| Hooks | camelCase with `use` prefix | `useFavorite.ts` |
| Utilities / logic | camelCase | `adapters.ts`, `types.ts` |
| FSD slice directories | kebab-case | `search-pokemon/`, `pokemon-panel/` |

## Types

| Target | Convention | Examples |
|---|---|---|
| Branded Types | PascalCase, no kind suffix | `PokemonId`, `PokemonName` |
| BFF response types | `Raw` prefix | `RawPokemon` |
| Internal domain types | PascalCase | `Pokemon`, `PokemonType` |
| Props types | `Props` (unified) | `type Props = { ... }` |

## Functions and Variables

| Target | Convention | Examples |
|---|---|---|
| Adapter functions | `to` prefix | `toPokemon`, `toPokemonList` |
| Atom variables | `Atom` suffix | `selectedPokemonIdAtom` |

## Layer Naming Patterns

| Layer | Naming pattern | Correct examples | Incorrect examples |
|---|---|---|---|
| `features/` | verb + noun (kebab-case) | `create-order`, `toggle-favorite` | `order-management`, `user-info` |
| `widgets/` | noun (kebab-case) | `order-list-panel`, `sidebar-navigation` | `create-order` |
| `entities/` | resource name (kebab-case) | `pokemon`, `pokemon-type` | `get-pokemon` |
