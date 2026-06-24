import { Hono } from 'hono'
import type { Bindings } from './types'
import products from './routes/products'
import { handleCron } from './cron'

const app = new Hono<{ Bindings: Bindings }>()

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'price-watch API is running' })
})

// Discord通知テスト用（確認後削除）
app.get('/test-discord', async (c) => {
  if (!c.env.DISCORD_WEBHOOK_URL) {
    return c.json({ error: 'DISCORD_WEBHOOK_URL が設定されていません' }, 500)
  }

  const { sendDiscordNotification } = await import('./discord')

  await sendDiscordNotification(c.env.DISCORD_WEBHOOK_URL, {
    type: 'price_drop',
    itemName: 'テスト商品',
    itemUrl: 'https://item.rakuten.co.jp/',
    imageUrl: null,
    currentPrice: 4800,
    previousPrice: 5291,
    pointRate: 5,
  })

  return c.json({ message: 'Discord通知を送信しました' })
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
