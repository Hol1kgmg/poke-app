# Architecture Rules (FSD)

Full reference: [docs/layer-architecture-guide.md](../docs/layer-architecture-guide.md)

> **Note**: This file contains only the key rules needed for quick reference.
> Full details and rationale are in the guide above. When in doubt, read the guide.

## Layer Dependency Direction

Dependencies flow in one direction only:

```
app(routes) → widgets → features → entities → shared
```

- Upper layers may import from lower layers
- Lower layers must NOT import from upper layers
- Same-layer slices must NOT import from each other

## Component Placement Decision Flow

```
Want to create a component?
  │
  ① No domain knowledge?
     Yes → shared/ui/
     No  ↓
  ② Named with "verb + noun" (user action)?
     Yes → features/
     No  ↓
  ③ Reusable part depending on a single resource type?
     Yes → entities/xxx/ui/
     No  ↓
  ④ Composite block combining multiple entities/features?
     Yes → widgets/
     No  ↓
  ⑤ Page-level composition + data fetching?
     Yes → app(routes)/
```

## Layer Responsibilities

| Layer | Responsibility | Naming |
|---|---|---|
| `app(routes)/` | Routing + optional SSR prefetch | — |
| `routes/api/` | BFF layer (outside FSD) — calls external API / backend | — |
| `widgets/` | Composite UI blocks (page sections) | noun (`order-list-panel`) |
| `features/` | User actions + all BFF requests (Read & Mutation) | verb + noun (`create-order`) |
| `entities/` | Resource-specific reusable UI parts + types (no API calls) | resource name (`pokemon`) |
| `shared/` | Domain-agnostic utilities and UI | — |

## File Placement Rules

### app(routes)/
- Page components that compose widgets/features
- Loader used only for SSR prefetch when needed
- No custom hooks

### routes/api/ (BFF — outside FSD)
- HTTP endpoints that call external APIs or backend
- Called via `fetch('/api/xxx')` from `features/xxx/useXxx.ts`
- Never imported directly by FSD layers

### widgets/
- Composite UI block + internal split components (not exported)
- No data fetching — receive everything via props/context
- `useXxx.ts` only for complex internal UI state

### features/
- UI for user actions (forms, buttons, modals)
- `useXxx.ts` — Read (useQuery) and Mutation (fetch) logic, both calling `routes/api/`
- `atoms.ts` — transient state scoped to this feature (form inputs, filters)

### entities/
- `ui/` — resource-specific reusable UI parts
- `model/types.ts` — domain type definitions
- `model/adapters.ts` — BFF response → internal type conversion (called from `features/`)
- `model/atoms.ts` — resource-scoped selection state (e.g., `selectedPokemonId`)
- No API calls, no custom hooks

### shared/
- `ui/` — generic domain-agnostic components (Button, Modal, DataTable)
- `lib/` — utility functions
- `state/` — global state spanning multiple layers (currentUser, theme)
- No BFF communication, no response transformation, no custom hooks

## Atom Placement

| Scope | Location | Examples |
|---|---|---|
| Specific resource | `entities/xxx/model/atoms.ts` | `selectedPokemonIdAtom` |
| Feature-scoped transient state | `features/xxx/atoms.ts` | `searchQueryAtom`, `formFiltersAtom` |
| Cross-layer global state | `shared/state/` | `currentUserAtom`, `sidebarOpenAtom` |

Atom references follow the same FSD dependency direction.

## Prohibited Patterns

| # | Prohibited | Alternative |
|---|---|---|
| 1 | Same-layer slice imports (`entities/a` → `entities/b`) | Compose in the layer above |
| 2 | Lower layer importing from upper layer (`entities` → `features`) | Pass as props or elevate to `shared/state/` |
| 3 | BFF requests from `entities/`, `widgets/`, or `shared/` | Place request logic in `features/xxx/useXxx.ts` |
| 4 | Domain logic placed in `shared/` | Place in `entities/` or `features/` |
| 5 | Direct fetch to external API (bypassing `routes/api/`) | Route through `routes/api/` (BFF) |
| 6 | Calling another feature's useXxx / fetch logic | Each feature defines its own independently |
| 7 | `widgets/` fetching data | Receive via props/context |
| 8 | FSD layers importing `routes/api/` directly | Access via HTTP (`fetch`) only |
