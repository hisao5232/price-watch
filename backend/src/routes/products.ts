import { Hono } from 'hono'
import type { Bindings } from '../types'
import { fetchItemByCode, searchItemByUrl, isSale } from '../rakuten'
import { fetchYahooItemByCode,searchYahooItemByUrl, getYahooPointRate, isYahooSale } from '../yahoo'

const products = new Hono<{ Bindings: Bindings }>()

// GET /products
// 登録済み商品一覧を返す（最新価格も含む）
products.get('/', async (c) => {
  const db = c.env.price_watch_db

  // productsと最新のprice_historyをJOINして取得
  const { results } = await db.prepare(`
    SELECT
      p.*,
      ph.price,
      ph.in_stock,
      ph.is_sale,
      ph.point_rate,
      ph.fetched_at
    FROM products p
    LEFT JOIN price_history ph ON ph.id = (
      SELECT id FROM price_history
      WHERE product_id = p.id
      ORDER BY fetched_at DESC
      LIMIT 1
    )
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC
  `).all()

  return c.json(results)
})

// POST /products
// 商品URLを受け取り、楽天APIでitemCodeを解決してDBに保存する
products.post('/', async (c) => {
  const body = await c.req.json<{
    rakutenUrl: string
    yahooUrl?: string
    category?: string
    alertPrice?: number
  }>()

  // URLの種類を判定
  const isYahoo = !!body.yahooUrl || body.rakutenUrl?.includes('store.shopping.yahoo.co.jp')
  const inputUrl = body.yahooUrl ?? body.rakutenUrl

  if (!inputUrl) {
    return c.json({ error: 'URLは必須です' }, 400)
  }

  let itemCode: string
  let shopCode: string
  let itemName: string
  let imageUrl: string | null
  let itemUrl: string
  let price: number
  let inStock: number
  let pointRate: number
  let isSaleFlag: number
  let source: string // 'rakuten' or 'yahoo'

  if (isYahoo) {
    const item = await searchYahooItemByUrl(inputUrl, c.env.YAHOO_SEARCH_CLIENT_ID)
    if (!item) return c.json({ error: '商品が見つかりませんでした' }, 404)

    itemCode = item.code
    shopCode = item.seller.sellerId
    itemName = item.name
    imageUrl = item.image?.medium ?? null
    itemUrl = item.url
    price = item.price
    inStock = item.inStock ? 1 : 0
    pointRate = getYahooPointRate(item)
    isSaleFlag = isYahooSale(item) ? 1 : 0  // ← 修正
    source = 'yahoo'
  }
   else {
    // 楽天の場合
    const item = await searchItemByUrl(inputUrl, c.env.RAKUTEN_APP_ID, c.env.RAKUTEN_ACCESS_KEY)
    if (!item) return c.json({ error: '商品が見つかりませんでした' }, 404)

    itemCode = item.itemCode
    shopCode = item.itemCode.split(':')[0]
    itemName = item.itemName
    imageUrl = item.smallImageUrls?.[0]?.imageUrl ?? null
    itemUrl = item.itemUrl
    price = item.itemPrice
    inStock = item.availability === 1 ? 1 : 0
    pointRate = item.pointRate
    isSaleFlag = isSale(item) ? 1 : 0
    source = 'rakuten'
  }

  // 既に登録済みかチェック
  const existing = await c.env.price_watch_db
    .prepare('SELECT id FROM products WHERE item_code = ?')
    .bind(itemCode)
    .first()

  if (existing) {
    return c.json({ error: 'この商品は既に登録されています' }, 409)
  }

  // productsテーブルに保存（sourceカラムが必要）
  const { meta } = await c.env.price_watch_db.prepare(`
    INSERT INTO products (item_code, shop_code, item_name, image_url, rakuten_url, category, alert_price, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    itemCode,
    shopCode,
    itemName,
    imageUrl,
    itemUrl,
    body.category ?? null,
    body.alertPrice ?? null,
    source
  ).run()

  const productId = meta.last_row_id

  // 最初のスナップショット保存
  await c.env.price_watch_db.prepare(`
    INSERT INTO price_history (product_id, price, point_rate, in_stock, is_sale)
    VALUES (?, ?, ?, ?, ?)
  `).bind(productId, price, pointRate, inStock, isSaleFlag).run()

  return c.json({
    id: productId,
    itemCode,
    itemName,
    price,
    inStock: inStock === 1,
    source,
    message: '商品を登録しました',
  }, 201)
})

// GET /products/:id
products.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.price_watch_db
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  if (!product) return c.json({ error: '商品が見つかりません' }, 404)
  const { results: history } = await db.prepare(`
    SELECT price, point_rate, in_stock, is_sale, fetched_at
    FROM price_history
    WHERE product_id = ?
    ORDER BY fetched_at DESC
    LIMIT 30
  `).bind(id).all()
  return c.json({ product, history })
})

// DELETE /products/:id
products.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const product = await c.env.price_watch_db
    .prepare('SELECT id FROM products WHERE id = ?').bind(id).first()
  if (!product) return c.json({ error: '商品が見つかりません' }, 404)
  await c.env.price_watch_db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return c.json({ message: '商品を削除しました' })
})

// PATCH /products/:id
products.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{
    alertPrice?: number
    category?: string
    isActive?: boolean
  }>()
  const product = await c.env.price_watch_db
    .prepare('SELECT id FROM products WHERE id = ?').bind(id).first()
  if (!product) return c.json({ error: '商品が見つかりません' }, 404)
  await c.env.price_watch_db.prepare(`
    UPDATE products
    SET
      alert_price = COALESCE(?, alert_price),
      category = COALESCE(?, category),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.alertPrice ?? null,
    body.category ?? null,
    body.isActive !== undefined ? (body.isActive ? 1 : 0) : null,
    id
  ).run()
  return c.json({ message: '更新しました' })
})

export default products
