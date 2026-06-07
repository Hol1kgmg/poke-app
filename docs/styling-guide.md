# スタイリングガイド

CSS Modules を採用する。Vite にネイティブ組み込みのため追加設定不要。

---

## 基本ルール

- `.module.css` ファイルはコンポーネントと**同じディレクトリに同名**で配置する
- グローバルスタイル（リセット・ベース）は `src/styles.css` のみに記述する
- `src/styles.css` はグローバルスコープのため最小限に留める

---

## 使い方

```tsx
// Button.tsx
import styles from './Button.module.css'

export function Button({ children }: { children: React.ReactNode }) {
  return <button className={styles.button}>{children}</button>
}
```

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
```

---

## スタイルが不要なコンポーネント

スタイルを持たないコンポーネント（ロジックのみ等）は `.module.css` を作成しなくてよい。
