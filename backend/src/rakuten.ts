import type { RakutenItem, RakutenSearchResponse } from './types'

// 楽天APIの設定
const RAKUTEN_API_BASE = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401'

// itemCodeで商品を1件取得する
export async function fetchItemByCode(
  itemCode: string,
  appId: string,
  accessKey: string
): Promise<RakutenItem | null> {
  const url = new URL(RAKUTEN_API_BASE)
  url.searchParams.set('applicationId', appId)
  url.searchParams.set('accessKey', accessKey)
  url.searchParams.set('itemCode', itemCode)
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  const data = await res.json() as RakutenSearchResponse

  if (data.error) {
    console.error('Rakuten API error:', data.error, data.error_description)
    return null
  }

  return data.Items?.[0]?.Item ?? null
}

// 商品URLからitemCodeを検索する
// 楽天URLの末尾の数字はJANコードなのでkeyword検索で解決する
export async function searchItemByUrl(
  rakutenUrl: string,
  appId: string,
  accessKey: string
): Promise<RakutenItem | null> {
  // URLからショップコードとJANコードを抽出
  // 例: https://item.rakuten.co.jp/alpen/8205102144/
  const match = rakutenUrl.match(/item\.rakuten\.co\.jp\/([^/]+)\/([^/]+)/)
  if (!match) return null

  const shopCode = match[1]  // alpen
  const janCode = match[2]   // 8205102144

  const url = new URL(RAKUTEN_API_BASE)
  url.searchParams.set('applicationId', appId)
  url.searchParams.set('accessKey', accessKey)
  url.searchParams.set('keyword', janCode)   // JANコードでキーワード検索
  url.searchParams.set('shopCode', shopCode) // ショップを絞り込む
  url.searchParams.set('hits', '1')          // 1件だけ取得
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  const data = await res.json() as RakutenSearchResponse

  if (data.error || !data.Items?.length) return null

  return data.Items[0].Item
}

// ポイント倍率からセール判定する
// pointRateが1より大きい、またはポイントアップ期間中ならセールとみなす
export function isSale(item: RakutenItem): boolean {
  if (item.pointRate > 1) return true

  // ポイントアップ期間が設定されている場合
  if (item.pointRateStartTime && item.pointRateEndTime) {
    const now = new Date()
    const start = new Date(item.pointRateStartTime)
    const end = new Date(item.pointRateEndTime)
    return now >= start && now <= end
  }

  return false
}
