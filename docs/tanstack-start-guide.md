# TanStack Start 実装ガイド

FSD アーキテクチャ（[layer-architecture-guide.md](./layer-architecture-guide.md)）を TanStack Start で実装する際の具体例。

---

## データ取得（Read）

Read は `features/xxx/useXxx.ts` に useQuery で定義し、BFF（`routes/api/`）へ直接 fetch する。
レスポンスは `entities/xxx/model/adapters.ts` で内部型に変換する。

```tsx
// src/features/search-product/useSearchProduct.ts
import { useQuery } from '@tanstack/react-query'
import { toProductList } from '#/entities/product/model/adapters'
import type { Product } from '#/entities/product/model/types'

export function useSearchProduct(query: string) {
  return useQuery<Product[]>({
    queryKey: ['products', query],
    queryFn: async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`BFF error: ${res.status}`)
      return toProductList(await res.json())
    },
  })
}
```

```tsx
// src/features/search-product/SearchProductInput.tsx
"use client"
import { useSearchProduct } from './useSearchProduct'

export function SearchProductInput() {
  const { data: products, isLoading } = useSearchProduct('pikachu')
  // ...
}
```

SSR プリフェッチが必要な場合は `app(routes)/` の loader で `prefetchQuery` を呼び出す。

---

## 書き込み（Mutation）

Mutation も `features/xxx/useXxx.ts` に定義し、BFF（`routes/api/`）へ直接 fetch する。

```tsx
// src/features/create-order/useCreateOrder.ts
import { toOrder } from '#/entities/order/model/adapters'

export function useCreateOrder() {
  const createOrder = async (data: { productId: number; quantity: number }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`BFF error: ${res.status}`)
    return toOrder(await res.json())
  }
  return { createOrder }
}
```

```tsx
// src/features/create-order/CreateOrderForm.tsx
"use client"
import { useCreateOrder } from './useCreateOrder'

export function CreateOrderForm() {
  const { createOrder } = useCreateOrder()
  const handleSubmit = async () => {
    await createOrder({ productId: 1, quantity: 2 })
  }
  // ...
}
```

---

## API ルート（server.handlers）

`createFileRoute` の `server.handlers` オプションで HTTP メソッドごとのハンドラを定義できる。
`src/routes/api/` 以下に配置したファイルが API エンドポイントとして機能する。

```ts
// src/routes/api/match.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/match')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { id_a: number; id_b: number }
        // ...処理...
        return Response.json(result)
      },
    },
  },
})
```

### 注意点

- `@tanstack/react-start/api` の `createAPIFileRoute` は **非推奨**（該当バージョンでは存在しない）
- ハンドラの引数 `request` は `Request` 型を明示するか、パラメータを分割代入せずそのまま使用する
- レスポンスは標準の `Response` / `Response.json()` を返す

---

## Provider

TanStack Start では `RouterProvider` 内に Provider をネストする。
`routes/__root.tsx` の `Outlet` をラップする形で配置する。

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Provider } from 'jotai'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <Provider>
      <Outlet />
    </Provider>
  )
}
```
