// Discord Webhook で通知を送る

type NotificationType = 'price_drop' | 'back_in_stock' | 'sale_started' | 'alert_price'

type NotifyParams = {
  type: NotificationType
  itemName: string
  itemUrl: string
  imageUrl: string | null
  currentPrice: number
  previousPrice?: number
  alertPrice?: number
  pointRate?: number
}

// Discord Embed の色定義
const COLORS = {
  price_drop: 0x3498db,    // 青：値下がり
  back_in_stock: 0x2ecc71, // 緑：在庫復活
  sale_started: 0xe74c3c,  // 赤：セール開始
  alert_price: 0xf39c12,   // オレンジ：目標価格以下
}

// 通知タイトルの定義
const TITLES = {
  price_drop: '📉 価格が下がりました',
  back_in_stock: '✅ 在庫が復活しました',
  sale_started: '🔥 セールが始まりました',
  alert_price: '🎯 目標価格以下になりました',
}

export async function sendDiscordNotification(
  webhookUrl: string,
  params: NotifyParams
): Promise<void> {
  const { type, itemName, itemUrl, imageUrl, currentPrice, previousPrice, alertPrice, pointRate } = params

  // 説明文を組み立てる
  const descriptionLines: string[] = []

  if (previousPrice && type === 'price_drop') {
    const diff = previousPrice - currentPrice
    const percent = Math.round((diff / previousPrice) * 100)
    descriptionLines.push(`~~¥${previousPrice.toLocaleString()}~~ → **¥${currentPrice.toLocaleString()}**`)
    descriptionLines.push(`**¥${diff.toLocaleString()}** (${percent}%) 値下がり`)
  } else {
    descriptionLines.push(`現在価格: **¥${currentPrice.toLocaleString()}**`)
  }

  if (alertPrice) {
    descriptionLines.push(`目標価格: ¥${alertPrice.toLocaleString()}`)
  }

  if (pointRate && pointRate > 1) {
    descriptionLines.push(`ポイント: **${pointRate}倍**`)
  }

  // Discord Embed 形式で送信
  const payload = {
    embeds: [
      {
        title: TITLES[type],
        description: descriptionLines.join('\n'),
        url: itemUrl,
        color: COLORS[type],
        author: {
          name: itemName,
          url: itemUrl,
        },
        thumbnail: imageUrl ? { url: imageUrl } : undefined,
        footer: {
          text: 'price-watch',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error('Discord通知の送信に失敗しました:', res.status, await res.text())
  }
}
