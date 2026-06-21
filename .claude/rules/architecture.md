# Architecture Rules (FSD)

Full reference: [docs/layer-architecture-guide.md](../docs/layer-architecture-guide.md)

> **Note**: This file contains only the key rules needed for quick reference.
> Full details and rationale are in the guide above. When in doubt, read the guide.

## Layer Dependency Direction

Dependencies flow in one direction only:

```
app(routes) → pages → widgets → features → aggregates → entities → shared
```

- Upper layers may import from lower layers
- Lower layers must NOT import from upper layers
- Same-layer slices must NOT import from each other
- Exception: within `entities/`, composite entities may import from atomic entities (one direction only)

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
  ④ Reusable part spanning multiple composite entities?
     Yes → aggregates/xxx/ui/
     No  ↓
  ⑤ Self-contained composite block combining multiple entities/features?
     Yes → widgets/
     No  ↓
  ⑥ Page-level composition (assembles widgets)?
     Yes → pages/
```

## Layer Responsibilities

| Layer | Responsibility | Naming |
|---|---|---|
| `app(routes)/` | Routing, app init, and app shell (`__root.tsx`/`_layout.tsx` CSS allowed; individual route files delegate to `pages/`) | — |
| `pages/` | Page composition (assembles widgets); page-specific layout CSS allowed | — |
| `routes/api/` | BFF layer (outside FSD) — calls external API / backend | — |
| `widgets/` | Composite UI blocks; may fetch data when widget-specific complex data is needed | noun (`order-list-panel`) |
| `features/` | BFF requests that depend on entities/shared, or user actions (mutation/interaction) | verb + noun (`create-order`) |
| `aggregates/` | Types, data fetching, and UI spanning multiple composite entities — no mutations, no atoms | noun (`order-summary`) |
| `entities/` | Minimal unit of a domain resource — types, UI, state, and resource-specific data fetching | resource name (`order`) |
| `shared/` | Domain-agnostic utilities and UI — no BFF requests | — |

## File Placement Rules

### app(routes)/
- `__root.tsx` / `_layout.tsx` — app shell (CSS allowed for header/sidebar/main frame only)
- Individual route files — delegate to `pages/` only (no CSS, no custom hooks)
- `loader` — SSR prefetch only when needed

### pages/
- `XxxPage.tsx` — assembles widgets; no business logic, no custom hooks
- `XxxPage.module.css` — page-specific layout (grid, spacing, etc.) — optional
- Shared layout structures go to `widgets/` instead

### routes/api/ (BFF — outside FSD)
- HTTP endpoints that call external APIs or backend
- Called via `fetch('/api/xxx')` from any FSD layer
- Never imported directly by FSD layers

### widgets/
- Composite UI block + internal split components (not exported)
- `useXxx.ts` — UI state, or data fetching only when **all three** conditions are met:
  1. Subscribes to 2+ different entity states simultaneously
  2. The data fetching logic is not reused by other widgets/features
  3. Extracting to features would make "verb + noun" naming unnatural

### features/
- `*.tsx` — UI for user actions (forms, buttons, modals) — optional, omit if no UI needed
- `useXxx.ts` — Read (useQuery) and Mutation (fetch) logic, calling `routes/api/`
- `atoms.ts` — transient state scoped to this feature (form inputs, filters)
- `types.ts` — feature-specific type definitions

### aggregates/
- `model/types.ts` — type definitions spanning multiple composite entities
- `model/adapters.ts` — BFF response → aggregate type conversion
- `model/queryKeys.ts` — queryKey definitions for this aggregate; features/widgets import from here to unify cache keys
- `ui/` — reusable UI components for the aggregate type
- `useXxx.ts` — data fetching (useQuery) for the aggregate type
- No mutations, no atoms

### entities/
- `ui/` — resource-specific reusable UI parts
- `model/types.ts` — domain type definitions
- `model/adapters.ts` — BFF response → internal type conversion (called from own hooks or `features/`)
- `model/atoms.ts` — resource-scoped selection state (e.g., `selectedOrderId`)
- `model/queryKeys.ts` — queryKey definitions for this entity; features/widgets import from here to unify cache keys
- `useXxx.ts` — resource-specific data fetching (when depends only on shared)

### shared/
- `ui/` — generic domain-agnostic components (Button, Modal, DataTable)
- `lib/` — utility functions
- `state/` — domain-agnostic global state only (sidebarOpen, theme); domain concepts like `currentUser` belong in `entities/`
- No BFF communication, no response transformation, no custom hooks

## Atom Placement

| Scope | Location | Examples |
|---|---|---|
| Specific resource | `entities/xxx/model/atoms.ts` | `selectedOrderIdAtom`, `currentUserAtom` |
| Feature-scoped transient state | `features/xxx/atoms.ts` | `searchQueryAtom`, `formFiltersAtom` |
| Domain-agnostic global state | `shared/state/` | `sidebarOpenAtom`, `themeAtom` |

Widgets use local state (useState etc.) for UI-specific transient state — do not promote to atoms.

Atom references follow the same FSD dependency direction:
- `widgets` may reference `features` / `entities` atoms
- `features` may reference `entities` atoms
- Lower layers must NOT reference upper layer atoms

## Prohibited Patterns

| # | Prohibited | Alternative |
|---|---|---|
| 1 | Same-layer slice imports (`entities/a` → `entities/b`) | Compose in the layer above (exception: composite→atomic within `entities/` is allowed) |
| 2 | Lower layer importing from upper layer (`entities` → `features`) | Pass as props or elevate to `shared/state/` |
| 3 | BFF requests from `shared/` | Place in `entities/`, `features/`, or `widgets/` |
| 4 | Domain logic placed in `shared/` | Place in `entities/` or `features/` |
| 5 | Direct fetch to external API (bypassing `routes/api/`) | Route through `routes/api/` (BFF) |
| 6 | Calling another slice's useXxx / fetch logic | Each slice defines its own independently |
| 7 | Skipping a lower layer that could handle the request | Place at the lowest layer that satisfies dependencies |
| 8 | FSD layers importing `routes/api/` directly | Access via HTTP (`fetch`) only |
| 9 | Promoting widget-scoped UI state to atoms | Use local state (useState) inside the widget |
