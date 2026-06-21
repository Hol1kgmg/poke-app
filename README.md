# poke-app

ポケモン相性診断アプリ（TanStack Start / React 19 / FSD）

## 前提条件

[mise](https://mise.jdx.dev/) がインストールされ、シェルに統合されていること。

macOS (Homebrew):

```bash
brew install mise
```

シェル統合 (zsh):

```bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc
```

## セットアップ

### 1. mise でツールバージョンを固定

```bash
mise trust && mise install
```

Node / pnpm / gitleaks が自動でインストールされます。

### 2. 依存パッケージのインストール

```bash
make install
```

`pnpm install` 実行時に `lefthook install` が自動で走り、Git フックが設定されます。

### 3. 開発サーバーの起動

```bash
make dev
```

`http://localhost:3000` でアクセスできます。

## 開発コマンド

利用可能なコマンドの一覧は `make list` で確認できます。

| コマンド | 説明 |
|---|---|
| `make install` | 依存パッケージのインストール |
| `make dev` | 開発サーバー起動 |
| `make build` | プロダクションビルド |
| `make preview` | ビルド成果物のプレビュー |
| `make typecheck` | TypeScript 型チェック |
| `make lint` | リンター |
| `make format` | コードフォーマット |
| `make test` | ユニットテスト |
| `make test-e2e` | E2E テスト |

## コミット時の自動チェック

`git commit` 時に lefthook が以下を自動実行します。問題があれば自動修正した上でコミットされます。

| チェック | ツール | 自動修正 |
|---|---|---|
| シークレットスキャン | gitleaks | なし（検出時はコミット中断） |
| Lint | oxlint | あり |
| フォーマット | oxfmt | あり |
| マークアップ | markuplint | あり |
| 型チェック | tsc | なし（エラー時はコミット中断） |
