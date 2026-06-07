# コーディングルール

poke-app フロントエンドの実装判断基準と禁止事項の逆引きリファレンス。
各トピックの詳細は末尾のリンク先ガイドを参照。

---

## 型

### Branded Type

ドメイン識別子（ID・名前など）はプリミティブのまま扱わず、Branded Type で宣言する。

```ts
// ✅ 正しい宣言場所: entities/xxx/model/types.ts
import type { Branded } from "#/shared/lib/branded";

export type PokemonId   = Branded<number, "PokemonId">;
export type PokemonName = Branded<string, "PokemonName">;
```

`brand()` キャスト関数は **BFF レスポンスとの境界（`adapters.ts`）でのみ** 使用する。

```ts
// ✅ 唯一の使用場所: entities/xxx/model/adapters.ts
export const toPokemon = (raw: RawPokemon): Pokemon => ({
  id:   brand<PokemonId>(raw.id),
  name: brand<PokemonName>(raw.name),
});

// ❌ コンポーネントや hooks の中で brand() を呼ばない
```

### 型アサーション

| 記法 | 可否 | 理由 |
|---|---|---|
| `as T`（BFF レスポンスの `unknown` → 既知の Raw 型） | ✅ `adapters.ts` 内のみ | 境界での変換は許容 |
| `brand<T>()` | ✅ `adapters.ts` 内のみ | 同上 |
| `as T`（それ以外の場所） | ❌ | 型安全を破壊する |
| `!`（Non-null assertion） | ❌ | `undefined` チェックか Optional chaining に置き換える |

---

## アーキテクチャ（FSD）

レイヤー依存は一方通行のみ。

```
app → widgets → features → entities → shared
```

### import ルール

```ts
// ✅ 上位から下位へ
// features から entities を参照
import type { Pokemon } from "#/entities/pokemon/model/types";

// ❌ 下位から上位へ
// entities から features を参照 → 禁止
import { useCreateOrder } from "#/features/create-order/useCreateOrder";

// ❌ 同階層スライス間
// entities/pokemon から entities/type を参照 → 禁止
import type { Type } from "#/entities/type/model/types";
```

### レイヤー判定フロー

```
コンポーネントを作りたい
  │
  ① ドメイン知識がない？
     Yes → shared/ui/
     No  ↓
  ② 「動詞+名詞」で命名できるユーザー操作？
     Yes → features/
     No  ↓
  ③ 1つのリソースの型だけに依存する再利用パーツ？
     Yes → entities/xxx/ui/
     No  ↓
  ④ 複数の entities/features を組み合わせた画面ブロック？
     Yes → widgets/
     No  ↓
  ⑤ ページ全体の構成・データ取得？
     Yes → app/
```

詳細は [layer-architecture-guide.md](./layer-architecture-guide.md) を参照。

---

## Server Functions

### Read（GET）

- `entities/xxx/api/index.ts` に定義する
- `app/` の loader からのみ呼び出す（UI コンポーネントから直接呼ばない）
- `inputValidator` を必ず付ける（引数がない場合は省略可）

```ts
// ✅ entities/pokemon/api/index.ts
export const fetchPokemon = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    const raw = await fetch(`/api/pokemon/${data}`).then(r => r.json());
    return toPokemon(raw as RawPokemon);
  });

// ❌ コンポーネント内から直接呼ぶ
const pokemon = await fetchPokemon({ data: 1 }); // widgets / features 内は禁止
```

### Mutation（POST / PUT / DELETE）

- `features/xxx/serverFn.ts` に定義する
- 同じ feature 内のコンポーネント / hooks からのみ呼び出す
- 他の feature からの呼び出しは禁止（重複が必要なら各 feature が独立して定義する）

```ts
// ✅ features/favorite-pokemon/serverFn.ts
export const toggleFavoriteFn = createServerFn({ method: "POST" })
  .inputValidator((data: { pokemonId: PokemonId }) => data)
  .handler(async ({ data }) => { /* ... */ });
```

---

## コンポーネント

### サーバー / クライアントの境界

`"use client"` は **状態・イベント・ブラウザ API を使う最小単位のコンポーネントにのみ** 付与する。ブロック全体をクライアント化しない。

```tsx
// ❌ ブロック全体をクライアント化
"use client";
export function PokemonPanel({ pokemon }: Props) {
  return (
    <section>
      <PokemonCard pokemon={pokemon} />   {/* サーバーで動くのにクライアントになる */}
      <FavoriteButton pokemonId={pokemon.id} />
    </section>
  );
}

// ✅ インタラクション部分だけを切り出す
// PokemonPanel.tsx（サーバーコンポーネントのまま）
export function PokemonPanel({ pokemon }: Props) {
  return (
    <section>
      <PokemonCard pokemon={pokemon} />
      <FavoriteButton pokemonId={pokemon.id} />  {/* この中だけ "use client" */}
    </section>
  );
}
```

### props 設計

- `widgets/` と `features/` は data fetch を行わず、必要なデータは props / コンテキスト経由で受け取る
- props の型に Branded Type を使い、素のプリミティブを誤渡しできないようにする

```ts
// ✅ Branded Type を props に使う
type Props = { pokemonId: PokemonId };

// ❌ 素の number では別 ID と取り違えが起きる
type Props = { pokemonId: number };
```

---

## スタイリング

- `.module.css` はコンポーネントと**同じディレクトリに同名**で配置する
- グローバルスタイルは `src/styles.css` のみ。ここへの追記は最小限にする
- スタイルを持たないコンポーネントは `.module.css` を作成しない

```
widgets/pokemon-panel/
  PokemonPanel.tsx
  PokemonPanel.module.css   ← 同名・同階層
  PokemonCard.tsx
  PokemonCard.module.css
```

詳細は [styling-guide.md](./styling-guide.md) を参照。

---

## 状態管理（Jotai）

### atom の配置

| スコープ | 配置先 |
|---|---|
| 特定リソースに紐づく状態（`selectedPokemonId` 等） | `entities/xxx/model/atoms.ts` |
| 特定操作に閉じた一時状態（フォーム入力・フィルター等） | `features/xxx/atoms.ts` |
| 複数レイヤーをまたぐグローバル状態（`currentUser` 等） | `shared/state/` |

### 依存方向

atom の参照も FSD 一方通行ルールに従う。

```ts
// ✅
// widgets は features の atom を参照してよい
// features は entities の atom を参照してよい

// ❌
// entities から features の atom を参照 → 禁止
import { searchQueryAtom } from "#/features/search-pokemon/atoms";
```

下位レイヤーから上位の atom を参照したくなったら `shared/state/` に昇格させるか、props として渡す。

詳細は [state-management-guide.md](./state-management-guide.md) を参照。

---

## 命名規則

### ファイル・ディレクトリ

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase | `PokemonCard.tsx` |
| スタイルファイル | コンポーネントと同名 | `PokemonCard.module.css` |
| hooks | camelCase、`use` プレフィックス | `useFavorite.ts` |
| ユーティリティ / ロジック | camelCase | `adapters.ts`, `types.ts` |
| FSD スライスディレクトリ | kebab-case | `search-pokemon/`, `pokemon-panel/` |

### 型名

| 対象 | 規則 | 例 |
|---|---|---|
| Branded Type | PascalCase、末尾に種別を付けない | `PokemonId`, `PokemonName` |
| BFF レスポンス型（Raw） | `Raw` プレフィックス | `RawPokemon` |
| 内部ドメイン型 | PascalCase | `Pokemon`, `PokemonType` |
| Props 型 | `Props` で統一 | `type Props = { ... }` |

### 関数・変数

| 対象 | 規則 | 例 |
|---|---|---|
| adapter 関数 | `to` プレフィックス | `toPokemon`, `toPokemonList` |
| serverFn 変数 | `Fn` サフィックス | `fetchPokemonFn`, `toggleFavoriteFn` |
| atom 変数 | `Atom` サフィックス | `selectedPokemonIdAtom` |

---

## 禁止事項まとめ

| # | 禁止パターン | 代替 |
|---|---|---|
| 1 | 同階層スライス間の import | 1つ上のレイヤーで組み合わせる |
| 2 | 下位レイヤーから上位レイヤーの import | FSD の依存方向を守る |
| 3 | UI コンポーネントから Read serverFn を直接呼び出す | `app/` の loader 経由で渡す |
| 4 | ドメイン知識を持つロジックを `shared/` に置く | `entities/` または `features/` に置く |
| 5 | `brand()` を `adapters.ts` 以外で使う | adapters で変換してから渡す |
| 6 | `as T` を `adapters.ts` 以外で使う | 正しい型を推論させるか型ガードを使う |
| 7 | `!` Non-null assertion | `undefined` チェックか Optional chaining |
| 8 | Mutation serverFn を `entities/xxx/api/` に置く | `features/xxx/serverFn.ts` に置く |
| 9 | 他の feature の serverFn を呼び出す | 各 feature が独立して定義する |
| 10 | ブロック全体に `"use client"` を付与する | インタラクション部分のみ切り出す |
| 11 | `widgets/` / `features/` でデータ取得する | props / コンテキスト経由で受け取る |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| [layer-architecture-guide.md](./layer-architecture-guide.md) | FSD レイヤー設計の詳細 |
| [tanstack-start-guide.md](./tanstack-start-guide.md) | TanStack Start の実装例 |
| [styling-guide.md](./styling-guide.md) | CSS Modules の使い方 |
| [state-management-guide.md](./state-management-guide.md) | Jotai の Provider 配置など |
| [test-stack.md](./test-stack.md) | テスト・チェックツール一覧 |
| [tech-stack.md](./tech-stack.md) | 技術スタック一覧 |
