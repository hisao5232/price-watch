import type { Bindings } from './types'
import { fetchItemByCode } from './rakuten'
import { fetchYahooItemByCode, getYahooPointRate, isYahooSale } from './yahoo'
import { sendDiscordNotification } from './discord'

export async function handleCron(env: Bindings): Promise<void> {
  console.log('Cron開始:', new Date().toISOString())

  const { results: products } = await env.price_watch_db
    .prepare('SELECT * FROM products WHERE is_active = 1')
    .all()

  console.log(`追跡中の商品数: ${products.length}`)

  for (const product of products) {
    await processProduct(product as any, env)
    await sleep(1000)
  }

  console.log('Cron完了:', new Date().toISOString())
}

async function processProduct(
  product: {
    id: number
    item_code: string
    item_name: string
    image_url: string | null
    rakuten_url: string | null
    alert_price: number | null
    source: string
  },
  env: Bindings
): Promise<void> {
  let currentPrice: number
  let currentInStock: number
  let currentPointRate: number
  let currentIsSale: number
  let itemUrl: string

  // ソースによって楽天APIかYahoo!APIかを切り替える
  if (product.source === 'yahoo') {
    const item = await fetchYahooItemByCode(product.item_code, env.YAHOO_SEARCH_CLIENT_ID)
    if (!item) {
      console.error(`Yahoo商品取得失敗: ${product.item_code}`)
      return
    }
    currentPrice = item.price
    currentInStock = item.inStock ? 1 : 0
    currentPointRate = getYahooPointRate(item)
    currentIsSale = isYahooSale(item) ? 1 : 0
    itemUrl = item.url
  } else {
    const item = await fetchItemByCode(product.item_code, env.RAKUTEN_APP_ID, env.RAKUTEN_ACCESS_KEY)
    if (!item) {
      console.error(`楽天商品取得失敗: ${product.item_code}`)
      return
    }
    currentPrice = item.itemPrice
    currentInStock = item.availability === 1 ? 1 : 0
    currentPointRate = item.pointRate
    currentIsSale = currentPointRate > 1 ? 1 : 0
    itemUrl = item.itemUrl
  }

  const prev = await env.price_watch_db.prepare(`
    SELECT price, in_stock, is_sale, point_rate
    FROM price_history
    WHERE product_id = ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `).bind(product.id).first() as {
    price: number
    in_stock: number
    is_sale: number
    point_rate: number
  } | null

  await env.price_watch_db.prepare(`
    INSERT INTO price_history (product_id, price, point_rate, in_stock, is_sale)
    VALUES (?, ?, ?, ?, ?)
  `).bind(product.id, currentPrice, currentPointRate, currentInStock, currentIsSale).run()

  if (!env.DISCORD_WEBHOOK_URL) return
  if (!prev) return

  const finalUrl = product.rakuten_url ?? itemUrl
  const imageUrl = product.image_url

  // ① 価格が下がった
  if (currentPrice < prev.price) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'price_drop',
      itemName: product.item_name,
      itemUrl: finalUrl,
      imageUrl,
      currentPrice,
      previousPrice: prev.price,
      pointRate: currentPointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'price_drop', ?)
    `).bind(product.id, `¥${prev.price} → ¥${currentPrice}`).run()
  }

  // ② ポイント還元が増えた
  if (currentPointRate > prev.point_rate) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'sale_started',
      itemName: product.item_name,
      itemUrl: finalUrl,
      imageUrl,
      currentPrice,
      pointRate: currentPointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'point_up', ?)
    `).bind(product.id, `P${prev.point_rate}倍 → P${currentPointRate}倍`).run()
  }

  // ③ alert_price以下になった
  if (
    product.alert_price &&
    currentPrice <= product.alert_price &&
    prev.price > product.alert_price
  ) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'alert_price',
      itemName: product.item_name,
      itemUrl: finalUrl,
      imageUrl,
      currentPrice,
      alertPrice: product.alert_price,
      pointRate: currentPointRate,
    })
  }

  // ④ 在庫が復活した
  if (currentInStock === 1 && prev.in_stock === 0) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'back_in_stock',
      itemName: product.item_name,
      itemUrl: finalUrl,
      imageUrl,
      currentPrice,
      pointRate: currentPointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'back_in_stock', '在庫復活')
    `).bind(product.id).run()
  }

  // ⑤ 在庫がなくなった
  if (currentInStock === 0 && prev.in_stock === 1) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'out_of_stock',
      itemName: product.item_name,
      itemUrl: finalUrl,
      imageUrl,
      currentPrice,
      pointRate: currentPointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'out_of_stock', '在庫切れ')
    `).bind(product.id).run()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
