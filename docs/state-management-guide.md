# 状態管理ガイド

jotai を採用する。atom の配置ルールと依存方向は [layer-architecture-guide.md](./layer-architecture-guide.md) の「状態管理」セクションを参照。

---

## Provider の配置

状態管理ライブラリの Provider（jotai の `Provider` 等）は `app` 層に配置する。`app` は最上位レイヤーなので `shared` のライブラリを使うのは正当な依存である。

フレームワークごとの配置方法:

| フレームワーク | 配置場所 |
|---|---|
| TanStack Start | `routes/__root.tsx` の `Outlet` をラップ（[実装例](./tanstack-start-guide.md#provider)） |
| Next.js App Router | `app/layout.tsx` |
| Next.js Pages Router | `pages/_app.tsx` |
| Remix | `root.tsx` |
| SvelteKit | jotai 不要（Svelte stores を使う） |
