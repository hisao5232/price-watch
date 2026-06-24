// Cloudflare Workers のバインディング型定義
export type Bindings = {
  price_watch_db: D1Database
  RAKUTEN_APP_ID: string
  RAKUTEN_ACCESS_KEY: string
}

// 楽天APIのレスポンス型（必要なフィールドのみ）
export type RakutenItem = {
  itemCode: string
  itemName: string
  itemPrice: number
  availability: number    // 1=在庫あり 0=なし
  pointRate: number
  pointRateStartTime: string
  pointRateEndTime: string
  smallImageUrls: { imageUrl: string }[]
  itemUrl: string
}

export type RakutenSearchResponse = {
  count: number
  Items: { Item: RakutenItem }[]
  error?: string
  error_description?: string
}

// DBのproductsテーブルの型
export type Product = {
  id: number
  item_code: string
  shop_code: string
  item_name: string
  image_url: string | null
  rakuten_url: string | null
  category: string | null
  alert_price: number | null
  is_active: number           // 1=追跡中 0=停止
  created_at: string
  updated_at: string
}

// DBのprice_historyテーブルの型
export type PriceHistory = {
  id: number
  product_id: number
  price: number
  point_rate: number
  in_stock: number            // 1=在庫あり 0=なし
  is_sale: number             // 1=セール中 0=通常
  fetched_at: string
}
