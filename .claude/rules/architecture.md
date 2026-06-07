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

## UI Component Placement Decision Flow

```
Want to create a UI component?
  │
  ① No domain knowledge?
     Yes → shared/ui/
     No  ↓
  ② Named with "verb + noun" (operation or feature)?
     Yes → features/
     No  ↓
  ③ Reusable part depending on a single resource type?
     Yes → entities/xxx/ui/
     No  ↓
  ④ Self-contained composite block combining multiple entities/features?
     Yes → widgets/
     No  ↓
  ⑤ Page-level composition (FSD App + Pages)?
     Yes → app(routes)/
```

## Layer Responsibilities

| Layer | Responsibility | Naming |
|---|---|---|
| `app(routes)/` | FSD App + Pages combined — routing, app init, and page composition (assembles widgets) | — |
| `routes/api/` | BFF layer (outside FSD) — calls external API / backend | — |
| `widgets/` | Composite UI blocks; may fetch data when widget-specific complex data is needed | noun (`order-list-panel`) |
| `features/` | BFF requests that depend on entities/shared, or user actions (mutation/interaction) | verb + noun (`create-order`) |
| `entities/` | Minimal unit of a domain resource — types, UI, state, and resource-specific data fetching | resource name (`pokemon`) |
| `shared/` | Domain-agnostic utilities and UI — no BFF requests | — |

## File Placement Rules

### app(routes)/
- Page components that compose widgets/features
- Loader used only for SSR prefetch when needed
- No custom hooks

### routes/api/ (BFF — outside FSD)
- HTTP endpoints that call external APIs or backend
- Called via `fetch('/api/xxx')` from any FSD layer
- Never imported directly by FSD layers

### widgets/
- Composite UI block + internal split components (not exported)
- `useXxx.ts` — UI state, or data fetching only when widget-specific complex data cannot be placed in features

### features/
- `*.tsx` — UI for user actions (forms, buttons, modals) — optional, omit if no UI needed
- `useXxx.ts` — Read (useQuery) and Mutation (fetch) logic, calling `routes/api/`
- `atoms.ts` — transient state scoped to this feature (form inputs, filters)
- `types.ts` — feature-specific type definitions

### entities/
- `ui/` — resource-specific reusable UI parts
- `model/types.ts` — domain type definitions
- `model/adapters.ts` — BFF response → internal type conversion (called from own hooks or `features/`)
- `model/atoms.ts` — resource-scoped selection state (e.g., `selectedPokemonId`)
- `useXxx.ts` — resource-specific data fetching (when depends only on shared)

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

Widgets use local state (useState etc.) for UI-specific transient state — do not promote to atoms.

Atom references follow the same FSD dependency direction:
- `widgets` may reference `features` / `entities` atoms
- `features` may reference `entities` atoms
- Lower layers must NOT reference upper layer atoms

## Prohibited Patterns

| # | Prohibited | Alternative |
|---|---|---|
| 1 | Same-layer slice imports (`entities/a` → `entities/b`) | Compose in the layer above |
| 2 | Lower layer importing from upper layer (`entities` → `features`) | Pass as props or elevate to `shared/state/` |
| 3 | BFF requests from `shared/` | Place in `entities/`, `features/`, or `widgets/` |
| 4 | Domain logic placed in `shared/` | Place in `entities/` or `features/` |
| 5 | Direct fetch to external API (bypassing `routes/api/`) | Route through `routes/api/` (BFF) |
| 6 | Calling another slice's useXxx / fetch logic | Each slice defines its own independently |
| 7 | Skipping a lower layer that could handle the request | Place at the lowest layer that satisfies dependencies |
| 8 | FSD layers importing `routes/api/` directly | Access via HTTP (`fetch`) only |
| 9 | Promoting widget-scoped UI state to atoms | Use local state (useState) inside the widget |
