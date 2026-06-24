import { Hono } from 'hono'

// 環境変数の型定義
// .dev.vars と wrangler.jsonc の両方に対応する
type Bindings = {
  price_watch_db: D1Database
  RAKUTEN_APP_ID: string    // UUID形式のアプリID
  RAKUTEN_ACCESS_KEY: string // pk_で始まるアクセスキー
}

const app = new Hono<{ Bindings: Bindings }>()

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'price-watch API is running' })
})

// 楽天API疎通確認用（開発完了後に削除）
app.get('/test-rakuten', async (c) => {
  const itemCode = c.req.query('itemCode')

  if (!itemCode) {
    return c.json({ error: 'itemCode クエリパラメータが必要です' }, 400)
  }

  // 新しいエンドポイントに変更
  const url = new URL('https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401')
  url.searchParams.set('applicationId', c.env.RAKUTEN_APP_ID)
  url.searchParams.set('accessKey', c.env.RAKUTEN_ACCESS_KEY) // 新たに必要
  url.searchParams.set('itemCode', itemCode)
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  const data = await res.json() as any

  if (data.error) {
    return c.json({ error: data.error, description: data.error_description }, 500)
  }

  const item = data.Items?.[0]?.Item
  if (!item) {
    return c.json({ error: '商品が見つかりません' }, 404)
  }

  return c.json({
    itemCode: item.itemCode,
    itemName: item.itemName,
    price: item.itemPrice,
    inStock: item.availability === 1,
    pointRate: item.pointRate,
    imageUrl: item.smallImageUrls?.[0]?.imageUrl ?? null,
    url: item.itemUrl,
  })
})

export default app
