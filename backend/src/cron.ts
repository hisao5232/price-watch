import type { Bindings } from './types'
import { fetchItemByCode, isSale } from './rakuten'
import { sendDiscordNotification } from './discord'

// Cronトリガーから呼ばれるメイン処理
export async function handleCron(env: Bindings): Promise<void> {
  console.log('Cron開始:', new Date().toISOString())

  // is_active=1 の全商品を取得
  const { results: products } = await env.price_watch_db
    .prepare('SELECT * FROM products WHERE is_active = 1')
    .all()

  console.log(`追跡中の商品数: ${products.length}`)

  // 商品ごとに順番に処理（並列にするとAPIレート制限に引っかかるため直列で実行）
  for (const product of products) {
    await processProduct(product as any, env)

    // 楽天APIのレート制限対策：1秒待つ
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
  },
  env: Bindings
): Promise<void> {
  // 楽天APIから最新情報を取得
  const item = await fetchItemByCode(
    product.item_code,
    env.RAKUTEN_APP_ID,
    env.RAKUTEN_ACCESS_KEY
  )

  if (!item) {
    console.error(`商品取得失敗: ${product.item_code}`)
    return
  }

  const currentPrice = item.itemPrice
  const currentInStock = item.availability === 1 ? 1 : 0
  const currentIsSale = isSale(item) ? 1 : 0

  // 前回の価格履歴を取得
  const prev = await env.price_watch_db.prepare(`
    SELECT price, in_stock, is_sale
    FROM price_history
    WHERE product_id = ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `).bind(product.id).first() as {
    price: number
    in_stock: number
    is_sale: number
  } | null

  // 今回のスナップショットをD1に保存
  await env.price_watch_db.prepare(`
    INSERT INTO price_history (product_id, price, point_rate, in_stock, is_sale)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    product.id,
    currentPrice,
    item.pointRate,
    currentInStock,
    currentIsSale
  ).run()

  // Discord Webhookが設定されていない場合は通知をスキップ
  if (!env.DISCORD_WEBHOOK_URL) return

  // 前回データがない場合は通知しない（初回登録時）
  if (!prev) return

  // 変化を検知して通知
  const itemUrl = product.rakuten_url ?? item.itemUrl
  const imageUrl = product.image_url

  // ① 価格が下がった
  if (currentPrice < prev.price) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'price_drop',
      itemName: product.item_name,
      itemUrl,
      imageUrl,
      currentPrice,
      previousPrice: prev.price,
      pointRate: item.pointRate,
    })

    // 通知ログを保存
    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'price_drop', ?)
    `).bind(
      product.id,
      `¥${prev.price} → ¥${currentPrice}`
    ).run()
  }

  // ② alert_price以下になった（前回はalert_price超だった場合のみ通知）
  if (
    product.alert_price &&
    currentPrice <= product.alert_price &&
    prev.price > product.alert_price
  ) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'alert_price',
      itemName: product.item_name,
      itemUrl,
      imageUrl,
      currentPrice,
      alertPrice: product.alert_price,
      pointRate: item.pointRate,
    })
  }

  // ③ 在庫が復活した（前回在庫なし → 今回在庫あり）
  if (currentInStock === 1 && prev.in_stock === 0) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'back_in_stock',
      itemName: product.item_name,
      itemUrl,
      imageUrl,
      currentPrice,
      pointRate: item.pointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'back_in_stock', '在庫復活')
    `).bind(product.id).run()
  }

  // ④ セールが始まった（前回セールなし → 今回セールあり）
  if (currentIsSale === 1 && prev.is_sale === 0) {
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, {
      type: 'sale_started',
      itemName: product.item_name,
      itemUrl,
      imageUrl,
      currentPrice,
      pointRate: item.pointRate,
    })

    await env.price_watch_db.prepare(`
      INSERT INTO notifications (product_id, type, message)
      VALUES (?, 'sale', 'セール開始')
    `).bind(product.id).run()
  }
}

// 指定ミリ秒待機するユーティリティ
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
