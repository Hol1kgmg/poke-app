# Architecture Rules (FSD)

Full reference: [docs/layer-architecture-guide.md](../docs/layer-architecture-guide.md)

## Layer Dependency Direction

Dependencies flow in one direction only:

```
app → widgets → features → entities → shared
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
     Yes → app/
```

## Layer Responsibilities

| Layer | Responsibility | Naming |
|---|---|---|
| `app/` | Routing + data fetching orchestration | — |
| `widgets/` | Composite UI blocks (page sections) | noun (`order-list-panel`) |
| `features/` | User actions / mutations | verb + noun (`create-order`) |
| `entities/` | Resource-specific reusable parts + types | resource name (`pokemon`) |
| `shared/` | Domain-agnostic utilities and UI | — |

## File Placement Rules

### app/
- Page components that receive data and pass to widgets/features
- Loader functions defined inline in the page file
- No custom hooks

### widgets/
- Composite UI block + internal split components (not exported)
- No data fetching — receive everything via props/context
- `useXxx.ts` only for complex internal UI state

### features/
- UI for user actions (forms, buttons, modals)
- `serverFn.ts` — mutation serverFn owned by this feature
- `atoms.ts` — transient state scoped to this feature (form inputs, filters)
- `useXxx.ts` — mutation logic, form validation, post-submit state updates

### entities/
- `ui/` — resource-specific reusable UI parts
- `model/types.ts` — domain type definitions
- `model/adapters.ts` — BFF response → internal type conversion
- `model/atoms.ts` — resource-scoped selection state (e.g., `selectedPokemonId`)
- `api/index.ts` — Read serverFns (GET only)
- No custom hooks

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
| 3 | UI components calling Read serverFns directly | Pass data via `app/` loader |
| 4 | Domain logic placed in `shared/` | Place in `entities/` or `features/` |
| 5 | Mutation serverFns in `entities/xxx/api/` | Place in `features/xxx/serverFn.ts` |
| 6 | Calling another feature's serverFn | Each feature defines its own independently |
| 7 | `widgets/` or `features/` fetching data | Receive via props/context |
