# フロントエンドアーキテクチャガイド

---

## 理想

**実装するにあたりディレクトリ構造がただ１つに定まる形で明示されたアーキテクチャ。**

どのファイルをどこに置くかが一意に決まることで、実装者による判断のばらつきをなくし、レビューコストと暗黙の依存関係の発生を防ぐ。

---

## アーキテクチャ方針

理想を実現する手段として **FSD（Feature-Sliced Design）の思想** を取り入れる。

### FSD の核心

依存は **上位レイヤーから下位レイヤーへの一方通行** のみ。同階層のスライス同士は互いを import しない。

```
app(routes) → pages → widgets → features → aggregates → entities → shared
```

- 上位は下位を使える
- 下位は上位を知らない
- 同階層の import は禁止（例外：entities 内の composite → atomic のみ）

### このプロジェクトの拡張

FSD 標準からの差分として、以下の2つを追加している。

| 追加要素 | 理由 |
|---|---|
| `aggregates/` | 複数 composite エンティティをまたぐ型・UI を置く場所。entities 間の cross-import 例外を最小化するために導入。責務は極めて限定的。 |
| `routes/api/`（BFF） | 外部 API へのリクエストを集約する HTTP エンドポイント。FSD のレイヤー構造の外側に位置し、各レイヤーから `fetch('/api/xxx')` 経由でのみ呼び出す。 |

### FSD 公式との方針差異

| 項目 | FSD 公式 | このプロジェクト |
|---|---|---|
| モデル定義の起点 | UI 起点（pages/widgets が必要なものを entities に落とす top-down 設計） | データ起点（BFF レスポンスを entities でモデル化し UI を組み立てる bottom-up 設計） |
| entities の責務範囲 | データ取得は上位レイヤー（pages/widgets）の責務 | そのリソースのデータ取得も entities 自身の責務に含む |

「データ起点でモデルを定義する」という方針の結果として、そのリソースのデータ取得を entities が担うのが自然になる。これにより FSD 公式では Pages/Widgets が起点となるデータ取得が、このプロジェクトでは entities を起点とした下位レイヤー優先の配置（entities → features → widgets の順で検討）に変わる。

---

## 設計原則

アーキテクチャ方針（FSD）を具体的なルールに落とし込んだもの。

### 1. BFF リクエストは依存を満たせる最下位レイヤーに置く

「そのリクエストを下のレイヤーに移せるか？」を判断軸とし、移せる限り下位レイヤーに配置する。

### 2. 外部 API へのリクエストは routes/api/（BFF）に集約する

FSD の各レイヤーから外部 API へ直接アクセスしない。必ず `routes/api/` を経由する。

```
entities/features/widgets ──→ fetch('/api/xxx') ──→ routes/api/ ──→ 外部API
```

- API キー・シークレットをクライアントに露出させない
- CORS 制約を BFF 側で吸収する
- 外部 API のレスポンス形式の変化を BFF 側に閉じ込める

### 3. 組み合わせたくなったら上位レイヤーの仕事

同階層のスライスを組み合わせたい場合、それは1つ上のレイヤーが担う責務。

### 4. 外部非公開のファイルを持つスライスは index.ts で公開 API を定義する

スライス外のコードは `index.ts` 経由でのみ import できる。内部ファイルへの直接 import は禁止。

- 外部非公開ファイルを持たないスライスは `index.ts` 不要
- `widgets/` は内部分割コンポーネントを持つ設計のため原則 `index.ts` 必須
- `shared/ui/` はコンポーネントごとの個別 import が自然な構造のため対象外

### 5. サーバー／クライアントの境界はコンポーネント単位で決定する

FSD のレイヤーは「責務と依存方向」のルール、サーバー/クライアントは「実行環境」のルールであり、この2つは独立した軸。クライアントマーキング（`"use client"` 等）は必要なコンポーネントにのみ付与し、できる限り末端（葉）に寄せる。

---

## 決定フローチャート

### UI コンポーネントの置き場所

```
UI コンポーネントを作りたい
  │
  ① ドメイン知識がない？
     Yes → shared/ui/
     No  ↓
  ② 「動詞+名詞」で命名できる操作・機能か？
     Yes → features/
     No  ↓
  ③ 単一エンティティのスコープに収まる再利用パーツ？
     Yes → entities/xxx/ui/
     No  ↓
  ④ 複数の composite エンティティをまたぐ再利用パーツ？
     Yes → aggregates/xxx/ui/
     No  ↓
  ⑤ 複数の entities/features を組み合わせた自己完結ブロック？
     Yes → widgets/
     No  ↓
  ⑥ ページ全体の構成（widgets の組み合わせ）？
     Yes → pages/
```

### BFF リクエストの置き場所

```
BFF リクエストを定義したい
  │
  entities に置ける？
  （shared の型・関数だけで完結し、単一リソースのデータ取得か）
  ※ フィルター条件は Branded Type の引数で受け取れば entities に留められる
     （atom を直接 import しないため FSD の依存ルールを維持できる）
  → Yes → entities/xxx/useXxx.ts
  → No  ↓
  aggregates に置ける？
  （複数 composite エンティティをまたぐデータ取得か）
  → Yes → aggregates/xxx/useXxx.ts
  → No  ↓
  features に置ける？
  （ユーザーアクションを伴うか、entities/shared では表現できない複合条件があるか）
  → Yes → features/xxx/useXxx.ts
  → No  ↓
  widget 固有の複合データが必要か？
  → Yes → widgets/xxx/useXxx.ts
```

### atom の置き場所

| スコープ | 配置先 | 例 |
|---|---|---|
| 特定リソースに紐づく状態 | `entities/xxx/model/atoms.ts` | `selectedOrderId`, `currentUser` |
| feature に閉じた一時的な状態 | `features/xxx/atoms.ts` | `searchQuery`, `formFilters` |
| ドメイン非依存のグローバル状態 | `shared/state/` | `sidebarOpen`, `theme` |

widgets の UI 固有の一時状態は atom に昇格させず local state（useState 等）で管理する。

---

## レイヤー仕様

### ディレクトリ構成

```
src/
  routes/                           ← ルーティング・アプリ初期化（__root.tsx のみ CSS 許可）
    __root.tsx
    index.tsx                       ← pages/ へ委譲するだけ
    api/                            ← BFF レイヤー（FSD 外）、HTTP 経由で各レイヤーから呼び出す
      orders.ts
      products.ts

  pages/                            ← ページ構成（widgets を組み合わせる、CSS 許可）
    home/
      HomePage.tsx
      HomePage.module.css
    order-detail/
      OrderDetailPage.tsx
      OrderDetailPage.module.css

  widgets/                          ← 自己完結型の複合 UI ブロック
    order-list-panel/
      OrderListPanel.tsx
      OrderListPanel.module.css
      OrderCard.tsx                 ← 内部分割（外部に export しない）
      OrderCard.module.css
      index.ts                      ← 公開 API のみ列挙
    dashboard-summary/
      DashboardSummary.tsx
      DashboardSummary.module.css
      useDashboardSummary.ts        ← widget 固有のデータ取得（任意）
      index.ts

  features/                         ← 操作・機能単位（動詞+名詞）
    search-order/
      SearchOrderInput.tsx
      SearchOrderInput.module.css
      useSearchOrder.ts
      atoms.ts
    toggle-favorite/
      useToggleFavorite.ts          ← UI 不要なケース（.tsx なしで成立）

  aggregates/                       ← 複数 composite エンティティをまたぐ型・UI（FSD 非標準）
    order-summary/
      model/
        types.ts
        adapters.ts
        queryKeys.ts
      ui/
        OrderSummaryCard.tsx
        OrderSummaryCard.module.css
      useOrderSummary.ts

  entities/                         ← ドメインリソースの最小単位
    order/
      ui/
        OrderCard.tsx
        OrderCard.module.css
        StatusTag.tsx
        StatusTag.module.css
      model/
        types.ts
        atoms.ts
        adapters.ts
        queryKeys.ts
      useOrders.ts
    product/                        ← atomic entity（他の entity に依存しない）
      ui/
        CategoryBadge.tsx
        CategoryBadge.module.css
      model/
        types.ts
        adapters.ts

  shared/                           ← ドメイン無関係の共通レイヤー
    ui/
      Button.tsx
      Button.module.css
      Modal.tsx
      Modal.module.css
    lib/
      formatDate.ts
      branded.ts
    state/
      ui.ts                         ← sidebarOpen, theme 等
```

---

### app(routes)/

**責務:** ルーティング定義・アプリ初期化・アプリシェル

| ファイル | 内容 |
|---|---|
| `__root.tsx` / `_layout.tsx` | アプリシェル（CSS 許可 — header・sidebar・main の枠組みのみ） |
| 個別ルートファイル（`index.tsx` 等） | `pages/` へ委譲するだけ（CSS なし） |
| `loader` | SSR プリフェッチが必要な場合のみ使用 |

カスタム hooks は置かない。

---

### pages/

**責務:** ページ構成（widgets を組み合わせる）・ページ固有のレイアウト

| ファイル | 内容 |
|---|---|
| `XxxPage.tsx` | widgets を組み合わせたページコンポーネント |
| `XxxPage.module.css` | ページ固有のレイアウト（グリッド・スペーシング等）— 任意 |

- カスタム hooks は置かない
- ビジネスロジックは持たない（すべて widgets / features に委譲）
- 複数ページで共通するレイアウト構造は widgets に切り出す

---

### routes/api/（BFF）

**責務:** 外部 API またはバックエンドへのリクエストを HTTP エンドポイントとして集約する

| ファイル | 内容 |
|---|---|
| `xxx.ts` | HTTP エンドポイント（外部 API 呼び出し・Raw レスポンスをそのまま返す） |

- FSD 各レイヤーから `fetch('/api/xxx')` 経由でのみ呼び出す（直接 import 禁止）
- レスポンス変換は行わない（変換は呼び出し元の `adapters.ts` が担う）

---

### widgets/

**責務:** 複数の entities / features を組み合わせた自己完結型の複合 UI ブロック

| ファイル | 内容 |
|---|---|
| `XxxWidget.tsx` 等 | 複合 UI ブロック本体 |
| 内部分割コンポーネント | スライス直下に配置（外部 export しない） |
| `useXxx.ts` | UI 状態管理、または widget 固有のデータ取得（任意） |
| `index.ts` | 公開 API のみ列挙（原則必須） |

atoms・types は置かない。features / aggregates / entities / shared の責務に沿うように構築する。

**データ取得を widget に置く条件（3つすべてを満たすこと）:**
1. 2つ以上の異なるエンティティの状態を同時に購読する
2. そのデータ取得ロジックが他の widget / feature から再利用されない
3. features に切り出すと「動詞+名詞」の命名が不自然になる

**命名:** 名詞（kebab-case）例: `order-list-panel`, `sidebar-navigation`

---

### features/

**責務:** entities / shared で完結しない BFF リクエスト、またはユーザーアクション

| ファイル | 内容 |
|---|---|
| `*.tsx` | 操作に付随する UI（フォーム・ボタン・モーダル等）— UI 不要なら省略可 |
| `useXxx.ts` | Read（useQuery）・Mutation（fetch）ロジック |
| `atoms.ts` | feature に閉じた一時的な状態（フォーム入力値・フィルター条件等） |
| `types.ts` | feature 固有の型定義 |

**命名:** 動詞+名詞（kebab-case）例: `search-order`, `toggle-favorite`

---

### aggregates/

**責務:** 複数 composite エンティティをまたぐ型定義・データ取得・再利用 UI

> aggregates は entities と同じ運用ルールに従う。「単一リソース」という制約が「複数の composite エンティティをまたぐ」に広がった点のみが異なる。

| ファイル | 内容 |
|---|---|
| `model/types.ts` | 複数 composite エンティティをまたぐ型定義 |
| `model/adapters.ts` | BFF レスポンス → aggregate 型への変換 |
| `model/queryKeys.ts` | このアグリゲートのデータ取得に使うキャッシュキー定義 |
| `ui/` | その型を表示する再利用 UI コンポーネント |
| `useXxx.ts` | aggregate 型のデータ取得（useQuery） |

mutation・atoms は持たない。

**命名:** その aggregate が表すドメイン概念の名詞（kebab-case）例: `order-summary`

> **なぜ widgets に置けないか:** widgets に置くと他の widget が import する際に同レイヤー間 import（禁止）が発生する。aggregates は widgets より下位のため、widgets から自由に import できる。

---

### entities/

**責務:** 単一ドメインリソースの型・UI・状態・データ取得の最小単位

| ファイル | 内容 |
|---|---|
| `ui/` | リソース固有の再利用 UI パーツ |
| `model/types.ts` | ドメイン型定義（Branded Types） |
| `model/adapters.ts` | BFF レスポンス → 内部型への変換 |
| `model/atoms.ts` | リソースに紐づく選択状態（`selectedXxxId` 等） |
| `model/queryKeys.ts` | このエンティティのデータ取得に使うキャッシュキー定義 |
| `useXxx.ts` | リソース固有のデータ取得（shared のみに依存する場合） |

**命名:** リソース名（kebab-case）例: `order`, `product`

#### entities 間 cross-import ルール

原則禁止だが、**composite → atomic の一方向のみ例外を認める。**

| 用語 | 定義 | 例 |
|---|---|---|
| atomic | 他の entity に依存しない最小単位 | `product` |
| composite | atomic の型・UI を参照する | `order`（`ProductId[]` を持つ） |

**粒度の捉え方**

型定義と UI で「エンティティの1単位」を表す粒度が異なる。

| | 1エンティティの単位 | カラム/テーブルの対応 |
|---|---|---|
| 型定義 | ファイル（`types.ts`） | 1ファイル内でカラム型・テーブル型を共存できる |
| UI | ディレクトリ（`ui/`） | ファイル分割が必要なため1ディレクトリが単位になる |

この違いにより、型定義ではファイル内で完結できる関係が、UI ではディレクトリ間の cross-import として現れる。どちらも同じ方向制限が適用される。

**許可する方向**

| 方向 | 型定義 | UI |
|---|---|---|
| composite → atomic | ✅ | ✅ |
| atomic → composite | ❌ | ❌ |
| atomic ↔ atomic | ❌ | ❌ |
| composite ↔ composite | ❌ → `aggregates/` へ | ❌ → `aggregates/` へ |

**条件**

- import される側（atomic）が他の entity に依存していないこと
- 依存方向は一方向のみ（循環禁止）

**適用範囲**

- 型定義：composite entity が atomic entity のカラム Branded Type を import してよい
- UI：composite entity の UI パーツが atomic entity の UI コンポーネントを import してよい
- adapter：FK カラムは Branded Type にブランドするのみとし、cross-reference を発生させない設計を維持する

---

### shared/

**責務:** ドメイン知識を持たない汎用ユーティリティと UI

| ディレクトリ | 内容 |
|---|---|
| `ui/` | ドメイン知識のない汎用 UI コンポーネント（Button・Modal 等） |
| `lib/` | ドメイン非依存のユーティリティ関数 |
| `state/` | ドメイン知識を含まないグローバル状態（`sidebarOpen`・`theme` 等） |

BFF 通信・レスポンス変換・カスタム hooks は置かない。

> `currentUser` のようにドメイン概念を含むものは `entities/user/model/atoms.ts` に置く。

---

## 禁止パターン

| # | 禁止 | 代替 |
|---|---|---|
| 1 | 同レイヤーのスライス間 import（`entities/a` → `entities/b`） | 上位レイヤーで合成（entities 内の composite → atomic は例外、詳細は entities セクション参照） |
| 2 | 下位レイヤーが上位を import（`entities` → `features`） | props で渡すか `shared/state/` に昇格 |
| 3 | `shared/` からの BFF リクエスト | `entities/`・`features/`・`widgets/` に置く |
| 4 | `shared/` へのドメインロジック配置 | `entities/` または `features/` に置く |
| 5 | 外部 API への直接 fetch（BFF バイパス） | `routes/api/` を経由する |
| 6 | 別スライスの useXxx / fetch ロジックを呼び出す | 各スライスが独立して定義する |
| 7 | 下位レイヤーで完結できるのに上位に置く | 依存を満たせる最下位レイヤーに置く |
| 8 | FSD レイヤーから `routes/api/` を直接 import | `fetch('/api/xxx')` 経由のみ |
| 9 | widget スコープの UI 状態を atom に昇格させる | widget 内で local state（useState）を使う |

---

## 付録

- スタイリング（CSS Modules）: [styling-guide.md](./styling-guide.md)
- 状態管理ライブラリ固有の詳細（Provider 配置等）: [state-management-guide.md](./state-management-guide.md)
- TanStack Start での実装例: [tanstack-start-guide.md](./tanstack-start-guide.md)
- コーディング規約（Branded Types・命名規則等の具体的なコード例を含む）: [coding-guide.md](./coding-guide.md)
