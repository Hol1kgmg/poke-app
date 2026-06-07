# poke-app テスト・チェック技術スタック

---

## ユニット / コンポーネントテスト

### Vitest

テストランナー。専用の `vitest.config.ts` は存在せず、`vite.config.ts` にビルド設定と統合されている。

| 項目 | 内容 |
|---|---|
| バージョン | 4.1.8 |
| 実行環境 | jsdom（ブラウザ環境エミュレーション） |
| 対象ファイル | デフォルトパターン（`src/**/*.{test,spec}.{ts,tsx}`） |

```bash
pnpm test    # vitest run（ワンショット実行）
```

### @testing-library/react

React コンポーネントをユーザー操作視点でテストするためのユーティリティ。

| 項目 | 内容 |
|---|---|
| バージョン | 16.3.2 |
| 用途 | コンポーネントのレンダリング・イベント操作・アサーション |

### @testing-library/dom

DOM 操作ユーティリティ。`@testing-library/react` の依存として利用される。

| 項目 | 内容 |
|---|---|
| バージョン | 10.4.1 |
| 用途 | DOM クエリ・アサーション |

### MSW (Mock Service Worker)

APIモックライブラリ。`mocks/` ディレクトリにハンドラを定義し、Service ワーカーを `public/` に配置することでブラウザテスト中のネットワークリクエストを制御する。

### @storybook/addon-vitest

Storybook のストーリーを Vitest のテストケースとしてそのまま実行するプラグイン。`storybookTest()` を `vitest.config.ts` の plugins に追加することで統合される。

---

## E2E テスト

### Playwright

エンドツーエンドテスト。`playwright.config.ts` にて設定。

- **対象ディレクトリ**: `e2e/`
- **ブラウザ**: Chromium のみ（`devices['Desktop Chrome']`）
- **レポーター**: HTML形式
- **開発サーバー**: テスト実行時に `pnpm dev` を自動起動（`baseURL: http://localhost:3000`）

CI 環境での挙動:

| 設定項目 | ローカル | CI |
|---|---|---|
| `retries` | 0 | 2 |
| `workers` | 無制限 | 1 |
| `forbidOnly` | false | true |
| `reuseExistingServer` | true | false |

```bash
pnpm test:e2e       # E2E実行
pnpm test:e2e:ui    # Playwright UIモードで実行
```

---

## コンポーネントカタログ

### Storybook 10 (`@storybook/react-vite`)

TanStack Start + Vite ベースの Storybook。ポート `6006` で起動。

#### 導入アドオン

| アドオン | 用途 |
|---|---|
| `@storybook/addon-vitest` | Vitestとのテスト統合 |
| `@storybook/addon-a11y` | アクセシビリティチェック |
| `@storybook/addon-docs` | ドキュメント自動生成 |
| `@storybook/addon-mcp` | MCP連携 |
| `@chromatic-com/storybook` | Chromatic（ビジュアルリグレッションテスト）連携 |

```bash
pnpm storybook        # 開発サーバー起動
pnpm build-storybook  # 静的ビルド
```

---

## 型チェック

### TypeScript 6

- **主要オプション**:
  - `target: ES2022`
  - `moduleResolution: bundler`
  - `strict: true`
  - `noUnusedLocals / noUnusedParameters: true`
  - `noEmit: true`（型チェック専用、トランスパイルは行わない）
- **パスエイリアス**: `#/*`, `@/*` → `./src/*`

```bash
pnpm typecheck    # tsc --noEmit
```

---

## アクセシビリティチェック

| ツール | タイミング | 内容 |
|---|---|---|
| `@storybook/addon-a11y` | Storybook表示時 | Storybookパネルでaxeベースのa11y違反を可視化 |
| `oxlint` の `jsx-a11y` プラグイン | lint時（静的解析） | JSX/TSX内のARIA属性・alt等をルールチェック |

---

## まとめ

```
テスト種別              ツール                              実行タイミング
───────────────────────────────────────────────────────────────────────
ユニット/コンポーネント   Vitest + @testing-library/react     開発中 / CI
Storybookテスト         Vitest + addon-vitest               開発中 / CI
E2E                    Playwright                          CI / 手動
コンポーネントカタログ    Storybook                           開発中
型チェック              TypeScript (tsc --noEmit)            開発中 / CI
アクセシビリティ          addon-a11y / jsx-a11y               開発中 / lint時
APIモック               MSW                                 ブラウザテスト中
```
