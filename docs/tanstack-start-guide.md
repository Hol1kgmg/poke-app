# TanStack Start 実装ガイド

FSD アーキテクチャ（[layer-architecture-guide.md](./layer-architecture-guide.md)）を TanStack Start で実装する際の具体例。

---

## データ取得（Read）

`createFileRoute` の `loader` オプションがサーバーサイドのデータ取得に対応する。
Read serverFn は `entities/xxx/api/` に定義し、loader から呼び出す。
取得したデータは `useLoaderData` でコンポーネントから参照する。

```tsx
// src/entities/order/api/index.ts
import { createServerFn } from '@tanstack/react-start'

export const fetchOrdersFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const res = await fetch('http://bff/api/orders')
    if (!res.ok) throw new Error(`BFF error: ${res.status}`)
    return res.json()
  })
```

```tsx
// src/entities/order/model/adapters.ts
import type { BffOrderResponse, Order } from './types'

export function toOrder(raw: BffOrderResponse): Order {
  return {
    id: raw.order_id,
    status: raw.order_status,
    // ...
  }
}

export function toOrderList(rawList: BffOrderResponse[]): Order[] {
  return rawList.map(toOrder)
}
```

```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchUsersFn } from '@/entities/user/api'
import { fetchOrdersFn } from '@/entities/order/api'
import { toUserList } from '@/entities/user/model/adapters'
import { toOrderList } from '@/entities/order/model/adapters'
import { DashboardSummary } from '@/widgets/dashboard-summary/DashboardSummary'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [rawUsers, rawOrders] = await Promise.all([
      fetchUsersFn(),
      fetchOrdersFn(),
    ])
    return {
      users: toUserList(rawUsers),
      orders: toOrderList(rawOrders),
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { users, orders } = Route.useLoaderData()
  return <DashboardSummary users={users} orders={orders} />
}
```

---

## 書き込み（Mutation）— Server Functions

`createServerFn` で定義した関数はサーバー上でのみ実行され、クライアントから呼び出せる。
Mutation serverFn はその操作を所有する `features/xxx/serverFn.ts` に定義する。

```tsx
// src/features/create-order/serverFn.ts
import { createServerFn } from '@tanstack/react-start'

export const createOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { productId: number; quantity: number }) => data)
  .handler(async ({ data }) => {
    const res = await fetch('http://bff/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`BFF error: ${res.status}`)
    return res.json()
  })
```

```tsx
// src/features/create-order/CreateOrderForm.tsx
import { createOrderFn } from './serverFn'

export function CreateOrderForm() {
  const handleSubmit = async () => {
    await createOrderFn({ data: { productId: 1, quantity: 2 } })
  }
  // ...
}
```

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
