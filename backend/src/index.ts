import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import products from './routes/products'
import { handleCron } from './cron'

const app = new Hono<{ Bindings: Bindings }>()

// CORSミドルウェアを追加（フロントエンドからのリクエストを許可）
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type'],
}))

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'price-watch API is running' })
})

// 商品関連ルート
app.route('/products', products)

// Cronトリガーのハンドラー
// wrangler.jsonc の crons で設定したスケジュールで自動実行される
export default {
  fetch: app.fetch,

  // scheduled はCronトリガーが発火したときに呼ばれる
  async scheduled(_event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext) {
    await handleCron(env)
  },
}
