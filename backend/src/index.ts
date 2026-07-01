import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import products from './routes/products'
import { handleCron } from './cron'

const app = new Hono<{ Bindings: Bindings }>()

// CORSミドルウェアを追加（フロントエンドからのリクエストを許可）
app.use('*', cors({
  origin: (origin) => {
    // 許可するオリジンのリスト
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://price-watch-lovat.vercel.app',
    ]

    if (allowedOrigins.includes(origin)) return origin
    if (origin?.endsWith('.vercel.app')) return origin  // Vercelプレビューも許可

    return null  // それ以外は拒否
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type'],
}))

// Yahoo!レスポンス確認用（確認後削除）
app.get('/test-yahoo-full', async (c) => {
  const clientId = c.env.YAHOO_SEARCH_CLIENT_ID

  const url = new URL('https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch')
  url.searchParams.set('appid', clientId)
  url.searchParams.set('query', '1103a112-001')
  url.searchParams.set('seller_id', 'sports-box')
  url.searchParams.set('results', '1')

  const res = await fetch(url.toString())
  const data = await res.json() as any

  // レスポンス全体をそのまま返す
  return c.json(data)
})

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
