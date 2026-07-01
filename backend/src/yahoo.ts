import type { YahooItem, YahooSearchResponse } from './types'

const YAHOO_API_BASE = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'

// Yahoo!商品URLから商品を検索する
export async function searchYahooItemByUrl(
  yahooUrl: string,
  clientId: string
): Promise<YahooItem | null> {
  // クエリパラメータと.html、末尾スラッシュを除去
  const cleanUrl = yahooUrl
    .split('?')[0]
    .replace(/\.html$/, '')
    .replace(/\/$/, '')  // 末尾のスラッシュを削除

  const match = cleanUrl.match(/store\.shopping\.yahoo\.co\.jp\/([^/]+)\/([^/]+)$/)
  if (!match) {
    console.error('Yahoo URL parse failed:', cleanUrl)
    return null
  }

  const sellerId = match[1]
  const productCode = match[2]

  const url = new URL(YAHOO_API_BASE)
  url.searchParams.set('appid', clientId)
  url.searchParams.set('query', productCode)
  url.searchParams.set('seller_id', sellerId)
  url.searchParams.set('results', '1')

  const res = await fetch(url.toString())
  const data = await res.json() as YahooSearchResponse

  if (!data.hits?.length) {
    console.error('Yahoo item not found:', sellerId, productCode)
    return null
  }

  return data.hits[0]
}

// codeからYahoo!商品を1件取得する（再取得用）
export async function fetchYahooItemByCode(
  code: string,
  clientId: string
): Promise<YahooItem | null> {
  // codeは "sellerId_productCode" 形式なので分解する
  const underscoreIndex = code.indexOf('_')
  const sellerId = code.substring(0, underscoreIndex)
  const productCode = code.substring(underscoreIndex + 1)

  const url = new URL(YAHOO_API_BASE)
  url.searchParams.set('appid', clientId)
  url.searchParams.set('query', productCode)
  url.searchParams.set('seller_id', sellerId)
  url.searchParams.set('results', '1')

  const res = await fetch(url.toString())
  const data = await res.json() as YahooSearchResponse

  return data.hits?.[0] ?? null
}

// ポイント倍率を取得する
export function getYahooPointRate(item: YahooItem): number {
  return item.point?.lyLimitedBonusTimes ?? 1
}

// セール判定（割引率があればセール中）
export function isYahooSale(item: YahooItem): boolean {
  if (item.premiumDiscountRate && item.premiumDiscountRate > 0) return true
  if (item.priceLabel?.fixedPrice && item.priceLabel.fixedPrice > item.price) return true
  return false
}
