# フロントエンドアーキテクチャガイド

FSD（Feature-Sliced Design）に基づく、フレームワーク非依存のフロントエンドアーキテクチャガイド。

---

## 背景と課題

BFF（Backend for Frontend）パターンを採用したフロントエンドにおいて、機能単位で管理されたコンポーネントから別機能の API リクエスト処理を呼び出す際に、同階層の import が発生し、暗黙の依存関係が生まれる問題があった。

本ガイドでは FSD の思想に基づき、依存関係を構造的に制御するアーキテクチャを定義する。

---

## 設計原則

### 1. BFF リクエストは依存を満たせる最下位レイヤーに置く

「そのリクエストを下のレイヤーに移せるか？」を判断軸とし、移せる限り下位レイヤーに配置する。詳細な判断フローは [BFF リクエストの配置判断](#bff-リクエストの配置判断) を参照。

レスポンス変換（adapter）は呼び出し元と同じスライス内の `model/adapters.ts` に置く。

### 2. FSD のレイヤー依存ルールを厳守する

依存は**上位レイヤーから下位レイヤーへの一方通行**のみ。同階層のスライス同士は互いを import しない。

```
app(routes) → widgets → features → entities → shared
```

- 上位は下位を使える
- 下位は上位を知らない
- **同階層の import は禁止**

### 3. 組み合わせたくなったら上位レイヤーの仕事

同階層のスライスを組み合わせたいという欲求が出たら、それは1つ上のレイヤーが担う責務である。

### 4. 外部API へのリクエストは routes/api/（BFF）に集約する

外部API（PokeAPI 等）やバックエンドへのリクエストは必ず `routes/api/`（BFF）を経由する。
各レイヤーからは `routes/api/` に対して fetch し、外部APIへの直接アクセスは行わない。

```
entities/features/widgets ──→ fetch('/api/xxx') ──→ routes/api/（BFF）──→ 外部API（PokeAPI 等）
                                                                      └──→ バックエンド（内部 API）
```

- APIキー・シークレットをクライアントに露出させない
- CORS 制約を BFF 側で吸収する
- 外部API のレスポンス形式の変化を BFF 側に閉じ込められる

### 5. サーバー／クライアントの境界はレイヤーではなくコンポーネント単位で決定する

FSD のレイヤーは「責務と依存方向」のルール、サーバー/クライアントは「実行環境」のルールであり、この2つは独立した軸として扱う。クライアントサイドのマーキング（Next.js の `"use client"` 等）は必要なコンポーネントにのみ付与し、できる限り末端（葉）に寄せる。

- 状態管理、イベントハンドラ、ブラウザ API を使う → クライアントコンポーネント
- 上記を使わない → サーバーサイドで実行可能なまま維持
- 複合ブロック全体をクライアントにするのではなく、インタラクション部分だけを切り出す

---

## ディレクトリ構成

```
src/
  routes/                           ← FSD App + Pages（ルーティング・初期化・ページ構成）
    __root.tsx
    index.tsx
    dashboard/
      index.tsx
    orders/
      index.tsx
      $id.tsx
    api/                            ← BFF レイヤー（FSD 外）、HTTP 経由で各レイヤーから呼び出す
      users.ts
      orders.ts

  widgets/                          ← 自己完結型の複合UIブロック
    order-list-panel/
      OrderListPanel.tsx
      OrderListPanel.module.css        コンポーネントと同名・同階層に配置
      OrderListHeader.tsx              内部分割（外部に export しない）
      OrderListHeader.module.css
      OrderListItem.tsx
      OrderListItem.module.css
    dashboard-summary/
      DashboardSummary.tsx
      DashboardSummary.module.css
      useDashboardSummary.ts           ← widget 固有のデータ取得（任意）

  features/                         ← 操作・機能単位（entities/shared で完結しない BFF リクエスト、またはユーザーアクション）
    create-order/
      CreateOrderForm.tsx
      CreateOrderForm.module.css
      CreateOrderButton.tsx
      CreateOrderButton.module.css
      useCreateOrder.ts               ← mutation ロジック（fetch POST /api/orders）
      atoms.ts                        feature に閉じた一時的な状態（フォーム入力値等）
      types.ts
    update-profile/
      ProfileEditForm.tsx
      ProfileEditForm.module.css
      useUpdateProfile.ts             ← mutation ロジック
    search-product/
      SearchProductInput.tsx
      SearchProductInput.module.css
      useSearchProduct.ts             ← useQuery（searchQueryAtom を使用、entities の状態に依存）
      atoms.ts                        searchQuery, filters 等

  entities/                         ← ドメインリソースの最小単位（UI・型・状態・リソース固有のデータ取得）
    user/
      ui/
        UserAvatar.tsx
        UserAvatar.module.css
        UserNameLabel.tsx
        UserNameLabel.module.css
      model/
        types.ts
        atoms.ts                      selectedUserId, currentUser 等（ドメイン概念を含む状態）
        adapters.ts                   ← BFF レスポンス → 内部型への変換
        queryKeys.ts                  ← このエンティティの queryKey を定義（features/widgets から import）
    order/
      ui/
        OrderStatusBadge.tsx
        OrderStatusBadge.module.css
      model/
        types.ts
        atoms.ts                      selectedOrderId 等
        adapters.ts
        queryKeys.ts
    product/
      ui/
        ProductCard.tsx
        ProductCard.module.css
      model/
        types.ts
        adapters.ts
        queryKeys.ts
      useProducts.ts                  ← リソース固有のデータ取得（shared のみに依存）

  shared/                           ← ドメイン無関係の共通レイヤー（BFF リクエスト不可）
    ui/
      Button.tsx
      Button.module.css
      Modal.tsx
      Modal.module.css
      DataTable.tsx
      DataTable.module.css
    lib/
      formatDate.ts
    state/
      ui.ts                           sidebarOpen, theme 等（ドメイン知識を含まない状態のみ）
```

---

## 各レイヤーの責務と粒度

### app(routes)/（ルーティング + ページ構成）

FSD の **App レイヤー**（アプリ初期化・ルーティング定義）と **Pages レイヤー**（widgets を組み合わせてページを構成する）を兼ねる。TanStack Start のファイルベースルーティングにより、`src/routes/` がこの両方の役割を担う。

データ取得は下位レイヤーが行うため、loader は SSR プリフェッチが必要な場合のみ使用する。

#### 構成要素

- `*.tsx` — ページコンポーネント（widgets / features を組み合わせるだけ、UI ロジックなし）
- `loader` — SSR プリフェッチが必要な場合のみ使用

カスタム hooks は置かない。

---

### routes/api/（BFFレイヤー）

FSD のレイヤー構造の外側に位置する、HTTP エンドポイントとしての BFF（Backend for Frontend）。外部API やバックエンドへのリクエストはここに集約する。

```
routes/api/
  users.ts          ← GET /api/users
  orders.ts         ← GET /api/orders, POST /api/orders
  match.ts          ← POST /api/match
```

#### 責務

- 外部API（PokeAPI 等）またはバックエンドへのリクエストを行う
- クライアントが直接知るべきでない API キー・シークレットをサーバー側で保持する
- CORS 制約を吸収する
- Raw レスポンスをそのまま返す（変換は呼び出し元の adapter が担う）

#### 呼び出し関係

```
entities/xxx/useXxx.ts  ─┐
features/xxx/useXxx.ts  ─┼─ fetch('/api/xxx') ──→ routes/api/xxx.ts（BFF）──→ 外部API / バックエンド
widgets/xxx/useXxx.ts   ─┘
```

- BFF エンドポイントは FSD レイヤーから直接 import しない（HTTP 経由のみ）

---

### widgets/（画面固有の複合UIブロック）

粒度の判定基準: **複数の entities / features を組み合わせた自己完結ブロックか？**
（イメージ: そのブロックだけ四角で囲んで、ページから切り離せる複合ブロック）

- 複数の entities や features を組み合わせている
- ページをまたいで再利用しうる（1ページ限定でも十分に複合的なら widget）
- widget 固有の複合データが必要な場合はデータ取得も担える（features まで下げられない場合のみ）
- 名前は名詞で付く（order-list-panel, dashboard-summary, sidebar-navigation）

```
✅ widgets の例
  order-list-panel       注文一覧パネル
  dashboard-summary      ダッシュボードのサマリー領域
  user-profile-card      プロフィール表示カード
  sidebar-navigation     サイドバー
  header                 ヘッダー

❌ widgets ではないもの
  create-order           → 操作 → features
  OrderStatusBadge       → 単一 entity のパーツ → entities
  Button                 → ドメイン知識なし → shared
```

#### 構成要素

- `XxxWidget.tsx` 等 — 複合UIブロック本体
- 内部分割コンポーネント — スライス直下に配置（外部 export しない）
- `useXxx.ts` — UI状態の管理、または widget 固有のデータ取得  
    ※ データ取得を widget に置く場合は以下の **3条件すべてを満たすこと**：
      1. 2つ以上の異なるエンティティの状態を同時に購読する
      2. そのデータ取得ロジックが他の widget / feature から再利用されない
      3. features に切り出すと「動詞+名詞」の命名が不自然になる  
    → いずれか1つでも満たさない場合は entities または features へ下げる

atoms / types は原則置かない（必要なら entities / shared へ昇格）。

#### スライスが大きくなりすぎた場合の内部分割

スライス数が増えること自体は正常。問題は**1スライス内が肥大化する**こと。以下を目安に内部分割する：

- 分割したサブコンポーネントはスライスディレクトリ直下に置き、**外部には export しない**
- スライス内の `index.ts`（または本体コンポーネント）からのみ参照する
- 内部分割しても解決しない場合は、別スライスへの切り出しや widgets 間の親子関係を再検討する

再利用性は widgets の分割判断に含めない（widgets は再利用を前提としない）。

---

### features/（操作・機能単位）

粒度の判定基準: **「動詞 + 名詞」で命名できる、entities / shared で完結しない BFF リクエストまたはユーザーアクションか？**

- 1つの操作・機能 = 1つの feature
- UI・ロジックのうち必要なものだけを持てばよい（`*.tsx` がなくても feature として成立する）
- 「注文を作成してさらに決済する」は create-order と process-payment に分ける

```
✅ features の例
  create-order           注文を作成する（UI + mutation）
  update-profile         プロフィールを更新する（UI + mutation）
  search-product         商品を検索する（UI + useQuery）
  track-page-view        ページビューを送信する（useXxx.ts のみ、UI不要なケース）

❌ features ではないもの
  order-management       → 動詞がない → widgets
  user-info              → 動詞がない → entities
  dashboard              → 動詞がない → widgets
```

#### 構成要素

- `*.tsx` — 操作に付随するUI（フォーム・確認モーダル・ボタン等）
- `useXxx.ts` — Read（useQuery）・Mutation（fetch）ロジック。`routes/api/` へ直接 fetch する
- `atoms.ts` — feature に閉じた一時的な状態（フォーム入力値・フィルター条件等）
- `types.ts` — feature 固有の型定義

---

### entities/（ドメインリソースの最小単位）

粒度の判定基準: **単一のドメインリソース（Pokemon・User 等）に関する型・UI・状態の最小単位か？**

- UI・型・状態・データ取得のうち必要なものだけを持てばよい（`ui/` がなくても entity として成立する）
- 複数リソースを組み合わせて表示したい → `widgets/` に昇格する
- entities の状態に依存するデータ取得、またはユーザーアクションを伴う → `features/` に移す
- 上位概念に内包されるサブリソース（例：order に内包される order_items）は entity にしない

```
✅ entities の例
  pokemon        PokemonCard, PokemonTypeTag などのUIパーツ＋型定義
  user           UserAvatar, UserNameLabel
  order          OrderStatusBadge（ui/ のみ）
  tag            model/types.ts のみ（UI不要なケース）

❌ entities ではないもの
  order_items    → order に内包される（独立したリソースではない）
  pokemon-panel  → 複数リソースの組み合わせ → widgets
  search-pokemon → ユーザー操作を伴う → features
```

#### 構成要素

- `ui/` — リソース固有の再利用UIパーツ（`UserAvatar.tsx`・`OrderStatusBadge.tsx` 等）
- `model/types.ts` — ドメイン型定義
- `model/adapters.ts` — BFF レスポンス → 内部型への変換（同エンティティの hooks または `features/xxx/` から呼び出す）
- `model/atoms.ts` — リソースに紐づく選択状態（`selectedXxxId` 等）
- `model/queryKeys.ts` — このエンティティの queryKey を一元定義。features・widgets が同一エンドポイントを使う場合はここから import することでキャッシュキーを統一する
- `useXxx.ts` — リソース固有のデータ取得（shared のみに依存する場合）。フィルター条件等は Branded Type の引数として受け取ることで、atom を直接 import せずに entities 内に留められる

---

### shared/（ドメイン無関係の共通機能）

#### 構成要素

- `ui/` — ドメイン知識のない汎用UIコンポーネント（`Button`・`Modal`・`DataTable` 等）
- `lib/` — ドメイン非依存のユーティリティ関数
- `state/` — ドメイン知識を含まない、複数レイヤーをまたぐグローバル状態（`sidebarOpen`・`theme` 等）

BFF 通信・レスポンス変換・カスタム hooks は置かない。

> **shared/state/ に置く前の判断軸:** 「ドメイン知識が入っていないか？」  
> `currentUser` のようにドメイン概念を含むものは `entities/user/model/atoms.ts` に置く。  
> `sidebarOpen`・`theme` 等のドメイン非依存な状態のみ `shared/state/` に置く。

---

## データフローの全体像

どのレイヤーからのリクエストも必ず `routes/api/`（BFF）を経由する。配置レイヤーは「依存を満たせる最下位」に決める。

### 読み取り（Read）

**entities — リソース固有のデータ取得（shared のみに依存する場合）**

```
entities/pokemon/ (クライアント)
  │
  └─ usePokemons.ts（useQuery）
       ├─ fetch('/api/pokemon')
       │     └─ routes/api/pokemon.ts（BFF）──→ 外部API / バックエンド
       └─ model/adapters.ts（レスポンス → 内部型に変換）
```

フィルター条件がある場合は Branded Type の引数で受け取る。atom の読み取りは呼び出し元（features / widgets）が担う。

```ts
// entities/pokemon/model/types.ts
export type PokemonParams = Branded<string, "PokemonParams">;

// entities/pokemon/usePokemons.ts
export function usePokemons(params: PokemonParams) { ... }

// 呼び出し元（features / widgets）— pokemonParamsAtom は PokemonParams 型で保持
const params = useAtomValue(pokemonParamsAtom);
usePokemons(params);
```

**features — ユーザーアクションを伴う、または entities/shared では表現できない複合条件を持つデータ取得**

```
features/search-pokemon/ (クライアント)
  │
  └─ useSearchPokemon.ts（useQuery）
       ├─ fetch('/api/pokemon?q=...')   ← searchQueryAtom など entities/features の状態を使用
       │     └─ routes/api/pokemon.ts（BFF）──→ 外部API / バックエンド
       └─ entities/pokemon/model/adapters.ts（レスポンス → 内部型に変換）
```

**widgets — widget 固有の複合データ（features まで下げられない場合のみ）**

```
widgets/pokemon-card-table/ (クライアント)
  │
  └─ useXxx.ts（useQuery）
       └─ fetch('/api/...')   ← 複数リソースを組み合わせた widget 固有のリクエスト
             └─ routes/api/xxx.ts（BFF）──→ 外部API / バックエンド
```

### 書き込み（Mutation）

Mutation はユーザーアクションを伴うため、原則 `features/` に置く。

```
features/create-order/ (クライアント)
  │
  └─ useCreateOrder.ts
       ├─ fetch('/api/orders', { method: 'POST' })
       │     └─ routes/api/orders.ts（BFF）──→ 外部API / バックエンド
       └─（レスポンスが必要なら adapters.ts で変換）
```

---

## UIコンポーネント配置の判定フローチャート

```
UIコンポーネントを作りたい
  │
  ① ドメイン知識がない？
     Yes → shared/ui/
     No  ↓
  ② 「動詞+名詞」で命名できる操作・機能か？
     Yes → features/
     No  ↓
  ③ 1つのリソースの型だけに依存する再利用パーツ？
     Yes → entities/xxx/ui/
     No  ↓
  ④ 複数の entities/features を組み合わせた自己完結ブロック？
     Yes → widgets/
     No  ↓
  ⑤ ページ全体の構成（FSD App + Pages）？
     Yes → app(routes)/
```

> UIコンポーネント以外の成果物（型定義・adapter・hooks・atoms）は各レイヤーの構成要素を参照。

---

## BFF リクエストの配置判断

### 「下のレイヤーに移せるか？」を判断軸とする

```
BFF リクエストを定義したい
  │
  entities に置ける？
  （shared の型・関数だけで完結し、リソース固有のデータ取得か）
  ※ フィルター条件は Branded Type の引数で受け取れば entities に留められる
     （atom を直接 import しないため FSD の依存ルールを維持できる）
  → Yes → entities/xxx/useXxx.ts に置く
  → No  ↓
  features に置ける？
  （ユーザーアクションを伴うか、または entities/shared では表現できない複合条件があるか）
  → Yes → features/xxx/useXxx.ts に置く
  → No  ↓
  widgets/xxx/useXxx.ts に置く
  （widget 固有の複合データが必要な場合）
```

### 同一エンドポイントを複数スライスが使う場合

それぞれのスライスが独立して `useXxx.ts` を定義する。重複は許容し、各スライスの所有権を明示することを優先する。

**ただし queryKey はエンドポイント単位で統一する。**  
キャッシュ不一致や二重リクエストを防ぐため、queryKey は `entities/xxx/model/queryKeys.ts` に定義し、features・widgets はそこから import して使う。`shared/` にはドメイン知識が入るため置かない。

```ts
// ✅ entities/pokemon/model/queryKeys.ts
export const pokemonKeys = {
  all: ["pokemon"] as const,
  detail: (id: PokemonId) => ["pokemon", id] as const,
  list: (params: PokemonParams) => ["pokemon", "list", params] as const,
};

// ✅ features/search-pokemon/useSearchPokemon.ts
import { pokemonKeys } from "#/entities/pokemon/model/queryKeys";

export function useSearchPokemon(params: PokemonParams) {
  return useQuery({
    queryKey: pokemonKeys.list(params),
    queryFn: async () => { ... },
  });
}
```

---

## 状態管理

atom の定義自体は hooks ではないためサーバー/クライアントどちらからも import 可能だが、atom を購読するコンポーネント（useAtom 等を呼ぶ側）は必ずクライアントコンポーネントになる。配置は FSD のレイヤー依存ルールに従い、スコープに応じて決定する。

ライブラリ固有の詳細（Provider 配置等）は [state-management-guide.md](./state-management-guide.md) を参照。

### atom（ストア）の配置ルール

| atom のスコープ | 配置先 | 例 |
|---|---|---|
| 特定リソースに紐づく状態 | entities/xxx/model/atoms.ts | selectedOrderId, expandedUserId, currentUser |
| feature に閉じた一時的な状態 | features/xxx/atoms.ts | searchQuery, formFilters |
| ドメイン非依存のグローバル状態 | shared/state/ | sidebarOpen, theme |

widgets の UI 固有の一時状態は atom ではなく local state（useState 等）で管理する。widget スコープに留まる状態を atom に昇格させる必要はない。

### 依存方向

atom の参照も FSD の一方通行ルールに従う。

```
widgets   → features / entities の atom を参照してよい
features  → entities の atom を参照してよい
entities  → shared の atom を参照してよい

entities  → features の atom を参照してはいけない（下→上は禁止）
widgets   → 他の widgets の atom を参照してはいけない（同階層禁止）
```

下位レイヤーから上位の atom を参照したくなった場合は、atom を shared に昇格させるか、props として渡す。

---

## 付録

- スタイリング（CSS Modules）: [styling-guide.md](./styling-guide.md)
- 状態管理ライブラリ固有の詳細（Provider 配置等）: [state-management-guide.md](./state-management-guide.md)
- TanStack Start での実装例: [tanstack-start-guide.md](./tanstack-start-guide.md)
