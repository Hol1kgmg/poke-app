# フロントエンドアーキテクチャガイド

FSD（Feature-Sliced Design）に基づく、フレームワーク非依存のフロントエンドアーキテクチャガイド。

---

## 背景と課題

BFF（Backend for Frontend）パターンを採用したフロントエンドにおいて、機能単位で管理されたコンポーネントから別機能の API リクエスト処理を呼び出す際に、同階層の import が発生し、暗黙の依存関係が生まれる問題があった。

本ガイドでは FSD の思想に基づき、依存関係を構造的に制御するアーキテクチャを定義する。

---

## 設計原則

### 1. データ取得はサーバーサイド層で呼び出す

BFF へのデータ取得はサーバーサイド層（SSR / サーバーコンポーネント / ローダー等）で呼び出し、UI コンポーネントには props やコンテキスト経由でデータを渡す。これにより、UI コンポーネントが serverFns を直接 import する必要がなくなり、機能間の跨ぎ問題が構造的に解消される。

### 2. serverFn の定義場所と呼び出し場所を分ける

serverFn は **そのロジックのドメイン・操作を所有するレイヤーに定義**し、**それを必要とするサーバーサイド層から呼び出す**。

| 種類 | 定義場所 | 呼び出し場所 |
|---|---|---|
| Read（GET） | `entities/xxx/api/` | `app/` の loader |
| Mutation（POST / PUT / DELETE） | `features/xxx/` | `features/xxx/` のコンポーネント |
| レスポンス変換（adapter） | `entities/xxx/model/` | `app/` の loader（Read 時）または `features/xxx/`（Mutation 後） |

`shared/` にドメイン知識を持ち込まないことで、shared 本来の役割（ドメイン非依存の共通機能）を保つ。

### 3. FSD のレイヤー依存ルールを厳守する

依存は**上位レイヤーから下位レイヤーへの一方通行**のみ。同階層のスライス同士は互いを import しない。

```
app → widgets → features → entities → shared
```

- 上位は下位を使える
- 下位は上位を知らない
- **同階層の import は禁止**

### 4. 組み合わせたくなったら上位レイヤーの仕事

同階層のスライスを組み合わせたいという欲求が出たら、それは1つ上のレイヤーが担う責務である。

### 5. サーバー/クライアントの境界はレイヤーではなくコンポーネント単位で決定する

FSD のレイヤーは「責務と依存方向」のルール、サーバー/クライアントは「実行環境」のルールであり、この2つは独立した軸として扱う。クライアントサイドのマーキング（Next.js の `"use client"` 等）は必要なコンポーネントにのみ付与し、できる限り末端（葉）に寄せる。

- 状態管理、イベントハンドラ、ブラウザ API を使う → クライアントコンポーネント
- 上記を使わない → サーバーサイドで実行可能なまま維持
- 複合ブロック全体をクライアントにするのではなく、インタラクション部分だけを切り出す

---

## ディレクトリ構成

```
src/
  app/                              ← ルーティング + データ取得の orchestration
    dashboard/
      page.tsx (or +page.svelte, etc.)
    orders/
      page.tsx
      [id]/
        page.tsx

  widgets/                          ← 画面固有の複合UIブロック
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

  features/                         ← ユーザー操作・アクション単位
    create-order/
      CreateOrderForm.tsx
      CreateOrderForm.module.css
      CreateOrderButton.tsx
      CreateOrderButton.module.css
      useCreateOrder.ts
      serverFn.ts                     ← mutation の serverFn（POST /api/orders 等）
      atoms.ts                        feature に閉じた状態（フォーム入力値等）
      types.ts
    update-profile/
      ProfileEditForm.tsx
      ProfileEditForm.module.css
      serverFn.ts
    search-product/
      SearchProductInput.tsx
      SearchProductInput.module.css
      atoms.ts                        searchQuery, filters 等

  entities/                         ← リソース単位の再利用コンポーネント＋型
    user/
      ui/
        UserAvatar.tsx
        UserAvatar.module.css
        UserNameLabel.tsx
        UserNameLabel.module.css
      model/
        types.ts
        atoms.ts                      selectedUserId 等
        adapters.ts                   ← BFF レスポンス → 内部型への変換
      api/
        index.ts                      ← Read の serverFn（GET /api/users）
    order/
      ui/
        OrderStatusBadge.tsx
        OrderStatusBadge.module.css
      model/
        types.ts
        atoms.ts                      selectedOrderId 等
        adapters.ts
      api/
        index.ts                      ← Read の serverFn（GET /api/orders）
    product/
      ui/
        ProductCard.tsx
        ProductCard.module.css
      model/
        types.ts
        adapters.ts
      api/
        index.ts                      ← Read の serverFn（GET /api/products）

  shared/                           ← ドメイン無関係の共通レイヤー
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
      auth.ts                         currentUser, isAuthenticated 等
      ui.ts                           sidebarOpen, theme 等
```

---

## 各レイヤーの責務と粒度

### app/（ルーティング + データ取得の orchestration）

サーバーサイド層として、必要な serverFns を呼び出し、adapters で変換したデータを widgets / features に渡す。フレームワークごとにこの層の実装方法は異なるが、責務は共通。

```
フレームワーク         サーバーサイドのデータ取得手段
─────────────────────────────────────────
TanStack Start        loader 関数（createFileRoute の loader オプション）
Next.js App Router    Server Component（async component）
Next.js Pages Router  getServerSideProps / getStaticProps
Remix                 loader 関数
Nuxt                  useAsyncData / server routes
SvelteKit             load 関数
SPA（React 等）       ルートレベルの hooks / React Query 等
```

#### コンポーネント配置ルール

- ページコンポーネント（`DashboardPage` 等）を配置する
- ページコンポーネントはデータを受け取り widgets / features に渡すだけで、UIロジックを持たない

#### ロジック配置ルール

- データ取得ロジック（loader / getServerSideProps 等）はページファイル内に直接記述する
- `entities/xxx/api/` の Read serverFn と `entities/xxx/model/adapters.ts` を呼び出す唯一の起点がここ
- カスタム hooks は置かない（データ取得はサーバーサイド関数であり、hooks の出番はない）

---

### widgets/（画面固有の複合UIブロック）

粒度の判定基準: **「そのブロックだけ四角で囲んで、ページから切り離せるか？」**

- 複数の entities や features を組み合わせている
- ページをまたいで再利用しうる（1ページ限定でも十分に複合的なら widget）
- データ取得はしない（props / コンテキスト経由で受け取る）
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

#### コンポーネント配置ルール

- 複合UIブロック本体（`OrderListPanel.tsx` 等）と、外部に export しない内部分割コンポーネントをスライス直下に並べて配置する
- `.module.css` はコンポーネントと同名・同階層に置く

#### ロジック配置ルール

- **data fetch は行わない**。データは必ず props / コンテキスト経由で受け取る
- 表示切り替えやアコーディオンなど widget 内に閉じた UI 状態が複雑な場合のみ `useXxx.ts` を作成する
- atoms / types は原則置かない。必要になった場合は entities または shared への昇格を検討する

---

### features/（ユーザー操作・アクション単位）

粒度の判定基準: **「動詞 + 名詞」で命名できるか？**

- 1つのユーザー操作 = 1つの feature
- サーバーサイドの mutation 処理と 1対1 になることが多い
- 操作に付随する UI（フォーム、確認モーダル、ボタン等）を含む
- 「注文を作成してさらに決済する」は create-order と process-payment に分ける

```
✅ features の例
  create-order           注文を作成する
  update-profile         プロフィールを更新する
  search-product         商品を検索する
  delete-comment         コメントを削除する
  toggle-favorite        お気に入りを切り替える

❌ features ではないもの
  order-management       → 動詞がない → widgets
  user-info              → 動詞がない → entities
  dashboard              → 動詞がない → widgets
```

#### コンポーネント配置ルール

- 操作に付随する UI（フォーム・確認モーダル・ボタン等）をスライス直下に配置する
- `.module.css` はコンポーネントと同名・同階層に置く

#### ロジック配置ルール

- mutation 処理・フォームバリデーション・送信後の状態更新など、操作に関するロジックは `useXxx.ts` にまとめる
- BFF への書き込みリクエスト（POST / PUT / DELETE）は `serverFn.ts` に定義する（この feature の所有物）
- フォーム入力値・フィルター条件など feature に閉じた一時的な状態は `atoms.ts` に定義する
- feature 固有の型は `types.ts` に置く

---

### entities/（リソース単位の再利用パーツ）

粒度の判定基準: **BFF に独立したエンドポイント群があるか？**

- BFF の API レスポンス型と 1対1 で対応する
- `entities/xxx/model/adapters.ts` の粒度と一致する
- 独立した API エンドポイントがないもの（例：order の中に含まれる order_items）は entity にしない
- 特定リソースの型を受け取って表示する再利用コンポーネントを提供する

```
BFF エンドポイント              entity             api / adapter
GET /api/users             → entities/user/   ↔ api/index.ts / model/adapters.ts
GET /api/orders            → entities/order/  ↔ api/index.ts / model/adapters.ts
GET /api/products          → entities/product/ ↔ api/index.ts / model/adapters.ts
(order_items は /api/orders に含まれる)           → entity にしない
```

#### コンポーネント配置ルール

- リソース固有の再利用UIパーツ（`UserAvatar.tsx`・`OrderStatusBadge.tsx` 等）を `ui/` サブディレクトリに配置する
- `.module.css` はコンポーネントと同名・同階層に置く

#### ロジック配置ルール

- BFF からの読み取りリクエスト（GET）は `api/index.ts` に定義する（このエンティティの所有物）
- `api/index.ts` は `app/` の loader から呼び出される。UI コンポーネントから直接呼ばない
- BFF レスポンスの内部型への変換は `model/adapters.ts` に定義する
- リソースの型定義は `model/types.ts` に置く
- `selectedXxxId` など特定リソースに紐づく選択状態は `model/atoms.ts` に定義する
- カスタム hooks は置かない

---

### shared/（ドメイン無関係の共通機能）

- `ui/`: ドメイン知識のない汎用UIコンポーネント
- `lib/`: ユーティリティ関数
- `state/`: グローバル状態管理（auth, UI 状態等）

BFF 通信やレスポンス変換はドメイン知識を伴うため `shared/` には置かない。

#### コンポーネント配置ルール

- ドメイン知識を持たない汎用コンポーネント（`Button`・`Modal`・`DataTable` 等）を `ui/` に配置する
- `.module.css` はコンポーネントと同名・同階層に置く

#### ロジック配置ルール

- 複数レイヤーをまたぐグローバル状態（`currentUser`・`sidebarOpen` 等）は `state/` に定義する
- ドメイン非依存のユーティリティ関数は `lib/` に置く
- BFF 通信・レスポンス変換・カスタム hooks は置かない

---

## データフローの全体像

### 読み取り（Read）

```
app/ (サーバーサイド層 loader)
  │
  ├─ entities/user/api/index.ts ──→ BFF GET /api/users
  │     └─ entities/user/model/adapters.ts（レスポンス → 内部型に変換）
  ├─ entities/order/api/index.ts ──→ BFF GET /api/orders
  │     └─ entities/order/model/adapters.ts（レスポンス → 内部型に変換）
  │
  └─ props / コンテキストでデータを渡す
       │
       ├─ widgets/（複合ブロックへ）
       ├─ features/（操作コンポーネントへ）
       └─ entities/ui/（リソースパーツへ）
```

定義場所: `entities/xxx/api/`（エンティティが所有）
呼び出し場所: `app/` の loader のみ

### 書き込み（Mutation）

```
features/create-order/ (クライアント)
  │
  └─ features/create-order/serverFn.ts
       │
       └─ BFF POST /api/orders
```

定義場所: `features/xxx/serverFn.ts`（その操作の feature が所有）
呼び出し場所: 同じ feature 内のコンポーネント / hooks

mutation の呼び出し方法はフレームワークにより異なる。

```
フレームワーク         mutation の実装手段
─────────────────────────────────────────
TanStack Start        Server Functions（createServerFn）
Next.js App Router    Server Actions（"use server"）
Next.js Pages Router  API Routes + クライアント fetch
Remix                 action 関数
Nuxt                  server routes + useFetch
SvelteKit             form actions
SPA（React 等）       REST / GraphQL クライアント
```

---

## コンポーネント配置の判定フローチャート

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

---

## UI レイヤーと serverFn の対応関係

### Read: entities/api と app/ の関係

`entities/xxx/api/` に定義した Read serverFn と、`app/` のページは N:M の関係になる。

- 1つのページローダーが複数の entity の api を呼ぶ（よくある）
- 1つの entity の api が複数のページから呼ばれる（よくある）

両者を繋ぐのが `app/` のサーバーサイド層であり、widgets / features は serverFn を直接知らない。

### Mutation: features/serverFn と feature の関係

`features/xxx/serverFn.ts` は原則 1:1。その feature 専用の mutation であり、他の feature から呼び出さない。

複数の feature が同じエンドポイントを叩く場合は、それぞれの feature が独立して serverFn を定義する。重複は許容し、各 feature の所有権を明示することを優先する。mutation を `entities/xxx/api/` に昇格させてはならない。`entities/api/` は Read（GET）専用である。

---

## 状態管理

atom の定義自体は hooks ではないためサーバー/クライアントどちらからも import 可能だが、atom を購読するコンポーネント（useAtom 等を呼ぶ側）は必ずクライアントコンポーネントになる。配置は FSD のレイヤー依存ルールに従い、スコープに応じて決定する。

ライブラリ固有の詳細（Provider 配置等）は [state-management-guide.md](./state-management-guide.md) を参照。

### atom（ストア）の配置ルール

| atom のスコープ | 配置先 | 例 |
|---|---|---|
| 特定リソースに紐づく状態 | entities/xxx/model/atoms.ts | selectedOrderId, expandedUserId |
| 特定操作に閉じた状態 | features/xxx/atoms.ts | searchQuery, formFilters |
| 複数レイヤーをまたぐグローバル状態 | shared/state/ | currentUser, sidebarOpen, theme |

### 依存方向

atom の参照も FSD の一方通行ルールに従う。

```
widgets   → features の atom を参照してよい
features  → entities の atom を参照してよい
entities  → shared の atom を参照してよい

entities  → features の atom を参照してはいけない（下→上は禁止）
```

下位レイヤーから上位の atom を参照したくなった場合は、atom を shared に昇格させるか、widget 経由で props として渡す。

---

## 禁止事項

1. **同階層スライス間の import 禁止**: `entities/user/` から `entities/order/` を import しない
2. **下位レイヤーから上位レイヤーの参照禁止**: `entities` から `widgets` を import しない
3. **UI コンポーネントから Read serverFn の直接呼び出し禁止**: `entities/xxx/api/` は `app/` の loader からのみ呼び出す
4. **ドメイン知識を持つロジックの `shared/` への配置禁止**: BFF 通信・レスポンス変換は `entities/xxx/` または `features/xxx/` に置く

---

## 付録

- スタイリング（CSS Modules）: [styling-guide.md](./styling-guide.md)
- 状態管理ライブラリ固有の詳細（Provider 配置等）: [state-management-guide.md](./state-management-guide.md)
- TanStack Start での実装例: [tanstack-start-guide.md](./tanstack-start-guide.md)
