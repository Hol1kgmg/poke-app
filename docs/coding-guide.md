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

export type OrderId   = Branded<number, "OrderId">;
export type OrderCode = Branded<string, "OrderCode">;
```

`brand()` キャスト関数は **BFF レスポンスとの境界（`adapters.ts`）でのみ** 使用する。

```ts
// ✅ 唯一の使用場所: entities/xxx/model/adapters.ts
export const toOrder = (raw: RawOrder): Order => ({
  id:   brand<OrderId>(raw.id),
  code: brand<OrderCode>(raw.code),
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
app → widgets → features → aggregates → entities → shared
```

### import ルール

```ts
// ✅ 上位から下位へ
// features から entities を参照
import type { Order } from "#/entities/order/model/types";

// ❌ 下位から上位へ
// entities から features を参照 → 禁止
import { useCreateOrder } from "#/features/create-order/useCreateOrder";

// ❌ 同階層スライス間
// entities/order から entities/product を参照 → 禁止
import type { Product } from "#/entities/product/model/types";
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
  ④ 複数の composite エンティティをまたぐ再利用パーツ？
     Yes → aggregates/xxx/ui/
     No  ↓
  ⑤ 複数の entities/features を組み合わせた画面ブロック？
     Yes → widgets/
     No  ↓
  ⑥ ページ全体の構成・データ取得？
     Yes → app/
```

詳細は [layer-architecture-guide.md](./layer-architecture-guide.md) を参照。

### queryKeys

queryKey は `entities/xxx/model/queryKeys.ts` に定義し、features・widgets はそこから import して使う。

```ts
// ✅ entities/order/model/queryKeys.ts
export const orderKeys = {
  all: ["order"] as const,
  detail: (id: OrderId) => ["order", id] as const,
  list: (params: OrderParams) => ["order", "list", params] as const,
};

// ✅ features/search-order/useSearchOrder.ts
import { orderKeys } from "#/entities/order/model/queryKeys";

export function useSearchOrder(params: OrderParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async () => { /* fetch('/api/orders?q=...') */ },
  });
}
```

---

## Server Functions

### Read（GET）

- `entities/xxx/api/index.ts` に定義する
- `app/` の loader からのみ呼び出す（UI コンポーネントから直接呼ばない）
- `inputValidator` を必ず付ける（引数がない場合は省略可）

```ts
// ✅ entities/order/api/index.ts
export const fetchOrder = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    const raw = await fetch(`/api/orders/${data}`).then(r => r.json());
    return toOrder(raw as RawOrder);
  });

// ❌ コンポーネント内から直接呼ぶ
const order = await fetchOrder({ data: 1 }); // widgets / features 内は禁止
```

### Mutation（POST / PUT / DELETE）

- `features/xxx/serverFn.ts` に定義する
- 同じ feature 内のコンポーネント / hooks からのみ呼び出す
- 他の feature からの呼び出しは禁止（重複が必要なら各 feature が独立して定義する）

```ts
// ✅ features/toggle-favorite/serverFn.ts
export const toggleFavoriteFn = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: OrderId }) => data)
  .handler(async ({ data }) => { /* ... */ });
```

---

## コンポーネント

### サーバー / クライアントの境界

`"use client"` は **状態・イベント・ブラウザ API を使う最小単位のコンポーネントにのみ** 付与する。ブロック全体をクライアント化しない。

```tsx
// ❌ ブロック全体をクライアント化
"use client";
export function OrderListPanel({ order }: Props) {
  return (
    <section>
      <OrderCard order={order} />   {/* サーバーで動くのにクライアントになる */}
      <FavoriteButton orderId={order.id} />
    </section>
  );
}

// ✅ インタラクション部分だけを切り出す
// OrderListPanel.tsx（サーバーコンポーネントのまま）
export function OrderListPanel({ order }: Props) {
  return (
    <section>
      <OrderCard order={order} />
      <FavoriteButton orderId={order.id} />  {/* この中だけ "use client" */}
    </section>
  );
}
```

### props 設計

- `widgets/` と `features/` は data fetch を行わず、必要なデータは props / コンテキスト経由で受け取る
- props の型に Branded Type を使い、素のプリミティブを誤渡しできないようにする

```ts
// ✅ Branded Type を props に使う
type Props = { orderId: OrderId };

// ❌ 素の number では別 ID と取り違えが起きる
type Props = { orderId: number };
```

---

## 関数定義スタイル

`function` 宣言・関数式は禁止。`const` + アロー関数で統一する（lint: `prefer-arrow-functions/prefer-arrow-functions`）。

```ts
// ✅ const アロー関数
export const fetchPokemon = async (id: PokemonId): Promise<Pokemon> => {
  // ...
};

export const PokemonCard = ({ pokemon }: Props) => {
  return <div>{pokemon.name}</div>;
};

// ❌ function 宣言
export function fetchPokemon(id: PokemonId) { ... }
export function PokemonCard({ pokemon }: Props) { ... }

// ❌ function 式
export const fetchPokemon = function(id: PokemonId) { ... }
```

---

## スタイリング

- `.module.css` はコンポーネントと**同じディレクトリに同名**で配置する
- グローバルスタイルは `src/styles.css` のみ。ここへの追記は最小限にする
- スタイルを持たないコンポーネントは `.module.css` を作成しない

```
widgets/order-list-panel/
  OrderListPanel.tsx
  OrderListPanel.module.css   ← 同名・同階層
  OrderCard.tsx
  OrderCard.module.css
```

詳細は [styling-guide.md](./styling-guide.md) を参照。

---

## 状態管理（Jotai）

### atom の配置

| スコープ | 配置先 |
|---|---|
| 特定リソースに紐づく状態（`selectedOrderId`・`currentUser` 等） | `entities/xxx/model/atoms.ts` |
| 特定操作に閉じた一時状態（フォーム入力・フィルター等） | `features/xxx/atoms.ts` |
| ドメイン非依存のグローバル状態（`sidebarOpen`・`theme` 等） | `shared/state/` |

### 依存方向

atom の参照も FSD 一方通行ルールに従う。

```ts
// ✅
// widgets は features の atom を参照してよい
// features は entities の atom を参照してよい

// ❌
// entities から features の atom を参照 → 禁止
import { searchQueryAtom } from "#/features/search-order/atoms";
```

下位レイヤーから上位の atom を参照したくなったら `shared/state/` に昇格させるか、props として渡す。

詳細は [state-management-guide.md](./state-management-guide.md) を参照。

---

## 命名規則

### ファイル・ディレクトリ

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase | `OrderCard.tsx` |
| スタイルファイル | コンポーネントと同名 | `OrderCard.module.css` |
| hooks | camelCase、`use` プレフィックス | `useFavorite.ts` |
| ユーティリティ / ロジック | camelCase | `adapters.ts`, `types.ts` |
| FSD スライスディレクトリ | kebab-case | `search-order/`, `order-list-panel/` |

### 型名

| 対象 | 規則 | 例 |
|---|---|---|
| Branded Type | PascalCase、末尾に種別を付けない | `OrderId`, `OrderStatus` |
| BFF レスポンス型（Raw） | `Raw` プレフィックス | `RawOrder` |
| 内部ドメイン型 | PascalCase | `Order`, `Product` |
| Props 型 | `Props` で統一 | `type Props = { ... }` |

### 関数・変数

| 対象 | 規則 | 例 |
|---|---|---|
| adapter 関数 | `to` プレフィックス | `toOrder`, `toOrderList` |
| serverFn 変数 | `Fn` サフィックス | `fetchOrderFn`, `toggleFavoriteFn` |
| atom 変数 | `Atom` サフィックス | `selectedOrderIdAtom` |

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
| 12 | `function` 宣言・`function` 式を使う | `const` + アロー関数に統一する |

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
