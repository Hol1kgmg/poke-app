# poke-app

ポケモン相性診断アプリ

## 前提条件

- [mise](https://mise.jdx.dev/) がインストール済みであること

## セットアップ

### 1. mise でツールバージョンを固定

```bash
mise trust && mise install
```

node / pnpm が自動でインストールされます。

### 2. 依存パッケージのインストール

```bash
cd frontend
pnpm install
```

`pnpm install` 実行時に `lefthook install` が自動で走り、Git フックが設定されます。

### 3. 開発サーバーの起動

```bash
cd frontend
pnpm dev
```

`http://localhost:3000` でアクセスできます。

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# 型チェック
pnpm typecheck

# Lint（自動修正あり）
pnpm lint

# マークアップ Lint（自動修正あり）
pnpm lint:markup

# フォーマット
pnpm format

# テスト
pnpm test
```

## コミット時の自動チェック

`git commit` 時に lefthook が以下を自動実行します。問題があれば自動修正した上でコミットされます。

| チェック | ツール | 自動修正 |
|---|---|---|
| Lint | oxlint | あり |
| フォーマット | oxfmt | あり |
| マークアップ | markuplint | あり |
| 型チェック | tsc | なし（エラー時はコミット中断） |
