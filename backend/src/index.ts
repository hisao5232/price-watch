import { Hono } from 'hono'
import type { Bindings } from './types'
import products from './routes/products'

const app = new Hono<{ Bindings: Bindings }>()

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'price-watch API is running' })
})

// 商品関連ルート
app.route('/products', products)

export default app
