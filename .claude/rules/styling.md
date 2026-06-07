# Styling Rules

Full reference: [docs/styling-guide.md](../docs/styling-guide.md)

> **Note**: This file contains only the key rules needed for quick reference.
> Full details and rationale are in the guide above. When in doubt, read the guide.

## CSS Modules

- Place `.module.css` in the **same directory with the same name** as its component
- Components with no styles do not need a `.module.css` file
- Global styles (reset, base) go only in `src/styles.css` — keep additions minimal

```
widgets/pokemon-panel/
  PokemonPanel.tsx
  PokemonPanel.module.css    ← same name, same directory
  PokemonCard.tsx
  PokemonCard.module.css
```

```tsx
// PokemonCard.tsx
import styles from './PokemonCard.module.css'

export function PokemonCard({ pokemon }: Props) {
  return <div className={styles.card}>{pokemon.name}</div>
}
```
